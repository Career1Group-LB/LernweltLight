# Schritt 6: In welcher Reihenfolge baue ich die Features?

## Das Prinzip: Abhängigkeiten bestimmen die Reihenfolge

Du kannst nicht alles gleichzeitig bauen. Manche Features hängen von anderen ab, und manche brauchen Backend-Services, die noch nicht existieren.

## Die Reihenfolge

### Phase 1: Kern (ohne das läuft nichts)

Diese Features sind Voraussetzung für alles andere.

```
Woche 1-2
┌─────────────────────────────────────────────┐
│  1. Auth (Login, Logout, Token-Handling)     │
│  2. Kursübersicht (Liste aller Kurse)        │
│  3. Kursdetail (Module, Lerneinheiten)       │
│  4. Aktivitäts-Ansicht (Content Blocks)      │
└─────────────────────────────────────────────┘
```

**Warum diese Reihenfolge?**
- **Auth** muss zuerst funktionieren, weil alle API-Calls einen Token brauchen
- **Kurse** sind das Kernfeature – ohne Kurse gibt es keine Lernwelt
- **Aktivitäts-Ansicht** ist der Content-Block-Renderer – die komplexeste einzelne Komponente

**Was du am Ende hast:** Ein User kann sich einloggen, Kurse sehen, durch Module/Lerneinheiten navigieren und Inhalte anschauen.

**Backend-Abhängigkeit:** Auth Service + Content Service müssen zumindest als Mock stehen.

---

### Phase 2: Lernfortschritt (damit Lernen messbar wird)

```
Woche 3-4
┌─────────────────────────────────────────────┐
│  5. Progress (Fortschrittsanzeige)           │
│  6. Aktivität abschließen / als gesehen     │
│     markieren                                │
│  7. Zeiterfassung (Start/Stop/Pause)         │
└─────────────────────────────────────────────┘
```

**Warum jetzt?**
- Ohne Fortschritt ist die Lernwelt nur ein "Kurs-Viewer"
- Zeiterfassung ist für die Bildungsträger wichtig (gesetzliche Anforderung)
- Diese Features interagieren direkt mit den Kursen aus Phase 1

**Was du am Ende hast:** User kann Kurse durcharbeiten, Fortschritt wird getrackt, Lernzeit wird erfasst.

**Backend-Abhängigkeit:** Progress Service + Time Tracking Service

---

### Phase 3: Assessment (Lernerfolg messen)

```
Woche 5-6
┌─────────────────────────────────────────────┐
│  8. Quiz (Quiz-Player, Ergebnisse)           │
│  9. Übungen (Abgabe, Bewertung)              │
│  10. Zertifikate (Anzeige, Download)         │
└─────────────────────────────────────────────┘
```

**Warum jetzt?**
- Quizze sind in den Kursinhalten eingebettet → braucht Phase 1
- Zertifikate hängen von Kursabschluss ab → braucht Phase 2
- Zusammen bilden diese Features den "Lern-Loop": Lernen → Quiz → Zertifikat

**Backend-Abhängigkeit:** Quiz Service + Exercise Service + Certificate Service

---

### Phase 4: Benutzerprofil & Personalisierung

```
Woche 7-8
┌─────────────────────────────────────────────┐
│  11. Profil (Persönliche Daten, Skills)      │
│  12. Notizen (CRUD, Ordner, Verknüpfungen)  │
│  13. Anwesenheiten & Abwesenheiten           │
└─────────────────────────────────────────────┘
```

**Warum jetzt?**
- Profil braucht Auth (Phase 1)
- Notizen können mit Aktivitäten verknüpft werden → braucht Phase 1
- Anwesenheiten hängen von Zeiterfassung ab → braucht Phase 2

**Backend-Abhängigkeit:** Profile Service + Notes Service

---

### Phase 5: Content & Information

```
Woche 9-10
┌─────────────────────────────────────────────┐
│  14. News (Übersicht, Detail)                │
│  15. FAQ                                     │
│  16. Glossar                                 │
│  17. Mediathek                               │
└─────────────────────────────────────────────┘
```

**Warum jetzt?**
- Diese Features sind relativ einfach (Daten laden und anzeigen)
- Sie haben wenige Abhängigkeiten zu anderen Features
- Gute "Zwischendurch-Features" wenn auf Backend-Services gewartet wird

**Backend-Abhängigkeit:** Content Service (liefert auch News, FAQ, Glossar, Mediathek)

---

### Phase 6: Social & Kommunikation

