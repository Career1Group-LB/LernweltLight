# Analyse: Brauchen wir regionale Sprachvarianten?

> **Kontext:** Unsere i18n-Dateien liegen unter `public/locales/de/`. Frage: Sollte das nicht
> `de-DE/`, `de-AT/`, `de-CH/` sein? Und wie sieht es bei anderen Sprachen aus –
> `en-US` vs. `en-GB`, `es-ES` vs. `es-MX`, `fr-FR` vs. `fr-CH`?

---

## TL;DR – Empfehlung

**Starte mit `de/` (Basissprache, ohne Region). Baue die Architektur aber so, dass regionale
Varianten (`de-AT/`, `de-CH/`) jederzeit nachgerüstet werden können – ohne Umbau.**

Die gute Nachricht: i18next unterstützt das von Haus aus über sein Fallback-System. Die
Entscheidung, regionale Dateien anzulegen, kann später fallen – wenn echte Nutzerdaten zeigen,
dass es nötig ist.

---

## Was bedeutet "regionale Variante" überhaupt?

Es gibt zwei Ebenen, die man auseinanderhalten muss:

### 1. Textliche Unterschiede (Vokabular, Rechtschreibung)

| Deutsch (DE) | Österreichisch (AT) | Schweizerdeutsch (CH) |
|---|---|---|
| Januar | **Jänner** | Januar |
| Fahrrad | Fahrrad | **Velo** |
| Tomate | **Paradeiser** | Tomate |
| Kartoffel | **Erdäpfel** | Kartoffel |
| Sahne | **Obers** | **Rahm** |
| Tüte | **Sackerl** | Sack |
| Straße | Straße | **Strasse** (kein ß) |
| Fußball | Fußball | **Fussball** (kein ß) |
| Ticket | Fahrkarte | **Billett** |

Für eine **Lernplattform** sind die meisten dieser Unterschiede irrelevant – sie betreffen
Alltagsvokabular (Essen, Verkehr), nicht Fachsprache. In einer Lernplattform kommen Wörter wie
"Kurs", "Modul", "Zertifikat", "Fortschritt", "Prüfung" vor – die sind in DE, AT und CH identisch.

### 2. Formatierungsunterschiede (Zahlen, Datum, Währung)

| Format | Deutschland | Österreich | Schweiz |
|---|---|---|---|
| Datum | 13.04.2026 | 13.04.2026 | 13.04.2026 |
| Tausendertrennzeichen | 1.234,56 | 1.234,56 | 1'234.56 |
| Währung | 12,99 € | 12,99 € | CHF 12.99 |

Diese Unterschiede sind **real und relevant** – aber sie werden **nicht über i18n-Dateien**
gelöst, sondern über die `Intl`-API:

```typescript
// Zahlenformatierung – automatisch korrekt pro Region
new Intl.NumberFormat('de-DE').format(1234.56)  // → "1.234,56"
new Intl.NumberFormat('de-AT').format(1234.56)  // → "1.234,56"
new Intl.NumberFormat('de-CH').format(1234.56)  // → "1'234.56"

// Datumsformatierung
new Intl.DateTimeFormat('de-CH').format(date)   // → "13.4.2026"

// Währung
new Intl.NumberFormat('de-CH', {
  style: 'currency',
  currency: 'CHF'
}).format(12.99)  // → "CHF 12.99"
```

Die `Intl`-API nutzt den **vollständigen Locale-Code** (`de-CH`) und formatiert automatisch
korrekt – unabhängig davon, welche Übersetzungsdateien geladen sind. Das ist ein
**separates Concern** von i18n-Texten.

---

## i18next: Wie regionale Varianten technisch funktionieren

i18next hat ein eingebautes **Fallback-System**, das genau für diesen Fall designed ist:

### Die Fallback-Kette

Wenn ein User mit Browsersprache `de-AT` die App öffnet, sucht i18next in dieser Reihenfolge:

```
de-AT → de → fallbackLng (z.B. en)
```

Das bedeutet: i18next versucht zuerst `de-AT/common.json`, und wenn diese Datei nicht existiert
(oder ein Key darin fehlt), fällt es auf `de/common.json` zurück.

### Empfohlenes Pattern: Basis + Override

Die i18next-Docs empfehlen explizit diesen Ansatz:

