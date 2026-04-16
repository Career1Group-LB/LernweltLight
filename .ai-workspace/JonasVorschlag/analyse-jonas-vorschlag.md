# Analyse: Jonas' Tech-Stack-Vorschlag

**Datum:** März 2026  
**Basis:** `praesentation.html` (14 ADRs) + `jonasVorschlag.md` vs. `docs/adr/` und Planungsdokumente

> **Kontext:** Das Produktionsprojekt wird von Grund auf neu gebaut.
> Alle Entscheidungen werden rein nach technischem Nutzen getroffen.

---

## Vorbemerkung: Die Präsentation ist deutlich ausgereifter

Der initiale `jonasVorschlag.md` war eine grobe Auflistung. Die Präsentation
liefert 14 strukturierte ADRs mit Begründungen. Mehrere Lücken aus dem ersten
Vorschlag wurden geschlossen:

- ✅ **React Testing Library** ist jetzt explizit drin (ADR-013)
- ✅ **React Hook Form + Zod** sind jetzt explizit drin (ADR-007)
- ✅ **Motion (Framer Motion)** ist vollständig raus — richtig so
- ✅ **Design Tokens / WhiteLabel** sind durchdacht adressiert (ADR-010)
- ✅ **CI/CD-Gates** sind konkret beschrieben (ADR-014)
- 🆕 **Zwei neue strategische ADRs** über Gesamtarchitektur (ADR-001, ADR-002)

Das macht die Bewertung differenzierter — vieles ist gut, einige Punkte
bleiben kritisch.

---

## Der Stack auf einen Blick (aus der Präsentation)

```
Core Architecture
├── ADR-001: 3 unabhängige Web-Apps
├── ADR-002: Shared Code via privatem npm-Package
├── ADR-003: Feature-basierte Projektstruktur
└── ADR-004: Vite + React

State & Data Flow
├── ADR-005: TanStack Router
├── ADR-006: TanStack Query + Zustand
└── ADR-007: React Hook Form + Zod

UI Architecture
├── ADR-008: Tailwind CSS
├── ADR-009: Kein CSS Preprocessor
├── ADR-010: Design Tokens & WhiteLabel
└── ADR-011: shadcn/ui

DevEx & Tooling
├── ADR-012: Biome + Husky
├── ADR-013: Vitest + React Testing Library + Playwright
└── ADR-014: Strict CI/CD Gates
```

---

## ADR-001: 3 unabhängige Web-Apps

**Bewertung: ✅ Richtig — aber hat architektonische Konsequenzen**

Jonas schlägt vor, die drei OneCareer-Produkte (Product World, Lernwelt,
Client Office) als vollständig separate Repos mit eigenem Deployment und
eigenem Release-Zyklus zu bauen — gleiche Technologien, lose gekoppelt.

### Warum das richtig ist
- Jede App hat ihren eigenen User, eigene Feature-Prioritäten und eigene
  Release-Geschwindigkeit. Eine Änderung in der Lernwelt soll nie einen
  Deploy vom Client Office erzwingen.
- Separate Repos erzwingen saubere Grenzen. Wenn Code in beiden Apps
  gebraucht wird, muss er bewusst in ein Shared Package extrahiert werden
  (→ ADR-002).

### Was das architektonisch bedeutet
Diese Entscheidung hat direkte Konsequenzen auf ADR-002, ADR-010 und ADR-011.
Sie muss konsistent zu Ende gedacht werden: Ein gemeinsamer Tech-Stack reicht
nur, wenn auch das Tooling (TypeScript-Config, ESLint-Config, Tailwind-Preset)
geteilt wird — entweder über das Shared Package oder ein Monorepo-Setup.

> **Eine offene Frage:** Separate Repos oder Monorepo? Jonas wählt separate
> Repos. Ein Monorepo (z.B. Turborepo) würde geteilte Konfigurationen und
> atomare Commits über alle Apps einfacher machen. Das ist eine valide
> Gegenperspektive, die im Team diskutiert werden sollte.

---

## ADR-002: Shared Code — privates npm-Package

**Bewertung: ✅ Richtiger Ansatz — Scope genau prüfen**

### Was Jonas vorschlägt
Die aktuelle `shared-ui`-Library mischt API Services, Komponenten, Views und
Utils in eine Abhängigkeit. Das ist das Problem. Jonas löst es durch:

