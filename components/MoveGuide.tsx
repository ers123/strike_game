/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { BodyMovement } from '../hooks/useMediaPipe';

interface MoveGuideProps {
  move: 'jump' | 'squat' | 'spin' | 'dab';
  title: string;
  description: string;
  color: string;
}

const MoveGuide: React.FC<MoveGuideProps> = ({ move, title, description, color }) => {

  // Simple stick figure SVG illustrations
  const renderIllustration = () => {
    const headRadius = 12;
    const bodyLength = 40;
    const limbLength = 25;

    switch (move) {
      case 'jump':
        return (
          <svg viewBox="0 0 100 120" className="w-full h-full">
            {/* Person jumping - arms up, legs down */}
            {/* Head */}
            <circle cx="50" cy="20" r={headRadius} fill={color} />
            {/* Body */}
            <line x1="50" y1="32" x2="50" y2="72" stroke={color} strokeWidth="3" strokeLinecap="round" />
            {/* Arms up */}
            <line x1="50" y1="35" x2="30" y2="25" stroke={color} strokeWidth="3" strokeLinecap="round" />
            <line x1="50" y1="35" x2="70" y2="25" stroke={color} strokeWidth="3" strokeLinecap="round" />
            {/* Legs straight down */}
            <line x1="50" y1="72" x2="40" y2="95" stroke={color} strokeWidth="3" strokeLinecap="round" />
            <line x1="50" y1="72" x2="60" y2="95" stroke={color} strokeWidth="3" strokeLinecap="round" />
            {/* Motion lines */}
            <path d="M 25 50 Q 20 60 25 70" stroke={color} strokeWidth="2" fill="none" opacity="0.5" />
            <path d="M 75 50 Q 80 60 75 70" stroke={color} strokeWidth="2" fill="none" opacity="0.5" />
            {/* Arrow pointing up */}
            <path d="M 50 110 L 50 100 M 50 100 L 45 105 M 50 100 L 55 105" stroke={color} strokeWidth="2" fill="none" />
          </svg>
        );

      case 'squat':
        return (
          <svg viewBox="0 0 100 120" className="w-full h-full">
            {/* Person squatting - bent knees, arms forward */}
            {/* Head */}
            <circle cx="50" cy="40" r={headRadius} fill={color} />
            {/* Body angled */}
            <line x1="50" y1="52" x2="50" y2="80" stroke={color} strokeWidth="3" strokeLinecap="round" />
            {/* Arms forward */}
            <line x1="50" y1="55" x2="25" y2="65" stroke={color} strokeWidth="3" strokeLinecap="round" />
            <line x1="50" y1="55" x2="75" y2="65" stroke={color} strokeWidth="3" strokeLinecap="round" />
            {/* Legs bent */}
            <line x1="50" y1="80" x2="35" y2="95" stroke={color} strokeWidth="3" strokeLinecap="round" />
            <line x1="35" y1="95" x2="30" y2="105" stroke={color} strokeWidth="3" strokeLinecap="round" />
            <line x1="50" y1="80" x2="65" y2="95" stroke={color} strokeWidth="3" strokeLinecap="round" />
            <line x1="65" y1="95" x2="70" y2="105" stroke={color} strokeWidth="3" strokeLinecap="round" />
            {/* Arrow pointing down */}
            <path d="M 85 40 L 85 50 M 85 50 L 80 45 M 85 50 L 90 45" stroke={color} strokeWidth="2" fill="none" />
          </svg>
        );

      case 'spin':
        return (
          <svg viewBox="0 0 100 120" className="w-full h-full">
            {/* Person spinning - motion blur effect */}
            {/* Head */}
            <circle cx="50" cy="30" r={headRadius} fill={color} />
            {/* Body */}
            <line x1="50" y1="42" x2="50" y2="75" stroke={color} strokeWidth="3" strokeLinecap="round" />
            {/* Arms out spinning */}
            <line x1="50" y1="50" x2="25" y2="50" stroke={color} strokeWidth="3" strokeLinecap="round" opacity="0.7" />
            <line x1="50" y1="50" x2="75" y2="50" stroke={color} strokeWidth="3" strokeLinecap="round" />
            {/* Legs */}
            <line x1="50" y1="75" x2="40" y2="100" stroke={color} strokeWidth="3" strokeLinecap="round" />
            <line x1="50" y1="75" x2="60" y2="100" stroke={color} strokeWidth="3" strokeLinecap="round" />
            {/* Circular motion arrows */}
            <path
              d="M 75 30 A 25 25 0 0 1 75 70"
              stroke={color}
              strokeWidth="2"
              fill="none"
              opacity="0.6"
              markerEnd="url(#arrowhead)"
            />
            <path
              d="M 25 70 A 25 25 0 0 1 25 30"
              stroke={color}
              strokeWidth="2"
              fill="none"
              opacity="0.6"
            />
            <defs>
              <marker id="arrowhead" markerWidth="10" markerHeight="10" refX="5" refY="3" orient="auto">
                <polygon points="0 0, 6 3, 0 6" fill={color} />
              </marker>
            </defs>
          </svg>
        );

      case 'dab':
        return (
          <svg viewBox="0 0 100 120" className="w-full h-full">
            {/* Person dabbing - one arm across face, one out */}
            {/* Head */}
            <circle cx="45" cy="30" r={headRadius} fill={color} />
            {/* Body tilted */}
            <line x1="45" y1="42" x2="50" y2="75" stroke={color} strokeWidth="3" strokeLinecap="round" />
            {/* Left arm across face */}
            <line x1="45" y1="45" x2="35" y2="28" stroke={color} strokeWidth="3" strokeLinecap="round" />
            {/* Right arm pointing out */}
            <line x1="48" y1="48" x2="75" y2="60" stroke={color} strokeWidth="3" strokeLinecap="round" />
            <line x1="75" y1="60" x2="90" y2="65" stroke={color} strokeWidth="3" strokeLinecap="round" />
            {/* Legs */}
            <line x1="50" y1="75" x2="45" y2="100" stroke={color} strokeWidth="3" strokeLinecap="round" />
            <line x1="50" y1="75" x2="60" y2="100" stroke={color} strokeWidth="3" strokeLinecap="round" />
            {/* Cool effect lines */}
            <line x1="92" y1="63" x2="95" y2="65" stroke={color} strokeWidth="2" opacity="0.5" />
            <line x1="92" y1="67" x2="95" y2="69" stroke={color} strokeWidth="2" opacity="0.5" />
          </svg>
        );
    }
  };

  return (
    <div className="flex flex-col items-center p-4 bg-black/40 rounded-lg border border-white/10 hover:border-white/30 transition-all">
      <div className="w-24 h-24 mb-3">
        {renderIllustration()}
      </div>
      <h3 className="text-lg font-bold mb-1" style={{ color }}>{title}</h3>
      <p className="text-xs text-gray-300 text-center">{description}</p>
    </div>
  );
};

export default MoveGuide;
