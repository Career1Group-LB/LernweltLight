# Zusammenfassung: "State Management with React Query" (Daniel Afonso, 2023)

> **Wichtig:** Der Dateiname `zustand.txt` ist irreführend – das Buch behandelt
> **TanStack React Query** (Server State), nicht Zustand (Client State). Zustand
> wird nur im Kapitel 1 kurz als Client-State-Alternative erwähnt.

## Kernthese des Buches

Der zentrale Fehler, den viele React-Projekte machen: **Server State und Client
State werden in denselben globalen State gemischt.** Das führt zu aufgeblähtem
Code, unnötigen Re-Renders und selbstgebauten Lösungen für Probleme, die
React Query bereits löst.

### Die zwei Arten von State

| Eigenschaft | Client State | Server State |
|---|---|---|
| **Zugriff** | Synchron | Asynchron (API-Calls) |
| **Ort** | Nur in der App | Remote (Datenbank) |
| **Persistenz** | Geht bei Reload verloren (wenn nicht im localStorage) | Bleibt bestehen |
| **Eigentum** | App ist alleiniger Besitzer | Geteilt (andere User können es ändern) |
| **Tool** | Zustand, useState, useReducer | React Query |

## Kapitelweise Kernerkenntnisse

### Kap. 1–2: State-Grundlagen

- `useState` für einfachen State, `useReducer` für komplexen State
- React Context hat Re-Render-Probleme: Jeder Consumer re-rendert bei
  **jeder** State-Änderung im Context, auch wenn er nur einen Teil nutzt
- Zustand wird als "simpleste Lösung" mit Hook-First-Ansatz gelobt

### Kap. 3: React Query Setup

- `QueryClient` = Schnittstelle zwischen Entwickler und Cache
- `QueryClientProvider` nutzt React Context intern
- `QueryCache` (für Queries) und `MutationCache` (für Mutations) managen den Cache
- `defaultOptions` erlauben globale Konfiguration für alle Queries/Mutations

### Kap. 4: Data Fetching mit `useQuery`

- **Query Key** = eindeutiger Identifier + Cache-Key + Dependency Array
  - Muss ein Array sein
  - Wird deterministisch gehasht (Reihenfolge der Array-Items zählt, Objekt-Reihenfolge nicht)
  - Alle Query-Abhängigkeiten gehören in den Query Key
- **Query Function** = Promise-basiert, unterstützt REST und GraphQL
- **Wichtige Returns:** `data`, `error`, `status` (`pending`/`error`/`success`), `fetchStatus` (`fetching`/`paused`/`idle`)
- **Wichtige Defaults (v4):**
  - `staleTime: 0` (alles sofort stale)
  - `cacheTime: 5 min` (→ in v5: `gcTime`)
  - `retry: 3`
  - `enabled: true`
  - `refetchOnWindowFocus: true`
  - `refetchOnMount: true`
  - `refetchOnReconnect: true`

### Kap. 5: Erweiterte Patterns

- **Parallele Queries:** Mehrere `useQuery` nebeneinander oder `useQueries` für dynamische Anzahl
- **Query Invalidation:** `queryClient.invalidateQueries()` – markiert als stale und triggert Refetch
- **Prefetching:** `queryClient.prefetchQuery()` – z.B. bei Mouse-Hover vor dem Klick
- **Query Cancelation:** `AbortSignal` an den HTTP-Client weiterreichen
- **Pagination:** `keepPreviousData: true` (v4) → `placeholderData: keepPreviousData` (v5)
- **Infinite Queries:** `useInfiniteQuery` mit `getNextPageParam`

### Kap. 6: Mutations mit `useMutation`

- Wird **nicht** automatisch ausgeführt – nur über `mutate()` oder `mutateAsync()`
- Callbacks: `onMutate`, `onSuccess`, `onError`, `onSettled`
- `mutate()` kann zusätzlich eigene Callbacks erhalten (laufen nach Hook-Callbacks)
- **Best Practice nach Mutation:**
  `onSuccess: () => queryClient.invalidateQueries({ queryKey: [...] })`
- **Optimistic Updates:**
  1. `onMutate`: Cancel laufende Queries, alten Cache sichern, Cache optimistisch updaten
  2. `onError`: Rollback zum gesicherten State
  3. `onSettled`: Query invalidieren für finalen Refetch

### Kap. 7: SSR (Next.js / Remix)

- Zwei Patterns: `initialData` und `hydrate`
- `initialData`: Daten auf Server fetchen → als Prop an `useQuery` übergeben
- `hydrate`: `QueryClient` auf Server prefetchen → `dehydrate()` → Client hydrated

### Kap. 8: Testing

- **MSW (Mock Service Worker):** Netzwerk-Level Mocking statt Client-Mocking
- **Test-Utils Pattern:** Custom `render` Funktion die `QueryClientProvider` wrapppt
- **Best Practice:** QueryClient **innerhalb** der render-Funktion erstellen (Isolation zwischen Tests)
- **Query-Test-Defaults:** `retry: 0`, `gcTime: Infinity`
- User-zentriert testen (was sieht der User?), nicht Implementation Details

### Kap. 9: v5 Breaking Changes

| v4 | v5 |
|---|---|
| `isLoading` (initial) | `isPending` |
| `cacheTime` | `gcTime` |
| `keepPreviousData` | `placeholderData: keepPreviousData` |
| `Hydrate` | `HydrationBoundary` |
| Logger konfigurierbar | Logger entfernt |
| Overloaded Hook-Syntax erlaubt | Nur Object-Format |
| `isInitialLoading` | Deprecated → `isLoading = isPending && isFetching` |
| Optimistic Updates nur via Cache | Auch via `mutation.variables` + `isPending` |
| `useInfiniteQuery` ohne `maxPages` | `maxPages` + `defaultPageParam` (required) |
