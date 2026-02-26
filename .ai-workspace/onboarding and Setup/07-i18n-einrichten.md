# Schritt 7: i18n einrichten (Internationalisierung / Textverwaltung)

> **Pakete bereits installiert:** `i18next` und `react-i18next` sind schon in `package.json` – kein `pnpm add` nötig.

---

## Flutter-Analogie: Was ist der Unterschied?

Falls du aus Flutter kommst kennst du `.arb` Dateien:

```
// Flutter: lib/l10n/intl_de.arb
{
  "coursesTitle": "Meine Kurse",
  "coursesEmpty": "Noch keine Kurse verfügbar.",
  "greeting": "Hallo {name}!"
}
```

In React macht `i18next` exakt dasselbe – nur mit JSON-Dateien und einem anderen API:

```
// React: public/locales/de/courses.json
{
  "title": "Meine Kurse",
  "empty": "Noch keine Kurse verfügbar.",
  "greeting": "Hallo {{name}}!"   ← doppelte geschweifte Klammern statt einfacher
}
```

| Flutter | React (i18next) |
|---|---|
| `intl_de.arb` | `public/locales/de/[namespace].json` |
| `intl_en.arb` | `public/locales/en/[namespace].json` |
| `AppLocalizations.of(context).coursesTitle` | `const { t } = useTranslation('courses'); t('title')` |
| `{name}` in ARB | `{{name}}` in JSON |
| Eine Datei pro Sprache | Eine Datei **pro Feature pro Sprache** (Namespaces) |
| `flutter gen-l10n` für Typen | TypeScript Declaration File für Typen |

---

## 7.1 Ordnerstruktur anlegen

Die Übersetzungsdateien liegen in `public/locales/` – **nicht** in `src/`. Das ist wichtig, damit Vite sie als statische Assets ausliefert.

```bash
mkdir -p public/locales/de
mkdir -p public/locales/en   # später, wenn Englisch kommt
```

Erstelle die Namespace-Dateien. Jedes Feature bekommt seine eigene JSON-Datei – genau wie beim Feature-Based-Architektur-Ansatz:

```
public/
└── locales/
    └── de/
        ├── common.json        ← Feature-übergreifend (Buttons, Fehler, Nav)
        ├── auth.json          ← Login, Logout, Session
        ├── courses.json       ← Kursübersicht, Kurs-Detail
        ├── quiz.json          ← Quiz, Fragen, Ergebnisse
        ├── profile.json       ← Profil, Einstellungen
        ├── progress.json      ← Fortschritt, Abschlüsse
        ├── certificates.json  ← Zertifikate
        ├── notes.json         ← Notizen
        ├── news.json          ← Neuigkeiten
        ├── glossary.json      ← Glossar
        ├── faq.json           ← FAQ
        └── errors.json        ← Fehlermeldungen (API, Netzwerk, etc.)
```

### Starter-Inhalte der wichtigsten Dateien

```json
// public/locales/de/common.json
{
  "actions": {
    "save": "Speichern",
    "cancel": "Abbrechen",
    "delete": "Löschen",
    "edit": "Bearbeiten",
    "back": "Zurück",
    "next": "Weiter",
    "close": "Schließen",
    "retry": "Erneut versuchen",
    "loading": "Laden..."
  },
  "navigation": {
    "courses": "Kurse",
    "profile": "Profil",
    "certificates": "Zertifikate",
    "news": "Neuigkeiten",
    "glossary": "Glossar",
    "faq": "FAQ",
    "livestream": "Livestream",
    "jobOffers": "Stellenangebote",
    "campus": "Campus",
    "mediaLibrary": "Mediathek"
  },
  "states": {
    "loading": "Wird geladen...",
    "empty": "Keine Inhalte verfügbar.",
    "error": "Ein Fehler ist aufgetreten."
  }
}
```

```json
// public/locales/de/auth.json
{
  "login": {
    "title": "Lernwelt",
    "subtitle": "Deine Lernplattform",
    "button": "Anmelden",
    "buttonLoading": "Anmelden...",
    "error": "Login fehlgeschlagen. Bitte erneut versuchen.",
    "oauthHint": "Echter OAuth-Login folgt wenn Auth-Service steht"
  },
  "logout": {
    "button": "Abmelden"
  }
}
```

```json
// public/locales/de/courses.json
{
  "title": "Meine Kurse",
  "empty": "Keine Kurse verfügbar.",
  "error": "Fehler beim Laden der Kurse.",
  "card": {
    "modules": "{{count}} Modul",
    "modules_other": "{{count}} Module",
    "activities": "{{count}} Aktivität",
    "activities_other": "{{count}} Aktivitäten"
  },
  "detail": {
    "start": "Kurs starten",
    "continue": "Weiter lernen",
    "completed": "Abgeschlossen"
  }
}
```

