# AGENTS.md – Empfohlene Änderungen basierend auf dem Buch

## Überblick

Die `AGENTS.md` ist bereits sehr gut aufgebaut und deckt die State-Management-
Architektur korrekt ab. Basierend auf dem Buch "State Management with React Query"
gibt es jedoch einige Ergänzungen und Anpassungen, die die Dokumentation
präziser und praxistauglicher machen.

---

## Änderung 1: Query Key Factory Convention hinzufügen

**Wo:** Abschnitt "Server State with React Query" → nach "Query Key Convention"

**Was hinzufügen:**

```markdown
#### Query Key Factory

Statt Query Keys als String-Arrays zu hardcoden, verwende eine zentrale
Factory in `shared/utils/queryKeys.ts`:

\`\`\`typescript
// shared/utils/queryKeys.ts
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
} as const;
\`\`\`

**Verwendung:**

\`\`\`typescript
// In Hooks:
useQuery({ queryKey: queryKeys.courses.detail(courseId), ... });

// Bei Invalidierung:
queryClient.invalidateQueries({ queryKey: queryKeys.courses.all() });
\`\`\`

**Vorteile:**
- Typsicherheit und Autovervollständigung
- Keine Tippfehler in Query Keys
- Hierarchische Invalidierung einfach möglich
- Zentrale Übersicht aller Keys
```

**Begründung:** Buch Kapitel 8 empfiehlt dies als essenzielles Pattern für
wartbare Codebases.

---

## Änderung 2: Mutation-Pattern mit Invalidierung ergänzen

**Wo:** Abschnitt "Mutations"

**Was ergänzen (nach dem bestehenden Beispiel):**

```markdown
#### Mutation mit Optimistic Update (v5-Pattern)

Für sofortige UI-Feedback ohne Cache-Manipulation:

\`\`\`typescript
export function useCompleteActivity() {
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: (activityId: string) => progressApi.completeActivity(activityId),
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.progress.all() });
        },
    });

    return mutation;
}

// In der Komponente: Optimistic UI über mutation.variables
{mutation.isPending && (
    <div>Wird gespeichert: {mutation.variables}</div>
)}
\`\`\`
```

**Begründung:** React Query v5 ermöglicht Optimistic Updates ohne
Cache-Manipulation (Buch Kapitel 9). Das ist weniger fehleranfällig als
der Cache-basierte Weg aus v4.

---

## Änderung 3: v5-spezifische Terminologie aktualisieren

**Wo:** Gesamte AGENTS.md

**Was anpassen:**

Die AGENTS.md ist bereits v5-konform. Zur Absicherung diese Punkte prüfen:

| Prüfpunkt | Status | Anmerkung |
|---|---|---|
| `useQuery` Object-Format | ✅ | Bereits korrekt |
| `isPending` statt `isLoading` | ⚠️ | Nicht explizit erwähnt – sollte in Beispiele aufgenommen werden |
| `gcTime` statt `cacheTime` | ⚠️ | Nicht erwähnt – sollte dokumentiert werden |
| `placeholderData` statt `keepPreviousData` | ⚠️ | Nicht erwähnt |

**Vorschlag:** Einen kurzen Abschnitt ergänzen:

```markdown
#### React Query v5 Hinweise

Dieses Projekt nutzt TanStack React Query v5. Beachte folgende Benennungen:

- `isPending` (nicht `isLoading`) für den initialen Ladezustand
- `isLoading` = `isPending && isFetching` (neu in v5)
- `gcTime` (nicht `cacheTime`) für Garbage Collection Time
- `placeholderData: keepPreviousData` (statt `keepPreviousData: true`) für Pagination
```

---

## Änderung 4: Testing-Abschnitt erweitern

**Wo:** Abschnitt "Testing" → "Test Pattern"

**Was ergänzen:**