```
Woche 11-12
┌─────────────────────────────────────────────┐
│  18. Campus / Chat (GetStream Integration)   │
│  19. Livestream (GetStream Video)            │
└─────────────────────────────────────────────┘
```

**Warum zuletzt?**
- Komplexe externe Dependencies (GetStream SDK)
- Brauchen Real-time Infrastruktur
- Nicht MVP-kritisch (können nachgeliefert werden)

**Backend-Abhängigkeit:** GetStream Integration + Campus Service

---

### Phase 7: Job & Karriere (Feature-Flag-abhängig)

```
Woche 13+
┌─────────────────────────────────────────────┐
│  20. Stellenangebote (Job Offers)            │
│  21. Vermittlung (Placement)                 │
│  22. Tracking / Analytics                    │
└─────────────────────────────────────────────┘
```

**Warum ganz am Ende?**
- Hinter Feature Flags → nicht für alle Brands aktiv
- Brauchen spezielle Backend-Services
- Tracking kann parallel entwickelt werden

---

## Visualisierung: Abhängigkeits-Graph

```
Auth ─────────────────────────────────────────────┐
  │                                                │
  ├── Kurse ──────────────────────────────────┐    │
  │     │                                     │    │
  │     ├── Progress ───── Zertifikate        │    │
  │     │                                     │    │
  │     ├── Quiz ─────────┘                   │    │
  │     │                                     │    │
  │     ├── Übungen                           │    │
  │     │                                     │    │
  │     ├── Notizen (verknüpft mit Aktivitäten)    │
  │     │                                     │    │
  │     └── Aktivitäts-Ansicht (Content Blocks)    │
  │                                                │
  ├── Zeiterfassung                                │
  │                                                │
  ├── Profil                                       │
  │     └── Job Offers / Placement                 │
  │                                                │
  ├── News, FAQ, Glossar, Mediathek (unabhängig)   │
  │                                                │
  └── Campus, Livestream (GetStream)               │
```

## Pattern für jedes Feature (immer gleich)

Egal welches Feature du als nächstes baust – der Ablauf ist immer der gleiche:

```
1.  Schema       → Zod Schema in features/{name}/schemas/
2.  API          → API-Funktionen in features/{name}/api/
3.  Hooks        → React Query Hooks in features/{name}/hooks/
4.  Components   → UI-Komponenten in features/{name}/components/
5.  Export       → Barrel Export in features/{name}/index.ts
6.  Route        → Route in router/routes.tsx ergänzen
7.  Navigation   → Link in layouts/Sidebar.tsx ergänzen
8.  Feature Flag → useFeatureFlag() für optionale Features
```

Dieses Pattern ist dein "Rezept". Einmal gelernt, funktioniert es für alle 20+ Features.

## Timing und Realität

### Was du kontrollieren kannst

- Ordnerstruktur und Foundation (Phase 1-2 Setup)
- Mock-basierte Entwicklung
- UI-Komponenten und Hooks

### Was du NICHT kontrollieren kannst

- Wann welcher Microservice fertig ist
- Wann API-Contracts final sind
- Wann Design-Entscheidungen getroffen werden

### Strategie dafür

1. **Mock-First Development:** Baue Features mit Mock-Daten. Sobald das echte Backend steht, tauschst du die Mocks gegen echte API-Calls – die Hooks und Komponenten bleiben gleich.

2. **API-Contract-Driven:** Wenn das Backend-Team OpenAPI Specs liefert, kannst du daraus direkt Zod Schemas und TypeScript Types generieren.

3. **Feature Flags nutzen:** Baue Features hinter Feature Flags. Dann können unfertige Features im Code sein, ohne in Production sichtbar zu sein.

4. **Kommuniziere Abhängigkeiten:** Sag dem Backend-Team frühzeitig, welche Services du als nächstes brauchst. So können sie priorisieren.

## Checkliste: Gesamtüberblick

- [ ] **Phase 1:** Auth + Kurse + Content Blocks → MVP
- [ ] **Phase 2:** Progress + Zeiterfassung → Lernen messbar
- [ ] **Phase 3:** Quiz + Übungen + Zertifikate → Lernerfolg
- [ ] **Phase 4:** Profil + Notizen + Anwesenheiten → Personalisierung
- [ ] **Phase 5:** News + FAQ + Glossar + Mediathek → Information
- [ ] **Phase 6:** Campus + Livestream → Social
- [ ] **Phase 7:** Job Offers + Placement + Tracking → Karriere

---

**Du hast jetzt einen kompletten Fahrplan. Von "leeres Projekt" bis "fertige Lernwelt". Viel Erfolg!**
