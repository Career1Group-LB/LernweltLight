# TMS-Vergleich: Welche Plattform passt zur Lernwelt?

---

## Auswahlkriterien

Basierend auf unserem Ticket ("Translations must be manageable by non-developers")
und der Architekturentscheidung (i18next + JSON-Namespaces) gelten diese Kriterien:

| Kriterium | Gewicht | Begründung |
|---|---|---|
| i18next-Integration | Hoch | Wir nutzen i18next – die Integration muss nativ sein |
| Non-Dev-Usability | Hoch | Übersetzer/PMs müssen ohne Git arbeiten können |
| Git-Sync (GitHub) | Hoch | JSON-Dateien im Repo sollen die Source of Truth bleiben |
| Namespace-Support | Hoch | Wir haben pro Feature eine JSON-Datei |
| Free Tier / Kosten | Mittel | Startup-Phase, Budget ist begrenzt |
| CDN-Delivery (optional) | Niedrig | Nice-to-have für später, kein Muss jetzt |
| AI/MT-Integration | Niedrig | Hilfreich, aber nicht entscheidend |

---

## Die Kandidaten

### 1. locize – vom i18next-Team

> "Built by the creators of i18next"

**Was ist es:** Die native TMS-Plattform der i18next-Maintainer. Die tiefste
i18next-Integration am Markt.

**Wie die Integration funktioniert:**

```typescript
// Eine Zeile Config-Änderung – i18next lädt direkt vom locize-CDN
import Backend from 'i18next-locize-backend';

i18next
  .use(Backend)
  .init({
    backend: {
      projectId: '[PROJECT_ID]',
      apiKey: '[API_KEY]',   // nur für saveMissing (Dev)
    }
  });
```

Besonderheit: `saveMissing: true` – wenn ein Entwickler einen neuen `t()`-Key
verwendet, wird er **automatisch** an locize gesendet. Kein manuelles Eintragen nötig.

**Stärken:**

- Tiefste i18next-Integration (vom gleichen Team)
- `saveMissing` erkennt neue Keys automatisch aus dem laufenden Code
- CDN-Delivery eingebaut – Texte live ändern ohne Build
- CLI für Migration existierender JSON-Dateien (`locize-migrate`)
- MCP-Server für AI-Coding-Assistenten (Cursor, Claude)

**Schwächen:**

- Kleineres Ökosystem als Crowdin/Phrase
- Weniger bekannt bei Übersetzungsagenturen
- Community kleiner als bei den großen Playern

**Pricing (Fixed Plans, Stand April 2026):**

| Plan | Preis/Monat | Wörter | Sprachen | CDN-Downloads |
|---|---|---|---|---|
| Free | $0 | 2.000 | 2 | 100.000 |
| Starter | $7 | 15.000 | 5 | 1.000.000 |
| Growth | $49 | 60.000 | 10 | 5.000.000 |
| Professional | $99 | 100.000 | 20 | 7.000.000 |

---

### 2. Crowdin – der Community-Standard

> "Backbone der Open-Source-Welt"

**Was ist es:** Das bekannteste TMS mit der breitesten Integrationspalette (600+).
Besonders stark bei Open-Source-Projekten (kostenloser OSS-Tier).

**Wie die Integration funktioniert:**

```yaml
# crowdin.yml (im Repo-Root)
files:
  - source: /public/locales/de/*.json
    translation: /public/locales/%two_letters_code%/%original_file_name%
```

GitHub-App installieren → Crowdin erkennt neue Keys automatisch → Übersetzer arbeiten
im Web-Editor → Crowdin erstellt PRs mit fertigen Übersetzungen.

Alternativ per GitHub Action (CI/CD):

```yaml
# .github/workflows/crowdin.yml
- name: Crowdin Sync
  uses: crowdin/github-action@v2
  with:
    upload_sources: true
    download_translations: true
    create_pull_request: true
    pull_request_title: 'chore: new translations from Crowdin'
```

**Stärken:**

- Größtes Ökosystem (600+ Integrationen)
- Beste Community-Features (Crowd-Übersetzer einladen, Voting)
- Ausgereifte GitHub-Integration (App + Action)
- Versteht i18next-JSON nativ (inkl. Plurale, Interpolation)
- In-Context-Editor (Übersetzer sehen die App im Browser)
- OTA (Over-the-Air) Updates möglich

**Schwächen:**

- Pricing wird bei mehr Seats/Sprachen teuer
- UI kann für neue Nutzer überwältigend sein (Feature-Overload)
- Kein nativer i18next-Backend-Plugin (Sync ist file-basiert, nicht Runtime)

**Pricing (Stand April 2026):**

| Plan | Preis/Monat | Zielgruppe |
|---|---|---|
| Free (OSS) | $0 | Open-Source-Projekte |
| Team | ab $40 | Kleine Teams |
| Business | ab $100+ | Mehr Seats, mehr Sprachen |
| Enterprise | Custom | Große Organisationen |

Achtung: Per-Seat-Kosten kommen dazu. Bei 10 Usern und 15.000 Strings → ~$200–450/Monat.

