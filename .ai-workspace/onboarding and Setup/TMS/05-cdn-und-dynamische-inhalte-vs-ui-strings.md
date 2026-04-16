# CDN, UI-Strings und dynamische Inhalte – Wo liegt der Unterschied?

---

## 1. Was ist ein CDN?

### Die einfache Erklärung

CDN steht für **Content Delivery Network** – ein weltweites Netzwerk von Servern,
die Kopien von Inhalten näher beim Nutzer zwischenspeichern.

**Analogie:** Stell dir vor, es gibt nur eine Bibliothek in Deutschland
(in Frankfurt). Jeder muss dorthin fahren, um ein Buch zu lesen. Ein CDN ist wie
ein System von Zweigstellen in jeder Stadt – das Buch wird einmal aus Frankfurt
geholt und dann in der lokalen Zweigstelle zwischengespeichert. Der nächste
Leser in München geht einfach zur Münchner Zweigstelle.

### Technisch

```
Ohne CDN:
User in München → Request → Origin-Server in Frankfurt → Antwort
                            (immer die gleiche Route)

Mit CDN:
User in München → Request → Edge-Server in München → Antwort (aus Cache)
                            ↓ (nur beim ersten Mal)
                            Origin-Server in Frankfurt
```

- **Origin-Server** = Der "echte" Server, auf dem die Daten liegen
- **Edge-Server** = Kopien weltweit verteilt, nah am Nutzer
- **Cache-Hit** = Der Edge-Server hat die Datei schon → sofort ausgeliefert
- **Cache-Miss** = Erster Zugriff → Edge holt vom Origin, speichert, liefert aus

### CDN im Kontext von i18n/TMS

Wenn ein TMS wie locize "CDN-Delivery" anbietet, bedeutet das:

```
Ohne CDN-Delivery (unser aktueller Stand):
App startet → Lädt common.json aus dem eigenen Bundle (public/locales/)
              → Dateien waren beim Build im Repo

Mit CDN-Delivery (Phase 3 im Skalierungspfad):
App startet → Lädt common.json vom TMS-CDN (z.B. cdn.locize.com/...)
              → Dateien kommen live vom TMS, nicht aus dem Bundle
              → Änderungen sind sofort sichtbar ohne neuen Build/Deploy
```

**Für unser MVP ist das nicht relevant.** Wir laden die JSON-Dateien aus dem
Repo (`public/locales/`). CDN-Delivery wäre erst Phase 3.

---

## 2. Die fundamentale Unterscheidung: Zwei Arten von Text

Das ist der wichtigste Punkt in diesem Dokument. In einer App wie der Lernwelt
gibt es **zwei komplett verschiedene Arten von mehrsprachigem Text**:

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   Typ 1: STATISCHE UI-STRINGS                                  │
│   ─────────────────────────                                     │
│   Wo?      public/locales/de/common.json                        │
│   Was?     Buttons, Labels, Navigation, Fehlermeldungen         │
│   Wer?     Entwickler + Übersetzer (via TMS)                    │
│   Wie?     t('actions.save') → "Speichern" / "Save"            │
│   Quelle?  JSON-Dateien im Repo (oder TMS-CDN)                 │
│                                                                 │
│   Beispiele:                                                    │
│   - "Speichern"            → t('actions.save')                  │
│   - "Kurse"                → t('navigation.courses')            │
│   - "Wird geladen..."      → t('states.loading')                │
│   - "Kurs buchen"          → t('courses:detail.enrollButton')   │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   Typ 2: DYNAMISCHER CONTENT (Datenbank)                        │
│   ──────────────────────────────────────                        │
│   Wo?      Backend-Datenbank / Microservices                    │
│   Was?     Kurstitel, Beschreibungen, News, Glossar-Einträge    │
│   Wer?     Content-Ersteller (Dozenten, Redakteure)             │
│   Wie?     API-Response: { title: "React Grundlagen" }          │
│   Quelle?  Backend-API (REST)                                   │
│                                                                 │
│   Beispiele:                                                    │
│   - Kursname: "React Grundlagen"                                │
│   - Kursbeschreibung: "In diesem Kurs lernen Sie..."            │
│   - News-Titel: "Neue Features im Sommersemester"               │
│   - Glossar-Eintrag: "Didaktik: Die Wissenschaft vom..."        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Warum die Unterscheidung kritisch ist

