# Login-Methoden – Passwort, Google, Magic Link & MFA

---

## Übersicht der drei vorgeschlagenen Login-Methoden

Der Designer schlägt vor:
1. **E-Mail + Passwort** – klassisch
2. **Google Sign-In** – OAuth2 / OIDC
3. **Magic Link** – passwortloser Login via E-Mail

Alle drei Methoden können gleichzeitig angeboten werden. Sie sind keine
Alternativen zueinander, sondern **parallele Wege** zum selben Account.

---

## 1. E-Mail + Passwort

### Wie es funktioniert

```
Nutzer gibt E-Mail + Passwort ein
    │
    ▼
Backend prüft: E-Mail bekannt? Passwort korrekt? (bcrypt/argon2 Vergleich)
    │
    ├── falsch → Fehlermeldung (generisch! Kein "E-Mail unbekannt" oder "Passwort falsch"
    │            getrennt angeben – das ist eine Sicherheitslücke / User Enumeration)
    │
    └── korrekt → Access Token + Refresh Token ausstellen
```

### Brute-Force-Schutz

Das Backend muss (egal was das Frontend macht):
- **Rate Limiting** pro IP und pro E-Mail (z.B. max. 5 Versuche / 15 Min.)
- Nach N Fehlversuchen: temporäres Account-Lock oder CAPTCHA
- **Account-Lockout** nach z.B. 10 Fehlversuchen (mit automatischer Entsperrung oder Admin-Reset)

### Frontend-Perspektive

- Einfaches Formular: E-Mail + Passwort
- "Angemeldet bleiben" Checkbox → längere Refresh-Token-Lebensdauer (Backend-seitig)
- Link "Passwort vergessen" → Reset-Flow (→ `03-passwort-und-reset.md`)
- Generische Fehlermeldung: "E-Mail oder Passwort ist falsch" (nie getrennte Fehler!)

---

## 2. Google Sign-In (OAuth2 / OIDC)

### Wie OAuth2 / OIDC funktioniert

```
Nutzer klickt "Mit Google anmelden"
    │
    ▼
Frontend: Redirect zu Google Authorization Endpoint
(https://accounts.google.com/o/oauth2/v2/auth?client_id=...&redirect_uri=...&scope=openid email profile)
    │
    ▼
Nutzer authentifiziert sich bei Google (einmalig, danach Cookie)
    │
    ▼
Google redirect zurück zu unserer App:
https://app.lernwelt.de/auth/callback?code=AUTHORIZATION_CODE
    │
    ▼
Frontend sendet `code` an eigenes Backend
    │
    ▼
Backend tauscht `code` gegen Google Access Token + ID Token
Backend verifiziert ID Token (JWT, signiert von Google)
Backend extrahiert: E-Mail, Google ID, Name, Profilbild
    │
    ├── Nutzer existiert → einloggen, eigene Tokens ausstellen
    └── Nutzer neu → Account anlegen (oder: nur wenn Invite vorhanden)
```

### Wichtige Entscheidung: Offene Registrierung oder nur mit Invite?

- **Mit Invite**: Google Login funktioniert nur, wenn die Google-E-Mail bereits
  eingeladen wurde. Neue, unbekannte E-Mails werden abgelehnt.
  → Passt zum Geschäftsmodell: Lernplattform für eingeladene Teilnehmer.

- **Offen**: Jeder kann sich mit Google registrieren.
  → Passt eher zu B2C-Apps. Wahrscheinlich nicht gewollt.

> **Empfehlung**: Nur mit Invite. Google Login = alternative Methode für
> bereits eingeladene Nutzer, kein eigenständiger Registrierungskanal.

### Account-Verknüpfung

Was, wenn ein Nutzer erst mit Passwort registriert ist und sich später mit
Google einloggen möchte?

**Option A – Automatische Verknüpfung** (via E-Mail-Match):
Wenn die Google-E-Mail mit einem existierenden Account übereinstimmt → verknüpfen.
Risiko: Wenn jemand die E-Mail von jemand anderem bei Google "besitzt" (sehr selten,
aber theoretisch möglich bei kompromittierten Accounts).

**Option B – Explizite Verknüpfung** (in den Profileinstellungen):
Nutzer loggt sich mit Passwort ein, geht in Einstellungen und verknüpft Google dort.
→ Sicherer, aber mehr Aufwand für den Nutzer.

**Option C – Keine Verknüpfung**, getrennte Accounts:
Einfachste Implementierung, aber schlechteste UX.

