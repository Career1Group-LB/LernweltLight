import { create } from "zustand";

// Flutter-Analogie: Cubit<ThemeState>
// Statt emit() wird hier set() verwendet

type Theme = "light" | "dark" | "system";

interface ThemeStore {
	theme: Theme;
	resolvedTheme: "light" | "dark";
	setTheme: (theme: Theme) => void;
}

function resolveTheme(theme: Theme): "light" | "dark" {
	if (theme === "system") {
		return window.matchMedia("(prefers-color-scheme: dark)").matches
			? "dark"
			: "light";
	}
	return theme;
}

function applyTheme(resolved: "light" | "dark") {
	// Setzt data-theme="dark" oder data-theme="light" auf <html>
	// → :root[data-theme='dark'] in tokens.css wird aktiv
	document.documentElement.setAttribute("data-theme", resolved);
}

const savedTheme =
	(localStorage.getItem("lernwelt-theme") as Theme) ?? "system";
const initialResolved = resolveTheme(savedTheme);
applyTheme(initialResolved);

export const useThemeStore = create<ThemeStore>((set) => ({
	theme: savedTheme,
	resolvedTheme: initialResolved,

	setTheme: (theme) => {
		const resolved = resolveTheme(theme);
		applyTheme(resolved);
		localStorage.setItem("lernwelt-theme", theme);
		set({ theme, resolvedTheme: resolved });
	},
}));
