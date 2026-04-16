# Workflow im Detail: Wer legt Keys an, wer übersetzt, wie kommt es ins Repo?

> Dieses Dokument klärt die konkreten Fragen:
> - Muss der Entwickler neue Strings für **alle** Sprachen anlegen?
> - Kann ein Non-Dev selbst neue Strings anlegen?
> - Wie genau kommt eine Übersetzung vom TMS ins Repo?

---

## Die Grundregel

> **Der Entwickler legt den Key + den Quelltext an. Das TMS (bzw. der Übersetzer)
> füllt die anderen Sprachen.**

Das ist die zentrale Arbeitsteilung. Der Entwickler muss **nicht** alle Sprachen
selbst pflegen. Er liefert die Quelle – der Rest ist Sache des TMS/Übersetzers.

---

## Szenario 1: Entwickler fügt neuen String hinzu

### Was der Entwickler macht

```typescript
// 1. Im Code: t()-Aufruf schreiben
const { t } = useTranslation('courses');
return <button>{t('detail.enrollButton')}</button>;
```

```json
// 2. In public/locales/de/courses.json: Quelltext eintragen
{
  "detail": {
    "enrollButton": "Kurs buchen"
  }
}
```

```bash
# 3. Commit + Push
git add .
git commit -m "feat(courses): add enroll button"
git push
```

**Das war's für den Entwickler.** Er legt den Key NUR in der Quellsprache (`de/`)
an. Er erstellt KEINE `en/courses.json` mit einer englischen Übersetzung.

### Was passiert dann? (3 Varianten je nach Phase)

#### Variante A: Ohne TMS (Phase 1 – aktueller Stand)

```
Entwickler legt de/courses.json an
    → Kein en/courses.json vorhanden
        → App zeigt für EN den Fallback (= deutschen Text oder den Key selbst)
        → Wenn EN gebraucht wird: Entwickler muss en/courses.json selbst anlegen
```

**Problem:** Der Entwickler muss beide Sprachen selbst pflegen. Skaliert nicht.

#### Variante B: Mit TMS + Git-Sync (Phase 2)

```
Entwickler pusht de/courses.json mit neuem Key
    ↓
GitHub Action / TMS-App erkennt: "Neuer Key: detail.enrollButton"
    ↓
TMS zeigt dem Übersetzer:
    ┌────────────────────────────────────────────┐
    │  Key: detail.enrollButton                  │
    │  DE:  Kurs buchen                          │
    │  EN:  [________________]  ← hier tippen    │
    │       💡 Vorschlag: "Book course"           │
    └────────────────────────────────────────────┘
    ↓
Übersetzer tippt: "Enroll in course" → klickt Speichern
    ↓
╔════════════════════════════════════════════════════════════╗
║  WICHTIG: Das TMS erstellt den PR AUTOMATISCH.            ║
║  Der Übersetzer klickt nur "Speichern" im Web-Editor.     ║
║  Er geht NICHT in GitHub. Er weiß nicht mal, dass ein     ║
║  PR existiert. Das TMS hat über seine GitHub-App oder     ║
║  GitHub Action Schreibzugriff auf das Repo und erledigt   ║
║  den Rest im Hintergrund.                                 ║
╚════════════════════════════════════════════════════════════╝
    ↓
    PR #42: "chore: translations from TMS"
    ─────────────────────────────────────
    Geänderte Datei: public/locales/en/courses.json
    
    + {
    +   "detail": {
    +     "enrollButton": "Enroll in course"
    +   }
    + }
    ↓
Entwickler (oder CI mit Auto-Merge-Regel) merged den PR
    ↓
en/courses.json existiert jetzt im Repo → nächster Build/Deploy
```

**Der Entwickler erstellt die en/-Datei NICHT selbst.** Das TMS erzeugt sie.

#### Variante C: Mit TMS + CDN-Delivery (Phase 3)

