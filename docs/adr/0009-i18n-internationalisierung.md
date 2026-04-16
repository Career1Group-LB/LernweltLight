# ADR 0009 – Internationalisierung (i18n)

**Status:** Accepted  
**Datum:** 2026-04-13  
**Entscheider:** Lernwelt Frontend Team

---

## Kontext

Die Lernwelt muss von Anfang an frei von hardcodierten Strings sein. Darüber hinaus
verlangt das Ticket eine Lösung, die Nicht-Entwicklern (Content-Team, Übersetzer)
ermöglicht, Übersetzungen zu pflegen. Es wurden zwei technische Ansätze evaluiert und
mehrere Architekturaspekte geklärt: Library-Wahl, Namespace-Strategie, Dateiablage,
regionale Varianten und Skalierungspfad.

### Evaluierte Ansätze

| Kriterium | **i18next + react-i18next** | **FormatJS (react-intl)** |
|---|---|---|
| Bundle Size (Core) | ~40 KB | ~32 KB |
| Lazy Loading | Plugin-basiert (`i18next-resources-to-backend`) | Built-in |
| ICU MessageFormat | Via Plugin | Nativ |
| TypeScript-Integration | Sehr gut (Declaration Merging) | Gut |
| Namespace-Support | Nativ, ausgereift | Kein natives Namespace-Konzept |
| Ökosystem / Plugins | Sehr groß (Backends, Detectors, TMS-Anbindungen) | Kleiner |
| Community / Docs | Größte i18n-Community in React | Groß, aber kleiner als i18next |
| TMS-Kompatibilität | locize, Crowdin, Phrase, Lokalise out-of-the-box | Crowdin, Phrase (weniger Plugins) |
| Non-Dev-Workflow | Gute TMS-Anbindung, JSON-Dateien einfach editierbar | ICU-Syntax kann Nicht-Devs abschrecken |

---

## Entscheidung

### Library: i18next + react-i18next

i18next ist die etablierteste i18n-Library im React-Ökosystem mit dem breitesten
Plugin-System. Die Entscheidung basiert auf drei Faktoren:

1. **Namespace-Support** ermöglicht Feature-basierte Übersetzungsdateien
   (`auth.json`, `courses.json`, ...), passend zur Feature-Based-Architektur (→ ADR 0005).
2. **TMS-Kompatibilität** für den späteren Non-Dev-Workflow – jedes gängige Translation
   Management System (Crowdin, Phrase, locize) hat native i18next-Integration.
3. **JSON-Dateien** sind für Nicht-Entwickler leichter zu pflegen als ICU MessageFormat
   Strings (`{count, plural, one {# item} other {# items}}`).

### Namespace-Strategie: Pro Feature

Jedes Feature bekommt einen eigenen Namespace (= eine JSON-Datei pro Feature pro Sprache).
Shared-Strings liegen in `common.json`, Fehlermeldungen in `errors.json`.

```
public/locales/de/
├── common.json        ← Buttons, Navigation, Ladezustände
├── auth.json          ← Login, Logout, Session
├── courses.json       ← Kursübersicht, Kurs-Detail
├── errors.json        ← API-/Netzwerk-Fehlermeldungen
├── quiz.json
├── profile.json
└── ...                ← Ein File pro Feature
```

### Dateiablage: `public/locales/` (zentral, nicht in Feature-Ordnern)

Übersetzungsdateien liegen in `public/locales/{lng}/{ns}.json` – **nicht** kolokal in
`src/features/*/locales/`. Begründung:

- **i18next-Standard:** Das gesamte Ökosystem (Backends, TMS-Tools, Tutorials) erwartet
  diese Konvention. Kolokation erfordert Custom-Code und bricht TMS-Integrationen.
- **Content ≠ Code:** Übersetzungen werden potenziell von Nicht-Entwicklern gepflegt.
  Ein zentraler Ort ist dafür besser als 15+ Feature-Ordner.
