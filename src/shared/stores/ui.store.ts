// src/shared/stores/ui.store.ts
import { create } from 'zustand';

interface UIState {
    sidebarOpen: boolean;
    toggleSidebar: () => void;
}

// **Was macht `create`?**
// `create` aus Zustand baut einen Store.Du übergibst eine Funktion, die:
// - Den Anfangszustand definiert(`sidebarOpen: true`)
// - Aktionen definiert, die den Zustand ändern(`toggleSidebar`)

// `set` ist Zustand's Art zu sagen: "Aktualisiere den State."
// `(state) => ({ sidebarOpen: !state.sidebarOpen })` liest den alten Wert
// und kehrt ihn um(`true` → `false`, `false` → `true`).
export const useUIStore = create<UIState>((set) => ({
    sidebarOpen: true,
    toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
}));