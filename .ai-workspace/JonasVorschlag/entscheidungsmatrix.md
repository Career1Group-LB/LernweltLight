# Entscheidungsmatrix: Tech-Stack Lernwelt Frontend

**Datum:** März 2026  
**Zweck:** Kompakter Überblick über alle Stack-Entscheidungen mit Handlungsbedarf

> **Kontext:** Das Produktionsprojekt wird von Grund auf neu gebaut.
> Alle Entscheidungen werden rein nach technischem Nutzen getroffen —
> der aktuelle MVP-Stand ist irrelevant.

---

## Legende

| Symbol | Bedeutung |
|---|---|
| ✅ | Entschieden, kein Handlungsbedarf |
| 🟡 | Muss noch finalisiert werden / offene Frage |
| 🔴 | Falsche Wahl — korrigieren |
| ➕ | Fehlt im Vorschlag, muss ergänzt werden |

---

## Matrix

| Kategorie | Empfohlenes Tool | ADR-Status | Jonas' Vorschlag | Bewertung | Handlungsbedarf |
|---|---|---|---|---|---|
| Framework | React 19 | ✅ Accepted | ✅ | Richtig | Keiner |
| Sprache | TypeScript Strict | ✅ Accepted | ✅ | Richtig | Keiner |
| Build | Vite | ✅ Accepted | ✅ | Richtig | Keiner |
| Server State | TanStack Query v5 | ✅ Accepted | ✅ | Richtig | Keiner |
| Client State | Zustand v5 | ✅ Accepted | ✅ | Richtig | Keiner |
| Routing | TanStack Router v1 | Offen | ✅ TanStack Router | Richtig | 🟡 ADR anlegen |
| Laufzeit-Validierung | Zod v4 | ✅ Accepted | ❌ Nicht erwähnt | Fehlt | ➕ Pflicht |
| API-Client | Axios | AGENTS.md | ❌ Nicht erwähnt | Fehlt | ➕ Pflicht |
| Styling | Tailwind CSS v4 | ✅ Accepted | ✅ | Richtig | Keiner |
| Komponenten | shadcn/ui | 🟡 Proposed | ✅ | Richtig | 🟡 ADR 0010 finalisieren |
| Icon-System | Lucide oder Material Symbols | Offen | Unklar | Offen | 🟡 Beim Projekt-Setup festlegen |
| Animationen | — (zurückgestellt) | Nicht in ADRs | Motion vorgeschlagen | Kein Bedarf nachgewiesen | 🟡 Erst bei konkretem Use Case |
| Unit Tests | Vitest | ADR 0008 | ✅ | Richtig | Keiner |
| Integrationstests | React Testing Library | ADR 0008 | ✅ (in Präsentation) | Richtig | ➕ MSW ergänzen |
| E2E Tests | Playwright | ADR 0008 | ✅ | Richtig | ➕ Einrichten |
| Linting | Biome oder ESLint | Offen | Biome | Vertretbar | 🟡 Team-Entscheidung |
| Formatierung | (in Linting-Tool integriert) | Offen | Biome | Vertretbar | 🟡 Team-Entscheidung |
| Git-Hooks | Husky | Nicht in ADRs | ✅ | Richtig | ➕ Einrichten |
| Commit-Konvention | Commitlint | Nicht in ADRs | ✅ | Richtig | ➕ Einrichten |
| i18n | react-i18next | ADR 0009 Proposed | ❌ Nicht erwähnt | Fehlt | ➕ Pflicht |
| Formulare | React Hook Form + zodResolver | ADR 0011 | ❌ Nicht erwähnt | Fehlt | ➕ Empfohlen |
| CI/CD | GitHub Actions | Offen | ✅ | Wahrscheinlich richtig | 🟡 Repo-Standort klären |
| Error-Tracking | Sentry | AGENTS.md | ✅ | Richtig | ➕ Einrichten |
| API-Typen | OpenAPI Codegen | ADR 0014 Proposed | ❌ Nicht erwähnt | Offen | 🟡 Mit Backend-Team klären |

---

## Kritische Korrekturen

### 1. Biome oder ESLint + Prettier — Team-Entscheidung

**Korrektur:** Meine frühere Behauptung, Biome hätte "kein Äquivalent" für
React-Hooks- und a11y-Regeln, war falsch. Biome v2.4 hat:

- ✅ `useHookAtTopLevel` (≈ rules-of-hooks)
- ✅ `useExhaustiveDependencies` (≈ exhaustive-deps)
- ✅ 21+ Accessibility-Regeln (≈ jsx-a11y)

