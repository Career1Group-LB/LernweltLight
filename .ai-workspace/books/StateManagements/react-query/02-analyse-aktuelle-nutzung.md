# Analyse: Aktuelle State-Management-Nutzung im LernweltLight-Codebase

## Überblick

Das Projekt nutzt die **richtige Kombination** aus dem Buch:

- **React Query v5** (`@tanstack/react-query: ^5.90.21`) für Server State
- **Zustand v5** (`zustand: ^5.0.11`) für Client State

Das entspricht genau der Empfehlung des Buches (Kap. 2): Server State und
Client State konsequent trennen.

---

## 1. Zustand Stores – Bewertung

### `ui.store.ts` – UI State

```typescript
export const useUIStore = create<UIState>((set) => ({
    sidebarOpen: true,
    toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
}));
```

**Bewertung: ✅ Korrekt**

- Reiner Client State (synchron, lokal, nicht persistent)
- Zustand ist die richtige Wahl laut Buch (Kap. 2, S. 19–20)
- Saubere, minimale API
- Ein Store pro Zuständigkeit (Single Responsibility)

### `theme.store.ts` – Theme State

```typescript
export const useThemeStore = create<ThemeStore>((set) => ({
    theme: savedTheme,
    resolvedTheme: initialResolved,
    setTheme: (theme) => {
        const resolved = resolveTheme(theme);
        applyTheme(resolved);
        localStorage.setItem('lernwelt-theme', theme);
        set({ theme, resolvedTheme: resolved });
    },
}));
```

**Bewertung: ✅ Korrekt**

- Client State mit localStorage-Persistenz → genau wie im Buch beschrieben
  (Kap. 2: Theme gehört zum Client State)
- Side Effects (`applyTheme`, `localStorage`) innerhalb der Action
- `resolveTheme()` als Hilfsfunktion außerhalb des Stores → sauber

**Kleinere Verbesserungsmöglichkeiten:**

- Die Top-Level-Ausführung (`const savedTheme = ...`, `applyTheme(initialResolved)`)
  läuft beim **Module-Load**. Das ist gewollt (SSR-freies Vite-Projekt), aber man
  sollte sich bewusst sein, dass das bei SSR-Migration Probleme machen würde.

### `useAuth` (in `features/auth/hooks/useAuth.ts`) – Auth State

```typescript
export const useAuth = create<AuthState>((set) => ({
    isAuthenticated: !!localStorage.getItem('access_token'),
    isLoading: false,
    user: null,
    login: (token: string) => {
        localStorage.setItem('access_token', token);
        set({ isAuthenticated: true });
    },
    logout: () => {
        localStorage.removeItem('access_token');
        set({ isAuthenticated: false, user: null });
        window.location.href = '/login';
    },
}));
```

**Bewertung: ⚠️ Teilweise korrekt, aber Grenzfall**

Positiv:

- Auth-Token-Status ist Client State (synchroner Zugriff auf localStorage)
- Kein Business-Logic-Problem (Login/Logout sind reine State-Änderungen)

Punkte zum Überdenken:

1. **`user: null` wird nie befüllt.** Das deutet darauf hin, dass User-Daten
   eigentlich Server State sind und über React Query gefetcht werden sollten.
   Falls das geplant ist → gut, dann gehört `user` gar nicht in den Zustand-Store.

2. **`window.location.href = '/login'` in logout:** Harter Page-Reload statt
   React-Router-Navigation. Das ist bewusst gewählt (löscht React Query Cache),
   aber als Kommentar sollte das begründet sein.

3. **Namenskonvention:** Der Store heißt `useAuth`, aber nach der Konvention in
   `AGENTS.md` sollte er `useAuthStore` heißen und in `shared/stores/auth.store.ts`
   liegen (nicht unter `features/auth/hooks/`).

---

## 2. React Query – Bewertung

### QueryProvider Setup