```
Entwickler pusht de/courses.json mit neuem Key
    ↓
TMS erkennt neuen Key (via saveMissing oder Git-Sync)
    ↓
Übersetzer übersetzt im Web-Editor
    ↓
Klick auf "Publish" → Text ist sofort auf dem CDN
    ↓
Nächster Seitenaufruf der App lädt den neuen Text
    ↓
KEIN PR, KEIN Merge, KEIN Build nötig
```

---

## Szenario 2: Non-Dev möchte bestehenden Text ändern

Ein PM findet, dass "Kurs buchen" besser "Jetzt einschreiben" heißen sollte.

### Ohne TMS

```
PM schreibt Slack-Nachricht an Entwickler
    → Entwickler öffnet de/courses.json
        → Ändert "Kurs buchen" → "Jetzt einschreiben"
            → Commit → PR → Review → Merge → Build → Deploy
```

### Mit TMS (Git-Sync)

```
PM öffnet TMS im Browser (z.B. app.crowdin.com oder app.locize.app)
    → Sucht nach "Kurs buchen" (Volltextsuche)
    → Ändert zu "Jetzt einschreiben" → klickt Speichern
    → FERTIG aus Sicht des PMs. Er schließt den Browser-Tab.
        ↓
    Im Hintergrund (PM sieht das NICHT):
    TMS erstellt automatisch PR in GitHub:
    Geänderte Datei: public/locales/de/courses.json
    - "enrollButton": "Kurs buchen"
    + "enrollButton": "Jetzt einschreiben"
        ↓
    Entwickler merged → Build → Deploy
```

> **Der PM geht nie in GitHub.** Er hat keinen GitHub-Account, keinen Repo-Zugang und
> sieht keine Pull Requests. Seine gesamte Welt ist der TMS-Web-Editor im Browser.

### Mit TMS (CDN-Delivery)

```
PM öffnet TMS im Browser
    → Ändert "Kurs buchen" → "Jetzt einschreiben"
    → Klick auf "Publish"
    → Sofort live. Kein Entwickler involviert.
```

---

## Szenario 3: Non-Dev möchte einen NEUEN String anlegen

Das ist die spannendste Frage. Kann ein PM oder Übersetzer einen komplett neuen
Key anlegen, der im Code noch nicht existiert?

### Kurze Antwort: Ja, ABER er wird nirgendwo angezeigt.

Ein TMS erlaubt es, neue Keys direkt in der Web-UI anzulegen:

```
PM im TMS:
    → Klickt "Add Key"
    → Key: "detail.newFeatureBanner"
    → DE: "Neu: Jetzt mit Zertifikat!"
    → EN: "New: Now with certificate!"
    → Speichern
```

Wenn Git-Sync aktiv ist, erstellt das TMS **automatisch** einen PR (der PM
sieht davon nichts – er klickt nur "Speichern" im TMS):

```json
// public/locales/de/courses.json
{
  "detail": {
    "enrollButton": "Jetzt einschreiben",
    "newFeatureBanner": "Neu: Jetzt mit Zertifikat!"
  }
}
```

```json
// public/locales/en/courses.json
{
  "detail": {
    "enrollButton": "Enroll in course",
    "newFeatureBanner": "New: Now with certificate!"
  }
}
```

**ABER:** Solange kein Entwickler im Code `t('detail.newFeatureBanner')` aufruft,
wird der Text nirgendwo in der App angezeigt. Der Key existiert in der JSON-Datei,
aber keine Komponente referenziert ihn.

### Was bedeutet das in der Praxis?

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│   Non-Dev kann:              Non-Dev kann NICHT:            │
│   ─────────────              ──────────────────             │
│   ✅ Bestehende Texte ändern  ❌ Texte in der App platzieren │
│   ✅ Neue Keys anlegen        ❌ Code schreiben (t()-Aufruf) │
│   ✅ Übersetzungen hinzufügen ❌ Entscheiden wo Text erscheint│
│   ✅ Texte löschen            ❌ Neue UI-Elemente erstellen  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Die Trennung ist sauber:**
- **Entwickler** entscheidet WO ein Text erscheint (Code: `t('key')`)
- **Non-Dev** entscheidet WAS der Text sagt (TMS: "Kurs buchen" → "Jetzt einschreiben")

