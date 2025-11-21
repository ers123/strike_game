/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { NoteData } from './types';

// Wizard rank definitions
export const WIZARD_RANKS = [
  { id: 0, name: 'Novice', minScore: 0, color: '#9ca3af' },
  { id: 1, name: 'Apprentice', minScore: 1000, color: '#a855f7' },
  { id: 2, name: 'Adept', minScore: 5000, color: '#8b5cf6' },
  { id: 3, name: 'Magus', minScore: 15000, color: '#7c3aed' },
  { id: 4, name: 'Master Wizard', minScore: 35000, color: '#6d28d9' },
  { id: 5, name: 'Grandmaster', minScore: 75000, color: '#5b21b6' },
  { id: 6, name: 'Archmage', minScore: 150000, color: '#fbbf24' }
];

// Level definitions for Year 1
export interface LevelConfig {
  id: number;
  year: number;
  name: string;
  bpm: number;
  duration: number; // seconds
  targetCreatures: number;
  description: string;
}

export const LEVELS: LevelConfig[] = [
  {
    id: 1,
    year: 1,
    name: "Welcome to the Academy",
    bpm: 120,
    duration: 60,
    targetCreatures: 40,
    description: "Learn the basics of spell-slinging"
  },
  {
    id: 2,
    year: 1,
    name: "Hand Spell Basics",
    bpm: 125,
    duration: 65,
    targetCreatures: 50,
    description: "Master your hand movements"
  },
  {
    id: 3,
    year: 1,
    name: "Lightning Lesson",
    bpm: 130,
    duration: 70,
    targetCreatures: 55,
    description: "Harness the power of lightning"
  },
  {
    id: 4,
    year: 1,
    name: "Shield Training",
    bpm: 130,
    duration: 70,
    targetCreatures: 60,
    description: "Learn to protect yourself"
  },
  {
    id: 5,
    year: 1,
    name: "First Year Exam",
    bpm: 135,
    duration: 75,
    targetCreatures: 70,
    description: "Prove your mastery of Year 1"
  }
];

// Player progression data structure
export interface PlayerData {
  // Progression
  totalScore: number;
  currentRank: number;
  currentLevel: number;

  // Level Completion
  levelsCompleted: number[];
  levelStars: { [levelId: number]: number };
  levelBestScores: { [levelId: number]: number };
  levelAccuracy: { [levelId: number]: number };

  // Stats
  stats: {
    totalPlayTime: number;
    totalCreaturesDefeated: number;
    totalSpellsCast: {
      lightning: number;
      shield: number;
      tornado: number;
      freeze: number;
    };
    bestCombo: number;
  };

  // Settings
  lastPlayed: number;
  tutorialCompleted: boolean;
}

export const DEFAULT_PLAYER_DATA: PlayerData = {
  totalScore: 0,
  currentRank: 0,
  currentLevel: 1,
  levelsCompleted: [],
  levelStars: {},
  levelBestScores: {},
  levelAccuracy: {},
  stats: {
    totalPlayTime: 0,
    totalCreaturesDefeated: 0,
    totalSpellsCast: {
      lightning: 0,
      shield: 0,
      tornado: 0,
      freeze: 0
    },
    bestCombo: 0
  },
  lastPlayed: Date.now(),
  tutorialCompleted: false
};

// localStorage key
const STORAGE_KEY = 'spellSlingerProgress';

// Save player data
export function savePlayerData(data: PlayerData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save player data:', error);
  }
}

// Load player data
export function loadPlayerData(): PlayerData {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Merge with defaults to handle new fields
      return { ...DEFAULT_PLAYER_DATA, ...parsed };
    }
  } catch (error) {
    console.error('Failed to load player data:', error);
  }
  return { ...DEFAULT_PLAYER_DATA };
}

// Calculate stars for a level
export function calculateStars(
  accuracy: number,
  maxCombo: number,
  spellsCast: number
): number {
  let stars = 0;

  // 1 Star: Complete the level
  if (accuracy >= 0.5) stars = 1;

  // 2 Stars: Good performance
  if (accuracy >= 0.75 && maxCombo >= 20) stars = 2;

  // 3 Stars: Excellent performance
  if (accuracy >= 0.90 && maxCombo >= 40 && spellsCast >= 2) stars = 3;

  return stars;
}

// Get current wizard rank
export function getCurrentRank(totalScore: number): number {
  for (let i = WIZARD_RANKS.length - 1; i >= 0; i--) {
    if (totalScore >= WIZARD_RANKS[i].minScore) {
      return i;
    }
  }
  return 0;
}

// Get progress to next rank (0-1)
export function getProgressToNextRank(totalScore: number): number {
  const currentRank = getCurrentRank(totalScore);
  if (currentRank >= WIZARD_RANKS.length - 1) {
    return 1; // Max rank
  }

  const currentThreshold = WIZARD_RANKS[currentRank].minScore;
  const nextThreshold = WIZARD_RANKS[currentRank + 1].minScore;
  const progress = (totalScore - currentThreshold) / (nextThreshold - currentThreshold);

  return Math.min(1, Math.max(0, progress));
}

// Get total stars earned
export function getTotalStars(levelStars: { [levelId: number]: number }): number {
  return Object.values(levelStars).reduce((sum, stars) => sum + stars, 0);
}

// Check if a level is unlocked
export function isLevelUnlocked(levelId: number, levelStars: { [levelId: number]: number }): boolean {
  // Level 1 is always unlocked
  if (levelId === 1) return true;

  // Check if previous level is completed
  const previousLevel = levelId - 1;
  return levelStars[previousLevel] !== undefined && levelStars[previousLevel] > 0;
}
