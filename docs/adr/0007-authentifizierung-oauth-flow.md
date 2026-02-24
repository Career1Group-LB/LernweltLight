# ADR 0007 – Authentifizierung / OAuth-Flow (Cidaas)

**Status:** Proposed  
**Datum:** offen  
**Entscheider:** Lernwelt Frontend Team

---

## Kontext

Die Lernwelt nutzt Cidaas als Identity Provider (Custom OAuth). Das aktuelle Flutter-Frontend hat einen eigenen OAuth-Flow implementiert. Im neuen React-Frontend muss entschieden werden wie Auth funktioniert, insbesondere:

1. Wie wird der Login-Flow ausgelöst (Redirect vs. Popup)?
2. Wo werden Tokens gespeichert?
3. Wie wird der Token-Refresh gehandelt?
4. Wer ist verantwortlich für die Auth-Logik – Frontend allein oder über einen Auth-Microservice?

## Optionen

### Token-Speicherung
| Option | Sicherheit | Nachteile |
|---|---|---|
| **localStorage** | ⚠️ Anfällig für XSS | Einfach, kein Server nötig |
| **sessionStorage** | ⚠️ Verloren bei Tab-Close | Etwas sicherer als localStorage |
| **httpOnly Cookie (via Backend)** | ✅ Sicher gegen XSS | Braucht Backend-Unterstützung (BFF) |
| **In-Memory (Zustand)** | ✅ Kein XSS-Risiko | Verloren bei Page-Reload |

Aktueller Platzhalter nutzt `localStorage` – das muss final entschieden werden.

### Token-Refresh-Strategie
- **Option A:** Frontend prüft Token-Expiry vor jedem Request und refresht selbst
- **Option B:** Backend-for-Frontend (BFF) handelt den Refresh transparent
- **Option C:** Axios-Interceptor fängt 401 ab und triggert Refresh (aktuell implementiert, aber kein echter Refresh-Mechanismus)

## Offene Fragen

- Welche Cidaas-Flows sind konfiguriert (Authorization Code + PKCE empfohlen)?
- Gibt es einen dedizierten Auth-Microservice im neuen Backend, der das JWT-Handling übernimmt?
- Soll Single Sign-On (SSO) zwischen Lernwelt und anderen OneCareer-Produkten funktionieren?
- Wie lange sind Access-Tokens gültig? (beeinflusst Refresh-Frequenz)

## Abhängigkeiten

→ Eng verknüpft mit dem **Auth-Service ADR** auf Backend-Seite (Kollege).
