# ADR 0006 – CSS / Styling Strategie

**Status:** Proposed  
**Datum:** offen  
**Entscheider:** Lernwelt Frontend Team

---

## Kontext

Für die Styling-Umsetzung des neuen Frontends wurde noch keine Entscheidung getroffen. Die Wahl des CSS-Ansatzes hat großen Einfluss auf Developer Experience, Bundle-Size und wie das Branding/Theming für verschiedene Mandanten umgesetzt werden kann.

**Neu bekannt:** Der Designer hat bestätigt dass die Lernwelt einen **Dark Mode** bekommt. Das ist ein kritischer Einflussfaktor auf diese Entscheidung (siehe Abschnitt unten).

---

## Optionen

| Option | Beschreibung | Vorteile | Nachteile |
|---|---|---|---|
| **Tailwind CSS** | Utility-First, Klassen direkt im JSX | Sehr schnell, große Community, **Dark Mode eingebaut (`dark:` Prefix)** | Ungewohnte Syntax, HTML wird unübersichtlich |
| **CSS Modules** | Scoped CSS pro Komponente (`.module.css`) | Kein globaler Konflikt, vertraut für CSS-Entwickler | Mehr Dateien, kein Utility-System, Dark Mode muss manuell gebaut werden |
| **Plain CSS + Variables** | Globales CSS mit CSS Custom Properties | Einfach, kein Build-Tool nötig | Schnell unübersichtlich bei vielen Komponenten |
| **styled-components / Emotion** | CSS-in-JS | Dynamisches Styling, gut für Theming | Laufzeit-Overhead, schlechtere Performance |

---

## ⚠️ Dark Mode: Warum das Fundament von Anfang an stimmen muss

Der Designer plant einen Dark Mode. Das klingt nach einem Feature das man später hinzufügt – ist es aber **nicht**. Die Entscheidung wie Farben im Code verwaltet werden muss von Tag 1 richtig sein.

### Das Problem mit hardcodierten Farben

Wenn Farben direkt in Komponenten stehen:

```css
/* ❌ So nicht – Dark Mode wird später zum Albtraum */
color: #1a1a1a;
background: #ffffff;
border: 1px solid #e0e0e0;
```

Müsste man für Dark Mode **jede einzelne Farbangabe in jeder Datei** überarbeiten. Bei 15+ Features und hunderten Komponenten ist das wochenlanger Refactoring-Aufwand.

### Die richtige Lösung: Design Tokens (CSS Custom Properties)

Farben werden nie direkt verwendet, sondern immer über benannte Token-Variablen:

```css
/* ✅ So – Dark Mode ist nur ein Wechsel der Variablenwerte */
color: var(--color-text-primary);
background: var(--color-bg-surface);
border: 1px solid var(--color-border);
```

Dark Mode ist dann eine einzige Stelle im Code:

```css
:root {
  --color-text-primary:  #1a1a1a;
  --color-bg-surface:    #ffffff;
  --color-bg-elevated:   #f8f9fa;
  --color-border:        #e0e0e0;
  --color-primary:       #063844;
}

:root[data-theme="dark"] {
  --color-text-primary:  #f0f0f0;
  --color-bg-surface:    #121212;
  --color-bg-elevated:   #1e1e1e;
  --color-border:        #2a2a2a;
  --color-primary:       #4a9db5;
}
```

Kein Anfassen von Komponenten. Kein Suchen-und-Ersetzen. Einfach die Variablenwerte tauschen.

### Wichtig: Was der Designer liefern muss

Der Designer darf die Dark-Mode-Screens **nicht sofort** liefern – aber er muss das **Color System als Token-Paare** definieren:

| Token | Light | Dark |
|---|---|---|
| `--color-text-primary` | `#1a1a1a` | `#f0f0f0` |
| `--color-text-secondary` | `#555555` | `#a0a0a0` |
| `--color-bg-surface` | `#ffffff` | `#121212` |
| `--color-bg-elevated` | `#f8f9fa` | `#1e1e1e` |
| `--color-primary` | `#063844` | `#4a9db5` |
| `--color-border` | `#e0e0e0` | `#2a2a2a` |
| ... | ... | ... |

Sobald diese Token-Paare stehen, ist Dark Mode technisch fast fertig – unabhängig davon wann die visuellen Designs jedes Screens geliefert werden.

### Dark Mode im Code aktivieren

```typescript
// src/shared/stores/theme.store.ts  (mit Zustand)
import { create } from 'zustand';

type Theme = 'light' | 'dark' | 'system';

interface ThemeStore {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

export const useThemeStore = create<ThemeStore>((set) => ({
  theme: 'system',
  setTheme: (theme) => {
    set({ theme });
    const resolved = theme === 'system'
      ? window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      : theme;
    document.documentElement.setAttribute('data-theme', resolved);
    localStorage.setItem('theme', theme);
  },
}));
```

---

## Wie die Optionen mit Dark Mode zusammenpassen

| Option | Dark Mode Aufwand |
|---|---|
| **Tailwind CSS** | 🟢 Gering – `dark:` Prefix ist eingebaut, funktioniert mit CSS Variables |
| **CSS Modules + CSS Custom Properties** | 🟡 Mittel – Token-System muss manuell aufgebaut werden, dann aber sauber |
| **Plain CSS + Variables** | 🟡 Mittel – wie CSS Modules, aber ohne Scoping |
| **styled-components / Emotion** | 🟡 Mittel – ThemeProvider-Pattern, aber Laufzeit-Overhead |

**Tailwind + CSS Custom Properties** als Kombination ist der modernste Ansatz: Tailwind für das Utility-System, CSS Variables für die Token-Werte die Tailwind nutzt. shadcn/ui (→ ADR 0010) funktioniert genau nach diesem Prinzip und bringt Dark Mode komplett out-of-the-box.

---

## Offene Fragen

- Wird ein Design System / Figma-Handoff geliefert? Das beeinflusst die Wahl stark.
- Liefert der Designer die Token-Paare (Light + Dark) als Teil des Handoffs?
- Hat jemand im Team bereits Tailwind-Erfahrung?
- Wird eine externe Komponenten-Bibliothek (→ ADR 0010) genutzt? **shadcn/ui würde Dark Mode + Token-System mitbringen.**
- Soll der User zwischen Light/Dark/System wählen können, oder gibt es nur einen System-Modus?

## Abhängigkeiten

→ Entscheidung hängt zusammen mit **ADR 0010 (Komponenten-Bibliothek)** – sollte gemeinsam entschieden werden.  
→ Beeinflusst **ADR 0012 (Multi-Tenancy/Branding)** – Token-System deckt sowohl Dark Mode als auch Mandanten-Farben ab.  
→ **Designer-Deliverable:** Token-Paare (Light + Dark) müssen vor dem ersten Feature-Sprint definiert sein.