### Ausnahme: CDN-Delivery + dynamische Keys

Es gibt ein Pattern, bei dem Non-Devs quasi "neue Texte" in die App bringen können:

```typescript
// Entwickler baut EINMAL eine generische Banner-Komponente
function FeatureBanner() {
  const { t, i18n } = useTranslation('courses');
  
  // Prüft ob der Key existiert
  if (!i18n.exists('courses:featureBanner.text')) return null;

  return (
    <div className="bg-primary-container p-4 rounded-xl">
      {t('featureBanner.text')}
    </div>
  );
}
```

Jetzt kann ein PM im TMS den Key `featureBanner.text` anlegen – und das Banner
erscheint in der App, ohne dass ein Entwickler Code schreibt. Aber der Entwickler
muss die Komponente **einmalig** vorbereitet haben.

---

## Szenario 4: Neue Sprache hinzufügen

Französisch soll als dritte Sprache kommen. Wer macht was?

### Schritt 1: Entwickler (einmalig, 5 Minuten)

```typescript
// src/i18n/index.ts – Französisch als unterstützte Sprache ergänzen
supportedLngs: ['de', 'en', 'fr'],
```

```typescript
// src/i18n/i18next.d.ts – Keine Änderung nötig!
// Die Typen basieren auf der DE-Quellsprache, nicht auf den Zielsprachen
```

Commit → Push. Fertig für den Entwickler.

### Schritt 2: TMS + Übersetzer

```
TMS erkennt: Neue Sprache "fr" konfiguriert
    ↓
Alle existierenden Keys werden als "unübersetzt" für FR angezeigt:

    ┌──────────────────────────────────────────────────┐
    │  Key                   │ DE           │ FR        │
    │──────────────────────────────────────────────────│
    │  actions.save          │ Speichern    │ [___]     │
    │  actions.cancel        │ Abbrechen    │ [___]     │
    │  navigation.courses    │ Kurse        │ [___]     │
    │  detail.enrollButton   │ Kurs buchen  │ [___]     │
    │  ...                   │ ...          │ ...       │
    └──────────────────────────────────────────────────┘
                                     ↑
                          Übersetzer füllt das alles aus
                          (oder: Machine Translation als Startpunkt)
    ↓
TMS erstellt PR:
    Neue Datei: public/locales/fr/common.json
    Neue Datei: public/locales/fr/courses.json
    Neue Datei: public/locales/fr/auth.json
    ...
    ↓
Entwickler merged → Build → Deploy → Französisch ist live
```

**Der Entwickler muss KEINE französischen JSON-Dateien selbst anlegen.**
Das TMS erzeugt sie komplett – auf Basis der existierenden DE-Keys.

---

## Zusammenfassung: Wer macht was?

| Aktion | Wer? | Wo? | Braucht GitHub? |
|---|---|---|---|
| Neuen `t()`-Aufruf im Code | **Entwickler** | IDE (Code) | Ja |
| Quelltext (DE) zum Key | **Entwickler** | IDE (`de/*.json`) | Ja |
| Übersetzung (EN, FR, ...) | **Übersetzer / Non-Dev** | TMS-Web-Editor (Browser) | **Nein** |
| Bestehenden Text ändern (DE) | **Non-Dev oder Entwickler** | TMS-Web-Editor oder JSON | **Nein** (TMS) |
| Bestehenden Text ändern (EN) | **Non-Dev** | TMS-Web-Editor (Browser) | **Nein** |
| Neue Sprache aktivieren | **Entwickler** (1 Zeile Config) + **Übersetzer** (Texte) | IDE + TMS | Dev: Ja, Übersetzer: **Nein** |
| Neuen Key ohne Code anlegen | **Non-Dev** (möglich im TMS) | TMS-Web-Editor | **Nein** – aber ohne `t()` im Code unsichtbar |
| Key in der App platzieren | **Nur Entwickler** | IDE (Code: `{t('key')}`) | Ja |
| PR erstellen mit Übersetzungen | **Das TMS automatisch** | GitHub (automatisiert) | **Nein** – TMS macht das selbst |
| PR mergen | **Entwickler** oder CI (Auto-Merge) | GitHub | Ja (aber automatisierbar) |

