# Vercel React Best Practices – Agent Skill

**Quelle:** https://medium.com/@dan.avila7/vercel-just-dropped-the-react-bible-as-a-claude-code-skill-0c1cd905a1b4  
**Offizieller Vercel Blog:** https://vercel.com/blog/introducing-react-best-practices  
**GitHub Repository:** https://github.com/vercel-labs/agent-skills  
**Veröffentlicht:** 14. Januar 2026  
**Autoren (Vercel):** Shu Ding, Andrew Qu

---

## Was ist das?

Vercel hat über 10 Jahre Erfahrung mit React- und Next.js-Performance in einem strukturierten
Repository namens `react-best-practices` destilliert. Es ist explizit für **AI Agents und LLMs**
optimiert und als installierbarer **Agent Skill** verfügbar (22.000+ GitHub Stars).

Die einzelnen Regel-Dateien kompilieren zu einer einzigen `AGENTS.md`, die der Agent bei
Code-Reviews und Refactorings automatisch referenziert.

---

## Installation

```bash
npx skills add vercel-labs/agent-skills
```

**Kompatible Agents/Tools:** Claude Code, Cursor, Codex, OpenCode

---

## Die 8 Kategorien (geordnet nach Auswirkung)

| Priorität | Kategorie | Worum geht es? |
|-----------|-----------|----------------|
| 🔴 CRITICAL | Async Waterfalls eliminieren | Sequentielle `await`-Ketten, die unnötig warten |
| 🔴 CRITICAL | Bundle Size reduzieren | Zu große Client-Bundles durch falsche Imports |
| 🟠 HIGH | Server-Side Performance | Server-Komponenten, Caching, SSR-Optimierungen |
| 🟠 HIGH | Client-Side Data Fetching | Daten-Fetching-Muster, parallele Requests |
| 🟡 MEDIUM | Re-Render-Optimierung | Unnötige Renders durch schlechte State-Struktur |
| 🟡 MEDIUM | Rendering Performance | Virtualisierung, Memoization |
| 🟢 LOW | Advanced Patterns | Fortgeschrittene Kompositionsmuster |
| 🟢 LOW | JavaScript Micro-Optimierungen | Loop-Effizienz, Garbage Collection |

**Gesamt: 40+ konkrete Regeln**, jede mit Impact-Rating und Vorher/Nachher-Codebeispielen.

---

## Kernphilosophie: Reihenfolge zählt

Performance-Arbeit scheitert meist, weil sie **zu tief im Stack** beginnt.

> *"If a request waterfall adds 600ms of waiting time, it doesn't matter how optimized your
> `useMemo` calls are."* – Vercel Engineering

Die richtige Reihenfolge:
1. **Bundle Size reduzieren** (zuerst – trifft jeden User bei jedem Seitenaufruf)
2. **Waterfalls eliminieren** (zweithöchste Auswirkung)
3. Server-Side Performance
4. Client-Side Fetching
5. Re-Renders
6. Micro-Optimierungen (zuletzt)

Performance-Schulden sind kumulativ: Eine kleine Regression heute wird zur dauerhaften Last
auf jede User-Session.

---

## Konkrete Beispielregeln

### 1. Unnötige Awaits blockieren (CRITICAL)

```typescript
// ❌ FALSCH – wartet auf userData, auch wenn skipProcessing=true
async function handleRequest(userId: string, skipProcessing: boolean) {
  const userData = await fetchUserData(userId); // blockiert immer

  if (skipProcessing) {
    return { skipped: true }; // userData nie genutzt
  }

  return processUserData(userData);
}

// ✅ RICHTIG – Guard Clause zuerst
async function handleRequest(userId: string, skipProcessing: boolean) {
  if (skipProcessing) {
    return { skipped: true };
  }

  const userData = await fetchUserData(userId); // nur wenn nötig
  return processUserData(userData);
}
```

### 2. Parallele Awaits statt sequentieller (CRITICAL)

```typescript
// ❌ FALSCH – sequentiell, obwohl unabhängig
const user = await fetchUser(id);
const settings = await fetchSettings(id);

// ✅ RICHTIG – parallel
const [user, settings] = await Promise.all([
  fetchUser(id),
  fetchSettings(id),
]);
```

### 3. Lazy State Initialization (MEDIUM)

```typescript
// ❌ FALSCH – JSON.parse() bei jedem Render
const [config, setConfig] = useState(JSON.parse(localStorage.getItem('config')));

// ✅ RICHTIG – nur beim ersten Render
const [config, setConfig] = useState(() => JSON.parse(localStorage.getItem('config')));
```

### 4. Loop-Effizienz (LOW)

```typescript
// ❌ FALSCH – 8 separate Iterationen über dieselbe Liste
const unread = messages.filter(m => !m.read);
const pinned = messages.filter(m => m.pinned);
const fromToday = messages.filter(m => isToday(m.date));
// ...

// ✅ RICHTIG – ein einziger Durchlauf
const { unread, pinned, fromToday } = messages.reduce((acc, m) => {
  if (!m.read) acc.unread.push(m);
  if (m.pinned) acc.pinned.push(m);
  if (isToday(m.date)) acc.fromToday.push(m);
  return acc;
}, { unread: [], pinned: [], fromToday: [] });
```

---

## Herkunft der Regeln

Alle Regeln stammen aus **echten Production-Codebases**, nicht aus theoretischen Überlegungen.
Vercel hat diese Muster über 10+ Jahre bei der Arbeit mit Kunden gesammelt und kodifiziert.

---

## Relevanz für dieses Projekt

Das Konzept ist dem Ansatz in diesem Projekt (`AGENTS.md`) sehr ähnlich – Projektregeln als
maschinenlesbare Datei für AI Agents. Mögliche Übernahmen:

| Vercel Skill-Regel | Relevanz für Lernwelt |
|---|---|
| Parallele Awaits in API-Funktionen | Hoch – mehrere unabhängige Microservice-Calls |
| Guard Clauses vor teuren Awaits | Hoch – Middleware/Auth-Logik |
| Lazy State Initialization | Mittel – Filter-/UI-State in Zustand |
| Bundle Size via Dynamic Imports | Hoch – Lazy Loading bereits im Router |
| Loop-Effizienz | Niedrig – dünner Client, wenig Datenverarbeitung |

### Nicht relevant für dieses Projekt

- Next.js-spezifische Server Components (→ Vite/React SPA)
- SSR/SSG-Regeln (→ kein Next.js)
- App Router Patterns (→ React Router v6)

---

## Links

- [Medium Artikel (Paywall)](https://medium.com/@dan.avila7/vercel-just-dropped-the-react-bible-as-a-claude-code-skill-0c1cd905a1b4)
- [Vercel Offizieller Blog](https://vercel.com/blog/introducing-react-best-practices)
- [GitHub: vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills)
- [InfoQ Artikel](https://www.infoq.com/news/2026/02/vercel-react-best-practices/)
