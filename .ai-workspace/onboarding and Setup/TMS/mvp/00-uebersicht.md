# Crowdin MVP – Übersicht

---

## Ziel

Ein funktionierender Crowdin-Workflow für die Lernwelt:

1. Crowdin erkennt unsere deutschen Quelltexte (`public/locales/de/*.json`)
2. Übersetzer können im Crowdin-Web-Editor englische Texte hinzufügen
3. Crowdin erstellt automatisch PRs mit den fertigen `en/*.json`-Dateien
4. Die bestehende i18next-Config bleibt **unverändert**

---

## Ist-Zustand des Projekts

| Aspekt | Aktueller Stand |
|---|---|
| i18n-Library | i18next v25 + react-i18next v16 |
| Backend-Plugin | `i18next-resources-to-backend` (Dynamic Imports) |
| Quellsprache | Deutsch (`de`) |
| Zielsprache | Englisch (`en`) – konfiguriert, aber noch keine Dateien |
| Vorhandene Dateien | Nur `public/locales/de/common.json` |
| Deklarierte Namespaces | `common`, `auth`, `courses`, `quiz`, `profile`, `errors` |
| TypeScript-Typen | `src/i18n/i18next.d.ts` typisiert alle 6 Namespaces |

---

## Crowdin Free Plan – Was ist enthalten?

| Feature | Verfügbar? |
|---|---|
| Projekte | 1 privates Projekt |
| Hosted Words | 60.000 (Wörter × Zielsprachen) |
| Sprachen | Unbegrenzt |
| Online-Editor | Ja |
| Translation Memory | Ja |
| Glossar | Ja |
| Machine Translation | Ja (Vorschläge) |
| Integrationen | 1 |
| Community-Übersetzer | Unbegrenzt (in öffentlichen Projekten) |

**Für unser MVP mehr als genug.** Bei ~200 Wörtern in `common.json` × 1
Zielsprache (EN) = 200 Hosted Words. Weit unter dem 60.000-Limit.

> **Tipp: Academic License.** Da die Lernwelt eine Bildungsplattform ist, kann
> Crowdin mit einer kostenlosen Academic License (Open) genutzt werden:
> https://crowdin.com/product/for-academic
> Das gibt unlimitierte Projekte, Strings und Members – kostenlos.

---

## MVP-Dokumente

| Datei | Inhalt |
|---|---|
| `01-crowdin-projekt-erstellen.md` | Account + Projekt auf crowdin.com anlegen |
| `02-crowdin-yml-konfiguration.md` | `crowdin.yml` für das Repo erstellen |
| `03-github-action-setup.md` | CI/CD-Sync mit GitHub Action |
| `04-erster-sync-und-test.md` | Erster Upload, Übersetzung, PR-Workflow |

---

## Was sich am Code NICHT ändert

- `src/i18n/index.ts` – identisch
- `src/i18n/i18next.d.ts` – identisch
- Alle `t()`-Aufrufe in Komponenten – identisch
- `public/locales/de/*.json` – Entwickler pflegen diese weiter wie bisher
- Build-Pipeline (Vite) – identisch

**Crowdin integriert sich rein auf Datei-Ebene.** Es fügt `en/*.json`-Dateien
zum Repo hinzu. Das ist alles.
