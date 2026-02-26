# Sidebar Tutorial – Teil 2: Datenmodell und Feature Flags

> **Nur lesen – du erstellst in diesem Kapitel noch keine Dateien.**
> Teil 2 erklärt das Datenmodell und die Konzepte dahinter (TypeScript-Interface,
> Feature Flags, Zustand Store). Die Codeblöcke sind Vorschauen – du schreibst sie
> erst in **Teil 3** (`SidebarNavItem.tsx`) und **Teil 4** (`ui.store.ts`, `Sidebar.tsx`).

## Regel: Immer mit dem Datenmodell starten

Bevor wir eine einzige React-Komponente schreiben, definieren wir:
**Was für Daten braucht die Komponente?**

Das ist eine wichtige Regel aus unserer AGENTS.md: TypeScript strict mode,
keine `any`-Typen, alles explizit modellieren.

## Was ist ein Navigations-Item?

Schau dir die Sidebar an. Jeder Menüpunkt hat:
- Einen **Label** (z.B. "Lernplan") – kommt aus den Übersetzungsdateien, nicht hardcoded
- Eine **Route** (z.B. "/courses") – wohin führt der Link?
- Ein **Icon** – welches Symbol wird angezeigt?
- Optional: einen **Feature Flag** – wird dieser Menüpunkt überhaupt angezeigt?

Daraus entsteht unser TypeScript-Interface:

```typescript
import type { ParseKeys } from 'i18next';

// Dieses Interface beschreibt genau, wie ein Navigations-Item aussieht
interface NavItem {
  id: string;                    // Eindeutige ID – wird als React key verwendet
  labelKey: ParseKeys<'common'>; // Nur gültige Keys aus common.json – kein beliebiger string
  to: string;                    // "/courses"
  icon: string;                  // Platzhalter – das Icon-System kommt später
  featureFlag?: FeatureFlag;     // Optional: nur anzeigen wenn Flag aktiv
                                 // Das ? bedeutet: dieses Feld muss nicht angegeben werden
}
```

**Warum `ParseKeys<'common'>` statt `string`?**

`react-i18next` ist typsicher: Es kennt durch `src/i18n/i18next.d.ts` alle Übersetzungs-Keys
und akzeptiert in `t()` keinen beliebigen `string`. Mit `labelKey: string` würde
`t(item.labelKey)` zur Compile-Zeit scheitern.

`ParseKeys<'common'>` ist ein Utility-Type aus `i18next` der genau die gültigen Keys des
`common`-Namespace auflistet (`"navigation.dashboard"`, `"navigation.learningPlan"` usw.).
Damit weiß TypeScript: Jeder Wert in `labelKey` ist ein bekannter Key – `t()` akzeptiert ihn.

**Warum `labelKey` statt `label`?**

Wir speichern **nicht** den angezeigten Text (`"Lernplan"`), sondern den **Key**
(`'navigation.learningPlan'`). Die Übersetzung übernimmt `react-i18next` mit `t(item.labelKey)`.
Das hat zwei Vorteile:

1. **Kein hardcodierter Text** – AGENTS.md verbietet hardcodierte Strings in der UI
2. **Stabile Daten** – der Key ändert sich nie; nur die Übersetzungsdatei ändert sich

**Warum ein `id`-Feld?**

React braucht für Listen einen stabilen `key`-Prop. Wir könnten `item.labelKey` nehmen –
aber eine dedizierte `id` wie `'nav-courses'` ist eindeutiger und klar von der
Übersetzungslogik getrennt. Eine stabile `id` ändert sich nie.

**Was bedeutet `featureFlag?: FeatureFlag`?**

Das `?` macht das Feld optional. "Dashboard" und "Lernplan" haben keinen Feature Flag –
sie sind immer sichtbar. "Mediathek" und "Jobs" hingegen sollen nur angezeigt werden,
wenn das Backend die entsprechenden Flags aktiviert hat.

`FeatureFlag` ist ein Typ aus `src/shared/types/common.ts` – er listet alle erlaubten
Flag-Namen auf. Das verhindert Tippfehler (du kannst keinen Flag-Namen erfinden).

## Die Liste der Navigations-Items

Basierend auf dem Figma-Design haben wir diese Items:

```typescript
import type { ParseKeys } from 'i18next';
import type { FeatureFlag } from '@/shared/types/common';

interface NavItem {
  id: string;
  labelKey: ParseKeys<'common'>; // Nur gültige Keys aus common.json
  to: string;
  icon: string;            // Wird in Teil 3 erklärt
  featureFlag?: FeatureFlag;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'nav-dashboard', labelKey: 'navigation.dashboard',    to: '/courses',       icon: '⊞' },
  { id: 'nav-courses',   labelKey: 'navigation.learningPlan', to: '/courses',       icon: '📅' }, // Route folgt später
  { id: 'nav-notes',     labelKey: 'navigation.notes',        to: '/courses',       icon: '📝' }, // Route folgt später
  { id: 'nav-media',     labelKey: 'navigation.mediaLibrary', to: '/media-library', icon: '▶',  featureFlag: 'mediaLibrary' },
  { id: 'nav-jobs',      labelKey: 'navigation.jobOffers',    to: '/job-offers',    icon: '💼', featureFlag: 'jobOffers' },
];
```

