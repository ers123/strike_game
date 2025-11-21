/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/


import { CutDirection, NoteData } from "./types";
import * as THREE from 'three';
import { LevelConfig } from './progression';

// Game World Config
export const TRACK_LENGTH = 50;
export const SPAWN_Z = -30;
export const PLAYER_Z = 0;
export const MISS_Z = 5;
export const NOTE_SPEED = 10; // Reduced from 15 for easier difficulty

export const LANE_WIDTH = 0.8;
export const LAYER_HEIGHT = 0.8;
export const NOTE_SIZE = 0.5;

// Positions for the 4 lanes (centered around 0)
export const LANE_X_POSITIONS = [-1.5 * LANE_WIDTH, -0.5 * LANE_WIDTH, 0.5 * LANE_WIDTH, 1.5 * LANE_WIDTH];
export const LAYER_Y_POSITIONS = [0.8, 1.6, 2.4]; // Low, Mid, High

// Audio
// Using a solid rhythmic track that is free to use.
export const SONG_URL = 'https://commondatastorage.googleapis.com/codeskulptor-demos/riceracer_assets/music/race2.ogg';
export const SONG_BPM = 140; // Default BPM (will vary by level)

// Generate a chart based on level configuration
export const generateLevelChart = (levelConfig: LevelConfig): NoteData[] => {
  const notes: NoteData[] = [];
  let idCount = 0;
  const bpm = levelConfig.bpm;
  const targetCreatures = levelConfig.targetCreatures;
  const duration = levelConfig.duration;
  const BEAT_TIME = 60 / bpm;

  // Calculate spawn interval to fit target creatures in duration
  const spawnInterval = (duration - 4) / targetCreatures; // Start after 4 seconds

  // Difficulty adjustments based on level
  const difficulty = Math.min(5, Math.floor((levelConfig.id - 1) / 5) + 1);
  const doubleHitChance = Math.min(0.3, difficulty * 0.06); // More double hits as difficulty increases
  const streamChance = Math.min(0.2, (difficulty - 1) * 0.05); // Faster streams later

  let currentTime = 4; // Start after 4 seconds

  for (let i = 0; i < targetCreatures; i++) {
    const rand = Math.random();

    if (rand < doubleHitChance) {
      // Double hits (both hands)
      const layer = Math.floor(Math.random() * 3);
      notes.push(
        {
          id: `note-${idCount++}`,
          time: currentTime,
          lineIndex: 0,
          lineLayer: layer,
          type: 'left',
          cutDirection: CutDirection.ANY
        },
        {
          id: `note-${idCount++}`,
          time: currentTime,
          lineIndex: 3,
          lineLayer: layer,
          type: 'right',
          cutDirection: CutDirection.ANY
        }
      );
      i++; // Count as 2 creatures
    } else if (rand < doubleHitChance + streamChance) {
      // Stream (fast alternation)
      const layer = Math.floor(Math.random() * 2);
      notes.push(
        {
          id: `note-${idCount++}`,
          time: currentTime,
          lineIndex: 1,
          lineLayer: layer,
          type: 'left',
          cutDirection: CutDirection.ANY
        },
        {
          id: `note-${idCount++}`,
          time: currentTime + BEAT_TIME * 0.5,
          lineIndex: 2,
          lineLayer: layer,
          type: 'right',
          cutDirection: CutDirection.ANY
        }
      );
      i++; // Count as 2 creatures
    } else {
      // Single note - alternating hands
      const hand = i % 2 === 0 ? 'left' : 'right';
      const lane = hand === 'left' ? (Math.random() < 0.5 ? 0 : 1) : (Math.random() < 0.5 ? 2 : 3);
      const layer = Math.floor(Math.random() * 3);

      notes.push({
        id: `note-${idCount++}`,
        time: currentTime,
        lineIndex: lane,
        lineLayer: layer,
        type: hand,
        cutDirection: CutDirection.ANY
      });
    }

    currentTime += spawnInterval * BEAT_TIME;
  }

  return notes.sort((a, b) => a.time - b.time);
};

// Vectors for direction checking
export const DIRECTION_VECTORS: Record<CutDirection, THREE.Vector3> = {
  [CutDirection.UP]: new THREE.Vector3(0, 1, 0),
  [CutDirection.DOWN]: new THREE.Vector3(0, -1, 0),
  [CutDirection.LEFT]: new THREE.Vector3(-1, 0, 0),
  [CutDirection.RIGHT]: new THREE.Vector3(1, 0, 0),
  [CutDirection.ANY]: new THREE.Vector3(0, 0, 0) // Magnitude check only
};