```json
// public/locales/de/errors.json
{
  "network": "Keine Internetverbindung. Bitte prüfe deine Verbindung.",
  "server": "Der Server ist vorübergehend nicht erreichbar.",
  "notFound": "Diese Seite wurde nicht gefunden.",
  "unauthorized": "Deine Sitzung ist abgelaufen. Bitte melde dich erneut an.",
  "forbidden": "Du hast keine Berechtigung für diesen Bereich.",
  "unknown": "Ein unbekannter Fehler ist aufgetreten."
}
```

---

## 7.2 i18n konfigurieren

Erstelle `src/i18n/index.ts`:

```typescript
import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import resourcesToBackend from 'i18next-resources-to-backend';
import { initReactI18next } from 'react-i18next';

i18n
  // Lädt Übersetzungsdateien lazy – nur wenn ein Namespace gebraucht wird
  // Flutter-Analogie: Lazy Loading von ARB-Dateien statt alles auf einmal
  .use(
    resourcesToBackend(
      (language: string, namespace: string) =>
        import(`../../public/locales/${language}/${namespace}.json`),
    ),
  )
  // Erkennt automatisch die Browser-Sprache des Users
  .use(LanguageDetector)
  // Bindet i18n an React
  .use(initReactI18next)
  .init({
    // Fallback-Sprache wenn die erkannte Sprache nicht verfügbar ist
    fallbackLng: 'de',

    // Standard-Namespace (wird geladen wenn kein Namespace angegeben)
    defaultNS: 'common',

    // Alle verfügbaren Sprachen
    supportedLngs: ['de', 'en'],

    // Interpolation: {{variable}} statt {variable} wie in Flutter
    interpolation: {
      // React schützt schon vor XSS – escaping hier deaktivieren
      escapeValue: false,
    },

    // Wichtig für Pluralisierung (unten mehr dazu)
    pluralSeparator: '_',

    // Während Entwicklung: Fehlende Keys als Warnung in der Konsole
    debug: import.meta.env.DEV,
  });

export default i18n;
```

### Benötigte Zusatz-Pakete installieren

```bash
pnpm add i18next-browser-languagedetector i18next-resources-to-backend
```

---

## 7.3 TypeScript-Typsicherheit einrichten

Das ist das React-Äquivalent zu `flutter gen-l10n`. Ohne das kannst du beliebige Strings als Key verwenden – mit diesem Setup gibt TypeScript einen Fehler wenn du einen Key falsch schreibst.

Erstelle `src/i18n/i18next.d.ts`:

```typescript
import 'i18next';

// Importiere deine Übersetzungsdateien als Typen
import type common from '../../public/locales/de/common.json';
import type auth from '../../public/locales/de/auth.json';
import type courses from '../../public/locales/de/courses.json';
import type quiz from '../../public/locales/de/quiz.json';
import type profile from '../../public/locales/de/profile.json';
import type errors from '../../public/locales/de/errors.json';
// ... weitere Namespaces hier ergänzen wenn neue hinzukommen

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'common';
    resources: {
      common: typeof common;
      auth: typeof auth;
      courses: typeof courses;
      quiz: typeof quiz;
      profile: typeof profile;
      errors: typeof errors;
    };
  }
}
```

### `tsconfig.app.json` ergänzen

Damit TypeScript JSON-Dateien importieren kann:

```json
{
  "compilerOptions": {
    "resolveJsonModule": true
    // ... restliche Optionen bleiben
  }
}
```

**Resultat:** Vollständiges Autocomplete für alle Translation-Keys:

```typescript
const { t } = useTranslation('courses');
t('title')          // ✅ TypeScript weiß: dieser Key existiert
t('titelX')         // ❌ TypeScript-Fehler: Key nicht gefunden
t('card.modules', { count: 3 })  // ✅ TypeScript weiß: count ist erforderlich
```

---

## 7.4 i18n in main.tsx einbinden

```typescript
// src/main.tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

// i18n muss VOR App importiert werden
import './i18n/index';
import './index.css';
import App from './App';

// System-Theme-Listener (aus Schritt 2a)...

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

---

## 7.5 In Komponenten verwenden

### Einfache Verwendung

```typescript
// src/features/courses/components/CoursesPage.tsx
import { useTranslation } from 'react-i18next';

export default function CoursesPage() {
  // Namespace angeben → lädt automatisch public/locales/de/courses.json
  const { t } = useTranslation('courses');

  return (
    <div>
      <h1>{t('title')}</h1>           {/* → "Meine Kurse" */}
      <p>{t('empty')}</p>             {/* → "Keine Kurse verfügbar." */}
    </div>
  );
}
```

### Mehrere Namespaces

```typescript
// Wenn eine Komponente Strings aus verschiedenen Namespaces braucht
const { t } = useTranslation(['courses', 'common']);

t('title')                          // aus 'courses' (erster Namespace = default)
t('common:actions.save')            // aus 'common' mit Namespace-Präfix
```

### Interpolation (Variablen einsetzen)

```typescript
// In der JSON-Datei:
// "greeting": "Hallo {{name}}!"
// "lastSeen": "Zuletzt aktiv: {{date}}"

