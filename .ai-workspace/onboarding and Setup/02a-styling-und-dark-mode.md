# Schritt 2a: Styling-System & Dark Mode einrichten

> **Warum jetzt?** Dieser Schritt muss VOR dem ersten Feature-Sprint passieren. Hardcodierte Farben bedeuten wochenlangen Refactoring-Aufwand wenn der Dark Mode kommt. Das Token-System kostet einmalig ~1 Tag und spart danach für immer.

> **Entscheidung (ADR 0006):** Wir nutzen **Tailwind CSS + CSS Custom Properties** als Token-System. Der Designer hat bereits ein vollständiges Token-System in Figma gebaut (Material Design 3 Namenskonvention) – wir übersetzen es direkt in CSS-Variablen.

---

## 2a.1 Tailwind CSS installieren

```bash
pnpm add tailwindcss @tailwindcss/vite
```

### `vite.config.ts` anpassen

```typescript
/// <reference types="vitest/config" />
import path from 'path';

import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),   // ← neu
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    css: true,
  },
});
```

### `src/index.css` – Tailwind einbinden

Ersetze den gesamten Inhalt von `src/index.css`:

```css
@import "tailwindcss";

/* ─── RESET ──────────────────────────────────────────────────────────────── */
*,
*::before,
*::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html {
  -webkit-font-smoothing: antialiased;
}
```

### Testen ob Tailwind funktioniert

In `src/App.tsx` kurz testen:

```tsx
export default function App() {
  return (
    <div className="bg-red-500 text-white p-4">
      Tailwind funktioniert ✓
    </div>
  );
}
```

`pnpm dev` starten – wenn du ein rotes Div siehst, ist Tailwind aktiv. Danach wieder entfernen.

---

## 2a.2 Schriften laden (Google Fonts)

Der Designer nutzt zwei Schriften aus Figma:
- **Outfit** (Headings) → öffentlich auf Google Fonts verfügbar ✅
- **Google Sans Flex** (Body/Labels) → Google-interne Schrift, **nicht öffentlich auf Google Fonts** ⚠️

### Für jetzt: Outfit laden, Google Sans Flex klären

Füge in `index.html` (im `<head>`) ein:

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link
  href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600&display=swap"
  rel="stylesheet"
/>
```

> **⚠️ Aktion erforderlich:** Google Sans Flex ist eine interne Google-Schrift. Kläre mit dem Designer ob:
> - Er eine lizenzierte Version bereitstellt
> - Oder ob **Inter** als Fallback genutzt wird (sieht sehr ähnlich aus, kostenlos)
> - Bis zur Klärung: `Inter` von Google Fonts als Platzhalter

Für Inter als Platzhalter:

```html
<link
  href="https://fonts.googleapis.com/css2?family=Inter:wght@400;450;500&family=Outfit:wght@400;500;600&display=swap"
  rel="stylesheet"
/>
```

---

## 2a.3 Design-Token-System aufbauen

Das ist das Herzstück dieses Schritts. Die Farben kommen 1:1 aus dem Figma-Design-System des Designers (Material Design 3 Namenskonvention).

Erstelle `src/styles/tokens.css`:

```css
/* ─────────────────────────────────────────────────────────────────────────── */
/* DESIGN TOKENS                                                                */
/* Quelle: Figma – Lernwelt v2 Design System                                   */
/* Namenskonvention: Material Design 3 "Schemes"                               */
/* ─────────────────────────────────────────────────────────────────────────── */

/* ─── LIGHT MODE (default) ───────────────────────────────────────────────── */
:root {
  /* Farben */
  --schemes-primary:               #006a58;
  --schemes-primary-container:     #c7f0e9;
  --schemes-on-primary-container:  #004f42;
  --schemes-surface:               #ffffff;
  --schemes-surface-container:     #f2f7f7;
  --schemes-on-surface:            #161d1d;
  --schemes-on-surface-variant:    #3f4948;
  --schemes-outline:               #bec9c8;

  /* TODO: Diese Werte vom Designer anfordern (Dark Mode Werte fehlen noch) */
  /* --schemes-primary-dark:             ??? */
  /* --schemes-primary-container-dark:   ??? */
  /* --schemes-surface-dark:             ??? */
  /* --schemes-surface-container-dark:   ??? */
  /* --schemes-on-surface-dark:          ??? */
  /* --schemes-on-surface-variant-dark:  ??? */
  /* --schemes-outline-dark:             ??? */

  /* Schriften */
  --font-family-heading: 'Outfit', system-ui, sans-serif;
  --font-family-text:    'Inter', system-ui, sans-serif; /* Platzhalter für Google Sans Flex */

  /* Typografie-Skala */
  --text-heading-xxl-size:    48px;
  --text-heading-xxl-height:  48px;
  --text-heading-xxl-spacing: -0.03em;
  --text-heading-xxl-weight:  500;

  --text-heading-sm-size:    24px;
  --text-heading-sm-height:  32px;
  --text-heading-sm-spacing: -0.01em;
  --text-heading-sm-weight:  500;

  --text-body-md-size:    16px;
  --text-body-md-height:  24px;
  --text-body-md-spacing: 0;
  --text-body-md-weight:  400;

  --text-label-md-size:    16px;
  --text-label-md-height:  24px;
  --text-label-md-spacing: 0;
  --text-label-md-weight:  450;
}