**UI-Strings sind endlich und vorhersagbar.** Es gibt eine feste Anzahl an
Buttons, Labels und Fehlermeldungen. Sie ändern sich nur, wenn Entwickler
Code ändern. Sie leben in JSON-Dateien und werden von i18next verwaltet.

**Dynamischer Content ist unendlich und unvorhersagbar.** Neue Kurse werden
erstellt, Beschreibungen geändert, News veröffentlicht. Dieser Content lebt
in der Datenbank und wird über APIs ausgeliefert.

**Das eine hat mit dem anderen NICHTS zu tun.**

```
✅ i18next + TMS (Crowdin) ist zuständig für:
   - "Speichern" / "Save"
   - "Kurs buchen" / "Enroll in course"
   - "Ein Fehler ist aufgetreten." / "An error occurred."

❌ i18next + TMS ist NICHT zuständig für:
   - "React Grundlagen" (Kurstitel aus der DB)
   - "In diesem Kurs lernen Sie..." (Beschreibung aus der DB)
   - "Neue Features im Sommersemester" (News aus der DB)
```

---

## 3. Wie funktioniert mehrsprachiger dynamischer Content?

### 3.1 Das Backend entscheidet

Das Frontend schickt bei jedem API-Request mit, welche Sprache der User
gerade nutzt. Das Backend liefert den Content dann in der richtigen Sprache.

Der Standard-Weg: **`Accept-Language` HTTP-Header**.

```
Frontend (User hat "EN" gewählt):
    GET /api/v1/content/courses/42
    Accept-Language: en

Backend antwortet:
    Content-Language: en
    {
      "id": "42",
      "title": "React Fundamentals",
      "description": "In this course you will learn..."
    }
```

```
Frontend (User hat "DE" gewählt):
    GET /api/v1/content/courses/42
    Accept-Language: de

Backend antwortet:
    Content-Language: de
    {
      "id": "42",
      "title": "React Grundlagen",
      "description": "In diesem Kurs lernen Sie..."
    }
```

**Gleicher Endpoint, gleiche URL – nur der Header unterscheidet sich.**
Das Backend liest den Header und gibt den passenden Content zurück.

### 3.2 Wie setzt man den Header im Frontend?

In unserem Projekt nutzen wir Axios als API-Client. Der `Accept-Language`-Header
wird **einmal** im API-Client-Interceptor gesetzt:

```typescript
// shared/api/client.ts
import i18next from 'i18next';

apiClient.interceptors.request.use((config) => {
  // Sprache aus i18next übernehmen
  config.headers['Accept-Language'] = i18next.language; // z.B. "de" oder "en"
  return config;
});
```

Das ist alles. Ab jetzt weiß das Backend bei jedem Request, welche Sprache
der User ausgewählt hat. Der Interceptor wird einmal geschrieben und gilt
für alle API-Calls.

### 3.3 Wie speichert das Backend mehrsprachigen Content?

Das ist Backend-Verantwortung (Go-Microservices), aber zum Verständnis gibt
es drei gängige Patterns:

#### Pattern A: Separate Spalten pro Sprache

```
┌─────────────────────────────────────────────────────┐
│ courses                                             │
├──────┬──────────────────┬──────────────────────────┤
│ id   │ title_de         │ title_en                  │
├──────┼──────────────────┼──────────────────────────┤
│ 42   │ React Grundlagen │ React Fundamentals        │
│ 43   │ TypeScript Intro │ TypeScript Introduction   │
└──────┴──────────────────┴──────────────────────────┘
```

Einfach, aber skaliert schlecht bei vielen Sprachen (jede Sprache = neue Spalten).

#### Pattern B: Separate Übersetzungstabelle

```
┌──────────────────────┐    ┌───────────────────────────────────────┐
│ courses              │    │ course_translations                   │
├──────┬───────────────┤    ├──────────┬────────┬──────────────────┤
│ id   │ created_at    │    │ course_id│ lang   │ title             │
├──────┼───────────────┤    ├──────────┼────────┼──────────────────┤
│ 42   │ 2026-01-15    │    │ 42       │ de     │ React Grundlagen  │
│ 43   │ 2026-02-20    │    │ 42       │ en     │ React Fundamentals│
└──────┴───────────────┘    │ 43       │ de     │ TypeScript Intro  │
                            │ 43       │ en     │ TypeScript Intro.. │
                            └──────────┴────────┴──────────────────┘
```