> "A common strategy if you're supporting language variants is to write common text inside the
> pure language, specifying only what differs in the variants."
> — [i18next Fallback Docs](https://www.i18next.com/principles/fallback)

```
public/locales/
├── de/                    ← Basissprache (99% der Texte)
│   ├── common.json
│   ├── auth.json
│   ├── courses.json
│   └── ...
├── de-AT/                 ← Nur Overrides (die paar Wörter, die abweichen)
│   └── common.json        ← z.B. { "months.january": "Jänner" }
├── de-CH/                 ← Nur Overrides
│   └── common.json        ← z.B. { "units.bicycle": "Velo" }
└── en/                    ← Englisch (falls nötig)
    ├── common.json
    └── ...
```

Die regionalen Dateien sind **dünn** – sie enthalten nur die Keys, die tatsächlich abweichen.
Alles andere kommt automatisch aus `de/`.

### Konfiguration

```typescript
// src/i18n/index.ts
i18next.init({
  fallbackLng: 'de',
  supportedLngs: ['de', 'de-AT', 'de-CH', 'en'],

  // 'all' = bei de-AT wird de-AT UND de geladen (Fallback-Kette)
  load: 'all',

  // ...restliche Config
});
```

Alternativ mit expliziten Fallback-Ketten:

```typescript
i18next.init({
  fallbackLng: {
    'de-AT': ['de', 'en'],
    'de-CH': ['de', 'en'],
    'default': ['de']
  },
  // ...
});
```

---

## Die zentrale Frage: Brauchen wir das JETZT?

### Argumente FÜR regionale Varianten jetzt

| Argument | Gewicht |
|---|---|
| Österreichische/Schweizer User fühlen sich "zuhause" | Niedrig für eine Lernplattform |
| SEO (hreflang Tags, regionale SERPs) | Irrelevant (Lernplattform hinter Login) |
| Korrekte Datumsformate | Gelöst über `Intl`-API, nicht über i18n |
| Schweizer "ss" statt "ß" | Gering – Schweizer sind "Straße" gewöhnt |
| Rechtliche Vorgaben | Keine bekannten für DE/AT/CH-Deutsch |

### Argumente GEGEN regionale Varianten jetzt

| Argument | Gewicht |
|---|---|
| Mehr Dateien = mehr Wartungsaufwand | Hoch |
| Kein Übersetzer vorhanden, der AT/CH prüft | Hoch |
| 99%+ der Texte sind identisch | Hoch |
| Kein Nutzerfeedback, das Regionalisierung fordert | Hoch |
| Premature Optimization / YAGNI | Hoch |

### Fazit: YAGNI (You Ain't Gonna Need It) – aber architektonisch vorbereiten

Regionale Varianten für eine **Lernplattform** bringen aktuell keinen messbaren Nutzen:

- Die Texte sind Fachsprache ("Kurs", "Modul", "Quiz"), nicht Alltagssprache ("Tomate"/"Paradeiser")
- Die App ist hinter einem Login, SEO ist irrelevant
- Formatierung (Datum, Zahlen) wird über die `Intl`-API gelöst, nicht über i18n
- Es gibt kein Content-Team, das regionale Varianten pflegen würde

---

## Was wir JETZT tun sollten: Architektur vorbereiten

Auch wenn wir keine regionalen Dateien anlegen, sollten wir sicherstellen, dass die Architektur
regionale Varianten unterstützt, falls sie später nötig werden.

### 1. `load: 'languageOnly'` vermeiden

Unsere aktuelle Config nutzt `load: 'all'` (der Default). Das ist korrekt – denn bei `languageOnly`
würde i18next regionale Codes wie `de-AT` auf `de` kürzen und regionale Overrides wären unmöglich.

**Unser aktuelles Setup ist bereits kompatibel.**

### 2. `Intl`-API für Formatierung nutzen

Für Datums- und Zahlenformatierung den **vollen Locale-Code** des Browsers nutzen:

```typescript
// Den Locale-Code des Users für Formatierung nutzen (de-AT, de-CH, etc.)
const locale = i18next.language; // z.B. "de-AT"

// Datum korrekt formatiert für die Region des Users
new Intl.DateTimeFormat(locale).format(date);

// Zahlen korrekt formatiert
new Intl.NumberFormat(locale).format(1234.56);
```

Das funktioniert sofort, unabhängig davon, ob regionale Übersetzungsdateien existieren.

### 3. Kein `nonExplicitSupportedLngs` verwenden

Diese Option verursacht unnötige 404-Requests, wenn regionale Dateien nicht existieren.
Stattdessen `supportedLngs` explizit setzen und bei Bedarf regionale Codes ergänzen.

---

## Wann sollten wir regionale Varianten einführen?

Trigger für die Einführung:

1. **User-Feedback:** Schweizer/Österreichische Nutzer melden, dass Texte "falsch" klingen
2. **Kunden-Anforderung:** Ein Mandant (Multi-Tenant) verlangt explizit AT/CH-Texte
3. **Datenlage:** Analytics zeigen signifikanten Traffic aus AT/CH (>10-20%)
4. **Content-Team:** Es gibt jemanden, der regionale Varianten pflegt und prüft

Wenn einer dieser Trigger eintritt, ist der Umbau minimal:

```bash
# 1. Regionale Ordner anlegen
mkdir -p public/locales/de-AT
mkdir -p public/locales/de-CH

# 2. Nur die abweichenden Keys eintragen
echo '{ "months": { "january": "Jänner" } }' > public/locales/de-AT/common.json

# 3. supportedLngs in der Config ergänzen
# supportedLngs: ['de', 'de-AT', 'de-CH', 'en']

# Fertig. Alles andere fällt automatisch auf de/ zurück.
```

---

## Zusammenfassung

| Frage | Antwort |
|---|---|
| Brauchen wir `de-DE/` statt `de/`? | **Nein.** `de/` ist die korrekte Konvention für die Basissprache. `de-DE` wäre nur nötig, wenn wir explizit zwischen DE-Deutsch und anderen Varianten unterscheiden wollten. |
| Brauchen wir jetzt `de-AT/` und `de-CH/`? | **Nein.** YAGNI – die Texte einer Lernplattform sind zu 99% identisch. |
| Wie handhaben wir Zahlen/Datum für AT/CH? | **`Intl`-API** mit dem vollen Locale-Code (`de-AT`, `de-CH`). Das ist ein separates Concern. |
| Ist unsere Architektur vorbereitet? | **Ja.** `load: 'all'` (Default) + `fallbackLng: 'de'` ermöglicht jederzeit regionale Override-Dateien. |
| Wann einführen? | Wenn User-Feedback, Mandanten-Anforderung oder Analytics es rechtfertigen. |

### Faustregel

> **Übersetzungsdateien (`de/`) → für textliche Unterschiede** (Vokabular, Formulierungen)
> **`Intl`-API (`de-AT`, `de-CH`) → für Formatunterschiede** (Datum, Zahlen, Währung)
>
> Beides ist unabhängig voneinander – du kannst `de/` für Texte nutzen und trotzdem
> `de-AT` für korrekte Zahlenformatierung.

---

## Über DACH hinaus: Wie sieht es bei anderen Sprachen aus?

Die gleiche Frage stellt sich für jede Sprache, die in mehreren Regionen gesprochen wird.
Hier eine systematische Analyse der wichtigsten Sprachfamilien.

### Englisch: en-US vs. en-GB vs. en-AU

| Aspekt | en-US (Amerika) | en-GB (Großbritannien) | en-AU (Australien) |
|---|---|---|---|
| Rechtschreibung | color, center, organize | colour, centre, organise | colour, centre, organise |
| Vokabular | truck, apartment, elevator | lorry, flat, lift | ute, unit, lift |
| Datumsformat | **MM/DD/YYYY** | DD/MM/YYYY | DD/MM/YYYY |
| Zeitformat | 12-hour (AM/PM) | Gemischt (12h/24h) | 12-hour (AM/PM) |
| Anführungszeichen | "Double quotes" | 'Single quotes' | "Double quotes" |
| Kollektivnomen | The team **is** winning | The team **are** winning | The team **are** winning |

**Relevanz für unsere Lernplattform:**

- **Rechtschreibung:** Sichtbar und für Muttersprachler störend. "Color" vs. "colour" fällt sofort auf.
  Bei einer Lernplattform mit englischen Texten wäre das ein Grund für regionale Varianten – aber
  nur, wenn wir eine große englischsprachige Nutzerbasis haben.
- **Datumsformat:** **Kritisch!** `04/05/2026` bedeutet 4. Mai (US) oder 5. April (GB/AU).
  → Wird aber über die `Intl`-API gelöst, nicht über i18n-Dateien.
- **Vokabular:** Für eine Lernplattform irrelevant (keine "trucks" oder "lifts" in der UI).

**Empfehlung:** Starte mit `en/` als Basis (neutrales Englisch). Wenn die Plattform
international expandiert und US/GB-User gezielt angesprochen werden, ergänze `en-US/` und
`en-GB/` als Override-Ordner mit den abweichenden Wörtern.

### Spanisch: es-ES vs. es-MX vs. es-419

| Aspekt | es-ES (Spanien) | es-MX (Mexiko) | es-419 (Lateinamerika) |
|---|---|---|---|
| "Du" (informell) | tú / vosotros | tú / ustedes | tú / vos (AR) / ustedes |
| "Computer" | ordenador | computadora | computadora |
| "Auto" | coche | carro | carro / auto |
| "Handy" | móvil | celular | celular |
| Währung | € (EUR) | $ (MXN) | Varies |
| Datumsformat | DD/MM/YYYY | DD/MM/YYYY | DD/MM/YYYY |

**Relevanz:** Die Unterschiede zwischen europäischem und lateinamerikanischem Spanisch sind
**deutlich größer** als zwischen de-DE und de-AT. Das betrifft Anredeformen (vosotros vs.
ustedes) und Alltagsvokabular. Spanisch ist die Sprache, bei der regionale Varianten am
ehesten sinnvoll sind.

**Empfehlung:** Wenn Spanisch eingeführt wird, direkt klären: Wer ist die Zielgruppe?
Spanien → `es-ES`, Lateinamerika → `es-419` oder `es-MX`. Nicht einfach `es/` anlegen und
hoffen, dass es für beide passt.

> **Sondercode `es-419`:** Der Code 419 steht für "Lateinamerika und Karibik" (UN M.49
> Region Code). Das ist eine gängige Lösung, wenn man nicht jedes einzelne Land
> (es-MX, es-AR, es-CO, es-CL, ...) separat pflegen möchte.

### Französisch: fr-FR vs. fr-CH vs. fr-CA

| Aspekt | fr-FR (Frankreich) | fr-CH (Schweiz) | fr-CA (Kanada) |
|---|---|---|---|
| Zahlenformat | 1 234,56 | 1'234.56 | 1 234,56 |
| Anrede | Tu/Vous (flexibel) | Vous (formeller) | Tu (lockerer) |
| Anglizismen | E-mail, week-end | E-mail, week-end | Courriel, fin de semaine |
| Mahlzeiten | Petit-déjeuner, déjeuner, dîner | Petit-déjeuner, dîner, souper | Déjeuner, dîner, souper |
| Währung | € (EUR) | CHF | $ (CAD) |

**Relevanz:** Schweizer Französisch unterscheidet sich hauptsächlich in Formatierung (Zahlen,
Währung) – gelöst über die `Intl`-API. Kanadisches Französisch hat stärkere Vokabularunterschiede
(Anglizismen werden bewusst vermieden, z.B. "courriel" statt "e-mail").

**Empfehlung:** `fr/` als Basis reicht für den Start. Kanadisches Französisch (`fr-CA`) wäre
die Variante, die am ehesten einen eigenen Override-Ordner rechtfertigt.

### Portugiesisch: pt-PT vs. pt-BR

| Aspekt | pt-PT (Portugal) | pt-BR (Brasilien) |
|---|---|---|
| Gerundium | Estou a fazer | Estou fazendo |
| "Du" | Tu | Você (formell: o senhor) |
| Rechtschreibung | óptimo, facto | ótimo, fato |
| Vokabular | Telemóvel, autocarro | Celular, ônibus |

**Relevanz:** Portugiesisch hat die **größten regionalen Unterschiede** aller hier
analysierten Sprachen. Ein brasilianischer Text klingt für Portugiesen so fremd wie
umgekehrt. Diese Varianten sind de facto **separate Übersetzungen**.

**Empfehlung:** Portugiesisch niemals nur als `pt/` anlegen. Immer explizit:
`pt-BR/` oder `pt-PT/` – oder beides. Eine gemeinsame Basisdatei mit Overrides funktioniert
hier kaum, weil zu viele Keys abweichen.

### Chinesisch: zh-Hans vs. zh-Hant

| Aspekt | zh-Hans (Vereinfacht) | zh-Hant (Traditionell) |
|---|---|---|
| Verwendung | China, Singapur | Taiwan, Hongkong, Macau |
| Schriftzeichen | 简体中文 | 繁體中文 |
| Vokabular | 软件 (Software) | 軟體 (Software) |

**Relevanz:** Vereinfachtes und traditionelles Chinesisch sind **komplett separate
Schriftsysteme**. Das sind keine "Varianten" – das sind eigene Übersetzungen.

**Empfehlung:** Immer als separate Sprachen behandeln: `zh-Hans/` und `zh-Hant/`.
Kein Fallback-Override-Pattern möglich.

---

## Übersicht: Wann lohnen sich regionale Varianten?

| Sprache | Varianten-Divergenz | Override-Pattern sinnvoll? | Empfehlung |
|---|---|---|---|
| **Deutsch** (DE/AT/CH) | Gering (Vokabular, ß→ss) | Ja, falls nötig | `de/` Basis, Override bei Bedarf |
| **Englisch** (US/GB/AU) | Mittel (Spelling, Datum) | Ja, falls nötig | `en/` Basis, Override bei Bedarf |
| **Spanisch** (ES/MX/419) | Hoch (Anrede, Vokabular) | Bedingt | Zielgruppe klären, ggf. direkt `es-419/` |
| **Französisch** (FR/CH/CA) | Mittel (Vokabular, Format) | Ja, falls nötig | `fr/` Basis, `fr-CA/` Override bei Bedarf |
| **Portugiesisch** (PT/BR) | Sehr hoch | Nein – separate Übersetzungen | `pt-BR/` und `pt-PT/` getrennt |
| **Chinesisch** (Hans/Hant) | Komplett unterschiedlich | Nein – separate Sprachen | `zh-Hans/` und `zh-Hant/` getrennt |

### Das universelle Pattern

```
Geringe Divergenz        → Basis + Override (de, en, fr)
Hohe Divergenz           → Zielgruppe klären, ggf. direkt regional (es)
Separate Schrift/Sprache → Immer getrennt (pt, zh)
```

---

## Formatierung vs. Text: Zwei separate Concerns

Das ist der wichtigste Punkt, der **für alle Sprachen gilt**:

| Concern | Tool | Beispiel |
|---|---|---|
| **Text** (Wörter, Sätze) | i18next Übersetzungsdateien | "Speichern", "Kurs starten" |
| **Format** (Datum, Zahlen, Währung) | Browser `Intl`-API | 13.04.2026, 1'234.56, CHF 12.99 |

Die `Intl`-API nutzt automatisch den korrekten regionalen Code aus dem Browser (`de-AT`,
`en-GB`, `fr-CH`, ...) – ganz ohne, dass regionale Übersetzungsdateien existieren müssen.

```typescript
// Datum: automatisch korrekt für US vs. GB
new Intl.DateTimeFormat('en-US').format(date)  // → "04/13/2026" (MM/DD)
new Intl.DateTimeFormat('en-GB').format(date)  // → "13/04/2026" (DD/MM)

// Währung: automatisch korrekt
new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(99.95)
// → "$99.95"
new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(99.95)
// → "£99.95"
new Intl.NumberFormat('de-CH', { style: 'currency', currency: 'CHF' }).format(99.95)
// → "CHF 99.95"
```

**Das bedeutet:** Selbst ohne eine einzige regionale Übersetzungsdatei bekommt ein User
aus der Schweiz korrekt formatierte Zahlen und Daten – solange wir die `Intl`-API mit dem
vollen Locale-Code nutzen.

---

## Gesamtempfehlung für die Lernwelt

| Phase | Sprachen | Ordnerstruktur |
|---|---|---|
| **Jetzt** (MVP) | Deutsch | `de/` |
| **Wenn Englisch kommt** | + Englisch | `de/`, `en/` |
| **Wenn DACH-Regionalisierung nötig** | + AT/CH-Overrides | `de/`, `de-AT/`, `de-CH/`, `en/` |
| **Wenn US/GB-Unterscheidung nötig** | + EN-Overrides | ..., `en/`, `en-US/`, `en-GB/` |
| **Wenn weitere Sprachen kommen** | Case by case | Abhängig von Divergenz (siehe Tabelle oben) |

Die Architektur unterstützt all das bereits – es ist eine reine Content-Entscheidung,
keine technische.
