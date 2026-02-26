# Sidebar Tutorial – Teil 4: Die Sidebar zusammenbauen

> **Alles in diesem Kapitel ist aktive Umsetzung – du erstellst und änderst Dateien.**
> Lies bei jedem Schritt zuerst die Erklärung, dann führe die Aktion durch.
> Gehe die Schritte **der Reihe nach** durch – sie bauen aufeinander auf.

## Was wir in diesem Schritt tun

Wir haben:
- ✅ Das Datenmodell (`NavItem`, `NAV_ITEMS`) – aus Teil 2 (Theorie)
- ✅ Die `SidebarNavItem`-Komponente – aus Teil 3 (bereits erstellt)

Jetzt erstellen wir den letzten fehlenden Baustein und setzen alles zusammen:

| Schritt | Aktion | Datei |
|---------|--------|-------|
| 1 | Neue Datei erstellen | `src/shared/stores/ui.store.ts` |
| 2 | Datei aus Teil 3 nochmal prüfen | `src/layouts/SidebarNavItem.tsx` |
| 3 | Bestehende Datei ersetzen | `src/layouts/Sidebar.tsx` |

---

## Schritt 1: Den UI-Zustand Store anlegen

> **Jetzt umsetzen – erstelle diese Datei:**
> `src/shared/stores/ui.store.ts`
>
> Lege die Datei neu an und füge den folgenden Code ein.
> In Schritt 2a wurde bereits `src/shared/stores/theme.store.ts` angelegt
> (für Dark/Light Mode). Den `ui.store.ts` legst du direkt daneben –
> **beide Stores leben in `src/shared/stores/`**.

```typescript
// src/shared/stores/ui.store.ts
import { create } from 'zustand';

interface UIState {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
}));
```

**Was macht `create`?**

`create` aus Zustand baut einen Store. Du übergibst eine Funktion, die:
- Den Anfangszustand definiert (`sidebarOpen: true`)
- Aktionen definiert, die den Zustand ändern (`toggleSidebar`)

`set` ist Zustand's Art zu sagen: "Aktualisiere den State."
`(state) => ({ sidebarOpen: !state.sidebarOpen })` liest den alten Wert
und kehrt ihn um (`true` → `false`, `false` → `true`).

```
src/shared/stores/
├── theme.store.ts   ← bereits vorhanden (Schritt 2a) – Dark/Light/System Mode
└── ui.store.ts      ← NEU – Sidebar open/closed
```

---

## Schritt 2: `SidebarNavItem.tsx` prüfen

> **Prüfen – diese Datei hast du in Teil 3 bereits erstellt:**
> `src/layouts/SidebarNavItem.tsx`
>
> Wenn du Teil 3 abgeschlossen hast, ist die Datei bereits vorhanden.
> Der folgende Code dient zur Kontrolle – stelle sicher, dass deine Datei
> genau so aussieht:

```typescript
// src/layouts/SidebarNavItem.tsx
import { NavLink } from 'react-router-dom';

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
      <span
        className="w-5 h-5 shrink-0 flex items-center justify-center text-xl"
        aria-hidden="true"
      >
        {icon}
      </span>
      <span className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap">
        {label}
      </span>
    </NavLink>
  );
}
```

**Warum `className` statt `style`?**
Tailwind-Klassen wie `bg-primary-container` lesen die CSS-Variablen aus `tokens.css`.
Wenn Dark Mode aktiv ist (`data-theme="dark"` auf `<html>`), wechseln die Variablen
automatisch – die Klassen selbst bleiben gleich.

---

## Schritt 3: Die `Sidebar.tsx` komplett neu schreiben

> **Jetzt umsetzen – ersetze den Inhalt dieser Datei vollständig:**
> `src/layouts/Sidebar.tsx`
>
> Die Datei existiert bereits als Platzhalter. Öffne sie und ersetze
> den **gesamten Inhalt** mit dem folgenden Code:

