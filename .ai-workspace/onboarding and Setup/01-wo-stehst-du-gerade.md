# Schritt 1: Wo stehst du gerade?

## Aktueller Stand des Projekts

Du hast ein frisches Vite + React + TypeScript Projekt. Das wurde mit `npm create vite@latest` erstellt und enthält nur den Default-Boilerplate:

```
LernweltLight/
├── src/
│   ├── App.tsx              ← Default Vite Counter-Demo
│   ├── App.css              ← Default Styling
│   ├── main.tsx             ← Entry Point
│   ├── index.css            ← Default Global Styles
│   └── assets/
│       └── react.svg
├── public/
├── package.json             ← Nur React + React-DOM, keine weiteren Deps
├── tsconfig.json            ← TypeScript Strict Mode ✓
├── tsconfig.app.json
├── tsconfig.node.json
├── vite.config.ts           ← Basis-Config, keine Aliases
├── eslint.config.js         ← Basis ESLint
├── AGENTS.md                ← Architektur-Guide (bereits geschrieben)
└── .ai-workspace/           ← Deine Lern-/Planungs-Notizen
```

### Was ist schon da (gut)

- [x] Vite als Build-Tool
- [x] React 19 + TypeScript 5.9
- [x] TypeScript Strict Mode aktiviert (`strict: true`)
- [x] ESLint mit TypeScript + React Hooks Regeln
- [x] Git initialisiert

### Was fehlt (das bauen wir jetzt auf)

- [ ] Zusätzliche Dependencies (React Query, Zustand, React Router, Axios, Zod, etc.)
- [ ] Path Aliases (`@/features/...`, `@/shared/...`)
- [ ] Feature-Based Ordnerstruktur
- [ ] API Client (Axios mit Interceptors)
- [ ] React Query Provider
- [ ] Router Setup
- [ ] Layout-Komponenten (Sidebar, Header)
- [ ] Auth-Flow
- [ ] Branding/Theme System
- [ ] i18n Setup
- [ ] Prettier Konfiguration
- [ ] Test-Setup (Vitest + React Testing Library)

## Die große Frage: Wo fange ich an?

**Nicht bei den Features.** Du baust erst das Fundament (Foundation), dann die Features darauf.

Stell dir das wie ein Haus vor:

```
                    ┌──────────────┐
           Schritt 5│   Features    │  ← Kurse, Quizze, Profile, etc.
                    ├──────────────┤
           Schritt 4│   Foundation  │  ← Auth, Router, Layouts, API Client
                    ├──────────────┤
           Schritt 3│   Struktur    │  ← Ordner, Barrel Exports, Conventions
                    ├──────────────┤
           Schritt 2│   Tooling     │  ← Dependencies, Path Aliases, Prettier
                    ├──────────────┤
           Schritt 1│   Projekt     │  ← Vite + React + TS  ✅ DONE
                    └──────────────┘
```

Du bist bei Schritt 1 fertig. Weiter geht's mit Schritt 2.

## Reihenfolge der nächsten Schritte

| Schritt | Was | Datei | Geschätzte Zeit |
|---------|-----|-------|-----------------|
| 2 | Dependencies & Tooling installieren | [02-dependencies-und-tooling.md](./02-dependencies-und-tooling.md) | 1-2 Stunden |
| 3 | Ordnerstruktur aufbauen | [03-ordnerstruktur-aufbauen.md](./03-ordnerstruktur-aufbauen.md) | 1 Stunde |
| 4 | Foundation bauen (API Client, Router, Layouts, Auth) | [04-foundation-bauen.md](./04-foundation-bauen.md) | 1-2 Tage |
| 5 | Erstes Feature: Login + Kursübersicht (End-to-End Durchstich) | [05-erster-durchstich.md](./05-erster-durchstich.md) | 2-3 Tage |
| 6 | Weitere Features in der richtigen Reihenfolge | [06-feature-reihenfolge.md](./06-feature-reihenfolge.md) | Wochen/Monate |

## Warum diese Reihenfolge?

1. **Tooling zuerst**, weil du ohne Dependencies nichts bauen kannst
2. **Struktur vor Code**, weil es 10x schwieriger ist, Ordner nachträglich umzubauen als sie von Anfang an richtig zu haben
3. **Foundation vor Features**, weil jedes Feature Auth, API Client und Router braucht
4. **Ein kompletter Durchstich** (Login → Kursübersicht), weil du damit beweist, dass die gesamte Kette funktioniert: Auth → API → React Query → UI
5. **Dann Feature für Feature**, weil jedes Feature dem gleichen Pattern folgt
