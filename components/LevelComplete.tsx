/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useEffect, useState } from 'react';
import { Star, Sparkles, Zap, Shield, Wind, Snowflake, Trophy, TrendingUp } from 'lucide-react';
import { LEVELS, WIZARD_RANKS, calculateStars } from '../progression';

interface LevelCompleteProps {
  levelId: number;
  score: number;
  accuracy: number;
  maxCombo: number;
  creaturesDefeated: number;
  spellsCast: {
    lightning: number;
    shield: number;
    tornado: number;
    freeze: number;
  };
  previousBestScore: number;
  previousStars: number;
  newTotalScore: number;
  oldRank: number;
  newRank: number;
  onNextLevel: () => void;
  onReplay: () => void;
  onLevelSelect: () => void;
}

const LevelComplete: React.FC<LevelCompleteProps> = ({
  levelId,
  score,
  accuracy,
  maxCombo,
  creaturesDefeated,
  spellsCast,
  previousBestScore,
  previousStars,
  newTotalScore,
  oldRank,
  newRank,
  onNextLevel,
  onReplay,
  onLevelSelect
}) => {
  const [showAnimation, setShowAnimation] = useState(false);
  const level = LEVELS.find(l => l.id === levelId);
  const totalSpellsCast = Object.values(spellsCast).reduce((sum, count) => sum + count, 0);
  const stars = calculateStars(accuracy, maxCombo, totalSpellsCast);
  const isNewBest = score > previousBestScore;
  const earnedNewStar = stars > previousStars;
  const rankedUp = newRank > oldRank;
  const isLastLevel = levelId === LEVELS.length;

  useEffect(() => {
    setTimeout(() => setShowAnimation(true), 100);
  }, []);

  return (
    <div className="absolute inset-0 bg-black/90 flex items-center justify-center p-8 pointer-events-auto">
      <div className={`
        max-w-2xl w-full bg-gradient-to-b from-purple-950 to-black p-8 rounded-2xl border-2
        ${stars === 3 ? 'border-yellow-400' : stars === 2 ? 'border-purple-400' : 'border-gray-600'}
        transform transition-all duration-500
        ${showAnimation ? 'scale-100 opacity-100' : 'scale-90 opacity-0'}
      `}>
        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-4xl font-black text-white mb-2">
            {stars === 3 ? '🎉 PERFECT!' : stars === 2 ? '✨ GREAT JOB!' : '✓ LEVEL COMPLETE'}
          </h2>
          <p className="text-xl text-gray-400">{level?.name}</p>
        </div>

        {/* Stars */}
        <div className="flex justify-center gap-4 mb-6">
          {[1, 2, 3].map((starNum) => (
            <div key={starNum} className="relative">
              <Star
                className={`w-16 h-16 transition-all duration-500 delay-${starNum * 100}
                  ${starNum <= stars
                    ? 'text-yellow-400 fill-yellow-400 scale-110 animate-pulse'
                    : 'text-gray-700 fill-gray-900'
                  }
                `}
              />
              {starNum <= stars && earnedNewStar && starNum === stars && (
                <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full font-bold">
                  NEW!
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Score */}
        <div className="bg-black/60 p-6 rounded-xl mb-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <p className="text-gray-400 text-sm">Magical Power</p>
              <p className="text-5xl font-bold text-white">{score.toLocaleString()}</p>
              {isNewBest && (
                <p className="text-green-400 text-sm mt-1 flex items-center gap-1">
                  <TrendingUp className="w-4 h-4" />
                  New Best! (+{(score - previousBestScore).toLocaleString()})
                </p>
              )}
            </div>
            {rankedUp && (
              <div className="text-right">
                <p className="text-yellow-400 text-sm flex items-center gap-1 justify-end">
                  <Trophy className="w-4 h-4" />
                  RANK UP!
                </p>
                <p className="text-2xl font-bold" style={{ color: WIZARD_RANKS[newRank].color }}>
                  {WIZARD_RANKS[newRank].name}
                </p>
              </div>
            )}
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <p className="text-gray-400 text-sm">Accuracy</p>
              <p className="text-2xl font-bold text-white">{Math.round(accuracy * 100)}%</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Best Combo</p>
              <p className="text-2xl font-bold text-purple-400">{maxCombo}x</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Creatures Defeated</p>
              <p className="text-2xl font-bold text-cyan-400">{creaturesDefeated}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Spells Cast</p>
              <p className="text-2xl font-bold text-yellow-400">{totalSpellsCast}</p>
            </div>
          </div>
        </div>

        {/* Spell Breakdown */}
        {totalSpellsCast > 0 && (
          <div className="bg-black/40 p-4 rounded-xl mb-6">
            <p className="text-gray-400 text-sm mb-3">Spells Used</p>
            <div className="grid grid-cols-4 gap-2 text-center">
              {spellsCast.lightning > 0 && (
                <div>
                  <Zap className="w-6 h-6 text-yellow-400 mx-auto mb-1" />
                  <p className="text-white text-sm">{spellsCast.lightning}</p>
                </div>
              )}
              {spellsCast.shield > 0 && (
                <div>
                  <Shield className="w-6 h-6 text-cyan-400 mx-auto mb-1" />
                  <p className="text-white text-sm">{spellsCast.shield}</p>
                </div>
              )}
              {spellsCast.tornado > 0 && (
                <div>
                  <Wind className="w-6 h-6 text-purple-400 mx-auto mb-1" />
                  <p className="text-white text-sm">{spellsCast.tornado}</p>
                </div>
              )}
              {spellsCast.freeze > 0 && (
                <div>
                  <Snowflake className="w-6 h-6 text-blue-400 mx-auto mb-1" />
                  <p className="text-white text-sm">{spellsCast.freeze}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Star Requirements */}
        {stars < 3 && (
          <div className="bg-purple-900/20 p-4 rounded-xl mb-6 border border-purple-500/30">
            <p className="text-purple-300 text-sm font-bold mb-2">⭐ How to Get 3 Stars:</p>
            <ul className="text-gray-400 text-sm space-y-1">
              <li className={accuracy >= 0.9 ? 'text-green-400 line-through' : ''}>
                • 90%+ Accuracy {accuracy >= 0.9 && '✓'}
              </li>
              <li className={maxCombo >= 40 ? 'text-green-400 line-through' : ''}>
                • 40+ Combo {maxCombo >= 40 && '✓'}
              </li>
              <li className={totalSpellsCast >= 2 ? 'text-green-400 line-through' : ''}>
                • Cast 2+ Spells {totalSpellsCast >= 2 && '✓'}
              </li>
            </ul>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            onClick={onLevelSelect}
            className="flex-1 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-lg transition-all"
          >
            Level Select
          </button>
          {stars < 3 && (
            <button
              onClick={onReplay}
              className="flex-1 px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg transition-all hover:scale-105 flex items-center justify-center gap-2"
            >
              <Sparkles className="w-5 h-5" />
              Replay for 3 Stars
            </button>
          )}
          {!isLastLevel && (
            <button
              onClick={onNextLevel}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white font-bold rounded-lg transition-all hover:scale-105"
            >
              Next Level →
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default LevelComplete;
