# ADR 0001 – React mit TypeScript als Frontend-Technologie

**Status:** Accepted  
**Datum:** 2025  
**Entscheider:** Lernwelt Frontend Team

---

## Kontext

Das bisherige Lernwelt Frontend wurde in Flutter gebaut. Im Rahmen des Rewrites soll das Frontend als Web-Applikation neu gebaut werden, die auf allen Geräten im Browser läuft.

## Entscheidung

Wir bauen das neue Frontend mit **React 18+** und **TypeScript (Strict Mode)**.

- **React** ist der Industriestandard für komplexe Web-UIs, hat ein riesiges Ökosystem und wird von unserem Team bereits (Client Office) eingesetzt.
- **TypeScript** ist Pflicht – kein JavaScript. Strict Mode ist aktiviert (`strict: true` in `tsconfig.json`).
- **Vite** als Build-Tool (schnell, moderner Ersatz für Webpack).

## Konsequenzen

✅ Bekanntes Ökosystem, viele Ressourcen  
✅ Typ-Sicherheit auf dem Frontend  
✅ Gute Tooling-Unterstützung (ESLint, Prettier, Vitest)  
⚠️ Team muss von Flutter-Denkweise auf React-Denkweise umsteigen