```markdown
### React Query Test Setup

Erstelle eine zentrale `test-utils.tsx` in `src/test/`:

\`\`\`typescript
// src/test/test-utils.tsx
import { render, type RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

function customRender(ui: React.ReactElement, options?: Omit<RenderOptions, 'wrapper'>) {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: { retry: 0, gcTime: Infinity },
        },
    });

    return render(ui, {
        wrapper: ({ children }) => (
            <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        ),
        ...options,
    });
}

export * from '@testing-library/react';
export { customRender as render };
\`\`\`

**Wichtig:** QueryClient **immer innerhalb** der render-Funktion erstellen,
damit Tests isoliert voneinander laufen.

#### MSW Handlers

Für jeden API-Bereich einen eigenen Handler erstellen:

\`\`\`
src/mocks/
├── handlers/
│   ├── courses.handlers.ts
│   ├── auth.handlers.ts
│   └── config.handlers.ts
├── server.ts          ← setupServer(...allHandlers)
└── browser.ts         ← setupWorker(...allHandlers) für Dev
\`\`\`
```

**Begründung:** Buch Kapitel 8 widmet sich komplett dem Testing mit MSW
und zeigt, dass diese Struktur die Wartbarkeit massiv verbessert.

---

## Änderung 5: Anti-Pattern-Liste ergänzen

**Wo:** Abschnitt "Anti-Patterns to Avoid"

**Was hinzufügen:**

```markdown
---

❌ **Don't forget to invalidate queries after mutations**:

\`\`\`typescript
// BAD – Mutation ohne Invalidierung
const mutation = useMutation({
    mutationFn: coursesApi.updateCourse,
    // Kein onSuccess → angezeigte Daten bleiben veraltet
});
\`\`\`

✅ **Always invalidate related queries**:

\`\`\`typescript
// GOOD – Nach Mutation relevante Queries invalidieren
const mutation = useMutation({
    mutationFn: coursesApi.updateCourse,
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.courses.all() });
    },
});
\`\`\`

---

❌ **Don't mix Server State into Zustand stores**:

\`\`\`typescript
// BAD – Server-Daten in Zustand speichern
const useCoursesStore = create((set) => ({
    courses: [],
    fetchCourses: async () => {
        const data = await apiClient.get('/courses');
        set({ courses: data });
    },
}));
\`\`\`

✅ **Use React Query for all server data**:

\`\`\`typescript
// GOOD – React Query für Server State, Zustand nur für Client State
const { data: courses } = useQuery({
    queryKey: ['courses'],
    queryFn: coursesApi.getCourses,
});
\`\`\`
```

**Begründung:** Das gesamte Buch (insbes. Kap. 2) warnt davor, Server State
in Client-State-Lösungen zu packen. Da das Projekt von Flutter kommt (wo alles
in Cubits/BLoCs lag), ist dieses Anti-Pattern besonders relevant.

---

## Änderung 6: "When to Use What"-Tabelle ergänzen

**Wo:** Abschnitt "When to Use What"

**Was ergänzen:**

| Szenario | Tool |
|---|---|
| Mutation erfolgreich → UI aktualisieren | React Query (`invalidateQueries`) |
| Optimistic Update (sofort zeigen) | React Query (`mutation.variables` + `isPending`) |
| User-Daten nach Login laden | React Query (nicht Zustand!) |
| Query prefetchen (z.B. bei Hover) | React Query (`queryClient.prefetchQuery`) |
| Globaler Error-Toast bei API-Fehlern | React Query (`QueryCache.onError`) |

---

## Zusammenfassung

Die AGENTS.md ist bereits auf einem sehr guten Stand. Die vorgeschlagenen
Änderungen sind **Ergänzungen**, keine Korrekturen:

1. **Query Key Factory** → Wartbarkeit bei wachsendem Codebase
2. **v5-Terminologie** → Konsistenz mit installierter Version
3. **Mutation-Invalidierung** → Häufigster Fehler in React Query Projekten
4. **Testing Setup** → Reproduzierbare, isolierte Tests
5. **Anti-Patterns** → Flutter-Migration-spezifische Fallen vermeiden
6. **"When to Use What" erweitern** → Klarere Entscheidungshilfe
