/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { Loader, useProgress } from '@react-three/drei';
import { GameStatus, NoteData } from './types';
import { generateLevelChart, SONG_URL } from './constants';
import { useMediaPipe, BodyMovement } from './hooks/useMediaPipe';
import GameScene from './components/GameScene';
import WebcamPreview from './components/WebcamPreview';
import TutorialModal from './components/TutorialModal';
import LevelSelect from './components/LevelSelect';
import LevelComplete from './components/LevelComplete';
import {
  PlayerData,
  loadPlayerData,
  savePlayerData,
  LEVELS,
  getCurrentRank,
  calculateStars,
  WIZARD_RANKS,
  getProgressToNextRank
} from './progression';
import { Play, RefreshCw, VideoOff, Hand, Sparkles, Zap, Shield, Wind, Star, HelpCircle } from 'lucide-react';

type AppScreen = 'loading' | 'menu' | 'levelSelect' | 'playing' | 'levelComplete';

const App: React.FC = () => {
  // Screens
  const [screen, setScreen] = useState<AppScreen>('loading');
  const [currentLevelId, setCurrentLevelId] = useState(1);

  // Player progression
  const [playerData, setPlayerData] = useState<PlayerData>(loadPlayerData());

  // Game state
  const [gameStatus, setGameStatus] = useState<GameStatus>(GameStatus.LOADING);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [multiplier, setMultiplier] = useState(1);
  const [health, setHealth] = useState(100);
  const [creaturesDefeated, setCreaturesDefeated] = useState(0);
  const [creaturesMissed, setCreaturesMissed] = useState(0);
  
  // Spells
  const [activePowerUp, setActivePowerUp] = useState<BodyMovement>(null);
  const [powerUpTimeLeft, setPowerUpTimeLeft] = useState(0);
  const [shieldActive, setShieldActive] = useState(false);
  const [shieldCharges, setShieldCharges] = useState(0);
  const [spellsCastThisLevel, setSpellsCastThisLevel] = useState({
    lightning: 0,
    shield: 0,
    tornado: 0,
    freeze: 0
  });

  // UI
  const [showTutorial, setShowTutorial] = useState(false);

  const audioRef = useRef<HTMLAudioElement>(new Audio(SONG_URL));
  const videoRef = useRef<HTMLVideoElement>(null);
  const lastProcessedMovementRef = useRef<number>(0);
  const currentChartRef = useRef<NoteData[]>([]);

  // MediaPipe hook
  const { isCameraReady, handPositionsRef, poseDataRef, lastResultsRef, lastPoseResultsRef, error: cameraError } = useMediaPipe(videoRef);
  const { progress } = useProgress();

  // Load player data on mount
  useEffect(() => {
    const loaded = loadPlayerData();
    setPlayerData(loaded);
  }, []);

  // Save player data whenever it changes
  useEffect(() => {
    savePlayerData(playerData);
  }, [playerData]);

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
       setMaxCombo(mc => Math.max(mc, newCombo));
       if (newCombo > 30) setMultiplier(8);
       else if (newCombo > 20) setMultiplier(4);
       else if (newCombo > 10) setMultiplier(2);
       else setMultiplier(1);
       return newCombo;
     });

     setScore(s => s + (points * multiplier));
     setHealth(h => Math.min(100, h + 2));
     setCreaturesDefeated(c => c + 1);
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
      setCreaturesMissed(c => c + 1);
      setHealth(h => {
          const newHealth = h - 15;
          if (newHealth <= 0) {
             setTimeout(() => endGame(false), 0);
             return 0;
          }
          return newHealth;
      });
  }, [shieldActive, shieldCharges, activePowerUp]);

  const startLevel = async (levelId: number) => {
    if (!isCameraReady) return;

    // Get level config and generate chart
    const level = LEVELS.find(l => l.id === levelId);
    if (!level) return;

    currentChartRef.current = generateLevelChart(level);
    setCurrentLevelId(levelId);

    // Reset game state
    setScore(0);
    setCombo(0);
    setMaxCombo(0);
    setMultiplier(1);
    setHealth(100);
    setCreaturesDefeated(0);
    setCreaturesMissed(0);
    setActivePowerUp(null);
    setPowerUpTimeLeft(0);
    setShieldActive(false);
    setShieldCharges(0);
    setSpellsCastThisLevel({ lightning: 0, shield: 0, tornado: 0, freeze: 0 });

    // Reset chart
    currentChartRef.current.forEach(n => { n.hit = false; n.missed = false; });

    try {
      if (audioRef.current) {
          audioRef.current.currentTime = 0;
          await audioRef.current.play();
          setGameStatus(GameStatus.PLAYING);
          setScreen('playing');
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

      // Calculate results
      const totalCreatures = creaturesDefeated + creaturesMissed;
      const accuracy = totalCreatures > 0 ? creaturesDefeated / totalCreatures : 0;
      const totalSpells = Object.values(spellsCastThisLevel).reduce((sum, count) => sum + count, 0);
      const stars = calculateStars(accuracy, maxCombo, totalSpells);

      // Update player data
      const oldRank = playerData.currentRank;
      const newTotalScore = playerData.totalScore + score;
      const newRank = getCurrentRank(newTotalScore);

      const updatedData = { ...playerData };
      updatedData.totalScore = newTotalScore;
      updatedData.currentRank = newRank;

      // Update level completion
      if (!updatedData.levelsCompleted.includes(currentLevelId)) {
        updatedData.levelsCompleted.push(currentLevelId);
      }

      // Update stars (only if better)
      const previousStars = updatedData.levelStars[currentLevelId] || 0;
      if (stars > previousStars) {
        updatedData.levelStars[currentLevelId] = stars;
      }

      // Update best score (only if better)
      const previousBest = updatedData.levelBestScores[currentLevelId] || 0;
      if (score > previousBest) {
        updatedData.levelBestScores[currentLevelId] = score;
      }

      // Update accuracy
      updatedData.levelAccuracy[currentLevelId] = accuracy;

      // Update stats
      updatedData.stats.totalCreaturesDefeated += creaturesDefeated;
      updatedData.stats.bestCombo = Math.max(updatedData.stats.bestCombo, maxCombo);
      updatedData.stats.totalSpellsCast.lightning += spellsCastThisLevel.lightning;
      updatedData.stats.totalSpellsCast.shield += spellsCastThisLevel.shield;
      updatedData.stats.totalSpellsCast.tornado += spellsCastThisLevel.tornado;
      updatedData.stats.totalSpellsCast.freeze += spellsCastThisLevel.freeze;

      setPlayerData(updatedData);

      // Show level complete screen
      setTimeout(() => setScreen('levelComplete'), 500);
  };

  useEffect(() => {
      if (gameStatus === GameStatus.LOADING && isCameraReady) {
          setGameStatus(GameStatus.IDLE);
          setScreen('menu');
      }
  }, [isCameraReady, gameStatus]);

  // Monitor for body movements and activate power-ups
  useEffect(() => {
      if (screen !== 'playing') return;

      const interval = setInterval(() => {
          const detectedMovement = poseDataRef.current.detectedMovement;
          const cooldown = poseDataRef.current.movementCooldown;

          // Only process if there's a new movement detection
          if (detectedMovement && cooldown > 0 && Date.now() - lastProcessedMovementRef.current > 500) {
              lastProcessedMovementRef.current = Date.now();

              // Track spell cast
              setSpellsCastThisLevel(prev => ({
                ...prev,
                [detectedMovement]: (prev[detectedMovement as keyof typeof prev] || 0) + 1
              }));

              switch (detectedMovement) {
                  case 'lightning':
                      setActivePowerUp('lightning');
                      setPowerUpTimeLeft(1);
                      setScore(s => s + 500);
                      break;

                  case 'shield':
                      setShieldActive(true);
                      setShieldCharges(3);
                      setActivePowerUp('shield');
                      setPowerUpTimeLeft(5);
                      break;

                  case 'tornado':
                      setActivePowerUp('tornado');
                      setPowerUpTimeLeft(5);
                      break;

                  case 'freeze':
                      setActivePowerUp('freeze');
                      setPowerUpTimeLeft(8);
                      setMultiplier(m => m * 2);
                      setScore(s => s + 200);
                      break;
              }
          }
      }, 100);

      return () => clearInterval(interval);
  }, [screen, poseDataRef]);

  // Power-up timer
  useEffect(() => {
      if (powerUpTimeLeft <= 0) return;

      const interval = setInterval(() => {
          setPowerUpTimeLeft(t => {
              const newTime = t - 0.1;
              if (newTime <= 0) {
                  setActivePowerUp(null);
                  if (activePowerUp === 'freeze') {
                      setMultiplier(m => Math.max(1, m / 2));
                  }
              }
              return newTime;
          });
      }, 100);

      return () => clearInterval(interval);
  }, [powerUpTimeLeft, activePowerUp]);

  // Render based on screen
  const renderScreen = () => {
    const currentRank = WIZARD_RANKS[playerData.currentRank];

    switch (screen) {
      case 'loading':
        return (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-purple-950 via-black to-black text-white pointer-events-auto">
            <Sparkles className="w-20 h-20 text-purple-400 mb-6 animate-pulse" />
            <h1 className="text-4xl font-bold mb-4">Spell Slinger Academy</h1>
            <p className="text-gray-400 mb-8">Initializing camera...</p>
            {cameraError && (
              <div className="bg-red-900/50 border border-red-500 rounded-lg p-4 max-w-md">
                <p className="text-red-200">{cameraError}</p>
              </div>
            )}
          </div>
        );

      case 'menu':
        return (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-purple-950 via-black to-black text-white pointer-events-auto">
            <div className="text-center mb-12">
              <h1 className="text-6xl font-black text-white mb-3 tracking-tighter drop-shadow-[0_0_30px_rgba(168,85,247,0.6)]">
                SPELL SLINGER
              </h1>
              <h2 className="text-4xl font-bold text-purple-400 mb-6 italic drop-shadow-[0_0_20px_rgba(168,85,247,0.6)]">
                Academy
              </h2>
              <div className="flex items-center justify-center gap-2 text-xl" style={{ color: currentRank.color }}>
                <Sparkles className="w-6 h-6" />
                <span>{currentRank.name}</span>
              </div>
              <p className="text-gray-400 mt-2">Score: {playerData.totalScore.toLocaleString()}</p>
            </div>

            <div className="flex flex-col gap-4 mb-8">
              <button
                onClick={() => setScreen('levelSelect')}
                className="bg-purple-600 hover:bg-purple-500 text-white text-xl font-bold py-4 px-12 rounded-full transition-all transform hover:scale-105 hover:shadow-[0_0_30px_rgba(168,85,247,0.6)] flex items-center justify-center gap-3"
              >
                <Play fill="currentColor" /> BEGIN TRAINING
              </button>

              <button
                onClick={() => setShowTutorial(true)}
                className="bg-gray-700 hover:bg-gray-600 text-white text-lg font-bold py-3 px-8 rounded-full transition-all flex items-center justify-center gap-2"
              >
                <HelpCircle /> Spell Guide
              </button>
            </div>

            <div className="text-center text-gray-500 text-sm">
              <p>Total Creatures Defeated: {playerData.stats.totalCreaturesDefeated}</p>
              <p className="mt-2">✨ Camera Ready</p>
            </div>
          </div>
        );

      case 'levelSelect':
        return (
          <LevelSelect
            playerData={playerData}
            onSelectLevel={(levelId) => startLevel(levelId)}
            onBack={() => setScreen('menu')}
          />
        );

      case 'levelComplete':
        const previousBest = playerData.levelBestScores[currentLevelId] || 0;
        const previousStars = playerData.levelStars[currentLevelId] || 0;
        const oldRank = getCurrentRank(playerData.totalScore - score);
        const totalCreatures = creaturesDefeated + creaturesMissed;
        const accuracy = totalCreatures > 0 ? creaturesDefeated / totalCreatures : 0;

        return (
          <LevelComplete
            levelId={currentLevelId}
            score={score}
            accuracy={accuracy}
            maxCombo={maxCombo}
            creaturesDefeated={creaturesDefeated}
            spellsCast={spellsCastThisLevel}
            previousBestScore={previousBest}
            previousStars={previousStars}
            newTotalScore={playerData.totalScore}
            oldRank={oldRank}
            newRank={playerData.currentRank}
            onNextLevel={() => {
              const nextLevel = currentLevelId + 1;
              if (LEVELS.find(l => l.id === nextLevel)) {
                startLevel(nextLevel);
              }
            }}
            onReplay={() => startLevel(currentLevelId)}
            onLevelSelect={() => setScreen('levelSelect')}
          />
        );

      default:
        return null;
    }
  };

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

      {/* 3D Canvas - Optimized for tablet performance */}
      <Canvas
        shadows
        dpr={[1, 1.5]}
        performance={{ min: 0.5 }}
        gl={{
          antialias: true,
          powerPreference: 'high-performance',
          alpha: false
        }}
        frameloop="always"
      >
          {screen === 'playing' && (
             <GameScene
                gameStatus={gameStatus}
                audioRef={audioRef}
                handPositionsRef={handPositionsRef}
                chart={currentChartRef.current}
                onNoteHit={handleNoteHit}
                onNoteMiss={handleNoteMiss}
                onSongEnd={() => endGame(true)}
                activePowerUp={activePowerUp}
                shieldActive={shieldActive}
             />
          )}
      </Canvas>

      {/* Webcam Mini-Map Preview */}
      {screen === 'playing' && (
        <WebcamPreview
          videoRef={videoRef}
          resultsRef={lastResultsRef}
          isCameraReady={isCameraReady}
        />
      )}

      {/* UI Overlays */}
      {screen === 'playing' && (
        <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-6 z-10">
          {/* HUD (Top) */}
          <div className="flex justify-between items-start text-white w-full">
             {/* Level Info */}
             <div className="bg-black/60 px-4 py-2 rounded-lg border border-purple-500/50">
               <p className="text-sm text-purple-300">Year 1</p>
               <p className="text-xl font-bold text-white">Level {currentLevelId}</p>
             </div>

             {/* Health Bar */}
             <div className="w-1/4 max-w-xs">
                 <div className="h-4 bg-gray-800 rounded-full overflow-hidden border-2 border-gray-700">
                     <div
                        className={"h-full transition-all duration-300 ease-out " + (health > 50 ? 'bg-green-500' : health > 20 ? 'bg-yellow-500' : 'bg-red-600')}
                        style={{ width: health + '%' }}
                     />
                 </div>
                 <p className="text-xs mt-1 opacity-70 text-center">Health</p>
             </div>

             {/* Score & Combo */}
             <div className="text-center">
                 <h1 className="text-5xl font-bold tracking-wider drop-shadow-[0_0_10px_rgba(168,85,247,0.8)]">
                     {score.toLocaleString()}
                 </h1>
                 <div className="mt-2 flex flex-col items-center">
                     <p className={"text-2xl font-bold " + (combo > 10 ? 'text-purple-400 scale-110' : 'text-gray-300') + " transition-all"}>
                         {combo}x COMBO
                     </p>
                     {multiplier > 1 && (
                         <span className="text-sm px-2 py-1 bg-purple-900 rounded-full mt-1 animate-pulse">
                             {multiplier}x Multiplier!
                         </span>
                     )}
                 </div>
             </div>

             {/* Active Power-Up & Shield Status */}
             <div className="w-1/4 flex flex-col items-end gap-2">
                 {shieldActive && shieldCharges > 0 && (
                     <div className="flex items-center gap-2 bg-cyan-900/80 px-4 py-2 rounded-full border-2 border-cyan-400 animate-pulse">
                         <Shield className="w-6 h-6 text-cyan-300" />
                         <span className="text-cyan-100 font-bold">Shield x{shieldCharges}</span>
                     </div>
                 )}
                 {activePowerUp && activePowerUp !== 'shield' && (
                     <div className={"flex items-center gap-2 px-4 py-2 rounded-full border-2 " + (
                         activePowerUp === 'lightning' ? 'bg-yellow-900/80 border-yellow-400' :
                         activePowerUp === 'tornado' ? 'bg-purple-900/80 border-purple-400' :
                         activePowerUp === 'freeze' ? 'bg-blue-900/80 border-blue-400' :
                         'bg-gray-900/80 border-gray-400'
                     ) + " animate-pulse"}>
                         {activePowerUp === 'lightning' && <Zap className="w-6 h-6 text-yellow-300" />}
                         {activePowerUp === 'tornado' && <Wind className="w-6 h-6 text-purple-300" />}
                         {activePowerUp === 'freeze' && <Star className="w-6 h-6 text-blue-300" />}
                         <span className="text-white font-bold">
                             {activePowerUp === 'lightning' && 'LIGHTNING!'}
                             {activePowerUp === 'tornado' && 'TORNADO!'}
                             {activePowerUp === 'freeze' && 'FREEZE!'}
                         </span>
                     </div>
                 )}
             </div>
          </div>

          {/* Rank Progress Bar (Bottom) */}
          <div className="w-full max-w-md mx-auto bg-black/60 px-4 py-2 rounded-lg border border-purple-500/30">
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span style={{ color: WIZARD_RANKS[playerData.currentRank].color }}>
                {WIZARD_RANKS[playerData.currentRank].name}
              </span>
              <span>{Math.round(getProgressToNextRank(playerData.totalScore) * 100)}%</span>
            </div>
            <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-purple-400 transition-all"
                style={{ width: (getProgressToNextRank(playerData.totalScore) * 100) + '%' }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Screen Overlays */}
      {renderScreen()}

      {/* Tutorial Modal */}
      {showTutorial && (
        <TutorialModal onClose={() => setShowTutorial(false)} />
      )}
    </div>
  );
};

export default App;