- **Ein privates npm-Package** mit nur dem Code, der in allen Apps identisch
  laufen muss: Auth-Logik und API-Client.
- **Keine shared-ui mehr.** UI-Komponenten kommen aus der shadcn-Registry,
  werden ins Projekt kopiert und dort projektspezifisch angepasst.

### Warum das richtig ist
Das bisherige Muster ("alles in eine UI-Library") ist ein verbreitetes
Anti-Pattern: Jede Änderung am Shared-Code zieht potenziell alle abhängigen
Apps mit. Das neue Modell trennt sauber:

- **Was geteilt werden muss** (Auth, API-Client): npm-Package mit Versionierung
- **Was lokal angepasst werden soll** (UI-Komponenten): shadcn-Registry, Code
  im eigenen Repo

### Was kritisch geprüft werden muss

**Scope des npm-Packages:** Was gehört wirklich rein? Jonas nennt Auth +
API Client. Das klingt klar — aber in der Praxis schleicht sich mehr ein:
gemeinsame Zod-Schemas? TypeScript-Config? Tailwind-Preset? ESLint-Config?
Der Scope muss zu Beginn strikt definiert und verteidigt werden. Sonst wird
das Package zur nächsten `shared-ui`.

**Versionierungs-Overhead:** Ein privates npm-Package bedeutet Semantic
Versioning, Changelogs und koordinierte Updates. Das ist manuell aufwändig.
Alternative: Monorepo mit Turborepo — dann entfällt der Package-Versioning-
Overhead, weil alle Packages im gleichen Repo leben.

> **Empfehlung:** Den Ansatz grundsätzlich übernehmen. Den Scope des Packages
> schriftlich definieren und mit dem Team verabschieden, bevor die erste Zeile
> Code rein kommt.

---

## ADR-003: Feature-basierte Projektstruktur

**Bewertung: ✅ Konsens**

```
src/
├── app/           (Router, Providers)
├── features/
│   └── course-management/
│       ├── components/
│       ├── hooks/
│       ├── api.ts
│       └── index.ts   ← Public API
└── shared/        (app-weiter Code)
```

Identisch mit AGENTS.md und ADR 0005. Features kommunizieren ausschließlich
über `index.ts`, keine direkten Cross-Feature-Imports. Kein Diskussionsbedarf.

---

## ADR-004: Vite + React

**Bewertung: ✅ Konsens**

Richtig begründet: Alle drei Produkte leben hinter einem Login, kein SEO, kein
SSR nötig. Statische Builds mit Vite reichen vollständig aus. Kein
Diskussionsbedarf.

---

## ADR-005: TanStack Router

**Bewertung: ✅ Richtige Wahl — gut begründet**

Jonas' Begründung in der Präsentation ist schärfer als im ersten Vorschlag:

> *"Search Params als State: Kritisch für komplexe Filter, Suchen und
> Pagination in der Lernwelt. State lebt in der URL, nicht lokal."*

Das ist der entscheidende Punkt. Eine Lernplattform hat überall Filter- und
Paginierungs-State (Kursliste, Glossar, Job-Angebote). TanStack Router
behandelt Search-Params als First-Class-Citizens mit Zod-Schema-Validierung.
React Router v7 lässt Search-Params ungetypt.

Ebenfalls gut: *"Cache-Prefetching beim Hovern von Links ist ein Einzeiler"*
— die Integration mit TanStack Query ist tief und ohne Boilerplate.

> **Empfehlung: Übernehmen.** Neues ADR anlegen.

---

## ADR-006: TanStack Query + Zustand

**Bewertung: ✅ Konsens**

Die 90/10-Aufteilung (Server State via TanStack Query, Client State via
Zustand) ist korrekt und gut erklärt. Das Thin-Client-Prinzip — Business-Logik
im Go-Backend, Frontend zeigt nur an — passt direkt dazu. Kein
Diskussionsbedarf.

---

## ADR-007: React Hook Form + Zod

**Bewertung: ✅ Richtig — war im ersten Vorschlag vergessen**

Die Präsentation holt das nach. Die Begründung ist solide:

- **Strikter Contract:** Ein Zod-Schema gilt als TypeScript-Typ und als
  Formular-Validierungsregel gleichzeitig. Single Source of Truth.
- **Performant:** Uncontrolled Inputs by Default — kein Re-Render pro
  Tastendruck. Relevant für große Formulare (Profil, Skills,
  Berufserfahrung).
