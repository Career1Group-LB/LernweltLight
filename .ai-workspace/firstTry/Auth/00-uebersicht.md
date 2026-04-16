# Auth – Übersicht & offene Entscheidungen

Dieses Dokument beschreibt die zentralen Entscheidungen rund um Authentifizierung
und gibt einen Überblick, welche Themen zusammenhängen. Die nachfolgenden Dateien
vertiefen die einzelnen Bereiche.

---

## Die große Frage zuerst: Eigene Auth-Implementierung oder Auth-Provider?

Das ist die Grundsatzentscheidung. Alles andere hängt daran.

### Option A – Dedizierter Auth-Service (z.B. Keycloak, Auth0, Clerk, Supabase Auth)

Ein externer oder selbst-gehosteter Identity Provider (IdP) übernimmt die gesamte
Auth-Logik: Token-Ausstellung, Social Login, Magic Links, MFA, Passwort-Hashing,
Session-Management, Invite-Flows. Das Go-Backend vertraut dem IdP und validiert
nur die ausgestellten Tokens.

**Vorteile:**
- Kein selbst gebautes Passwort-Hashing, kein Token-Management, kein MFA-Code
- Social Login (Google, etc.) funktioniert out of the box
- Magic Links, Invite-E-Mails, Passwort-Reset: alles eingebaut
- Sicherheitsupdates kommen automatisch
- Passwort-Anforderungen konfigurierbar, kein eigener Code

**Nachteile:**
- Weitere externe Abhängigkeit (bei SaaS-Lösungen: Kosten, Datenschutz)
- Keycloak (self-hosted): sehr mächtig, aber Konfigurationsaufwand hoch
- Anpassung von E-Mail-Templates, Passwort-Policy etc. erfordert IdP-Know-how

**Relevante Optionen:**

| Service | Self-hosted? | Kosten | Besonderheiten |
|---|---|---|---|
| **Keycloak** | Ja | Frei | Enterprise-Features, SAML, komplex |
| **Auth0** | Nein (SaaS) | Freemium | Sehr gut dokumentiert, teuer bei Scale |
| **Clerk** | Nein (SaaS) | Freemium | Beste DX, React-Komponenten mitgeliefert |
| **Supabase Auth** | Ja / SaaS | Freemium | Eng an Supabase DB gekoppelt |
| **Ory Kratos** | Ja | Frei | Open Source, headless, sehr flexibel |

### Option B – Eigene Auth-Implementierung im Go-Backend

Das Go-Backend implementiert selbst: JWT-Ausstellung, Refresh-Tokens,
Passwort-Hashing (bcrypt/argon2), Social Login via OAuth2-Bibliothek, Magic Links,
Invite-Token-Generierung, MFA (TOTP).

**Vorteile:**
- Volle Kontrolle, keine externe Abhängigkeit
- Passt sich perfekt an die eigene Datenbankstruktur an
- Datenschutz: alle Daten im eigenen System

**Nachteile:**
- Erheblicher Entwicklungsaufwand
- Sicherheitsfehler (z.B. beim Token-Handling) haben fatale Folgen
- Jede neue Login-Methode muss selbst gebaut werden

### Empfehlung

Für eine Lernplattform mit Invite-Flow, Social Login und Magic Links ist
**Option A mit einem dedizierten IdP deutlich sicherer und schneller umsetzbar**.
Bei Self-hosting und Datenschutz-Anforderungen (DSGVO, sensible Bewerbungsdaten)
bieten sich **Keycloak** oder **Ory Kratos** an.

> **Offene Frage an den Architekten:** Welche Strategie wird für Auth gewählt?
> Das bestimmt alle weiteren Entscheidungen.

---

## Überblick der Themengebiete

```
Auth
├── Registrierung          → 01-registrierung.md
│   ├── Invite-Flow (E-Mail aus Sales gesammelt)
│   ├── Registrierungslink (Token-basiert)
│   └── Passwort setzen vs. Social Login
│
├── Login-Methoden         → 02-login-methoden.md
│   ├── E-Mail + Passwort
│   ├── Google (OAuth2 / OIDC)
│   ├── Magic Link
│   └── MFA (optional)
│
├── Passwort & Reset       → 03-passwort-und-reset.md
│   ├── Passwort-Anforderungen (NIST vs. eigene Policy)
│   ├── Reset via Code
│   └── Reset via Magic Link
│
└── Frontend-Integration   → 04-frontend-implementierung.md
    ├── Token-Storage (Access + Refresh)
    ├── Auth-Zustand (Zustand Store)
    ├── Axios Interceptors
    ├── Protected Routes
    └── Social Login Redirect-Flow
```

---

## Sicherheitskontext: Sensible Daten & Regularien

Der Designer fragt explizit nach MFA im Kontext von **Bewerbungsdaten (Job Offers /
Recruitment)**. Das ist relevant:

- **DSGVO**: Bewerbungsunterlagen sind personenbezogene Daten. Technisch-organisatorische
  Maßnahmen (TOMs) müssen geeigneten Schutz sicherstellen. MFA ist dabei eine anerkannte
  Maßnahme, aber nicht zwingend gesetzlich vorgeschrieben.
- **BDSG / Beschäftigtendatenschutz**: Keine explizite MFA-Pflicht, aber "Stand der
  Technik" als Maßstab.
- **Branchenstandards**: SOC 2, ISO 27001 empfehlen MFA für Systeme mit sensiblen Daten.

**Fazit**: MFA ist gesetzlich nicht zwingend, aber für ein System mit Bewerbungsdaten
empfehlenswert und als optionales Feature sinnvoll (nicht erzwungen, aber anbietbar).

> **Offene Frage:** Gibt es konkrete Compliance-Anforderungen (z.B. ISO 27001,
> spezifische Kunden-Anforderungen)?

---

## Zusammenfassung offener Fragen (für den Architekten)

| # | Frage | Auswirkung |
|---|---|---|
| 1 | Eigene Auth-Implementierung oder IdP (Keycloak, Ory, etc.)? | Alles |
| 2 | Social Login: Google only, oder auch Microsoft/Apple? | OAuth2-Konfiguration |
| 3 | Müssen Nutzer zwingend eine E-Mail haben? (Tenants ohne E-Mail-Adresse?) | Invite-Flow |
| 4 | Gibt es MFA-Anforderungen durch Kunden oder Compliance? | UX-Design, Backend |
| 5 | Einzel-Tenant oder Multi-Tenant? (Je Tenant eigene Identity Space?) | IdP-Konfiguration |
| 6 | Token-Strategie: JWT short-lived + Refresh, oder Server-Sessions? | Frontend + Backend |
| 7 | Passwort-Policy: wer definiert sie? (Plattform-Standard oder per Tenant?) | UX + Backend |
