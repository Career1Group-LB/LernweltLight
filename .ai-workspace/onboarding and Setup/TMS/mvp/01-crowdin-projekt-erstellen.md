# Schritt 1: Crowdin-Projekt erstellen

---

## 1.1 Account anlegen

1. Gehe zu https://accounts.crowdin.com/register
2. Registriere dich (GitHub-Login geht auch)
3. Nach der Registrierung landest du auf dem Crowdin-Dashboard

> **Wichtig:** Registriere dich auf **crowdin.com** (nicht Crowdin Enterprise).
> Der Free Plan ist nur auf crowdin.com verfügbar.

---

## 1.2 Neues Projekt erstellen

1. Klick auf **"+ Create Project"** (oben rechts im Dashboard)
2. Fülle die Felder aus:

| Feld | Wert |
|---|---|
| Project Name | `Lernwelt` (oder `LernweltLight`) |
| Project Visibility | **Private** (Free Plan erlaubt 1 privates Projekt) |
| Source Language | **German (de)** ← Das ist wichtig! |
| Target Languages | **English (en)** |

3. Klick auf **"Create Project"**

### Warum German als Source Language?

Unser Projekt hat `de` als `fallbackLng` und alle Quelltexte sind Deutsch.
Crowdin muss wissen, dass die Dateien in `public/locales/de/` die **Quelle**
sind, nicht die Übersetzung.

---

## 1.3 Project ID und API Token notieren

Beides brauchst du für die GitHub Action.

### Project ID finden

1. Öffne das Projekt in Crowdin
2. Gehe zu **Settings → API**
3. Die **Project ID** ist eine Zahl (z.B. `123456`)
4. Notiere sie – wird als `CROWDIN_PROJECT_ID` Secret in GitHub gebraucht

### Personal Access Token erstellen

1. Klicke auf dein **Profilbild** (oben rechts) → **Settings**
2. Gehe zu **API** (im linken Menü)
3. Klicke auf **"New Token"**
4. Vergib einen Namen: `lernwelt-github-action`
5. Scopes: Wähle mindestens:
   - **Projects** (Read, Write)
   - **Source files** (Read, Write)
   - **Translations** (Read, Write)
   - **Source strings** (Read, Write)
6. Klicke auf **"Create"**
7. **Kopiere den Token sofort!** Er wird nur einmal angezeigt.

---

## 1.4 Secrets in GitHub hinterlegen

1. Gehe zu deinem GitHub-Repository
2. **Settings → Secrets and variables → Actions**
3. Klicke auf **"New repository secret"** und erstelle:

| Secret Name | Wert |
|---|---|
| `CROWDIN_PROJECT_ID` | Die Projekt-ID aus Schritt 1.3 |
| `CROWDIN_PERSONAL_TOKEN` | Der Personal Access Token aus Schritt 1.3 |

---

## 1.5 Projekteinstellungen prüfen

Bevor es weitergeht, prüfe folgende Einstellungen im Crowdin-Projekt:

1. **Settings → General**
   - Source Language: German ✓
   - Target Languages: English ✓

2. **Settings → Import → File type detection**
   - Stelle sicher, dass JSON/i18next erkannt wird
   - Crowdin erkennt i18next-JSON nativ (`i18next_json` Format)

3. **Settings → Export**
   - "Export only approved translations" → **Aus** (für MVP)
   - Das bedeutet: Auch nicht-reviewte Übersetzungen werden exportiert

---

## Nächster Schritt

→ `02-crowdin-yml-konfiguration.md` – Die Konfigurationsdatei für das Repo
