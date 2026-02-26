# Sidebar Tutorial – Teil 5: Abstände und Spacing

> **Du änderst in diesem Kapitel drei Stellen:**
> `src/layouts/Sidebar.tsx`, `src/layouts/AppLayout.tsx` und `src/index.css`
>
> Die erste Hälfte ist Theorie (Tailwind Spacing-System, Flutter-Vergleich).
> Der Abschnitt **"Was du konkret änderst"** weiter unten ist die eigentliche Umsetzung.
>
> ⚠️ **Wichtig:** Es gibt eine häufige Falle mit CSS Cascade Layers die dazu führt
> dass Tailwind-Padding-Klassen scheinbar gar nicht funktionieren. Lies den Abschnitt
> **"Wenn Padding-Klassen nicht wirken: Der @layer-Bug"** bevor du in die DevTools schaust.

---

## Das Spacing-System in Tailwind

In Flutter schreibst du Abstände in Pixeln:

```dart
Padding(
  padding: EdgeInsets.fromLTRB(8, 8, 0, 8),
  child: ...,
)
```

In Tailwind gibt es **keine Pixel-Klassen** (außer für Ausnahmen). Stattdessen
gibt es ein **einheitliches Raster mit der Basis 4px**:

| Tailwind-Klasse | Pixel-Wert | Flutter-Äquivalent |
|---|---|---|
| `p-0` | 0px | `EdgeInsets.zero` |
| `p-1` | 4px | `EdgeInsets.all(4)` |
| `p-2` | 8px | `EdgeInsets.all(8)` |
| `p-3` | 12px | `EdgeInsets.all(12)` |
| `p-4` | 16px | `EdgeInsets.all(16)` |
| `p-6` | 24px | `EdgeInsets.all(24)` |
| `p-8` | 32px | `EdgeInsets.all(32)` |

**Die Regel:** Figma gibt Pixel → du nimmst den Wert ÷ 4 → das ist die Tailwind-Zahl.
`8px ÷ 4 = 2` → `p-2`. `16px ÷ 4 = 4` → `p-4`.

---

## Padding vs. Gap – zwei verschiedene Konzepte

Bevor wir loslegen, ein wichtiger Unterschied:

```
┌─────────────────────────────────┐
│  padding: 16px                  │  ← Innenabstand: Raum zwischen Kante und Inhalt
│  ┌─────────────────────────┐    │
│  │  Element A              │    │
│  └─────────────────────────┘    │
│   ↕ gap: 16px                   │  ← Gap: Raum zwischen zwei Elementen
│  ┌─────────────────────────┐    │
│  │  Element B              │    │
│  └─────────────────────────┘    │
└─────────────────────────────────┘
```

| Konzept | CSS | Tailwind | Flutter-Äquivalent |
|---|---|---|---|
| Innenabstand (alle Seiten) | `padding: 16px` | `p-4` | `Padding(padding: EdgeInsets.all(16))` |
| Innenabstand (nur links/rechts) | `padding-left + padding-right` | `px-4` | `EdgeInsets.symmetric(horizontal: 16)` |
| Innenabstand (nur oben/unten) | `padding-top + padding-bottom` | `py-4` | `EdgeInsets.symmetric(vertical: 16)` |
| Innenabstand (einzelne Seite) | `padding-left: 8px` | `pl-2` | `EdgeInsets.only(left: 8)` |
| Abstand zwischen Kindern | `gap: 16px` (in Flexbox) | `gap-4` | `Column(mainAxisSpacing: 16)` |

---

## Die zwei Ebenen der Sidebar

Die Sidebar hat **zwei unabhängige Spacing-Ebenen**. Das ist wichtig um zu
verstehen *wo* welcher Abstand eingestellt wird:

