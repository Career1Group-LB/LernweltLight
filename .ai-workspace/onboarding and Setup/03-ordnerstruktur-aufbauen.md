# Schritt 3: Ordnerstruktur aufbauen

## Warum JETZT?

Bevor du eine einzige Komponente baust, legst du die Ordnerstruktur an. Das ist wie den Grundriss eines Hauses zeichnen, bevor du Wände hochziehst.

Wenn du das nicht tust, passiert Folgendes: Du baust Login, Kurse, Profile – alles in `src/` flach nebeneinander. Nach 3 Monaten hast du 80 Dateien in `src/` und findest nichts mehr.

## 3.1 Boilerplate aufräumen

Lösche die Vite-Demo-Dateien:

```bash
rm src/App.css ✅
rm src/assets/react.svg ✅
rm public/vite.svg ✅
```

Leere `src/App.tsx` (wird später neu aufgebaut): ✅

```typescript
export default function App() {
  return <div>Lernwelt</div>;
}
```

Leere `src/index.css` (wird später durch Theme-System ersetzt):✅

```css
/* Global styles – kept minimal, most styling in components */
*,
*::before,
*::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html {
  font-family:
    system-ui,
    -apple-system,
    sans-serif;
  -webkit-font-smoothing: antialiased;
}
```

## 3.2 Feature-Ordner anlegen

Erstelle die komplette Struktur. Du musst nicht alle Features sofort befüllen – aber die Ordner sollten von Anfang an da sein, damit klar ist, wo was hingehört.

```bash
# Feature-Ordner
mkdir -p src/features/auth/{components,hooks,api,schemas}
mkdir -p src/features/courses/{components,hooks,api,schemas}
mkdir -p src/features/progress/{components,hooks,api,schemas}
mkdir -p src/features/quiz/{components,hooks,api,schemas}
mkdir -p src/features/exercises/{components,hooks,api,schemas}
mkdir -p src/features/profile/{components,hooks,api,schemas}
mkdir -p src/features/certificates/{components,hooks,api,schemas}
mkdir -p src/features/time-tracking/{components,hooks,api,schemas}
mkdir -p src/features/notes/{components,hooks,api,schemas}
mkdir -p src/features/news/{components,hooks,api,schemas}
mkdir -p src/features/media-library/{components,hooks,api,schemas}
mkdir -p src/features/campus/{components,hooks,api,schemas}
mkdir -p src/features/livestream/{components,hooks,api,schemas}
mkdir -p src/features/job-offers/{components,hooks,api,schemas}
mkdir -p src/features/glossary/{components,hooks,api,schemas}
mkdir -p src/features/faq/{components,hooks,api,schemas}
mkdir -p src/features/tracking/{components,hooks,api,schemas}

# Shared-Ordner
mkdir -p src/shared/components
mkdir -p src/shared/hooks
mkdir -p src/shared/api
mkdir -p src/shared/schemas
mkdir -p src/shared/types
mkdir -p src/shared/utils
mkdir -p src/shared/config
mkdir -p src/shared/stores

# Weitere Ordner
mkdir -p src/layouts
mkdir -p src/router
mkdir -p src/providers
mkdir -p src/i18n
mkdir -p src/test
```

## 3.3 Barrel Exports erstellen (index.ts)

Jedes Feature bekommt eine `index.ts`, die als "Public API" dient. Andere Features importieren nur über diese Datei.

Erstelle für jedes Feature eine `index.ts`:

```typescript
// src/features/auth/index.ts
// Public API for the auth feature
// Export components, hooks, and types that other parts of the app need

export {}; // Platzhalter – wird später befüllt
```

```typescript
// src/features/courses/index.ts
export {};
```

Usw. für alle Features. Der `export {}` Platzhalter verhindert, dass TypeScript die Datei als "kein Modul" behandelt. Sobald du echte Exports hast, ersetzt du ihn.

## 3.4 Shared Types anlegen