- **Vite-Kompatibilität:** `public/` ermöglicht später den Wechsel auf HTTP-basiertes
  Lazy Loading (z.B. via `i18next-http-backend`), ohne Refactoring.
- **Die logische Zuordnung** Feature ↔ Namespace bleibt über den Namespace-Namen erhalten
  (`useTranslation('auth')` → lädt `auth.json`).

### Regionale Varianten: Basissprache ohne Region

Ordner heißen `de/`, `en/` – nicht `de-DE/`, `en-US/`. Regionale Varianten (de-AT, de-CH,
en-GB) werden erst eingeführt, wenn User-Feedback oder Mandanten-Anforderungen es fordern.

Die Architektur unterstützt das bereits:

- i18next's Fallback-Kette (`de-AT → de → en`) erlaubt schlanke Override-Dateien,
  die nur abweichende Keys enthalten.
- Die `Intl`-API löst Formatierungsunterschiede (Datum, Zahlen, Währung) unabhängig
  von den Übersetzungsdateien – `Intl.DateTimeFormat('de-CH')` funktioniert sofort.

### TypeScript-Integration

Typsichere Translation-Keys über Declaration Merging in `src/i18n/i18next.d.ts`.
Neue Namespaces werden dort registriert. TypeScript erkennt ungültige Keys zur
Compile-Zeit.

### Skalierungspfad für Non-Dev-Workflow

| Phase | Ansatz | Non-Devs können... |
|---|---|---|
| **Jetzt** | JSON-Dateien im Repo | JSON direkt editieren (mit Git-Hilfe) |
| **Mittelfristig** | TMS (Crowdin / Phrase / locize) | Über Web-UI übersetzen, ohne Git |
| **Langfristig** | TMS + CDN-Delivery | Übersetzungen live deployen, ohne Build |

Der Wechsel zwischen diesen Phasen erfordert keinen Architektur-Umbau – nur eine
Änderung des i18next-Backend-Plugins (von `resources-to-backend` auf `http-backend`
oder `locize-backend`).

---

## Konsequenzen

✅ Keine hardcodierten Strings – alle User-facing Texte via `t()`  
✅ Namespace pro Feature hält Übersetzungsdateien übersichtlich  
✅ Lazy Loading: Nur die Namespaces der aktuellen Route werden geladen  
✅ TypeScript-Autocomplete und Compile-Time-Checks für Translation-Keys  
✅ Architektur ist vorbereitet für TMS-Integration und regionale Varianten  
✅ Formatierung (Datum, Zahlen) über `Intl`-API, entkoppelt von Übersetzungsdateien  
⚠️ Neue Namespaces müssen manuell in `i18next.d.ts` registriert werden  
⚠️ JSON-Dateien im Repo sind für Nicht-Entwickler nur mit Git-Kenntnis editierbar (→ TMS als nächster Schritt)

---

## Verworfene Alternativen

| Alternative | Grund für Ablehnung |
|---|---|
| **FormatJS / react-intl** | Kein natives Namespace-Konzept; ICU-Syntax ist für Nicht-Devs schwerer zu pflegen |
| **Kolokation in Feature-Ordnern** | Kein i18next-Support, bricht TMS-Integration, kein Community-Standard |
| **Regionale Ordner ab Start** (`de-DE/`, `de-AT/`) | YAGNI – Lernplattform-Texte sind zu 99% identisch über DACH; Wartungsaufwand ohne Mehrwert |
| **Ein globaler Namespace** | Wird bei 15+ Features unübersichtlich, kein Feature-Scoping möglich |
| **Übersetzungen im Backend** | Frontend-Texte (UI-Labels, Buttons) gehören ins Frontend; Backend lokalisiert seine eigenen Responses |

---

## Abhängigkeiten

→ Nutzt **ADR 0005 (Feature-Based Architektur)** als Grundlage für die Namespace-Struktur  
→ Beeinflusst **ADR 0012 (Multi-Tenancy/Branding)** – Mandanten könnten eigene Sprachen/Texte brauchen
