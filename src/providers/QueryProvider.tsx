import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import type { ReactNode } from "react";

// QueryClient einmal erstellen – das ist der zentrale Cache für alle Server-Daten
const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			// TODO: Check das nochmal, warum wird hier mit 5 Minuten gearbeitet?
			// staleTime: Wie lange gelten Daten als "frisch"?
			// 5 Minuten = React Query holt nicht nochmal vom Server,
			// wenn die Daten kürzer als 5 Minuten alt sind
			staleTime: 1000 * 60 * 5,

			// retry: Bei einem fehlgeschlagenen Request – wie oft nochmal versuchen?
			// 1 = einmal wiederholen, dann aufgeben
			retry: 1,

			// refetchOnWindowFocus: false = Nicht neu laden wenn User
			// von einem anderen Browser-Tab zurückkommt
			// (Standard ist true, was oft nervig ist während der Entwicklung)
			refetchOnWindowFocus: false,
		},
	},
});

// ReactNode ist der TypeScript-Typ für "alles was React rendern kann"
// (JSX, Strings, Arrays, null, etc.)
interface QueryProviderProps {
	children: ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
	return (
		// QueryClientProvider macht den queryClient für alle Kind-Komponenten verfügbar
		<QueryClientProvider client={queryClient}>
			{children}

			{/* ReactQueryDevtools: Zeigt im Browser ein Debug-Panel
          – nur in Development sichtbar, in Production automatisch ausgeblendet
          initialIsOpen={false}: Das Panel ist beim Start zugeklappt */}
			<ReactQueryDevtools initialIsOpen={false} />
		</QueryClientProvider>
	);
}