- **Ökosystem-Fit:** Natives `zodResolver`, integriert sich in shadcn/ui.

Die Lernwelt hat mehrere komplexe Formulare mit dynamischen Listen — React
Hook Form ist die richtige Wahl (Formik ist ausgeschlossen, ADR 0011).

> **Gut korrigiert. Übernehmen.**

---

## ADR-008: Tailwind CSS

**Bewertung: ✅ Konsens**

Korrekt und gut begründet. Utility-First, keine Context-Switches zwischen TSX
und CSS, konsistente Spacing-/Farb-Token. Kein Diskussionsbedarf.

---

## ADR-009: Kein CSS Preprocessor

**Bewertung: ✅ Richtige explizite Entscheidung**

Explizit kein SCSS, kein Less — eine Entscheidung, die im ersten Vorschlag
fehlte. Die Begründung stimmt: Natives CSS mit Custom Properties und Nesting
macht Preprocessors heute überflüssig. Tailwind v4 übernimmt den Rest. Weniger
Build-Dependencies ist immer besser.

---

## ADR-010: Design Tokens & WhiteLabel

**Bewertung: ✅ Richtig — gut mit ADR-001 verknüpft**

CSS Custom Properties als Token-System für Multi-Tenant-Branding ist der
richtige Ansatz (identisch mit AGENTS.md und ADR 0006/0012). Token-Swap via
`data-theme`-Attribut — eine Stelle im Code, kein Anfassen von Komponenten.

Der Zusammenhang mit ADR-001 (3 Apps) und ADR-011 (shadcn/ui) ist in der
Präsentation gut hergestellt: Gleiche Komponenten, unterschiedliches Look &
Feel pro App — ohne Code-Duplizierung.

---

## ADR-011: shadcn/ui

**Bewertung: ✅ Richtige Wahl — ein wichtiger Aspekt fehlt noch**

Gut begründet in der Präsentation:
- Kein Package-Lock-in — Komponenten gehören dem Projekt
- Radix UI als Basis: Accessibility out-of-the-box (Fokus-Traps,
  Screenreader, Keyboard-Navigation — Wochen Arbeit die geschenkt wird)
- Automatische Anpassung an ADR-010 Design Tokens
- AI-Tooling-Vorteil: v0 (Vercel) generiert direkt shadcn-Komponenten

Jonas erwähnt in den Nächsten Schritten eine **eigene shadcn-Registry für alle
3 Projekte**. Das ist eine gute Idee: Statt Komponenten in jedes Repo zu
kopieren, eine zentrale Registry betreiben von der alle drei Apps ihre
Basis-Komponenten beziehen. Wird aber komplex — das ist ein eigenes Projekt.

**Noch nicht entschieden: Icon-System.** shadcn/ui bringt `lucide-react` mit.
Das muss beim Setup bewusst festgelegt werden — eine einheitliche Wahl für
alle 3 Apps.

---

## ADR-012: Biome + Husky

**Bewertung: 🟡 Biome ist eine ernstzunehmende Wahl — meine vorherige Analyse war falsch**

### Korrektur: Was ich vorher behauptet habe und was tatsächlich stimmt

In der vorherigen Version dieser Analyse habe ich behauptet, Biome hätte
**kein Äquivalent** für `eslint-plugin-react-hooks` und `eslint-plugin-jsx-a11y`.
Das war **falsch**. Nach gründlicher Recherche hier der tatsächliche Stand
(Biome v2.4, März 2026):

| Feature | ESLint-Plugin | Biome-Äquivalent | Status |
|---|---|---|---|
| Rules of Hooks | `react-hooks/rules-of-hooks` | `useHookAtTopLevel` | ✅ Vorhanden |
| Exhaustive Dependencies | `react-hooks/exhaustive-deps` | `useExhaustiveDependencies` | ✅ Vorhanden |
| Accessibility (a11y) | `eslint-plugin-jsx-a11y` (25+ Regeln) | 21+ eigene a11y-Regeln | ✅ Weitgehend gleichwertig |
| TypeScript type-aware | `@typescript-eslint` (vollständig) | Biome v2 "Biotype" | ⚠️ ~85% Abdeckung |
| Import-Reihenfolge | `eslint-plugin-import-x` | Biome `organizeImports` | ⚠️ Weniger konfigurierbar |
| Floating Promises | `@typescript-eslint/no-floating-promises` | `noFloatingPromises` | ⚠️ ~75% der Fälle erkannt |

