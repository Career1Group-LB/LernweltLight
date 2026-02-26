# Schritt 4: Foundation bauen

## Was ist die "Foundation" und warum brauche ich sie?

Stell dir vor, du baust ein Haus. Bevor du Zimmer einrichtest (= Features baust), brauchst du:

- Fundament
- Tragende Wände
- Strom- und Wasserleitungen
- Haustür mit Schloss

In React ist es genauso. Bevor du "Kurse anzeigen", "Quiz absolvieren" oder "Profil bearbeiten" baust, brauchst du:

| React-Baustein           | Analogie im Haus                   | Analogie in Flutter                           |
| ------------------------ | ---------------------------------- | --------------------------------------------- |
| **API Client**           | Wasserleitung – bringt Daten rein  | `dio` / `http` Package + Header-Konfiguration |
| **React Query Provider** | Stromnetz – versorgt die ganze App | `RepositoryProvider` in `main_base.dart`      |
| **Router**               | Flurplan mit Türen                 | `AutoRoute` / `go_router`                     |
| **Layout (Shell)**       | Grundriss: Wände, Flur, Zimmer     | `Scaffold` mit `Drawer` und `AppBar`          |
| **Auth**                 | Haustür mit Schloss                | `AuthCubit` + Guards                          |
| **Feature Flags**        | Lichtschalter pro Zimmer           | Feature-Flag-System im Config                 |

**Das baust du in dieser Reihenfolge** – jeder Schritt baut auf dem vorherigen auf:

```
4.1  API Client          → Axios konfigurieren
4.2  React Query Provider → Provider in App einbauen
4.3  Router              → Seiten und Navigation definieren
4.4  Layout (Shell)      → Sidebar, Header, Content-Bereich
4.5  Auth               → Login-State verwalten
4.6  Feature Flags       → Features ein-/ausschalten
4.7  App.tsx            → Alles zusammenstecken
4.8  Smoke Test         → Prüfen ob alles läuft
```

---

## 4.1 API Client mit Axios

### Was ist Axios und warum brauchen wir es?

Axios ist eine Library für HTTP-Requests – also das, was in Flutter `Dio` oder `http` macht. Der Browser hat zwar eine eingebaute `fetch`-Funktion, aber Axios gibt uns mehr:

- **Base URL** – Du schreibst `/courses` statt immer `https://api.lernwelt.com/api/v1/courses`
- **Interceptors** – Code der automatisch bei JEDEM Request/Response läuft (z.B. Auth-Token hinzufügen)
- **Automatisches JSON-Parsing** – Response ist schon als Objekt verfügbar, kein `.json()` nötig
- **Besseres Error-Handling** – Network-Fehler vs. HTTP-Fehler klar getrennt

**Flutter-Analogie:**

```dart
// Flutter: Dio konfigurieren
final dio = Dio(BaseOptions(
  baseUrl: 'https://api.lernwelt.com',
  headers: {'Content-Type': 'application/json'},
));
dio.interceptors.add(AuthInterceptor());
```

Das Äquivalent in React/Axios:

```typescript
// React: Axios konfigurieren
const apiClient = axios.create({
  baseURL: 'https://api.lernwelt.com',
  headers: { 'Content-Type': 'application/json' },
});
apiClient.interceptors.request.use(authInterceptor);
```

### Was ist ein Interceptor?

Ein Interceptor ist wie ein Checkpoint, durch den jeder Request/Response automatisch durchläuft.

```
Ohne Interceptor:
  Dein Code → HTTP Request → Server → HTTP Response → Dein Code

Mit Interceptor:
  Dein Code → [Request Interceptor: Token hinzufügen] → HTTP Request → Server
           → HTTP Response → [Response Interceptor: Fehler prüfen] → Dein Code
```

**Praktisches Beispiel:** Du hast 20 API-Funktionen. Alle brauchen den Auth-Token im Header. Ohne Interceptor müsstest du in allen 20 Funktionen `headers: { Authorization: 'Bearer ...' }` schreiben. Mit einem Interceptor machst du das einmal zentral.

### Erstelle die Datei `src/shared/api/client.ts` ✅

