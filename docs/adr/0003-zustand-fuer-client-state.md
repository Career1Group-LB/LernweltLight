# ADR 0003 – Zustand für Client-seitigen State

**Status:** Accepted  
**Datum:** 2025  
**Entscheider:** Lernwelt Frontend Team

---

## Kontext

Nicht alle State ist Server-Daten. Dinge wie Auth-Status, UI-Zustände (Sidebar offen/zu, aktives Modal) oder temporäre Formular-Zustände über mehrere Schritte müssen im Frontend gehalten werden.

## Entscheidung

Wir verwenden **Zustand v5** für Client-seitigen globalen State.

React Context wird nur für Provider-Pattern verwendet (z.B. Theme), nicht für häufig wechselnde Zustände.

## Konsequenzen

✅ Extrem einfache API (kein Boilerplate)  
✅ Kein Provider nötig – Store ist direkt importierbar  
✅ Gut mit TypeScript  
✅ Zustand = State Management Library (kein deutsches Wort im Code-Kontext)  
⚠️ Bei sehr komplexen State-Übergängen weniger strukturiert als Redux