**Biome deckt React-Hooks-Regeln und Accessibility ab.** Die beiden Argumente,
die ich als "gravierendste Probleme" dargestellt hatte, sind nicht mehr haltbar.

---

### Was Biome tatsächlich bietet

#### React Hooks: `useHookAtTopLevel` + `useExhaustiveDependencies`

Biome hat **beide** zentralen React-Hooks-Regeln implementiert:

**`useHookAtTopLevel`** — fängt genau die gleichen Fehler ab wie
`rules-of-hooks`:
- Hooks in `if`-Blöcken → Fehler
- Hooks nach `return` → Fehler
- Hooks in normalen (nicht-Hook/nicht-Komponenten) Funktionen → Fehler

**`useExhaustiveDependencies`** — fängt fehlende Dependencies in `useEffect`,
`useCallback`, `useMemo` ab. Geht sogar einen Schritt weiter als ESLint: erkennt
auch *unnötige* Dependencies (ESLint prüft das nicht).

Allerdings: Die Implementierung ist jünger als die von ESLint. Es gab in der
Vergangenheit Bugs (z.B. falsche Warnungen bei MobX, bei verschachteltem
Destructuring). Viele davon wurden in v2.3/v2.4 gefixt. Das ESLint-Plugin
existiert seit Jahren und ist battle-tested.

#### Accessibility: 21+ a11y-Regeln

Biome hat eine eigene `a11y`-Kategorie mit 21+ Regeln:
`noAccessKey`, `noAriaHiddenOnFocusable`, `noAriaUnsupportedElements`,
`noAutofocus`, `noLabelWithoutControl`, `useAltText`, `useAnchorContent`,
`useAriaPropsForRole`, `useSemanticElements`, `useFocusableInteractive`,
und weitere.

Das deckt den Großteil von `eslint-plugin-jsx-a11y` ab.

#### TypeScript type-aware Regeln (Biome v2 "Biotype")

Biome v2 hat einen eigenen Type-Inferenz-Ansatz eingeführt — es nutzt
**nicht** den TypeScript-Compiler, sondern eine eigene Implementierung. Das
macht es schnell, hat aber Konsequenzen:
- ~85% der `@typescript-eslint`-Regeln abgedeckt
- `noFloatingPromises` erkennt ~75% der Fälle (vs. 100% bei typescript-eslint)
- Multi-File-Analyse ist möglich, aber nicht so tief wie tsc

---

### Wo Biome tatsächlich schwächer ist als ESLint

#### 1. TypeScript type-aware Regeln: 85% statt 100%

Das klingt nach viel — aber die fehlenden 15% sind nicht zufällig. Es sind
typischerweise Edge Cases bei komplexen generischen Typen, Conditional Types
und Mapped Types. In einer Lernplattform mit Standard-CRUD-Patterns ist das
wahrscheinlich weniger relevant. Aber: Wenn du dich bei einem `Promise` vertippen
würdest, fängt ESLint 100% der Fälle, Biome nur 75%.

**In der Praxis heißt das:** Ein unbehandeltes `Promise` (z.B. ein vergessenes
`await` vor `mutate()`) könnte von Biome durchgelassen werden, obwohl ESLint
es finden würde. Bei einem Thin Client mit vielen API-Calls ist das ein reales
Szenario — aber kein häufiges.

#### 2. Import-Reihenfolge: weniger Kontrolle

`eslint-plugin-import-x` kann die Import-Gruppen exakt definieren:
builtin → external → internal → parent → sibling → index, mit Blank Lines
zwischen jeder Gruppe.

Biome's `organizeImports` sortiert und gruppiert Imports, ist aber weniger
granular konfigurierbar. Die architektonische Konvention aus AGENTS.md
(6 Import-Gruppen mit erzwungener Reihenfolge) lässt sich mit ESLint exakter
durchsetzen.

**In der Praxis heißt das:** Die Imports werden trotzdem sortiert und
konsistent, aber die erzwungene Gruppenstruktur ist weniger strikt.

#### 3. Plugin-Ökosystem: kein Erweiterungs-Modell

ESLint hat ein Plugin-System. Wenn morgen ein neues Tool oder Pattern auftaucht
(z.B. `eslint-plugin-tanstack-query`, `eslint-plugin-testing-library`), gibt es
oft schnell ein ESLint-Plugin dafür. Biome hat kein Plugin-System — alle Regeln
werden vom Biome-Team selbst implementiert. Das garantiert Qualität und
Kohärenz, limitiert aber die Erweiterbarkeit.

