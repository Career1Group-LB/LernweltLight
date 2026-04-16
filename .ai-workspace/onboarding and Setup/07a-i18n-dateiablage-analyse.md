# Analyse: Wo gehören die Übersetzungsdateien hin?

> **Kontext:** Wir nutzen eine Feature-Based-Architektur (`src/features/auth/`, `src/features/courses/`, ...).
> Die i18n-Dateien liegen aktuell in `public/locales/de/auth.json`, `public/locales/de/courses.json` etc.
> Frage: Sollten die Übersetzungsdateien nicht **im jeweiligen Feature-Ordner** liegen, z.B. `src/features/auth/locales/de.json`?

---

## TL;DR – Empfehlung

**`public/locales/de/` ist der richtige Ort.** Die Übersetzungsdateien gehören **nicht** in die Feature-Ordner.

Das wirkt auf den ersten Blick inkonsistent mit der Feature-Based-Architektur, hat aber gute Gründe. Übersetzungsdateien sind eine **andere Kategorie von Artefakten** als Code – sie folgen eigenen Regeln.

---

## Die intuitive Annahme (und warum sie trügt)

Feature-Based-Architektur bedeutet Kolokation: Alles, was zu einem Feature gehört, liegt zusammen:

```
src/features/auth/
├── components/
├── hooks/
├── api/
├── schemas/
├── types.ts
└── locales/          ← Hier die Übersetzungen? Klingt logisch.
    └── de.json
```

Diese Idee folgt dem **Colocation-Prinzip** – Tests liegen neben der Implementierung, Schemas neben den API-Funktionen. Warum nicht auch Übersetzungen?

Weil Übersetzungsdateien fundamental anders funktionieren als Code-Dateien.

---

## Argument 1: i18next unterstützt Kolokation nicht nativ