---

## Flowchart: Der vollständige Sync-Kreislauf

```
                    ┌──────────────────────────┐
                    │   Entwickler schreibt     │
                    │   t('courses:detail.new') │
                    │   + DE-Text in JSON       │
                    └───────────┬──────────────┘
                                │
                          git push
                                │
                    ┌───────────▼──────────────┐
                    │      GitHub Repo          │
                    │  de/courses.json (neu)    │
                    └───────────┬──────────────┘
                                │
                    GitHub Action / TMS-App Sync
                                │
                    ┌───────────▼──────────────┐
                    │         TMS              │
                    │  Erkennt neuen Key       │
                    │  Zeigt ihn dem Übersetzer│
                    └───────────┬──────────────┘
                                │
                    Übersetzer übersetzt im Web-Editor
                                │
                    ┌───────────▼──────────────┐
                    │         TMS              │
                    │  Erstellt PR:            │
                    │  + en/courses.json       │
                    │  + fr/courses.json       │
                    └───────────┬──────────────┘
                                │
                    PR wird gemerged (manuell oder auto)
                                │
                    ┌───────────▼──────────────┐
                    │      GitHub Repo          │
                    │  de/ ✅  en/ ✅  fr/ ✅    │
                    └───────────┬──────────────┘
                                │
                          Build + Deploy
                                │
                    ┌───────────▼──────────────┐
                    │     Live App             │
                    │  DE: "Kurs buchen"       │
                    │  EN: "Enroll in course"  │
                    │  FR: "S'inscrire"        │
                    └──────────────────────────┘
```

---

## Klarstellung: Wer erstellt den PR in GitHub?

Das ist die häufigste Frage – deswegen hier nochmal ganz explizit:

### Ohne TMS (Phase 1: JSON im Repo)

Es gibt keinen automatischen PR. Jemand mit Git-Zugang muss die Datei ändern
und manuell einen PR erstellen. Das kann ein Entwickler sein oder ein technisch
versierter PM, der sich mit Git auskennt.

### Mit TMS + Git-Sync (Phase 2)

**Kein Mensch erstellt den PR.** Das TMS erstellt ihn vollautomatisch.

So funktioniert das technisch:

1. Das TMS hat eine **GitHub-App** installiert (oder nutzt einen Service-Account
   mit einem Personal Access Token). Diese App hat Schreibzugriff auf das Repo.
2. Wenn ein Übersetzer im TMS-Web-Editor auf "Speichern" klickt, passiert
   intern Folgendes:
   - TMS erstellt einen neuen Git-Branch (z.B. `translations/update-2026-04-13`)
   - TMS committet die geänderten JSON-Dateien
   - TMS öffnet einen PR gegen `main` (oder den konfigurierten Ziel-Branch)
   - PR-Titel und -Body werden automatisch generiert
3. Der Übersetzer weiß von alldem **nichts**. Er sieht nur:
   *"Änderung gespeichert ✓"* im TMS.

