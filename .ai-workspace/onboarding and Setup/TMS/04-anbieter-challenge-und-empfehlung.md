# TMS-Anbieter: Challenge der bisherigen Empfehlung

---

## Ausgangslage

In `01-tms-vergleich.md` und `02-empfehlung-und-skalierungspfad.md` wurde **locize**
als Erstempfehlung gewählt. Die Begründung:

> "Nativste i18next-Integration, günstigster Einstieg ($7/Monat), CDN-Delivery
> eingebaut, vom gleichen Team wie i18next."

Dieses Dokument challenged diese Empfehlung systematisch und berücksichtigt
Faktoren, die in der bisherigen Analyse zu kurz kamen.

---

## 1. Was in der bisherigen Analyse fehlte

### 1.1 Tolgee – die Open-Source-Alternative

Tolgee wurde in der bisherigen Analyse komplett ignoriert. Das ist ein Fehler,
denn es ist eine der relevantesten Alternativen für unser Projekt:

| Eigenschaft | Details |
|---|---|
| Typ | Open-Source (Apache 2.0 Kern) + kommerzielle Cloud/EE |
| Self-Hosting | Ja – Docker Compose, eigene Infrastruktur |
| i18next-Integration | Ja – `@tolgee/i18next` (v6.4, aktiv gepflegt) |
| In-Context-Editing | Ja – direkt in der laufenden App |
| CDN-Delivery | Ja – "Content Delivery" in Cloud-Plänen |
| Pricing (Cloud) | Free: 500 Keys, 3 Seats; Team: €49/Mo; Business: €179/Mo |
| Pricing (Self-Hosted) | Kostenlos (Open-Source-Kern), EE-Features gegen Lizenz |

**Warum Tolgee relevant ist:**

- **Self-Hosting-Option** – Keine Abhängigkeit von einem SaaS-Anbieter. Daten
  bleiben auf eigener Infrastruktur. Für ein Lernplattform-Projekt mit
  potenziellen Datenschutzanforderungen (Bildungsbereich!) ein echtes Argument.
- **In-Context-Editing** – Übersetzer sehen die Texte direkt in der laufenden
  App, nicht in einer abstrakten Key-Value-Tabelle. Das ist für Non-Devs die
  beste UX, die es gibt.
- **Kein Vendor-Lock-in** – Open-Source-Kern ist Apache 2.0. Im schlimmsten
  Fall kann man den Service selbst betreiben.

**Warum Tolgee problematisch sein kann:**

- Cloud-Pricing ist **teurer als locize** bei gleichem Umfang (€49 vs. $7 für
  den Einstieg)
- Self-Hosting erfordert **eigene Infrastruktur** und Wartung (Docker, Postgres,
  Backups)
- Kleinere Community als Crowdin
- Weniger reif als locize/Crowdin bei i18next-spezifischen Features
  (kein `saveMissing` nativ)

### 1.2 Die locize-i18next-Beziehung: Feature oder Risiko?

Die bisherige Analyse feiert die Tatsache, dass locize und i18next vom gleichen
Team stammen, als reinen Vorteil. Das verdient eine differenziertere Betrachtung:

**Vorteile (wurden genannt):**
- Tiefste Integration, `saveMissing`, kein Adapter nötig
- Das Team versteht i18next-Interna besser als jeder Konkurrent

**Risiken (wurden NICHT genannt):**

1. **Interessenkonflikt:** i18next ist Open Source (MIT), aber locize ist das
   Geschäftsmodell dahinter. Das i18next-Team hat in v25.8.0 einen
   `console.info`-Hinweis auf locize in die Library eingebaut – was in der
   Community erheblichen Widerstand auslöste (in v26.0.0 wieder entfernt).
   Das zeigt: Die Grenze zwischen "Open-Source-Library" und "kommerzielles
   Produkt" ist bei diesem Team fließend.

