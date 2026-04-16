# ADR 0013 – Real-Time / GetStream Integration

**Status:** Proposed  
**Datum:** offen  
**Entscheider:** Lernwelt Frontend Team

---

## Kontext

Die aktuelle Lernwelt-App nutzt **GetStream** für Chat und Video (Livestream). GetStream ist ein externer Service mit eigenem SDK. Im neuen React-Frontend muss entschieden werden wie und wann diese Integration gebaut wird und welche Teile weiterhin GetStream verwenden vs. vom neuen Backend abgelöst werden.

Außerdem gibt es generell offene Fragen zu Real-Time Updates (z.B. "Neue Nachricht"-Badge ohne Page-Reload).

## Relevante Features

| Feature | Aktuell | Status im Rewrite |
|---|---|---|
| **Chat** | GetStream Chat SDK | Noch unklar |
| **Livestream / Video** | GetStream Video SDK | Noch unklar |
| **Live-Benachrichtigungen** | Unbekannt | Noch nicht definiert |
| **Kurs-Fortschritt sync** | Supabase Realtime | Wird mit Go-Backend neu gelöst |

## Technische Optionen für Real-Time

| Option | Beschreibung | Einsatz |
|---|---|---|
| **GetStream SDK** | Direktintegration des offiziellen React SDK | Chat, Video |
| **WebSockets (native)** | Browser-native WebSocket API | Live-Updates vom Backend |
| **Server-Sent Events (SSE)** | Einfachere Alternative zu WebSockets, nur Server→Client | Benachrichtigungen, Fortschritt |
| **React Query Polling** | Regelmäßiges Refetching (kein WebSocket) | Einfache Updates ohne Echtzeit-Anforderung |

## Offene Fragen

- Bleibt GetStream für Chat/Video oder wird das vom neuen Backend abgelöst?
- Welche Features brauchen echte Real-Time-Updates (WebSocket/SSE) vs. gelegentliches Polling?
- Wann im Projekt-Zeitplan werden Chat und Video gebaut? (Sicher nicht im MVP)
- Wie wird GetStream-Authentifizierung gehandelt (User-Token vom Backend)?
- Gibt es einen Feature-Flag für Livestream (`liveStream` Flag existiert bereits in `common.ts`)?

## Abhängigkeiten

→ Hängt davon ab was der **Livestream-Microservice** im Backend voraussetzt.  
→ Feature-Flag `liveStream` bereits in `src/shared/types/common.ts` vorbereitet.
