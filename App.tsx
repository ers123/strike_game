/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/


import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { Loader, useProgress } from '@react-three/drei';
import { GameStatus, NoteData } from './types';
import { DEMO_CHART, SONG_URL, SONG_BPM } from './constants';
import { useMediaPipe, BodyMovement } from './hooks/useMediaPipe';
import GameScene from './components/GameScene';
import WebcamPreview from './components/WebcamPreview';
import TutorialModal from './components/TutorialModal';
import { Play, RefreshCw, VideoOff, Hand, Sparkles, Zap, Shield, Wind, Star, HelpCircle } from 'lucide-react';

export type PowerUp = {
  type: BodyMovement;
  active: boolean;
  duration: number;
  activatedAt: number;
};

const App: React.FC = () => {
  const [gameStatus, setGameStatus] = useState<GameStatus>(GameStatus.LOADING);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [multiplier, setMultiplier] = useState(1);
  const [health, setHealth] = useState(100);
  const [activePowerUp, setActivePowerUp] = useState<BodyMovement>(null);
  const [powerUpTimeLeft, setPowerUpTimeLeft] = useState(0);
  const [shieldActive, setShieldActive] = useState(false);
  const [shieldCharges, setShieldCharges] = useState(0);
  const [showTutorial, setShowTutorial] = useState(false);

  const audioRef = useRef<HTMLAudioElement>(new Audio(SONG_URL));
  const videoRef = useRef<HTMLVideoElement>(null);
  const lastProcessedMovementRef = useRef<number>(0);

  // Now getting pose data from the hook
  const { isCameraReady, handPositionsRef, poseDataRef, lastResultsRef, lastPoseResultsRef, error: cameraError } = useMediaPipe(videoRef);
  const { progress } = useProgress(); 

  // Game Logic Handlers
  const handleNoteHit = useCallback((note: NoteData, goodCut: boolean) => {
     let points = 100;
     if (goodCut) points += 50; 

     // Haptic feedback for impact
     if (navigator.vibrate) {
         navigator.vibrate(goodCut ? 40 : 20);
     }

     setCombo(c => {
       const newCombo = c + 1;
       if (newCombo > 30) setMultiplier(8);
       else if (newCombo > 20) setMultiplier(4);
       else if (newCombo > 10) setMultiplier(2);
       else setMultiplier(1);
       return newCombo;
     });

     setScore(s => s + (points * multiplier));
     setHealth(h => Math.min(100, h + 2));
  }, [multiplier]);

  const handleNoteMiss = useCallback((note: NoteData) => {
      // Check if shield is active
      if (shieldActive && shieldCharges > 0) {
          setShieldCharges(c => {
              const newCharges = c - 1;
              if (newCharges === 0) {
                  setShieldActive(false);
                  if (activePowerUp === 'shield') {
                      setActivePowerUp(null);
                      setPowerUpTimeLeft(0);
                  }
              }
              return newCharges;
          });
          // Shield absorbed the hit - no health loss!
          if (navigator.vibrate) {
              navigator.vibrate(100);
          }
          return;
      }

      setCombo(0);
      setMultiplier(1);
      setHealth(h => {
          const newHealth = h - 15;
          if (newHealth <= 0) {
             setTimeout(() => endGame(false), 0);
             return 0;
          }
          return newHealth;
      });
  }, [shieldActive, shieldCharges, activePowerUp]);

  const startGame = async () => {
    if (!isCameraReady) return;

    setScore(0);
    setCombo(0);
    setMultiplier(1);
    setHealth(100);
    setActivePowerUp(null);
    setPowerUpTimeLeft(0);
    setShieldActive(false);
    setShieldCharges(0);

    DEMO_CHART.forEach(n => { n.hit = false; n.missed = false; });

    try {
      if (audioRef.current) {
          audioRef.current.currentTime = 0;
          await audioRef.current.play();
          setGameStatus(GameStatus.PLAYING);
      }
    } catch (e) {
        console.error("Audio play failed", e);
        alert("Could not start audio. Please interact with the page first.");
    }
  };

  const endGame = (victory: boolean) => {
      setGameStatus(victory ? GameStatus.VICTORY : GameStatus.GAME_OVER);
      if (audioRef.current) {
          audioRef.current.pause();
      }
  };

  useEffect(() => {
      if (gameStatus === GameStatus.LOADING && isCameraReady) {
          setGameStatus(GameStatus.IDLE);
      }
  }, [isCameraReady, gameStatus]);

  // Monitor for body movements and activate power-ups
  useEffect(() => {
      if (gameStatus !== GameStatus.PLAYING) return;

      const interval = setInterval(() => {
          const detectedMovement = poseDataRef.current.detectedMovement;
          const cooldown = poseDataRef.current.movementCooldown;

          // Only process if there's a new movement detection
          if (detectedMovement && cooldown > 0 && Date.now() - lastProcessedMovementRef.current > 500) {
              lastProcessedMovementRef.current = Date.now();

              // Haptic feedback
              if (navigator.vibrate) {
                  navigator.vibrate([50, 30, 50]);
              }

              switch (detectedMovement) {
                  case 'lightning':
                      // Lightning Spell = Clears all creatures on screen
                      setActivePowerUp('lightning');
                      setPowerUpTimeLeft(1); // Instant effect
                      setScore(s => s + 500); // Bonus points
                      break;

                  case 'shield':
                      // Shield Spell = Protects from 3 attacks
                      setShieldActive(true);
                      setShieldCharges(3);
                      setActivePowerUp('shield');
                      setPowerUpTimeLeft(5); // Visual effect duration
                      break;

                  case 'tornado':
                      // Tornado Spell = Auto-defeat creatures in radius
                      setActivePowerUp('tornado');
                      setPowerUpTimeLeft(5); // 5 seconds
                      break;

                  case 'freeze':
                      // Freeze Spell = Slow time and boost power
                      setActivePowerUp('freeze');
                      setPowerUpTimeLeft(8); // 8 seconds
                      setMultiplier(m => m * 2); // Double current multiplier
                      setScore(s => s + 200); // Instant bonus
                      break;
              }

              // Clear the detected movement
              poseDataRef.current.detectedMovement = null;
          }

          // Countdown active power-up
          if (powerUpTimeLeft > 0) {
              setPowerUpTimeLeft(t => {
                  const newTime = Math.max(0, t - 0.1);
                  if (newTime === 0) {
                      setActivePowerUp(null);
                      // Reset multiplier if freeze spell is ending
                      if (activePowerUp === 'freeze') {
                          setMultiplier(m => Math.max(1, m / 2));
                      }
                  }
                  return newTime;
              });
          }
      }, 100); // Check every 100ms

      return () => clearInterval(interval);
  }, [gameStatus, powerUpTimeLeft, activePowerUp, poseDataRef]);

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden font-sans">
      {/* Hidden Video for Processing */}
      <video 
        ref={videoRef} 
        className="absolute opacity-0 pointer-events-none"
        playsInline
        muted
        autoPlay
        style={{ width: '640px', height: '480px' }}
      />

      {/* 3D Canvas */}
      <Canvas shadows dpr={[1, 2]}>
          {gameStatus !== GameStatus.LOADING && (
             <GameScene
                gameStatus={gameStatus}
                audioRef={audioRef}
                handPositionsRef={handPositionsRef}
                chart={DEMO_CHART}
                onNoteHit={handleNoteHit}
                onNoteMiss={handleNoteMiss}
                onSongEnd={() => endGame(true)}
                activePowerUp={activePowerUp}
                shieldActive={shieldActive}
             />
          )}
      </Canvas>

      {/* Webcam Mini-Map Preview */}
      <WebcamPreview 
          videoRef={videoRef} 
          resultsRef={lastResultsRef} 
          isCameraReady={isCameraReady} 
      />

      {/* UI Overlay */}
      <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-6 z-10">
          
          {/* HUD (Top) */}
          <div className="flex justify-between items-start text-white w-full">
             {/* Health Bar */}
             <div className="w-1/3 max-w-xs">
                 <div className="h-4 bg-gray-800 rounded-full overflow-hidden border-2 border-gray-700">
                     <div 
                        className={`h-full transition-all duration-300 ease-out ${health > 50 ? 'bg-green-500' : health > 20 ? 'bg-yellow-500' : 'bg-red-600'}`}
                        style={{ width: `${health}%` }}
                     />
                 </div>
                 <p className="text-xs mt-1 opacity-70">System Integrity</p>
             </div>

             {/* Score & Combo */}
             <div className="text-center">
                 <h1 className="text-5xl font-bold tracking-wider drop-shadow-[0_0_10px_rgba(59,130,246,0.8)]">
                     {score.toLocaleString()}
                 </h1>
                 <div className="mt-2 flex flex-col items-center">
                     <p className={`text-2xl font-bold ${combo > 10 ? 'text-blue-400 scale-110' : 'text-gray-300'} transition-all`}>
                         {combo}x COMBO
                     </p>
                     {multiplier > 1 && (
                         <span className="text-sm px-2 py-1 bg-blue-900 rounded-full mt-1 animate-pulse">
                             {multiplier}x Multiplier!
                         </span>
                     )}
                 </div>
             </div>

             {/* Active Power-Up & Shield Status */}
             <div className="w-1/3 flex flex-col items-end gap-2">
                 {shieldActive && shieldCharges > 0 && (
                     <div className="flex items-center gap-2 bg-cyan-900/80 px-4 py-2 rounded-full border-2 border-cyan-400 animate-pulse">
                         <Shield className="w-6 h-6 text-cyan-300" />
                         <span className="text-cyan-100 font-bold">Shield x{shieldCharges}</span>
                     </div>
                 )}
                 {activePowerUp && activePowerUp !== 'shield' && (
                     <div className={`flex items-center gap-2 px-4 py-2 rounded-full border-2 ${
                         activePowerUp === 'lightning' ? 'bg-yellow-900/80 border-yellow-400' :
                         activePowerUp === 'tornado' ? 'bg-purple-900/80 border-purple-400' :
                         activePowerUp === 'freeze' ? 'bg-blue-900/80 border-blue-400' :
                         'bg-gray-900/80 border-gray-400'
                     } animate-pulse`}>
                         {activePowerUp === 'lightning' && <Zap className="w-6 h-6 text-yellow-300" />}
                         {activePowerUp === 'tornado' && <Wind className="w-6 h-6 text-purple-300" />}
                         {activePowerUp === 'freeze' && <Star className="w-6 h-6 text-blue-300" />}
                         <span className="text-white font-bold">
                             {activePowerUp === 'lightning' && 'LIGHTNING!'}
                             {activePowerUp === 'tornado' && 'TORNADO!'}
                             {activePowerUp === 'freeze' && 'FREEZE!'}
                         </span>
                         <span className="text-xs text-gray-300">{powerUpTimeLeft.toFixed(1)}s</span>
                     </div>
                 )}
             </div>
          </div>

          {/* Menus (Centered) */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-auto">
              
              {gameStatus === GameStatus.LOADING && (
                  <div className="bg-black/80 p-10 rounded-2xl flex flex-col items-center border border-purple-900/50 backdrop-blur-md">
                      <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-purple-500 mb-6"></div>
                      <h2 className="text-2xl text-white font-bold mb-2">🔮 Preparing Spell Chamber...</h2>
                      <p className="text-purple-300">{!isCameraReady ? "Awaiting magical vision..." : "Loading spellbook..."}</p>
                      {cameraError && <p className="text-red-500 mt-4 max-w-xs text-center">{cameraError}</p>}
                  </div>
              )}

              {gameStatus === GameStatus.IDLE && (
                  <div className="bg-black/80 p-12 rounded-3xl text-center border-2 border-purple-500/30 backdrop-blur-xl max-w-lg">
                      <div className="mb-6 flex justify-center">
                         <Sparkles className="w-16 h-16 text-purple-400" />
                      </div>
                      <h1 className="text-6xl font-black text-white mb-3 tracking-tighter drop-shadow-[0_0_30px_rgba(168,85,247,0.6)]">
                          SPELL SLINGER
                      </h1>
                      <h2 className="text-4xl font-bold text-purple-400 mb-6 italic drop-shadow-[0_0_20px_rgba(168,85,247,0.6)]">
                          Academy
                      </h2>
                      <div className="space-y-3 text-gray-300 mb-8">
                          <p className="flex items-center justify-center gap-2">
                              <Hand className="w-5 h-5 text-purple-400" />
                              <span>Stand back so your whole body is visible.</span>
                          </p>
                          <p>Use your <span className="text-red-500 font-bold">LEFT</span> and <span className="text-blue-500 font-bold">RIGHT</span> hands to cast spells!</p>

                          <div className="border-t border-gray-700 pt-3 mt-3">
                              <p className="text-purple-400 font-bold mb-2">🔮 Master These Spells:</p>
                              <div className="text-sm space-y-1">
                                  <p className="flex items-center gap-2">
                                      <Zap className="w-4 h-4 text-yellow-400" />
                                      <span><span className="font-bold">Jump</span> = Lightning Bolt (clears all!)</span>
                                  </p>
                                  <p className="flex items-center gap-2">
                                      <Shield className="w-4 h-4 text-cyan-400" />
                                      <span><span className="font-bold">Squat</span> = Shield Ward (3 blocks)</span>
                                  </p>
                                  <p className="flex items-center gap-2">
                                      <Wind className="w-4 h-4 text-purple-400" />
                                      <span><span className="font-bold">Spin</span> = Tornado Spell (auto-defeat!)</span>
                                  </p>
                                  <p className="flex items-center gap-2">
                                      <Star className="w-4 h-4 text-blue-400" />
                                      <span><span className="font-bold">Freeze</span> = Ice Blast (mega power!)</span>
                                  </p>
                              </div>
                          </div>
                      </div>

                      {!isCameraReady ? (
                           <div className="flex items-center justify-center text-red-400 gap-2 bg-red-900/20 p-4 rounded-lg">
                               <VideoOff /> Camera not ready yet.
                           </div>
                      ) : (
                          <div className="flex flex-col items-center gap-3">
                              <button
                                  onClick={startGame}
                                  className="bg-purple-600 hover:bg-purple-500 text-white text-xl font-bold py-4 px-12 rounded-full transition-all transform hover:scale-105 hover:shadow-[0_0_30px_rgba(168,85,247,0.6)] flex items-center justify-center gap-3"
                              >
                                  <Sparkles fill="currentColor" /> BEGIN TRAINING
                              </button>
                              <button
                                  onClick={() => setShowTutorial(true)}
                                  className="bg-white/10 hover:bg-white/20 text-white text-sm font-semibold py-2 px-6 rounded-full transition-all flex items-center gap-2"
                              >
                                  <HelpCircle className="w-4 h-4" /> Spell Guide
                              </button>
                          </div>
                      )}

                      <div className="text-white/30 text-sm text-center mt-8">
                           Created by <a href="https://x.com/ammaar" target="_blank" rel="noopener noreferrer" className="hover:text-blue-400 transition-colors underline decoration-blue-400/30">@ammaar</a>
                      </div>
                  </div>
              )}

              {(gameStatus === GameStatus.GAME_OVER || gameStatus === GameStatus.VICTORY) && (
                  <div className="bg-black/90 p-12 rounded-3xl text-center border-2 border-purple-500/30 backdrop-blur-xl">
                      <h2 className={`text-6xl font-bold mb-4 ${gameStatus === GameStatus.VICTORY ? 'text-purple-400' : 'text-orange-500'}`}>
                          {gameStatus === GameStatus.VICTORY ? "🎓 APPRENTICE GRADUATED!" : "⚠️ TRAINING INCOMPLETE"}
                      </h2>
                      <p className="text-white text-3xl mb-4">Magical Power: {score.toLocaleString()}</p>
                      <p className="text-gray-300 text-lg mb-8">{gameStatus === GameStatus.VICTORY ? "You've mastered the spells!" : "Keep practicing, young wizard!"}</p>
                      <button
                          onClick={() => setGameStatus(GameStatus.IDLE)}
                          className="bg-purple-600 hover:bg-purple-500 text-white text-xl py-3 px-8 rounded-full flex items-center justify-center mx-auto gap-2 transition-colors"
                      >
                          <RefreshCw /> Train Again
                      </button>
                  </div>
              )}
          </div>
      </div>

      {/* Tutorial Modal */}
      <TutorialModal isOpen={showTutorial} onClose={() => setShowTutorial(false)} />
    </div>
  );
};

export default App;