---

### 3. Phrase Strings – die Enterprise-Lösung

> "Der Enterprise-Heavyweight"

**Was ist es:** Die umfangreichste Plattform für professionelle Lokalisierungsteams.
Bietet neben Strings-Management auch TMS, CAT-Tools und AI-Translation.

**Wie die Integration funktioniert:**

```typescript
// i18next In-Context Editor Plugin
import PhraseICE from 'i18next-phrase-in-context-editor-post-processor';

i18next
  .use(new PhraseICE({
    projectId: '[PROJECT_ID]',
    phraseEnabled: process.env.NODE_ENV === 'development',
  }))
  .init({
    postProcess: ['phraseInContextEditor'],
  });
```

Git-Sync über GitHub/GitLab-Integration. CLI (`phrase-cli`) für CI/CD.

**Stärken:**

- Umfassendste Enterprise-Features (SOC 2, Audit Logs, Compliance)
- In-Context-Editor für i18next
- Figma-Plugin (Designer sehen Texte im Design)
- OTA-Updates für Web und Mobile
- CAT-Tool + TMS in einer Plattform

**Schwächen:**

- **Deutlich teurer** als die Alternativen
- Overkill für kleine/mittlere Teams
- Komplexes Setup, steile Lernkurve
- Minimaler Plan mit Strings: $525/Monat (!)

**Pricing (Stand April 2026, jährlich):**

| Plan | Preis/Monat | Strings Seats | Wörter |
|---|---|---|---|
| Freelancer | $27 | 0 (kein Strings!) | – |
| Software UI/UX | $525 | 15 | 1.000.000 |
| Team | $1.245 | 20 | 1.200.000 |
| Enterprise | Custom | Custom | Custom |

---

### 4. Weitere Optionen (kurz)

| Plattform | Stärke | Schwäche | Preis ab |
|---|---|---|---|
| **SimpleLocalize** | Sehr einfache UI, günstig | Kleineres Ökosystem | $0 (Free Tier) |
| **Transifex** | Gute AI, OTA-Updates | Teurer, weniger i18next-spezifisch | $150/Monat |
| **IntlPull** | AI-first, günstig | Sehr neu (2024), kleines Team | $0 (Free Tier) |
| **Better i18n** | CDN-first, AST-Scanner | Sehr neu (2025), kleines Ökosystem | $0 (Free Tier) |

---

## Vergleichsmatrix

| Kriterium | locize | Crowdin | Phrase |
|---|---|---|---|
| **i18next-Integration** | ⭐⭐⭐ Nativ (gleiche Autoren) | ⭐⭐ Gut (JSON-Sync) | ⭐⭐ Gut (ICE-Plugin) |
| **Non-Dev-Usability** | ⭐⭐ Gut, aber technischer | ⭐⭐⭐ Sehr gut | ⭐⭐⭐ Sehr gut |
| **Git-Sync** | ⭐⭐ CLI + GitHub Action | ⭐⭐⭐ Native GitHub-App | ⭐⭐⭐ Native GitHub-App |
| **Namespace-Support** | ⭐⭐⭐ Nativ | ⭐⭐⭐ Nativ | ⭐⭐⭐ Nativ |
| **CDN-Delivery** | ⭐⭐⭐ Kernfeature | ⭐⭐ OTA verfügbar | ⭐⭐ OTA verfügbar |
| **saveMissing (Auto-Keys)** | ⭐⭐⭐ Eingebaut | ✗ Nicht nativ | ✗ Nicht nativ |
| **AI/MT** | ⭐⭐ AI + BYOK ab Pro | ⭐⭐ Externe MT-Engines | ⭐⭐⭐ Phrase Language AI |
| **Free Tier** | ⭐⭐ 2.000 Wörter, 2 Sprachen | ⭐⭐⭐ Unbegrenzt (OSS) | ✗ Kein Strings-Free-Tier |
| **Kosten (Startup)** | ⭐⭐⭐ Ab $7/Monat | ⭐⭐ Ab $40/Monat | ✗ Ab $525/Monat |
| **Kosten (Scale)** | ⭐⭐ $49–99/Monat | ⭐⭐ $100–450/Monat | ⭐ $525–1.245/Monat |
| **Community/Docs** | ⭐⭐ Klein aber fokussiert | ⭐⭐⭐ Größte Community | ⭐⭐⭐ Enterprise-Docs |

---

## Wann welches TMS?

```
Frage 1: Budget < $50/Monat?
  ├─ Ja → locize (Starter $7, Growth $49)
  └─ Nein ↓

Frage 2: Open-Source-Projekt oder Community-Übersetzer?
  ├─ Ja → Crowdin (Free OSS-Tier)
  └─ Nein ↓

Frage 3: Enterprise mit Compliance-Anforderungen (SOC 2, Audit)?
  ├─ Ja → Phrase
  └─ Nein ↓

Frage 4: i18next und möglichst wenig Konfiguration?
  ├─ Ja → locize (nativste Integration)
  └─ Nein → Crowdin (breitestes Ökosystem)
```
