"use client";

import dynamic from "next/dynamic";

const FlowFieldBackground = dynamic(
	() => import("@/components/effects/FlowFieldBackground"),
	{ ssr: false },
);

export default function FlowFieldWrapper() {
	return <FlowFieldBackground />;
}