const { t } = useTranslation('profile');
t('greeting', { name: user.name })         // → "Hallo Max!"
t('lastSeen', { date: '01.01.2025' })      // → "Zuletzt aktiv: 01.01.2025"
```

### Pluralisierung

Das ist das React-Äquivalent zu Flutter's `{count, plural, one{...} other{...}}`:

```json
// In public/locales/de/courses.json:
{
  "card": {
    "modules": "{{count}} Modul",
    "modules_other": "{{count}} Module"
  }
}
```

```typescript
t('card.modules', { count: 1 })    // → "1 Modul"
t('card.modules', { count: 3 })    // → "3 Module"
```

> **Wichtig:** i18next nutzt `_other` als Plural-Suffix (nicht `_plural` wie in älteren Versionen). Bei Deutsch: `_other` für alles außer 1.

### common-Namespace ohne Angabe

Da `common` der Default-Namespace ist, muss er nicht angegeben werden:

```typescript
const { t } = useTranslation(); // lädt 'common' automatisch

t('actions.save')               // → "Speichern"
t('navigation.courses')         // → "Kurse"
t('states.loading')             // → "Wird geladen..."
```

---

## 7.6 Suspense für lazy-geladene Übersetzungen

Da Übersetzungen lazy geladen werden (erst wenn ein Namespace gebraucht wird), kann es kurz sein bis sie geladen sind. React Suspense handled das:

```typescript
// src/App.tsx
import { Suspense } from 'react';

export default function App() {
  return (
    // Suspense fängt den Ladezustand der Übersetzungen ab
    <Suspense fallback={<div>...</div>}>
      <QueryProvider>
        <RouterProvider router={router} />
      </QueryProvider>
    </Suspense>
  );
}
```

Das `AppLayout` hat bereits `<Suspense>` um `<Outlet />` – das deckt alle Feature-Pages ab.

---

## 7.7 Neuen String hinzufügen – Workflow

So fügst du einen neuen Text hinzu (das ist dein täglicher Workflow):

**1. String in die JSON-Datei eintragen:**
```json
// public/locales/de/courses.json
{
  "title": "Meine Kurse",
  "newString": "Mein neuer Text"   ← hier eintragen
}
```

**2. TypeScript-Deklarationsdatei ist automatisch aktuell** – da wir `typeof` der JSON-Datei nutzen, weiß TypeScript sofort von dem neuen Key.

**3. Im Code verwenden:**
```typescript
t('newString')    // → TypeScript autocomplete schlägt den Key vor
```

**Wenn Englisch dazukommt:**
```json
// public/locales/en/courses.json
{
  "title": "My Courses",
  "newString": "My new text"
}
```

---

## 7.8 Best Practices (aus i18next Docs)

### ✅ Ganze Sätze als Key-Value, nie zerstückeln

```typescript
// ❌ Schlecht – Übersetzer verlieren den Kontext
t('save') + ' ' + t('course')          // → "Speichern Kurs"

// ✅ Gut – Ganzer Satz als eigener Key
t('saveCourse')                         // → "Kurs speichern"
```

### ✅ Keys beschreiben den Inhalt, nicht den Ort

```json
// ❌ Schlecht – zu orts-spezifisch
{ "coursesPageTitle": "Meine Kurse" }

// ✅ Gut – beschreibt was es ist
{ "title": "Meine Kurse" }             // Im richtigen Namespace (courses.json)
```

### ✅ Keine deutschen Strings hardcoded im Code

```typescript
// ❌ Schlecht – hardcoded String
<button>Speichern</button>

// ✅ Gut – immer über t()
<button>{t('actions.save')}</button>
```

### ✅ Fehlermeldungen zentral in errors.json

Alle API-Fehlermeldungen die dem User angezeigt werden gehören in `errors.json` – nicht scattered über alle Feature-Files.

---

## Checkliste: Schritt 7

- [ ] `public/locales/de/` Ordner angelegt
- [ ] Alle Namespace-JSON-Dateien erstellt (`common`, `auth`, `courses`, `errors`, ...)
- [ ] `pnpm add i18next-browser-languagedetector i18next-resources-to-backend`
- [ ] `src/i18n/index.ts` erstellt (i18n Konfiguration)
- [ ] `src/i18n/i18next.d.ts` erstellt (TypeScript Typen)
- [ ] `resolveJsonModule: true` in `tsconfig.app.json`
- [ ] `import './i18n/index'` in `src/main.tsx` (vor App)
- [ ] `<Suspense>` in `src/App.tsx`
- [ ] Smoke Test: `t('actions.save')` gibt `"Speichern"` zurück
- [ ] TypeScript-Check: falscher Key gibt Compiler-Fehler
- [ ] `pnpm type-check` läuft ohne Fehler

**Wenn alles grün ist → alle Strings ab sofort über `t()` – nie mehr hardcodierter Text im JSX.**
