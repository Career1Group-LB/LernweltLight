# 02b – Warum brauchen wir Tailwind? (Hintergrundwissen)

> **Dieses File ist kein Tutorial** – es ist Hintergrundwissen. Du musst hier nichts ausführen.
> Es erklärt *warum* die Entscheidungen in [02a](./02a-styling-und-dark-mode.md) so getroffen wurden.

---

## Das Grundproblem: Browser verstehen kein Flutter

In Flutter hat das Widget-System Styling **eingebaut**:

```dart
Container(
  color: Colors.blue,
  padding: EdgeInsets.all(16),
  child: Text('Hallo'),
)
```

Du schreibst Farben, Abstände und Schriften direkt als Widget-Properties. Flutter rendert alles selbst auf einem Canvas – es gibt kein separates "Styling-System", das du konfigurieren musst.

Im Web ist das komplett anders. Der Browser versteht nur **HTML + CSS**. Dein JSX (`<div>`, `<h1>`, usw.) wird zu HTML, und ohne CSS sieht alles aus wie ein Word-Dokument aus den 90ern: schwarze Schrift, weißer Hintergrund, blaue Links, keine Abstände.

**Du brauchst immer einen CSS-Ansatz.** Die Frage ist nur: welchen?

---

## Die vier Wege um CSS zu schreiben

Es gibt nicht "den einen richtigen Weg". Jedes Projekt wählt einen Ansatz, und jeder hat Vor- und Nachteile.

### 1. Plain CSS-Dateien

```css
/* styles.css */
.card { background: white; padding: 16px; border-radius: 8px; }
.card-title { font-size: 20px; font-weight: bold; }
```

```tsx
import './styles.css';
<div className="card"><h2 className="card-title">...</h2></div>
```

**Problem:** Bei einem großen Projekt mit vielen Entwicklern entstehen schnell Namens-Konflikte (zwei Dateien definieren `.card` anders) und es gibt kein einheitliches System. Du musst immer zwei Dateien synchron halten: die `.tsx`-Datei und die `.css`-Datei.

---

### 2. CSS Modules

```css
/* Card.module.css */
.card { background: white; padding: 16px; }
```

```tsx
import styles from './Card.module.css';
<div className={styles.card}>...</div>
```

Klassen werden automatisch einzigartig gemacht (`Card_card__x3j2k`) – keine Konflikte mehr. Aber: Für jede Komponente brauchst du eine extra `.module.css`-Datei. Und Dark Mode musst du komplett selbst bauen – da hilft dir CSS Modules nicht.

---

### 3. CSS-in-JS (Emotion, styled-components)

Das nutzt das **Client Office Frontend** mit `@emotion/react`:

```tsx
import { css } from '@emotion/react';

const cardStyle = css`
  background: white;
  padding: 16px;
`;

<div css={cardStyle}>...</div>
```

Styling wird direkt im JavaScript geschrieben. Keine separaten Dateien, kein Namens-Chaos. Aber: CSS wird **zur Laufzeit** generiert (Performance-Overhead), und Dark Mode ist immer noch manuell aufwendig.

> **Fazit Client Office:** Die verwenden Emotion + Bootstrap. Bootstrap ist ein fertiges Komponenten-System mit Klassen wie `btn btn-primary col-md-6`. Das ist einfach zu starten, aber sehr unflexibel bei eigenem Design und hat keinen guten Dark-Mode-Support.

---

### 4. Tailwind CSS (unser Ansatz)

Tailwind ist ein "Utility-First" System: Es gibt keine vorgefertigten Komponenten, sondern hunderte kleine Klassen für jede CSS-Property:

```tsx
<div className="bg-white p-4 rounded-xl flex gap-2 text-gray-800">
  <h2 className="text-xl font-bold">Hallo</h2>
</div>
```

**Vorteile:**
- Kein Wechsel zwischen Dateien – Styling ist direkt sichtbar im JSX
- Tailwind entfernt im Build alle ungenutzten Klassen → sehr kleines Bundle
- Perfekte Integration mit CSS Custom Properties (→ Dark Mode)
- Riesige Community, hervorragende Doku

**Nachteil:** Der JSX-Code wird optisch "unübersichtlicher" (viele Klassen in einem String). Das ist Gewöhnungssache.

---

## Das eigentliche Problem: Dark Mode & Multi-Tenancy

Tailwind wäre schon gut, aber der *eigentliche* Grund warum wir es mit **CSS Custom Properties kombinieren** ist der Dark Mode – und langfristig auch die Mandantenfähigkeit (verschiedene Kunden mit verschiedenen Farben).

### Das Szenario ohne Token-System

Stell dir vor, wir haben 200 Komponenten und überall stehen konkrete Farbwerte:

```tsx
<div className="bg-[#ffffff] text-[#161d1d] border-[#e0e0e0]">
// oder
<div style={{ background: '#ffffff', color: '#161d1d' }}>
```

Jetzt kommt der Designer und sagt: "Wir bauen jetzt Dark Mode ein."

Das bedeutet: **Jede einzelne Farbangabe in jeder Datei** muss überarbeitet werden. Bei 15+ Features und hunderten Komponenten ist das wochenlanger Refactoring-Aufwand – und extrem fehleranfällig.

