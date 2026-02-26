# 05-1: Mock-Strategie – Warum kein Frontend-Mock, sondern ein Go-Mock-Server

## Die Ausgangsfrage

In Schritt 5.3 werden zwei Optionen für Mock-Daten vorgeschlagen:

- **Option A:** Mock-Daten direkt im Frontend (`courses.mock.ts` + temporär modifizierte `courses.api.ts`)
- **Option B:** MSW (Mock Service Worker) – Requests im Browser abfangen

Du hast die richtige Intuition: **Kein Mock-Code im Frontend.** Wenn der echte Service steht, willst du nur die URL wechseln – nichts anderes.

Dieser Schritt analysiert beide Optionen kritisch und zeigt, warum ein **einfacher Go-Mock-Server** die bessere Lösung ist.

---

## Kritik: Option A – Mock-Daten im Frontend

```typescript
// courses.api.ts – "temporär" mit Mocks
import { mockCourses } from './courses.mock';

export const coursesApi = {
  getCourses: async (): Promise<Course[]> => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return mockCourses;
  },
};
```

### Was hier schiefläuft

**1. "Temporär" ist dauerhaft.**
`// TODO: Remove mock` Kommentare leben ewig. Der Wechsel zum echten Backend erfordert aktive Code-Änderungen in Produktionsdateien. Du kannst es vergessen, du kannst es halbfertig lassen.

**2. Axios macht gar keinen HTTP-Request.**
Das ist das entscheidende Problem: Dein API-Client wird vollständig umgangen. Du testest nicht, ob Axios richtig konfiguriert ist (Auth-Header, Interceptors, Base URL). Du testest nicht, ob Zod die echte HTTP-Response validieren kann. Der "Vertical Slice" ist gar kein vollständiger Slice – die unterste Schicht fehlt.

**3. CORS und Auth werden nie getestet.**
Wenn der echte Server dann steht und CORS-Fehler oder Auth-Probleme aufkommen, erfährst du es erst dann – nicht vorher.

**4. Mock-Daten "driften" vom echten API-Vertrag weg.**
Die Daten in `courses.mock.ts` werden mit der Zeit veralten. Der echte Backend-Entwickler ändert ein Feld (`previewImageUrl` → `thumbnailUrl`), der Mock bleibt falsch. Zod wird das erst beim ersten echten Request bemerken.

**5. Produktionscode und Entwicklungscode vermischen sich.**
Mock-Imports, Mock-Dateien, `setTimeout`-Hacks – alles landet in deinem `src/`-Verzeichnis. Das gehört nicht dort hin.

---

## Kritik: Option B – MSW (Mock Service Worker)

MSW ist ein deutlich besserer Ansatz als Option A. Es interceptet echte HTTP-Requests auf Service-Worker-Ebene, sodass Axios wirklich Requests macht. Für **Tests** (Vitest) ist MSW tatsächlich die richtige Wahl.

Aber für die Entwicklung hat es Nachteile:

**1. Es lebt immer noch im Frontend-Repo.**
MSW-Handler (`handlers.ts`) sind Frontend-Code. Sie müssen gepflegt werden. Sie driften vom echten API-Vertrag weg. Das Problem ist das gleiche wie bei Option A, nur eleganter verpackt.

**2. Setup-Aufwand für Browser-Entwicklung.**
Service Worker müssen registriert werden, es gibt Eigenheiten mit Vite, die Konfiguration braucht Zeit.

**3. Es gibt keine "echte" Serverseite.**
Wenn du POST-Requests machst (Login, Kurs abschließen), simuliert MSW die Antwort im Browser. Du erfährst nie, ob dein Request-Body das richtige Format hat, das der echte Go-Service erwartet.

**4. Aber:** Für automatisierte Tests (Vitest + React Testing Library) bleibt MSW die **richtige Wahl**. Das ist der Usecase, für den es gebaut wurde.

---

## Die richtige Lösung: Ein einfacher Go-Mock-Server

### Das Kernprinzip

```
Frontend (Axios)  →  HTTP Request  →  Go Mock Server  →  JSON Response
```

Der Frontend-Code ändert sich **nicht**. Keine Mock-Dateien. Keine temporären Hacks. Nur eine Umgebungsvariable:

```bash
# .env.development.local (nicht in Git!)
VITE_API_BASE_URL=http://localhost:8080

# Später, wenn der echte Service steht:
VITE_API_BASE_URL=https://api.lernwelt.de
```

Das war's. Das ist das "nur URL ändern"-Versprechen.

### Was der Mock-Server leisten muss

- Dieselben Endpunkte wie der echte Service (`/api/v1/content/courses`, etc.)
- Dieselbe JSON-Struktur (exakt das, was die Zod-Schemas erwarten)
- CORS-Header (damit der Browser die Requests zulässt)
- Eine einfache Login-Route, die ein Fake-JWT zurückgibt
- HTTP 401 bei fehlendem/ungültigem Token (damit der Auth-Flow getestet werden kann)

### Was er **nicht** braucht

- Datenbankanbindung
- Echte Geschäftslogik
- Persistenz über Neustarts hinaus (In-Memory reicht)
- Perfekte JWT-Validierung

