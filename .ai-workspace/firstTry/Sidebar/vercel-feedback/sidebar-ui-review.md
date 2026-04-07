# UI Review: `src/layouts/Sidebar.tsx`

Geprüfte Dateien: `Sidebar.tsx`, `SidebarNavItem.tsx`, `Logo.tsx`
Datum: 04.03.2026

---

## Zusammenfassung nach Priorität

| Priorität | Datei | Problem |
|---|---|---|
| 🔴 Kritisch | `SidebarNavItem.tsx:14` | Kein `focus-visible`-Indikator |
| 🔴 Kritisch | `Sidebar.tsx:77` | `<nav>` ohne `aria-label` |
| 🟠 Hoch | `Sidebar.tsx:78` | `list-none` entfernt VoiceOver-Listensemantik |
| 🟠 Hoch | `Sidebar.tsx:59` | `<aside>` ohne `aria-label` |
| 🟠 Hoch | `SidebarNavItem.tsx:14` | Kein Hover-State |
| 🟡 Mittel | `SidebarNavItem.tsx:34` | Kein `title` bei abgeschnittenem Text |
| 🟡 Mittel | `Logo.tsx:21` | `alt`-Text hartkodiert (nicht i18n) |
| 🟡 Mittel | `Sidebar.tsx:64` | `overflow-hidden` schneidet Fokus-Ringe ab |
| 🔵 Low | `Sidebar.tsx:68` | Hartkodierter Shadow statt CSS-Token |
| 🔵 Low | `Logo.tsx:24` | Fehlendes `height` → potenzieller CLS |
| 🔵 Low | `Sidebar.tsx:12–30` | Narrierende Kommentare entfernen |

---

## Accessibility (a11y)

### `Sidebar.tsx:59` – `<aside>` ohne `aria-label` 🟠

Landmark-Regionen müssen beschriftet sein, wenn mehrere davon auf einer Seite existieren könnten (z. B. Sidebar + Widget im Main-Content). Ohne Label können Screen-Reader-Nutzer die Regionen nicht unterscheiden.

**WCAG:** SC 1.3.6 – Identify Purpose

**Fix:**
```tsx
<aside
  aria-label={t('navigation.sidebarLabel')}
  className="w-[232px] ..."
>
```

---

### `Sidebar.tsx:77` – `<nav>` ohne `aria-label` 🔴

Gibt es mehrere `<nav>`-Elemente auf einer Seite (z. B. Header-Nav + Sidebar-Nav), müssen beide einen `aria-label` tragen, damit Screen-Reader-Nutzer sie voneinander unterscheiden können.

**WCAG:** SC 2.4.1 – Bypass Blocks / ARIA Landmark Best Practices

**Fix:**
```tsx
<nav aria-label={t('navigation.mainNavLabel')} className="flex-1">
```

---

### `Sidebar.tsx:78` – `list-none` entfernt List-Semantik im VoiceOver 🟠

VoiceOver auf Safari entfernt die Listenrolle, wenn `list-style: none` per CSS gesetzt wird. Die Navigationspunkte werden dann nicht mehr als Liste angekündigt. Fix: explizites `role="list"` auf dem `<ul>`.

**Betroffene Browser:** Safari + VoiceOver (macOS & iOS)

**Fix:**
```tsx
<ul role="list" className="list-none p-0 m-0 flex flex-col">
```

---

### `SidebarNavItem.tsx:14` – Kein sichtbarer Fokus-Indikator 🔴

Es gibt keine `focus-visible:`-Styles. Tastatur-Nutzer sehen beim Tabben durch die Navigation keinen Fokus-Ring. Das ist ein kritisches Accessibility-Problem.

**WCAG:** SC 2.4.7 – Focus Visible (Level AA)

**Fix:** Zur `className`-Berechnung hinzufügen:
```tsx
'focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2 rounded-full'
```

---

### `SidebarNavItem.tsx:34` – Abgeschnittener Text ohne `title` 🟡

Wenn ein Label-Text per `text-ellipsis` abgeschnitten wird, sehen Nutzer nur `…` ohne die Möglichkeit, den vollständigen Text zu lesen. `title={label}` auf dem `<span>` hilft Maus-Nutzern via Tooltip (Screen-Reader erhalten den vollen Link-Text bereits korrekt über den `<a>`-Inhalt).