### Die Lösung: Design Tokens (CSS Custom Properties)

Farben werden **nie direkt** verwendet, sondern immer über benannte Token-Variablen:

```css
/* tokens.css – eine einzige Datei definiert alle Farben */
:root {
  --schemes-surface:    #ffffff;  /* Light Mode */
  --schemes-on-surface: #161d1d;
}

:root[data-theme="dark"] {
  --schemes-surface:    #0e1514;  /* Dark Mode */
  --schemes-on-surface: #dde4e3;
}
```

Und Tailwind wird so konfiguriert, dass `bg-surface` automatisch `var(--schemes-surface)` bedeutet:

```tsx
<div className="bg-surface text-on-surface">
```

**Dark Mode aktivieren** = einfach `data-theme="dark"` auf `<html>` setzen.
Das passiert durch den `useThemeStore`. Keine einzige Komponente wird dabei angefasst.

### Grafisch dargestellt

```
User klickt "Dark Mode"
        ↓
useThemeStore.setTheme('dark')
        ↓
document.documentElement.setAttribute('data-theme', 'dark')
        ↓
CSS: :root[data-theme='dark'] wird aktiv
        ↓
--schemes-surface wechselt von #ffffff auf #0e1514
        ↓
ALLE Komponenten mit bg-surface zeigen automatisch die neue Farbe
        ↓
Kein Komponentencode wurde angefasst ✓
```

### Und Multi-Tenancy?

Das gleiche Prinzip gilt für Mandanten. Kunde A hat eine grüne Primärfarbe, Kunde B eine blaue. Der Backend-Config-Service schickt beim App-Start die Farben des jeweiligen Kunden. Das Frontend überschreibt einfach die CSS-Variablen:

```typescript
// Beim App-Start: Tenant-Farben vom Backend holen und CSS-Variablen überschreiben
document.documentElement.style.setProperty('--schemes-primary', tenant.primaryColor);
```

Alle Komponenten übernehmen die Farbe automatisch. Kein separates Build pro Kunde notwendig.

---

## Vergleich der Optionen für unser Projekt

| Option | Dark Mode Aufwand | Multi-Tenancy | Bundle-Größe | Unsere Wahl |
|---|---|---|---|---|
| **Tailwind + CSS Variables** | 🟢 Automatisch | 🟢 Automatisch | 🟢 Klein (unused CSS wird entfernt) | ✅ Ja |
| CSS Modules | 🔴 Manuell für jede Komponente | 🔴 Sehr aufwendig | 🟡 Mittel | ❌ |
| Plain CSS | 🔴 Manuell | 🔴 Sehr aufwendig | 🔴 Wächst unbegrenzt | ❌ |
| Emotion / CSS-in-JS | 🟡 ThemeProvider nötig | 🟡 Möglich aber komplex | 🔴 Laufzeit-Overhead | ❌ |

---

## Warum das Client Office einen anderen Weg ging

Das Client Office hat Bootstrap gewählt – das war für einen schnellen Start sinnvoll. Bootstrap bringt fertige Komponenten mit (Buttons, Dropdowns, Grids) und man muss wenig selbst bauen.

Der Trade-off:
- **Vorteil:** Schnell startklar, viele fertige Bausteine
- **Nachteil:** Bootstrap-Styles sind schwer zu überschreiben, Dark Mode ist nachträglich sehr aufwendig einzubauen, und bei einem eigenen Design-System (wie Lernwelt es hat) kommt man schnell in Konflikt mit Bootstrap's Meinungen

Für Lernwelt haben wir ein eigenes Design-System vom Designer (Figma, Material Design 3 Tokens) – da macht Bootstrap wenig Sinn. Tailwind ist absichtlich meinungslos bezüglich Komponenten-Design und passt deshalb besser.

---

## Zusammenfassung: Was du dir merken solltest

1. **Im Web brauchst du immer einen CSS-Ansatz** – es gibt kein eingebautes Widget-System wie in Flutter.

2. **Tailwind ist "nur" ein komfortables Helfer-Tool** – es erzeugt am Ende normales CSS. Du könntest das gleiche auch mit Plain CSS + CSS Variables erreichen, aber es wäre mehr Tipp-Arbeit und weniger strukturiert.

3. **Das Entscheidende ist das Token-System (CSS Custom Properties)** – Tailwind ohne Tokens wäre für Dark Mode genauso schlimm wie hardcodierte Farben. Die Kombination aus beidem macht den Unterschied.

4. **"Niemals Farbwerte direkt verwenden"** ist die wichtigste Regel:
   ```tsx
   // ❌ Diese Zeilen schreiben wir NIE
   <div className="bg-[#ffffff] text-[#161d1d]">
   <div style={{ color: '#161d1d' }}>
   
   // ✅ Immer Token-Klassen
   <div className="bg-surface text-on-surface">
   ```

---

**Weiter zu:** [02a – Styling-System & Dark Mode einrichten](./02a-styling-und-dark-mode.md) (das eigentliche Setup-Tutorial)
