# Was ist ein Translation Management System (TMS)?

---

## Das Problem: JSON-Dateien im Repo und wer sie pflegt

Aktuell liegen unsere Übersetzungen als JSON-Dateien im Git-Repo:

```
public/locales/de/common.json
public/locales/de/auth.json
public/locales/de/courses.json
```

Das funktioniert, solange **nur Entwickler** Texte ändern. Aber was passiert, wenn:

- Ein **Produktmanager** den Button-Text von "Kurs starten" zu "Jetzt loslegen" ändern will?
- Ein **Übersetzer** die englische Version pflegen soll?
- Ein **Content-Team** einen Tippfehler im Lade-Text korrigieren möchte?

Ohne TMS sieht der Workflow so aus:

```
PM findet Tippfehler in der App
    → Schreibt eine Slack-Nachricht an einen Entwickler
        → Entwickler öffnet die JSON-Datei
            → Sucht den richtigen Key
                → Ändert den Text
                    → Commit → Push → PR → Review → Merge → Build → Deploy
                        → 30–60 Minuten für einen Tippfehler
```

Das skaliert nicht. Und es blockiert Entwickler mit Nicht-Entwickler-Aufgaben.

---

## Die Lösung: Ein TMS

Ein **Translation Management System** ist eine Web-Plattform, die zwischen dem
Code-Repository und den Übersetzern/Content-Teams steht:

```
┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│   Git Repo   │ ──sync──▶│     TMS      │◀──edit──│  Übersetzer  │
│ (JSON-Dateien)│ ◀──sync──│  (Web-UI)    │◀──edit──│  PM / Content│
└──────────────┘         └──────────────┘         └──────────────┘
                               │
                               ▼
                    ┌──────────────────┐
                    │  CDN (optional)  │
                    │  Live-Delivery   │
                    └──────────────────┘
```

### Was ein TMS konkret macht

| Funktion | Beschreibung |
|---|---|
| **Web-Editor** | Übersetzer/PMs bearbeiten Texte in einer Browser-Oberfläche – kein Git, kein Code, kein JSON |
| **Git-Sync** | Neue Keys werden automatisch aus dem Repo erkannt; fertige Übersetzungen werden als PR zurückgespielt |
| **Translation Memory** | Bereits übersetzte Sätze werden gespeichert und bei ähnlichen Texten vorgeschlagen |
| **Glossar** | Einheitliche Terminologie definieren ("Kurs" = "Course", nie "Class") |
| **Machine Translation** | Automatische Vorübersetzung per DeepL, Google Translate oder GPT/Claude |
| **QA-Checks** | Erkennt fehlende Variablen (`{{count}}`), zu lange Texte, fehlende Pluralformen |
| **Review-Workflow** | Übersetzer → Reviewer → Freigabe. Rollen und Rechte pro Person |
| **Kontexthilfe** | Screenshots oder In-Context-Editor zeigen dem Übersetzer, wo der Text in der App erscheint |
| **CDN-Delivery** | (Optional) Übersetzungen live ausliefern, ohne neuen App-Build |

---

## Wie sieht der Non-Dev-Workflow im TMS aus?

### Schritt 1: Entwickler schreibt Code

```typescript
// Entwickler fügt neuen Text hinzu
const { t } = useTranslation('courses');
<h1>{t('detail.enrollButton')}</h1>
```

```json
// public/locales/de/courses.json
{
  "detail": {
    "enrollButton": "Kurs buchen"
  }
}
```

Entwickler committed und pusht → Git-Sync des TMS erkennt den neuen Key.

### Schritt 2: Übersetzer öffnet die Web-UI

Der Übersetzer sieht im TMS:

```
┌─────────────────────────────────────────────────────────┐
│  Key                     │  DE (Quelle)   │  EN (Ziel)  │
│─────────────────────────────────────────────────────────│
│  detail.enrollButton     │  Kurs buchen   │  ___        │
│  detail.start            │  Kurs starten  │  Start      │
│  title                   │  Meine Kurse   │  My Courses │
└─────────────────────────────────────────────────────────┘
                                              ↑
                                    Hier tippt der
                                    Übersetzer rein
```

