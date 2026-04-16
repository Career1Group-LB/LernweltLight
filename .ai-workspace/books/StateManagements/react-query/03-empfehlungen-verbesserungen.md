# Empfehlungen & Verbesserungen basierend auf dem Buch

## Priorität 1: Jetzt umsetzen

### 1.1 Query Key Factory einführen

Das Buch empfiehlt in Kapitel 8 dringend eine zentrale Query-Key-Verwaltung.
Aktuell sind Query Keys als String-Arrays über die Hooks verstreut. Das wird
bei wachsendem Codebase unübersichtlich.

**Vorschlag:** `src/shared/utils/queryKeys.ts`

```typescript
export const queryKeys = {
    courses: {
        all: () => ['courses'] as const,
        detail: (id: string) => ['courses', id] as const,
        modules: (id: string) => ['courses', id, 'modules'] as const,
    },
    progress: {
        byCourse: (courseId: string) => ['progress', courseId] as const,
    },
    config: {
        all: () => ['config'] as const,
    },
    profile: {
        current: () => ['profile'] as const,
    },
    quiz: {
        detail: (id: string) => ['quiz', id] as const,
        results: (id: string) => ['quiz', id, 'results'] as const,
    },
} as const;
```

**Vorteile:**

- Typsicherheit durch `as const`
- Kein Risiko von Tippfehlern in Query Keys
- Einfache Invalidierung ganzer Hierarchien
- Bessere Refactoring-Sicherheit

### 1.2 `useAuth` Store bereinigen

1. **Umbenennen** nach `useAuthStore` (Konvention aus AGENTS.md)
2. **Verschieben** nach `src/shared/stores/auth.store.ts` (statt `features/auth/hooks/`)
3. **`user`-Feld entfernen** → User-Profil über React Query laden:

```typescript
// shared/stores/auth.store.ts
interface AuthStore {
    isAuthenticated: boolean;
    login: (token: string) => void;
    logout: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
    isAuthenticated: !!localStorage.getItem('access_token'),
    login: (token) => {
        localStorage.setItem('access_token', token);
        set({ isAuthenticated: true });
    },
    logout: () => {
        localStorage.removeItem('access_token');
        set({ isAuthenticated: false });
        window.location.href = '/login';
    },
}));
```

```typescript
// features/profile/hooks/useCurrentUser.ts
export function useCurrentUser() {
    return useQuery({
        queryKey: queryKeys.profile.current(),
        queryFn: profileApi.getCurrentUser,
    });
}
```

### 1.3 `refetchOnWindowFocus` für Production aktivieren

Das Buch macht klar (Kap. 4), dass `refetchOnWindowFocus` eines der
leistungsfähigsten Features von React Query ist. Empfehlung:

```typescript
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 1000 * 60 * 5,
            retry: 1,
            // In Production: true (User kommt zurück → frische Daten)
            // Nur in Dev auf false setzen wenn es nervt
            refetchOnWindowFocus: import.meta.env.PROD,
        },
    },
});
```

---

## Priorität 2: Bald umsetzen

### 2.1 Test-Utils Pattern aufsetzen (Kap. 8)

Das Buch empfiehlt eine zentrale `test-utils.ts` Datei:

```typescript
// src/test/test-utils.tsx
import { render, type RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactElement, ReactNode } from 'react';

function createTestQueryClient() {
    return new QueryClient({
        defaultOptions: {
            queries: {
                retry: 0,
                gcTime: Infinity,
            },
        },
    });
}

function AllTheProviders({ children }: { children: ReactNode }) {
    const queryClient = createTestQueryClient();
    return (
        <QueryClientProvider client={queryClient}>
            {children}
        </QueryClientProvider>
    );
}

function customRender(ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) {
    return render(ui, { wrapper: AllTheProviders, ...options });
}

export * from '@testing-library/react';
export { customRender as render };
```

**Wichtig:** `QueryClient` **innerhalb** des Wrappers erstellen (nicht global),
damit Tests isoliert sind (Kap. 8, S. 153).

### 2.2 Mutation-Pattern für Invalidierung standardisieren

Aktuell fehlt in `useLogin` die Query-Invalidierung. Bei Mutations, die
Server State ändern, sollte im `onSuccess` immer invalidiert werden:

```typescript
// Pattern aus Kap. 6
const queryClient = useQueryClient();

return useMutation({
    mutationFn: someApi.update,
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.courses.all() });
    },
});
```

### 2.3 MSW Request Handler für alle API-Routen vorbereiten

Das Buch (Kap. 8) empfiehlt, von Anfang an MSW-Handler pro Feature-Domain
zu erstellen. Da MSW (`^2.12.10`) bereits installiert ist:

```
src/
├── mocks/
│   ├── handlers/
│   │   ├── courses.handlers.ts
│   │   ├── auth.handlers.ts
│   │   └── config.handlers.ts
│   ├── server.ts
│   └── browser.ts   ← Optional: für Dev-Mocking vor Backend
```

---

## Priorität 3: Langfristig beachten

### 3.1 Optimistic Updates (wenn benötigt)

Das Buch zeigt zwei Wege (Kap. 6 + Kap. 9):

**v4-Weg (Cache-basiert):** `onMutate` → Cache updaten → `onError` → Rollback

**v5-Weg (UI-basiert, neu):** `mutation.isPending` + `mutation.variables` →
kein Cache-Manipulation nötig, weniger fehleranfällig.

Empfehlung: Den v5-Weg bevorzugen, da euer Projekt React Query v5 nutzt.

### 3.2 Error Handling standardisieren

Laut Buch (Kap. 3) können globale Error-Handler über `MutationCache` und
`QueryCache` konfiguriert werden:

```typescript
const queryClient = new QueryClient({
    queryCache: new QueryCache({
        onError: (error) => {
            // Globaler Toast/Notification bei Query-Fehlern
        },
    }),
    mutationCache: new MutationCache({
        onError: (error) => {
            // Globaler Toast/Notification bei Mutation-Fehlern
        },
    }),
});
```

### 3.3 React Query Devtools in Production (optional)

Das Buch (Kap. 3) zeigt, wie man Devtools lazy in Production laden kann:

```typescript
const ReactQueryDevtoolsProduction = lazy(() =>
    import('@tanstack/react-query-devtools/production').then((d) => ({
        default: d.ReactQueryDevtools,
    }))
);
```

Aktiviert über `window.toggleDevtools()` in der Browser-Console.