```typescript
import axios from 'axios';

// import.meta.env.VITE_API_BASE_URL liest aus der .env Datei
// || 'http://localhost:3000' ist der Fallback wenn nichts in .env steht
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

// axios.create() macht eine konfigurierte Axios-Instanz
// (statt axios direkt zu nutzen, haben wir so unsere eigene Instanz mit Defaults)
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ─── REQUEST INTERCEPTOR ────────────────────────────────────────────────────
// Wird vor JEDEM ausgehenden Request aufgerufen
// Aufgabe: Auth-Token an den Request hängen
apiClient.interceptors.request.use((config) => {
  // localStorage ist der Browser-Speicher (wie SharedPreferences in Flutter)
  const token = localStorage.getItem('access_token');

  if (token) {
    // Authorization Header hinzufügen
    // Das Backend erwartet: "Bearer <token>"
    config.headers.Authorization = `Bearer ${token}`;
  }

  // config zurückgeben – ohne return wird der Request abgebrochen!
  return config;
});

// ─── RESPONSE INTERCEPTOR ───────────────────────────────────────────────────
// Wird nach JEDER eingehenden Response aufgerufen
// Erster Parameter: Was passiert bei Erfolg (Status 200-299)
// Zweiter Parameter: Was passiert bei Fehler (Status 400+)
apiClient.interceptors.response.use(
  // Erfolg: Response einfach durchleiten, nichts verändern
  (response) => response,

  // Fehler: Prüfen was der Fehler ist
  (error) => {
    if (error.response?.status === 401) {
      // 401 = "Unauthorized" = Token abgelaufen oder ungültig
      // Token löschen und zur Login-Seite schicken
      localStorage.removeItem('access_token');
      window.location.href = '/login';
    }
    // Fehler weiterwerfen, damit der aufrufende Code ihn auch sieht
    return Promise.reject(error);
  },
);
```

> **Hinweis:** Das `localStorage`-Handling ist ein Platzhalter. Wie der Token gespeichert wird (localStorage, sessionStorage, HTTP-only Cookie) hängt von der Entscheidung des Auth-Microservice-Teams ab. Wir ändern das später.

### Wie wird der API Client verwendet?

Du importierst ihn in jede API-Funktions-Datei:

```typescript
// Irgendwo in features/courses/api/courses.api.ts
import { apiClient } from '@/shared/api/client';

// Kein Token angeben, kein Base-URL angeben – das macht der Client automatisch
const response = await apiClient.get('/courses');
//                                  ↑ wird zu: https://api.lernwelt.com/courses
//                                  + Authorization: Bearer <token> im Header
```

---

## 4.2 React Query Provider

### Was ist ein "Provider" in React?

Das Konzept kennst du aus Flutter: `RepositoryProvider`, `BlocProvider`, `MultiProvider`. Ein Provider macht etwas für den gesamten Widget-Tree zugänglich.

In React ist es dasselbe Prinzip, nur heißt es "Context Provider". Du wickelst deine gesamte App darin ein, und dann kann jede Komponente darunter auf das zugreifen, was der Provider bereitstellt.

```
Flutter:                            React:
MultiProvider(                      <QueryProvider>
  providers: [                        <RouterProvider />
    RepositoryProvider(...)         </QueryProvider>
    BlocProvider(...)
  ],
  child: App(),
)
```

### Was ist der QueryClient?

React Query braucht einen zentralen "Speicher" für alle gecachten Daten, laufenden Requests, Fehlerzustände, etc. Das ist der `QueryClient`. Du erstellst ihn einmal und gibst ihn dem Provider:

```
QueryClient (der zentrale Datenspeicher)
    ↓
QueryClientProvider (macht ihn für die App zugänglich)
    ↓
Alle Komponenten können useQuery() / useMutation() nutzen
```

### Erstelle `src/providers/QueryProvider.tsx`