2. **Kleine Firma, kleines Team:** locize wird von einem sehr kleinen Team
   betrieben (die i18next-Maintainer). Wenn die Firma Probleme bekommt oder
   das Team ausfällt, gibt es kein großes Unternehmen als Backup. Crowdin hat
   ~200 Mitarbeiter, Phrase ist Teil der Memsource-Gruppe.

3. **Abhängigkeits-Cluster:** Wenn wir i18next UND locize nutzen, hängt die
   gesamte Lokalisierungskette an einem Team. Bei Crowdin oder Tolgee wäre die
   Library (i18next) vom TMS (Crowdin/Tolgee) entkoppelt – verschiedene Teams,
   verschiedene Firmen.

**Bewertung:** Das Risiko ist real, aber managebar. locize hat keinen
Vendor-Lock-in (Export jederzeit möglich). Und i18next bleibt MIT-lizenziert,
egal was mit locize passiert. Aber man sollte sich des Klumpenrisikos bewusst
sein.

### 1.3 Non-Dev-Usability: locize vs. Crowdin

Die bisherige Analyse gibt locize bei "Non-Dev-Usability" ⭐⭐ und Crowdin ⭐⭐⭐.
Das ist ein **kritischer Punkt**, denn unser Ticket sagt explizit:

> "Translations must be manageable by non-developers."

Software-Bewertungsportale bestätigen das:

| Plattform | Ease of Use (SoftwareAdvice) |
|---|---|
| locize | 3.9 / 5 |
| Crowdin | 4.67 / 5 |
| Lokalise | 4.78 / 5 |

locize ist primär für Entwickler gebaut. Die UI ist funktional, aber technisch.
Für PMs und Übersetzer ohne technischen Hintergrund kann Crowdins Editor
deutlich intuitiver sein.

---

## 2. Aktualisierte Preisvergleichstabelle (Stand April 2026)

Die Preise in `01-tms-vergleich.md` waren teilweise veraltet. Hier die
korrigierten Werte:

### locize (Fixed Plans, USD)

| Plan | Preis/Mo | Wörter | Sprachen | Namespaces | Users | Std-CDN-Downloads |
|---|---|---|---|---|---|---|
| Free | $0 | 1.000 | 2 | 5 | 1 | 10.000 |
| Starter | $7 | 5.000 | 5 | 10 | 5 | 500.000 |
| Starter-Plus | $19 | 10.000 | 7 | 25 | 5 | 1.000.000 |
| Growth | $49 | 20.000 | 10 | 50 | 10 | 3.000.000 |
| Professional | $99 | 50.000 | 20 | 75 | Unbegrenzt | 5.000.000 |
| Enterprise | $199 | 100.000 | 150 | 300 | Unbegrenzt | 10.000.000 |

Alternativ: Usage-Based ab $5/Mo Grundgebühr + variable Kosten.

### Crowdin (USD)

| Plan | Preis/Mo | Zielgruppe |
|---|---|---|
| Free (OSS) | $0 | Open-Source-Projekte |
| Team | ab $59 | Kleine Teams (per-Seat) |
| Business | ab $100+ | Mehr Seats, Sprachen |
| Enterprise | Custom | Große Organisationen |

### Tolgee (Cloud, EUR, jährlich)

| Plan | Preis/Mo | Keys | Seats | MT-Credits |
|---|---|---|---|---|
| Free | €0 | 500 | 3 | 10.000 |
| Team | €49 | 2.000 | 4 | 10.000 |
| Business | €179 | 5.000 | 8 | 1.000.000 |
| Advanced | €499 | 20.000 | 20 | 1.000.000 |

Self-Hosted: Open-Source-Kern kostenlos, EE-Features gegen Cloud-Lizenz.

### Phrase Strings (USD, jährlich)

| Plan | Preis/Mo | Strings Seats |
|---|---|---|
| Software UI/UX | $525 | 15 |
| Team | $1.245 | 20 |
| Enterprise | Custom | Custom |

---

## 3. Die echte Entscheidungsmatrix

