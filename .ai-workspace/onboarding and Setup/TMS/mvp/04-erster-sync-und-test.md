# Schritt 4: Erster Sync und Test

---

## 4.1 Den ersten Upload auslösen

### Option A: Manuell über GitHub UI

1. Gehe zu deinem GitHub-Repository
2. **Actions** → **Crowdin Sync** (linke Sidebar)
3. Klicke **"Run workflow"** → **"Run workflow"**
4. Warte bis der Job durchläuft (1–2 Minuten)

### Option B: Automatisch durch Push

Ändere oder erstelle eine Datei unter `public/locales/de/` und pushe auf `main`.
Die Action wird automatisch getriggert.

### Was passiert beim ersten Sync?

```
GitHub Action startet
    ↓
1. Upload: public/locales/de/common.json → Crowdin
    ↓
2. Crowdin erkennt:
   - 33 Strings (actions.*, navigation.*, states.*)
   - Format: i18next JSON
   - Quellsprache: DE
   - Zielsprache: EN (noch 0% übersetzt)
    ↓
3. Download: Noch keine Übersetzungen vorhanden
   → Kein PR erstellt (nichts zum Herunterladen)
```

Das ist korrekt. Der erste Sync lädt nur die Quellen hoch. Übersetzungen
kommen erst, wenn jemand im Crowdin-Editor übersetzt hat.

---

## 4.2 Im Crowdin-Editor übersetzen (Test)

1. Öffne dein Projekt auf https://crowdin.com
2. Klicke auf **English** in der Sprachliste
3. Klicke auf **common.json**
4. Du siehst jetzt den Web-Editor:

```
┌──────────────────────────────────────────────────────────┐
│  Crowdin Editor                                          │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  Source (DE):    Speichern                                │
│  Translation:   [Save                         ] ← tippen │
│  ─────────────────────────────────────────────           │
│  Source (DE):    Abbrechen                               │
│  Translation:   [Cancel                       ] ← tippen │
│  ─────────────────────────────────────────────           │
│  Source (DE):    Löschen                                 │
│  Translation:   [Delete                       ] ← tippen │
│                                                          │
│  💡 Machine Translation Vorschlag: "Save" (Google)       │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

5. Übersetze ein paar Strings und klicke **"Save"**
6. Die Übersetzungen sind jetzt in Crowdin gespeichert

> **Tipp:** Klicke auf das ⚡-Symbol für Machine-Translation-Vorschläge.
> Auf dem Free Plan sind Google Translate und Microsoft Translator verfügbar.
> Du kannst auch "Pre-Translation" nutzen um alle Strings auf einmal
> maschinell übersetzen zu lassen.

---

## 4.3 Übersetzungen ins Repo holen

### Option A: Workflow manuell triggern

1. **Actions** → **Crowdin Sync** → **"Run workflow"**
2. Die Action holt die Übersetzungen und erstellt einen PR

### Option B: Nächster Push auf main

Beim nächsten Push auf `main` mit Änderungen in `public/locales/de/`
läuft die Action automatisch.

### Der PR sieht so aus

```
PR #42: chore(i18n): update translations from Crowdin
─────────────────────────────────────────────────────

Labels: i18n, automated

Files changed (1):
  + public/locales/en/common.json

