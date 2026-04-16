// src/shared/components/Logo.tsx

import logoDark from "@/assets/logos/placeholder-dark.svg";
import logoLight from "@/assets/logos/placeholder-light.svg";
import { useThemeStore } from "@/shared/stores/theme.store";

interface LogoProps {
	/** Breite in px – Höhe passt sich proportional an */
	width?: number;
	className?: string;
}

export function Logo({ width = 120, className }: LogoProps) {
	const { resolvedTheme } = useThemeStore();

	// Jetzt: statischer Platzhalter – später kommt die URL aus der Backend-Config
	const logoSrc = resolvedTheme === "dark" ? logoDark : logoLight;

	return (
		<img
			src={logoSrc}
			alt="Lernwelt"
			width={width}
			// height wird nicht gesetzt → Bild passt Höhe proportional zur Breite an
			className={className}
		/>
	);
}