---

## Konkrete Implementierung

### Projektstruktur

Der Mock-Server lebt **außerhalb** des Frontend-Repos – entweder als eigenes Repository oder als Unterordner im Monorepo:

```
LernweltLight/          ← Frontend (dieses Repo)
mock-server/            ← Go Mock Server (separater Ordner oder eigenes Repo)
  ├── main.go
  ├── handlers/
  │   ├── auth.go
  │   └── courses.go
  ├── data/
  │   └── courses.json  ← Mock-Daten als JSON-Dateien
  ├── go.mod
  ├── go.sum
  └── Dockerfile
```

**Alternativ:** Einen vorhandenen Mock-Server-Generator verwenden (siehe unten).

### `main.go` – Minimales Beispiel

```go
package main

import (
    "encoding/json"
    "log"
    "net/http"
    "strings"
)

func main() {
    mux := http.NewServeMux()

    // CORS Middleware
    handler := corsMiddleware(mux)

    // Routes
    mux.HandleFunc("/api/v1/auth/login", handleLogin)
    mux.HandleFunc("/api/v1/content/courses", authMiddleware(handleCourses))

    log.Println("Mock-Server läuft auf http://localhost:8080")
    log.Fatal(http.ListenAndServe(":8080", handler))
}

func corsMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        w.Header().Set("Access-Control-Allow-Origin", "http://localhost:5173")
        w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
        w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
        if r.Method == http.MethodOptions {
            w.WriteHeader(http.StatusNoContent)
            return
        }
        next.ServeHTTP(w, r)
    })
}

func authMiddleware(next http.HandlerFunc) http.HandlerFunc {
    return func(w http.ResponseWriter, r *http.Request) {
        auth := r.Header.Get("Authorization")
        if !strings.HasPrefix(auth, "Bearer ") {
            http.Error(w, `{"message":"Unauthorized","statusCode":401}`, http.StatusUnauthorized)
            return
        }
        next(w, r)
    }
}

func handleLogin(w http.ResponseWriter, r *http.Request) {
    if r.Method != http.MethodPost {
        http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
        return
    }
    w.Header().Set("Content-Type", "application/json")
    // Fake JWT – das Frontend speichert ihn und schickt ihn bei jedem Request mit
    json.NewEncoder(w).Encode(map[string]string{
        "accessToken":  "mock.jwt.token",
        "refreshToken": "mock.refresh.token",
    })
}

func handleCourses(w http.ResponseWriter, r *http.Request) {
    w.Header().Set("Content-Type", "application/json")
    // Direkt aus courses.json einlesen oder hardcoded
    courses := []map[string]interface{}{
        {
            "id":              "1",
            "title":           "React Grundlagen",
            "description":     "Lerne die Grundlagen von React mit TypeScript",
            "previewImageUrl": nil,
            "modules":         []interface{}{},
        },
    }
    json.NewEncoder(w).Encode(courses)
}
```

### `docker-compose.yml` – Starten mit einem Befehl

```yaml
services:
  mock-server:
    build: ./mock-server
    ports:
      - "8080:8080"
    volumes:
      - ./mock-server/data:/app/data  # JSON-Dateien live reloaden
```

```bash
# Starten
docker-compose up mock-server

# Frontend daneben (in einem zweiten Terminal)
pnpm dev
```

---

## Die "Nur-URL-ändern"-Garantie – wann gilt sie wirklich?

Das Versprechen "nur URL ändern" hält nur, wenn diese Bedingungen erfüllt sind:

### ✅ Bedingung 1: Der Mock-Server gibt exakt dieselbe JSON-Struktur zurück

Die Zod-Schemas im Frontend sind der **Vertrag**. Der Mock-Server muss diesen Vertrag einhalten. Wenn der echte Go-Service eine andere Feldnamen-Konvention verwendet (z.B. `snake_case` statt `camelCase`), muss das von Anfang an bekannt sein und der Mock-Server muss es bereits so liefern.

**Risiko:** Wenn der echte Backend-Entwickler das Schema ändert, müssen sowohl der Mock-Server als auch die Zod-Schemas angepasst werden. Das ist aber gut – es zwingt zur expliziten Kommunikation über den API-Vertrag.

### ✅ Bedingung 2: Auth-Flow ist kompatibel

Der Mock-Server gibt bei Login ein Token zurück. Der echte Server gibt auch ein Token zurück. Solange der Frontend-Code nur prüft "habe ich ein Token, ja/nein" und das Token bei Requests mitschickt, funktioniert die Umstellung.

**Risiko:** Wenn der echte Server JWT-Claims (Rollen, Permissions) auswertet und der Mock das nicht korrekt simuliert, können Auth-abhängige UI-Teile nach der Umstellung anders aussehen.

### ✅ Bedingung 3: Fehler-Responses haben dieselbe Struktur

Der `ApiError`-Typ (`{ message, statusCode, details }`) muss vom Mock-Server genauso zurückgegeben werden wie vom echten Service. Sonst funktioniert die Fehlerbehandlung nach der Umstellung nicht.

### ⚠️ Was du vorher klären musst

