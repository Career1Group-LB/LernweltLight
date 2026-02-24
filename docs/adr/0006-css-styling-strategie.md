# ADR 0006 – CSS / Styling Strategie

**Status:** Proposed  
**Datum:** offen  
**Entscheider:** Lernwelt Frontend Team

---

## Kontext

Für die Styling-Umsetzung des neuen Frontends wurde noch keine Entscheidung getroffen. Die Wahl des CSS-Ansatzes hat großen Einfluss auf Developer Experience, Bundle-Size und wie das Branding/Theming für verschiedene Mandanten umgesetzt werden kann.

## Optionen

| Option | Beschreibung | Vorteile | Nachteile |
|---|---|---|---|
| **Tailwind CSS** | Utility-First, Klassen direkt im JSX | Sehr schnell, kein eigenes CSS, große Community | Ungewohnte Syntax, HTML wird unübersichtlich |
| **CSS Modules** | Scoped CSS pro Komponente (`.module.css`) | Kein globaler Konflikt, vertraut für CSS-Entwickler | Mehr Dateien, kein Utility-System |
| **Plain CSS + Variables** | Globales CSS mit CSS Custom Properties | Einfach, kein Build-Tool nötig | Schnell unübersichtlich bei vielen Komponenten |
| **styled-components / Emotion** | CSS-in-JS | Dynamisches Styling, gut für Theming | Laufzeit-Overhead, schlechtere Performance |

## Offene Fragen

- Wird ein Design System / Figma-Handoff geliefert? Das beeinflusst die Wahl stark.
- Wie wichtig ist Mandanten-spezifisches Theming (verschiedene Farben pro Kunde)? Wenn ja, sind CSS Custom Properties ein Muss.
- Hat jemand im Team bereits Tailwind-Erfahrung?
- Wird eine externe Komponenten-Bibliothek (→ ADR 0010) genutzt? Viele Libraries kommen mit eigenem Styling-System.

## Abhängigkeiten

→ Entscheidung hängt zusammen mit **ADR 0010 (Komponenten-Bibliothek)** – sollte gemeinsam entschieden werden.