**Fix:**
```tsx
<span title={label} className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap">
  {label}
</span>
```

---

## UX / Interaction

### `SidebarNavItem.tsx:14` – Kein Hover-State 🟠

Inaktive Nav-Items haben keinerlei visuelles Feedback bei `hover`. Die Unterscheidung zwischen "anklickbar" und "statischem Text" fehlt. Nutzer können nicht erkennen, dass das Element interaktiv ist.

**Fix:** Zur `className`-Berechnung hinzufügen (für inaktive Items):
```tsx
isActive
  ? 'bg-primary-container text-on-primary-container font-medium'
  : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
```

---

### `Sidebar.tsx:64` – `overflow-hidden` schneidet Fokus-Ringe ab 🟡

Die innere Card (`rounded-3xl ... overflow-hidden`) würde einen nach außen zeigenden `outline`-basierten Fokus-Ring abschneiden. Kombiniert mit dem fehlenden `focus-visible`-Fix in `SidebarNavItem` ist das ein doppeltes Accessibility-Problem.

**Optionen:**
- `focus-visible:outline-offset-[-2px]` → Ring zeigt nach innen
- Ring-basierter Ansatz (`ring-*` Tailwind-Klassen) statt `outline`
- `overflow-hidden` nur für den Scroll-Bereich, nicht für die gesamte Card

---

## Internationalisierung (i18n)

### `Logo.tsx:21` – `alt`-Text nicht lokalisiert 🟡

```tsx
alt="Lernwelt"  // ← hartkodierter String
```

Laut Projektregeln müssen **alle** nutzerangezeigten Strings lokalisiert sein. Der `alt`-Text eines Logos ist zugänglichkeitskritisch (wird von Screen-Readern vorgelesen).

**Fix:**
```tsx
// In Logo.tsx – alt als prop übergeben oder useTranslation nutzen
alt={t('common:brand.logoAlt')}  // z. B. "Lernwelt – Zur Startseite"
```

---

## Code-Qualität / Projektregeln

### `Sidebar.tsx:68` – Hartkodierte RGBA-Werte im `style`-Prop 🔵

```tsx
boxShadow: '0px 0px 0px 1px rgba(0,0,0,0.08), 0px 8px 32px 0px rgba(0,0,0,0.12)',
```

Der Kommentar erklärt den Grund (kein Token vorhanden). Die Werte sollten trotzdem in eine CSS-Custom-Property ausgelagert werden, selbst wenn der Wert zunächst noch hartkodiert in `tokens.css` steht. Ziel: Single source of truth, kein Inline-Style im TSX.

**Zielzustand:**
```css
/* tokens.css */
:root {
  --shadow-elevation-large:
    0px 0px 0px 1px rgba(0, 0, 0, 0.08),
    0px 8px 32px 0px rgba(0, 0, 0, 0.12);
}
```
```tsx
// Sidebar.tsx – dann über @theme in Tailwind oder direkt als className
className="shadow-elevation-large"
```

---

### `Logo.tsx:24` – Fehlendes `height`-Attribut → potenzieller CLS 🔵

Ohne explizite `height` kann der Browser keinen Platz für das Bild reservieren, bevor es geladen ist. Das führt zu Cumulative Layout Shift (CLS) beim initialen Laden.

**Fix:**
```tsx
// Entweder height proportional berechnen:
<img src={logoSrc} alt={...} width={width} height={width * aspectRatio} />

// Oder per CSS aspect-ratio absichern:
<img src={logoSrc} alt={...} width={width} className={cn('block', className)} style={{ aspectRatio: '3/1' }} />
```

---

### `Sidebar.tsx:12–30` – Narrierende Kommentare entfernen 🔵

Folgende Kommentare beschreiben vergangene Änderungen oder den Code selbst (Projektregeln: Kommentare sollen nur nicht-offensichtliche Absichten erklären):

```tsx
// In Sidebar.tsx: Interface aktualisieren        ← Entwicklungsnotiz, nicht Dokumentation
// NAV_ITEMS: Emoji durch Material Symbol Namen ersetzen  ← Gleiches Problem
// ← war: icon: string                            ← Commit-Message in Kommentarform
```

Diese sollten entfernt werden. Der Kommentar zum `boxShadow` (`// Komplexer Schatten aus Figma...`) ist hingegen legitim, da er den Grund für den fehlenden Token erklärt.
