import { Navigate } from "react-router-dom";

import { useAuth } from "@/features/auth/hooks/useAuth";

interface ProtectedRouteProps {
	children: React.ReactNode;
}

// ProtectedRoute ist eine "Guard-Komponente" – sie prüft ob der User
// eingeloggt ist bevor sie den Inhalt anzeigt.
//
// Flutter-Analogie: AutoRoute Guard
// @override
// Future<RouteData?> redirect(BuildContext context, RouteData data) async {
//   if (!isAuthenticated) return LoginRoute();
//   return null;
// }
export function ProtectedRoute({ children }: ProtectedRouteProps) {
	const { isAuthenticated, isLoading } = useAuth();

	// Noch beim Laden (z.B. Token aus Storage prüfen) → Warte-Bildschirm
	if (isLoading) {
		return <div>Authentifizierung wird geprüft...</div>;
	}

	// Nicht eingeloggt → sofort zur Login-Seite umleiten
	// "replace" bedeutet: Der /login-Eintrag ersetzt die aktuelle URL im Browser-Verlauf
	// (so kann der User nicht den Browser-Zurück-Button nutzen um wieder reinzukommen)
	if (!isAuthenticated) {
		return <Navigate to="/login" replace />;
	}

	// Eingeloggt → Inhalt anzeigen
	return <>{children}</>;
}