```typescript
// src/layouts/Sidebar.tsx
import type { ParseKeys } from 'i18next';
import { useTranslation } from 'react-i18next';

import { useFeatureFlag } from '@/shared/hooks/useFeatureFlag';
import type { FeatureFlag } from '@/shared/types/common';

import { SidebarNavItem } from './SidebarNavItem';

// ─── DATENMODELL ─────────────────────────────────────────────────────────────

interface NavItem {
  id: string;                    // Stabiler React key – ändert sich nie
  labelKey: ParseKeys<'common'>; // Nur gültige Keys aus common.json – t() ist typsicher
  to: string;
  icon: string;
  featureFlag?: FeatureFlag;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'nav-dashboard', labelKey: 'navigation.dashboard',    to: '/courses',       icon: '⊞' },
  { id: 'nav-courses',   labelKey: 'navigation.learningPlan', to: '/courses',       icon: '📅' },
  { id: 'nav-notes',     labelKey: 'navigation.notes',        to: '/courses',       icon: '📝' },
  { id: 'nav-media',     labelKey: 'navigation.mediaLibrary', to: '/media-library', icon: '▶',  featureFlag: 'mediaLibrary' },
  { id: 'nav-jobs',      labelKey: 'navigation.jobOffers',    to: '/job-offers',    icon: '💼', featureFlag: 'jobOffers' },
];

// ─── HILFSKOMPONENTE: Nav-Item das hinter einem Feature Flag liegt ────────────

// Diese Komponente bekommt `flag` als non-optional FeatureFlag Prop.
// Dadurch kann useFeatureFlag IMMER und UNBEDINGT aufgerufen werden –
// das ist entscheidend für die Rules of Hooks (siehe Erklärung unten).
interface FeatureFlaggedNavItemProps {
  item: NavItem;
  flag: FeatureFlag;  // non-optional: hier ist immer ein konkreter Wert
  label: string;      // bereits übersetzt (kommt von t() in der Haupt-Komponente)
}

function FeatureFlaggedNavItem({ item, flag, label }: FeatureFlaggedNavItemProps) {
  const isEnabled = useFeatureFlag(flag); // ← immer aufgerufen, nie bedingt

  if (!isEnabled) return null;

  return <SidebarNavItem label={label} to={item.to} icon={item.icon} />;
}

// ─── HAUPT-KOMPONENTE ─────────────────────────────────────────────────────────

export function Sidebar() {
  // common ist der Default-Namespace → kein zweites Argument nötig
  // t('navigation.dashboard') → "Dashboard" (aus public/locales/de/common.json)
  const { t } = useTranslation();

  return (
    <aside className="w-[232px] shrink-0 p-2 flex flex-col">

      {/* Die Karte mit Schatten (aus Figma: Elevation Large) */}
      {/* bg-surface = var(--schemes-surface) → #fff Light, #0e1514 Dark */}
      <div
        className="flex-1 flex flex-col gap-4 p-4 rounded-3xl bg-surface overflow-hidden"
        style={{
          // Komplexer Schatten aus Figma – noch kein Token dafür vorhanden
          // Wird ersetzt wenn das Schatten-Token-System vom Designer kommt
          boxShadow: '0px 0px 0px 1px rgba(0,0,0,0.08), 0px 8px 32px 0px rgba(0,0,0,0.12)',
        }}
      >
        {/* Logo-Bereich */}
        <div className="px-3 py-2">
          <span className="text-lg font-semibold font-heading text-primary">
            Lernwelt
          </span>
        </div>

        {/* Navigations-Links */}
        <nav className="flex-1">
          <ul className="list-none p-0 m-0 flex flex-col">
            {NAV_ITEMS.map((item) => {
              const label = t(item.labelKey); // Übersetzung einmal hier auflösen
              return (
                // key nutzt item.id – stabil, unabhängig von Übersetzungen
                <li key={item.id}>
                  {item.featureFlag ? (
                    // Hat einen Feature Flag → FeatureFlaggedNavItem prüft ob aktiv
                    <FeatureFlaggedNavItem item={item} flag={item.featureFlag} label={label} />
                  ) : (
                    // Kein Feature Flag → immer anzeigen
                    <SidebarNavItem label={label} to={item.to} icon={item.icon} />
                  )}
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User-Bereich ganz unten */}
        {/* label kommt später aus dem Auth-Store (Profilname des eingeloggten Users) */}
        <div>
          <SidebarNavItem label={t('navigation.profile')} to="/profile" icon="👤" />
        </div>
      </div>
    </aside>
  );
}
```

**Was neu ist gegenüber einer Welt ohne i18n:**

| Zeile | Was passiert |
|-------|-------------|
| `import type { ParseKeys } from 'i18next'` | Utility-Type: alle gültigen Keys eines Namespace |
| `labelKey: ParseKeys<'common'>` | `labelKey` darf nur Keys aus `common.json` enthalten |
| `import { useTranslation } from 'react-i18next'` | Hook aus der i18n-Library |
| `const { t } = useTranslation()` | `t` ist die Übersetzungsfunktion |
| `const label = t(item.labelKey)` | Key → deutsche Übersetzung aus `common.json` |
| `label={label}` statt `label={item.label}` | Übersetzter Text wird übergeben |

