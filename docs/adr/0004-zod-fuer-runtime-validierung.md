# ADR 0004 – Zod für Runtime-Validierung

**Status:** Accepted  
**Datum:** 2025  
**Entscheider:** Lernwelt Frontend Team

---

## Kontext

TypeScript gibt uns Typ-Sicherheit zur Compile-Zeit. Aber API-Responses kommen zur Laufzeit – TypeScript kann nicht prüfen ob der Server wirklich das zurückgibt, was wir erwarten.

## Entscheidung

Wir verwenden **Zod v4** zum Validieren und Parsen aller API-Responses und Umgebungsvariablen.

Jedes Feature hat seine eigene `schemas/` Datei (z.B. `course.schema.ts`). Die Schemas definieren gleichzeitig die TypeScript-Typen (`z.infer<typeof Schema>`).

Business-Logic-Validierung (z.B. "ist dieses Quiz-Ergebnis korrekt?") findet **nicht** im Frontend statt – das ist Aufgabe der Backend Microservices.

## Konsequenzen

✅ Laufzeitfehler durch unerwartete API-Responses werden sofort erkannt  
✅ Single Source of Truth: Schema = TypeScript-Typ  
✅ Gut integriert mit React Hook Form (falls Formulare nötig)  
⚠️ Kleine Bundle-Size-Kosten (vertretbar)
