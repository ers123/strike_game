# ✨ Spell Slinger Academy

<div align="center">

🧙‍♂️ **A magical gesture-based wizard game for kids** 🧙‍♀️

*Defeat magical creatures with hand spells and unlock powerful body gesture magic!*

</div>

---

## 🎮 About The Game

**Spell Slinger Academy** is an immersive, camera-based action game designed for 4th grade kids (ages 9-10) to play on tablets. Using **hand tracking** and **full-body gesture detection**, players become wizard apprentices learning to defeat magical creatures and cast powerful spells.

### Core Gameplay
- 🤚 **Hand Tracking:** Slash at flying magical creatures (purple & cyan orbs) using your hands as spell sabers
- 🧘 **Body Gestures:** Perform physical movements to cast powerful spells:
  - **Jump** → ⚡ Lightning Spell (clears all creatures)
  - **Squat** → 🛡️ Shield Spell (blocks 3 attacks)
  - **Spin** → 🌪️ Tornado Spell (auto-defeats nearby creatures)
  - **Dab** → ❄️ Freeze Spell (slow-mo + 2x multiplier)

---

## ✨ Features

### 🎓 Progression System
- **5 Academy Year 1 Levels** with increasing difficulty (BPM 120-135)
- **Three-Star Rating System** (1⭐ Complete, 2⭐⭐ Good, 3⭐⭐⭐ Perfect)
- **7 Wizard Ranks:** Novice → Apprentice → Adept → Magus → Master Wizard → Grandmaster → Archmage
- **Sequential Level Unlocking** (complete previous level to unlock next)

### 💾 Persistent Progress
- All progress saved to **localStorage** (no backend required!)
- Tracks:
  - Total score & current rank
  - Stars earned per level
  - Best scores & accuracy
  - Lifetime stats (creatures defeated, spells cast, best combo)

### 🎨 Visual Experience
- **Magical Creatures:** Floating purple & cyan orbs with glowing trails and particle effects
- **Spell Sabers:** Dynamic hand-controlled lightsabers with matching colors
- **Explosion Effects:** Particle bursts when defeating creatures
- **Spell Effects:** Visual tornado, shield, lightning, and freeze animations
- **Optimized for Tablets:** 30 FPS gesture detection, adaptive rendering quality

### 📊 UI/UX
- **Level Select Screen:** Visual grid with stars, lock icons, and stats
- **Level Complete Screen:** Animated star reveal, detailed stats, replay options
- **In-Game HUD:** Health bar, score/combo tracker, active spell indicators, rank progress bar
- **Main Menu:** Current rank display with wizard title and total score

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** (v16 or higher)
- **Modern browser** with camera access (Chrome, Edge, Safari)
- **Camera-enabled device** (laptop with webcam or tablet)

### Local Development

```bash
# 1. Install dependencies
npm install

# 2. Start development server
npm run dev

# 3. Open in browser
# Navigate to http://localhost:5173
# Allow camera permissions when prompted
```

### Build for Production

```bash
# Build optimized production bundle
npm run build

# Preview production build locally
npm run preview
```

---

## 📦 Deployment (Vercel)

### One-Click Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone)

### Manual Deployment

```bash
# 1. Install Vercel CLI
npm i -g vercel

# 2. Deploy
vercel

# 3. Follow prompts to link project and deploy
```

### Vercel Configuration
The project includes `vercel.json` with:
- SPA routing (rewrites all routes to index.html)
- PWA manifest content-type headers
- Security headers (XSS protection, frame options)
- Optimized build settings

**Important:** Vercel provides HTTPS by default, which is **required** for camera access (MediaPipe) to work.

---

## 🛠️ Tech Stack

### Frontend
- **React 18.3.1** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling (via CDN)

### 3D Graphics
- **Three.js** - 3D rendering engine
- **@react-three/fiber** - React renderer for Three.js
- **@react-three/drei** - Helper components and utilities

### Computer Vision
- **MediaPipe (Google)** - Hand tracking & pose detection
  - Hand Landmarker for hand position tracking
  - Pose Landmarker for body gesture detection

### PWA
- **manifest.json** - Progressive Web App configuration
- **Service Worker ready** - Offline support (installable on tablets)

---

## 🎯 Game Mechanics

### Difficulty Progression

| Level | BPM | Creatures | Duration | Features |
|-------|-----|-----------|----------|----------|
| 1 | 120 | 40 | 60s | Simple alternation |
| 2 | 125 | 50 | 65s | More variation |
| 3 | 130 | 55 | 70s | Double hits introduced |
| 4 | 130 | 60 | 70s | Mixed patterns |
| 5 | 135 | 70 | 75s | Fast streams + double hits |

### Star Requirements

| Stars | Requirements |
|-------|-------------|
| ⭐ 1 Star | Complete level (50%+ accuracy) |
| ⭐⭐ 2 Stars | 75%+ accuracy + 20 combo |
| ⭐⭐⭐ 3 Stars | 90%+ accuracy + 40 combo + cast 2 spells |

### Wizard Ranks

| Rank | Score Required | Color |
|------|---------------|-------|
| Novice | 0 | Gray |
| Apprentice | 1,000 | Purple |
| Adept | 5,000 | Purple |
| Magus | 15,000 | Purple (darker) |
| Master Wizard | 35,000 | Purple (darkest) |
| Grandmaster | 75,000 | Dark purple |
| Archmage | 150,000+ | Gold |