```
┌──────── AppLayout (gesamter Viewport) ──────────────────────────────────────┐
│                                                                              │
│  ←8px→ ┌────────────── <aside> (232px breit) ────────┐  ┌─── Content ────┐ │
│   ↑    │  ↑8px                                        │  │                │ │
│   8px  │  ┌──────── Sidebar-Karte (bg-surface) ────┐  │  │                │ │
│   ↓    │  │  ↑16px                                 │  │  │                │ │
│        │  │  ┌──── Logo ────────────────────────┐  │  │  │                │ │
│        │  │  └──────────────────────────────────┘  │  │  │                │ │
│        │  │    ↕ gap-4 (16px)                       │  │  │                │ │
│        │  │  ┌──── Nav-Links ───────────────────┐   │  │  │                │ │
│        │  │  └──────────────────────────────────┘   │  │  │                │ │
│        │  │    ↕ gap-4 (16px)                        │  │  │                │ │
│        │  │  ┌──── User-Bereich ────────────────┐   │  │  │                │ │
│        │  │  └──────────────────────────────────┘   │  │  │                │ │
│        │  │  ↓16px                                   │  │  │                │ │
│        │  └─────────────────────────────────────────┘  │  │                │ │
│        │  ↓8px                                          │  └────────────────┘ │
│        └──────────────────────────────────────────────┘                      │
└──────────────────────────────────────────────────────────────────────────────┘

Ebene 1 → <aside>:        Außenabstand der Karte vom Viewport-Rand
Ebene 2 → Sidebar-Karte:  Innenabstand des Inhalts von der Kartenkante
```

**Ebene 1 – `<aside>`** steuert den Abstand zwischen dem Sidebar-Bereich und
der Sidebar-Karte (das weiße Rechteck mit Schatten). Figma-Werte:
- Oben: **8px**
- Unten: **8px**
- Links: **8px**
- Rechts: **0px** (die Karte geht bündig bis zum Content-Bereich)

**Ebene 2 – die Karte selbst** steuert den Abstand zwischen der Kartenkante
und dem Inhalt (Logo, Navigation, User). Figma-Wert: **16px** auf allen Seiten.

---

## Tailwind-Klassen für asymmetrisches Padding

Wenn alle 4 Seiten gleich sind: `p-2` (8px).
Wenn 3 Seiten gleich sind und eine abweicht, kombinierst du zwei Klassen:

```tsx
// 8px oben/unten, 8px links, 0px rechts
className="py-2 pl-2"
//   ↑              ↑
//   oben + unten   links

// Entspricht in Flutter:
// EdgeInsets.fromLTRB(8, 8, 0, 8)
// oder: EdgeInsets.only(top: 8, bottom: 8, left: 8)
```

**Warum `py-2 pl-2` und nicht `pt-2 pb-2 pl-2`?**

`py-2` ist die Kurzform für `pt-2 pb-2` (Padding Y-Achse = oben + unten).
Weniger Klassen = lesbarer Code. Die Prioritätsregel:

```
p-*     → alle 4 Seiten (am kürzesten)
px-*    → links + rechts
py-*    → oben + unten
pt-*, pr-*, pb-*, pl-*  → einzelne Seiten (nur wenn nötig)
```

Kombinationen werden **von spezifisch zu allgemein** aufgelöst: `py-2 pr-4` bedeutet
oben/unten 8px, rechts 16px, links 0px. Die spezifischere Klasse (`pr-4`) gewinnt
über die allgemeinere (`py-2`).

---

## ⚠️ Wenn Padding-Klassen nicht wirken: Der `@layer`-Bug

Das ist die **häufigste Ursache** dafür dass Tailwind-Spacing-Klassen scheinbar
ignoriert werden. Symptom: Du gibst einem Element `py-8` (= 32px), aber im Browser
sind im Box-Model-Diagramm der DevTools überall **0** zu sehen.

### Die Ursache: CSS Cascade Layers

In Tailwind v4 sind alle Utility-Klassen in einem CSS Layer namens `@layer utilities`.
CSS hat eine kritische Regel für Layers:

> **Unlayered CSS (ohne `@layer`) schlägt IMMER alle layered Styles – egal wie
> spezifisch die Klasse ist.**

Die Prioritäts-Reihenfolge in Tailwind v4:

```
1. Unlayered CSS      → gewinnt gegen alles
2. @layer utilities   → Tailwinds py-*, pl-*, p-*, gap-*, ...
3. @layer components  → Tailwinds Komponenten-Klassen
4. @layer base        → Tailwinds Preflight / Reset
```

### Das Problem in `src/index.css`

Ein CSS-Reset wie dieser ist unlayered – er schlägt alle Tailwind-Utilities:

```css
/* ❌ So nicht – dieser Reset überschreibt ALLE Tailwind-Padding/Margin-Klassen */
*,
*::before,
*::after {
  margin: 0;
  padding: 0;  /* ← gewinnt gegen py-8, pl-2, gap-4 und alle anderen */
}
```

Du kannst `py-8` schreiben so oft du willst – dieser eine Selektor macht es unsichtbar.