> **Warum `ParseKeys<'common'>` statt `string`?**
> `react-i18next` ist typsicher: Es kennt durch `src/i18n/i18next.d.ts` alle Übersetzungs-Keys
> und akzeptiert in `t()` keinen beliebigen `string`. Mit `labelKey: string` würde
> `t(item.labelKey)` zur Compile-Zeit scheitern.
> `ParseKeys<'common'>` ist ein Utility-Type aus `i18next` der genau die gültigen Keys des
> `common`-Namespace auflistet – TypeScript weiß dann: jeder Wert in `labelKey` ist ein
> bekannter Key, `t()` akzeptiert ihn.

**Warum übersetzen wir in `Sidebar`, nicht in `SidebarNavItem`?**

`SidebarNavItem` bekommt einen fertigen `string` und weiß nichts von i18n –
das ist bewusst. Eine reine Render-Komponente sollte so wenig Abhängigkeiten wie
möglich haben. Die Übersetzungslogik gehört in die Komponente, die das Datenmodell kennt.

**Was ist mit dem User-Namen (`"Emma"`)?**

`"Emma"` war ein Platzhalter. Jetzt zeigen wir den Profil-Link mit dem übersetzten
Label `t('navigation.profile')` → `"Profil"`. Der echte Nutzername (z.B. `"Emma Müller"`)
wird später aus dem Auth-Store kommen und dann hier eingesetzt.

### Warum `style` beim `boxShadow`?

Du siehst, dass wir für den Schatten noch `style` nutzen, obwohl wir Tailwind verwenden.
Das ist bewusst:

- Der Schatten ist ein komplexer Figma-Wert mit zwei Layern
- Dafür gibt es noch kein Token in `tokens.css`
- Tailwind hat keine Standard-Klasse dafür

Sobald der Designer die Schatten-Token-Werte liefert, wandern sie in `tokens.css`
und dann in `@theme` in `index.css` – danach kann der `style`-Block durch eine
Tailwind-Klasse ersetzt werden.

**Das ist kein Fehler**, sondern pragmatisches Vorgehen: Token setzen Schritt für Schritt.

---

## Das `.map()` Muster erklärt

```typescript
{NAV_ITEMS.map((item) => {
  const label = t(item.labelKey);
  return (
    <li key={item.id}>
      {item.featureFlag ? (
        <FeatureFlaggedNavItem item={item} flag={item.featureFlag} label={label} />
      ) : (
        <SidebarNavItem label={label} to={item.to} icon={item.icon} />
      )}
    </li>
  );
})}
```

`.map()` ist JavaScript's Art, eine Liste in etwas anderes umzuwandeln:

```
NAV_ITEMS (Array of NavItem)
  │
  ▼ .map() + t(item.labelKey)
[<li>Dashboard</li>, <li>Lernplan</li>, <li>Notizen</li>, ...]
  │
  ▼ React rendert
<li>Dashboard</li>
<li>Lernplan</li>
<li>Notizen</li>
```

**Warum braucht jedes `<li>` ein `key`?**

React muss wissen, welches Element welches ist, wenn sich die Liste ändert
(z.B. ein Feature-Flag wird aktiviert). Das `key`-Prop ist diese eindeutige ID.
Ohne `key` zeigt React eine Warnung und die Performance leidet.

**Warum `item.id` statt `item.labelKey`?**

`item.labelKey` ist ein Key-String wie `'navigation.learningPlan'` – prinzipiell
stabil. Aber `item.id` (`'nav-courses'`) ist semantisch klarer: es ist explizit
eine ID, keine Übersetzungsadresse. Eindeutigkeit durch Bedeutung, nicht durch Zufall.

---

## Die "Rules of Hooks" – warum `FeatureFlaggedNavItem` existiert

Das ist eine wichtige React-Regel. Hooks wie `useFeatureFlag` dürfen **niemals**
bedingt aufgerufen werden – auch nicht durch den `&&`-Operator:

