import { create } from "zustand";

// Interface: Welche Daten und Funktionen hat der Auth-State?
interface AuthState {
	isAuthenticated: boolean;
	isLoading: boolean;
	user: { id: string; name: string; email: string } | null;
	login: (token: string) => void;
	logout: () => void;
}

// create() erstellt einen Zustand-Store.
// Das set() innerhalb von create() aktualisiert den State.
// (Ähnlich wie emit() in einem Flutter Cubit)
export const useAuth = create<AuthState>((set) => ({
	// Startzustand: Prüfe ob schon ein Token gespeichert ist
	// !! konvertiert einen String in boolean ('' → false, 'token123' → true)
	isAuthenticated: !!localStorage.getItem("access_token"),

	// isLoading ist false weil wir erstmal nur localStorage prüfen (synchron)
	// Wenn der echte Auth-Service kommt, wird hier true bis der Token validiert ist
	isLoading: false,

	// user ist null bis wir echte User-Daten vom Server haben
	user: null,

	// login: Token speichern + State als eingeloggt markieren
	login: (token: string) => {
		localStorage.setItem("access_token", token);
		// set() aktualisiert nur die angegebenen Felder, der Rest bleibt
		set({ isAuthenticated: true });
	},

	// logout: Token löschen, State zurücksetzen, zur Login-Seite
	logout: () => {
		localStorage.removeItem("access_token");
		set({ isAuthenticated: false, user: null });
		// Kompletter Seitenreload auf /login (löscht auch den React Query Cache)
		window.location.href = "/login";
	},
}));