- Der Übersetzer sieht **nur Texte**, kein JSON, kein Code
- Machine Translation schlägt vor: "Book course"
- Der Übersetzer prüft, passt an, klickt "Speichern"
- Ein Reviewer gibt frei

### Schritt 3: TMS spielt die Übersetzung zurück

Je nach Setup:

**Option A – Git-Sync:** Das TMS erstellt einen Pull Request mit der aktualisierten
`public/locales/en/courses.json`. Ein Entwickler merged den PR.

**Option B – CDN-Delivery:** Die Übersetzung ist sofort live, ohne PR und ohne Build.
Die App lädt die Texte direkt vom TMS-CDN.

---

## Wer benutzt was?

| Rolle | Ohne TMS | Mit TMS |
|---|---|---|
| **Entwickler** | Schreibt `t()` + pflegt JSON | Schreibt `t()`, fertig |
| **Übersetzer** | Braucht Git-Zugang + JSON-Kenntnisse | Nutzt Web-Editor im Browser |
| **PM / Content** | Slack → Entwickler → PR | Ändert Texte selbst im Browser |
| **Reviewer** | Review im PR (JSON lesen) | Review im TMS mit Diff-Ansicht |

---

## Was ein TMS NICHT ist

- **Kein CMS:** Ein TMS verwaltet UI-Strings (Labels, Buttons, Meldungen), keinen
  redaktionellen Content (Blog-Posts, Artikel). Für längere Inhalte braucht man ein CMS.
- **Keine Übersetzungsagentur:** Ein TMS ist das Werkzeug, nicht der Übersetzer.
  Man kann aber Übersetzer/Agenturen ins TMS einladen.
- **Kein Ersatz für i18next:** Das TMS ergänzt i18next – es ist das Backend, das die
  JSON-Dateien verwaltet. i18next bleibt das Frontend-Framework, das die Texte anzeigt.

---

## Wie passt das zu i18next?

i18next hat ein Plugin-System für verschiedene "Backends" (= woher kommen die Texte?):

| Phase | i18next Backend | Quelle der Texte |
|---|---|---|
| **Jetzt** | `i18next-resources-to-backend` | JSON-Dateien im Repo, per Dynamic Import |
| **Mit TMS (Git-Sync)** | `i18next-resources-to-backend` | JSON-Dateien im Repo, aber vom TMS gepflegt |
| **Mit TMS (CDN)** | `i18next-http-backend` oder `i18next-locize-backend` | Texte direkt vom TMS-CDN |

Der Wechsel zwischen diesen Phasen erfordert **nur eine Konfigurationsänderung** –
kein Refactoring der Komponenten, keine Änderung der `t()`-Aufrufe.

```typescript
// Phase 1+2: Aus dem Repo (kein Unterschied ob manuell oder TMS-gepflegt)
.use(resourcesToBackend(
  (lng, ns) => import(`../../public/locales/${lng}/${ns}.json`)
))

// Phase 3: Direkt vom CDN
.use(HttpBackend)
.init({
  backend: {
    loadPath: 'https://cdn.tms-anbieter.com/{{lng}}/{{ns}}.json'
  }
})
```

---

## Zusammenfassung

| Frage | Antwort |
|---|---|
| Was ist ein TMS? | Eine Web-Plattform für die Verwaltung von Übersetzungstexten |
| Wer profitiert davon? | Übersetzer, PMs, Content-Teams – alle, die Texte ohne Code ändern wollen |
| Braucht man eins von Anfang an? | Nein – erst wenn Nicht-Entwickler Texte pflegen sollen |
| Ändert sich der Code? | Nein – `t()`-Aufrufe bleiben gleich, nur die Quelle der JSON-Dateien ändert sich |
| Was kostet das? | Free-Tiers verfügbar; Paid ab ~$7–50/Monat je nach Anbieter |
