# ADR 0010 – Komponenten-Bibliothek / UI-Library

**Status:** Proposed  
**Datum:** offen  
**Entscheider:** Lernwelt Frontend Team

---

## Kontext

Das Frontend braucht viele UI-Bausteine: Buttons, Inputs, Modals, Tabs, Dropdowns, Tooltips, etc. Die Frage ist ob diese von Grund auf selbst gebaut werden oder ob eine externe Bibliothek die Basis liefert.

Zusätzlich gibt es bereits eine interne `c1g-ui-library` die im Client-Office Projekt genutzt wird. Diese könnte potenziell auch hier verwendet werden.

## Optionen

| Option | Beschreibung | Vorteile | Nachteile |
|---|---|---|---|
| **shadcn/ui** | Copy-paste Komponenten auf Basis von Radix UI | Volle Kontrolle, kein Lock-in, sehr modern | Initialer Setup-Aufwand |
| **Radix UI** | Unstyled, accessible Primitives | Maximale Designfreiheit, a11y out of the box | Muss komplett gestyled werden |
| **MUI (Material UI)** | Vollständige Component Library | Riesiges Ökosystem, schnell einsatzbereit | Sehr eigenwilliges Design, schwer zu überschreiben |
| **Ant Design** | Enterprise-fokussierte Library | Vollständig, sehr viele Komponenten | Schwer ans eigene Design anzupassen |
| **c1g-ui-library (intern)** | Bestehende interne Library aus Client Office | Bereits vorhanden, OneCareer-Branding | Ist für Client Office gebaut, passt ggf. nicht |
| **Alles selbst bauen** | Komplett eigene Komponenten | Maximale Kontrolle | Sehr aufwendig, viele Edge Cases (a11y!) |

## Offene Fragen

- Gibt es ein Figma Design System das vorgegeben ist? (Wenn ja, beeinflusst das die Wahl stark)
- Kann/soll die `c1g-ui-library` erweitert werden oder ist die Lernwelt ein eigenständiges Design?
- Wie wichtig ist Barrierefreiheit (Accessibility / WCAG)? (Radix/shadcn sind hier sehr gut)
- Wie stark soll das Design zwischen verschiedenen Mandanten variieren? (→ ADR 0012)

## Abhängigkeiten

→ Hängt direkt zusammen mit **ADR 0006 (CSS/Styling)** – Tailwind und shadcn/ui funktionieren gut zusammen.  
→ Beeinflusst **ADR 0012 (Multi-Tenancy/Branding)** – Custom Theming muss funktionieren.