#### 4. Reife der Hook-Regeln

Die React-Hooks-Regeln in Biome existieren und funktionieren, aber sie werden
noch aktiv iteriert. Bis v2.3/v2.4 gab es mehrere Issues mit False Positives
(z.B. bei `useCallback` mit bestimmten Patterns). Die ESLint-Variante ist
seit Jahren stabil und hat diese Phase hinter sich.

---

### Die ehrliche Abwägung

| Kriterium | ESLint + Prettier | Biome |
|---|---|---|
| Geschwindigkeit | 2–3s (200 Dateien) | 50–100ms |
| React Hooks Regeln | ✅ Battle-tested | ✅ Vorhanden, jünger |
| a11y Regeln | ✅ 25+ Regeln | ✅ 21+ Regeln |
| TypeScript type-aware | ✅ 100% via tsc | ⚠️ ~85% eigene Inferenz |
| Import-Reihenfolge | ✅ Hochgradig konfigurierbar | ⚠️ Basisfunktion |
| Plugin-System | ✅ Riesiges Ökosystem | ❌ Kein Plugin-System |
| Konfigurationsaufwand | Hoch (3+ Config-Dateien, Plugins) | Niedrig (eine biome.json) |
| Tooling-Einheit | 2 Tools (ESLint + Prettier) | 1 Tool |

**Für ein Greenfield-Projekt** (was die Lernwelt ist) ist Biome eine
ernstzunehmende Option. Die React-Hooks-Regeln und a11y-Regeln existieren.
Der Konfigurationsaufwand ist minimal. Die Geschwindigkeit in CI/CD ist
ein realer Vorteil.

**Gegen Biome spricht** die geringere Reife bei type-aware Regeln (85%),
die fehlende Import-Gruppen-Kontrolle, und das fehlende Plugin-System.
Das sind keine KO-Kriterien, aber echte Abstriche.

### Empfehlung

Das ist knapper als ich es vorher dargestellt habe. Beide Optionen sind
für dieses Projekt vertretbar. Die Entscheidung hängt davon ab, was dem
Team wichtiger ist:

**Biome wählen, wenn:**
- Minimaler Konfigurationsaufwand Priorität hat
- Ein Tool statt zwei bevorzugt wird
- CI/CD-Geschwindigkeit ein Thema ist
- Das Team bereit ist, bei Import-Reihenfolge und type-aware Regeln
  Kompromisse einzugehen

**ESLint + Prettier wählen, wenn:**
- Maximale Regelabdeckung bei TypeScript type-aware Linting gebraucht wird
- Die strikte 6-Gruppen-Import-Reihenfolge erzwungen werden soll
- Ein Plugin-System für zukünftige Erweiterungen (tanstack-query,
  testing-library) gewünscht ist
- Battle-tested Hook-Regeln bevorzugt werden

> **Fazit: Jonas' Wahl von Biome ist vertretbar** — aber das Team muss die
> Abstriche bei type-aware Regeln und Import-Kontrolle bewusst akzeptieren.
> Husky + Commitlint sind unabhängig davon richtig.

---

## ADR-013: Vitest + React Testing Library + Playwright

**Bewertung: ✅ Jetzt vollständig — gut korrigiert**

Der erste Vorschlag hatte RTL vergessen. Die Präsentation korrigiert das:

```
Unit       → Vitest             (Schemas, Utils, reine Funktionen)
Component  → React Testing Lib  (Komponentenverhalten, Hooks, Forms)
E2E        → Playwright          (Kritische User Journeys)
```

Besonders positiv: Jonas' Ansatz *"Kein Ziel von 100% Coverage. Tests sichern
Refactorings ab. Ein fehlschlagender Test blockiert den Merge."* — das ist
der pragmatisch richtige Ansatz.

**Eine Lücke bleibt: MSW (Mock Service Worker)** fehlt noch. RTL braucht eine
Strategie für API-Mocking in Tests. Ohne MSW werden Komponenten-Tests entweder
kompliziert oder die Tests testen nicht, was sie testen sollen. MSW ist das
Standard-Tool dafür und gehört in den Stack.

---

## ADR-014: Strict CI/CD Gates

