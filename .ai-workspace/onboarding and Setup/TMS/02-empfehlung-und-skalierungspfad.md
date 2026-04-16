# Empfehlung & Skalierungspfad für die Lernwelt

---

## TL;DR

**Empfehlung:** Starte mit **locize** (Starter, $7/Monat) für die erste
TMS-Integration. Wenn das Team wächst oder Non-Dev-Usability wichtiger wird als
i18next-Tiefe, evaluiere einen Wechsel zu **Crowdin**.

Der Skalierungspfad hat drei Phasen, die aufeinander aufbauen. Jeder Übergang
ist eine reine Konfigurationsänderung – kein Refactoring.

---

## Phase 1: JSON-Dateien im Repo (JETZT)

**Status:** Bereits umgesetzt.

```
Entwickler → schreibt t('key') → pflegt JSON → commit → push → deploy
```

| Aspekt | Details |
|---|---|
| Wer pflegt Texte? | Nur Entwickler |
| Source of Truth | `public/locales/de/*.json` im Git-Repo |
| i18next Backend | `i18next-resources-to-backend` (Dynamic Imports) |
| Kosten | $0 |
| Aufwand | Kein zusätzlicher |

**Wann weiter zu Phase 2?**
- Wenn Nicht-Entwickler Texte pflegen sollen
- Wenn eine zweite Sprache kommt und Übersetzer involviert werden
- Wenn Mandanten eigene Texte brauchen

---

## Phase 2: TMS mit Git-Sync

**Ziel:** Übersetzer/PMs arbeiten in einer Web-UI. Die JSON-Dateien im Repo
bleiben die Source of Truth. Das TMS synct bidirektional mit GitHub.

```
Entwickler → schreibt t('key') → pflegt DE-JSON → commit → push
                                                       ↓
                                          TMS erkennt neue Keys
                                                       ↓
                                   Übersetzer übersetzt im Web-Editor
                                                       ↓
                                       TMS erstellt PR mit EN-JSON
                                                       ↓
                                      Entwickler merged → deploy
```

### Setup mit locize

```bash
# 1. locize-CLI installieren
pnpm add -D locize-cli

# 2. Existierende JSON-Dateien zu locize migrieren
npx locize-migrate --project-id [ID] --path public/locales
```

Die i18next-Config bleibt gleich (Phase 1). locize synct die Dateien per CLI/CI:

```yaml
# .github/workflows/locize-sync.yml
name: Sync Translations
on:
  push:
    branches: [main]

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Upload sources to locize
        run: npx locize-cli sync --project-id ${{ secrets.LOCIZE_PROJECT_ID }}
```

### Alternativ: Setup mit Crowdin

```yaml
# crowdin.yml (im Repo-Root)
project_id_env: CROWDIN_PROJECT_ID
api_token_env: CROWDIN_TOKEN
base_path: "."

files:
  - source: /public/locales/de/*.json
    translation: /public/locales/%two_letters_code%/%original_file_name%
```

```yaml
# .github/workflows/crowdin.yml
name: Crowdin Sync
on:
  push:
    branches: [main]
  schedule:
    - cron: '0 5 * * *'

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: crowdin/github-action@v2
        with:
          upload_sources: true
          download_translations: true
          create_pull_request: true
          pull_request_title: 'chore: new translations from Crowdin'
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          CROWDIN_PROJECT_ID: ${{ secrets.CROWDIN_PROJECT_ID }}
          CROWDIN_PERSONAL_TOKEN: ${{ secrets.CROWDIN_TOKEN }}
```

| Aspekt | Details |
|---|---|
| Wer pflegt Texte? | Entwickler (DE) + Übersetzer/PMs (andere Sprachen, via Web-UI) |
| Source of Truth | Git-Repo (TMS synct bidirektional) |
| i18next Backend | Gleich wie Phase 1 (keine Änderung!) |
| Kosten | locize: $7–49/Monat · Crowdin: $40–100/Monat |
| Aufwand | ~2–4h Setup (CI/CD + TMS-Projekt anlegen) |

**Was sich NICHT ändert:**
- `t()`-Aufrufe in Komponenten
- Ordnerstruktur (`public/locales/...`)
- i18next-Konfiguration
- Build-Pipeline (JSON-Dateien werden weiterhin aus dem Repo geladen)

**Wann weiter zu Phase 3?**
- Wenn Textänderungen sofort live sein sollen (ohne Build/Deploy)
- Wenn das Deploy-Interval zu lang ist für Content-Fixes
- Wenn OTA-Updates für Mobile/PWA benötigt werden

---

## Phase 3: TMS mit CDN-Delivery

