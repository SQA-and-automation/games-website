import type { Variants } from "framer-motion";

export const fadeInUp: Variants = {
	hidden: { opacity: 0, y: 30 },
	visible: {
		opacity: 1,
		y: 0,
		transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
	},
};

export const fadeIn: Variants = {
	hidden: { opacity: 0 },
	visible: {
		opacity: 1,
		transition: { duration: 0.5 },
	},
};

export const staggerContainer: Variants = {
	hidden: {},
	visible: {
		transition: {
			staggerChildren: 0.1,
			delayChildren: 0.2,
		},
	},
};

export const scaleIn: Variants = {
	hidden: { opacity: 0, scale: 0.9 },
	visible: {
		opacity: 1,
		scale: 1,
		transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] },
	},
};

export const modalOverlay: Variants = {
	hidden: { opacity: 0 },
	visible: { opacity: 1 },
	exit: { opacity: 0 },
};

export const modalContent: Variants = {
	hidden: { opacity: 0, scale: 0.85, y: 40 },
	visible: {
		opacity: 1,
		scale: 1,
		y: 0,
		transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] },
	},
	exit: {
		opacity: 0,
		scale: 0.9,
		y: 20,
		transition: { duration: 0.25 },
	},
};

export const heroStagger: Variants = {
	hidden: {},
	visible: {
		transition: {
			staggerChildren: 0.2,
			delayChildren: 0.3,
		},
	},
};

export const heroItem: Variants = {
	hidden: { opacity: 0, y: 20, scale: 0.95 },
	visible: {
		opacity: 1,
		y: 0,
		scale: 1,
		transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
	},
};