**Bewertung: ✅ Richtig — ein Detail ist inkonsistent**

Die Pipeline ist gut:
```
Biome (Lint) → TS Strict Check → Unit Tests → Build
```

Inhaltlich korrekt: Kein Merge ohne grüne Pipeline, `ts-ignore` nur mit
Review-Begründung, TypeScript im strict-mode. Das sind die richtigen Gates.

**Konsistenz mit ADR-012:** Die Pipeline zeigt `Biome (Lint)`. Falls das
Team sich für ESLint entscheidet, muss dieser Schritt auf `ESLint + Prettier`
angepasst werden. Die Gate-Logik selbst bleibt identisch.

---

## Was in der Präsentation bewusst offen gelassen wurde

Auf der letzten Folie (Nächste Schritte) nennt Jonas explizit offene
Entscheidungen:

> *"Auth, API-Schicht, Error Handling, Event Tracking, i18n"*

Das ist ein wichtiger Unterschied zum ersten Vorschlag: Statt diese Themen zu
vergessen, werden sie bewusst als offen markiert. Das ist der richtige Umgang.

**Einschätzung zu den offenen Punkten:**

| Offener Punkt | Dringlichkeit | Empfehlung |
|---|---|---|
| **Auth** | Hoch | Muss vor dem ersten Feature entschieden werden (ADR 0007). Cidaas OAuth-Flow, Token-Speicherung (httpOnly Cookie empfohlen) |
| **API-Schicht** | Hoch | Axios mit Interceptors ist die durchdachte Wahl (AGENTS.md). Sollte als ADR beschlossen werden |
| **i18n** | Hoch | react-i18next ist installiert, ADR 0009 ist Proposed. Muss beschlossen werden bevor die ersten Komponenten gebaut werden — nachträglich einbauen ist ein vollständiger Refactor |
| **Error Handling** | Mittel | React Error Boundaries per Feature + globaler Axios-Interceptor |
| **Event Tracking** | Niedrig | Kann später entschieden werden |

---

## Was noch fehlt (nicht offen gelassen, sondern vergessen)

| Tool | Warum es nicht optional ist |
|---|---|
| **MSW (Mock Service Worker)** | Fehlt in ADR-013. RTL-Tests ohne API-Mocking sind unvollständig oder fragil |
| **Axios** | Unter "API-Schicht" offen gelassen — aber die Wahl (Axios vs. fetch) sollte aktiv getroffen, nicht aufgeschoben werden. Axios mit Auth-Interceptors ist die durchdachtere Wahl für diesen Stack |

---

## Fazit

Die Präsentation ist eine deutliche Verbesserung gegenüber dem ersten Vorschlag.
Jonas zeigt ein klares architektonisches Gesamtbild mit 14 begründeten ADRs.
Die meisten Entscheidungen sind gut bis sehr gut.

### Was übernommen werden sollte (keine Änderungen nötig)
- ADR-001: 3 unabhängige Apps (mit Mono-vs-Multi-Repo-Diskussion)
- ADR-002: Shared Package für Auth + API Client
- ADR-003: Feature-basierte Struktur
- ADR-004: Vite + React
- ADR-005: TanStack Router
- ADR-006: TanStack Query + Zustand
- ADR-007: React Hook Form + Zod
- ADR-008: Tailwind CSS
- ADR-009: Kein CSS Preprocessor
- ADR-010: Design Tokens
- ADR-011: shadcn/ui
- ADR-013: Vitest + RTL + Playwright
- ADR-014: Strict CI/CD (Pipeline anpassen nach ESLint-Entscheidung)

### Was im Team diskutiert werden muss
- **ADR-012 (Biome vs. ESLint + Prettier):** Biome hat React-Hooks-Regeln und
  a11y-Regeln — meine vorherige Analyse war falsch. Die Abstriche liegen bei
  type-aware TypeScript-Regeln (~85%), Import-Reihenfolge und fehlendem
  Plugin-System. Beides vertretbar, Team muss bewusst entscheiden.

### Was ergänzt werden muss
- **MSW** zu ADR-013 hinzufügen
- **Axios** unter "API-Schicht" aktiv entscheiden und als ADR festhalten
- **i18n** (react-i18next) vor dem ersten Feature-Sprint beschließen — nicht
  aufschieben
- **Mono-Repo vs. Multi-Repo** bei ADR-001 explizit diskutieren (Turborepo
  als Alternative zu separaten Repos)
