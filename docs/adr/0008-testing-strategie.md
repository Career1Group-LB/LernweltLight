# ADR 0008 – Testing-Strategie

**Status:** Proposed  
**Datum:** offen  
**Entscheider:** Lernwelt Frontend Team

---

## Kontext

Das Projekt hat bereits Vitest, React Testing Library und MSW (Mock Service Worker) installiert. Es muss aber geklärt werden, **was** auf welcher Ebene getestet wird und wie viel Test-Coverage angestrebt wird. Zu viele Tests verlangsamen die Entwicklung, zu wenige führen zu Regressions.

## Vorhandene Tools

| Tool | Zweck | Status |
|---|---|---|
| **Vitest** | Unit- und Integrationstests | ✅ installiert |
| **React Testing Library** | Komponentenstests | ✅ installiert |
| **MSW (Mock Service Worker)** | API-Mocking in Tests | ✅ installiert |
| **Playwright** | End-to-End Tests (Browser) | ❌ noch nicht installiert |

## Vorgeschlagene Test-Pyramide

```
         ▲
        / \        E2E Tests (Playwright) – wenige, kritische User Flows
       /   \       z.B. Login → Kurs öffnen → Quiz absolvieren
      /─────\
     /       \     Integrationstests (RTL + MSW) – mittlere Menge
    /         \    z.B. CoursesPage zeigt richtige Kurse an
   /───────────\
  /             \  Unit Tests (Vitest) – für Utils, Schemas, Hooks
 /_______________\ z.B. formatDuration(), Zod-Schemas
```

## Offene Fragen

- Soll Playwright für E2E eingerichtet werden? (Wann, von wem?)
- Gibt es eine Mindest-Coverage-Vorgabe?
- Werden Mock-Daten (MSW Handlers) zentral gesammelt oder pro Feature?
- Wer schreibt Tests – Developer selbst oder gibt es einen QA-Prozess?
- Werden Tests in der CI/CD Pipeline automatisch ausgeführt?

## Abhängigkeiten

→ MSW-Strategie hängt zusammen mit **ADR 0009 (Mock-First Development)** wenn kein Backend steht.