Erstelle grundlegende Shared Types, die überall gebraucht werden:

```typescript
// src/shared/types/common.ts

/**
 * Standard API error shape returned by the backend.
 */
export interface ApiError {
  message: string;
  statusCode: number;
  details?: Record<string, unknown>;
}

/**
 * Feature flag identifiers.
 * Must match the flags returned by the config service.
 */
export type FeatureFlag =
  | 'liveStream'
  | 'mediaLibrary'
  | 'jobOffers'
  | 'recruitment'
  | 'certificates'
  | 'participationCertificates'
  | 'presencesAndAbsences'
  | 'faq'
  | 'interactiveExercises'
  | 'yourProfile'
  | 'dataSecurity'
  | 'campus'
  | 'learningCompanionChat';
```

## 3.5 Ergebnis

Nach diesem Schritt sieht dein Projekt so aus:

```
src/
├── features/
│   ├── auth/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── api/
│   │   ├── schemas/
│   │   └── index.ts
│   ├── courses/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── api/
│   │   ├── schemas/
│   │   └── index.ts
│   ├── progress/
│   │   └── ...
│   ├── quiz/
│   │   └── ...
│   └── ... (alle weiteren Features)
├── shared/
│   ├── components/
│   ├── hooks/
│   ├── api/
│   ├── schemas/
│   ├── types/
│   │   └── common.ts
│   ├── utils/
│   ├── config/
│   └── stores/
├── layouts/
├── router/
├── providers/
├── i18n/
├── test/
│   └── setup.ts
├── App.tsx                  ← Minimal (wird in Schritt 4 aufgebaut)
├── main.tsx
└── index.css
```

Die meisten Ordner sind noch leer – **das ist gewollt.** Du hast jetzt ein Skelett, das dir zeigt wo was hingehört, wenn du anfängst Code zu schreiben.

## 3.6 Mentaler Vergleich: Flutter vs. React Struktur

Falls dir der Umstieg schwerfällt, hier die Übersetzung:

| Flutter (vorher)                   | React (jetzt)                                             |
| ---------------------------------- | --------------------------------------------------------- |
| `lib/ui/courses/pages/`            | `features/courses/components/CoursesPage.tsx`             |
| `lib/ui/courses/cubit/`            | `features/courses/hooks/useCourses.ts`                    |
| `lib/domain/courses/use_cases/`    | `features/courses/hooks/useCourses.ts` (React Query Hook) |
| `lib/domain/courses/entities/`     | `features/courses/schemas/course.schema.ts` (Zod)         |
| `lib/domain/courses/repositories/` | `features/courses/api/courses.api.ts`                     |
| `lib/data/courses/repositories/`   | `features/courses/api/courses.api.ts`                     |
| `lib/data/courses/remote/`         | `features/courses/api/courses.api.ts`                     |
| `lib/repositories_provider.dart`   | `providers/QueryProvider.tsx` (React Query)               |

**Fällt dir was auf?** In React brauchst du viel weniger Dateien pro Feature. Kein Interface + Default Implementation + Use Case + Repository + Data Source. Stattdessen: **ein API-File, ein Hook, eine Komponente.** Das ist der Vorteil des "Thin Client" Ansatzes.

## Checkliste: Schritt 3

- [✅] Vite-Demo-Dateien gelöscht
- [✅] `App.tsx` aufgeräumt
- [✅] `index.css` auf Basics reduziert
- [✅] Alle Feature-Ordner angelegt
- [✅] Shared-Ordner angelegt
- [✅] Layout, Router, Provider, i18n, Test Ordner angelegt
- [✅] `index.ts` Barrel-Exports für jedes Feature erstellt
- [✅] Shared Types angelegt (`common.ts`)
- [✅] `npm run dev` startet noch fehlerfrei
- [✅] `npm run type-check` läuft ohne Fehler

**Wenn alles grün ist → weiter zu [Schritt 4: Foundation bauen](./04-foundation-bauen.md)**