/* ─── DARK MODE ──────────────────────────────────────────────────────────── */
/* Wird aktiviert wenn data-theme="dark" auf <html> gesetzt ist               */
/* WERTE NOCH AUSSTEHEND – werden vom Designer nachgeliefert                  */
:root[data-theme='dark'] {
  /* TODO: Vom Designer anfordern */
  --schemes-primary:               #4db89e;   /* Platzhalter */
  --schemes-primary-container:     #004f42;   /* Platzhalter */
  --schemes-on-primary-container:  #c7f0e9;   /* Platzhalter */
  --schemes-surface:               #0e1514;   /* Platzhalter */
  --schemes-surface-container:     #1a2120;   /* Platzhalter */
  --schemes-on-surface:            #dde4e3;   /* Platzhalter */
  --schemes-on-surface-variant:    #bec9c8;   /* Platzhalter */
  --schemes-outline:               #3f4948;   /* Platzhalter */
}
```

> **⚠️ Die Dark-Mode-Werte sind aktuell Platzhalter** – sie wurden aus den Light-Mode-Werten grob invertiert. Sobald der Designer die echten Dark-Mode-Farben aus Figma liefert, müssen diese ersetzt werden.

### `src/index.css` – Tokens importieren

```css
@import "tailwindcss";
@import "./styles/tokens.css";   /* ← neu */

/* Reset ... */
```

---

## 2a.4 Tailwind mit Tokens verbinden

Damit Tailwind-Klassen die CSS-Variablen nutzen, müssen wir das Theme konfigurieren. Füge in `src/index.css` direkt nach dem `@import "tailwindcss"` ein:

```css
@import "tailwindcss";
@import "./styles/tokens.css";

@theme {
  /* Farben: Tailwind-Klassen nutzen unsere CSS-Variablen */
  --color-primary:              var(--schemes-primary);
  --color-primary-container:    var(--schemes-primary-container);
  --color-on-primary-container: var(--schemes-on-primary-container);
  --color-surface:              var(--schemes-surface);
  --color-surface-container:    var(--schemes-surface-container);
  --color-on-surface:           var(--schemes-on-surface);
  --color-on-surface-variant:   var(--schemes-on-surface-variant);
  --color-outline:              var(--schemes-outline);

  /* Schriften */
  --font-heading: var(--font-family-heading);
  --font-text:    var(--font-family-text);
}
```

Jetzt kannst du in Tailwind schreiben:
```tsx
// Tailwind-Klasse nutzt automatisch CSS-Variable → Dark Mode funktioniert automatisch
<div className="bg-surface text-on-surface">
  <h1 className="font-heading text-primary">Hallo</h1>
</div>
```

---

## 2a.5 Theme Store (Dark Mode schalten)

Der Theme-Store steuert ob Light, Dark oder System-Modus aktiv ist.

Erstelle `src/shared/stores/theme.store.ts`:

```typescript
import { create } from 'zustand';

// Flutter-Analogie: Cubit<ThemeState>
// Statt emit() wird hier set() verwendet

type Theme = 'light' | 'dark' | 'system';

interface ThemeStore {
  theme: Theme;
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
}

function resolveTheme(theme: Theme): 'light' | 'dark' {
  if (theme === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  }
  return theme;
}

function applyTheme(resolved: 'light' | 'dark') {
  // Setzt data-theme="dark" oder data-theme="light" auf <html>
  // → :root[data-theme='dark'] in tokens.css wird aktiv
  document.documentElement.setAttribute('data-theme', resolved);
}

const savedTheme = (localStorage.getItem('lernwelt-theme') as Theme) ?? 'system';
const initialResolved = resolveTheme(savedTheme);
applyTheme(initialResolved);

export const useThemeStore = create<ThemeStore>((set) => ({
  theme: savedTheme,
  resolvedTheme: initialResolved,

  setTheme: (theme) => {
    const resolved = resolveTheme(theme);
    applyTheme(resolved);
    localStorage.setItem('lernwelt-theme', theme);
    set({ theme, resolvedTheme: resolved });
  },
}));
```

### Verwendung in einer Komponente

```tsx
// Beispiel: Dark Mode Toggle Button (später in der Sidebar oder im Header)
import { useThemeStore } from '@/shared/stores/theme.store';

export function ThemeToggle() {
  const { theme, setTheme } = useThemeStore();

  return (
    <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
      {theme === 'dark' ? '☀️ Hell' : '🌙 Dunkel'}
    </button>
  );
}
```

---

## 2a.6 System-Modus: OS-Wechsel automatisch erkennen

Damit sich die App automatisch anpasst wenn der User auf OS-Ebene den Modus wechselt, füge in `src/main.tsx` einen Listener hinzu:

```tsx
// src/main.tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import './index.css';
import App from './App';

