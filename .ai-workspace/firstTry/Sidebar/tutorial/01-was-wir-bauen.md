# Sidebar Tutorial – Teil 1: Was wir bauen

> **Nur lesen – du erstellst in diesem Kapitel keine Dateien.**
> Teil 1 ist reine Orientierung: Was bauen wir, warum so, welche Dateien sind betroffen?
> Die Umsetzung beginnt in **Teil 3**.

## Das Ziel

Wir bauen die **Sidebar-Navigation** der Lernwelt. Sie ist immer sichtbar –
egal auf welcher Seite du bist. Sie enthält Links zu allen Hauptbereichen der App.

## Das Figma-Design

Das ist die Sidebar wie sie aussehen soll:

```
┌─────────────────────┐
│  onecareer          │  ← Logo
│                     │
│  ● Dashboard        │  ← Aktiver Menüpunkt (mintgrüne Pill)
│    Lernplan         │
│    Notizen          │
│    Mediathek        │  ← Nur sichtbar wenn Feature Flag aktiv
│    Jobs             │  ← Nur sichtbar wenn Feature Flag aktiv
│                     │
│                     │
│  ○ Emma             │  ← User-Info ganz unten
└─────────────────────┘
```

**Design-Details aus Figma:**
- Weißer Hintergrund, abgerundete Ecken (24px), leichter Schatten
- Aktiver Menüpunkt: mintgrüne Pille (`bg-primary-container` / `text-on-primary-container`)
- Inaktive Menüpunkte: kein Hintergrund, dunkler Text (`text-on-surface-variant`)
- Breite: 232px

> Die Figma-Rohwerte (`#c7f0e9`, `#004f42`, `#3f4948`) sind seit Schritt 2a als
> CSS-Tokens hinterlegt. Im Code verwenden wir **immer die Token-Klassen**, nie
> die Hex-Werte direkt.

## Was wir lernen

In diesem Tutorial lernst du:
- Wie Typen (TypeScript Interfaces) als Grundlage dienen – bevor wir Code schreiben
- Was `NavLink` ist und wie er sich von einem normalen `<a>` unterscheidet
- Wie Feature Flags eine Komponente dynamisch steuern
- Wie du eine Liste von Objekten in React-Komponenten verwandelst (`.map()`)
- Wie du Zustand (Zustand Store) für UI-State nutzt

## Welche Dateien wir erstellen / ändern

```
src/
├── layouts/
│   ├── Sidebar.tsx              ← Wird komplett neu gebaut (war ein Platzhalter)
│   ├── SidebarNavItem.tsx       ← NEU: Unterkomponente für einen Menüpunkt
│   └── AppLayout.tsx            ← Bleibt gleich
└── shared/
    └── stores/
        └── ui.store.ts          ← NEU: Zustand Store für Sidebar open/closed
```

`SidebarNavItem.tsx` ist ein interner Baustein von `Sidebar.tsx`. Sie wird **nicht**
über ein `index.ts` exportiert – sie gehört zu keinem Feature.

## Architektur-Überblick: Warum die Sidebar in `layouts/` liegt

Laut AGENTS.md liegt seitenübergreifendes Layout-Code in `src/layouts/`.
Die Sidebar ist kein Feature – sie ist ein Shell-Element, das immer da ist.
Features (Kurse, Notizen, etc.) leben in `src/features/`.

```
src/layouts/            ← Shell: immer sichtbar
├── AppLayout.tsx       ← Äußere Hülle (Sidebar + Header + Content)
├── Sidebar.tsx         ← Navigation
└── Header.tsx          ← Obere Leiste

src/features/           ← Features: der eigentliche Inhalt
├── courses/
├── notes/
└── ...
```

## Weiter

→ [Teil 2: Datenmodell und Feature Flags](./02-datenmodell.md)