```typescript
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 1000 * 60 * 5,
            retry: 1,
            refetchOnWindowFocus: false,
        },
    },
});
```

**Bewertung: ✅ Größtenteils gut**

Vergleich mit Buch-Defaults und Empfehlungen:

| Option | Euer Wert | Buch-Default | Bewertung |
|---|---|---|---|
| `staleTime` | 5 Min | 0 | ✅ Sinnvoll für Lernplattform (Daten ändern sich selten) |
| `retry` | 1 | 3 | ✅ Okay, reduziert Wartezeit bei echten Fehlern |
| `refetchOnWindowFocus` | false | true | ⚠️ Bewusste Entscheidung, aber laut Buch ein wichtiges Feature |

**Hinweis zu `refetchOnWindowFocus: false`:**
Das Buch (Kap. 4) erklärt, dass dies ein zentrales Feature von React Query ist,
um Daten aktuell zu halten. Für eine Lernplattform (wo sich Fortschritte im
Hintergrund ändern können) wäre `true` die bessere Wahl für Production.
`false` ist für die Entwicklungsphase aber akzeptabel.

### Query Hooks

```typescript
// useCourses.ts – Korrekt
export function useCourses() {
    return useQuery({
        queryKey: ['courses'],
        queryFn: coursesApi.getCourses,
    });
}

// useCourse.ts – Korrekt
export function useCourse(courseId: string) {
    return useQuery({
        queryKey: ['courses', courseId],
        queryFn: () => coursesApi.getCourse(courseId),
        enabled: !!courseId,
    });
}
```

**Bewertung: ✅ Vorbildlich**

- Object-Format (v5-konform, Kap. 9)
- Hierarchische Query Keys (Kap. 4 empfiehlt genau das: `['courses']` → `['courses', id]`)
- `enabled` für bedingte Queries (Kap. 4: Dependent Queries)
- API-Funktionen in separater Datei (Kap. 8 Pattern: API File)

### useFeatureFlag

```typescript
export function useFeatureFlag(flag: FeatureFlag): boolean {
    const { data } = useQuery({
        queryKey: ['config'],
        queryFn: configApi.getConfig,
        staleTime: Infinity,
    });
    return data?.featureFlags?.[flag] ?? false;
}
```

**Bewertung: ✅ Korrekt**

- `staleTime: Infinity` → Config wird einmal geladen und nie als stale markiert
- Gute Nutzung von React Query für Konfiguration (Server State!)

### useLogin Mutation

```typescript
export function useLogin() {
    const { login } = useAuth();
    const navigate = useNavigate();

    return useMutation({
        mutationFn: authApi.login,
        onSuccess: (data) => {
            login(data.accessToken);
            navigate('/courses');
        },
    });
}
```

**Bewertung: ✅ Korrekt**

- `useMutation` für Write-Operationen (Kap. 6)
- `onSuccess` Callback für Side Effects (Kap. 6: Side Effect Patterns)
- Zustand-Store und React Query arbeiten sauber zusammen

---

## 3. Gesamtbewertung

| Aspekt | Status | Anmerkung |
|---|---|---|
| Server/Client State Trennung | ✅ | Genau wie im Buch empfohlen |
| React Query v5 Syntax | ✅ | Object-Format, `isPending` statt `isLoading` |
| Query Key Hierarchie | ✅ | Saubere Convention |
| Zustand für UI State | ✅ | Minimal, fokussiert |
| API-Funktionen isoliert | ✅ | `*.api.ts` Dateien pro Feature |
| Zod Validierung | ⚠️ | In AGENTS.md gefordert, müsste in API-Funktionen geprüft werden |
| Query Key Factories | ❌ | Noch nicht implementiert (Buch Kap. 8 empfiehlt das stark) |
| Testing Setup | ⚠️ | MSW installiert, aber Test-Utils-Pattern noch nicht umgesetzt |
| Optimistic Updates | – | Noch nicht benötigt, aber Pattern ist dokumentiert |