```typescript
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import type { ReactNode } from 'react';

// QueryClient einmal erstellen – das ist der zentrale Cache für alle Server-Daten
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // staleTime: Wie lange gelten Daten als "frisch"?
      // 5 Minuten = React Query holt nicht nochmal vom Server,
      // wenn die Daten kürzer als 5 Minuten alt sind
      staleTime: 1000 * 60 * 5,

      // retry: Bei einem fehlgeschlagenen Request – wie oft nochmal versuchen?
      // 1 = einmal wiederholen, dann aufgeben
      retry: 1,

      // refetchOnWindowFocus: false = Nicht neu laden wenn User
      // von einem anderen Browser-Tab zurückkommt
      // (Standard ist true, was oft nervig ist während der Entwicklung)
      refetchOnWindowFocus: false,
    },
  },
});

// ReactNode ist der TypeScript-Typ für "alles was React rendern kann"
// (JSX, Strings, Arrays, null, etc.)
interface QueryProviderProps {
  children: ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
  return (
    // QueryClientProvider macht den queryClient für alle Kind-Komponenten verfügbar
    <QueryClientProvider client={queryClient}>
      {children}

      {/* ReactQueryDevtools: Zeigt im Browser ein Debug-Panel
          – nur in Development sichtbar, in Production automatisch ausgeblendet
          initialIsOpen={false}: Das Panel ist beim Start zugeklappt */}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
```

### Was bringt mir das Debug-Panel konkret?

Öffne es mal während der Entwicklung (kleines React Query Icon unten links im Browser). Du siehst:

- Welche Queries gerade aktiv sind
- Ob Daten frisch oder "stale" sind
- Den gecachten Inhalt jeder Query
- Ob ein Request gerade läuft oder fehlgeschlagen ist

Das ist das Äquivalent zu Flutter's BLoC DevTools.

---

## 4.3 Router – Navigation zwischen Seiten

### Was ist React Router und wie unterscheidet er sich von AutoRoute?

In Flutter hattest du `AutoRoute` mit Code-Generierung:

```dart
@AutoRouterConfig()
class AppRouter extends RootStackRouter {
  @override
  List<AutoRoute> get routes => [
    AutoRoute(page: LoginRoute.page, path: '/login'),
    AutoRoute(page: CoursesRoute.page, path: '/courses'),
  ];
}
```

In React nutzen wir `React Router v6`. Kein Code-Generator – du definierst Routen direkt als JavaScript-Objekte:

```typescript
const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  { path: '/courses', element: <CoursesPage /> },
]);
```

### Was ist "Lazy Loading" bei Routen?

Lazy Loading bedeutet: Eine Seite wird erst dann heruntergeladen, wenn der User sie wirklich besucht.

```typescript
// OHNE lazy loading: CoursesPage wird IMMER beim App-Start geladen
import CoursesPage from '@/features/courses/components/CoursesPage';

// MIT lazy loading: CoursesPage wird erst geladen wenn User zu /courses navigiert
const CoursesPage = lazy(() => import('@/features/courses/components/CoursesPage'));
```

**Warum ist das wichtig?** Bei 15+ Features würde die App ohne Lazy Loading beim Start alles auf einmal laden → lange Ladezeit. Mit Lazy Loading lädt jedes Feature nur wenn es gebraucht wird.

### Was ist `<Suspense>`?

`<Suspense>` ist eine React-Komponente, die einen Fallback zeigt, solange etwas lädt. Es ist der Platzhalter während das Lazy-Loaded Modul heruntergeladen wird:

```typescript
<Suspense fallback={<div>Laden...</div>}>
  <CoursesPage />   ← wird erst geladen wenn gebraucht
</Suspense>
```

Ohne `<Suspense>` um eine Lazy-Loaded Komponente wirft React einen Fehler.

### Was ist `<Outlet />`?

Das ist das Herzstück von verschachteltem Routing. In Flutter hattest du ein `Scaffold`, das immer sichtbar bleibt, und nur der Content-Bereich wechselt. In React macht `<Outlet />` genau das:

```
AppLayout (immer sichtbar: Sidebar + Header)
    └── <Outlet />  ← hier erscheint die aktuelle Seite
            ↕ wechselt je nach URL
        /courses → CoursesPage
        /profile → ProfilePage
        /quiz    → QuizPage
```

### Erstelle `src/router/routes.tsx`

