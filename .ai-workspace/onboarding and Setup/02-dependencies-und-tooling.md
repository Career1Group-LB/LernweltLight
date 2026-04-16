# Schritt 2: Dependencies & Tooling installieren

## Übersicht

Bevor du Code schreibst, musst du das Tooling aufsetzen. Das ist der "langweiligste" Schritt, aber der wichtigste – falsch konfiguriertes Tooling kostet dich später Stunden.

## 2.1 Core Dependencies installieren

### Runtime Dependencies (was die App im Browser braucht)

```bash
pnpm add @tanstack/react-query react-router-dom zustand axios zod ✅
```

| Paket                   | Wofür                                       |
| ----------------------- | ------------------------------------------- |
| `@tanstack/react-query` | Server State Management (Daten vom Backend) |
| `react-router-dom`      | Routing / Navigation                        |
| `zustand`               | Client State Management (UI State)          |
| `axios`                 | HTTP Client für API-Aufrufe                 |
| `zod`                   | Runtime-Validierung von API-Responses       |

### Dev Dependencies (nur für Entwicklung)

```bash
pnpm add -D prettier @tanstack/react-query-devtools vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom msw
```

| Paket                            | Wofür                                     |
| -------------------------------- | ----------------------------------------- |
| `prettier`                       | Code-Formatting                           |
| `@tanstack/react-query-devtools` | React Query Debug-Panel im Browser        |
| `vitest`                         | Test-Runner (wie Jest, aber für Vite)     |
| `@testing-library/react`         | React-Komponenten testen                  |
| `@testing-library/jest-dom`      | DOM-Matcher für Tests                     |
| `@testing-library/user-event`    | User-Interaktionen simulieren             |
| `jsdom`                          | Browser-Umgebung für Tests                |
| `msw`                            | Mock Service Worker (API-Mocks für Tests) |

### Optional (kann später kommen)

```bash
# i18n – wenn Mehrsprachigkeit eingebaut wird
pnpm add react-i18next i18next

# React Error Boundary
pnpm add react-error-boundary
```

## 2.2 Path Aliases konfigurieren

Path Aliases erlauben dir, statt `../../../shared/components/Button` einfach `@/shared/components/Button` zu schreiben.

### vite.config.ts anpassen

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

### tsconfig.app.json anpassen

In `compilerOptions` ergänzen:

```json
{
  "compilerOptions": {
    // ... bestehende Optionen ...
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### Testen

Nach der Konfiguration kannst du so importieren:

```typescript
// Statt:
import { Button } from '../../../shared/components/Button';

// Jetzt:
import { Button } from '@/shared/components/Button';
```

## 2.3 Prettier konfigurieren

Erstelle eine `.prettierrc` im Projekt-Root:

```json
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100,
  "tabWidth": 2,
  "arrowParens": "always"
}
```

Und ein `.prettierignore`:

```
node_modules
dist
```

Script in `package.json` ergänzen:

```json
{
  "scripts": {
    "format": "prettier --write \"src/**/*.{ts,tsx,css}\"",
    "format:check": "prettier --check \"src/**/*.{ts,tsx,css}\""
  }
}
```

## 2.4 Vitest konfigurieren

In `vite.config.ts` den Test-Bereich ergänzen:

```typescript
/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
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

Erstelle `src/test/setup.ts`:

```typescript
import '@testing-library/jest-dom';
```

Scripts in `package.json` ergänzen:

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "type-check": "tsc -b"
  }
}
```

## 2.5 ESLint erweitern (optional, aber empfohlen)

Die aktuelle ESLint-Config ist schon gut. Du kannst später noch ergänzen:

- `eslint-plugin-import` für Import-Reihenfolge
- `@typescript-eslint/no-explicit-any` auf `error` setzen

Das kann aber auch später kommen – die Basis reicht erstmal.

## 2.6 Environment Variables

Erstelle eine `.env` Datei im Projekt-Root (und füge `.env` zu `.gitignore` hinzu!):

```
VITE_API_BASE_URL=http://localhost:3000/api
```

Erstelle eine `.env.example` als Vorlage (die wird committet):

```
VITE_API_BASE_URL=http://localhost:3000/api
```

**Wichtig:** In Vite müssen alle Env-Variablen mit `VITE_` beginnen, damit sie im Frontend zugänglich sind.

## Checkliste: Schritt 2

- [✅] Core Dependencies installiert (React Query, Router, Zustand, Axios, Zod)
- [✅] Dev Dependencies installiert (Prettier, Vitest, Testing Library, MSW)
- [✅] Path Aliases konfiguriert (`@/...`)
- [✅] Prettier konfiguriert (`.prettierrc`)
- [✅] Vitest konfiguriert (`test` in `vite.config.ts` + `setup.ts`)
- [✅] `package.json` Scripts ergänzt (`format`, `test`, `type-check`)
- [✅] `.env` + `.env.example` erstellt
- [✅] `.env` in `.gitignore` eingetragen
- [✅] `pnpm dev` startet noch fehlerfrei
- [✅] `pnpm type-check` läuft ohne Fehler

**Wenn alles grün ist → weiter zu [Schritt 3: Ordnerstruktur](./03-ordnerstruktur-aufbauen.md)**