Die bisherige Matrix hatte 3 Kandidaten. Hier erweitert auf 5, mit gewichtetem
Scoring basierend auf unseren Ticket-Anforderungen:

### Gewichtung nach Ticket-Priorität

| Kriterium | Gewicht | Begründung |
|---|---|---|
| Non-Dev-Usability | **30%** | Ticket: "manageable by non-developers" |
| i18next-Integration | **25%** | Architekturentscheidung steht fest |
| Kosten (Startup-Phase) | **20%** | Budgetbegrenzung |
| Git-Sync / Automatisierung | **15%** | Source of Truth = Git-Repo |
| Zukunftssicherheit | **10%** | Vendor-Diversität, Community, Exit-Optionen |

### Scoring (1–5, 5 = beste Bewertung)

| Kriterium (Gewicht) | locize | Crowdin | Tolgee | Phrase | SimpleLocalize |
|---|---|---|---|---|---|
| **Non-Dev-Usability (30%)** | 3 | 5 | 4 | 5 | 3 |
| **i18next-Integration (25%)** | 5 | 4 | 4 | 3 | 3 |
| **Kosten Startup (20%)** | 5 | 3 | 3 | 1 | 5 |
| **Git-Sync (15%)** | 3 | 5 | 4 | 4 | 4 |
| **Zukunftssicherheit (10%)** | 3 | 5 | 4 | 5 | 2 |
| **Gewichteter Score** | **3.80** | **4.40** | **3.80** | **3.55** | **3.45** |

### Berechnung

```
locize:         3×0.30 + 5×0.25 + 5×0.20 + 3×0.15 + 3×0.10 = 3.80
Crowdin:        5×0.30 + 4×0.25 + 3×0.20 + 5×0.15 + 5×0.10 = 4.40
Tolgee:         4×0.30 + 4×0.25 + 3×0.20 + 4×0.15 + 4×0.10 = 3.80
Phrase:         5×0.30 + 3×0.25 + 1×0.20 + 4×0.15 + 5×0.10 = 3.55
SimpleLocalize: 3×0.30 + 3×0.25 + 5×0.20 + 4×0.15 + 2×0.10 = 3.45
```

---

## 4. Überraschung: Crowdin gewinnt – nicht locize

Wenn man die Ticket-Anforderung "manageable by non-developers" ernst nimmt und
entsprechend gewichtet, **gewinnt Crowdin** klar.

### Warum die bisherige Empfehlung (locize) trotzdem nicht falsch war

Die bisherige Empfehlung hat die **Entwickler-Perspektive** in den Vordergrund
gestellt: beste i18next-Integration, günstigster Einstieg, `saveMissing`. Das
sind valide Kriterien für die Aufbauphase, in der primär Entwickler die Texte
pflegen.

### Warum Crowdin bei einer Non-Dev-Priorisierung gewinnt

| Punkt | locize | Crowdin |
|---|---|---|
| Editor-UX für Übersetzer | Funktional, technisch | Intuitiv, visuell, poliert |
| In-Context-Editor | Nein (nur Keys) | Ja (zeigt die App) |
| Community-Features | Keine | Voting, Crowd-Übersetzer, Diskussionen |
| GitHub-Integration | CLI + manuelle GitHub Action | **Native GitHub-App** (1-Klick-Setup) |
| Bekanntheitsgrad bei Übersetzern | Gering | Hoch (de-facto-Standard) |
| Agentur-Anbindung | Schwierig | Einfach (Crowdin ist Agenturen bekannt) |
| Free Tier (Non-OSS) | 1.000 Wörter, 1 User | Kein Free Tier für Non-OSS |
| OTA-Updates | CDN nativ | Ja (OTA JS Client) |

### Das Kostenproblem von Crowdin

Crowdin ist teurer, besonders wenn man es richtig rechnet:
- Crowdin Team ab **$59/Mo** vs. locize Starter **$7/Mo**
- Crowdin rechnet **per Seat** – bei 5 Usern schnell $200+/Mo
- locize Starter enthält 5 User für $7/Mo (!)

