# Sidebar Tutorial – Teil 3: Die NavItem-Komponente

> **Du erstellst in diesem Kapitel eine neue Datei:**
> `src/layouts/SidebarNavItem.tsx`
>
> Die Erklärungen am Anfang sind Theorie zum Verstehen. Der Abschnitt
> **"Die vollständige `SidebarNavItem`-Komponente"** weiter unten ist die
> eigentliche Umsetzung – dort steht der Code, den du kopieren und einfügen sollst.

## Warum eine eigene Komponente für jeden Menüpunkt?

In Teil 2 haben wir 5 Menüpunkte definiert. Wir könnten jetzt 5 mal denselben
JSX-Block wiederholen. Aber das verletzt das "Don't Repeat Yourself"-Prinzip.

Stattdessen bauen wir eine `SidebarNavItem`-Komponente, die einen `NavItem`
als Prop bekommt und ihn passend rendert.

**Vergleich mit Flutter:**
- Flutter: ein Widget mit Parametern
- React: eine Funktion mit Props (= Parametern)

```
SidebarNavItem nimmt:          Und rendert:
{ label: "Lernplan",    →      <NavLink to="/courses" ...>
  to: "/courses",               📅 Lernplan
  icon: "calendar_today" }     </NavLink>
```

> **Wichtig:** `label` ist hier bereits der **übersetzte Text** (`"Lernplan"`),
> nicht der i18n-Key (`"navigation.learningPlan"`). Die Übersetzung mit `t()`
> passiert in `Sidebar.tsx` – `SidebarNavItem` weiß nichts von i18n und bleibt
> damit eine einfache, fokussierte Render-Komponente.

---

## ⚠️ Wichtige Regel: Niemals Farben direkt verwenden

Seit Schritt 2a haben wir ein Token-System mit CSS Custom Properties.
Die goldene Regel lautet:

```tsx
// ❌ Niemals – bricht beim Dark Mode
backgroundColor: '#c7f0e9'
color: '#004f42'

// ✅ Immer – wechselt automatisch mit dem Theme
className="bg-primary-container text-on-primary-container"
// Oder als CSS-Variable:
style={{ color: 'var(--schemes-on-primary-container)' }}
```

Warum ist das so wichtig? Das Token `--schemes-primary-container` ist im
Light Mode `#c7f0e9`, im Dark Mode aber `#004f42` (die Farben tauschen sich).
Wenn du den Hex-Wert fest einträgst, bekommst du im Dark Mode die falsche Farbe.

---

## Was ist `NavLink`?

`NavLink` kommt von React Router und ist ein spezieller Link, der
**automatisch erkennt ob seine Route gerade aktiv ist**.

```typescript
import { NavLink } from 'react-router-dom';

// NavLink rendert ein <a href="...">, aber...
// ... wenn die aktuelle URL mit `to` übereinstimmt,
// wird isActive = true
<NavLink to="/courses">
  Lernplan
</NavLink>
```

Der Unterschied zu einem normalen `<a href="...">`:

| | `<a href>` | `NavLink` |
|---|---|---|
| Navigation | ✅ Ja (Seiten-Reload) | ✅ Ja (React Router, kein Reload) |
| Aktiv-State | ❌ Nein | ✅ Ja (`isActive`) |
| Browser-History | ❌ Nein | ✅ Ja (Zurück-Button funktioniert) |

---

## Der aktive Zustand: `className` Callback

`NavLink` unterstützt neben `style` auch einen `className` Callback.
Das ist der richtige Weg wenn wir Tailwind nutzen:

```typescript
<NavLink
  to="/courses"
  className={({ isActive }) =>
    isActive
      ? 'bg-primary-container text-on-primary-container'
      : 'text-on-surface-variant'
  }
>
  Lernplan
</NavLink>
```

**Was ist `({ isActive }) => ...`?**

Das ist ein Callback (Rückruf-Funktion). Statt einen festen Klassennamen zu übergeben,
gibst du eine Funktion, die React Router mit `{ isActive: true/false }` aufruft.
React Router kümmert sich darum, den aktiven Zustand zu erkennen.

**Warum `className` statt `style`?**

Weil unser Styling-System (seit Schritt 2a) auf Tailwind aufbaut. Tailwind-Klassen
wie `bg-primary-container` lesen automatisch die CSS-Variablen aus `tokens.css`.
Dark Mode funktioniert damit ohne zusätzlichen Code.

---

## Die vollständige `SidebarNavItem`-Komponente