```typescript
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { AppLayout } from '@/layouts/AppLayout';
import { ProtectedRoute } from './ProtectedRoute';

// ─── LAZY-LOADED PAGES ──────────────────────────────────────────────────────
// Diese Seiten werden erst geladen wenn der User zu ihnen navigiert
const LoginPage = lazy(() => import('@/features/auth/components/LoginPage'));
const CoursesPage = lazy(() => import('@/features/courses/components/CoursesPage'));

// Hilfsfunktion: Wrapper der Suspense um jede lazy-loaded Seite legt
// (erspart uns, Suspense bei jeder Route einzeln zu schreiben)
function Page({ component: Component }: { component: React.ComponentType }) {
  return (
    <Suspense fallback={<div style={{ padding: 24 }}>Seite wird geladen...</div>}>
      <Component />
    </Suspense>
  );
}

// ─── ROUTER DEFINITION ──────────────────────────────────────────────────────
export const router = createBrowserRouter([

  // Öffentliche Route: Login-Seite (kein Login nötig)
  {
    path: '/login',
    element: <Page component={LoginPage} />,
  },

  // Geschützte Routen: Alles hinter ProtectedRoute
  // ProtectedRoute prüft ob der User eingeloggt ist.
  // Wenn nicht → Redirect zu /login
  // AppLayout enthält Sidebar + Header + <Outlet />
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <AppLayout />   {/* Sidebar + Header bleiben immer sichtbar */}
      </ProtectedRoute>
    ),
    children: [
      // index: true = Default-Route wenn User auf "/" navigiert
      // Leitet sofort weiter zu /courses
      {
        index: true,
        element: <Navigate to="/courses" replace />,
      },

      // Kurse-Seite – erscheint im <Outlet /> von AppLayout
      {
        path: 'courses',
        element: <Page component={CoursesPage} />,
      },

      // Hier kommen später weitere Routen hinzu:
      // { path: 'profile', element: <Page component={ProfilePage} /> },
      // { path: 'quiz/:quizId', element: <Page component={QuizPage} /> },
    ],
  },
]);
```

### Erstelle `src/router/ProtectedRoute.tsx`

```typescript
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

// ProtectedRoute ist eine "Guard-Komponente" – sie prüft ob der User
// eingeloggt ist bevor sie den Inhalt anzeigt.
//
// Flutter-Analogie: AutoRoute Guard
// @override
// Future<RouteData?> redirect(BuildContext context, RouteData data) async {
//   if (!isAuthenticated) return LoginRoute();
//   return null;
// }
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();

  // Noch beim Laden (z.B. Token aus Storage prüfen) → Warte-Bildschirm
  if (isLoading) {
    return <div>Authentifizierung wird geprüft...</div>;
  }

  // Nicht eingeloggt → sofort zur Login-Seite umleiten
  // "replace" bedeutet: Der /login-Eintrag ersetzt die aktuelle URL im Browser-Verlauf
  // (so kann der User nicht den Browser-Zurück-Button nutzen um wieder reinzukommen)
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Eingeloggt → Inhalt anzeigen
  return <>{children}</>;
}
```

---

## 4.4 Layout (App Shell)

### Was ist die "App Shell"?

Die App Shell ist das Grundgerüst, das auf jeder Seite sichtbar bleibt:

```
┌─────────────────────────────────────────────────────────┐
│  HEADER (64px hoch)                              [User]  │
├──────────────────┬──────────────────────────────────────┤
│                  │                                       │
│  SIDEBAR         │  CONTENT (hier wechselt der Inhalt)  │
│  (260px breit)   │                                       │
│                  │  ← Das ist der <Outlet />             │
│  - Kurse         │                                       │
│  - Profil        │                                       │
│  - Notizen       │                                       │
│                  │                                       │
└──────────────────┴──────────────────────────────────────┘
```

**Flutter-Analogie:** Das ist genau wie `Scaffold` mit einem `Drawer` und einem `AppBar`, wo nur `body` bei Navigation wechselt.

### Erstelle `src/layouts/AppLayout.tsx`

```typescript
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

// AppLayout ist das Shell-Widget – es bleibt immer sichtbar
// <Outlet /> ist der Platzhalter wo die aktuelle Seite erscheint
export function AppLayout() {
  return (
    // Äußerer Container: Alles nebeneinander (Flexbox)
    <div style={{ display: 'flex', minHeight: '100vh' }}>

      {/* Sidebar links */}
      <Sidebar />

      {/* Rechter Bereich: Header oben, Content darunter */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Header />

        {/* main ist das HTML-Element für den Hauptinhalt */}
        {/* <Outlet /> rendert hier die aktuelle Route-Komponente */}
        <main style={{ flex: 1, padding: '24px' }}>
          <Outlet />
        </main>
      </div>

    </div>
  );
}
```

