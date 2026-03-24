# Neon Racers — Game Design Document

## Overview
Pseudo-3D endless racing game (OutRun style) for the ELLIXMMER games platform. Built with Phaser 3. Neon cyberpunk aesthetic.

## Core Gameplay
- **Perspective**: Behind-the-car pseudo-3D, road toward horizon with procedural curves
- **Mechanic**: Weave through traffic, overtake for points, collect coins, avoid crashes
- **Controls**: Touch slider X-axis (mobile), Arrow/WASD (desktop), nitro button
- **Crashes**: Hit a car = lose speed + reset combo. 3 crashes = game over (varies by vehicle)

## Scoring
- 1 point per meter distance
- 50 points per overtake
- 150 points near-miss bonus (<10px gap)
- Combo multiplier (x2-x5) on consecutive overtakes
- Coins on road: bonus score + persistent currency for unlocks

## Vehicles (5, unlocked with coins)
| Vehicle | Speed | Handling | Durability | Cost | Special |
|---------|-------|----------|------------|------|---------|
| Sportcar | 3 | 3 | 3 | Free | Balanced |
| Moto | 5 | 4 | 1 | 2000 | Tiny hitbox, 1 crash = game over |
| Truck | 2 | 2 | 5 | 5000 | 5 crashes, pushes small cars |
| Hovercraft | 4 | 3 | 2 | 15000 | Ignores potholes & debris |
| Police Car | 4 | 3 | 4 | 30000 | Siren pushes traffic aside |

Unlocks persist in localStorage. Coins accumulate across runs.

## Power-ups
| Power-up | Effect | Duration |
|----------|--------|----------|
| Nitro | +80% speed, light trails | 3s |
| Shield | Absorbs 1 crash | Single hit |
| Ghost Mode | Pass through traffic | 4s |
| Slow Motion | Traffic 50% slower | 5s |
| Coin Magnet | Attracts coins from full width | 6s |

## Zones (1000m each, cycle with +20% speed)
| Zone | Distance | Theme | Unique Obstacles |
|------|----------|-------|-----------------|
| Neon City | 0-999m | Skyscrapers, cyan+magenta | Taxis, sedans, cyclists |
| Highway | 1000-1999m | Billboards, blue+orange | Trucks, fast motos |
| Desert | 2000-2999m | Canyons, magenta+green | Rocks, tumbleweeds, sand |
| Neon Tunnel | 3000-3999m | Grid walls, red+gold | Laser barriers, turrets |

After 4000m: zones repeat with increased difficulty.

## Pseudo-3D Rendering
- Road drawn scanline by scanline (bottom=near, top=far)
- Curves simulated via cumulative horizontal offset per scanline
- Traffic NPCs scale with distance (small at horizon, full size near player)
- Player sprite fixed at bottom, moves left-right, tilts with direction

## Visual Effects
- Speed lines at high velocity
- Road edge glow in zone color
- Nitro light trails (cyan streaks)
- Near-miss white flash
- Crash screen shake + red flash + debris particles
- Coin sparkle particles
- Zone transition color wash
- Horizon glow pulsing with music

## Audio (Web Audio API, layered adaptive)
- Base layer always plays (bass pad)
- Drums added at medium speed
- Lead synth at high speed
- Arpeggiator at nitro/max speed
- Engine SFX pitch scales with speed
- Crash, overtake, coin, power-up SFX

## HUD (React overlay)
- Top: speed (km/h) + distance (meters)
- Top-right: combo indicator
- Bottom-left: active power-up timer
- Bottom-right: coins counter + nitro button (mobile)
- Center-bottom: crash hearts

## Screens
- **Start**: Title, vehicle selector (swipe), locked vehicles show price, TAP TO RACE
- **Game Over**: Distance count-up, stats (overtakes, near-misses, coins, zone), coins earned → total animation, retry/change vehicle/home

## localStorage
```json
{
  "neonRacers": {
    "totalCoins": 12450,
    "bestDistance": 4230,
    "bestZone": "Neon Tunnel",
    "unlockedVehicles": ["sportcar", "moto"],
    "selectedVehicle": "moto",
    "totalRuns": 42
  }
}
```

## Tech Stack
- Phaser 3 (game engine)
- Next.js page at /play/neon-racers
- React HUD overlay
- Web Audio API for adaptive music + SFX
- Canvas rendering (Phaser manages)
