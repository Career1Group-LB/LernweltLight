# Was ist Vite?

**Vite** (französisch für "schnell", ausgesprochen /vit/) ist ein modernes **Build-Tool und Entwicklungsserver** für Webprojekte. Es wurde von **Evan You** entwickelt – dem Erfinder von Vue.js.

---

## Warum Vite?

Traditionelle Build-Tools wie **Webpack** bündeln den gesamten Code, bevor der Entwicklungsserver startet. Bei großen Projekten wird das schnell langsam. Vite löst das Problem grundlegend anders.

---

## Die zwei Säulen von Vite

### 1. Blitzschneller Dev-Server (Entwicklung)

- Nutzt **ES Modules (ESM)** direkt im Browser
- Der Server startet **sofort**, weil nicht der gesamte Code gebündelt wird
- Module werden erst geladen, wenn der Browser sie tatsächlich braucht (on-demand)
- Unter der Haube verwendet Vite **esbuild** (geschrieben in Go, extrem schnell)

### 2. Optimierter Production-Build (Produktion)

- Für den finalen Build nutzt Vite **Rollup** als Bundler
- Rollup ist bewährt und erzeugt stark optimierte, kleine Bundles
- Tree-Shaking, Code-Splitting und Minification sind automatisch dabei

---

## Hot Module Replacement (HMR)

Wenn du eine Datei änderst, wird **nur dieses eine Modul** im Browser aktualisiert – nicht die ganze Seite. Das passiert in **Millisekunden**, egal wie groß das Projekt ist.

---

## Vite vs. Webpack – Vergleich

| Aspekt                 | Webpack                        | Vite                              |
| ---------------------- | ------------------------------ | --------------------------------- |
| Dev-Server Start       | Langsam (bündelt alles vorher) | Sofort (ESM-basiert)              |
| HMR-Geschwindigkeit    | Wird langsamer bei Projektgröße| Konstant schnell                  |
| Konfiguration          | Komplex (webpack.config.js)    | Minimal (vite.config.ts)          |
| Technologie (Dev)      | Custom Bundler                 | esbuild                           |
| Technologie (Build)    | Webpack                        | Rollup                            |

---

## Was macht Vite konkret in deinem Projekt?

Dein `weather-project` nutzt Vite als Build-Tool. Das erkennst du an:

- **`vite.config.ts`** – die Konfigurationsdatei
- **`npm run dev`** – startet den Vite Dev-Server
- **`npm run build`** – erstellt den optimierten Production-Build
- **`npm run preview`** – zeigt den Production-Build lokal an

### Vite kümmert sich dabei um:

- **TypeScript-Transpilation** (über esbuild – extrem schnell)
- **React JSX/TSX-Verarbeitung** (z.B. `.tsx`-Dateien)
- **CSS-Verarbeitung** (inkl. PostCSS, CSS Modules etc.)
- **Static Asset Handling** (Bilder, Fonts, etc.)
- **Dev-Server mit HMR** (Live-Reload bei Änderungen)
- **Production Build** (optimiertes Bundling mit Rollup)

---

## Wichtige Dateien

| Datei               | Zweck                                                  |
| ------------------- | ------------------------------------------------------ |
| `vite.config.ts`    | Vite-Konfiguration (Plugins, Aliase, Server-Optionen)  |
| `index.html`        | Einstiegspunkt – Vite nutzt HTML als Entry (nicht JS!)  |
| `src/main.tsx`      | Dein App-Einstiegspunkt, wird von index.html geladen   |
| `tsconfig.json`     | TypeScript-Konfiguration                               |
| `tsconfig.node.json`| TypeScript-Konfiguration für den Node/Vite-Config-Kontext |

---

## Projekt erstellen mit Vite

```bash
# Neues Projekt mit React + TypeScript Template
npm create vite@latest mein-projekt -- --template react-ts

# In Projektordner wechseln
cd mein-projekt

# Abhängigkeiten installieren
npm install

# Dev-Server starten
npm run dev
```

Oder in einen **bestehenden leeren Ordner** scaffolden:

```bash
cd mein-projekt
npm create vite@latest . -- --template react-ts
```

---

## Verfügbare Templates

| Template       | Beschreibung               |
| -------------- | -------------------------- |
| `vanilla`      | Vanilla JS                 |
| `vanilla-ts`   | Vanilla TypeScript         |
| `vue`          | Vue 3                      |
| `vue-ts`       | Vue 3 + TypeScript         |
| `react`        | React                      |
| `react-ts`     | React + TypeScript         |
| `svelte`       | Svelte                     |
| `svelte-ts`    | Svelte + TypeScript        |

---

## Zusammenfassung

> Vite ist der **Entwicklungsserver + Build-Tool** deines Projekts. Es sorgt dafür, dass dein Code während der Entwicklung sofort im Browser angezeigt wird und für die Produktion optimal gebündelt wird. Es ersetzt ältere Tools wie Webpack und ist dabei deutlich schneller und einfacher zu konfigurieren.
