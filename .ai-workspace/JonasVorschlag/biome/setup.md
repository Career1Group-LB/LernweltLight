# Biome Setup Guide — Lernwelt Frontend

Schritt-für-Schritt-Anleitung: ESLint + Prettier durch Biome ersetzen.
Jeder Schritt erklärt **was** gemacht wird und **warum**.

Quelle: [biomejs.dev/guides/getting-started](https://biomejs.dev/guides/getting-started/)

---

## Was wir ersetzen

| Vorher (9 Pakete) | Nachher (1 Paket) |
|---|---|
| `eslint` | `@biomejs/biome` |
| `@eslint/js` | — |
| `typescript-eslint` | — |
| `eslint-plugin-react-hooks` | — |
| `eslint-plugin-react-refresh` | — |
| `eslint-plugin-import-x` | — |
| `eslint-import-resolver-typescript` | — |
| `globals` | — |
| `prettier` | — |

Biome übernimmt Linting **und** Formatierung in einem einzigen Tool.

---

## Schritt 1: Biome installieren

```bash
pnpm add -D -E @biomejs/biome
```

**Was passiert:** Biome wird als Dev-Dependency installiert. Es ist ein einzelnes
Binary (Rust-basiert), das keinen Node.js-Runtime braucht — deshalb ist es so
schnell.

**Warum `-E` (`--save-exact`)?** Ohne `-E` würde pnpm die Version mit `^`
eintragen (z.B. `"^2.4.1"`) — das erlaubt automatische Minor-Updates. Biome
ist ein Formatter: selbst ein kleiner Versionssprung kann Zeilenumbrüche an
anderen Stellen setzen. Wenn zwei Entwickler unterschiedliche Biome-Versionen
haben, formatiert einer eine Datei so und der andere anders — das erzeugt
sinnlose Git-Diffs und Merge-Konflikte.

Mit `-E` wird die Version exakt gepinnt (`"2.4.1"` statt `"^2.4.1"`). Jeder
im Team bekommt garantiert dieselbe Formatierung. Upgrades passieren dann
bewusst: `pnpm add -D -E @biomejs/biome@latest`, Änderungen prüfen, committen.

> Quelle: [biomejs.dev – Version pinning](https://biomejs.dev/guides/getting-started/)

---

## Schritt 2: Biome initialisieren

```bash
pnpx @biomejs/biome init
```

**Was passiert:** Erstellt eine `biome.json` im Projekt-Root. Das ist die
einzige Config-Datei die Biome braucht — sie ersetzt `eslint.config.js`,
`.prettierrc` und `.prettierignore` gleichzeitig.

> Quelle: [biomejs.dev – Configuration](https://biomejs.dev/guides/getting-started/#configuration)

---

## Schritt 3: Bestehende Configs automatisch migrieren (OPTIONAL)

> **Für ein Greenfield-Projekt diesen Schritt überspringen.** Die
> `migrate`-Befehle sind für bestehende Produktionsprojekte gedacht, bei denen
> das exakte Regelverhalten erhalten bleiben soll. Sie setzen `recommended: false`
> und aktivieren nur Regeln die ein ESLint-Äquivalent haben — damit verlierst
> du ~150 zusätzliche Biome-Regeln (a11y, Performance, strengere
> TypeScript-Checks), die `recommended: true` gratis mitbringt.
>
> Bei einem neuen Projekt ist die bessere Strategie: `biome init` (Schritt 2)
> → `recommended: true` lassen → nur Formatter-Einstellungen manuell setzen
> (Schritt 4).

Biome hat dedizierte Migrations-Befehle, die deine bestehende ESLint- und
Prettier-Konfiguration automatisch in `biome.json` übersetzen:

```bash
pnpx @biomejs/biome migrate eslint --write
pnpx @biomejs/biome migrate prettier --write
```

**Was passiert:**

1. `migrate eslint --write` liest `eslint.config.js`, erkennt die aktivierten
   Plugins und Regeln, und schreibt die Biome-Äquivalente in `biome.json`.
   Es kann sowohl die alte `.eslintrc`-Syntax als auch die neue Flat-Config
   verarbeiten.

2. `migrate prettier --write` liest `.prettierrc` und übersetzt die
   Formatter-Einstellungen (Semicolons, Quotes, Indent-Style, etc.) in das
   Biome-Format.

Beide Befehle **überschreiben** die bestehende `biome.json` — deshalb erst
`init`, dann `migrate`.

> Quelle: [biomejs.dev – Migrate from ESLint and Prettier](https://biomejs.dev/guides/migrate-eslint-prettier/)

### Ergebnis prüfen und nachschärfen

Die Migration übersetzt so viel wie möglich automatisch. Danach solltest du
die generierte `biome.json` prüfen und ggf. Regeln ergänzen, die für unser
Projekt wichtig sind aber nicht automatisch erkannt wurden:

```json
{
  "linter": {
    "rules": {
      "correctness": {
        "useHookAtTopLevel": "error",
        "useExhaustiveDependencies": "warn"
      },
      "suspicious": {
        "noExplicitAny": "error"
      }
    }
  }
}
```

**Warum diese drei Regeln explizit prüfen:**

| Biome-Regel | ESLint-Äquivalent | Was sie macht |
|---|---|---|
| `useHookAtTopLevel` | `react-hooks/rules-of-hooks` | Hooks dürfen nur auf Top-Level aufgerufen werden — nicht in if/for/nach return |
| `useExhaustiveDependencies` | `react-hooks/exhaustive-deps` | Prüft ob alle Dependencies in useEffect/useCallback/useMemo korrekt sind |
| `noExplicitAny` | `@typescript-eslint/no-explicit-any` | Verbietet `any` — erzwingt typsicheren Code |

Die Migration sollte diese Regeln bereits erkannt haben (sie kommen aus
`eslint-plugin-react-hooks` und `typescript-eslint` in unserer Config).
Trotzdem einmal manuell sicherstellen.

---

## Ergebnis: Wie die `biome.json` aussehen sollte

Die Migrations-Befehle generieren die meisten Einstellungen automatisch.
Hier die Referenz-Konfiguration, abgestimmt auf unser Projekt, damit du
weißt was jeder Teil macht:

```json
{
  "$schema": "https://biomejs.dev/schemas/2.0.0/schema.json",
  "files": {
    "includes": ["**", "!dist", "!node_modules", "!public"]
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2,
    "lineWidth": 100
  },
  "javascript": {
    "formatter": {
      "quoteStyle": "single",
      "trailingCommas": "all",
      "semicolons": "always",
      "arrowParentheses": "always"
    }
  },
  "organizeImports": {
    "enabled": true
  },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      "correctness": {
        "useHookAtTopLevel": "error",
        "useExhaustiveDependencies": "warn"
      },
      "suspicious": {
        "noExplicitAny": "error"
      },
      "style": {
        "noNonNullAssertion": "warn"
      }
    }
  }
}
```

### Was jede Sektion macht

#### `files.includes`
Welche Dateien Biome verarbeitet. Die `!`-Prefix-Einträge sind Ausschlüsse.
Identisch mit dem was ESLint via `globalIgnores(['dist'])` und
`.prettierignore` gemacht hat.

#### `formatter`
Ersetzt `.prettierrc`. Die Werte kommen 1:1 aus unserer Prettier-Config:

| Prettier (vorher) | Biome (nachher) |
|---|---|
| `"semi": true` | `"semicolons": "always"` |
| `"singleQuote": true` | `"quoteStyle": "single"` |
| `"trailingComma": "all"` | `"trailingCommas": "all"` |
| `"printWidth": 100` | `"lineWidth": 100` |
| `"tabWidth": 2` | `"indentWidth": 2` |
| `"arrowParens": "always"` | `"arrowParentheses": "always"` |

Selbe Ausgabe, anderes Format. Der formatierte Code sieht identisch aus.

#### `organizeImports`
Ersetzt `eslint-plugin-import-x` für die Import-Sortierung. Biome sortiert
Imports automatisch beim Formatieren:
- Erst Seiteneffekt-Imports (`import './styles.css'`)
- Dann externe Pakete (`import { useQuery } from '@tanstack/react-query'`)
- Dann interne Imports (`import { Button } from '@/shared/components/Button'`)

Das ist weniger granular als die 6 Import-Gruppen in der ESLint-Config
(builtin → external → internal → parent → sibling → index). Biome
sortiert alphabetisch innerhalb der Gruppen und trennt mit Leerzeilen.

#### `linter.rules`

**Warum `recommended: true` so viel abdeckt:** Biome bündelt alle Regeln in
einem Paket. `recommended` aktiviert automatisch:
- React-spezifische Regeln (Hook-Regeln, JSX-Best-Practices)
- TypeScript-Regeln (no-unused-vars, no-explicit-any, etc.)
- Accessibility-Regeln (21+ a11y-Checks)
- Performance-Regeln (no-accumulating-spread, etc.)

Bei ESLint brauchst du dafür 5 separate Plugins. Bei Biome ist alles drin.

---

## Schritt 4: Alte ESLint + Prettier Pakete entfernen

```bash
pnpm remove eslint @eslint/js typescript-eslint eslint-plugin-react-hooks eslint-plugin-react-refresh eslint-plugin-import-x eslint-import-resolver-typescript globals prettier
```

**Was passiert:** Alle 9 Pakete, die vorher für Linting und Formatierung
zuständig waren, werden deinstalliert. Nach diesem Schritt ist nur noch
`@biomejs/biome` für beides zuständig.

---

## Schritt 5: Alte Config-Dateien löschen

Folgende Dateien werden nicht mehr gebraucht:

```bash
rm eslint.config.js .prettierrc .prettierignore
```

**Warum:** `biome.json` ersetzt alle drei. Wenn die alten Dateien liegen
bleiben, sorgen sie für Verwirrung ("Welche Config gilt?").

---

## Schritt 6: `package.json` Scripts anpassen

Die Scripts in `package.json` müssen auf Biome umgestellt werden:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "lint": "biome check .",
    "lint:fix": "biome check --write .",
    "format": "biome format --write .",
    "format:check": "biome format .",
    "test": "vitest run",
    "test:watch": "vitest",
    "type-check": "tsc -b"
  }
}
```

**Was die neuen Scripts machen:**

| Script | Vorher | Nachher | Was passiert |
|---|---|---|---|
| `lint` | `eslint .` | `biome check .` | Lintet + prüft Formatierung + prüft Import-Sortierung — alles in einem Befehl |
| `lint:fix` | (gab es nicht) | `biome check --write .` | Wie `lint`, aber fixt automatisch alles was sicher gefixt werden kann |
| `format` | `prettier --write "src/**/*.{ts,tsx,css}"` | `biome format --write .` | Formatiert alle Dateien (wie Prettier, aber schneller) |
| `format:check` | `prettier --check "src/**/*.{ts,tsx,css}"` | `biome format .` | Prüft ob alles formatiert ist (ohne zu ändern) — für CI |

**`biome check` vs. `biome lint` vs. `biome format`:**
- `biome lint` — nur Lint-Regeln
- `biome format` — nur Formatierung
- `biome check` — **beides zusammen** + Import-Sortierung. Das ist der
  Befehl den du im Alltag nutzt.

**Wichtig: `--write` statt `--fix`.** Biome verwendet `--write` als Flag
zum automatischen Anwenden von Änderungen (Formatierung, Safe-Fixes,
Import-Sortierung). Das gilt für alle drei Befehle: `check --write`,
`lint --write`, `format --write`.

> Quelle: [biomejs.dev – CLI Usage](https://biomejs.dev/guides/getting-started/#command-line-interface)

---

## Schritt 7: Editor-Integration (Cursor/VS Code)

Installiere die offizielle Biome-Extension:

1. Extensions öffnen (Cmd+Shift+X)
2. Suche: "Biome"
3. Installiere **"Biome"** (offiziell von biomejs)

Dann erstelle eine `.vscode/settings.json` im Projekt:

```json
{
  "editor.defaultFormatter": "biomejs.biome",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "quickfix.biome": "explicit",
    "source.organizeImports.biome": "explicit"
  },
  "[typescript]": {
    "editor.defaultFormatter": "biomejs.biome"
  },
  "[typescriptreact]": {
    "editor.defaultFormatter": "biomejs.biome"
  },
  "[javascript]": {
    "editor.defaultFormatter": "biomejs.biome"
  },
  "[json]": {
    "editor.defaultFormatter": "biomejs.biome"
  }
}
```

**Was das macht:**
- **`editor.defaultFormatter`:** Biome wird als Standard-Formatter gesetzt
  (statt Prettier)
- **`editor.formatOnSave`:** Beim Speichern wird automatisch formatiert
- **`source.organizeImports.biome`:** Imports werden beim Speichern
  automatisch sortiert
- **`quickfix.biome`:** Lint-Fixes werden beim Speichern automatisch
  angewendet (wo sicher möglich)

Danach: Die alte Prettier- und ESLint-Extension **deaktivieren** (nicht
deinstallieren — du willst sie vielleicht in anderen Projekten behalten).

> Quelle: [biomejs.dev – Editor Integrations](https://biomejs.dev/guides/getting-started/#editor-integrations)

---

## Schritt 8: Einmal über das gesamte Projekt laufen lassen

```bash
pnpm biome check --write .
```

**Was passiert:** Biome formatiert alle Dateien einheitlich um und fixt
automatisch behebbare Lint-Fehler. Da Biome leicht anders formatiert als
Prettier (z.B. bei einigen JSX-Einrückungen), gibt es beim ersten Mal viele
Dateiänderungen. Das ist normal — danach ist alles konsistent.

Die offiziellen Doku beschreibt die
[Differences with Prettier](https://biomejs.dev/formatter/differences-with-prettier/)
— die Abweichungen sind minimal, aber vorhanden.

**Tipp:** Mach das als eigenen Commit mit einer klaren Message:

```bash
git add .
git commit -m "chore: migrate from ESLint + Prettier to Biome"
```

So ist klar wo Formatierungsänderungen herkommen und Feature-Commits bleiben
sauber.

---

## Schritt 9: Prüfen ob alles funktioniert

```bash
# Lint + Format prüfen (sollte 0 Fehler zeigen)
pnpm lint

# TypeScript-Typen prüfen (unverändert, Biome ersetzt tsc nicht)
pnpm type-check

# Tests laufen lassen (sollten weiterhin grün sein)
pnpm test
```

**Wichtig:** Biome ersetzt `tsc` **nicht**. TypeScript-Typprüfung (`tsc -b`)
läuft weiterhin separat. Biome prüft Lint-Regeln und formatiert — die echte
Typprüfung bleibt bei TypeScript.

---

## Bonus: CI/CD Pipeline mit `biome ci`

Biome hat einen eigenen CI-Befehl, der speziell für CI-Umgebungen optimiert
ist:

```bash
pnpm biome ci .
```

`biome ci` funktioniert wie `biome check`, aber:
- Gibt keine Farben/Interaktivität aus (CI-freundlich)
- Setzt den Exit-Code korrekt (1 bei Fehlern → Pipeline schlägt fehl)
- Optimiert für nicht-interaktive Umgebungen

In der CI-Pipeline (z.B. GitHub Actions) würde das so aussehen:

```yaml
# .github/workflows/ci.yml
name: CI
on: [pull_request]
jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm
      - run: pnpm install
      - run: pnpm biome ci .
      - run: pnpm type-check
      - run: pnpm test
```

> Quelle: [biomejs.dev – Continuous Integration](https://biomejs.dev/guides/getting-started/#continuous-integration)

---

## Was sich im Alltag ändert

### Vorher (ESLint + Prettier)

```bash
# Lint-Fehler finden
pnpm eslint .

# Formatierung prüfen
pnpm prettier --check .

# Formatierung fixen
pnpm prettier --write .

# Laufzeit: ~3-4 Sekunden gesamt
```

### Nachher (Biome)

```bash
# Alles in einem Befehl: Lint + Format + Import-Sortierung
pnpm biome check --write .

# Laufzeit: ~100-200 Millisekunden
```

Ein Befehl statt drei. Ein Config-File statt drei.

---

## Zusammenfassung der Dateien

### Dateien die WEG kommen
- `eslint.config.js`
- `.prettierrc`
- `.prettierignore`

### Dateien die NEU kommen
- `biome.json` (ersetzt alle drei oben)
- `.vscode/settings.json` (Editor-Integration)

### Dateien die ANGEPASST werden
- `package.json` (Scripts + Dependencies)

---

## Kompletter Ablauf auf einen Blick

```bash
# 1. Installieren
pnpm add -D -E @biomejs/biome

# 2. Initialisieren
pnpx @biomejs/biome init

# 3. (OPTIONAL) Bestehende Config migrieren — nur für bestehende Projekte
# pnpx @biomejs/biome migrate eslint --write
# pnpx @biomejs/biome migrate prettier --write

# 4. Alte Pakete entfernen
pnpm remove eslint @eslint/js typescript-eslint eslint-plugin-react-hooks \
  eslint-plugin-react-refresh eslint-plugin-import-x \
  eslint-import-resolver-typescript globals prettier

# 5. Alte Config-Dateien löschen
rm eslint.config.js .prettierrc .prettierignore

# 6. Scripts in package.json anpassen (manuell)

# 7. Editor-Extension installieren + .vscode/settings.json anlegen

# 8. Einmal alles durchlaufen lassen
pnpm biome check --write .

# 9. Prüfen
pnpm lint && pnpm type-check && pnpm test
```

---

## Regeln im Detail: Was Biome `recommended` alles aktiviert

Damit du verstehst was "recommended" konkret bedeutet — hier die wichtigsten
Regeln gruppiert nach Kategorie:

### React-Regeln (aus `correctness` und `suspicious`)
| Regel | Was sie fängt |
|---|---|
| `useHookAtTopLevel` | Hook in if-Block, nach return, in normaler Funktion |
| `useExhaustiveDependencies` | Fehlende/überflüssige Dependencies in useEffect etc. |
| `useJsxKeyInIterable` | Fehlendes `key`-Prop bei `.map()` in JSX |
| `noChildrenProp` | `children` als Prop statt als JSX-Kinder |

### TypeScript-Regeln (aus `suspicious` und `style`)
| Regel | Was sie fängt |
|---|---|
| `noExplicitAny` | `any`-Type (erzwingt typsicheren Code) |
| `noImplicitAnyLet` | `let x;` ohne Typ-Annotation (wird `any`) |
| `useNamespaceKeyword` | `module {}` statt `namespace {}` |
| `noUnusedVariables` | Unbenutzte Variablen und Imports |
| `noUnusedImports` | Imports die nie referenziert werden |

### Accessibility-Regeln (aus `a11y`)
| Regel | Was sie fängt |
|---|---|
| `useAltText` | `<img>` ohne `alt`-Attribut |
| `useAnchorContent` | `<a>` ohne sichtbaren Text |
| `noAriaHiddenOnFocusable` | `aria-hidden` auf fokussierbarem Element |
| `useSemanticElements` | `<div role="button">` statt `<button>` |
| `noLabelWithoutControl` | `<label>` ohne zugehöriges Input |
| `useFocusableInteractive` | Interaktives Element ohne Tastaturfokus |
| `noPositiveTabindex` | `tabIndex={5}` (zerstört Tab-Reihenfolge) |

### Performance-Regeln (aus `performance`)
| Regel | Was sie fängt |
|---|---|
| `noAccumulatingSpread` | `{...prev, newProp}` in einer Schleife (O(n²)) |
| `noDelete` | `delete obj.key` (deoptimiert das Objekt in V8) |
| `noBarrelFile` | Barrel-Exports die Tree-Shaking verhindern |

Das ist ein Auszug — insgesamt sind es ~200 Regeln die mit `recommended`
aktiv werden. Die vollständige Liste:
[biomejs.dev/linter/javascript/rules](https://biomejs.dev/linter/javascript/rules)

---

## Praxisbeispiel: Was beim ersten `biome check --write .` passiert

Beim ersten Durchlauf im MVP-Projekt kam folgende Ausgabe:

```
Checked 72 files in 23ms. Fixed 42 files.
Found 28 errors. Found 2 warnings. Found 3 infos.
```

### Was ist passiert?

**42 Dateien wurden automatisch gefixt** — das ist der Hauptjob von
`biome check --write`. Biome hat in diesen 42 Dateien Formatierungsänderungen
vorgenommen: Einrückungen angepasst, Quotes umgeschrieben, Imports sortiert,
Trailing Commas gesetzt. Das ist normal und erwartet — genau dafür ist der
Befehl da.

**28 Errors kamen aus leeren JSON-Dateien** — die eigentlichen Fehler:

```
public/locales/de/auth.json:1:1 parse
  ✖ Expected an array, an object, or a literal but instead found the end of the file.
```

Das Projekt hat 12 Locale-Dateien unter `public/locales/de/` die als
Platzhalter angelegt wurden (z.B. `auth.json`, `courses.json`, `profile.json`).
Diese Dateien sind **komplett leer** (0 Bytes). Eine leere Datei ist kein
valides JSON — JSON braucht mindestens einen Wert (`{}`, `[]`, `""`, etc.).

Biome versucht jede `.json`-Datei zu parsen und zu formatieren. Bei einer
leeren Datei schlägt der Parser fehl → Parse-Error → Formatter bricht ab
→ pro Datei 2 Errors (1x Parse, 1x "formatting aborted").

12 leere JSON-Dateien × 2 Errors = 24 der 28 Errors. Die restlichen 4
Errors + Warnings kamen wahrscheinlich aus Lint-Regeln im TypeScript-Code
(z.B. unbenutzte Imports, `any`-Types).

### Wie man das löst

**Option A:** Leere JSON-Dateien mit `{}` befüllen — das ist valides JSON
und reicht als Platzhalter:

```bash
echo '{}' > public/locales/de/auth.json
echo '{}' > public/locales/de/courses.json
# ... für alle leeren Dateien
```

**Option B:** `public/` in der `biome.json` von der Verarbeitung ausschließen,
wenn die Locale-Dateien nicht gelintet/formatiert werden sollen:

```json
{
  "files": {
    "includes": ["**", "!public/**"]
  }
}
```

Option A ist der sauberere Weg — leere Dateien ohne Inhalt sind generell
fragwürdig, nicht nur für Biome.

### Die "Skipped 8 suggested fixes"-Meldung

```
Skipped 8 suggested fixes.
If you wish to apply the suggested (unsafe) fixes, use biome check --write --unsafe
```

Biome unterscheidet zwischen **safe fixes** und **unsafe fixes**:

- **Safe fixes** werden mit `--write` automatisch angewendet — sie ändern
  die Bedeutung des Codes nie (z.B. Formatierung, Import-Sortierung,
  `var` → `const`).
- **Unsafe fixes** könnten die Code-Semantik verändern (z.B. eine Funktion
  umbenennen, einen Typ-Cast entfernen). Diese werden nur mit
  `--write --unsafe` angewendet.

Die 8 übersprungenen Fixes waren unsafe — Biome zeigt dir damit, dass es
Verbesserungen sieht, die es dir aber nicht aufzwingen will. Du kannst sie
einzeln prüfen mit `pnpm biome check .` (ohne `--write`) und dann
entscheiden ob du `--unsafe` laufen lässt oder die Stellen manuell korrigierst.

### Zusammenfassung

| Was | Anzahl | Bedeutung |
|---|---|---|
| Geprüfte Dateien | 72 | Alles was Biome im Projekt findet |
| Automatisch gefixt | 42 | Formatierung, Import-Sortierung, Safe-Fixes |
| Errors | 28 | Hauptsächlich leere JSON-Platzhalter-Dateien |
| Warnings | 2 | Lint-Warnungen im Code |
| Übersprungene Fixes | 8 | Unsafe Fixes — manuell prüfen |
| Laufzeit | **23ms** | Für 72 Dateien — das ist der Biome-Geschwindigkeitsvorteil |