Das ist ein 8–30× Preisunterschied beim Einstieg.

---

## 5. Die ehrliche Empfehlung: Es kommt auf die Phase an

Es gibt keinen "besten" Anbieter. Es gibt den richtigen Anbieter für die
**aktuelle Situation**.

### Entscheidungsbaum

```
Frage 1: Wer pflegt JETZT die Texte?
├── Nur Entwickler → Phase 1 (JSON im Repo), kein TMS nötig
│   Kosten: $0
│
└── Entwickler + mindestens 1 Non-Dev → weiter ↓

Frage 2: Budget?
├── < $20/Mo → locize Starter ($7)
│   ✅ Beste DX, saveMissing, CDN eingebaut
│   ⚠️ Non-Dev-UX "okay", nicht "great"
│
├── $50–100/Mo → Crowdin Team ODER Tolgee Team
│   ✅ Crowdin: Beste Non-Dev-UX, native GitHub-App
│   ✅ Tolgee: Self-Hosting-Option, In-Context-Editing
│   ⚠️ Beide: Per-Seat-Kosten können skalieren
│
└── > $100/Mo → Crowdin Business
    ✅ Enterprise-Features, Agentur-Anbindung
    ⚠️ Overkill für < 5 Übersetzer

Frage 3: Datenschutz-Anforderungen (Bildungsbereich)?
├── Streng (Daten dürfen EU nicht verlassen) → Tolgee Self-Hosted
│   ✅ Volle Datenkontrolle
│   ⚠️ Eigene Infrastruktur + Wartung
│
└── Standard → Alle Cloud-Anbieter (GDPR-konform)

Frage 4: Wird eine Übersetzungsagentur eingebunden?
├── Ja → Crowdin (Agenturen kennen es, fertige Workflows)
└── Nein → locize oder Tolgee
```

### Konkrete Empfehlung für die Lernwelt

#### Szenario A: Nur das Dev-Team pflegt Texte (nächste 3–6 Monate)

**→ locize Starter ($7/Mo)**

- Entwickler profitieren maximal von `saveMissing` und CDN
- Die Integration ist 1 Zeile Config-Änderung
- Kosten sind minimal
- Wenn später Non-Devs dazukommen, kann man immer noch wechseln

#### Szenario B: PM oder Übersetzer kommen bald dazu (< 3 Monate)

**→ Crowdin Team ($59/Mo)**

- Die Non-Dev-UX ist das stärkste Feature
- Die native GitHub-App spart Setup-Zeit
- i18next-JSON wird nativ unterstützt (kein Adapter nötig)
- OTA-Updates sind verfügbar (wenn später CDN-Delivery gewünscht)

#### Szenario C: Strikte Datenschutzanforderungen (Bildungsbereich)

**→ Tolgee Self-Hosted (kostenlos, EE-Lizenz bei Bedarf)**

- Daten bleiben auf eigener Infrastruktur
- Open-Source-Kern gibt maximale Kontrolle
- In-Context-Editing ist die beste Non-Dev-UX
- Erfordert aber Docker-Infrastruktur und Wartung

---

## 6. Kritik an der "Starte mit locize, wechsle zu Crowdin"-Strategie

Die bisherige Empfehlung in `02-empfehlung-und-skalierungspfad.md` war:

> "Starte mit locize, evaluiere Crowdin wenn das Team wächst."

Das klingt vernünftig, hat aber einen Haken:

### Der Wechselkostenargument

Ein TMS-Wechsel ist kein simpler Config-Swap. Das muss man machen:

1. **Alle Translations exportieren** (locize → JSON → Crowdin importieren)
2. **GitHub-Integration umstellen** (locize-CLI entfernen, Crowdin-App installieren)
3. **CI/CD-Pipeline ändern** (andere GitHub Action, andere Secrets)
4. **Alle Übersetzer umschulen** (neue UI, neuer Workflow)
5. **Translation Memory migrieren** (oder verlieren)
6. **Review-Workflows neu aufsetzen**