Bevor du mit dem Mock-Server anfängst, kläre mit dem Backend-Team:

1. **Welche JSON-Feldnamen?** `camelCase` oder `snake_case`? Go tendiert zu `snake_case`, das Frontend erwartet `camelCase` – wer macht die Umwandlung?
2. **Auth-Format?** JWT mit welchen Claims? Wie lange gültig? Refresh-Token-Rotation?
3. **Pagination?** Gibt `GET /courses` alle Kurse zurück oder ein Pagination-Objekt `{ data: [...], total: 100, page: 1 }`?
4. **Error-Format?** Exakt die `ApiError`-Struktur?

Diese Fragen **jetzt** zu stellen spart später Schmerzen.

---

## Alternative: Fertige Mock-Server-Tools

Du musst den Go-Server nicht selbst schreiben. Es gibt Tools, die das für dich tun:

### Option 1: Prism (API-Mock aus OpenAPI-Spec)

```bash
# OpenAPI-Spec schreiben (oder vom Backend-Team bekommen)
npx @stoplight/prism-cli mock openapi.yaml --port 8080
```

**Vorteil:** Wenn das Backend-Team eine OpenAPI-Spec liefert, hast du sofort einen Mock-Server ohne eine Zeile Code. Zod-Schemas können ebenfalls aus der OpenAPI-Spec generiert werden.

**Nachteil:** Braucht eine OpenAPI-Spec. Wenn das Backend-Team keine liefert, musst du sie selbst schreiben.

### Option 2: json-server (Node.js)

```bash
npx json-server --watch mock-server/db.json --port 8080
```

**Vorteil:** Extrem einfach, CRUD automatisch für alle Ressourcen, keine Go-Kenntnisse nötig.

**Nachteil:** Kein Auth-Flow, keine Kontrolle über Response-Struktur, limitiert bei komplexeren Schemas.

### Option 3: Eigener Go-Server (empfohlen)

Der selbst geschriebene Go-Server aus dem Beispiel oben ist die robusteste Variante:
- Vollständige Kontrolle über Routes und Responses
- Auth-Flow (Login, Token-Validierung) realistisch simulierbar
- Spätere Erweiterung (POST/PUT/DELETE mit In-Memory-State) einfach
- Näher am späteren echten Go-Service

---

## Empfehlung: Die richtige Strategie für dieses Projekt

### Phase 1: Erster Durchstich (jetzt)

Nutze einen **einfachen Go-Mock-Server** oder `json-server` für die allerersten Schritte. Ziel ist nur: der Frontend-Request fliegt, die Response kommt an, Zod validiert, die UI rendert.

```
mock-server/
  main.go      ← 100 Zeilen, reicht für den Anfang
```

### Phase 2: Feature-Entwicklung (parallel zum echten Backend)

Erweitere den Mock-Server feature-by-feature, genau so wie du das Frontend erweiterst. Für jeden neuen Endpunkt: erst den Mock, dann das echte Feature.

```
# .env.development.local
VITE_API_BASE_URL=http://localhost:8080  ← immer gleich
```

### Phase 3: Echter Service steht

```
# .env.production (oder direkt konfiguriert)
VITE_API_BASE_URL=https://api.lernwelt.de
```

Das ist die einzige Änderung. Kein Frontend-Code anfassen.

### Tests (separat): MSW bleibt die richtige Wahl

Für **automatisierte Tests** (Vitest, React Testing Library) ist MSW weiterhin ideal:

```typescript
// features/courses/hooks/useCourses.test.ts
import { server } from '@/test/server'; // MSW-Server
import { http, HttpResponse } from 'msw';

server.use(
  http.get('/api/v1/content/courses', () => {
    return HttpResponse.json([mockCourse]);
  }),
);
```

MSW in Tests = richtig.
MSW als Entwicklungs-Mock = unnötig, wenn ein Go-Server existiert.

---

## Zusammenfassung

| Ansatz | Frontend-Code | URL-Switch | Auth testbar | Realismus | Empfehlung |
|--------|--------------|------------|--------------|-----------|------------|
| Option A: Mock in `courses.api.ts` | Produktionscode verschmutzt | Nein, Code-Änderung nötig | Nein | Gering | ❌ |
| Option B: MSW (Browser) | Handler im Frontend-Repo | Nein, Handler bleiben | Eingeschränkt | Mittel | Nur für Tests ✅ |
| Go Mock Server | Null Mock-Code im Frontend | Ja, nur `.env` ändern | Ja (401/403 simulierbar) | Hoch | ✅ für Entwicklung |
| json-server | Null Mock-Code im Frontend | Ja, nur `.env` ändern | Nein | Mittel | ✅ für schnellen Start |
| Prism + OpenAPI | Null Mock-Code im Frontend | Ja, nur `.env` ändern | Eingeschränkt | Sehr hoch | ✅ wenn OpenAPI vorhanden |

**Die klare Empfehlung:** Schreibe einen minimalen Go-Mock-Server. 100-200 Zeilen Go reichen für die ersten Features. Du beweist damit, dass die gesamte HTTP-Kette vom ersten Tag an funktioniert – nicht erst, wenn der echte Service steht.
