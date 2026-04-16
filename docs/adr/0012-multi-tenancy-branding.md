# ADR 0012 – Multi-Tenancy / Branding

**Status:** Proposed  
**Datum:** offen  
**Entscheider:** Lernwelt Frontend Team

---

## Kontext

Die aktuelle Flutter-App existiert als "weißes Label": Es gibt eine Basis-App (`Academy Builder`) und pro Kunde eine Branding-Variante (z.B. `lernwelt-flutter` als Wrapper). Jede Variante hat eigene Farben, Logos, App-Namen und Feature-Flag-Konfigurationen.

Im neuen React-Frontend muss entschieden werden wie dieses Mandanten-Konzept umgesetzt wird.

## Optionen

### Option A: Build-time Branding
Jeder Mandant bekommt einen eigenen Build. Farben/Logos sind in Umgebungsvariablen (`VITE_PRIMARY_COLOR`, `VITE_LOGO_URL`) oder separaten Config-Dateien pro Mandant.

✅ Einfach  
⚠️ Jede Branding-Änderung braucht einen neuen Build + Deploy

### Option B: Runtime Branding (empfohlen)
Die App lädt beim Start eine Branding-Konfiguration vom Backend (Config-Service oder CDN). CSS Custom Properties werden zur Laufzeit gesetzt.

```
/api/v1/config → { primaryColor: '#063844', logoUrl: '...', features: {...} }
```

✅ Ein Build für alle Mandanten  
✅ Branding-Änderungen ohne Deploy möglich  
⚠️ Kleiner "Flash" beim ersten Laden bis Branding angewendet ist

### Option C: Subdomain-basiert
Jeder Mandant hat eine eigene Subdomain (`kunde1.lernwelt.de`), der Server liefert die passende Config.

✅ Saubere Trennung  
⚠️ DNS/Infrastruktur-Aufwand

## Offene Fragen

- Wie viele aktive Mandanten gibt es aktuell und in Zukunft?
- Wie unterschiedlich sind die Brandings? (Nur Farben/Logo oder komplett anderes UI?)
- Wird bereits ein Config-Service im Backend geplant? (→ bereits vorbereitet in `config.api.ts`)
- Sollen Feature-Flags pro Mandant unterschiedlich sein? (→ bereits in `common.ts` als Typen vorbereitet)

## Aktueller Stand

Das Frontend hat bereits einen Platzhalter für Runtime Branding: `src/shared/api/config.api.ts` und `src/shared/hooks/useFeatureFlag.ts` – das spricht für Option B.
