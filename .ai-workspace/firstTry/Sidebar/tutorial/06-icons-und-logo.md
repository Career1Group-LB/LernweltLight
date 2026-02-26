# Sidebar Tutorial – Teil 6: Icons und Logo (Assets)

> **Du änderst in diesem Kapitel mehrere Dateien und erstellst neue:**
>
> | Aktion | Datei |
> |--------|-------|
> | NEU erstellen | `src/shared/components/Icon.tsx` |
> | NEU erstellen | `src/shared/components/Logo.tsx` |
> | NEU erstellen | `src/assets/logos/` (Ordner + Placeholder) |
> | Anpassen | `src/index.css` |
> | Anpassen | `src/layouts/SidebarNavItem.tsx` |
> | Anpassen | `src/layouts/Sidebar.tsx` |
>
> Lies zuerst die Theorie-Abschnitte – sie erklären warum die Architektur so ist.
> Die konkreten Code-Blöcke folgen danach in der Umsetzung.

---

## Was der Designer vorgibt (Figma-Analyse)

### Icons: Material Symbols als Variable Font

Der Designer hat in Figma explizit spezifiziert:

> **Icon Set:** Material Symbols (als Icon Font)
> **Variante:** Rounded
> **Fill:** True und False nutzbar

Das ist eine präzise technische Angabe. "Als Icon Font" bedeutet: keine SVG-Dateien
pro Icon, sondern eine einzige Font-Datei deren Glyphen die Icons sind.

**Was "Fill: True und False nutzbar" bedeutet:**

Material Symbols ist eine **Variable Font** – eine einzige Schriftdatei mit
einstellbaren Achsen. Die `FILL`-Achse steuert ob ein Icon ausgefüllt oder
nur als Outline dargestellt wird:

```
FILL 0  →  □ Nur Kontur (inaktiver Menüpunkt)
FILL 1  →  ■ Ausgefüllt (aktiver Menüpunkt)
```

Das sieht man direkt in der Sidebar: "Dashboard" (aktiv) hat ein ausgefülltes
Haus-Icon, "Lernplan" (inaktiv) hat ein Kontur-Kalender-Icon.

### Logo: Multi-Tenant + Dark Mode

Der Designer hat in Figma dokumentiert:

> **Beim Einsatz dieser Komponente müssen die Properties an Variables geknüpft
> werden, damit sich das Logo je nach Brand und je nach Light/Dark Mode ändert**
>
> - Company Property: An Company Variable knüpfen
> - Mode Property: An Mode Variable knüpfen

Das bedeutet: Das Logo ist **nicht statisch**. Es gibt:
1. Verschiedene Logos pro Mandant (onecareer, ChapterNEXT, ...)
2. Verschiedene Logo-Varianten pro Theme (Light Mode, Dark Mode)

Das Logo kommt deshalb **aus der Backend-Config** – nicht aus dem Frontend-Code.
(Dieses Konzept steht in `AGENTS.md` unter "Branding / Multi-Tenant".)

---

## Schritt 1: Material Symbols installieren

### Warum npm-Paket statt Google Fonts CDN?

Es gibt zwei Wege um Material Symbols zu laden:

**Option A – Google Fonts CDN:**
```html
<!-- index.html -->
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded..." rel="stylesheet"/>
```
Vorteil: Eine Zeile. Nachteil: Braucht Internetverbindung beim ersten Load, langsamer,
CDN-Abhängigkeit in Produktion.

**Option B – npm-Paket (Best Practice):**
```bash
pnpm add material-symbols
```
Vorteil: Selbst-gehostet, funktioniert offline, liegt im Bundle, kein CDN-Risiko.
Das ist die empfohlene Variante für ein Produktionsprojekt.

### Installation

```bash
pnpm add material-symbols
```

### Import in `src/index.css`

Füge nach dem `@import "tailwindcss"` den Font-Import hinzu:

```css
@import "tailwindcss";
@import "material-symbols/rounded";   /* ← neu */
@import "./styles/token.css";

@theme {
  /* ... */
}

@layer base {
  /* ... */
}
```