### Die Lösung: Reset in `@layer base` verschieben

```css
/* ✅ So – @layer base verliert gegen @layer utilities */
@layer base {
  *,
  *::before,
  *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;  /* ← verliert jetzt gegen py-8, pl-2 usw. */
  }

  html {
    -webkit-font-smoothing: antialiased;
  }
}
```

Überprüfe `src/index.css` und stelle sicher, dass der Reset so aussieht.

### Wie erkennst du diesen Bug?

1. Du gibst einem Element eine Tailwind-Padding-Klasse (z.B. `py-8`)
2. Im Browser ist optisch kein Abstand zu sehen
3. Du öffnest DevTools → Rechtsklick → Inspect → Computed-Tab → Box Model
4. Das Box Model zeigt **0** für padding – obwohl die Klasse im HTML-Code steht

Wenn das passiert: **Zuerst `src/index.css` prüfen** ob der Reset in `@layer base` ist.

---

## Was du konkret änderst

### Schritt 0: `src/index.css` – Reset in `@layer base` prüfen

Öffne `src/index.css` und stelle sicher, dass der Reset-Block so aussieht:

```css
@import "tailwindcss";
@import "./styles/token.css";

@theme {
  /* ... Token-Definitionen ... */
}

@layer base {
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
}
```

Wenn der `@layer base {}`-Wrapper fehlt, füge ihn jetzt ein.

---

### Schritt 1: Ebene 1 – `<aside>` Padding korrigieren

Suche in `src/layouts/Sidebar.tsx` diese Zeile:

```tsx
// Vorher (p-2 = 8px auf allen 4 Seiten)
<aside className="w-[232px] shrink-0 p-2 flex flex-col">
```

Ändere `p-2` auf `py-2 pl-2`:

```tsx
// Nachher (8px oben/unten/links, 0px rechts)
<aside className="w-[232px] shrink-0 py-2 pl-2 flex flex-col">
```

**Was sich ändert:** Die Karte sitzt jetzt bündig am rechten Rand des
`<aside>`-Elements – ohne Lücke zum Content-Bereich.

---

### Schritt 1b: `AppLayout.tsx` und `<aside>` – Hintergrundfarbe setzen

Der Abstand ist jetzt technisch vorhanden – aber er ist **unsichtbar**, weil der
Hintergrund hinter der Karte dieselbe Farbe hat wie die Karte selbst (beide weiß).

Damit der 8px Abstand sichtbar wird, braucht der gesamte App-Hintergrund die
Token-Farbe `bg-surface-container` (`#f2f7f7` – ein helles Grau-Grün).
Das macht die weiße Sidebar-Karte auf dem leicht gefärbten Hintergrund sichtbar.

**In `src/layouts/AppLayout.tsx`** – Root-Div:

```tsx
// Vorher
<div style={{ display: 'flex', minHeight: '100vh' }}>

// Nachher – Tailwind-Klassen statt inline style + Hintergrundfarbe
<div className="flex min-h-screen bg-surface-container">
```

**In `src/layouts/Sidebar.tsx`** – `<aside>`:

```tsx
// Nachher – Hintergrundfarbe damit der Padding-Bereich sichtbar ist
<aside className="w-[232px] shrink-0 py-2 pl-2 flex flex-col bg-surface-container">
```

> **Warum die gleiche Farbe auf beiden?**
> Der `<aside>`-Bereich und der AppLayout-Hintergrund sollen optisch verschmelzen.
> Die Sidebar-**Karte** hebt sich davon ab (`bg-surface` = weiß). Das ergibt den
> sauberen Figma-Look: heller Hintergrund, weiße Karte mit leichtem Schatten.

---

### Schritt 2: Ebene 2 – Karten-Padding prüfen

Das innere Padding der Karte ist bereits korrekt. Prüfe nur, dass es so aussieht:

```tsx
<div
    className="flex-1 flex flex-col gap-4 p-4 rounded-3xl bg-surface overflow-hidden"
    style={{ boxShadow: '...' }}
>
```

| Klasse | Wert | Bedeutung |
|---|---|---|
| `p-4` | 16px | Innenabstand Inhalt von der Kartenkante (alle 4 Seiten) |
| `gap-4` | 16px | Abstand zwischen Logo, Nav-Bereich und User-Bereich |

Diese Werte sind bereits korrekt und müssen nicht geändert werden.