> **Empfehlung für erste Version**: Option A (automatische Verknüpfung via E-Mail)
> mit dem Hinweis, dass der Nutzer informiert wird ("Wir haben deinen Google-Account
> mit deinem bestehenden Konto verknüpft").

### Konfiguration im Backend

Das Backend benötigt:
- Google OAuth2 Credentials (Client ID + Client Secret) aus der Google Cloud Console
- Eigener Callback-Endpunkt: `/api/v1/auth/google/callback`
- State-Parameter im OAuth2-Flow (CSRF-Schutz!)
- PKCE falls der Flow von einer SPA initiiert wird (empfohlen für React-Apps)

---

## 3. Magic Link (Passwortloser Login via E-Mail)

### Wie es funktioniert

```
Nutzer gibt nur E-Mail ein
    │
    ▼
Backend: Existiert die E-Mail? → Ja
Backend: Generiert einmaligen Token (z.B. 32 Byte, 15 Min. gültig)
Backend: Sendet E-Mail mit Link:
         https://app.lernwelt.de/auth/magic?token=XYZ
    │
    ▼
Nutzer öffnet E-Mail, klickt Link
    │
    ▼
Frontend: Token aus URL lesen, API-Call
    │
    ▼
Backend: Token validieren (existiert, nicht abgelaufen, nicht genutzt)
Backend: Token invalidieren (single-use!)
Backend: Access Token + Refresh Token ausstellen
    │
    ▼
Nutzer ist eingeloggt
```

### Sicherheitsaspekte

| Aspekt | Maßnahme |
|---|---|
| Token-Entropie | Min. 128 Bit (32 Byte random, base64url) |
| Ablaufzeit | Kurz! 10–15 Minuten (E-Mail kann in unsicherem Postfach landen) |
| Single-use | Token nach Nutzung sofort invalidieren |
| Rate Limiting | Max. 3 Magic-Link-Anfragen pro E-Mail pro Stunde |
| Keine User Enumeration | "Wenn die E-Mail existiert, haben wir einen Link geschickt" – auch bei unbekannten E-Mails dieselbe Antwort |

### UX-Überlegungen

- Der Nutzer muss sein Postfach öffnen → Medienbruch
- Ideal für Nutzer, die ihr Passwort nicht kennen/möchten
- Besonders praktisch auf mobilen Geräten (E-Mail-App → Link tippen → automatisch eingeloggt)
- **Problem**: Wenn der Magic Link in einem E-Mail-Vorschau-Fenster vorgeladen wird
  (E-Mail-Clients, die Links prefetchen), könnte der Token versehentlich eingelöst werden.
  → Lösung: Beim Klick auf den Link zunächst nur eine Bestätigungsseite zeigen
  ("Klicke hier, um dich einzuloggen") – nicht sofort einloggen.

---

## 4. MFA (Multi-Faktor-Authentifizierung)

### Muss MFA angeboten werden?

Der Designer schätzt MFA als "nicht notwendig" ein, fragt aber wegen
Regularien bei Bewerbungsdaten.

**Kurze Einschätzung:**

| Szenario | MFA sinnvoll? |
|---|---|
| Reguläre Lernplattform (Videos, Quizze) | Optional, nicht notwendig |
| Bewerbungsunterlagen (Lebenslauf, etc.) | Empfehlenswert |
| Gesundheitsdaten, Finanzdaten | Pflicht |
| Enterprise-Kunden mit eigenen Sicherheitsrichtlinien | Kundenseitige Anforderung |

**Regulatorisch**: Keine gesetzliche MFA-Pflicht für Bewerbungsdaten in Deutschland/EU.
Aber: DSGVO Art. 32 fordert "angemessene Sicherheitsmaßnahmen" – MFA ist explizit
im BSI-Grundschutz und bei ISO 27001 als Best Practice gelistet.

### MFA-Methoden (nach Sicherheit geordnet)

| Methode | Sicherheit | UX | Aufwand |
|---|---|---|---|
| **TOTP** (Google Authenticator, Authy) | Hoch | Mittel | Mittel |
| **SMS-OTP** | Mittel (SIM-Swap-Angriffe möglich) | Gut | Niedrig |
| **E-Mail-OTP** | Niedrig-Mittel (E-Mail könnte kompromittiert sein) | Gut | Niedrig |
| **WebAuthn / Passkeys** | Sehr hoch | Sehr gut | Hoch |
| **Backup Codes** | Als Fallback-Methode | Mittel | Niedrig |

> **Empfehlung**: TOTP als primäre MFA-Methode (kein SMS, da teuer und unsicher).
> Optional und nicht erzwungen für die erste Version. Später per Tenant oder
> per Feature-Flag erzwingbar.

### MFA-Flow aus Frontend-Sicht

```
Login (E-Mail + Passwort) erfolgreich
    │
    ▼
Backend: MFA aktiviert für diesen User?
    ├── Nein → Direkt einloggen (Tokens ausstellen)
    └── Ja →
           Frontend: MFA-Code-Eingabe anzeigen
                │
                ▼
           Nutzer gibt 6-stelligen TOTP-Code ein
                │
                ▼
           Backend: Code prüfen
                ├── falsch → Fehlermeldung (max. N Versuche!)
                └── korrekt → Tokens ausstellen, einloggen
```

---

## Kombinationsmatrix: Welche Methoden mit welchen Szenarien

| Szenario | Passwort | Google | Magic Link |
|---|---|---|---|
| Erstmalige Registrierung (mit Invite) | ✅ | ✅ | ❌ (Registrierung braucht explizite Bestätigung) |
| Täglicher Login | ✅ | ✅ | ✅ |
| Nutzer hat Passwort vergessen | ❌ | ✅ (falls verknüpft) | ✅ (als Fallback) |
| Passwortloser Nutzer | ❌ | ✅ | ✅ |

---

## Offene Fragen

| Frage | Auswirkung |
|---|---|
| Neben Google: Microsoft Login für Enterprise-Kunden (Azure AD / SSO)? | Mehr OAuth2-Konfiguration |
| MFA: Optional oder für bestimmte Tenants erzwingbar? | Feature-Flag-Logik, Admin-UI |
| Magic Link: Sollen bereits registrierte Nutzer das immer nutzen können? | Backend-Endpunkt |
| "Angemeldet bleiben" – wie lange? | Refresh-Token-Lebensdauer |
| Was passiert nach 3 fehlgeschlagenen MFA-Versuchen? | Account-Lockout oder Backup-Code-Option |
