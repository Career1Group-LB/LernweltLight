# 05-2: Mock-Server anbinden – Vollständiger Durchstich

## Was hier passiert

Der Go-Mock-Server (`lernweltlight-backend`) läuft auf `http://localhost:3000`
und simuliert alle Backend-Endpunkte. Dieses Dokument beschreibt, welche
Frontend-Dateien angepasst wurden und warum.

**Das Ziel:** Der gesamte HTTP-Stack funktioniert von heute an – ohne einen
einzigen Mock-Import im `src/`-Verzeichnis.

---

## Voraussetzung: Mock-Server läuft

```bash
# Im lernweltlight-backend/ Repo
go run ./cmd/mockserver
# → Mock-Server läuft auf http://localhost:3000
```

---

## Was wurde geändert

### 1. `.env` – BaseURL korrigiert

```bash
# VORHER (falsch – hätte doppelten /api Pfad erzeugt)
VITE_API_BASE_URL=http://localhost:3000/api

# NACHHER (korrekt)
VITE_API_BASE_URL=http://localhost:3000
```

**Warum:** Axios' `combineURLs` hängt den Pfad an die BaseURL an.
Mit `/api` als Teil der BaseURL und `/api/v1/...` als Pfad wäre das Ergebnis
`http://localhost:3000/api/api/v1/...` gewesen – falsch.
Die BaseURL ist der Host, Pfade beginnen mit `/api/v1/...`.

---

### 2. `src/features/auth/components/LoginPage.tsx`

**Vorher:** Fake-Token hardcoded übergeben.

```typescript
// VORHER
const handleLogin = () => {
    login('demo-token-123'); // Fake!
    navigate('/courses');
};
```

**Nachher:** Echter POST-Request an den Mock-Server.

```typescript
// NACHHER
const handleLogin = async () => {
    const response = await apiClient.post('/api/v1/auth/login', {
        email: 'demo@lernwelt.de',
        password: 'demo',
    });
    login(response.data.accessToken); // "mock-access-token"
    navigate('/courses');
};
```

Der Mock-Server gibt bei **jedem Login immer** `mock-access-token` zurück,
egal welche Credentials. Der `client.ts` Interceptor hängt diesen Token
automatisch an alle folgenden Requests an.

---

### 3. `src/shared/hooks/useFeatureFlag.ts`

**Vorher:** Hardcodiertes Objekt (kein HTTP-Request).

**Nachher:** Echter GET-Request an `/api/v1/config`.

```typescript
async function fetchConfig(): Promise<{ featureFlags: Record<FeatureFlag, boolean> }> {
    const response = await apiClient.get('/api/v1/config');
    return response.data;
}
```

React Query cached die Config mit `staleTime: Infinity` – sie wird einmal
beim App-Start geladen und danach nie wieder neu abgerufen.

---

### 4. Neue Dateien: Courses-Feature

#### `src/features/courses/schemas/course.schema.ts`

Zod-Schemas, die exakt mit den Go-Structs im Mock-Server übereinstimmen:

```
Mock-Server:                    Frontend:
data.Activity struct       ↔    ActivitySchema
data.LearningUnit struct   ↔    LearningUnitSchema
data.Module struct         ↔    ModuleSchema
data.Course struct         ↔    CourseSchema
```

Die `json:"..."` Tags in Go und die Zod-Feldnamen **müssen identisch sein**.

#### `src/features/courses/api/courses.api.ts`

```typescript
const BASE = '/api/v1/content';

export const coursesApi = {
    getCourses: async (): Promise<Course[]> => {
        const response = await apiClient.get(`${BASE}/courses`);
        return CoursesListSchema.parse(response.data); // Zod validiert
    },
    getCourse: async (id: string): Promise<Course> => {
        const response = await apiClient.get(`${BASE}/courses/${id}`);
        return CourseSchema.parse(response.data);
    },
};
```

#### `src/features/courses/hooks/useCourses.ts` + `useCourse.ts`

Standard React Query Hooks – kein Boilerplate.

---

## Vollständiger Flow testen

### 1. Mock-Server starten

```bash
# Terminal 1: Backend
cd lernweltlight-backend/
go run ./cmd/mockserver
```

### 2. Frontend starten

```bash
# Terminal 2: Frontend
cd LernweltLight/
pnpm dev
```

### 3. Browser öffnen

```
http://localhost:5173/login
```

**Was passieren sollte:**
1. Login-Button klicken
2. POST `http://localhost:3000/api/v1/auth/login` → `mock-access-token`
3. Weiterleitung zu `/courses`
4. GET `http://localhost:3000/api/v1/content/courses` (mit Bearer Token) → 3 Kurse
5. GET `http://localhost:3000/api/v1/config` → Feature Flags

**Im Browser-Netzwerk-Tab (F12 → Network) siehst du alle drei Requests.**

---

## Wenn etwas nicht klappt

### 401 Unauthorized beim Courses-Request

→ Der Token wurde nicht gespeichert. Prüfe:
- `localStorage.getItem('access_token')` in der Browser-Konsole
- Der Login-Request muss zuerst durch und `login()` muss aufgerufen worden sein

### CORS-Fehler

→ Der Mock-Server läuft nicht. Prüfe:
- `go run ./cmd/mockserver` gestartet?
- Läuft auf Port 3000? (`curl http://localhost:3000/api/v1/auth/login -X POST`)

### Zod-Validierungsfehler

→ Die JSON-Struktur vom Server stimmt nicht mit dem Schema überein.
Prüfe in der Konsole, welches Feld fehlt oder den falschen Typ hat.
Vergleiche `course.schema.ts` mit `internal/data/seed.go` im Backend.

### `http://localhost:3000/api/api/v1/...` in den Requests

→ Die `.env`-Datei hat noch `/api` am Ende der BaseURL.
Fix: `VITE_API_BASE_URL=http://localhost:3000` (ohne `/api`).

---

## Nächster Schritt: Courses-UI bauen

Die Daten fließen jetzt. Als Nächstes braucht das Courses-Feature UI-Komponenten:

```
src/features/courses/
├── components/
│   ├── CoursesPage.tsx     ← Liste aller Kurse
│   └── CourseCard.tsx      ← Einzelne Kurskarte
```

Pattern in `05-erster-durchstich.md` Abschnitt 5.5 beschrieben.

---

## Neuen Endpunkt hinzufügen

Wenn du ein neues Feature baust, das Backend-Daten braucht:

**Backend** (`lernweltlight-backend/`):
1. Struct in `internal/data/seed.go` → JSON-Tags = Zod-Felder
2. Handler in `internal/handlers/neues-feature.go`
3. Route in `cmd/mockserver/main.go` registrieren

**Frontend** (`LernweltLight/`):
1. Zod-Schema in `src/features/FEATURE/schemas/`
2. API-Funktion in `src/features/FEATURE/api/`
3. React Query Hook in `src/features/FEATURE/hooks/`
4. UI-Komponente in `src/features/FEATURE/components/`

Das Pattern ist immer gleich. Das ist Absicht.
