# Schritt 3: GitHub Action für Crowdin-Sync

---

## 3.1 Warum GitHub Action statt Native Integration?

Crowdin bietet zwei Wege für die GitHub-Anbindung:

| Methode | Vorteile | Nachteile |
|---|---|---|
| **Native GitHub-App** | 1-Klick-Setup in der Crowdin-UI | Zählt als 1 Integration (Free: max 1) |
| **GitHub Action** | Volle CI/CD-Kontrolle, mehr Flexibilität | Etwas mehr YAML schreiben |

Für das MVP nehmen wir die **GitHub Action** (`crowdin/github-action@v2`).
Vorteile:

- Unabhängig vom Integrations-Limit des Free Plans
- Die Sync-Logik ist im Repo (Git-versioniert, reviewbar)
- Trigger sind frei konfigurierbar (push, schedule, manuell)
- Kein Zugriff auf das Repo durch eine externe App nötig

---

## 3.2 Die Workflow-Datei

Erstelle `.github/workflows/crowdin-sync.yml`:

```yaml
name: Crowdin Sync

on:
  push:
    branches: [main]
    paths:
      - 'public/locales/de/**'
  workflow_dispatch:

permissions:
  contents: write
  pull-requests: write

jobs:
  crowdin:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Sync with Crowdin
        uses: crowdin/github-action@v2
        with:
          upload_sources: true
          upload_translations: true
          download_translations: true

          localization_branch_name: l10n_crowdin
          create_pull_request: true
          pull_request_title: 'chore(i18n): update translations from Crowdin'
          pull_request_body: >
            Automatisch generierter PR mit aktualisierten Übersetzungen
            von Crowdin. Bitte prüfen und mergen.
          pull_request_labels: 'i18n, automated'

        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          CROWDIN_PROJECT_ID: ${{ secrets.CROWDIN_PROJECT_ID }}
          CROWDIN_PERSONAL_TOKEN: ${{ secrets.CROWDIN_PERSONAL_TOKEN }}
```

---

## 3.3 Was macht jede Zeile?

### Trigger

```yaml
on:
  push:
    branches: [main]
    paths:
      - 'public/locales/de/**'
  workflow_dispatch:
```

- **push auf main + paths**: Die Action läuft nur, wenn Dateien unter
  `public/locales/de/` geändert werden. Kein unnötiger Sync bei anderem Code.
- **workflow_dispatch**: Erlaubt manuelles Auslösen über die GitHub-UI
  (Actions → Crowdin Sync → "Run workflow"). Nützlich für den ersten Test.

### Permissions

```yaml
permissions:
  contents: write
  pull-requests: write
```

Die Action braucht Schreibzugriff auf das Repo (um den `l10n_crowdin`-Branch
zu erstellen) und PR-Erstellungsrechte. `GITHUB_TOKEN` wird automatisch von
GitHub bereitgestellt – kein eigenes Token nötig.

### Upload und Download

```yaml
upload_sources: true
upload_translations: true
download_translations: true
```

| Parameter | Was passiert |
|---|---|
| `upload_sources` | Lädt `de/*.json` zu Crowdin hoch (neue Keys erkannt) |
| `upload_translations` | Lädt existierende `en/*.json` hoch (falls manuell gepflegt) |
| `download_translations` | Holt fertige Übersetzungen von Crowdin ins Repo |

### PR-Konfiguration

```yaml
localization_branch_name: l10n_crowdin
create_pull_request: true
pull_request_title: 'chore(i18n): update translations from Crowdin'
pull_request_labels: 'i18n, automated'
```

- Die Action erstellt einen Branch `l10n_crowdin` mit den Übersetzungen
- Daraus wird ein PR gegen den aktuellen Branch (`main`) erstellt
- Der PR hat einen konsistenten Titel und Labels für einfaches Filtern
- Wenn sich Übersetzungen ändern, wird der **gleiche PR** aktualisiert
  (kein PR-Spam)

### Secrets

```yaml
env:
  GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
  CROWDIN_PROJECT_ID: ${{ secrets.CROWDIN_PROJECT_ID }}
  CROWDIN_PERSONAL_TOKEN: ${{ secrets.CROWDIN_PERSONAL_TOKEN }}
```

- `GITHUB_TOKEN` – Automatisch von GitHub bereitgestellt
- `CROWDIN_PROJECT_ID` – Aus Schritt 1.4
- `CROWDIN_PERSONAL_TOKEN` – Aus Schritt 1.4

---

## 3.4 Alternative: Zeitgesteuerter Sync

Falls du nicht nur bei Dateiänderungen syncen willst, sondern regelmäßig
(um Übersetzungen abzuholen, die im Crowdin-Editor hinzugefügt wurden):

```yaml
on:
  push:
    branches: [main]
    paths:
      - 'public/locales/de/**'
  schedule:
    - cron: '0 6 * * *'   # Täglich um 06:00 UTC
  workflow_dispatch:
```

Für das MVP reicht `push` + `workflow_dispatch`. Den Schedule kann man
später hinzufügen, wenn regelmäßig im Crowdin-Editor übersetzt wird.

---

## 3.5 Was die Action NICHT macht

- Sie ändert **keinen bestehenden Code** (keine Komponenten, keine Config)
- Sie erstellt nur Dateien unter `public/locales/en/` (oder andere Sprachen)
- Sie überschreibt keine manuell gepflegten Dateien
  (es sei denn, der Crowdin-Export enthält Änderungen)

---

## 3.6 Checkliste vor dem ersten Sync

- [ ] `crowdin.yml` im Repo-Root vorhanden (Schritt 2)
- [ ] GitHub Secrets gesetzt: `CROWDIN_PROJECT_ID`, `CROWDIN_PERSONAL_TOKEN`
- [ ] `.github/workflows/crowdin-sync.yml` erstellt (dieser Schritt)
- [ ] Mindestens eine Quelldatei existiert: `public/locales/de/common.json`

---

## Nächster Schritt

→ `04-erster-sync-und-test.md` – Den ersten Sync auslösen und testen