Der i18next-Maintainer (jamuhl) hat das in einem [GitHub Discussion](https://github.com/i18next/i18next/discussions/2034) explizit bestätigt:

> "not supported from our modules – means just not supported without adding a little extra code by yourself"

Das gesamte i18next-Ökosystem – Backends, Plugins, TMS-Integrationen (locize, Crowdin, Phrase) – erwartet diese Konvention:

```
locales/
  {sprache}/
    {namespace}.json
```

Kolokation in Feature-Ordnern würde bedeuten:
- Custom-Code schreiben, um die Dateien beim Build einzusammeln
- Jede i18next-Integration (TMS, CI-Tools, Type-Generator) neu verdrahten
- Ein Pattern erfinden, das kein anderes React-Projekt nutzt

**Aufwand vs. Nutzen: Sehr hoch vs. minimal.**

---

## Argument 2: Übersetzungen sind kein Code – sie sind Content

| Eigenschaft | Code (Hooks, Components) | Übersetzungsdateien |
|---|---|---|
| Wer bearbeitet sie? | Entwickler | Entwickler **und** Übersetzer/Content-Team |
| Tooling | IDE, TypeScript, ESLint | TMS (Crowdin, Phrase, locize), Extraktor-Tools |
| Review-Prozess | Code-Review in PR | Content-Review (oft außerhalb von Git) |
| Deployment | Zusammen mit dem Code | Idealerweise unabhängig vom Code |
| Naming-Konvention | Feature-spezifisch, intern | Global, konsistent pro Sprache |

Übersetzer brauchen **einen zentralen Ort** mit allen Texten – nicht 15+ Feature-Ordner, durch die sie navigieren müssen. Ein TMS (Translation Management System) erwartet einen `locales/`-Ordner, den es syncen kann.

---

## Argument 3: Vite braucht `public/` für statische Assets

Der Ordner `public/` in Vite hat eine besondere Rolle: Dateien werden **unverändert** ins Build-Output kopiert und sind unter ihrem Pfad erreichbar. Das ermöglicht echtes Lazy Loading per HTTP-Fetch:

```
// Browser lädt nur: /locales/de/courses.json
// Erst wenn die Courses-Seite aufgerufen wird
```

Wenn die Dateien in `src/features/auth/locales/de.json` liegen, werden sie über Vites Dynamic Import in den **JavaScript-Bundle** gepackt. Das funktioniert technisch, hat aber Nachteile:

| | `public/locales/` | `src/features/*/locales/` |
|---|---|---|
| Lazy Loading | Per HTTP (echtes Netzwerk-Lazy-Load) | Per Dynamic Import (im JS-Bundle) |
| Caching | Browser-HTTP-Cache, CDN-fähig | Nur Bundler-internes Code-Splitting |
| Bundle-Size | Nicht im JS-Bundle | Wird Teil der JS-Chunks |
| TMS-Integration | Direkt unterstützt | Custom-Mapping nötig |
| Build-Abhängigkeit | Keine (statische Datei) | Bei jeder Textänderung neuer Build |

> **Hinweis:** Unser aktuelles Setup nutzt `i18next-resources-to-backend` mit Dynamic Imports (`import()`), was die Dateien in den JS-Bundle packt. Das funktioniert, aber der `public/`-Pfad ermöglicht uns, später auf `i18next-http-backend` mit echtem HTTP-Fetch umzusteigen – ein Plus an Flexibilität.

---

## Argument 4: Cross-Feature-Strings sind unvermeidlich

Nicht jeder String gehört eindeutig zu einem Feature:

- `"Speichern"`, `"Abbrechen"`, `"Wird geladen..."` → `common.json`
- `"Keine Internetverbindung"`, `"Sitzung abgelaufen"` → `errors.json`
- Navigation-Labels für alle Features → `common.json`

Bei Kolokation in Feature-Ordnern bräuchte man trotzdem einen gemeinsamen Ort für `common.json` und `errors.json`. Das Ergebnis: **eine hybride Struktur**, die schwerer zu verstehen ist als ein einziger zentraler Ort.

---

## Argument 5: Die Community-Konvention ist eindeutig

Jede relevante Quelle empfiehlt denselben Ansatz:

| Quelle | Empfehlung |
|---|---|
| [i18next Docs – Namespaces](https://www.i18next.com/principles/namespaces) | Namespace per Feature, zentrale Dateistruktur |
| [react-i18next – Multiple Translation Files](https://react.i18next.com/guides/multiple-translation-files) | `locales/{lng}/{ns}.json` |
| [Crowdin – React i18n Tutorial (2025)](https://crowdin.com/blog/2025/10/31/react-i18n) | `public/locales/` |
| [Lovalingo – React i18n Best Practices (2026)](https://lovalingo.com/de/guides/i18n-for-react) | Feature-Namespaces in `locales/` |
| [weweb – Localization Guide (2026)](https://www.weweb.io/blog/localization-in-react-js-with-i18next-guide) | `public/locales/{lng}/{ns}.json` |

Kein einziges Tutorial, keine Doku und kein reales Open-Source-Projekt nutzt Kolokation in Feature-Ordnern als Standard-Ansatz.

---

## Gegenargument: "Aber die Feature-Isolation bricht doch!"

Das stimmt – die Übersetzungsdateien liegen **außerhalb** des Feature-Ordners. Aber das ist kein Problem, weil:

1. **Die Kopplung ist trotzdem Feature-spezifisch:** `auth.json` wird nur von `src/features/auth/` genutzt. Der Namespace-Name (`'auth'`) im `useTranslation('auth')`-Aufruf ist die Verbindung.

2. **Die Isolation ist logisch, nicht physisch:** Ein Feature "besitzt" seinen Namespace, auch wenn die Datei woanders liegt. Genauso wie ein Feature "seine" API-Routen auf dem Backend besitzt, obwohl die in einem anderen Repo liegen.

3. **Barrel Exports brauchen keine Übersetzungsdateien:** `index.ts` exportiert Components, Hooks, Types – keine JSON-Dateien. Übersetzungen werden über den i18next-Mechanismus geladen, nicht über Imports.

---

## Weiterführender Gedanke: Namespace-Illusion bei Skalierung

Ein [Medium-Artikel von Eray Gündoğmuş (März 2026)](https://medium.com/@gundogmuseray/scaling-i18n-beyond-lazy-loading-what-framework-comparisons-miss-about-real-world-localization-6e4defaa3fc3) warnt vor einem Problem, das bei Skalierung auftreten kann:

**Die "Namespace Decision Tax":** Entwickler verbringen Zeit damit zu entscheiden, in welche Datei ein neuer Key gehört. Gehört `billing.errors.cardDeclined` in `billing.json` oder `errors.json`?

**Das Cross-Namespace-Problem:** Komponenten, die Feature-übergreifend arbeiten (Notifications, Dashboards), müssen mehrere Namespaces laden – was den Lazy-Loading-Vorteil zunichte macht.

**Sein Vorschlag:** Flat Keys mit Konventions-Präfixen, keine Datei-Grenzen. Alles in einer Datei, per CDN gecached.

> **Für uns aktuell nicht relevant**, weil wir noch am Anfang stehen und weit unter 500 Keys sein werden. Aber es zeigt: Selbst Experten empfehlen nicht mehr Feature-Granularität, sondern **weniger**. Kolokation in Feature-Ordnern wäre die gegenteilige Richtung.

---

## Zusammenfassung

| Kriterium | `public/locales/de/{ns}.json` (aktuell) | `src/features/{feat}/locales/de.json` |
|---|---|---|
| i18next-Support | Nativ, out-of-the-box | Custom-Code nötig |
| TMS-Kompatibilität | Sofort integrierbar | Mapping-Adapter nötig |
| Lazy Loading | HTTP oder Dynamic Import | Nur Dynamic Import |
| Bundle-Impact | Keiner (statisches Asset) | Im JS-Bundle |
| Community-Standard | Ja | Nein |
| Übersetzer-Workflow | Zentraler Ort | Verteilt über 15+ Ordner |
| Cross-Feature-Strings | Sauber gelöst (`common.json`) | Hybrid-Lösung nötig |
| TypeScript-Integration | `typeof import('../../public/...')` | Aufwändigeres Mapping |

**Empfehlung: Beibehalten wie es ist.**

Die Feature-Based-Architektur gilt für **Code** (Components, Hooks, API, Schemas). Übersetzungsdateien sind **Content**, nicht Code – und Content folgt eigenen Organisationsregeln. Der Namespace-Name (`'auth'`, `'courses'`) stellt die logische Verbindung zum Feature her, ohne physische Kolokation zu brauchen.

---

## Faustregel

> **Wenn eine Datei primär von Entwicklern geschrieben und gelesen wird → Feature-Ordner.**
> **Wenn eine Datei auch von Nicht-Entwicklern (Übersetzer, Content-Team) bearbeitet wird → zentraler Ort.**
