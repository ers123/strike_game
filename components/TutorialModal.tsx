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
      <div className="bg-gradient-to-b from-gray-900 to-black max-w-4xl w-full rounded-2xl border-2 border-blue-500/50 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-blue-600/20 p-6 border-b border-blue-500/30 relative">
          <div className="flex items-center justify-center gap-3 mb-2">
            <Sparkles className="w-8 h-8 text-yellow-400" />
            <h2 className="text-3xl font-black text-white">Dance Party Power-Ups!</h2>
            <Sparkles className="w-8 h-8 text-yellow-400" />
          </div>
          <p className="text-center text-gray-300">Perform these dance moves to activate special abilities!</p>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Move Guides Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <MoveGuide
              move="jump"
              title="JUMP"
              description="Slam Attack! Clears all notes"
              color="#fb923c"
            />
            <MoveGuide
              move="squat"
              title="SQUAT"
              description="Shield Bubble! Blocks 3 misses"
              color="#06b6d4"
            />
            <MoveGuide
              move="spin"
              title="SPIN"
              description="Tornado Mode! Auto-hits nearby"
              color="#a855f7"
            />
            <MoveGuide
              move="dab"
              title="DAB"
              description="Mega Boost! 2x multiplier"
              color="#fbbf24"
            />
          </div>

          {/* Tips Section */}
          <div className="bg-blue-900/20 rounded-lg p-4 border border-blue-500/30 mb-4">
            <h3 className="text-xl font-bold text-yellow-400 mb-3">Pro Tips:</h3>
            <ul className="space-y-2 text-gray-300">
              <li className="flex items-start gap-2">
                <span className="text-blue-400 font-bold">•</span>
                <span><strong className="text-white">Stand back!</strong> Make sure your whole body is visible to the camera</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 font-bold">•</span>
                <span><strong className="text-white">Good lighting:</strong> Bright room helps the camera see you better</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 font-bold">•</span>
                <span><strong className="text-white">Timing is key:</strong> Use power-ups when you need them most!</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 font-bold">•</span>
                <span><strong className="text-white">Stay safe:</strong> Make sure you have space to move around</span>
              </li>
            </ul>
          </div>

          {/* Controls Reminder */}
          <div className="bg-gradient-to-r from-red-900/20 to-blue-900/20 rounded-lg p-4 border border-white/10">
            <h3 className="text-lg font-bold text-white mb-2 text-center">Basic Controls</h3>
            <div className="flex justify-center gap-8">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-red-500/30 border-2 border-red-500 flex items-center justify-center mb-2 mx-auto">
                  <span className="text-2xl font-bold text-red-300">L</span>
                </div>
                <p className="text-sm text-gray-300">Left Hand</p>
                <p className="text-xs text-gray-400">Red notes</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-blue-500/30 border-2 border-blue-500 flex items-center justify-center mb-2 mx-auto">
                  <span className="text-2xl font-bold text-blue-300">R</span>
                </div>
                <p className="text-sm text-gray-300">Right Hand</p>
                <p className="text-xs text-gray-400">Blue notes</p>
              </div>
            </div>
          </div>

          {/* Close Button */}
          <div className="mt-6 text-center">
            <button
              onClick={onClose}
              className="bg-blue-600 hover:bg-blue-500 text-white text-lg font-bold py-3 px-8 rounded-full transition-all transform hover:scale-105 shadow-lg"
            >
              Got it! Let's Play! 🎮
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TutorialModal;
