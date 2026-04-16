import axios from "axios";

// import.meta.env.VITE_API_BASE_URL liest aus der .env Datei
// || 'http://localhost:3000' ist der Fallback wenn nichts in .env steht
const API_BASE_URL =
	import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

// axios.create() macht eine konfigurierte Axios-Instanz
// (statt axios direkt zu nutzen, haben wir so unsere eigene Instanz mit Defaults)
export const apiClient = axios.create({
	baseURL: API_BASE_URL,
	headers: {
		"Content-Type": "application/json",
	},
});

// ─── REQUEST INTERCEPTOR ────────────────────────────────────────────────────
// Wird vor JEDEM ausgehenden Request aufgerufen
// Aufgabe: Auth-Token an den Request hängen
apiClient.interceptors.request.use((config) => {
	// localStorage ist der Browser-Speicher (wie SharedPreferences in Flutter)
	const token = localStorage.getItem("access_token");

	if (token) {
		// Authorization Header hinzufügen
		// Das Backend erwartet: "Bearer <token>"
		config.headers.Authorization = `Bearer ${token}`;
	}

	// config zurückgeben – ohne return wird der Request abgebrochen!
	return config;
});

// ─── RESPONSE INTERCEPTOR ───────────────────────────────────────────────────
// Wird nach JEDER eingehenden Response aufgerufen
// Erster Parameter: Was passiert bei Erfolg (Status 200-299)
// Zweiter Parameter: Was passiert bei Fehler (Status 400+)
apiClient.interceptors.response.use(
	// Erfolg: Response einfach durchleiten, nichts verändern
	(response) => response,

	// Fehler: Prüfen was der Fehler ist
	(error) => {
		if (error.response?.status === 401) {
			// 401 = "Unauthorized" = Token abgelaufen oder ungültig
			// Token löschen und zur Login-Seite schicken
			localStorage.removeItem("access_token");
			window.location.href = "/login";
		}
		// Fehler weiterwerfen, damit der aufrufende Code ihn auch sieht
		return Promise.reject(error);
	},
);
