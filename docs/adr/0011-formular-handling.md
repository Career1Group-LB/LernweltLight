# ADR 0011 – Formular-Handling

**Status:** Proposed  
**Datum:** offen  
**Entscheider:** Lernwelt Frontend Team

---

## Kontext

Das neue Backend (Go Microservices) übernimmt die gesamte Business-Logic-Validierung. Trotzdem gibt es im Frontend Formulare (Profil bearbeiten, Notizen anlegen, Einstellungen, etc.) die eine gewisse UX-seitige Formular-Verwaltung brauchen.

Die Frage ist nicht "wo validieren" (das ist klar: Backend), sondern "wie verwaltet das Frontend Formular-State, Loading-Zustände und Fehler-Anzeige".

**Hinweis:** Formik wurde evaluiert und aufgrund schlechter Maintenance und Inkompatibilität mit Zod v4 ausgeschlossen (→ siehe `../firstChallenge/08-react-query-und-formik.md`).

## Optionen

| Option | Beschreibung |
|---|---|
| **React Hook Form + Zod** | Leichtgewichtig, uncontrolled inputs, native Zod-Integration |
| **TanStack Form** | Neues Formular-Framework vom TanStack-Team, sehr typsicher |
| **Nur useState + useMutation** | Kein Formular-Framework, alles manuell | 
| **Formik** | ❌ Ausgeschlossen (schlechte Maintenance, kein Zod v4 Support) |

## Überlegung: Brauchen wir überhaupt eine Form-Library?

Das Frontend ist ein "Thin Client" – viele "Formulare" sind in Wirklichkeit nur ein oder zwei Felder (z.B. eine Notiz anlegen). Für diese Fälle reicht simples `useState + useMutation`.

Eine Form-Library lohnt sich erst wenn es echte multi-field Formulare gibt (z.B. Profil mit 10+ Feldern, mehrstufige Onboarding-Formulare).

## Offene Fragen

- Wie viele und wie komplexe Formulare gibt es im MVP?
- Gibt es mehrstufige Formulare (Multi-Step)?
- Soll eine Form-Library von Anfang an eingerichtet werden oder erst bei Bedarf hinzugefügt werden?
