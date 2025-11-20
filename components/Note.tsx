/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useMemo, useRef } from 'react';
import { Sphere, Trail } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { NoteData } from '../types';
import { LANE_X_POSITIONS, LAYER_Y_POSITIONS, NOTE_SIZE } from '../constants';

interface NoteProps {
  data: NoteData;
  zPos: number;
  currentTime: number;
}

// Magical creature color schemes based on type
const CREATURE_COLORS = {
  left: {
    main: '#a855f7',    // Purple
    glow: '#d946ef',    // Bright magenta
    trail: '#c084fc'    // Light purple
  },
  right: {
    main: '#06b6d4',    // Cyan
    glow: '#22d3ee',    // Bright cyan
    trail: '#67e8f9'    // Light cyan
  }
};

// Magical explosion effect
const MagicalExplosion: React.FC<{ data: NoteData, timeSinceHit: number, colors: any }> = ({ data, timeSinceHit, colors }) => {
    const groupRef = useRef<THREE.Group>(null);
    const particlesRef = useRef<THREE.Points>(null);

    // Create particle system
    const particles = useMemo(() => {
        const count = 20;
        const positions = new Float32Array(count * 3);
        const velocities = [];

        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2;
            const speed = 2 + Math.random() * 2;
            velocities.push(
                Math.cos(angle) * speed,
                Math.sin(angle) * speed + 1,
                -speed * 0.5
            );
            positions[i * 3] = 0;
            positions[i * 3 + 1] = 0;
            positions[i * 3 + 2] = 0;
        }
        return { positions, velocities, count };
    }, []);

    useFrame(() => {
        if (!particlesRef.current) return;

        const positions = particlesRef.current.geometry.attributes.position.array as Float32Array;

        for (let i = 0; i < particles.count; i++) {
            positions[i * 3] += particles.velocities[i * 3] * 0.016;
            positions[i * 3 + 1] += particles.velocities[i * 3 + 1] * 0.016 - 0.05; // gravity
            positions[i * 3 + 2] += particles.velocities[i * 3 + 2] * 0.016;
        }

        particlesRef.current.geometry.attributes.position.needsUpdate = true;

        if (groupRef.current) {
            groupRef.current.scale.setScalar(Math.max(0.01, 1 - timeSinceHit * 2));
            if (particlesRef.current.material instanceof THREE.PointsMaterial) {
                particlesRef.current.material.opacity = Math.max(0, 1 - timeSinceHit * 2);
            }
        }
    });

    return (
        <group ref={groupRef}>
            {/* Flash sphere */}
            <mesh>
                <sphereGeometry args={[NOTE_SIZE * 1.5, 16, 16]} />
                <meshBasicMaterial
                    color={colors.glow}
                    transparent
                    opacity={Math.max(0, 1 - timeSinceHit * 4)}
                    toneMapped={false}
                />
            </mesh>

            {/* Particle burst */}
            <points ref={particlesRef}>
                <bufferGeometry>
                    <bufferAttribute
                        attach="attributes-position"
                        count={particles.count}
                        array={particles.positions}
                        itemSize={3}
                    />
                </bufferGeometry>
                <pointsMaterial
                    size={0.15}
                    color={colors.trail}
                    transparent
                    sizeAttenuation
                    toneMapped={false}
                />
            </points>
        </group>
    );
};

// Main magical creature component
const Note: React.FC<NoteProps> = ({ data, zPos, currentTime }) => {
  const colors = data.type === 'left' ? CREATURE_COLORS.left : CREATURE_COLORS.right;
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);

  const position: [number, number, number] = useMemo(() => {
     return [
         LANE_X_POSITIONS[data.lineIndex],
         LAYER_Y_POSITIONS[data.lineLayer],
         zPos
     ];
  }, [data.lineIndex, data.lineLayer, zPos]);

  // Animate the creature
  useFrame((state) => {
    if (meshRef.current) {
      // Gentle floating animation
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2 + position[0]) * 0.1;
      // Gentle rotation
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.5;
      meshRef.current.rotation.z = Math.sin(state.clock.elapsedTime) * 0.2;
    }

    if (glowRef.current) {
      // Pulsing glow effect
      const pulse = 0.8 + Math.sin(state.clock.elapsedTime * 3) * 0.2;
      glowRef.current.scale.setScalar(1.2 + pulse * 0.3);
      if (glowRef.current.material instanceof THREE.MeshBasicMaterial) {
        glowRef.current.material.opacity = 0.3 * pulse;
      }
    }
  });

  if (data.missed) return null;

  if (data.hit && data.hitTime) {
      return (
          <group position={position}>
              <MagicalExplosion data={data} timeSinceHit={currentTime - data.hitTime} colors={colors} />
          </group>
      );
  }

  return (
    <group position={position}>
      {/* Magical trail */}
      <Trail
        width={0.5}
        length={5}
        color={colors.trail}
        attenuation={(t) => t * t}
      >
        {/* Main creature body - magical orb */}
        <mesh ref={meshRef}>
          <sphereGeometry args={[NOTE_SIZE * 0.6, 16, 16]} />
          <meshPhysicalMaterial
            color={colors.main}
            emissive={colors.glow}
            emissiveIntensity={0.8}
            roughness={0.2}
            metalness={0.1}
            transmission={0.3}
            thickness={0.5}
            transparent
            opacity={0.9}
          />
        </mesh>
      </Trail>

      {/* Inner energy core */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[NOTE_SIZE * 0.3, 12, 12]} />
        <meshBasicMaterial
          color="white"
          toneMapped={false}
          transparent
          opacity={0.7}
        />
      </mesh>

      {/* Outer magical aura */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[NOTE_SIZE * 0.7, 16, 16]} />
        <meshBasicMaterial
          color={colors.glow}
          transparent
          opacity={0.2}
          side={THREE.BackSide}
          toneMapped={false}
        />
      </mesh>

      {/* Rotating ring effect */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[NOTE_SIZE * 0.7, NOTE_SIZE * 0.05, 16, 32]} />
        <meshBasicMaterial
          color={colors.trail}
          transparent
          opacity={0.5}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
};

export default React.memo(Note, (prev, next) => {
    if (next.data.hit) return false;
    return prev.zPos === next.zPos && prev.data.hit === next.data.hit && prev.data.missed === next.data.missed;
});
