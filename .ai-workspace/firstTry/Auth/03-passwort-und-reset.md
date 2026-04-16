# Passwort-Anforderungen & Reset-Flow

---

## Passwort-Anforderungen: Was ist sinnvoll?

Der Designer fragt explizit: **"Was sind die Passwort-Anforderungen?"** –
weil diese dem Nutzer beim Setzen des Passworts angezeigt werden müssen.

Die Antwort hängt davon ab, ob wir einen IdP nutzen (dessen Policy greift dann)
oder das Backend selbst validiert. Unabhängig davon gelten aktuelle Best Practices.

### Was sagen aktuelle Standards? (NIST SP 800-63B)

Das National Institute of Standards and Technology (NIST) hat 2017 und 2023 seine
Empfehlungen grundlegend überarbeitet. Die wichtigsten Punkte:

**✅ Empfohlen:**
- Mindestlänge: **8 Zeichen** (mehr ist besser, bis zu 64 Zeichen erlauben)
- Passwörter gegen bekannte Leak-Listen prüfen (HaveIBeenPwned-API oder lokale Liste)
- Lange Passphrasen explizit erlauben ("IchLiebeMeinenHund2024!")
- Passwort-Stärke-Indikator anzeigen (zxcvbn-Bibliothek empfohlen)

**❌ Nicht empfohlen (veraltete Best Practices):**
- Erzwungene Sonderzeichen ("mindestens 1 Großbuchstabe, 1 Zahl, 1 Sonderzeichen")
  → Führt zu vorhersehbaren Mustern: "Passwort1!"
- Regelmäßiger Passwortwechsel ohne Anlass
  → Führt zu schwächeren Passwörtern ("Passwort2024" → "Passwort2025")
- Maximale Länge unter 64 Zeichen (Passwort-Manager werden bestraft)

### Vorschlag für unsere Policy

```
Mindestanforderungen:
✅ Mindestens 8 Zeichen
✅ Maximal 128 Zeichen (für Passwort-Manager)
✅ Kein Leerzeichen am Anfang/Ende abschneiden (alle Unicode-Zeichen erlaubt)
✅ Gegen bekannte Leak-Listen prüfen (optional, aber empfohlen)

Keine Zeichenklassen erzwingen:
❌ KEINE "mindestens 1 Großbuchstabe" Regel
❌ KEINE "mindestens 1 Sonderzeichen" Regel

Passwort-Stärke-Anzeige (zxcvbn):
→ Visueller Indikator (Schwach / Mittel / Stark)
→ Konkretes Feedback: "Dieses Passwort ist bekannt" oder "Zu kurz"
```

### Warum kein Zeichenklassen-Zwang?

Weil er das Gegenteil von dem erreicht, was er soll:

```
Mit Zeichenklassen-Zwang einigt sich jeder auf:  "Passwort1!"
Ohne Zwang, aber mit Längenanforderung:           "IchMagKaffeeMitMilch"
                                                              ↑
                                             Das zweite ist objektiv sicherer
                                             (höhere Entropie durch Länge)
```

### Was dem Nutzer angezeigt wird (UI)

Das Frontend braucht eine **Echtzeit-Validierung** mit verständlichem Feedback:

```
Passwort: [______________]  ████░░  Mittel

✅ Mindestens 8 Zeichen
❌ Zu kurz (noch 3 Zeichen)
⚠️  Dieses Passwort ist zu häufig – bitte ein anderes wählen

Passwort bestätigen: [______________]
❌ Passwörter stimmen nicht überein
```

> Die Validierung passiert clientseitig (für UX) **und** serverseitig (für Sicherheit).
> Das Frontend zeigt nie "Du darfst dieses Zeichen nicht benutzen" –
> alles ist erlaubt, nur die Länge ist das harte Minimum.

---

## Passwort-Reset-Flow

### Was der Designer vorschlägt

> "Ich fände es gut, wenn der Nutzer die Wahl hätte, ob er einen Code aus
> der E-Mail oder ein Magic Link aus der E-Mail nutzt"

Beides ist machbar. Hier ein detaillierter Vergleich:

| | **Code (OTP)** | **Magic Link** |
|---|---|---|
| **Flow** | Nutzer gibt 6-8-stelligen Code ein | Nutzer klickt auf Link in E-Mail |
| **UX** | Bleibt im Browser-Tab | Wechselt zur E-Mail-App |
| **Sicherheit** | Gleich (Token bleibt auf dem Gerät) | Gleich (Token in URL) |
| **Missbrauchsrisiko** | Jemand sieht den Code über die Schulter | Geringer (Link ist länger/komplexer) |
| **Mobil** | Gut (Code aus E-Mail tippen) | Sehr gut (direkt einloggen) |
| **E-Mail-Prefetch-Problem** | Kein Problem | Mögliches Problem (s.u.) |
| **Implementierungsaufwand** | Etwas höher (Code-Eingabe UI) | Etwas einfacher |

> **Empfehlung**: Beide anbieten. Standard ist der Magic Link (1 Klick).
> Für Nutzer, die auf einem anderen Gerät sind, ist der Code die bessere Option.

---

## Reset-Flow A: Magic Link