**Warum `material-symbols/rounded`?**
Das Paket bietet drei Varianten: `outlined`, `rounded`, `sharp`.
Der Designer hat **Rounded** spezifiziert.

---

## Schritt 2: Die `Icon`-Komponente

### Wo sie hingehört

Icons sind eine **shared Komponente** – sie werden in der Sidebar, im Header und
in zukünftigen Features verwendet. Deshalb:

```
src/shared/components/Icon.tsx   ← hier
```

`shared/components/` ist der richtige Ort für wiederverwendbare UI-Bausteine
die kein Feature-Wissen haben (vgl. AGENTS.md – Feature Module Rules).

### Warum eine eigene Komponente?

Du könntest Material Symbols direkt so benutzen:

```tsx
<span className="material-symbols-rounded">home</span>
```

Das Problem: Kein TypeScript, kein einheitliches Fill-Verhalten, kein konsistentes
Sizing. Überall unterschiedlicher Code.

Eine zentrale `Icon`-Komponente gibt dir:
- TypeScript-Typsicherheit
- Einheitliches `filled`-Prop für aktiv/inaktiv
- Eine einzige Stelle um das gesamte Icon-System anzupassen

### Die Komponente

Erstelle `src/shared/components/Icon.tsx`:

```tsx
// src/shared/components/Icon.tsx

interface IconProps {
  /** Material Symbols Icon-Name, z.B. 'home', 'calendar_today', 'note_alt' */
  name: string;
  /** Ausgefüllte Variante (FILL 1) – nutze für aktive/hervorgehobene Zustände */
  filled?: boolean;
  /** Größe in px – entspricht der font-size der Variable Font (Standard: 24) */
  size?: number;
  /** Zusätzliche Tailwind-Klassen für Farbe, Margin etc. */
  className?: string;
}

export function Icon({ name, filled = false, size = 24, className }: IconProps) {
  return (
    <span
      className={`material-symbols-rounded select-none leading-none ${className ?? ''}`}
      style={{
        fontSize: size,
        // Variable Font Axes – Material Symbols Spezifikation:
        // FILL: 0 = Outline, 1 = Filled
        // wght: Strichstärke (100–700), 400 = Regular
        // GRAD: Gewichtsanpassung ohne Layoutverschiebung (-50–200), 0 = neutral
        // opsz: Optical Size – stimmt die Detailschärfe auf die Größe ab (20–48)
        fontVariationSettings: `'FILL' ${filled ? 1 : 0}, 'wght' 400, 'GRAD' 0, 'opsz' ${size}`,
      }}
      aria-hidden="true"
    >
      {name}
    </span>
  );
}
```

**Was `fontVariationSettings` macht:**

Das ist die API der Variable Font. Du übergibst Achsen-Werte direkt als CSS:

| Achse | Wert | Bedeutung |
|---|---|---|
| `FILL` | `0` oder `1` | Outline vs. Filled – für aktiv/inaktiv Zustände |
| `wght` | `400` | Strichstärke (wie `font-weight`), 400 = Regular |
| `GRAD` | `0` | Micro-Anpassung des optischen Gewichts, 0 = neutral |
| `opsz` | `24` | Optical Size – stimmt Icon-Details auf die Größe ab |

**Warum `aria-hidden="true"`?**

Icon-Fonts rendern als Text-Zeichen. Screenreader würden sonst z.B. "home" oder
kryptische Zeichencodes vorlesen. `aria-hidden` blendet das Icon für Screenreader
aus. Das Label des Menüpunkts (z.B. "Dashboard") enthält die eigentliche Information.

---

## Schritt 3: `SidebarNavItem` auf Icon-Komponente umstellen

### Was sich ändert

Bisher: `icon: string` = ein Emoji-String, der direkt gerendert wird.

```tsx
// Vorher
<span className="w-5 h-5 ...">
  {icon}   {/* "📅" */}
</span>
```

