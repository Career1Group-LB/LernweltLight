# Auth – Frontend-Implementierung

Dieses Dokument beschreibt, was das React-Frontend für Auth konkret braucht –
unabhängig davon, welcher IdP oder welches Backend-Konzept gewählt wird.

---

## Token-Strategie: Access Token + Refresh Token

### Warum zwei Tokens?

```
Access Token:
- Kurzlebig (z.B. 15 Minuten)
- Wird bei jedem API-Request mitgeschickt (Authorization Header)
- Wenn gestohlen: Schaden begrenzt (15 Min. Fenster)

Refresh Token:
- Langlebig (z.B. 7–30 Tage)
- Wird nur zum Erneuern des Access Tokens genutzt
- Wenn gestohlen: Ernsteres Problem → daher sicher speichern
```

### Wo werden Tokens gespeichert?

Das ist eine der wichtigsten und meistdiskutierten Sicherheitsfragen im Frontend.

| Speicherort | XSS-Risiko | CSRF-Risiko | Empfehlung |
|---|---|---|---|
| `localStorage` | ❌ Hoch (JS-Zugriff) | ✅ Kein CSRF | Nicht empfohlen |
| `sessionStorage` | ❌ Hoch (JS-Zugriff) | ✅ Kein CSRF | Nicht empfohlen |
| Memory (React State/Zustand) | ✅ Kein Zugriff von außen | ✅ Kein CSRF | ✅ Gut für Access Token |
| `HttpOnly Cookie` | ✅ Kein JS-Zugriff | ⚠️ CSRF-Schutz nötig | ✅ Gut für Refresh Token |

**Empfohlene Strategie:**

```
Access Token  → In-Memory (Zustand Store, kein localStorage!)
Refresh Token → HttpOnly, Secure, SameSite=Strict Cookie
```

Der Refresh Token im HttpOnly Cookie ist von JavaScript nicht lesbar.
Beim Seitenneuladen ist der Access Token weg → der Browser sendet automatisch
den Cookie mit → Backend stellt neuen Access Token aus → nahtlose UX.

---

## Auth-Zustand (Zustand Store)

```typescript
// shared/stores/auth.store.ts

interface AuthState {
  accessToken: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;

  setAccessToken: (token: string) => void;
  setUser: (user: AuthUser) => void;
  logout: () => void;
}

interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  roles: string[];
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  user: null,
  isAuthenticated: false,

  setAccessToken: (token) =>
    set({ accessToken: token, isAuthenticated: true }),

  setUser: (user) => set({ user }),

  logout: () =>
    set({ accessToken: null, user: null, isAuthenticated: false }),
}));
```

> Der `accessToken` lebt **nur im Arbeitsspeicher** – nie in localStorage.
> Bei Seitenneulad ist er weg → Refresh-Token-Flow startet automatisch.

---

## Axios Interceptors

### Request Interceptor: Token anhängen

```typescript
// shared/api/client.ts

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

### Response Interceptor: Token-Refresh bei 401

```typescript
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // 401 = Access Token abgelaufen, noch kein Retry-Versuch
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Refresh Token im Cookie wird automatisch mitgeschickt
        const response = await axios.post('/api/v1/auth/refresh');
        const { accessToken } = response.data;

        useAuthStore.getState().setAccessToken(accessToken);
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;

        return apiClient(originalRequest); // Original Request wiederholen
      } catch {
        // Refresh fehlgeschlagen → ausloggen
        useAuthStore.getState().logout();
        window.location.href = '/login';
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  },
);
```

> **Problem bei parallelen Requests**: Wenn mehrere Requests gleichzeitig 401
> bekommen, werden mehrere Refresh-Calls gemacht. Lösung: Refresh-Anfrage
> "deduplizieren" (eine laufende Refresh-Promise zwischenspeichern und
> alle wartenden Requests darauf warten lassen). Das ist eine fortgeschrittene
> Implementierung – für die erste Version reicht der einfache Ansatz.

---

## App-Start: "Silent Refresh" / Token-Initialisierung

Beim Seitenneulad ist der Access Token (In-Memory) weg. Die App muss beim
Start prüfen, ob der Nutzer noch eingeloggt ist:

```typescript
// providers/AuthProvider.tsx

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setAccessToken, setUser, logout } = useAuthStore();
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Refresh Token (Cookie) wird automatisch mitgeschickt
        const response = await authApi.refresh();
        setAccessToken(response.accessToken);
        setUser(response.user);
      } catch {
        // Kein gültiger Refresh Token → nicht eingeloggt, das ist ok
        logout();
      } finally {
        setIsInitializing(false);
      }
    };

    initializeAuth();
  }, []);

  // Während Initialisierung: Ladescreen (kein Flash of unauthenticated content)
  if (isInitializing) {
    return <AppLoadingScreen />;
  }

  return <>{children}</>;
}
```

Dieser `AuthProvider` muss **außen** um den Router liegen:

```typescript
// App.tsx
<AuthProvider>
  <QueryProvider>
    <RouterProvider router={router} />
  </QueryProvider>