Das ist kein halber Tag – das ist **1–2 Wochen Aufwand**, wenn man es richtig macht.

### Die Gegenposition

Andererseits: Wenn das Team in 6 Monaten noch nicht weiß, ob Non-Devs involviert
werden, ist locize für $7/Mo der risikoärmste Einstieg. Man zahlt wenig, lernt
viel, und der Wechsel ist zwar aufwändig, aber machbar.

### Fazit

Die "starte günstig, wechsle später"-Strategie funktioniert nur, wenn man den
Wechselaufwand ehrlich einpreist. Wenn absehbar ist, dass Non-Devs in < 6 Monaten
dazukommen, ist es sinnvoller, direkt mit dem richtigen Tool zu starten.

---

## 7. Zusammenfassung: Wer sollte was wählen?

| Situation | Empfehlung | Kosten/Mo | Stärke |
|---|---|---|---|
| Nur Devs, Budget tight | **locize Starter** | $7 | Beste DX, `saveMissing`, CDN |
| Non-Devs kommen bald | **Crowdin Team** | $59+ | Beste Non-Dev-UX, GitHub-App |
| Datenschutz kritisch | **Tolgee Self-Hosted** | $0 (+ Infra) | Volle Datenkontrolle |
| Enterprise, Agenturen | **Crowdin Business / Phrase** | $100–525+ | Compliance, Workflows |
| Minimal, nur JSON-Sync | **SimpleLocalize** | €12 | Einfach, günstig, funktional |

### Für die Lernwelt konkret

**Empfehlung: Crowdin** – aus folgenden Gründen:

1. **Ticket-Anforderung ist klar:** "manageable by non-developers" – das ist
   Crowdins Kernkompetenz, nicht locizes
2. **Die Lernwelt ist eine Bildungsplattform** – es ist absehbar, dass Content-
   Teams (PMs, Didaktik, Übersetzer) irgendwann Texte pflegen werden
3. **GitHub-Integration ist erstklassig** – Native App, keine manuelle
   GitHub-Action-Konfiguration nötig
4. **i18next-JSON wird nativ unterstützt** – kein Adapter, Plurale und
   Interpolation funktionieren out-of-the-box
5. **Community und Docs** – deutlich größer als bei locize. Wenn man googelt,
   findet man Crowdin-Lösungen
6. **Preispunkt ist fair** – $59/Mo für den Team-Plan ist mehr als $7/Mo, aber
   angemessen für das, was man bekommt

### Wenn das Budget ein Showstopper ist

Falls $59/Mo aktuell nicht drin sind:

1. **Phase 1 (jetzt):** JSON im Repo, kein TMS → $0
2. **Phase 2 (wenn Non-Devs kommen):** Crowdin Team → $59/Mo
3. Kein Zwischenschritt über locize → kein doppelter Migrationsaufwand

---

## 8. Offene Fragen für das Team

Bevor die finale Entscheidung fällt, sollten diese Fragen geklärt werden:

1. **Wann kommen Non-Devs ins Spiel?** Wenn erst in 6+ Monaten → locize Starter
   als Brücke ist vertretbar. Wenn in < 3 Monaten → direkt Crowdin.

2. **Gibt es Datenschutzanforderungen?** Bildungsplattform + DSGVO + evtl.
   Landesdatenschutzgesetze → Tolgee Self-Hosted prüfen.

3. **Wird eine Übersetzungsagentur eingebunden?** Wenn ja → Crowdin (Agenturen
   arbeiten damit). Wenn internes Team → locize oder Tolgee reichen.

4. **Wie viele Sprachen sind geplant?** 2–3 Sprachen → locize Free/Starter reicht.
   5+ Sprachen → Crowdin wird effektiver (bessere Review-Workflows).

5. **Budget-Ceiling?** < $20/Mo → locize. $50–100/Mo → Crowdin. Eigene
   Infrastruktur vorhanden → Tolgee Self-Hosted.