### Erstelle `src/layouts/Sidebar.tsx`

```typescript
import { NavLink } from 'react-router-dom';

// NavLink ist wie ein normaler Link, hat aber automatisch
// eine "active" CSS-Klasse wenn die URL dem Link entspricht
// → Gut um den aktiven Menüpunkt hervorzuheben
export function Sidebar() {
  return (
    <aside
      style={{
        width: '260px',
        backgroundColor: '#f8f9fa',
        borderRight: '1px solid #e0e0e0',
        padding: '16px',
        // position: fixed würde sie beim Scrollen fixieren – später ergänzen
      }}
    >
      <h2 style={{ marginBottom: '24px', fontSize: '18px' }}>Lernwelt</h2>

      <nav>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>

          {/* NavLink: Zeigt "/courses" an, navigiert zu /courses */}
          {/* style callback: Wenn active (= aktuelle Route), andere Farbe */}
          <li style={{ marginBottom: '8px' }}>
            <NavLink
              to="/courses"
              style={({ isActive }) => ({
                color: isActive ? '#063844' : '#555',
                fontWeight: isActive ? 'bold' : 'normal',
                textDecoration: 'none',
                display: 'block',
                padding: '8px 12px',
                borderRadius: '6px',
                backgroundColor: isActive ? '#e8f0f2' : 'transparent',
              })}
            >
              Kurse
            </NavLink>
          </li>

          {/* Weitere Nav-Items kommen hier dazu, Feature für Feature */}
        </ul>
      </nav>
    </aside>
  );
}
```

### Erstelle `src/layouts/Header.tsx`

```typescript
export function Header() {
  return (
    <header
      style={{
        height: '64px',
        borderBottom: '1px solid #e0e0e0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        backgroundColor: '#fff',
      }}
    >
      <span style={{ fontSize: '16px', fontWeight: '500' }}>
        Dashboard
      </span>

      {/* Später: User-Avatar, Logout-Button, Benachrichtigungen */}
      <div>
        {/* Platzhalter */}
      </div>
    </header>
  );
}
```

> **Hinweis zu den Inline-Styles:** Die `style={{ ... }}` im Code ist bewusst für diese Phase. Es ist schnell, braucht keine weitere Konfiguration und zeigt klar, was passiert. Sobald das Styling-System entschieden ist (Tailwind CSS, CSS Modules, etc.), wird das ersetzen. Mach dir also keine Sorgen um das Styling-Thema jetzt.

---

## 4.5 Auth: Login-State verwalten

### Was muss Auth leisten?

Auth in der Lernwelt muss wissen:

1. Ist der User eingeloggt? (`isAuthenticated`)
2. Lädt der Login-Status gerade? (`isLoading`)
3. Wer ist der User? (`user`)
4. Wie logge ich den User ein? (`login`)
5. Wie logge ich ihn aus? (`logout`)

Das ist globaler State – er muss überall in der App verfügbar sein (in `ProtectedRoute`, in `Header`, in allen Features). Dafür nutzen wir **Zustand**.

### Kurze Erklärung: Warum Zustand und nicht React Context?

Du kennst das Problem aus Flutter: Wenn du `Provider` oder `BlocProvider` ganz oben in den Widget-Tree hängst und sich der State ändert, re-rendert der ganze Tree darunter neu.

**React Context hat das gleiche Problem.** Wenn der Auth-Context sich ändert, re-rendert alles, das `useContext(AuthContext)` aufruft.

**Zustand** ist da anders: Es löst genau das. Du abonnierst nur die Felder, die du brauchst, und die Komponente re-rendert nur wenn sich diese Felder ändern.

### Erstelle `src/features/auth/hooks/useAuth.ts`