Jetzt: `iconName: string` = ein Material-Symbol-Name, der an `<Icon>` übergeben wird.
Das `filled`-Prop kommt aus dem `isActive`-Zustand des NavLinks.

```tsx
// Nachher
<Icon name={iconName} filled={isActive} size={20} />
```

### Der vollständige neue Code

Ersetze `src/layouts/SidebarNavItem.tsx` vollständig:

```tsx
// src/layouts/SidebarNavItem.tsx
import { NavLink } from 'react-router-dom';

import { Icon } from '@/shared/components/Icon';

interface SidebarNavItemProps {
  label: string;
  to: string;
  iconName: string;   // Material Symbols Name, z.B. 'home', 'calendar_today'
}

export function SidebarNavItem({ label, to, iconName }: SidebarNavItemProps) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        [
          'flex items-center gap-2',
          'px-3 py-2 rounded-full',
          'w-full no-underline',
          'font-text text-base leading-6',
          isActive
            ? 'bg-primary-container text-on-primary-container font-medium'
            : 'text-on-surface-variant',
        ].join(' ')
      }
    >
      {({ isActive }) => (
        <>
          {/* Icon: filled wenn aktiv, outline wenn inaktiv – direkt aus Figma-Spec */}
          <Icon name={iconName} filled={isActive} size={20} />

          {/* Label */}
          <span className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap">
            {label}
          </span>
        </>
      )}
    </NavLink>
  );
}
```

**Warum `{({ isActive }) => (...)}` statt dem bisherigen JSX?**

`NavLink` von React Router unterstützt zwei Formen für `children`:
1. Normales JSX – bekommt `isActive` nicht
2. Eine **Render-Funktion** als `children` – bekommt `{ isActive, isPending }` als Argument

Bisher haben wir `isActive` nur für `className` gebraucht (dort funktioniert die
Function-Form bereits). Jetzt brauchen wir `isActive` auch im JSX-Body für das
`filled`-Prop des Icons. Deshalb wechseln wir auf die Render-Funktion als `children`.

---

## Schritt 4: `NAV_ITEMS` in `Sidebar.tsx` aktualisieren

### Emoji raus, Material Symbol Namen rein