---

### Schritt 3: Logo-Bereich Padding prüfen

Der Logo-Bereich hat ein eigenes Padding:

```tsx
<div className="px-3 py-2">
    <span ...>Lernwelt</span>
</div>
```

`px-3` = 12px links/rechts, `py-2` = 8px oben/unten.

> **Prüfe das mit Figma:** Wenn der Designer einen anderen Wert für den Logo-Abstand
> vorgibt, passe `px-3` und `py-2` entsprechend an. Faustregel: Figma-Pixel ÷ 4 = Tailwind-Zahl.

---

## Warum nicht einfach `style={{ padding: '8px 0 8px 8px' }}`?

Du könntest das Padding auch inline als `style`-Prop schreiben:

```tsx
// ❌ Nicht so
<aside style={{ padding: '8px 0 8px 8px' }}>
```

Das funktioniert technisch – aber es verstößt gegen die Projekt-Konvention.
Tailwind-Klassen sind:

1. **Konsistent:** Jeder liest `py-2 pl-2` und weiß sofort die Pixel-Werte (2 × 4 = 8px)
2. **Wartbar:** Alle Abstände folgen dem gleichen Raster – kein Mix aus beliebigen Pixel-Werten
3. **Performant:** Tailwind generiert eine CSS-Klasse pro Wert, kein inline-CSS
4. **Kein Dark Mode Problem:** Inline-Styles können nicht auf CSS-Variablen reagieren

**Ausnahme:** Wenn ein Wert kein Tailwind-Äquivalent hat (z.B. der komplexe `boxShadow`
in der Sidebar), ist `style` akzeptabel – aber nur als bewusster Ausnahmefall.

---

## Das vollständige Ergebnis

Nach den Änderungen sieht die `<aside>` so aus:

```tsx
export function Sidebar() {
    const { t } = useTranslation();

    return (
        <aside className="w-[232px] shrink-0 py-2 pl-2 flex flex-col bg-surface-container">
            {/*              ↑ 8px oben/unten/links, 0px rechts        ↑ gleiche Farbe wie AppLayout */}

            <div
                className="flex-1 flex flex-col gap-4 p-4 rounded-3xl bg-surface overflow-hidden"
                {/*                              ↑        ↑                              */}
                {/*                             gap 16px  Innenabstand 16px alle Seiten  */}
                style={{ boxShadow: '...' }}
            >
                <div className="px-3 py-2">
                    {/* Logo */}
                </div>

                <nav className="flex-1">
                    {/* Nav-Links */}
                </nav>

                <div>
                    {/* User-Bereich */}
                </div>
            </div>
        </aside>
    );
}
```

Und `AppLayout.tsx`:

```tsx
// Root-Div: Tailwind statt inline style + Hintergrundfarbe
<div className="flex min-h-screen bg-surface-container">
    <Sidebar />
    ...
</div>
```

---

## Checkliste: Schritt 5

- [ ] `src/index.css`: Reset-Block ist in `@layer base {}` eingewickelt
- [ ] `AppLayout.tsx`: Root-Div hat `className="flex min-h-screen bg-surface-container"` (kein inline style)
- [ ] `<aside>`: Klassen sind `py-2 pl-2 bg-surface-container` (8px oben/unten/links, kein rechts)
- [ ] Karten-`<div>`: `p-4` und `gap-4` sind vorhanden und unverändert
- [ ] `pnpm dev` gestartet – Sidebar liegt visuell korrekt im Browser
- [ ] Browser DevTools → Box Model des `<aside>` zeigt: top **8**, right **0**, bottom **8**, left **8**
- [ ] Sidebar-Karte hat sichtbaren Abstand zum Viewport-Rand (heller `surface-container`-Hintergrund)

**Wenn alles grün ist → fertig mit dem Sidebar-Tutorial!**

---

## Bonus: Spacing in den DevTools prüfen

Du kannst jeden Abstand im Browser überprüfen ohne Figma zu öffnen:

1. Rechtsklick auf die Sidebar → "Untersuchen" (Inspect)
2. Im Elements-Panel das `<aside>`-Element anklicken
3. Rechts im "Computed"-Tab → ganz unten das **Box Model Diagramm**
4. Du siehst ein orange-gelbes Rechteck mit den tatsächlichen Padding-Werten

Das ist das Web-Äquivalent von Flutter's Layout-Explorer in den DevTools.
