# ADR 0009 – Internationalisierung (i18n)

**Status:** Proposed  
**Datum:** offen  
**Entscheider:** Lernwelt Frontend Team

---

## Kontext

`i18next` und `react-i18next` sind bereits im Projekt installiert. Es muss aber eine klare Strategie festgelegt werden wie Übersetzungen organisiert, geladen und gepflegt werden.

Außerdem ist unklar ob die Lernwelt überhaupt mehrsprachig sein soll oder ob `i18next` nur als "strukturierter String-Store" (gegen hartkodierte Strings) genutzt wird.

## Optionen

### Sprachunterstützung
- **Option A: Nur Deutsch** – i18next als strukturierter String-Container, kein echtes Mehrsprachen-Support
- **Option B: Deutsch + weitere Sprachen** – echte Mehrsprachigkeit, Übersetzungen pro Sprache

### Speicherort der Übersetzungen
| Option | Beschreibung |
|---|---|
| **Lokale JSON-Dateien** | `src/i18n/de.json`, `src/i18n/en.json` – einfach, kein extra Service |
| **Backend / CMS** | Übersetzungen kommen vom Server – gut für dynamischen Content |
| **i18n-Platform (Lokalise, Phrase)** | Professionelles Übersetzungsmanagement – overkill für Anfang |

### Namespace-Strategie
- **Ein globales Namespace** – alles in einer Datei (einfach, aber wird groß)
- **Pro-Feature Namespace** – `courses.json`, `quiz.json` etc. (sauber, aber mehr Setup)

## Offene Fragen

- Soll die App mehrsprachig sein oder nur Deutsch?
- Wer pflegt Übersetzungstexte – Entwickler oder Content-Team?
- Werden Texte auch im Backend (Microservices) lokalisiert oder nur im Frontend?
- Gibt es bereits Texte im alten Flutter-App die übernommen werden sollen?
