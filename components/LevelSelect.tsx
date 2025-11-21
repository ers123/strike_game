/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { Star, Lock, Sparkles } from 'lucide-react';
import { LEVELS, LevelConfig, PlayerData, isLevelUnlocked, WIZARD_RANKS, getProgressToNextRank } from '../progression';

interface LevelSelectProps {
  playerData: PlayerData;
  onSelectLevel: (levelId: number) => void;
  onBack: () => void;
}

const LevelSelect: React.FC<LevelSelectProps> = ({ playerData, onSelectLevel, onBack }) => {
  const currentRank = WIZARD_RANKS[playerData.currentRank];
  const nextRank = WIZARD_RANKS[Math.min(playerData.currentRank + 1, WIZARD_RANKS.length - 1)];
  const progress = getProgressToNextRank(playerData.totalScore);

  return (
    <div className="absolute inset-0 bg-gradient-to-b from-purple-950 via-black to-black flex flex-col items-center justify-start p-8 overflow-y-auto pointer-events-auto">
      {/* Header */}
      <div className="w-full max-w-4xl mb-8">
        <button
          onClick={onBack}
          className="mb-4 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
        >
          ← Back
        </button>

        {/* Rank Display */}
        <div className="bg-black/60 p-6 rounded-xl border-2 border-purple-500/50">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-3xl font-bold text-white flex items-center gap-2">
                <Sparkles className="w-8 h-8" style={{ color: currentRank.color }} />
                {currentRank.name}
              </h2>
              <p className="text-gray-400 mt-1">Total Score: {playerData.totalScore.toLocaleString()}</p>
            </div>
          </div>

          {/* Progress Bar to Next Rank */}
          {playerData.currentRank < WIZARD_RANKS.length - 1 && (
            <div>
              <div className="flex justify-between text-sm text-gray-400 mb-2">
                <span>Progress to {nextRank.name}</span>
                <span>{Math.round(progress * 100)}%</span>
              </div>
              <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-purple-400 transition-all duration-500"
                  style={{ width: `${progress * 100}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {nextRank.minScore - playerData.totalScore} points to next rank
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Level Grid */}
      <div className="w-full max-w-4xl">
        <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
          <span className="text-purple-400">Year 1:</span> Novice Apprentice
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {LEVELS.map((level) => {
            const unlocked = isLevelUnlocked(level.id, playerData.levelStars);
            const stars = playerData.levelStars[level.id] || 0;
            const bestScore = playerData.levelBestScores[level.id] || 0;
            const accuracy = playerData.levelAccuracy[level.id] || 0;
            const completed = playerData.levelsCompleted.includes(level.id);

            return (
              <button
                key={level.id}
                onClick={() => unlocked && onSelectLevel(level.id)}
                disabled={!unlocked}
                className={`
                  relative p-6 rounded-xl border-2 transition-all
                  ${unlocked
                    ? 'bg-gradient-to-br from-purple-900/40 to-black/40 border-purple-500/50 hover:border-purple-400 hover:scale-105 cursor-pointer'
                    : 'bg-gray-900/40 border-gray-700 opacity-50 cursor-not-allowed'
                  }
                `}
              >
                {/* Level Number Badge */}
                <div className={`
                  absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg
                  ${completed ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-400'}
                `}>
                  {level.id}
                </div>

                {/* Lock Icon for Locked Levels */}
                {!unlocked && (
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    <Lock className="w-12 h-12 text-gray-600" />
                  </div>
                )}

                {/* Level Info */}
                <div className={unlocked ? '' : 'opacity-30'}>
                  <h4 className="text-xl font-bold text-white mb-2">{level.name}</h4>
                  <p className="text-sm text-gray-400 mb-4">{level.description}</p>

                  {/* Stars */}
                  <div className="flex gap-1 mb-3">
                    {[1, 2, 3].map((starNum) => (
                      <Star
                        key={starNum}
                        className={`w-6 h-6 ${
                          starNum <= stars
                            ? 'text-yellow-400 fill-yellow-400'
                            : 'text-gray-600 fill-gray-800'
                        }`}
                      />
                    ))}
                  </div>

                  {/* Stats */}
                  {completed && (
                    <div className="text-xs text-gray-400 space-y-1">
                      <p>Best: {bestScore.toLocaleString()}</p>
                      <p>Accuracy: {Math.round(accuracy * 100)}%</p>
                    </div>
                  )}

                  {/* Level Details */}
                  <div className="text-xs text-gray-500 mt-3 pt-3 border-t border-gray-700">
                    <p>BPM: {level.bpm} • {level.duration}s</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Coming Soon Teaser */}
      <div className="w-full max-w-4xl mt-8 p-6 bg-gray-900/40 border-2 border-gray-700 rounded-xl text-center">
        <p className="text-gray-500">
          <Lock className="inline w-5 h-5 mr-2" />
          Years 2-5 Coming Soon! Complete all Year 1 levels with 3 stars.
        </p>
      </div>
    </div>
  );
};

export default LevelSelect;