Skaliert besser. Neue Sprache = neue Zeilen, keine Schemaänderung.

#### Pattern C: JSON-Feld pro Spalte

```
┌──────┬──────────────────────────────────────────────────────┐
│ id   │ title                                                │
├──────┼──────────────────────────────────────────────────────┤
│ 42   │ {"de": "React Grundlagen", "en": "React Fundamentals"}│
│ 43   │ {"de": "TypeScript Intro", "en": "TypeScript Intro..."}│
└──────┴──────────────────────────────────────────────────────┘
```

Flexibel, aber schwerer zu durchsuchen/indexieren.

**Welches Pattern das Backend nutzt, ist für uns als Frontend egal.** Wir
sehen nur die API-Response – und die ist immer einsprachig, basierend auf
dem `Accept-Language`-Header.

---

## 4. Die zwei Welten in einer Komponente

So sieht es konkret in einer React-Komponente aus, wenn beide Arten von
Text zusammenkommen:

```typescript
function CourseCard({ course }: { course: Course }) {
  const { t } = useTranslation('courses');

  return (
    <article>
      {/* DYNAMISCH: Kurstitel aus der API/Datenbank */}
      <h3>{course.title}</h3>

      {/* DYNAMISCH: Kursbeschreibung aus der API/Datenbank */}
      <p>{course.description}</p>

      {/* STATISCH: UI-String aus den JSON-Dateien (i18next) */}
      <button>{t('detail.enrollButton')}</button>
      {/*                ↑ "Kurs buchen" (DE) / "Enroll in course" (EN) */}

      {/* STATISCH: UI-String */}
      <span>{t('card.modules', { count: course.moduleCount })}</span>
      {/*          ↑ "5 Module" (DE) / "5 Modules" (EN) */}
    </article>
  );
}
```

**`course.title`** kommt vom API-Call (Backend hat `Accept-Language` gelesen).
**`t('detail.enrollButton')`** kommt aus `public/locales/de/courses.json`.

Beide sind mehrsprachig. Aber sie kommen aus **komplett verschiedenen Quellen**
und werden **komplett unterschiedlich verwaltet**.

---

## 5. Wer ist wofür zuständig?

| Aspekt | UI-Strings | Dynamischer Content |
|---|---|---|
| **Quelle** | JSON-Dateien im Repo | Backend-Datenbank |
| **Verwaltet von** | Entwickler + Übersetzer (TMS) | Content-Ersteller (CMS/Admin) |
| **Technologie** | i18next + react-i18next | REST API + `Accept-Language` |
| **Übersetzung passiert** | Im TMS (Crowdin) | Im Backend/CMS |
| **Beispiel** | "Speichern" → "Save" | "React Grundlagen" → "React Fundamentals" |
| **Anzahl** | Hunderte (endlich) | Tausende+ (wächst ständig) |
| **Änderung durch** | Code-Deployment (oder TMS-CDN) | Datenbank-Update |
| **Frontend-Code** | `t('key')` | `course.title` |

---

## 6. Was muss das Frontend tun?

### Für UI-Strings (bereits umgesetzt):
- i18next konfigurieren ✓
- Übersetzungsdateien pflegen ✓
- `t()` in Komponenten nutzen ✓
- TMS (Crowdin) integrieren (MVP in Arbeit)

### Für dynamischen Content (eine Zeile Code):

```typescript
// shared/api/client.ts – existiert bereits
apiClient.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // NEU: Sprache bei jedem Request mitschicken
  config.headers['Accept-Language'] = i18next.language;

  return config;
});
```

**Das ist alles, was das Frontend tun muss.** Der Rest ist Backend-Verantwortung.

Das Backend:
1. Liest den `Accept-Language`-Header
2. Fragt die Datenbank mit dem passenden Sprachcode ab
3. Gibt den Content in der gewünschten Sprache zurück
4. Setzt `Content-Language` im Response-Header