```
1. Nutzer klickt "Passwort vergessen" auf der Login-Seite
2. Eingabe: E-Mail-Adresse
3. Backend: Existiert die E-Mail?
   → Ja: Token generieren (32 Byte, 15 Min.), E-Mail senden
   → Nein: Gleiche Antwort! ("Wenn die E-Mail registriert ist, wurde ein Link gesendet")
4. E-Mail: Link zu /auth/reset-password?token=XYZ
5. Frontend: Token aus URL lesen
6. Backend: Token validieren (existiert, gültig, nicht genutzt)
   → Ungültig: Fehlermeldung + "Neuen Link anfordern"
   → Gültig: Passwort-Formular anzeigen
7. Nutzer gibt neues Passwort ein (+ Bestätigung)
8. Backend: Neues Passwort setzen, Token invalidieren, alle Sessions beenden(!)
9. Redirect zu /login mit Erfolgsmeldung
```

### Das E-Mail-Prefetch-Problem

Manche E-Mail-Clients (Outlook, GMX, einige Anti-Spam-Filter) besuchen Links
in E-Mails automatisch (Linkvorschau / Virencheck). Das würde den Reset-Link
"verbrauchen", bevor der Nutzer ihn klickt.

**Lösung**: Der Link führt nicht direkt zur Aktion, sondern zu einer
Zwischenseite:

```
/auth/reset-password?token=XYZ
→ Zeigt: "Klicke auf 'Weiter', um dein Passwort zurückzusetzen"
→ Erst beim echten Klick wird der Token eingelöst (POST-Request, kein GET)
```

Damit wird der Token nicht durch einen GET-Prefetch verbraucht.

---

## Reset-Flow B: E-Mail-Code (OTP)

```
1. Nutzer klickt "Passwort vergessen"
2. Eingabe: E-Mail-Adresse
3. Backend: Code generieren (6-8 Ziffern, 15 Min. gültig), E-Mail senden
4. Frontend: Zeigt Code-Eingabefeld (der Nutzer bleibt im Tab!)
5. Nutzer gibt Code ein
6. Backend: Code prüfen
   → Falsch: Fehlermeldung (max. 5 Versuche, dann neuer Code nötig)
   → Richtig: "Code-Session" starten (temporäres Server-seitiges Token)
7. Frontend: Passwort-Formular anzeigen
8. Nutzer gibt neues Passwort ein
9. Backend: Passwort setzen, Session invalidieren, alle anderen Sessions beenden
10. Redirect zu /login
```

### Warum 6 Ziffern statt länger?

6 Ziffern = 10^6 = 1.000.000 Möglichkeiten. Mit Rate Limiting (5 Versuche / 15 Min.)
ist das sicher genug. Mehr Ziffern erhöhen die Tippfehler-Rate ohne großen
Sicherheitsgewinn.

---

## Wichtig: Sessions nach Reset invalidieren

Das Backend **muss** nach einem Passwort-Reset alle bestehenden Sessions / Tokens
invalidieren. Sonst kann ein Angreifer, der Zugriff auf den Account hatte
(und weswegen der Nutzer das Passwort resettet), eingeloggt bleiben.

```
Passwort-Reset erfolgt
    │
    ▼
Backend:
1. Neues Passwort-Hash speichern
2. Reset-Token invalidieren
3. Alle bestehenden Refresh-Tokens für diesen User löschen / invalidieren
4. Ggf. Nutzer per E-Mail benachrichtigen ("Dein Passwort wurde geändert")
    │
    ▼
Nutzer muss sich neu einloggen
```

---

## Zusammenfassung: Was das Frontend braucht

### Passwort-Setzen/Ändern (Registrierung + Reset)

- Echtzeit-Validierung der Passwortlänge
- Passwort-Stärke-Indikator (zxcvbn oder ähnlich)
- Passwort-Sichtbarkeit umschalten ("Auge"-Icon)
- Bestätigungsfeld mit Übereinstimmungs-Check
- Klare Fehlermeldungen direkt am Feld (kein Alert-Dialog)

### Passwort-Reset-Seite

- E-Mail-Eingabe mit generischer Erfolgsmeldung
- Zwischenseite für Magic Link (kein direktes Einlösen per GET)
- Code-Eingabefeld mit Auto-Submit bei vollständiger Eingabe (6 Ziffern)
- "Keinen Code erhalten? Erneut senden" mit Cooldown-Timer (z.B. 60 Sekunden)

---

## Offene Fragen

| Frage | Auswirkung |
|---|---|
| Default-Methode beim Reset: Code oder Magic Link? | UX-Design der Reset-Seite |
| Soll der Nutzer die Methode wählen können? | Mehr UI-Aufwand |
| Nach Passwort-Reset: Direkt einloggen oder neu einloggen? | UX-Entscheidung |
| Passwort-Änderung im Profil (wenn eingeloggt): Altes Passwort verlangen? | Sicherheit vs. UX |
| Sollen Passwörter gegen bekannte Leaks geprüft werden (HaveIBeenPwned)? | Backend + Datenschutz (nur Hashpräfix wird gesendet, nicht das Passwort selbst) |
