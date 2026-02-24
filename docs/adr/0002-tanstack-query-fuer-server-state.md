# ADR 0002 – TanStack React Query für Server State

**Status:** Accepted  
**Datum:** 2025  
**Entscheider:** Lernwelt Frontend Team

---

## Kontext

In einer React-Applikation muss entschieden werden, wie Server-Daten (API-Calls) verwaltet werden. Optionen waren: Redux Toolkit Query, SWR, TanStack React Query, oder manuelles `useEffect` + `useState`.

## Entscheidung

Wir verwenden **TanStack React Query v5** für alle Server-Daten (Caching, Loading-States, Refetching, Mutations).

Redux wird **nicht** eingesetzt – das neue Backend (Go Microservices) übernimmt die gesamte Business-Logik. Das Frontend ist ein "Thin Client" und braucht kein komplexes globales State-Management.

## Konsequenzen

✅ Automatisches Caching und Refetching  
✅ Loading/Error-States out of the box  
✅ React Query DevTools für Debugging  
✅ Deutlich weniger Boilerplate als Redux  
⚠️ Kein Redux = kein Time-Travel-Debugging (nicht nötig für unseren Use Case)
