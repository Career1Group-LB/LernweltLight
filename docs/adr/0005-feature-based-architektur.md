# ADR 0005 – Feature-Based Ordnerstruktur

**Status:** Accepted  
**Datum:** 2025  
**Entscheider:** Lernwelt Frontend Team

---

## Kontext

Bei einem Rewrite mit ~15 Features (Kurse, Quiz, Profile, Livestream, etc.) muss früh entschieden werden, wie der Code strukturiert wird. Optionen: Layer-Based (alle Components zusammen, alle Hooks zusammen) vs. Feature-Based (alles zu einem Feature zusammen).

## Entscheidung

Wir verwenden **Feature-Based Architektur**:

```
src/
├── features/
│   ├── courses/
│   │   ├── api/         ← API-Calls
│   │   ├── components/  ← UI-Komponenten
│   │   ├── hooks/       ← React Query Hooks
│   │   ├── schemas/     ← Zod Schemas + Typen
│   │   └── index.ts     ← Public API des Features
│   ├── auth/
│   └── ...
├── shared/              ← Feature-übergreifende Sachen
├── layouts/
├── router/
└── providers/
```

Cross-Feature-Imports laufen immer über `index.ts` (Barrel Exports), nie direkt in Unterordner.

## Konsequenzen

✅ Features können unabhängig entwickelt werden  
✅ Leicht zu finden: "Was gehört zu Kursen?" → alles in `features/courses/`  
✅ Gute Basis für späteres Code-Splitting  
⚠️ Etwas mehr initiale Ordner-Struktur nötig