Die Icons in `NAV_ITEMS` müssen von Emoji auf Material-Symbol-Namen umgestellt werden.
Die Namen kommen aus der [Material Symbols Bibliothek](https://fonts.google.com/icons).

Basierend auf dem Figma-Design:

| Menüpunkt | Figma-Icon (Beschreibung) | Material Symbol Name |
|---|---|---|
| Dashboard | Haus | `home` |
| Lernplan | Kalender | `calendar_today` |
| Notizen | Notizblock | `note_alt` |
| Mediathek | Video/Play | `video_library` |
| Stellenangebote | Koffer | `work` |
| Profil | Person im Kreis | `account_circle` |

### Was sich ändert

Das Interface `NavItem` und die `NAV_ITEMS`-Liste: `icon` → `iconName`:

```tsx
// In Sidebar.tsx: Interface aktualisieren
interface NavItem {
  id: string;
  labelKey: ParseKeys<'common'>;
  to: string;
  iconName: string;   // ← war: icon: string
  featureFlag?: FeatureFlag;
}

// NAV_ITEMS: Emoji durch Material Symbol Namen ersetzen
const NAV_ITEMS: NavItem[] = [
  { id: 'nav-dashboard', labelKey: 'navigation.dashboard',    to: '/courses',       iconName: 'home' },
  { id: 'nav-courses',   labelKey: 'navigation.learningPlan', to: '/courses',       iconName: 'calendar_today' },
  { id: 'nav-notes',     labelKey: 'navigation.notes',        to: '/courses',       iconName: 'note_alt' },
  { id: 'nav-media',     labelKey: 'navigation.mediaLibrary', to: '/media-library', iconName: 'video_library', featureFlag: 'mediaLibrary' },
  { id: 'nav-jobs',      labelKey: 'navigation.jobOffers',    to: '/job-offers',    iconName: 'work',          featureFlag: 'jobOffers' },
];
```

Die `SidebarNavItem`-Aufrufe in der Komponente müssen ebenfalls `iconName` übergeben
statt `icon`:

```tsx
// In der .map() – anpassen:
<FeatureFlaggedNavItem item={item} flag={item.featureFlag} label={label} />

// FeatureFlaggedNavItem intern:
return <SidebarNavItem label={label} to={item.to} iconName={item.iconName} />;

// Ohne Feature Flag:
<SidebarNavItem label={label} to={item.to} iconName={item.iconName} />

// User-Bereich:
<SidebarNavItem label={t('navigation.profile')} to="/profile" iconName="account_circle" />
```

---

## Schritt 5: Das Logo

### Warum das Logo besonders ist

Das Logo ist kein normales Asset das du einfach in `src/assets/` legst und importierst.
Der Designer hat explizit gefordert:

- **Pro Mandant** ein anderes Logo (onecareer, ChapterNEXT, ...)
- **Pro Theme** eine andere Logo-Variante (Light Mode, Dark Mode)

Das bedeutet: Das Logo **kommt vom Backend**, nicht vom Frontend-Code.
Beim App-Start lädt der Config-Service die Branding-Daten des Mandanten –
darunter die Logo-URL.

```
Backend Config Response:
{
  "branding": {
    "logoUrl": "https://cdn.example.com/onecareer/logo-light.svg",
    "logoDarkUrl": "https://cdn.example.com/onecareer/logo-dark.svg",
    "primaryColor": "#006a58",
    ...
  }
}
```

### Jetzt: Placeholder-Architektur aufbauen

Solange die Backend-Config noch nicht angebunden ist, arbeiten wir mit einem
**statischen Platzhalter** der dieselbe Komponenten-Schnittstelle hat wie das
finale System. Dadurch ist der Austausch später nur eine Änderung in der Komponente.

**Ordner erstellen:**

```
src/assets/
└── logos/
    ├── placeholder-light.svg   ← Logo für Light Mode (Platzhalter)
    └── placeholder-dark.svg    ← Logo für Dark Mode (Platzhalter)
```

Für den Anfang reicht ein einfaches Text-SVG als Platzhalter.
Erstelle `src/assets/logos/placeholder-light.svg`:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 24" fill="none">
  <text x="0" y="18" font-family="sans-serif" font-size="16" font-weight="600" fill="#006a58">
    Lernwelt
  </text>
</svg>
```

Und `src/assets/logos/placeholder-dark.svg` (hellere Farbe für Dark Mode):

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 24" fill="none">
  <text x="0" y="18" font-family="sans-serif" font-size="16" font-weight="600" fill="#4db89e">
    Lernwelt
  </text>
</svg>
```

### Die `Logo`-Komponente

Erstelle `src/shared/components/Logo.tsx`:

```tsx
// src/shared/components/Logo.tsx
import { useThemeStore } from '@/shared/stores/theme.store';

import logoLight from '@/assets/logos/placeholder-light.svg';
import logoDark from '@/assets/logos/placeholder-dark.svg';

interface LogoProps {
  /** Breite in px – Höhe passt sich proportional an */
  width?: number;
  className?: string;
}

export function Logo({ width = 120, className }: LogoProps) {
  const { resolvedTheme } = useThemeStore();

  // Jetzt: statischer Platzhalter – später kommt die URL aus der Backend-Config
  const logoSrc = resolvedTheme === 'dark' ? logoDark : logoLight;

  return (
    <img
      src={logoSrc}
      alt="Lernwelt"
      width={width}
      // height wird nicht gesetzt → Bild passt Höhe proportional zur Breite an
      className={className}
    />
  );
}
```

**Warum `<img>` und nicht SVG als React-Komponente?**

Man könnte SVGs auch als React-Komponenten importieren (`import Logo from '...svg?react'`).
Für Logos empfehlen sich `<img>`-Tags aber aus drei Gründen:

1. **Einfacher Austausch:** Wenn die URL später vom Backend kommt, ersetzt du nur
   `src={logoSrc}` durch `src={config.branding.logoUrl}` – der Rest bleibt
2. **Caching:** Browser cachen `<img>`-Assets effizienter als inline SVG
3. **Alt-Text:** `<img alt="Lernwelt">` ist barrierefrei ohne extra Arbeit

### Logo in `Sidebar.tsx` einsetzen

Ersetze den Logo-Bereich in `Sidebar.tsx`:

```tsx
// Vorher
<div className="px-3 py-2">
  <span className="text-lg font-semibold font-heading text-primary">
    Lernwelt
  </span>
</div>

// Nachher
<div className="px-3 py-2">
  <Logo width={100} />
</div>
```

---

## Wo findest du Material Symbol Namen?

Die offizielle Bibliothek: **https://fonts.google.com/icons**

Dort:
1. Oben rechts: "Style" auf **Rounded** stellen
2. Icon suchen (z.B. "home", "calendar")
3. Icon anklicken → rechts erscheint der Name (z.B. `home`, `calendar_today`)
4. Diesen Namen 1:1 in `iconName: '...'` schreiben

**Wichtig:** Der Name im Code muss exakt mit dem Figma-Icon übereinstimmen.
Wenn du dir unsicher bist, beschreibe dem Designer-Team das Icon und fragt nach
dem exakten Material Symbols Namen – das spart Suchzeit.

---

## Das vollständige Ergebnis

Nach diesem Schritt:

```
src/
├── assets/
│   └── logos/
│       ├── placeholder-light.svg
│       └── placeholder-dark.svg
├── shared/
│   └── components/
│       ├── Icon.tsx          ← Material Symbols Variable Font Wrapper
│       └── Logo.tsx          ← Multi-Tenant/Dark-Mode-fähiger Logo-Wrapper
└── layouts/
    ├── Sidebar.tsx           ← iconName statt icon, Logo-Komponente
    └── SidebarNavItem.tsx    ← Icon-Komponente, filled=isActive
```

Die Sidebar sieht jetzt aus wie in Figma:
- Haus-Icon (filled/ausgefüllt) bei aktivem "Dashboard"
- Kontur-Kalender-Icon bei inaktivem "Lernplan"
- Echtes Logo statt Text-Platzhalter

---

## Checkliste: Schritt 6

- [ ] `pnpm add material-symbols` ausgeführt
- [ ] `@import 'material-symbols/rounded'` in `src/index.css` eingefügt
- [ ] `src/shared/components/Icon.tsx` erstellt
- [ ] `src/assets/logos/placeholder-light.svg` + `placeholder-dark.svg` erstellt
- [ ] `src/shared/components/Logo.tsx` erstellt
- [ ] `src/layouts/SidebarNavItem.tsx`: `icon` → `iconName`, Render-Function als children, Icon-Komponente eingesetzt
- [ ] `src/layouts/Sidebar.tsx`: Interface + NAV_ITEMS auf `iconName` umgestellt, Symbol-Namen eingetragen, Logo-Komponente eingesetzt
- [ ] Im Browser: Icons sehen korrekt aus (kein Text, echte Symbole)
- [ ] Aktiver Menüpunkt zeigt **ausgefülltes** Icon, inaktive zeigen **Kontur**
- [ ] Dark Mode Toggle: Logo wechselt zwischen Light- und Dark-Variante
- [ ] `pnpm type-check` ohne Fehler

---

## Was noch fehlt (kommt später)

| Was | Wann |
|-----|------|
| Echtes Logo-SVG vom Designer/Brand-Team | Wenn Branding-Assets geliefert werden |
| Logo-URL aus Backend-Config laden | Wenn Config-Service angebunden ist (`ADR 0012`) |
| Icon-Namen typisieren (kein beliebiger `string`) | Wenn nötig – TypeScript-Enum oder Literal Union |
| Logo-Alt-Text aus i18n | Wenn Mehrsprachigkeit ausgebaut wird |