```
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│  Übersetzer im TMS:                                              │
│                                                                  │
│     "Kurs buchen" → "Enroll in course" → [Speichern]            │
│                                                                  │
│  Was er sieht:     ✓ Gespeichert                                 │
│  Was er NICHT sieht: Branch, Commit, PR, Merge, Deploy           │
│                                                                  │
│  Was im Hintergrund passiert:                                    │
│     TMS → git branch → git commit → git push → PR erstellen     │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

**Der PR wird dann gemerged von:**
- Einem Entwickler, der kurz drüberschaut (empfohlen am Anfang)
- Oder automatisch durch eine CI-Regel (z.B. "Auto-Merge wenn alle Checks grün
  und Autor = TMS-Bot"), sobald Vertrauen besteht

### Mit TMS + CDN-Delivery (Phase 3)

Es gibt **gar keinen PR**. Die Übersetzungen werden direkt vom TMS über ein CDN
ausgeliefert. Die App lädt sie zur Laufzeit. Kein Git, kein Build, kein Deploy.

### Fazit

| Phase | Wer erstellt den PR? | Non-Dev braucht GitHub? |
|---|---|---|
| Phase 1 (JSON im Repo) | Mensch mit Git-Zugang | Ja (oder bittet Entwickler) |
| Phase 2 (TMS + Git-Sync) | **TMS automatisch** | **Nein, niemals** |
| Phase 3 (TMS + CDN) | Kein PR nötig | **Nein, niemals** |

---

## FAQ

### "Muss ich als Entwickler en/courses.json selbst anlegen?"

**Nein.** Du legst nur den Key in `de/courses.json` an. Das TMS (oder in Phase 1:
ein anderer Entwickler) erstellt die `en/`-Dateien.

Wenn es noch kein TMS gibt (Phase 1) und Englisch gebraucht wird, muss jemand
die `en/`-Dateien manuell anlegen – aber das muss nicht derselbe Entwickler sein.

### "Was passiert wenn en/courses.json noch nicht existiert?"

i18next nutzt die Fallback-Kette: `en → de`. Wenn kein englischer Text existiert,
zeigt die App den deutschen Text (oder den Key selbst, je nach Config). Es crasht
nichts – es sieht nur nicht gut aus.

### "Muss der Übersetzer in GitHub einen PR erstellen?"

**Nein. Niemals.** Der Übersetzer arbeitet ausschließlich im TMS-Web-Editor
(Browser). Er braucht keinen GitHub-Account, kein Git-Wissen und keinen
Repo-Zugang. Das TMS erstellt den PR vollautomatisch über eine GitHub-App.
Siehe den Abschnitt "Klarstellung: Wer erstellt den PR in GitHub?" weiter oben.

### "Kann der Übersetzer versehentlich den Code kaputt machen?"

**Nein.** Der Übersetzer hat keinen Zugriff auf Code. Er sieht nur Key-Value-Paare
im TMS-Web-Editor. Selbst wenn er einen Key löscht, ändert sich im Code nichts –
der `t()`-Aufruf zeigt dann einfach den Key-String als Fallback.

Die QA-Checks des TMS warnen außerdem bei:
- Fehlenden Variablen (`{{count}}` im DE aber nicht im EN)
- Fehlenden Pluralformen
- Zu langen/kurzen Texten

### "Kann ein Non-Dev eine neue Sprache im TMS anlegen?"

Ja, aber sie wird in der App erst sichtbar, wenn ein Entwickler die Sprache in
`supportedLngs` ergänzt (1 Zeile Config). Ohne das ignoriert i18next die neue Sprache.

### "Was ist der Unterschied zwischen Git-Sync und CDN-Delivery?"

| | Git-Sync | CDN-Delivery |
|---|---|---|
| Textänderung wird sichtbar | Nach PR-Merge + Build + Deploy | Sofort (Sekunden) |
| Wer muss involviert sein? | Entwickler (merged PR) | Niemand |
| Source of Truth | Git-Repo | TMS |
| Offline-Fähigkeit | Ja (Texte im Bundle) | Braucht Fallback-Config |
| Kontrolle | Höher (Code-Review auf PRs) | Niedriger (TMS hat eigene Reviews) |
| Empfohlen für | Startphase, kleine Teams | Reife Produkte, häufige Textänderungen |
