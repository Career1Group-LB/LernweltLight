# Schritt 2: crowdin.yml Konfiguration

---

## 2.1 Die Konfigurationsdatei

Erstelle `crowdin.yml` im **Root** des Repositories:

```yaml
# crowdin.yml
#
# Credentials kommen NICHT in diese Datei – sie werden als
# GitHub Secrets / Umgebungsvariablen gesetzt.
#
project_id_env: CROWDIN_PROJECT_ID
api_token_env: CROWDIN_PERSONAL_TOKEN

base_path: "."
preserve_hierarchy: true

files:
  - source: /public/locales/de/**/*.json
    translation: /public/locales/%two_letters_code%/**/%original_file_name%
    type: i18next_json
```

---

## 2.2 Was bedeutet jede Zeile?

### Credentials

```yaml
project_id_env: CROWDIN_PROJECT_ID
api_token_env: CROWDIN_PERSONAL_TOKEN
```

Crowdin CLI/Action liest die Werte aus Umgebungsvariablen. Die echten
Credentials stehen nur in den GitHub Secrets (siehe Schritt 1.4).

**Niemals API-Token direkt in die YAML-Datei schreiben!**

### base_path und preserve_hierarchy

```yaml
base_path: "."
preserve_hierarchy: true
```

- `base_path: "."` – Pfade sind relativ zum Repo-Root
- `preserve_hierarchy: true` – Die Ordnerstruktur wird in Crowdin beibehalten.
  Ohne dieses Flag würden alle Dateien flach abgelegt und die Zuordnung
  `de/common.json → en/common.json` ginge verloren.

### Files-Konfiguration

```yaml
files:
  - source: /public/locales/de/**/*.json
    translation: /public/locales/%two_letters_code%/**/%original_file_name%
    type: i18next_json
```

| Teil | Bedeutung |
|---|---|
| `source` | Welche Dateien Crowdin als Quelle hochladen soll |
| `/public/locales/de/**/*.json` | Alle JSON-Dateien unter `de/`, rekursiv |
| `translation` | Wo Crowdin die Übersetzungen ablegt |
| `%two_letters_code%` | Wird durch den Sprachcode ersetzt (z.B. `en`, `fr`) |
| `%original_file_name%` | Behält den Dateinamen bei (z.B. `common.json`) |
| `type: i18next_json` | Sagt Crowdin, dass es i18next-Format ist (Plurale, Interpolation) |

### Konkretes Mapping-Beispiel

```
Quelle:       public/locales/de/common.json
→ Englisch:   public/locales/en/common.json
→ Französisch: public/locales/fr/common.json

Quelle:       public/locales/de/courses.json
→ Englisch:   public/locales/en/courses.json
```

Das ist exakt die Struktur, die unsere i18next-Config erwartet:

```typescript
// src/i18n/index.ts – so wird es geladen
import(`../../public/locales/${language}/${namespace}.json`)
//                           ↑ = "en"      ↑ = "common"
```

---

## 2.3 Warum `i18next_json` als Type?

Crowdin unterstützt i18next-JSON nativ. Das bedeutet:

- **Plurale** werden korrekt erkannt (`_one`, `_other`, `_few`, `_many`)
- **Interpolation** (`{{variable}}`) wird als Platzhalter angezeigt, nicht als
  übersetzbarer Text
- **Nesting** (`$t(key)`) wird korrekt verarbeitet
- **QA-Checks** warnen, wenn `{{count}}` in DE vorhanden ist, aber im EN fehlt

Ohne `type: i18next_json` würde Crowdin die Dateien als generisches JSON
behandeln und Pluralschlüssel als separate Strings anzeigen.

---

## 2.4 Dateien die für das MVP existieren müssen

Aktuell existiert nur `public/locales/de/common.json`. Für das MVP reicht das.

Wenn du später weitere Namespace-Dateien anlegst (z.B. `auth.json`,
`courses.json`), werden sie automatisch von `**/*.json` erfasst – kein
Update an der `crowdin.yml` nötig.

Die `en/`-Ordner und -Dateien musst du **nicht** manuell anlegen. Das macht
Crowdin automatisch, wenn Übersetzungen vorliegen.

---

## 2.5 Validierung: Dry-Run mit Crowdin CLI (optional)

Falls du den Crowdin CLI lokal installiert hast, kannst du prüfen ob die
Konfiguration korrekt ist:

```bash
# CLI installieren
pnpm add -D @crowdin/cli

# Dry-Run: Zeigt welche Dateien erkannt werden, ohne etwas hochzuladen
npx crowdin upload sources --dryrun
```

Das sollte ausgeben:

```
[OK] Found 1 file(s) to upload
  public/locales/de/common.json
```

---

## Nächster Schritt

→ `03-github-action-setup.md` – Automatischer Sync via GitHub Action
