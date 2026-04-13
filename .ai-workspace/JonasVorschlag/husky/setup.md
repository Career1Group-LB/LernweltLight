# Husky + lint-staged + Commitlint Setup Guide — Lernwelt Frontend

Schritt-für-Schritt-Anleitung: Git Hooks einrichten, damit Code automatisch
geprüft wird **bevor** er committet wird und Commit-Messages einem einheitlichen
Format folgen.

Quellen:
- [typicode.github.io/husky](https://typicode.github.io/husky/get-started.html)
- [commitlint.js.org](https://commitlint.js.org/guides/getting-started.html)
- [github.com/lint-staged/lint-staged](https://github.com/lint-staged/lint-staged)

---

## Was wird installiert und warum?

| Paket | Zweck |
|---|---|
| `husky` | Ermöglicht Git Hooks als normale Dateien im Repo — jeder im Team bekommt sie automatisch |
| `lint-staged` | Führt Befehle **nur auf geänderten (staged) Dateien** aus — nicht auf dem ganzen Projekt |
| `@commitlint/cli` | Prüft ob Commit-Messages dem Conventional-Commits-Format folgen |
| `@commitlint/config-conventional` | Standard-Regelset für Conventional Commits |

### Wie die drei Tools zusammenspielen

```
git add .
git commit -m "fix: login-bug behoben"
       │
       ▼
  ┌─────────────┐
  │   Husky      │  ← Fängt den Git-Commit ab
  │ (Git Hooks)  │
  └──────┬───────┘
         │
         ├──── pre-commit Hook ────►  lint-staged
         │                             └── biome check --write (nur staged files)
         │
         └──── commit-msg Hook ────►  commitlint
                                       └── Prüft: folgt die Message dem Format?
                                           "fix: ..." ✅
                                           "gefixt"   ❌ → Commit wird abgelehnt
```

**Ohne Husky** müsste jeder Entwickler manuell `pnpm biome check .` vor jedem
Commit ausführen und sich an das Commit-Format erinnern. Mit Husky passiert das
automatisch — vergessen ist unmöglich.

---

## Schritt 1: Pakete installieren

```bash
pnpm add -D husky lint-staged @commitlint/cli @commitlint/config-conventional
```

**Was passiert:** Vier Dev-Dependencies werden installiert:

- **husky** (v9.1.7) — das Hook-Management-Tool. Nur ~2 KB, keine eigenen
  Dependencies.
- **lint-staged** (v16.4.0) — führt Linter/Formatter nur auf staged Dateien aus,
  damit Pre-Commit-Hooks schnell bleiben.
- **@commitlint/cli** (v20.5.0) — das CLI-Tool das Commit-Messages parst und
  gegen Regeln prüft.
- **@commitlint/config-conventional** (v20.5.0) — vordefiniertes Regelset basierend
  auf dem [Conventional Commits](https://www.conventionalcommits.org/de/v1.0.0/)
  Standard.

---

## Schritt 2: Husky initialisieren

```bash
pnpm exec husky init
```

**Was passiert:** Zwei Dinge:

1. Erstellt einen `.husky/` Ordner im Projekt-Root mit einer Beispiel-Datei
   `.husky/pre-commit`
2. Fügt ein `"prepare": "husky"` Script in die `package.json` ein

### Was macht das `prepare`-Script?

`prepare` ist ein spezieller npm/pnpm-Lifecycle-Hook — er wird **automatisch**
ausgeführt nach jedem `pnpm install`. Das bedeutet:

- Du klonst das Repo → `pnpm install` → Husky wird automatisch aktiviert
- Ein neuer Kollege klont das Repo → `pnpm install` → Husky wird automatisch
  aktiviert
- Niemand muss manuell etwas einrichten

**Der `.husky/` Ordner wird ins Git committed.** Die Hook-Dateien sind Teil des
Repos, nicht Teil einer lokalen Konfiguration.

---

## Schritt 3: Pre-Commit Hook einrichten

Ersetze den Inhalt von `.husky/pre-commit` mit:

```bash
echo "pnpm lint-staged" > .husky/pre-commit
```

**Was passiert:** Jetzt wird bei jedem `git commit` der Befehl `pnpm lint-staged`
ausgeführt — **bevor** der Commit tatsächlich erstellt wird. Wenn lint-staged
einen Fehler findet (Lint-Fehler, Formatierungsproblem), wird der Commit
**abgelehnt**.

### Warum lint-staged statt `biome check .`?

Stell dir vor, du änderst eine einzige Datei. Ohne lint-staged würde
`biome check .` trotzdem alle 72+ Dateien im Projekt prüfen. Das dauert zwar
bei Biome nur Millisekunden, aber es kann unerwartete Fehler in Dateien melden,
die du gar nicht angefasst hast — und deinen Commit blockieren.

**lint-staged prüft nur die Dateien, die du tatsächlich geändert hast (staged
files).** Das ist schneller und verhindert frustrierende Situationen, in denen
ein Commit wegen einer Datei scheitert, die nichts mit deiner Änderung zu tun
hat.

---

## Schritt 4: lint-staged konfigurieren

Erstelle eine Datei `lint-staged.config.js` im Projekt-Root:

```js
export default {
  "*.{js,ts,jsx,tsx,json,css}": ["biome check --write --no-errors-on-unmatched"],
};
```

**Was passiert:** lint-staged weiß jetzt: "Wenn eine staged Datei auf `.js`,
`.ts`, `.jsx`, `.tsx`, `.json` oder `.css` endet, führe `biome check --write`
darauf aus."

### Die Flags erklärt

| Flag | Bedeutung |
|---|---|
| `--write` | Biome darf Safe-Fixes automatisch anwenden (Formatierung, Import-Sortierung) |
| `--no-errors-on-unmatched` | Kein Fehler wenn eine Datei keinem Biome-Pattern entspricht |

### Warum nicht in `package.json`?

lint-staged-Konfiguration kann auch direkt in `package.json` unter dem Key
`"lint-staged"` stehen. Eine eigene Datei hält die `package.json` aber sauber
und ermöglicht Kommentare — bei einem Projekt mit vielen Tools in der
`package.json` hilft das bei der Übersicht.

---

## Schritt 5: Commit-Message Hook einrichten

Erstelle den commit-msg Hook:

```bash
echo "pnpm commitlint --edit \$1" > .husky/commit-msg
```

**Was passiert:** Ein zweiter Git Hook wird erstellt. Dieser wird **nach** dem
pre-commit Hook ausgeführt und prüft die Commit-Message. `--edit $1` bedeutet:
"Lies die Message aus der temporären Datei, die Git für den Commit erstellt hat."

Wenn die Message nicht dem Conventional-Commits-Format entspricht → Commit wird
abgelehnt.

---

## Schritt 6: Commitlint konfigurieren

Erstelle eine Datei `commitlint.config.js` im Projekt-Root:

```js
export default {
  extends: ["@commitlint/config-conventional"],
};
```

**Was passiert:** Commitlint weiß jetzt, welche Regeln gelten. Das
`config-conventional` Regelset basiert auf dem
[Conventional Commits](https://www.conventionalcommits.org/de/v1.0.0/) Standard
und erzwingt folgendes Format:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Erlaubte Commit-Types

| Type | Wann verwenden | Beispiel |
|---|---|---|
| `feat` | Neue Funktion/Feature | `feat: kurs-filter hinzugefügt` |
| `fix` | Bugfix | `fix: login-redirect bei abgelaufenem token` |
| `docs` | Nur Dokumentation | `docs: api-endpunkte im readme ergänzt` |
| `style` | Formatierung, kein Code-Änderung | `style: einrückung in sidebar korrigiert` |
| `refactor` | Code-Umbau ohne neue Funktion oder Bugfix | `refactor: useCourses hook vereinfacht` |
| `perf` | Performance-Verbesserung | `perf: kurs-liste mit virtualisierung` |
| `test` | Tests hinzufügen/ändern | `test: unit-tests für quiz-schema` |
| `build` | Build-System, Dependencies | `build: vite auf v7.4 aktualisiert` |
| `ci` | CI/CD-Konfiguration | `ci: playwright in github-actions pipeline` |
| `chore` | Sonstiges (kein src/test) | `chore: biome auf v2.5 aktualisiert` |
| `revert` | Einen früheren Commit rückgängig machen | `revert: feat: kurs-filter hinzugefügt` |

### Regeln im Detail

| Regel | Was sie prüft | Beispiel |
|---|---|---|
| `type-enum` | Type muss aus der obigen Liste sein | `feature: ...` ❌ → `feat: ...` ✅ |
| `type-case` | Type muss lowercase sein | `Feat: ...` ❌ → `feat: ...` ✅ |
| `type-empty` | Type darf nicht leer sein | `: beschreibung` ❌ |
| `subject-empty` | Beschreibung darf nicht leer sein | `feat:` ❌ |
| `subject-case` | Kein Satzanfang-Großbuchstabe | `feat: Login hinzugefügt` ❌ → `feat: login hinzugefügt` ✅ |
| `subject-full-stop` | Kein Punkt am Ende | `feat: login.` ❌ → `feat: login` ✅ |
| `header-max-length` | Max. 100 Zeichen in der ersten Zeile | Zu lange Messages werden abgelehnt |

### Optionaler Scope

Der Scope in Klammern ist optional, aber hilfreich um den Bereich einzugrenzen:

```
feat(auth): remember-me checkbox hinzugefügt
fix(courses): korrekte sortierung nach datum
refactor(sidebar): navigation als eigene komponente extrahiert
```

Scopes folgen typischerweise den Feature-Modulen: `auth`, `courses`, `quiz`,
`profile`, `progress`, `sidebar`, `i18n`, etc.

---

## Schritt 7: package.json-Scripts ergänzen

Füge ein `prepare`-Script hinzu (falls `husky init` das nicht schon gemacht hat):

```json
{
  "scripts": {
    "prepare": "husky"
  }
}
```

**Was passiert:** `pnpm install` aktiviert jetzt automatisch die Git Hooks für
jeden Entwickler. Das `prepare`-Script wird von pnpm nach jeder Installation
ausgeführt.

> **Hinweis:** `husky init` hat dieses Script normalerweise schon eingefügt.
> Prüfe einfach deine `package.json` — wenn `"prepare": "husky"` schon drin
> steht, ist nichts zu tun.

---

## Schritt 8: Testen

### Pre-Commit Hook testen

```bash
# Ändere eine Datei und stage sie
echo "" >> src/App.tsx
git add src/App.tsx
git commit -m "test: husky pre-commit hook prüfen"
```

**Erwartetes Ergebnis:** lint-staged führt `biome check --write` auf `App.tsx`
aus. Wenn alles sauber ist, geht der Commit durch. Wenn Biome Fehler findet,
wird der Commit abgelehnt.

### Commitlint testen — falsche Message

```bash
git commit -m "hab was gefixt"
```

**Erwartetes Ergebnis:**

```
⧗   input: hab was gefixt
✖   subject may not be empty [subject-empty]
✖   type may not be empty [type-empty]

✖   Found 2 problems, 0 warnings
```

Der Commit wird abgelehnt, weil die Message kein `type:` Prefix hat.

### Commitlint testen — korrekte Message

```bash
git commit -m "fix: login-redirect bei abgelaufenem token"
```

**Erwartetes Ergebnis:** Commit geht durch ✅

---

## Schritt 9: Dateien ins Git aufnehmen

```bash
git add .husky/ lint-staged.config.js commitlint.config.js package.json pnpm-lock.yaml
git commit -m "build: husky, lint-staged und commitlint eingerichtet"
```

**Wichtig:** Der `.husky/` Ordner **muss** committed werden. Er enthält die
Hook-Dateien, die jeder Entwickler im Team braucht.

---

## Zusammenfassung: Was jetzt bei jedem Commit passiert

```
Entwickler tippt: git commit -m "feat(auth): passwort-reset flow"
                         │
                         ▼
              ┌──────────────────────┐
              │  .husky/pre-commit   │
              │  → pnpm lint-staged  │
              └──────────┬───────────┘
                         │
                         ▼
              ┌──────────────────────────────────────┐
              │  lint-staged                          │
              │  → biome check --write (staged files) │
              │                                       │
              │  Fehler? → Commit abgelehnt ❌        │
              │  Alles OK? → weiter ✅                │
              └──────────┬───────────────────────────┘
                         │
                         ▼
              ┌──────────────────────┐
              │  .husky/commit-msg   │
              │  → pnpm commitlint   │
              └──────────┬───────────┘
                         │
                         ▼
              ┌──────────────────────────────────────┐
              │  commitlint                           │
              │  → Prüft: "feat(auth): ..." Format?   │
              │                                       │
              │  Falsch? → Commit abgelehnt ❌        │
              │  Korrekt? → Commit erstellt ✅        │
              └──────────────────────────────────────┘
```

---

## Bonus: Husky temporär deaktivieren

In seltenen Fällen willst du einen Commit ohne Hooks machen (z.B. ein
Work-in-Progress-Commit):

```bash
git commit -m "wip: zwischenstand" --no-verify
```

Das `--no-verify` Flag überspringt **alle** Git Hooks (pre-commit und
commit-msg). Sollte nur in Ausnahmefällen verwendet werden — im normalen
Workflow nie.

Alternativ kann Husky global deaktiviert werden:

```bash
HUSKY=0 git commit -m "wip: zwischenstand"
```

---

## Bonus: CI/CD-Integration

In der CI-Pipeline (GitHub Actions, Azure DevOps) brauchst du Husky **nicht** —
dort läuft `biome ci` direkt und Commit-Messages werden durch die Pipeline-Config
erzwungen.

Husky erkennt CI-Umgebungen automatisch und deaktiviert sich selbst, wenn die
`CI`-Umgebungsvariable gesetzt ist (was bei GitHub Actions und Azure DevOps
standardmäßig der Fall ist).

Falls du trotzdem Commit-Messages in der CI prüfen willst:

```yaml
# .github/workflows/ci.yml (Auszug)
- name: Validate commit messages
  run: pnpm commitlint --from ${{ github.event.pull_request.base.sha }} --to HEAD
```

Das prüft alle Commit-Messages eines Pull Requests auf einmal.

---

## Häufige Fragen

### "Muss ich die Commit-Types auswendig lernen?"

Nein. Nach ein paar Tagen sind `feat`, `fix`, `docs`, `refactor`, `test` und
`chore` in Fleisch und Blut übergegangen — das sind die 6, die man am häufigsten
braucht. Für den Rest kann man jederzeit hier nachschlagen.

### "Was wenn ich einen Fehler in der Commit-Message mache?"

Commitlint zeigt dir genau, was falsch ist:

```
⧗   input: Fix: Login bug behoben
✖   type must be lower-case [type-case]

✖   Found 1 problem, 0 warnings
```

Du musst dann einfach nochmal committen mit der korrigierten Message:

```bash
git commit -m "fix: login bug behoben"
```

### "Verlangsamt das meinen Workflow?"

Nein. lint-staged + Biome auf staged Dateien dauert typischerweise unter 100ms.
Commitlint prüft einen String — das ist unter 50ms. Du merkst keinen
Unterschied.

### "Kann ich eigene Commit-Types hinzufügen?"

Ja, in `commitlint.config.js`:

```js
export default {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "type-enum": [
      2,
      "always",
      [
        "feat",
        "fix",
        "docs",
        "style",
        "refactor",
        "perf",
        "test",
        "build",
        "ci",
        "chore",
        "revert",
        "wip",       // ← eigener Type für Work-in-Progress
      ],
    ],
  },
};
```

Aber Vorsicht: je näher ihr am Standard bleibt, desto einfacher ist es für neue
Teammitglieder.

### "Was passiert wenn ich `pnpm install` vergesse?"

Ohne `pnpm install` wird das `prepare`-Script nicht ausgeführt und Husky ist
nicht aktiv. Commits gehen dann ohne Prüfung durch. Das ist kein Sicherheitsrisiko
— die CI-Pipeline prüft trotzdem alles. Aber es bedeutet, dass du Fehler erst
beim Push statt beim Commit entdeckst.

---

## Datei-Übersicht nach dem Setup

```
projekt-root/
├── .husky/
│   ├── pre-commit          ← "pnpm lint-staged"
│   └── commit-msg          ← "pnpm commitlint --edit $1"
├── lint-staged.config.js   ← Welche Dateien mit welchem Tool geprüft werden
├── commitlint.config.js    ← Conventional Commits Regelset
├── biome.json              ← Biome-Konfiguration (schon vorhanden)
└── package.json            ← prepare-Script + neue devDependencies
```