```typescript
import { create } from 'zustand';

// Interface: Welche Daten und Funktionen hat der Auth-State?
interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: { id: string; name: string; email: string } | null;
  login: (token: string) => void;
  logout: () => void;
}

// create() erstellt einen Zustand-Store.
// Das set() innerhalb von create() aktualisiert den State.
// (Ähnlich wie emit() in einem Flutter Cubit)
export const useAuth = create<AuthState>((set) => ({
  // Startzustand: Prüfe ob schon ein Token gespeichert ist
  // !! konvertiert einen String in boolean ('' → false, 'token123' → true)
  isAuthenticated: !!localStorage.getItem('access_token'),

  // isLoading ist false weil wir erstmal nur localStorage prüfen (synchron)
  // Wenn der echte Auth-Service kommt, wird hier true bis der Token validiert ist
  isLoading: false,

  // user ist null bis wir echte User-Daten vom Server haben
  user: null,

  // login: Token speichern + State als eingeloggt markieren
  login: (token: string) => {
    localStorage.setItem('access_token', token);
    // set() aktualisiert nur die angegebenen Felder, der Rest bleibt
    set({ isAuthenticated: true });
  },

  // logout: Token löschen, State zurücksetzen, zur Login-Seite
  logout: () => {
    localStorage.removeItem('access_token');
    set({ isAuthenticated: false, user: null });
    // Kompletter Seitenreload auf /login (löscht auch den React Query Cache)
    window.location.href = '/login';
  },
}));
```

### Erstelle `src/features/auth/components/LoginPage.tsx`

Das ist fürs Erste ein Demo-Login ohne echten API-Call. Der echte OAuth-Flow kommt, wenn der Auth-Microservice steht.

```typescript
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

// "default export" weil React Router lazy() das so erwartet
export default function LoginPage() {
  // useAuth gibt uns die login-Funktion aus unserem Zustand-Store
  const { login } = useAuth();

  // useNavigate: Hook um programmtisch zu navigieren
  // Flutter-Äquivalent: context.router.replace(CoursesRoute())
  const navigate = useNavigate();

  const handleLogin = () => {
    // PLATZHALTER: Später kommt hier der echte OAuth-Flow
    // (Redirect zum OAuth-Server, Callback, Token-Exchange, etc.)
    login('demo-token-123');
    navigate('/courses');
  };

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        backgroundColor: '#f8f9fa',
      }}
    >
      <div
        style={{
          backgroundColor: '#fff',
          padding: '40px',
          borderRadius: '12px',
          boxShadow: '0 2px 16px rgba(0,0,0,0.1)',
          textAlign: 'center',
        }}
      >
        <h1 style={{ marginBottom: '8px' }}>Lernwelt</h1>
        <p style={{ color: '#666', marginBottom: '32px' }}>
          Deine Lernplattform
        </p>
        <button
          onClick={handleLogin}
          style={{
            backgroundColor: '#063844',
            color: '#fff',
            border: 'none',
            padding: '12px 32px',
            borderRadius: '8px',
            fontSize: '16px',
            cursor: 'pointer',
          }}
        >
          Demo-Login (Platzhalter)
        </button>
        <p style={{ marginTop: '16px', fontSize: '12px', color: '#999' }}>
          Echter OAuth-Login folgt wenn Auth-Service steht
        </p>
      </div>
    </div>
  );
}
```

### Auth Feature exportieren (Barrel Export)

```typescript
// src/features/auth/index.ts
// Hier exportieren wir was andere Teile der App aus dem auth-Feature brauchen
export { useAuth } from './hooks/useAuth';
```

---

## 4.6 Feature Flags

### Was sind Feature Flags und warum hier?

Feature Flags sind Schalter, die bestimmen welche Features sichtbar sind. Im Flutter-Frontend hattet ihr sie bereits – sie kommen vom Backend (Config Service) und steuern z.B.:

- Ist der Livestream für diese Brand aktiviert? (`liveStream: true/false`)
- Hat diese Gruppe Zugang zu Stellenangeboten? (`jobOffers: true/false`)
- Gibt es in der App eine FAQ-Seite? (`faq: true/false`)

Das ist kein Feature – es ist Infrastruktur. Deshalb gehört es in die Foundation.

### Erstelle `src/shared/hooks/useFeatureFlag.ts`