</AuthProvider>
```

---

## Protected Routes

```typescript
// router/ProtectedRoute.tsx

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated) {
    // Location speichern: nach Login zurückleiten
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
```

```typescript
// Nach erfolgreichem Login:
const location = useLocation();
const from = (location.state as { from?: Location })?.from?.pathname ?? '/courses';
navigate(from, { replace: true });
```

---

## Route-Struktur für Auth-Seiten

```
/login                     → LoginPage
/register?token=...        → RegisterPage (Invite-Token)
/auth/callback             → OAuthCallbackPage (Google Redirect)
/auth/magic?token=...      → MagicLinkPage (Magic Link einlösen)
/auth/reset-password       → RequestResetPage (E-Mail eingeben)
/auth/reset-password/confirm?token=...  → SetNewPasswordPage
/auth/reset-password/code  → EnterCodePage (OTP eingeben)
```

Alle Auth-Seiten sind **nicht** hinter `ProtectedRoute`. Wenn ein eingeloggter
Nutzer `/login` besucht → Redirect zu `/courses`.

---

## Google OAuth2 – Frontend-Sicht

```typescript
// features/auth/api/auth.api.ts

export const authApi = {
  initiateGoogleLogin: async () => {
    // Backend gibt die Google Authorization URL zurück
    const response = await apiClient.get('/api/v1/auth/google/authorize');
    // Redirect zum Google Login
    window.location.href = response.data.authorizationUrl;
  },
};
```

```typescript
// features/auth/components/OAuthCallbackPage.tsx
// Wird aufgerufen, wenn Google zurückleitet zu /auth/callback?code=...&state=...

export function OAuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setAccessToken, setUser } = useAuthStore();

  useEffect(() => {
    const code = searchParams.get('code');
    const state = searchParams.get('state');

    if (!code) {
      navigate('/login?error=oauth_failed');
      return;
    }

    authApi.exchangeOAuthCode({ code, state })
      .then(({ accessToken, user }) => {
        setAccessToken(accessToken);
        setUser(user);
        navigate('/courses');
      })
      .catch(() => {
        navigate('/login?error=oauth_failed');
      });
  }, []);

  return <LoadingScreen message="Anmeldung läuft..." />;
}
```

---

## Magic Link – Frontend-Sicht

```typescript
// features/auth/components/MagicLinkPage.tsx
// URL: /auth/magic?token=XYZ

export function MagicLinkPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  // WICHTIG: Nicht automatisch einlösen! Erst nach Nutzer-Aktion.
  // Schutz vor E-Mail-Prefetch durch E-Mail-Clients.

  const redeemMutation = useMutation({
    mutationFn: () => authApi.redeemMagicLink(token!),
    onSuccess: ({ accessToken, user }) => {
      setAccessToken(accessToken);
      setUser(user);
      navigate('/courses');
    },
    onError: () => {
      // Fehlermeldung: Link abgelaufen oder bereits genutzt
    },
  });

  return (
    <div>
      <p>Klicke auf den Button, um dich einzuloggen.</p>
      <button onClick={() => redeemMutation.mutate()}>
        Jetzt einloggen
      </button>
    </div>
  );
}
```

---

## Logout

```typescript
// Logout: Access Token löschen + HttpOnly Cookie invalidieren

export const authApi = {
  logout: async () => {
    // Backend invalidiert den Refresh Token im Cookie
    await apiClient.post('/api/v1/auth/logout');
    // Cookie wird vom Backend gelöscht (Set-Cookie: refresh_token=; Max-Age=0)
  },
};

// Im Logout-Handler:
const handleLogout = async () => {
  await authApi.logout();
  useAuthStore.getState().logout(); // In-Memory Token löschen
  queryClient.clear();             // React Query Cache leeren!
  navigate('/login');
};
```

> Den Query Cache beim Logout **immer** leeren – sonst sieht der nächste
> Nutzer auf dem gleichen Gerät noch die Daten des vorherigen.

---

## Übersicht: Was gebaut werden muss

### Seiten / Komponenten

| Komponente | Beschreibung |
|---|---|
| `LoginPage` | E-Mail + Passwort Formular, Google-Button, Magic-Link-Option |
| `RegisterPage` | Invite-Token validieren, Passwort setzen oder Google |
| `OAuthCallbackPage` | Code von Google entgegennehmen, Token austauschen |
| `MagicLinkPage` | Magic Link einlösen (mit Nutzer-Bestätigung) |
| `RequestResetPage` | E-Mail eingeben für Passwort-Reset |
| `SetNewPasswordPage` | Neues Passwort setzen (nach Magic-Link-Reset) |
| `EnterCodePage` | OTP-Code eingeben (nach Code-Reset) |
| `MfaPage` | TOTP-Code eingeben (falls MFA aktiviert) |

### Shared

| Datei | Beschreibung |
|---|---|
| `auth.store.ts` | Zustand: accessToken, user, isAuthenticated |
| `auth.api.ts` | API-Funktionen: login, logout, refresh, google, magicLink, reset |
| `AuthProvider.tsx` | Silent Refresh beim App-Start |
| `ProtectedRoute.tsx` | Route Guard |
| `client.ts` (Interceptors) | Token anhängen + Auto-Refresh bei 401 |

---

## Offene Fragen (Frontend-spezifisch)

| Frage | Auswirkung |
|---|---|
| Welches Format hat der Access Token? (JWT oder opaque?) | Kann Frontend User-Daten aus JWT lesen oder braucht es einen `/me`-Endpunkt? |
| Wie lange lebt der Refresh Token? | "Angemeldet bleiben" UX |
| Gibt es einen `/me`-Endpunkt zum Abrufen des eigenen Profils? | Oder liegt alles im JWT? |
| Wird das Cookie als `SameSite=Strict` oder `SameSite=Lax` gesetzt? | Auswirkung auf Cross-Origin-Requests |
| Soll die App auf Subdomain laufen? (z.B. `app.lernwelt.de`) | Cookie-Domain Konfiguration |