> **Jetzt umsetzen – erstelle diese Datei:**
> `src/layouts/SidebarNavItem.tsx`
>
> Lege die Datei an und füge den folgenden Code vollständig ein.
> Diese Datei kommt **nicht** in einen `features/`-Ordner,
> weil sie kein Feature ist. Sie ist ein interner Baustein von `Sidebar.tsx`.

```typescript
// src/layouts/SidebarNavItem.tsx
import { NavLink } from 'react-router-dom';

// Props Interface: Was braucht diese Komponente?
// (entspricht dem NavItem Interface aus Teil 2)
interface SidebarNavItemProps {
  label: string;
  to: string;
  icon: string;
}

export function SidebarNavItem({ label, to, icon }: SidebarNavItemProps) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        [
          // Basis-Styles: immer gleich
          'flex items-center gap-2',
          'px-3 py-2 rounded-full',   // Pill-Form aus Figma (rounded-full = border-radius: 9999px)
          'w-full no-underline',
          'font-text text-base leading-6', // Token: Inter, 16px, 24px Zeilenhöhe
          // Dynamisch: aktiv vs. inaktiv
          isActive
            ? 'bg-primary-container text-on-primary-container font-medium'
            : 'text-on-surface-variant',
        ].join(' ')
      }
    >
      {/* Icon: Platzhalter-Text bis das Icon-System eingerichtet ist */}
      <span
        className="w-5 h-5 shrink-0 flex items-center justify-center text-xl"
        aria-hidden="true"
      >
        {icon}
      </span>

      {/* Label */}
      <span className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap">
        {label}
      </span>
    </NavLink>
  );
}
```

### Was passiert hier Schritt für Schritt?

**1. Props destructuring:**
```typescript
function SidebarNavItem({ label, to, icon }: SidebarNavItemProps)
```
Statt `props.label`, `props.to`, etc. schreiben wir direkt `{ label, to, icon }`.
Das ist "destructuring" – eine JavaScript-Kurzschreibweise.

**2. `className={({ isActive }) => [...].join(' ')}`:**
Wir bauen ein Array von Klassen zusammen und verbinden sie mit Leerzeichen.
Das ist ein verbreitetes Muster um bedingte Tailwind-Klassen übersichtlich zu halten.

**3. Tailwind-Tokens aus unserem Design-System:**

| Klasse | CSS-Variable | Wert (Light) |
|--------|-------------|--------------|
| `bg-primary-container` | `--schemes-primary-container` | `#c7f0e9` |
| `text-on-primary-container` | `--schemes-on-primary-container` | `#004f42` |
| `text-on-surface-variant` | `--schemes-on-surface-variant` | `#3f4948` |
| `font-text` | `--font-family-text` | Inter |

Diese Werte stehen in `src/styles/tokens.css` und `src/index.css (@theme)`.
Im Dark Mode wechseln die CSS-Variablen automatisch – die Tailwind-Klassen bleiben gleich.

**4. `aria-hidden="true"` am Icon:**
Das Icon ist dekorativ (das Label sagt schon was gemeint ist).
Screen-Reader sollen es überspringen – das ist Accessibility (a11y).

**5. `text-ellipsis overflow-hidden whitespace-nowrap`:**
Wenn der Label-Text zu lang ist, wird er mit "..." abgeschnitten statt umzubrechen.

---

## Icon-Platzhalter

Im Code übergeben wir Strings wie `'⊞'` oder `'📅'` als Icon.
Das sind vorerst Platzhalter.

Das Styling-System ist entschieden (Tailwind + CSS Custom Properties, ADR 0006),
aber die finale Icon-Library steht noch aus. Wenn sie eingebunden ist, wird
nur das Rendering im `<span>` geändert – der Rest der Komponente bleibt gleich:

```typescript
// Später, mit Material Symbols (Google Fonts):
<span className="material-symbols-rounded w-5 h-5 shrink-0 text-xl">{icon}</span>

// Oder mit lucide-react:
<LucideIcon name={icon} size={20} className="shrink-0" />
```

Die `NavItem`-Typdefinition und alle anderen Teile ändern sich **nicht**.

---

## Was haben wir nach Teil 3?

Eine fertige `SidebarNavItem`-Komponente, die:
- Einen Link rendert, der automatisch den aktiven Zustand erkennt
- Im aktiven Zustand mintgrün aussieht (via CSS-Token → Dark Mode ready)
- Im inaktiven Zustand neutral ist
- Tailwind-Klassen statt hardcodierter Farben verwendet
- Zugänglich (`aria-hidden`) ist

→ [Teil 4: Die Sidebar zusammenbauen](./04-sidebar-zusammenbauen.md)