```typescript
import { useQuery } from '@tanstack/react-query';
import type { FeatureFlag } from '@/shared/types/common';

// Platzhalter-Funktion – später ersetzt durch echten API-Call:
// const response = await apiClient.get('/config');
async function fetchConfig() {
  return {
    featureFlags: {
      // Erstmal alles auf false – aktiviere Features wenn du sie baust
      liveStream: false,
      mediaLibrary: false,
      jobOffers: false,
      recruitment: false,
      certificates: true,
      participationCertificates: true,
      presencesAndAbsences: false,
      faq: true,
      interactiveExercises: false,
      yourProfile: true,
      dataSecurity: true,
      campus: false,
      learningCompanionChat: false,
    } as Record<FeatureFlag, boolean>,
  };
}

// Dieser Hook gibt zurück ob ein Feature aktiv ist
// Beispiel: useFeatureFlag('liveStream') → false
export function useFeatureFlag(flag: FeatureFlag): boolean {
  const { data } = useQuery({
    queryKey: ['config'],
    queryFn: fetchConfig,
    staleTime: Infinity, // Config einmal laden und nie wieder neu holen
  });
  // ?? false = wenn data noch nicht geladen → false zurückgeben (Feature aus)
  return data?.featureFlags?.[flag] ?? false;
}
```

### Wie wird das später verwendet?

```typescript
// In der Sidebar: Nur anzeigen wenn Feature aktiv
function Sidebar() {
  const showLivestream = useFeatureFlag('liveStream');
  const showJobOffers = useFeatureFlag('jobOffers');

  return (
    <nav>
      <NavLink to="/courses">Kurse</NavLink>
      {showLivestream && <NavLink to="/livestream">Livestream</NavLink>}
      {showJobOffers && <NavLink to="/job-offers">Stellenangebote</NavLink>}
    </nav>
  );
}
```

---

## 4.7 Alles zusammenstecken in App.tsx

Das ist der Moment, wo alle Teile verbunden werden. Stell dir App.tsx wie `main_base.dart` in Flutter vor – der Ort wo Providers und Routing zusammenkommen.

### Aktualisiere `src/App.tsx`

```typescript
import { RouterProvider } from 'react-router-dom';
import { QueryProvider } from '@/providers/QueryProvider';
import { router } from '@/router/routes';

// Die Reihenfolge der Provider ist wichtig!
// QueryProvider muss AUSSEN sein, weil der Router innen React Query braucht
//
// Flutter-Analogie:
// MultiProvider(
//   providers: [
//     RepositoryProvider(create: (_) => QueryClient()),  ← aussen
//   ],
//   child: MaterialApp.router(routerConfig: router),      ← innen
// )
export default function App() {
  return (
    <QueryProvider>           {/* ← React Query für die gesamte App */}
      <RouterProvider router={router} />  {/* ← Router mit allen Seiten */}
    </QueryProvider>
  );
}
```

### `src/main.tsx` – Einstiegspunkt der App

```typescript
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';

// document.getElementById('root') findet das <div id="root"> in index.html
// Das ist der einzige echte DOM-Knoten – alles andere rendert React
createRoot(document.getElementById('root')!).render(
  // StrictMode: Aktiviert zusätzliche Warnungen während der Entwicklung
  // Ähnlich wie Flutter's debugMode – hilft Fehler früh zu finden
  // Hat keinen Einfluss auf den Production-Build
  <StrictMode>
    <App />
  </StrictMode>,
);
```

---

## 4.8 Erster Smoke Test

Jetzt prüfen wir, ob die Foundation funktioniert. Das nennt man Smoke Test – "brennt es wenn wir es einschalten?"

```bash
npm run dev
```

### Was du Schritt für Schritt testen solltest

**Test 1: Login-Seite erscheint**

Öffne `http://localhost:5173/login` → Du siehst die Login-Seite mit dem Demo-Button.

**Test 2: Demo-Login funktioniert**

Klick auf "Demo-Login (Platzhalter)" → Du wirst zu `/courses` weitergeleitet. Sidebar und Header sind sichtbar.

**Test 3: Geschützte Route ohne Login**

Öffne eine neue Inkognito-Tab. Gehe direkt zu `http://localhost:5173/courses` (ohne eingeloggt zu sein) → Du wirst automatisch zu `/login` weitergeleitet.

Wenn dieser Test fehlschlägt: Prüf ob `useAuth` den localStorage korrekt liest.

**Test 4: React Query DevTools**

Wenn du eingeloggt bist, siehst du unten links im Browser ein kleines Icon (sieht aus wie ein Blümchen 🌸). Klick es an → Das DevTools-Panel öffnet sich.

**Test 5: TypeScript-Fehler prüfen**

```bash
npm run type-check
```

→ Sollte 0 Fehler melden.

### Häufige Fehler in diesem Schritt

