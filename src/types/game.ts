export interface GameScreenshot {
	src: string;
	alt: string;
}

export interface GameLinks {
	appStore?: string;
	googlePlay?: string;
}

export interface Game {
	id: string;
	name: string;
	tagline: string;
	description: string;
	genre: string;
	icon: string;
	screenshots: GameScreenshot[];
	trailerUrl?: string;
	links: GameLinks;
	rating: number;
	downloads: string;
	releaseYear: number;
	accentColor: string;
	featured: boolean;
}
