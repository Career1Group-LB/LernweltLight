# Registrierung – Invite-Flow & Ablauf

---

## Der vom Designer vorgeschlagene Flow

```
1. E-Mail wird im Sales/Onboarding-Prozess gesammelt
2. Teilnehmer erhält E-Mail mit Registrierungslink
3. Teilnehmer setzt Passwort oder nutzt Social Login (z.B. Google)
```

Dieser Flow ist technisch gut machbar und verbreitet. Er nennt sich
**Invite-based Registration** oder **Pre-Registration Flow**.

---

## Wie funktioniert das technisch?

### Schritt 1 – E-Mail im Backend anlegen (Admin/Sales-Seite)

Ein Admin (Sales, Onboarding-Team) legt den Nutzer im System an mit:
- E-Mail-Adresse
- Zugewiesene Kurse / Tenant
- Status: `invited` (noch nicht registriert)

Das Backend generiert einen **Invite-Token** (kryptografisch sicher, z.B. 32 Byte
zufällig, base64url-kodiert) und speichert ihn zusammen mit:
- Ablaufzeit (z.B. 7 Tage oder 30 Tage – je nach Anforderung)
- E-Mail-Adresse
- Optional: Tenant-ID, Kurs-IDs

```
invite_tokens Tabelle:
- id (UUID)
- email
- token (hashed, nicht im Klartext)
- tenant_id
- expires_at
- used_at (NULL wenn noch nicht genutzt)
- created_at
```

> **Wichtig**: Der Token sollte in der Datenbank **gehasht** gespeichert werden
> (wie ein Passwort), damit ein DB-Leak keine gültigen Invite-Links liefert.

### Schritt 2 – Invite-E-Mail versenden

Das Backend versendet die E-Mail mit dem Link:

```
https://app.lernwelt.de/register?token=<RAW_TOKEN>
```

Die E-Mail enthält:
- Begrüßung mit Namen (wenn bekannt)
- Erklärung der Plattform
- CTA-Button "Jetzt registrieren"
- Ablaufdatum des Links

**E-Mail-Provider**: SMTP, AWS SES, Postmark, Resend – je nach Backend-Entscheidung.

### Schritt 3 – Registrierungsseite im Frontend

Das Frontend liest `?token=...` aus der URL und zeigt die Registrierungsseite:

**Case A – Passwort-Registrierung:**
- Token wird im Hintergrund validiert (API-Call)
- E-Mail-Feld vorausgefüllt (read-only, aus Token-Validierung)
- Nutzer gibt Passwort + Passwort-Bestätigung ein
- Absenden → Backend: Token einlösen, User anlegen, Passwort setzen

**Case B – Social Login (Google):**
- Nutzer klickt "Mit Google registrieren"
- OAuth2-Flow startet (Redirect zu Google)
- Nach Google-Callback: Backend verknüpft Google-Account mit dem Invite-Token
- E-Mail muss übereinstimmen (wichtig: Sicherheitscheck!)

**Case C – Token ungültig oder abgelaufen:**
- Frontend zeigt Fehlermeldung
- Option: "Neuen Invite-Link anfordern" (→ E-Mail erneut senden)

---

## Wichtige Sicherheitsaspekte

### Token-Sicherheit

| Anforderung | Warum |
|---|---|
| Mindestens 128 Bit Entropie (z.B. 32 Byte random) | Nicht ratebar |
| Ablaufzeit (7–30 Tage) | Gestohlene Links verlieren Wirkung |
| Single-use (nach Nutzung invalidieren) | Kein Replay-Angriff |
| Im Backend gehasht speichern | DB-Leak gibt keine gültigen Links |
| HTTPS only | Kein Mitlesen in Transit |

### E-Mail-Übereinstimmung bei Social Login

Wenn ein Nutzer sich mit Google registriert, muss die Google-E-Mail mit der
Eingeladenen E-Mail übereinstimmen (oder zumindest beim Backend geprüft werden).
Sonst könnte Person A den Invite-Link von Person B nutzen.

**Optionen:**
1. **Strict Match**: Google-E-Mail muss exakt gleich sein → einfachste Lösung
2. **Flexible**: Nutzer kann beliebige Google-E-Mail nutzen, Invite wird trotzdem
   eingelöst → weniger sicher, aber nutzerfreundlicher
3. **Konflikt-Dialog**: Wenn E-Mails abweichen → Nutzer explizit bestätigen lassen

> **Empfehlung**: Strict Match für die erste Version. Einfacher, sicherer.

---

## Registrierungs-States aus Frontend-Sicht

```
URL: /register?token=abc123

States:
├── validating  → API-Call läuft (Token wird geprüft)
├── invalid     → Token nicht gefunden oder abgelaufen
├── expired     → Token abgelaufen (eigene Fehlermeldung + "Neu anfordern")
├── used        → Token bereits eingelöst (→ Weiterleitung zu /login)
├── ready       → Token gültig, Formular zeigen
│   ├── filling → Nutzer füllt Formular aus
│   ├── submitting → Absenden läuft
│   └── error   → Fehler beim Absenden (Passwort zu schwach, etc.)
└── success     → Registrierung erfolgreich → Redirect zu /login oder direkt einloggen
```

---

## Ablaufdiagramm

```
Admin/Sales
    │
    ▼
Backend: User anlegen (Status: "invited")
    │
    ▼
Invite-E-Mail senden (Token im Link)
    │
    ▼
Nutzer öffnet Link im Browser
    │
    ▼
Frontend: /register?token=...
    │
    ▼
API: Token validieren
    ├── ungültig/abgelaufen → Fehlermeldung
    └── gültig → E-Mail anzeigen, Formular
                     │
          ┌──────────┴──────────┐
          ▼                     ▼
  Passwort setzen         Google Sign-In
          │                     │
          └──────────┬──────────┘
                     ▼
            API: User anlegen, Token einlösen
                     │
                     ▼
              Direkt einloggen (Token ausstellen)
                     │
                     ▼
              Redirect zu /courses (oder Onboarding)
```

---

## Fragen, die noch geklärt werden müssen

| Frage | Auswirkung |
|---|---|
| Wie lange ist ein Invite-Link gültig? | UX-Text in E-Mail, Backend-Logik |
| Kann ein Nutzer einen neuen Link anfordern (Self-Service)? | Braucht eigene UI + Backend-Endpunkt |
| Wird der Nutzer nach Registrierung direkt eingeloggt oder muss er sich nochmal einloggen? | UX-Flow, Token-Ausstellung |
| Kann ein Admin den Invite-Link neu generieren? | Admin-UI |
| Gibt es ein Onboarding nach der Registrierung (Profil vervollständigen etc.)? | Routing-Entscheidung |
| Was passiert, wenn die E-Mail schon einen Account hat? | Konflikt-Handling |
