import { Suspense } from "react";
import { Outlet } from "react-router-dom";

import { Header } from "./Header";
import { Sidebar } from "./Sidebar";

// AppLayout ist das Shell-Widget – es bleibt immer sichtbar
// <Outlet /> ist der Platzhalter wo die aktuelle Seite erscheint
export function AppLayout() {
	return (
		// Äußerer Container: Alles nebeneinander (Flexbox)
		<div className="flex min-h-screen bg-surface-container">
			{/* Sidebar links */}
			<Sidebar />

			{/* Rechter Bereich: Header oben, Content darunter */}
			<div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
				<Header />

				{/* main ist das HTML-Element für den Hauptinhalt */}
				{/* <Outlet /> rendert hier die aktuelle Route-Komponente */}
				<main style={{ flex: 1, padding: "24px" }}>
					<Suspense
						fallback={
							<div style={{ padding: "24px" }}>Seite wird geladen...</div>
						}
					>
						<Outlet />
					</Suspense>
				</main>
			</div>
		</div>
	);
}
