# ADR 0014 – API-Typen / OpenAPI Code Generation

**Status:** Proposed  
**Datum:** offen  
**Entscheider:** Lernwelt Frontend Team

---

## Kontext

Das neue Backend wird in Go geschrieben. Go-Services können automatisch eine **OpenAPI/Swagger Spezifikation** generieren. Die Frage ist: Nutzen wir diese Spezifikation um TypeScript-Typen automatisch zu generieren, oder schreiben wir die Typen (Zod Schemas) manuell im Frontend?

## Aktueller Ansatz (manuell)

Aktuell werden Zod Schemas manuell geschrieben (z.B. `course.schema.ts`). Das bedeutet:
- Bei API-Änderungen muss das Frontend-Schema manuell angepasst werden
- Es kann passieren dass Frontend- und Backend-Typen auseinanderlaufen (Type-Drift)

## Option A: Manuelle Schemas (Status quo)

Zod Schemas werden von Hand geschrieben und gepflegt.

✅ Kein zusätzliches Tooling  
✅ Volle Kontrolle, Schemas können mit Extra-Validierungen angereichert werden  
⚠️ Risiko von Type-Drift wenn Backend sich ändert  
⚠️ Mehr Aufwand bei API-Änderungen

## Option B: OpenAPI Codegen (z.B. `openapi-typescript`)

Das Backend liefert eine `openapi.json`. Ein CLI-Tool generiert daraus TypeScript-Interfaces.

```bash
npx openapi-typescript https://api.lernwelt.de/openapi.json -o src/shared/types/api.generated.ts
```

✅ Frontend- und Backend-Typen sind immer synchron  
✅ Weniger manuelle Arbeit bei API-Änderungen  
⚠️ Braucht: Backend muss OpenAPI-Spec exportieren  
⚠️ Generierte Typen sind Interfaces, kein Zod – Laufzeit-Validierung muss separat bleiben  

## Option C: Hybrid

Generierte Types für die Basis-Datenstrukturen, Zod nur für kritische Validierungen an den API-Grenzen.

## Offene Fragen

- Werden die neuen Go-Microservices OpenAPI-Specs exportieren? (Frage an Kollegen)
- In welchem Takt ändert sich die API während der Entwicklung? (Beeinflusst wie wichtig Codegen ist)
- Soll Codegen in der CI/CD Pipeline automatisch laufen?

## Abhängigkeiten

→ Voraussetzung: Backend liefert OpenAPI-Spec (klären mit Backend-Team).