// System-Theme-Listener: Reagiert wenn der User im OS den Dark/Light Mode wechselt
const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
mediaQuery.addEventListener('change', (e) => {
  const savedTheme = localStorage.getItem('lernwelt-theme');
  if (savedTheme === 'system' || !savedTheme) {
    document.documentElement.setAttribute(
      'data-theme',
      e.matches ? 'dark' : 'light',
    );
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

---

## 2a.7 Wie das Token-System in der Praxis funktioniert

### Regel: Niemals Farben direkt verwenden

```tsx
// ❌ Nie so – bricht beim Dark Mode
<div style={{ color: '#161d1d', background: '#ffffff' }}>

// ❌ Nie so in Tailwind
<div className="text-[#161d1d] bg-[#ffffff]">

// ✅ Immer so – wechselt automatisch mit dem Theme
<div className="text-on-surface bg-surface">

// ✅ Oder direkt mit CSS-Variable
<div style={{ color: 'var(--schemes-on-surface)' }}>
```

### Referenz: Welche Tailwind-Klasse für was?

| CSS Token | Tailwind-Klasse | Einsatz |
|---|---|---|
| `--schemes-primary` | `text-primary` / `bg-primary` | Buttons, Links, aktive Elemente |
| `--schemes-primary-container` | `bg-primary-container` | Heller Hintergrund für Primary-Bereiche |
| `--schemes-on-primary-container` | `text-on-primary-container` | Text auf Primary Container |
| `--schemes-surface` | `bg-surface` | Haupthintergrund der App |
| `--schemes-surface-container` | `bg-surface-container` | Cards, erhöhte Bereiche |
| `--schemes-on-surface` | `text-on-surface` | Primärer Fließtext |
| `--schemes-on-surface-variant` | `text-on-surface-variant` | Sekundärer Text, Labels |
| `--schemes-outline` | `border-outline` | Rahmen, Trennlinien |

---

## 2a.8 Dark Mode Smoke Test

Nach dem Setup schnell prüfen ob alles funktioniert:

```tsx
// src/App.tsx temporär erweitern zum Testen:
import { useThemeStore } from '@/shared/stores/theme.store';

export default function App() {
  const { theme, setTheme } = useThemeStore();

  return (
    <div className="min-h-screen bg-surface text-on-surface p-8">
      <h1 className="font-heading text-4xl text-primary mb-4">Lernwelt</h1>
      <p className="font-text text-on-surface-variant mb-4">
        Aktuelles Theme: {theme}
      </p>
      <div className="flex gap-2">
        <button
          onClick={() => setTheme('light')}
          className="bg-primary-container text-on-primary-container px-4 py-2 rounded"
        >
          Light
        </button>
        <button
          onClick={() => setTheme('dark')}
          className="bg-primary-container text-on-primary-container px-4 py-2 rounded"
        >
          Dark
        </button>
        <button
          onClick={() => setTheme('system')}
          className="bg-surface-container text-on-surface px-4 py-2 rounded"
        >
          System
        </button>
      </div>
    </div>
  );
}
```

Was du testen solltest:
- [ ] Light → Heller Hintergrund (`#ffffff`), dunkler Text (`#161d1d`)
- [ ] Dark → Wechsel auf Dark-Mode-Farben
- [ ] System → Folgt OS-Einstellung
- [ ] Reload → Theme bleibt erhalten (kommt aus `localStorage`)
- [ ] `npm run type-check` läuft ohne Fehler

---

## Offene Punkte (nach diesem Schritt klären)

| Punkt | Priorität | An wen |
|---|---|---|
| **Dark-Mode-Token-Werte** – die aktuellen Werte sind Platzhalter | 🔴 Hoch | Designer |
| **Google Sans Flex** – ist die Schrift öffentlich verfügbar oder brauchen wir eine Lizenz/Alternative? | 🔴 Hoch | Designer |
| **Weitere Tokens** – Spacing, Border-Radius, Schatten, Farben für Buttons (Blue, Orange, Red, Green, Purple) | 🟡 Mittel | Designer |

---

## Checkliste: Schritt 2a

- [ ] `tailwindcss` installiert
- [ ] `vite.config.ts` mit Tailwind-Plugin aktualisiert
- [ ] `src/index.css` mit `@import "tailwindcss"` und `@theme {}` Block
- [ ] `src/styles/tokens.css` mit Light-Mode-Tokens aus Figma erstellt
- [ ] Dark-Mode-Block in `tokens.css` (Platzhalter – Designer muss Werte liefern)
- [ ] Schriften in `index.html` eingebunden (Outfit + Inter Platzhalter)
- [ ] `src/shared/stores/theme.store.ts` erstellt
- [ ] System-Theme-Listener in `src/main.tsx`
- [ ] Smoke Test durchgeführt (Light/Dark/System Toggle funktioniert)
- [ ] `pnpm dev` startet fehlerfrei
- [ ] `pnpm type-check` läuft ohne Fehler

**Wenn alles grün ist → weiter zu [Schritt 3: Ordnerstruktur](./03-ordnerstruktur-aufbauen.md)**