---

## 📂 Project Structure

```
strike_game/
├── components/
│   ├── GameScene.tsx         # 3D game world & collision detection
│   ├── Note.tsx               # Magical creature rendering
│   ├── Saber.tsx              # Hand-controlled spell sabers
│   ├── LevelSelect.tsx        # Level selection screen
│   ├── LevelComplete.tsx      # Victory/stats screen
│   ├── TutorialModal.tsx      # Spell guide modal
│   ├── WebcamPreview.tsx      # Camera preview overlay
│   └── MoveGuide.tsx          # Gesture instruction graphics
├── hooks/
│   └── useMediaPipe.ts        # Camera & gesture detection logic
├── public/
│   ├── manifest.json          # PWA configuration
│   ├── og-image.png           # Social media preview (1200x630)
│   ├── icon-192.png           # App icon (192x192)
│   └── icon-512.png           # App icon (512x512)
├── App.tsx                    # Main app with screen navigation
├── progression.ts             # Progression system & persistence
├── constants.ts               # Game configuration & chart generation
├── types.ts                   # TypeScript type definitions
├── index.tsx                  # React entry point
├── index.html                 # HTML entry point
└── vercel.json                # Vercel deployment config
```

---

## 🎨 Customization

### Adjust Difficulty

Edit `progression.ts`:

```typescript
export const LEVELS: LevelConfig[] = [
  {
    id: 1,
    year: 1,
    name: "Welcome to the Academy",
    bpm: 120,              // ← Change BPM (faster = harder)
    duration: 60,          // ← Change duration
    targetCreatures: 40,   // ← Change creature count
    description: "Learn the basics"
  },
  // ... more levels
];
```

### Change Star Requirements

Edit `progression.ts`:

```typescript
export function calculateStars(
  accuracy: number,
  maxCombo: number,
  spellsCast: number
): number {
  let stars = 0;
  if (accuracy >= 0.5) stars = 1;           // ← Adjust accuracy threshold
  if (accuracy >= 0.75 && maxCombo >= 20) stars = 2;  // ← Adjust combo requirement
  if (accuracy >= 0.90 && maxCombo >= 40 && spellsCast >= 2) stars = 3;
  return stars;
}
```

### Modify Spell Effects

Edit `App.tsx` spell activation logic:

```typescript
case 'lightning':
  setActivePowerUp('lightning');
  setPowerUpTimeLeft(1);           // ← Duration in seconds
  setScore(s => s + 500);          // ← Bonus points
  break;
```

---

## 🔧 Performance Optimization

The game is optimized for tablets:

- **MediaPipe throttled to 30 FPS** (reduces CPU/GPU load by 50%)
- **Adaptive render quality** (DPR 1-1.5)
- **Simplified geometry** (spheres instead of complex shapes)
- **Efficient particle systems** (20 particles vs 100+)
- **Frame skipping logic** to maintain smooth gameplay

### Further Optimization Options

In `App.tsx`, adjust Canvas settings:

```typescript
<Canvas
  dpr={[1, 1]}              // Lower for more performance
  performance={{ min: 0.3 }} // Lower quality threshold
  frameloop="demand"         // Render only when needed
/>
```

---

## 🐛 Troubleshooting

### Camera Not Working
- ✅ Ensure HTTPS (required for camera access)
- ✅ Check browser permissions (allow camera in settings)
- ✅ Verify camera not in use by another app
- ✅ Try different browser (Chrome/Edge recommended)

### Gesture Detection Not Responding
- ✅ Ensure good lighting
- ✅ Stand 3-6 feet from camera
- ✅ Perform gestures clearly and slowly
- ✅ Check console for MediaPipe errors

### Audio Not Playing
- ✅ Check browser autoplay policies
- ✅ Interact with page before starting (click button)
- ✅ Verify audio file URL is accessible
- ✅ Check volume/mute settings

### Progress Not Saving
- ✅ Check browser localStorage is enabled
- ✅ Not in incognito/private mode
- ✅ Check browser console for errors
- ✅ Try clearing site data and restarting

---

## 🚧 Future Enhancements

### Planned Features
- [ ] **Years 2-5** (20 more levels with new mechanics)
- [ ] **Badge System** (achievements for spell mastery, combos, etc.)
- [ ] **Cosmetic Unlocks** (spell colors, wand trails, creature skins)
- [ ] **Daily Challenges** (special modifiers with bonus rewards)
- [ ] **Practice Mode** (slow down, loop sections, invincibility)
- [ ] **Leaderboards** (optional backend integration)
- [ ] **More Spells** (additional body gestures)
- [ ] **Story Mode** (narrative progression)

---

## 📄 License

This project is licensed under the Apache 2.0 License.

---

## 🙏 Credits

- **MediaPipe** by Google for hand & pose tracking
- **Three.js** for 3D rendering
- **React Three Fiber** for React integration
- **Lucide React** for icons
- Music: [race2.ogg](https://commondatastorage.googleapis.com/codeskulptor-demos/riceracer_assets/music/race2.ogg) (free to use)

---

## 🎮 Play Now!

Ready to become a wizard? Deploy to Vercel and start your magical training!

**For 4th graders:** Have fun, move your body, and become an Archmage! 🧙‍♂️✨

---

<div align="center">

Made with 💜 for young wizards everywhere

</div>
