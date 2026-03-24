import type { Game } from "@/types/game";

export const games: Game[] = [
	{
		id: "neon-racers",
		name: "Neon Racers",
		tagline: "Outrun the light.",
		description:
			"Blaze through neon-lit cityscapes in this high-octane racing game. Customize your ride, challenge rivals online, and dominate the leaderboards. With procedurally generated tracks and a pulsing synthwave soundtrack, every race feels fresh.",
		genre: "Racing",
		icon: "/images/games/neon-racers/icon.svg",
		screenshots: [
			{ src: "/images/games/neon-racers/screenshot-1.svg", alt: "Neon city track at night" },
			{ src: "/images/games/neon-racers/screenshot-2.svg", alt: "Garage customization" },
			{ src: "/images/games/neon-racers/screenshot-3.svg", alt: "Multiplayer race" },
		],
		trailerUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
		links: {
			appStore: "https://apps.apple.com",
			googlePlay: "https://play.google.com",
		},
		rating: 4.7,
		downloads: "2M+",
		releaseYear: 2025,
		accentColor: "#00F0FF",
		featured: true,
		playable: true,
	},
	{
		id: "shadow-quest",
		name: "Shadow Quest",
		tagline: "Embrace the darkness.",
		description:
			"An atmospheric action RPG where you wield shadow-based powers to reclaim a world consumed by light corruption. Explore hand-crafted dungeons, unlock ancient abilities, and unravel a story that adapts to your choices.",
		genre: "Action RPG",
		icon: "/images/games/shadow-quest/icon.svg",
		screenshots: [
			{ src: "/images/games/shadow-quest/screenshot-1.svg", alt: "Shadow combat" },
			{ src: "/images/games/shadow-quest/screenshot-2.svg", alt: "Dungeon exploration" },
			{ src: "/images/games/shadow-quest/screenshot-3.svg", alt: "Boss encounter" },
		],
		trailerUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
		links: {
			appStore: "https://apps.apple.com",
			googlePlay: "https://play.google.com",
		},
		rating: 4.5,
		downloads: "1.5M+",
		releaseYear: 2025,
		accentColor: "#7B61FF",
		featured: false,
	},
	{
		id: "pixel-legends",
		name: "Pixel Legends",
		tagline: "Build. Battle. Conquer.",
		description:
			"A strategic base-builder with real-time multiplayer battles. Recruit legendary pixel heroes, fortify your kingdom, and wage war against players worldwide. Every decision shapes your empire's destiny.",
		genre: "Strategy",
		icon: "/images/games/pixel-legends/icon.svg",
		screenshots: [
			{ src: "/images/games/pixel-legends/screenshot-1.svg", alt: "Base building" },
			{ src: "/images/games/pixel-legends/screenshot-2.svg", alt: "Battle formation" },
			{ src: "/images/games/pixel-legends/screenshot-3.svg", alt: "Hero roster" },
		],
		links: {
			appStore: "https://apps.apple.com",
			googlePlay: "https://play.google.com",
		},
		rating: 4.3,
		downloads: "800K+",
		releaseYear: 2024,
		accentColor: "#39FF14",
		featured: false,
	},
	{
		id: "cosmic-clash",
		name: "Cosmic Clash",
		tagline: "The galaxy needs a hero.",
		description:
			"Fast-paced space shooter with procedurally generated levels and an arsenal of devastating weapons. Fight through alien armadas, collect power-ups, and face titanic bosses. Endless mode ensures infinite replayability.",
		genre: "Arcade",
		icon: "/images/games/cosmic-clash/icon.svg",
		screenshots: [
			{ src: "/images/games/cosmic-clash/screenshot-1.svg", alt: "Space battle" },
			{ src: "/images/games/cosmic-clash/screenshot-2.svg", alt: "Boss fight" },
			{ src: "/images/games/cosmic-clash/screenshot-3.svg", alt: "Power-up selection" },
		],
		trailerUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
		links: {
			googlePlay: "https://play.google.com",
		},
		rating: 4.6,
		downloads: "500K+",
		releaseYear: 2026,
		accentColor: "#FF00E5",
		featured: true,
		playable: true,
	},
];