```typescript
// ❌ FALSCH – verletzt Rules of Hooks durch bedingten Hook-Aufruf
NAV_ITEMS.map((item) => {
  if (item.featureFlag) {
    const isEnabled = useFeatureFlag(item.featureFlag); // Hook in .map()!
    if (!isEnabled) return null;
  }
  return <SidebarNavItem ... />;
});

// ❌ AUCH FALSCH – && ist Short-Circuit: Hook wird nur aufgerufen wenn featureFlag gesetzt ist
const isHidden = item.featureFlag !== undefined && !useFeatureFlag(item.featureFlag);
//                                                  ↑ bedingt! ESLint warnt hier
```

React verlässt sich darauf, dass Hooks **immer in derselben Reihenfolge und unbedingt**
aufgerufen werden. ESLint's `react-hooks/rules-of-hooks` würde beide obigen Varianten
als Fehler markieren.

**Die Lösung: zwei separate Komponenten.**

Items ohne Feature Flag rendert die `Sidebar` direkt als `SidebarNavItem`.
Items mit Feature Flag bekommen eine eigene Komponente `FeatureFlaggedNavItem`,
die `useFeatureFlag` **immer und unbedingt** aufruft:

```typescript
// ✅ RICHTIG – useFeatureFlag wird immer aufgerufen, ohne Bedingung
function FeatureFlaggedNavItem({ item, flag }: FeatureFlaggedNavItemProps) {
  const isEnabled = useFeatureFlag(flag); // ← immer, nie bedingt

  if (!isEnabled) return null;
  return <SidebarNavItem ... />;
}
```

Das Conditional (mit oder ohne Flag) liegt im JSX der `Sidebar` – das ist kein
Hook-Aufruf, das ist normale Render-Logik:

```typescript
// ✅ Das ternäre ? hier ist OK – es ist kein Hook-Aufruf
{item.featureFlag ? (
  <FeatureFlaggedNavItem item={item} flag={item.featureFlag} />
) : (
  <SidebarNavItem label={item.label} to={item.to} icon={item.icon} />
)}
```

---

## Schritt 4: `AppLayout.tsx` – nichts ändern

> **Keine Aktion nötig** – diese Datei bleibt unverändert.
>
> `src/layouts/AppLayout.tsx` importiert bereits `<Sidebar />` und muss
> nicht angepasst werden. Sie rendert die Sidebar links und den Content rechts.

---

## Checkliste: Was wurde erstellt / geändert?

```
NEU:     src/shared/stores/ui.store.ts       ← Sidebar open/closed
                                               (theme.store.ts gibt es schon seit Schritt 2a)
NEU:     src/layouts/SidebarNavItem.tsx      ← Einzelner Menüpunkt (reines Rendering)
                                               FeatureFlaggedNavItem ist intern in Sidebar.tsx
ERSETZT: src/layouts/Sidebar.tsx             ← Komplett neu geschrieben
GLEICH:  src/layouts/AppLayout.tsx           ← Keine Änderung nötig
```

---

## Was siehst du jetzt im Browser?

Wenn du `pnpm dev` startest und der Mock-Server läuft:

1. Die Sidebar mit Logo, 5 Navigations-Items und User-Bereich
2. "Dashboard" ist mint-grün hervorgehoben (aktiv) weil `/courses` die aktuelle Route ist
3. "Mediathek" und "Stellenangebote" sind ausgeblendet (Feature Flags im Mock-Server auf `false`)
4. Klick auf "Lernplan" → navigiert zu `/courses` (Platzhalter-Route)
5. Dark Mode Toggle (aus Schritt 2a) → die Farben wechseln automatisch ✅
6. Labels kommen aus `public/locales/de/common.json` – kein hardcodierter Text ✅

---

## Was fehlt noch (und kommt später)?

| Was | Wann |
|-----|------|
| Echte Icons (z.B. Material Symbols) | Wenn Icon-Library ausgewählt und eingerichtet ist |
| Sidebar einklappen (Hamburger-Button) | `useUIStore.toggleSidebar()` im Header verdrahten |
| Schatten-Token in `tokens.css` | Wenn Designer die Token-Werte liefert |
| Echte Routen für Lernplan, Notizen, etc. | Wenn die Features gebaut werden |
| Logo-Asset statt Text | Wenn Branding-Config vorhanden |
| Nutzername statt "Profil" im User-Bereich | Wenn Auth-Store mit Profildaten befüllt ist |

---

## Fertig!

Du hast die Sidebar nach dem Figma-Design implementiert – mit Token-basiertem Styling
das automatisch mit dem Dark Mode funktioniert. Das Muster –
Datenmodell → Teilkomponente → Hauptkomponente – wird bei jedem weiteren
Feature gleich sein.
