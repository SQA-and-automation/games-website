# Cosmic Clash — Game Design Document

## Overview
Transform the ELLIXMMER portfolio site into a playable games platform, starting with **Cosmic Clash** — a top-down vertical space shooter arcade game.

## Gameplay
- **Type**: Top-down vertical scroller (Galaga/Space Invaders style)
- **Progression**: Endless waves with mini-boss every 5 waves, scaling difficulty
- **Controls**: Touch & drag (mobile), mouse drag + keyboard (desktop), auto-fire

## Player
- 3 lives × 3 HP per life
- 2s invincibility on death (sprite flash)
- Hitbox smaller than visual sprite
- Auto-fire continuous

## Enemies (5 types)
| Type | Behavior | First Wave |
|------|----------|------------|
| Drone | Straight down, shoots rarely | 1 |
| Zigzag | S-pattern movement, faster | 3 |
| Tank | Slow, high HP, 3-bullet spread | 5 |
| Kamikaze | Tracks player, explodes on contact | 8 |
| Teleporter | Teleports randomly, shoots laser | 12 |

## Mini-Boss (every 5 waves)
- Large HP bar displayed at top
- 3-phase attack pattern (shoot → spawn minions → enrage at low HP)
- Guaranteed Epic power-up drop
- Increasing complexity with wave number

## Power-ups (9 types, 3 rarities)
### Rarities
- **Common (white)**: 60% drop, 8s duration
- **Rare (blue)**: 25% drop, 12s duration
- **Epic (gold+glow)**: 15% drop, 15s duration

### Items
| Power-up | Rarity | Effect |
|----------|--------|--------|
| Speed Boost | Common | +50% move speed |
| Double Shot | Common | 2 parallel bullets |
| Shield | Common | Absorbs 3 hits, cyan bubble |
| Triple Shot | Rare | 3 bullets in fan |
| Magnet | Rare | Attracts power-ups & points |
| Bomb | Rare | Screen clear, boss damage |
| Drone Companion | Epic | 2 mini-ships follow & shoot |
| Laser Beam | Epic | Continuous devastating laser |
| Slow Motion | Epic | 50% slowdown, player normal speed |

- Max 2 active simultaneously (3rd replaces oldest)
- 20% drop chance from enemies, guaranteed Epic from boss

## Audio (Web Audio API)
- **SFX**: All procedurally generated (shoot, explode, pickup, shield, laser, game over, wave complete)
- **Music**: Procedural synthwave — bass pulse, minor arpeggiator, tempo increases with waves, boss fight intensifies

## Visual Effects
- Parallax star field (3 layers)
- Particle system (explosions, bullet trails)
- Screen shake (explosions, boss damage)
- Screen flash (bomb = white, damage = red)
- Glow auras on power-ups (rarity color)
- Boss entrance warning text

## HUD (React overlay)
- Top bar: lives, wave number, score
- Bottom-left: active power-up timers
- Bottom-right: pause & mute buttons
- Semi-transparent, non-blocking

## Screens
- **Start**: Logo, animated ship, "Tap to Start", best score
- **Pause**: Blur overlay, resume/restart/menu
- **Game Over**: Score count-up, stats (wave, kills, time, power-ups), high score celebration, retry/home

## Score Storage (localStorage)
```json
{
  "cosmicClash": {
    "highScore": 48350,
    "highWave": 12,
    "totalGames": 27,
    "recentScores": [48350, 32100, 28400]
  }
}
```

## Site Integration
- Homepage stays as game hub
- Click game card → navigates to `/play/cosmic-clash`
- Game type gets `playable` flag
- Non-playable games keep modal behavior

## Tech Stack
- HTML5 Canvas for game rendering
- React overlay for HUD/menus
- Web Audio API for all audio
- localStorage for scores
- Next.js App Router for pages
