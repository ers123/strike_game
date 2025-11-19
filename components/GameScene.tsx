/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/


import React, { useRef, useState, useMemo, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Environment, Grid, PerspectiveCamera, Stars } from '@react-three/drei';
import * as THREE from 'three';
import { GameStatus, NoteData, HandPositions, COLORS, CutDirection } from '../types';
import { PLAYER_Z, SPAWN_Z, MISS_Z, NOTE_SPEED, DIRECTION_VECTORS, NOTE_SIZE, LANE_X_POSITIONS, LAYER_Y_POSITIONS, SONG_BPM } from '../constants';
import Note from './Note';
import Saber from './Saber';
import { BodyMovement } from '../hooks/useMediaPipe';

interface GameSceneProps {
  gameStatus: GameStatus;
  audioRef: React.RefObject<HTMLAudioElement>;
  handPositionsRef: React.MutableRefObject<any>; // Simplified type for the raw ref
  chart: NoteData[];
  onNoteHit: (note: NoteData, goodCut: boolean) => void;
  onNoteMiss: (note: NoteData) => void;
  onSongEnd: () => void;
  activePowerUp: BodyMovement;
  shieldActive: boolean;
}

const BEAT_TIME = 60 / SONG_BPM;

const GameScene: React.FC<GameSceneProps> = ({
    gameStatus,
    audioRef,
    handPositionsRef,
    chart,
    onNoteHit,
    onNoteMiss,
    onSongEnd,
    activePowerUp,
    shieldActive
}) => {
  // Local state for notes to trigger re-renders when they are hit/missed
  const [notesState, setNotesState] = useState<NoteData[]>(chart);
  const [currentTime, setCurrentTime] = useState(0);

  // Refs for things we don't want causing re-renders every frame
  const activeNotesRef = useRef<NoteData[]>([]);
  const nextNoteIndexRef = useRef(0);
  const shakeIntensity = useRef(0);
  const cameraRef = useRef<THREE.PerspectiveCamera>(null);
  const ambientLightRef = useRef<THREE.AmbientLight>(null);
  const spotLightRef = useRef<THREE.SpotLight>(null);
  const lastPowerUpRef = useRef<BodyMovement>(null);
  const tornadoEffectRef = useRef<THREE.Mesh>(null);
  const shieldEffectRef = useRef<THREE.Mesh>(null);

  // Helper Vector3s for collision to avoid GC
  const vecA = useMemo(() => new THREE.Vector3(), []);
  const vecB = useMemo(() => new THREE.Vector3(), []);

  // Wrap onNoteHit to add Scene-level effects (Camera shake)
  const handleHit = (note: NoteData, goodCut: boolean) => {
      shakeIntensity.current = goodCut ? 0.3 : 0.15;
      onNoteHit(note, goodCut);
  }

  useFrame((state, delta) => {
    // --- Power-Up Effects ---
    // Jump slam attack - clear all active notes
    if (activePowerUp === 'jump' && lastPowerUpRef.current !== 'jump') {
        lastPowerUpRef.current = 'jump';
        // Hit all active notes
        activeNotesRef.current.forEach(note => {
            if (!note.hit && !note.missed) {
                note.hit = true;
                note.hitTime = audioRef.current?.currentTime || 0;
                onNoteHit(note, true);
            }
        });
        activeNotesRef.current = [];
        shakeIntensity.current = 1.0; // Big shake!
    } else if (activePowerUp !== 'jump') {
        if (lastPowerUpRef.current === 'jump') {
            lastPowerUpRef.current = null;
        }
    }

    // Tornado effect rotation
    if (tornadoEffectRef.current) {
        tornadoEffectRef.current.visible = activePowerUp === 'spin';
        if (activePowerUp === 'spin') {
            tornadoEffectRef.current.rotation.y += delta * 3;
            tornadoEffectRef.current.position.y = Math.sin(state.clock.elapsedTime * 2) * 0.3 + 1.5;
        }
    }

    // Shield effect
    if (shieldEffectRef.current) {
        shieldEffectRef.current.visible = shieldActive;
        if (shieldActive) {
            shieldEffectRef.current.rotation.y += delta * 2;
            const pulse = Math.sin(state.clock.elapsedTime * 4) * 0.1 + 1.0;
            shieldEffectRef.current.scale.setScalar(pulse);
        }
    }

    // --- Beat Pulsing ---
    // Calculate a value from 0 to 1 that peaks exactly on the beat and decays quickly
    // phase is 0.0 right ON the beat, and goes up to 1.0 just before next beat
    if (audioRef.current && gameStatus === GameStatus.PLAYING) {
        const time = audioRef.current.currentTime;
        const beatPhase = (time % BEAT_TIME) / BEAT_TIME;
        // Sharp decay curve: Math.pow(1 - beatPhase, 3)
        const pulse = Math.pow(1 - beatPhase, 4);

        if (ambientLightRef.current) {
            ambientLightRef.current.intensity = 0.1 + (pulse * 0.3);
        }
        if (spotLightRef.current) {
            spotLightRef.current.intensity = 0.5 + (pulse * 1.5);
        }
    }

    // --- Camera Shake ---
    if (shakeIntensity.current > 0 && cameraRef.current) {
        const shake = shakeIntensity.current;
        cameraRef.current.position.x = (Math.random() - 0.5) * shake;
        cameraRef.current.position.y = 1.8 + (Math.random() - 0.5) * shake;
        cameraRef.current.position.z = 4 + (Math.random() - 0.5) * shake;
        
        // Decay shake
        shakeIntensity.current = THREE.MathUtils.lerp(shakeIntensity.current, 0, 10 * delta);
        if (shakeIntensity.current < 0.01) {
             shakeIntensity.current = 0;
             // Reset to exact base position when done shaking
             cameraRef.current.position.set(0, 1.8, 4);
        }
    }

    if (gameStatus !== GameStatus.PLAYING || !audioRef.current) return;

    // Sync time with audio
    const time = audioRef.current.currentTime;
    setCurrentTime(time);

    if (audioRef.current.ended) {
        onSongEnd();
        return;
    }

    // 1. Spawn Notes
    // Look ahead by the time it takes for a note to travel from spawn to player
    const spawnAheadTime = Math.abs(SPAWN_Z - PLAYER_Z) / NOTE_SPEED;
    
    while (nextNoteIndexRef.current < notesState.length) {
      const nextNote = notesState[nextNoteIndexRef.current];
      if (nextNote.time - spawnAheadTime <= time) {
        activeNotesRef.current.push(nextNote);
        nextNoteIndexRef.current++;
      } else {
        break;
      }
    }

    // 2. Update & Collide Notes
    const hands = handPositionsRef.current as HandPositions;

    for (let i = activeNotesRef.current.length - 1; i >= 0; i--) {
        const note = activeNotesRef.current[i];
        if (note.hit || note.missed) continue;

        // Calculate current Z position
        const timeDiff = note.time - time;
        const currentZ = PLAYER_Z - (timeDiff * NOTE_SPEED);

        // Miss check (passed player)
        if (currentZ > MISS_Z) {
            note.missed = true;
            onNoteMiss(note);
            activeNotesRef.current.splice(i, 1);
            continue;
        }

        // Tornado auto-hit (spin power-up)
        if (activePowerUp === 'spin' && currentZ > PLAYER_Z - 2 && currentZ < PLAYER_Z + 0.5) {
            const notePos = vecA.set(
                LANE_X_POSITIONS[note.lineIndex],
                LAYER_Y_POSITIONS[note.lineLayer],
                currentZ
            );
            const playerPos = vecB.set(0, 1.5, PLAYER_Z);

            // Auto-hit notes within tornado radius
            if (playerPos.distanceTo(notePos) < 2.5) {
                note.hit = true;
                note.hitTime = time;
                handleHit(note, true);
                activeNotesRef.current.splice(i, 1);
                continue;
            }
        }

        // Collision check (only if near player)
        // Widened window for more forgiveness
        if (currentZ > PLAYER_Z - 1.5 && currentZ < PLAYER_Z + 1.0) {
            const handPos = note.type === 'left' ? hands.left : hands.right;
            const handVel = note.type === 'left' ? hands.leftVelocity : hands.rightVelocity;

            if (handPos) {
                 const notePos = vecA.set(
                     LANE_X_POSITIONS[note.lineIndex],
                     LAYER_Y_POSITIONS[note.lineLayer],
                     currentZ
                 );

                 // Collision radius 0.8
                 if (handPos.distanceTo(notePos) < 0.8) {
                     let goodCut = true;
                     const speed = handVel.length();

                     // Reduced required speed from 2.0 to 1.5 for easier cutting
                     if (note.cutDirection !== CutDirection.ANY) {
                         const requiredDir = DIRECTION_VECTORS[note.cutDirection];
                         vecB.copy(handVel).normalize();
                         const dot = vecB.dot(requiredDir);

                         if (dot < 0.3 || speed < 1.5) {
                             goodCut = false;
                         }
                     } else {
                         if (speed < 1.5) goodCut = false;
                     }

                     note.hit = true;
                     note.hitTime = time;
                     handleHit(note, goodCut);
                     activeNotesRef.current.splice(i, 1);
                 }
            }
        }
    }
  });

  // Map active notes to components. 
  const visibleNotes = useMemo(() => {
     return notesState.filter(n => 
         !n.missed && 
         (!n.hit || (currentTime - (n.hitTime || 0) < 0.5)) && // Keep hit notes for 0.5s
         (n.time - currentTime) < 5 && 
         (n.time - currentTime) > -2 
     );
  }, [notesState, currentTime]);

  // Refs for visual sabers
  const leftHandPosRef = useRef<THREE.Vector3 | null>(null);
  const rightHandPosRef = useRef<THREE.Vector3 | null>(null);
  const leftHandVelRef = useRef<THREE.Vector3 | null>(null);
  const rightHandVelRef = useRef<THREE.Vector3 | null>(null);

  useFrame(() => {
     leftHandPosRef.current = handPositionsRef.current.left;
     rightHandPosRef.current = handPositionsRef.current.right;
     leftHandVelRef.current = handPositionsRef.current.leftVelocity;
     rightHandVelRef.current = handPositionsRef.current.rightVelocity;
  });

  return (
    <>
      <PerspectiveCamera ref={cameraRef} makeDefault position={[0, 1.8, 4]} fov={60} />
      <color attach="background" args={['#050505']} />
      <fog attach="fog" args={['#050505', 10, 50]} />
      
      {/* Pulsing Lights */}
      <ambientLight ref={ambientLightRef} intensity={0.2} />
      <spotLight ref={spotLightRef} position={[0, 10, 5]} angle={0.5} penumbra={1} intensity={1} castShadow />
      
      <Environment preset="night" />

      {/* Floor / Track visuals */}
      <Grid position={[0, 0, 0]} args={[6, 100]} cellThickness={0.1} cellColor="#333" sectionSize={5} sectionThickness={1.5} sectionColor={COLORS.right} fadeDistance={60} infiniteGrid />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
          <planeGeometry args={[4, 100]} />
          <meshStandardMaterial color="#111" roughness={0.8} metalness={0.5} />
      </mesh>
      
      <Stars radius={50} depth={50} count={2000} factor={4} saturation={0} fade speed={1} />

      <Saber type="left" positionRef={leftHandPosRef} velocityRef={leftHandVelRef} />
      <Saber type="right" positionRef={rightHandPosRef} velocityRef={rightHandVelRef} />

      {/* Tornado Effect (Spin Power-Up) */}
      <mesh ref={tornadoEffectRef} position={[0, 1.5, PLAYER_Z]} visible={false}>
        <coneGeometry args={[2, 3, 32, 1, true]} />
        <meshStandardMaterial
          color="#a855f7"
          transparent
          opacity={0.3}
          side={THREE.DoubleSide}
          emissive="#a855f7"
          emissiveIntensity={0.5}
          wireframe
        />
      </mesh>

      {/* Shield Effect (Squat Power-Up) */}
      <mesh ref={shieldEffectRef} position={[0, 1.5, PLAYER_Z]} visible={false}>
        <sphereGeometry args={[1.5, 32, 32]} />
        <meshStandardMaterial
          color="#06b6d4"
          transparent
          opacity={0.2}
          emissive="#06b6d4"
          emissiveIntensity={0.8}
          wireframe
        />
      </mesh>

      {visibleNotes.map(note => (
          <Note
            key={note.id}
            data={note}
            zPos={PLAYER_Z - ((note.time - currentTime) * NOTE_SPEED)}
            currentTime={currentTime}
          />
      ))}
    </>
  );
};

export default GameScene;