| Fehlermeldung                              | Ursache                           | Lösung                                                                   |
| ------------------------------------------ | --------------------------------- | ------------------------------------------------------------------------ |
| `Cannot find module '@/features/auth/...'` | Path Alias nicht konfiguriert     | Schritt 2 (tsconfig + vite.config) nochmal prüfen                        |
| `useAuth is not a function`                | Import-Fehler                     | Prüfe ob `export const useAuth = create(...)` und nicht `export default` |
| Weiße Seite ohne Fehlermeldung             | JavaScript-Fehler in der Konsole  | Browser-Konsole öffnen (F12) und Fehler lesen                            |
| `/courses` zeigt nicht die Sidebar         | AppLayout fehlt oder Outlet fehlt | AppLayout prüfen, `<Outlet />` muss drin sein                            |

---

## Zusammenfassung: Was du jetzt gebaut hast

```
main.tsx
└── App.tsx
    └── QueryProvider         ← React Query für die gesamte App
        └── RouterProvider    ← Navigation + URL-Handling
            ├── /login        ← Öffentlich: LoginPage
            └── /             ← ProtectedRoute (prüft isAuthenticated)
                └── AppLayout (Sidebar + Header bleiben immer sichtbar)
                    └── <Outlet /> ← Wechselnder Content
                        └── /courses → CoursesPage (noch leer)
```

**Was jede Datei tut:**

| Datei                                    | Aufgabe                                      | Flutter-Analogie                   |
| ---------------------------------------- | -------------------------------------------- | ---------------------------------- |
| `shared/api/client.ts`                   | HTTP-Client mit Auth-Token                   | Dio-Instanz mit Interceptor        |
| `providers/QueryProvider.tsx`            | React Query für die App bereitstellen        | RepositoryProvider für QueryClient |
| `router/routes.tsx`                      | Alle Seiten und ihre URLs                    | AppRouter mit AutoRoute            |
| `router/ProtectedRoute.tsx`              | Seiten vor nicht-eingeloggten Usern schützen | AutoRoute Guard                    |
| `layouts/AppLayout.tsx`                  | Shell mit Sidebar + Header + Content         | Scaffold mit Drawer                |
| `layouts/Sidebar.tsx`                    | Navigation                                   | NavigationDrawer                   |
| `layouts/Header.tsx`                     | Obere Leiste                                 | AppBar                             |
| `features/auth/hooks/useAuth.ts`         | Auth-State global verwalten                  | AuthCubit                          |
| `features/auth/components/LoginPage.tsx` | Login-Seite (Platzhalter)                    | LoginPage                          |
| `shared/hooks/useFeatureFlag.ts`         | Feature ein-/ausschalten                     | Config + Feature-Flags             |

## Checkliste: Schritt 4

- [ ] `npm install axios @tanstack/react-query @tanstack/react-query-devtools react-router-dom zustand` (falls noch nicht aus Schritt 2 gemacht)
- [ ] `src/shared/api/client.ts` erstellt
- [ ] `src/providers/QueryProvider.tsx` erstellt
- [ ] `src/router/routes.tsx` erstellt
- [ ] `src/router/ProtectedRoute.tsx` erstellt
- [ ] `src/layouts/AppLayout.tsx` erstellt (mit `<Outlet />`)
- [ ] `src/layouts/Sidebar.tsx` erstellt
- [ ] `src/layouts/Header.tsx` erstellt
- [ ] `src/features/auth/hooks/useAuth.ts` erstellt
- [ ] `src/features/auth/components/LoginPage.tsx` erstellt
- [ ] `src/features/auth/index.ts` erstellt
- [ ] `src/shared/hooks/useFeatureFlag.ts` erstellt
- [ ] `src/App.tsx` aktualisiert (QueryProvider + RouterProvider)
- [ ] **Test 1:** `/login` zeigt Login-Seite ✓
- [ ] **Test 2:** Demo-Login → Redirect zu `/courses` → Sidebar sichtbar ✓
- [ ] **Test 3:** Direkt `/courses` ohne Login → Redirect zu `/login` ✓
- [ ] **Test 4:** React Query DevTools Icon sichtbar ✓
- [ ] **Test 5:** `npm run type-check` → 0 Fehler ✓

**Wenn alle Tests grün sind → weiter zu [Schritt 5: Erster Durchstich](./05-erster-durchstich.md)**
