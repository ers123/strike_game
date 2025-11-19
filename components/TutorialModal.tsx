/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import MoveGuide from './MoveGuide';
import { X, Sparkles } from 'lucide-react';

interface TutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TutorialModal: React.FC<TutorialModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-gradient-to-b from-purple-950 to-black max-w-4xl w-full rounded-2xl border-2 border-purple-500/50 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-purple-600/20 p-6 border-b border-purple-500/30 relative">
          <div className="flex items-center justify-center gap-3 mb-2">
            <Sparkles className="w-8 h-8 text-purple-400" />
            <h2 className="text-3xl font-black text-white">🔮 Spell Casting Guide</h2>
            <Sparkles className="w-8 h-8 text-purple-400" />
          </div>
          <p className="text-center text-gray-300">Master these magical gestures to cast powerful spells!</p>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Spell Guides Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <MoveGuide
              move="jump"
              title="⚡ LIGHTNING"
              description="Clears all creatures!"
              color="#eab308"
            />
            <MoveGuide
              move="squat"
              title="🛡️ SHIELD"
              description="Blocks 3 attacks"
              color="#06b6d4"
            />
            <MoveGuide
              move="spin"
              title="🌪️ TORNADO"
              description="Auto-defeats nearby!"
              color="#a855f7"
            />
            <MoveGuide
              move="dab"
              title="❄️ FREEZE"
              description="Mega power boost!"
              color="#3b82f6"
            />
          </div>

          {/* Tips Section */}
          <div className="bg-purple-900/20 rounded-lg p-4 border border-purple-500/30 mb-4">
            <h3 className="text-xl font-bold text-purple-300 mb-3">📜 Wizard Training Tips:</h3>
            <ul className="space-y-2 text-gray-300">
              <li className="flex items-start gap-2">
                <span className="text-purple-400 font-bold">✦</span>
                <span><strong className="text-white">Full body visible:</strong> Stand back so the camera can see all your movements</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400 font-bold">✦</span>
                <span><strong className="text-white">Good lighting:</strong> Bright rooms help detect your spell gestures</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400 font-bold">✦</span>
                <span><strong className="text-white">Strategic spellcasting:</strong> Choose the right spell at the right time!</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400 font-bold">✦</span>
                <span><strong className="text-white">Space to move:</strong> Make sure you have room to perform gestures safely</span>
              </li>
            </ul>
          </div>

          {/* Controls Reminder */}
          <div className="bg-gradient-to-r from-red-900/20 to-blue-900/20 rounded-lg p-4 border border-white/10">
            <h3 className="text-lg font-bold text-white mb-2 text-center">✋ Hand Spell Casting</h3>
            <div className="flex justify-center gap-8">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-red-500/30 border-2 border-red-500 flex items-center justify-center mb-2 mx-auto">
                  <span className="text-2xl font-bold text-red-300">L</span>
                </div>
                <p className="text-sm text-gray-300">Left Hand</p>
                <p className="text-xs text-gray-400">Red creatures</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-blue-500/30 border-2 border-blue-500 flex items-center justify-center mb-2 mx-auto">
                  <span className="text-2xl font-bold text-blue-300">R</span>
                </div>
                <p className="text-sm text-gray-300">Right Hand</p>
                <p className="text-xs text-gray-400">Blue creatures</p>
              </div>
            </div>
          </div>

          {/* Close Button */}
          <div className="mt-6 text-center">
            <button
              onClick={onClose}
              className="bg-purple-600 hover:bg-purple-500 text-white text-lg font-bold py-3 px-8 rounded-full transition-all transform hover:scale-105 shadow-lg"
            >
              Ready to Cast Spells! ✨
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TutorialModal;