**Was Biome tatsächlich schwächer macht:**
- TypeScript type-aware Regeln ~85% Abdeckung (`noFloatingPromises`
  erkennt ~75% der Fälle)
- Import-Reihenfolge weniger granular konfigurierbar als eslint-plugin-import-x
- Kein Plugin-System (keine Community-Plugins wie testing-library, tanstack-query)
- Hook-Regeln sind jünger und wurden bis v2.3 noch aktiv gefixt

**Biome wählen wenn:** Minimaler Config-Aufwand, ein Tool statt zwei,
CI-Geschwindigkeit wichtig, Abstriche bei TypeScript-Tiefe akzeptabel.

**ESLint wählen wenn:** Maximale type-aware Abdeckung, strikte
Import-Gruppen, Plugin-Ökosystem für die Zukunft.

Siehe `analyse-jonas-vorschlag.md` → ADR-012 für die vollständige Analyse.

### 2. Testing: MSW ergänzen

Die Präsentation enthält jetzt Vitest + RTL + Playwright — die drei Ebenen
sind abgedeckt. Was noch fehlt: **MSW (Mock Service Worker)** für
API-Mocking in Komponenten-Tests. RTL allein kann keine API-Aufrufe mocken.
MSW ist das Standard-Tool dafür und gehört von Anfang an in den Stack.

---

## Offene Entscheidungen

### Icon-System: Lucide oder Material Symbols?

shadcn/ui bringt `lucide-react` als Standard-Icons mit. Alternativ können
Material Symbols (Icon-Font von Google) eingesetzt werden. Eine Entscheidung
muss beim Projekt-Setup getroffen werden — beide parallel ist keine Option.

**Für Lucide:** Direkte Integration in shadcn/ui, SVG-basiert (kein Font-Loading),
kleinere Bundles pro Seite (tree-shakeable).

**Für Material Symbols:** Größere Icon-Auswahl, bekanntes Design-System,
aber Font-basiert (lädt alle Icons als Font).

### CI/CD: GitHub Actions oder Azure DevOps?

GitHub Actions ist technisch die bessere Wahl wenn das Repo auf GitHub liegt —
direkte PR-Integration, riesiges Actions-Ökosystem. Falls das Produktions-Repo
auf Azure DevOps liegt und andere OneCareer-Produkte dort CI/CD betreiben,
wäre Konsistenz ein Argument für Azure Pipelines. Diese Frage muss mit dem
Team und der Infrastruktur-Verantwortung geklärt werden.

### OpenAPI Codegen: Manuelle Zod-Schemas oder Generierung?

ADR 0014 ist noch offen. Die Frage ist ob das Go-Backend OpenAPI-Specs
exportiert. Falls ja: `openapi-typescript` generiert TypeScript-Interfaces
aus der Spec und verhindert Type-Drift zwischen Frontend und Backend. Das
sollte früh mit dem Backend-Team abgestimmt werden.

---

## Der vollständige Stack nach Analyse

```
Framework
├── React 19
├── TypeScript 5 (Strict Mode)
└── Vite

Routing
└── TanStack Router v1          (ADR anlegen)

Data & State
├── TanStack Query v5           (Server State)
├── Zustand v5                  (Client State)
└── Zod v4                      (Runtime-Validierung + Schemas)

API
└── Axios                       (HTTP Client + Auth-Interceptors)

UI & Styling
├── Tailwind CSS v4             (Utility-First + Design Tokens)
├── shadcn/ui                   (Komponenten-Bibliothek — ADR finalisieren)
└── Icon-System                 (Lucide oder Material Symbols — festlegen)

Formulare
└── React Hook Form + zodResolver

i18n
└── react-i18next               (Namespace-basiert pro Feature)

Testing
├── Vitest                      (Unit Tests: Utils, Schemas)
├── React Testing Library       (Integration/Component Tests)
├── MSW                         (API-Mocking in Tests)
└── Playwright                  (E2E: kritische User Journeys)

Linting & Formatierung (eine der beiden Optionen)
├── Option A: Biome           (ein Tool, schnell, weniger Config)
└── Option B: ESLint + Prettier (Plugin-Ökosystem, type-aware Tiefe)

Git & CI
├── Husky                       (pre-commit + commit-msg Hooks)
├── Commitlint                  (Conventional Commits)
└── GitHub Actions              (wenn Repo auf GitHub — klären)

Monitoring
└── Sentry                      (Error Tracking)

Zurückgestellt / offen
├── Motion                      (erst bei konkretem Animationsbedarf)
└── OpenAPI Codegen             (mit Backend-Team abstimmen)
```