@@ -0,0 +1,33 @@
+{
+  "actions": {
+    "save": "Save",
+    "cancel": "Cancel",
+    "delete": "Delete",
+    "edit": "Edit",
+    "back": "Back",
+    "next": "Next",
+    "close": "Close",
+    "retry": "Retry",
+    "loading": "Loading..."
+  },
+  "navigation": {
+    "dashboard": "Dashboard",
+    "learningPlan": "Learning Plan",
+    "notes": "Notes",
+    "courses": "Courses",
+    ...
+  },
+  "states": {
+    "loading": "Loading...",
+    "empty": "No content available.",
+    "error": "An error occurred."
+  }
+}
```

---

## 4.4 PR mergen und testen

1. **Review** den PR kurz (sehen die Übersetzungen sinnvoll aus?)
2. **Merge** den PR
3. Starte die App lokal: `pnpm dev`
4. Wechsle die Sprache auf Englisch (Language Toggle oder `?lng=en` in der URL)
5. Die App sollte jetzt die englischen Texte aus `en/common.json` anzeigen

Falls der Language Toggle noch nicht existiert, kannst du die Sprache testen mit:

```typescript
// Temporär in einer beliebigen Komponente oder in der Browser-Konsole:
import i18next from 'i18next';
i18next.changeLanguage('en');
```

Oder in der Browser-Konsole:

```javascript
// i18next ist global verfügbar wenn debug: true
window.__i18nInstance?.changeLanguage('en')
// Oder:
document.cookie = 'i18next=en; path=/';
// Dann Seite neu laden
```

---

## 4.5 Validierung: Ist alles korrekt?

### Checkliste

- [ ] Crowdin zeigt `common.json` mit allen Keys an
- [ ] Machine Translation funktioniert (Vorschläge sichtbar)
- [ ] Mindestens ein String wurde manuell übersetzt
- [ ] Die GitHub Action läuft erfolgreich durch
- [ ] Ein PR mit `en/common.json` wurde erstellt
- [ ] Nach dem Merge zeigt die App englische Texte

### Häufige Fehler

| Problem | Ursache | Lösung |
|---|---|---|
| Action findet keine Dateien | `crowdin.yml` nicht im Root | Prüfe Pfad und `base_path` |
| Crowdin zeigt keine Strings | Falsches Format | Prüfe `type: i18next_json` |
| PR wird nicht erstellt | Keine Übersetzungen vorhanden | Erst im Crowdin-Editor übersetzen |
| EN-Texte werden in der App nicht geladen | `supportedLngs` fehlt `en` | Steht bereits drin: `["de", "en"]` ✓ |
| Plurale werden als separate Strings angezeigt | Type ist `json` statt `i18next_json` | `type: i18next_json` setzen |

---

## 4.6 Der vollständige Kreislauf

Wenn alles funktioniert, sieht der Alltags-Workflow so aus:

```
Entwickler fügt neuen Key hinzu:
    public/locales/de/courses.json
    { "detail": { "enrollButton": "Kurs buchen" } }
        ↓
    git commit → git push (main)
        ↓
    GitHub Action: Upload courses.json zu Crowdin
        ↓
    Crowdin zeigt dem Übersetzer:
    "Kurs buchen" → [                    ] ← EN eingeben
        ↓
    Übersetzer: "Enroll in course" → Speichern
        ↓
    Nächster Workflow-Run: Download → PR erstellt
    + public/locales/en/courses.json
    { "detail": { "enrollButton": "Enroll in course" } }
        ↓
    PR mergen → Deploy → App zeigt "Enroll in course" 🎉
```

---

## 4.7 Nächste Schritte nach dem MVP

Wenn der Basis-Workflow funktioniert, kann man Schritt für Schritt erweitern:

| Erweiterung | Aufwand | Wann sinnvoll? |
|---|---|---|
| Schedule-Sync (cron) | 2 Zeilen YAML | Wenn regelmäßig im Editor übersetzt wird |
| Pre-Translation (MT für alle Strings) | 1 Klick in Crowdin | Für schnelle Erstübersetzung |
| Glossar anlegen | 30 Min in Crowdin | Wenn domänenspezifische Begriffe konsistent sein sollen |
| Weitere Sprachen hinzufügen | 1 Klick in Crowdin + 1 Zeile `supportedLngs` | Wenn weitere Sprachen benötigt werden |
| Review-Workflow (Approve) | Crowdin-Setting | Wenn Übersetzungsqualität geprüft werden soll |
| Auto-Merge für Crowdin-PRs | GitHub Branch Rule | Wenn Vertrauen in den Prozess besteht |