**Ziel:** Übersetzungen werden nicht mehr aus dem Repo geladen, sondern direkt
vom TMS-CDN. Textänderungen sind in Sekunden live – ohne Build, ohne Deploy.

```
Übersetzer ändert Text im TMS
    → Text wird sofort auf dem CDN veröffentlicht
        → Nächster Seitenaufruf holt den neuen Text
            → Keine Beteiligung von Entwicklern nötig
```

### Die einzige Code-Änderung

```typescript
// VORHER (Phase 1+2): Aus dem Repo
.use(resourcesToBackend(
  (lng, ns) => import(`../../public/locales/${lng}/${ns}.json`)
))

// NACHHER (Phase 3): Vom CDN
import Backend from 'i18next-locize-backend';
// oder: import HttpBackend from 'i18next-http-backend';

i18next
  .use(Backend)
  .init({
    backend: {
      projectId: '[PROJECT_ID]',
      // apiKey nur für saveMissing in dev
      apiKey: import.meta.env.DEV ? '[API_KEY]' : undefined,
    },
    // saveMissing nur in Development – neue Keys automatisch erfassen
    saveMissing: import.meta.env.DEV,
  });
```

| Aspekt | Details |
|---|---|
| Wer pflegt Texte? | Übersetzer/PMs – komplett ohne Entwickler |
| Source of Truth | TMS (nicht mehr Git) |
| i18next Backend | `i18next-locize-backend` oder `i18next-http-backend` |
| Kosten | locize: $49–99/Monat · Crowdin OTA: Extra |
| Aufwand | ~1h (Backend-Plugin tauschen) |

**Was sich NICHT ändert:**
- `t()`-Aufrufe in Komponenten (identisch!)
- Namespace-Struktur
- TypeScript-Integration

**Trade-offs:**
- ✅ Textänderungen in Sekunden live
- ✅ Kein Build/Deploy für Content-Fixes
- ⚠️ Abhängigkeit vom CDN (Offline-Fallback konfigurieren!)
- ⚠️ Source of Truth ist nicht mehr Git (weniger Kontrolle für Devs)
- ⚠️ TypeScript-Types müssen separat generiert werden

---

## Zusammenfassung: Der Dreistufenplan

```
Phase 1                    Phase 2                    Phase 3
JSON im Repo        →     TMS + Git-Sync       →     TMS + CDN
──────────────            ──────────────              ──────────────
Nur Devs                  Devs + Übersetzer           Nur Übersetzer/PMs
$0                        $7–100/Monat                $49–99/Monat
Source: Git               Source: Git (synced)        Source: TMS-CDN
Deploy nötig              Deploy nötig                Kein Deploy nötig
```

**Keine Phase erfordert Refactoring der Komponenten.** Der `t()`-Aufruf bleibt
in jeder Phase identisch. Nur die Config von i18next ändert sich.

---

## Warum locize als Erstempfehlung?

| Grund | Details |
|---|---|
| **Nativste i18next-Integration** | Vom gleichen Team gebaut – kein Wrapper, kein Adapter |
| **`saveMissing` eingebaut** | Neue Keys werden automatisch erfasst, kein manuelles Eintragen |
| **Günstigster Einstieg** | $7/Monat (Starter) vs. $40+ (Crowdin) vs. $525+ (Phrase) |
| **CDN-Delivery eingebaut** | Kein Extra-Feature – Kernfunktion der Plattform |
| **Migration trivial** | `npx locize-migrate` importiert existierende JSON-Dateien |
| **Phase 2 → 3 ist 1 Zeile** | Backend-Plugin tauschen, fertig |

### Wann stattdessen Crowdin?

- Wenn das Team wächst und die Non-Dev-UI von Crowdin besser passt
- Wenn Community-Übersetzer eingeladen werden sollen
- Wenn Integrationen mit Figma, Jira oder Slack gebraucht werden
- Wenn eine Übersetzungsagentur eingebunden wird (Crowdin ist dort bekannter)

### Wann Phrase?

- Enterprise mit SOC-2-Compliance oder Audit-Anforderungen
- Dediziertes Lokalisierungsteam (>5 Personen)
- Wenn bereits eine Phrase-Lizenz existiert

---

## Nächste Schritte (wenn Phase 2 ansteht)

1. locize Free Account erstellen (kein Kreditkarte nötig)
2. Existierende JSON-Dateien importieren (`locize-migrate`)
3. GitHub Action für Sync einrichten
4. Einen Übersetzer/PM einladen und den Web-Editor testen
5. Bei Bedarf auf Starter ($7) upgraden