Falls das Backend keinen Content in der gewünschten Sprache hat, gibt es
einen Fallback zurück (z.B. Deutsch als Default) – analog zu i18next's
`fallbackLng`.

---

## 7. Häufige Denkfehler

### ❌ "Wir müssen Kurstitel in die JSON-Dateien packen"

```typescript
// FALSCH – Kurstitel gehören nicht in i18n-Dateien
// public/locales/de/courses.json
{
  "course_42_title": "React Grundlagen",
  "course_43_title": "TypeScript Intro"
}
```

Das skaliert nicht. Bei 500 Kursen hättest du 500 Keys in der JSON-Datei,
die ständig gepflegt werden müssten. Content aus der Datenbank bleibt in
der Datenbank.

### ❌ "Wir übersetzen Kurstitel im TMS"

Der TMS (Crowdin) ist für **feste UI-Strings** gedacht, nicht für dynamischen
Content. Kurse werden von Dozenten erstellt und geändert – das ist ein
CMS-Workflow, kein Übersetzungs-Workflow.

### ❌ "Wir schicken die Sprache als Query-Parameter"

```
// Funktioniert, aber ist nicht Standard
GET /api/v1/content/courses?lang=de
```

Der `Accept-Language`-Header ist der HTTP-Standard für Content Negotiation.
Query-Parameter für die Sprache zu nutzen funktioniert technisch, hat aber
Nachteile:
- Muss bei jedem Endpoint manuell mitgegeben werden
- Vermischt Sprache (Darstellung) mit Business-Parametern (Filterung)
- Caching wird komplexer (verschiedene URLs für gleichen Content)

### ❌ "Accept-Language steuert auch Währung und Datumformat"

Nein. Sprache und Geschäftslogik trennen:

```
// RICHTIG: Sprache über Header, Business-Parameter als Query
GET /api/v1/products?country=AT&currency=EUR
Accept-Language: de-AT

// FALSCH: Alles über den Header steuern
// → Was wenn jemand auf Englisch, aber mit EUR-Preisen einkaufen will?
```

---

## 8. Zusammenfassung

```
┌─────────────────────────────────────────────────────────────────┐
│                      Lernwelt App                               │
│                                                                 │
│  ┌──────────────────────┐    ┌──────────────────────────────┐  │
│  │   UI-Strings          │    │   Dynamischer Content         │  │
│  │                       │    │                               │  │
│  │  "Speichern"          │    │  "React Grundlagen"           │  │
│  │  "Kurs buchen"        │    │  "In diesem Kurs..."          │  │
│  │  "Wird geladen..."    │    │  "Neue Features im SS 2026"   │  │
│  │                       │    │                               │  │
│  │  Quelle: JSON-Datei   │    │  Quelle: Backend-API          │  │
│  │  Tool: i18next + TMS  │    │  Tool: Accept-Language Header │  │
│  │  Code: t('key')       │    │  Code: course.title           │  │
│  └──────────┬───────────┘    └──────────────┬───────────────┘  │
│             │                               │                   │
│     public/locales/                  GET /api/v1/...            │
│     de/common.json                   Accept-Language: de        │
│     en/common.json                                              │
│             │                               │                   │
│      ┌──────▼──────┐               ┌───────▼────────┐          │
│      │  TMS        │               │  Backend       │          │
│      │  (Crowdin)  │               │  (Go Services) │          │
│      │             │               │  + Datenbank   │          │
│      └─────────────┘               └────────────────┘          │
└─────────────────────────────────────────────────────────────────┘
```

| Frage | Antwort |
|---|---|
| Wo kommt "Speichern"/"Save" her? | `public/locales/de/common.json` via `t()` |
| Wo kommt "React Grundlagen" her? | Backend-API Response via `course.title` |
| Wie weiß das Backend welche Sprache? | `Accept-Language: de` Header |
| Wer übersetzt UI-Strings? | Übersetzer im TMS (Crowdin) |
| Wer übersetzt Kurstitel? | Content-Ersteller im Backend/CMS |
| Steuert i18next den API-Content? | **Nein.** i18next steuert nur UI-Strings |
| Was muss das Frontend für API-Content tun? | `Accept-Language`-Header setzen (1 Zeile) |