**Wo kommen die Keys her?**

Die Keys zeigen auf Einträge in `public/locales/de/common.json`, Sektion `navigation`:

```json
{
  "navigation": {
    "dashboard":    "Dashboard",
    "learningPlan": "Lernplan",
    "notes":        "Notizen",
    "mediaLibrary": "Mediathek",
    "jobOffers":    "Stellenangebote"
  }
}
```

Da `common` der **Default-Namespace** ist, reicht es in der Komponente einfach
`useTranslation()` ohne Namespace-Angabe aufzurufen. Das erklärt Teil 4 genau.

**Warum `NAV_ITEMS` in UPPER_SNAKE_CASE?**

Laut AGENTS.md werden Konstanten (Werte, die sich nie ändern) in `UPPER_SNAKE_CASE`
geschrieben. `NAV_ITEMS` ist eine Konstante – sie ändert sich nicht zur Laufzeit.

**Warum zeigen manche Items noch auf `/courses`?**

Die echten Routen für Lernplan, Notizen, etc. existieren noch nicht.
Wir verwenden `/courses` als Platzhalter und ersetzen es wenn die Route gebaut ist.
Das ist bewusstes temporäres Design – die Sidebar-Struktur steht, der Content folgt.

## Was ist ein Feature Flag?

Feature Flags steuern, welche Teile der App sichtbar sind. Sie kommen vom Backend
(über den Config-Service) und können pro Mandant (Kunde) unterschiedlich sein.

Aus `src/shared/types/common.ts`:

```typescript
export type FeatureFlag =
  | 'liveStream'
  | 'mediaLibrary'
  | 'jobOffers'
  | 'certificates'
  // ... weitere Flags
```

Und so prüfst du sie in einer Komponente (aus `src/shared/hooks/useFeatureFlag.ts`):

```typescript
const isMediaLibraryEnabled = useFeatureFlag('mediaLibrary');
// → true oder false, abhängig vom Backend
```

**Die Regel aus AGENTS.md:**
> "Never hardcode feature availability. Always use `useFeatureFlag`."

Das bedeutet: Du darfst nie `if (true)` oder `if (false)` für Feature-Entscheidungen
schreiben. Immer `useFeatureFlag(...)` nutzen.

## Sidebar-State: Zustand Store

Die Sidebar hat einen UI-Zustand: offen oder eingeklappt. Das ist **Client State** –
er kommt nicht vom Server, er ist nur für die UI relevant.

Laut AGENTS.md:
- **Server State** (Daten vom Backend) → React Query
- **Client State** (UI-Zustand) → Zustand Store

So sieht der Store aus, den du in **Teil 4 (Schritt 1)** erstellen wirst:

> **Vorschau – noch nicht erstellen.** Der folgende Code kommt in `src/shared/stores/ui.store.ts`,
> aber du legst die Datei erst in Teil 4 an. Hier geht es nur ums Verstehen.

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

**Wie funktioniert `create`?**

`create` ist wie eine Fabrik für einen Zustand. Du gibst ihr:
1. Den Anfangszustand (`sidebarOpen: true`)
2. Funktionen, die den Zustand ändern (`toggleSidebar`)

`set` ist eine Funktion die Zustand aktualisiert – wie `setState` in Flutter-Cubits.

**Wie nutzt du den Store?**

```typescript
// In jeder Komponente:
const { sidebarOpen, toggleSidebar } = useUIStore();

// sidebarOpen: boolean – ist die Sidebar offen?
// toggleSidebar: () => void – öffnet/schließt die Sidebar
```

Das Schöne: Wenn du `toggleSidebar()` in der Sidebar aufruft,
reagiert automatisch auch der Header-Button darauf – weil beide den gleichen Store nutzen.

## Zusammenfassung: Was wir jetzt haben

```
Datenmodell:
NavItem {
  id: string              "nav-dashboard"
  labelKey: string        "navigation.dashboard"  ← i18n-Key, kein hardcodierter Text!
  to: string              "/courses"
  icon: string            "⊞"
  featureFlag?: FeatureFlag  "mediaLibrary" (optional)
}

NAV_ITEMS: NavItem[]   [nav-dashboard, nav-courses, nav-notes, nav-media, nav-jobs]

Übersetzungen (common.json):
"navigation.dashboard"    → "Dashboard"
"navigation.learningPlan" → "Lernplan"
"navigation.notes"        → "Notizen"
"navigation.mediaLibrary" → "Mediathek"
"navigation.jobOffers"    → "Stellenangebote"

UIStore:
sidebarOpen: boolean   true/false
toggleSidebar()        öffnet/schließt
```

→ [Teil 3: Die NavItem-Komponente bauen](./03-navitem-komponente.md)
