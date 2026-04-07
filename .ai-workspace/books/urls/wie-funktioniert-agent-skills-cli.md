# Wie funktioniert `npx skills add` – einfach erklärt

**Für:** Junior-Entwickler, die verstehen wollen, was hinter dem Befehl steckt  
**Verwandtes Dokument:** `vercel-react-best-practices-skill.md`

---

## Die kurze Antwort

Ja, deine Vermutung ist fast richtig – aber etwas genauer:

Der Befehl **lädt keine `AGENTS.md` in dein Projekt**, sondern installiert eine **`SKILL.md`-Datei**
in einen speziellen Ordner. Der AI-Agent liest diese Datei automatisch und weiß dann, wie er
sich bei bestimmten Aufgaben verhalten soll.

---

## Schritt für Schritt: Was passiert beim Befehl?

```bash
npx skills add vercel-labs/agent-skills
```

### Schritt 1 – npx lädt das CLI-Tool herunter

`npx` ist ein Node.js-Tool, das ein npm-Paket **temporär herunterlädt und ausführt** – ohne es
global zu installieren. Du brauchst also nichts vorher zu installieren, der Befehl funktioniert
sofort.

### Schritt 2 – Das CLI-Tool schaut auf GitHub

`vercel-labs/agent-skills` ist eine GitHub-Kurzschreibweise für:
`https://github.com/vercel-labs/agent-skills`

Das CLI-Tool geht zu diesem Repository und schaut, welche Skills darin verfügbar sind.

### Schritt 3 – Es erkennt automatisch deinen AI-Agent

Das Tool schaut in bekannte Konfigurationsordner auf deinem Computer und erkennt selbst,
welche AI-Agents du installiert hast (Cursor, Claude Code, Codex, etc.).

### Schritt 4 – Es kopiert/verlinkt die SKILL.md in den richtigen Ordner

Je nachdem welchen Agent du benutzt, landet die Datei in:

| Agent | Projektordner (nur dieses Projekt) | Global (alle Projekte) |
|---|---|---|
| **Cursor** | `.cursor/skills/` | `~/.cursor/skills/` |
| **Claude Code** | `.claude/skills/` | `~/.claude/skills/` |
| **Codex** | `.codex/skills/` | `~/.codex/skills/` |
| **OpenCode** | `.opencode/skill/` | `~/.config/opencode/skill/` |

---

## Was ist eine SKILL.md-Datei?

Eine `SKILL.md` ist eine **einfache Markdown-Datei mit Anweisungen für den AI-Agent**.
Sie sagt dem Agent: *"Wenn du diese Aufgabe machst, halte dich an diese Regeln."*

Vereinfachtes Beispiel – so sieht eine SKILL.md aus:

```markdown
---
name: react-best-practices
description: React performance optimization rules from Vercel
---

# React Best Practices

## CRITICAL: Async Waterfalls eliminieren

Führe unabhängige API-Calls IMMER parallel aus:

❌ Falsch:
const user = await fetchUser(id);
const settings = await fetchSettings(id);

✅ Richtig:
const [user, settings] = await Promise.all([fetchUser(id), fetchSettings(id)]);

## CRITICAL: Bundle Size
...
```

Das ist buchstäblich eine Textdatei. Keine Magie, kein Binary-Code – nur Anweisungen in
Markdown, die der Agent liest wie ein Handbuch.

---

## Wie "sieht" der Agent die SKILL.md dann?

Das ist der entscheidende Teil:

```
Dein Projekt
├── src/
├── .cursor/
│   └── skills/
│       └── react-best-practices/
│           └── SKILL.md   ← der Agent liest das automatisch
└── package.json
```

Cursor (und andere Agents) **schauen beim Start automatisch in ihren `skills/`-Ordner**
und laden alle SKILL.md-Dateien als zusätzlichen Kontext. Du musst nichts tun – der Agent
"weiß" danach einfach mehr.

---

## Vergleich: SKILL.md vs. AGENTS.md

Diese zwei Konzepte sind ähnlich, aber nicht das Gleiche:

| | `AGENTS.md` | `SKILL.md` |
|---|---|---|
| **Was ist es?** | Projektregeln für dieses Repo | Wiederverwendbare Fähigkeit (aus anderem Repo) |
| **Wer schreibt es?** | Du (projektspezifisch) | Vercel, Community, etc. |
| **Wo liegt es?** | Im Projekt-Root | In `.cursor/skills/` |
| **Für wen?** | Regeln für dieses Projekt | Allgemeines Wissen, überall nutzbar |
| **Beispiel** | "Wir nutzen Zustand für UI-State" | "Parallele Awaits sind besser als sequentielle" |

In diesem Projekt gibt es eine `AGENTS.md` im Root – das ist dasselbe Prinzip, nur
selbst geschrieben statt installiert.

---

## Konkret für Cursor: Wie nutzt man eine installierte Skill?

Nach der Installation gibt es zwei Wege:

### 1. Automatisch (passiv)
Der Agent liest die SKILL.md im Hintergrund. Wenn du Code schreibst, der gegen eine Regel
verstößt (z.B. sequentielle Awaits), wird er dich automatisch darauf hinweisen.

### 2. Aktiv aufrufen (in Claude Code)
In Claude Code kannst du Skills direkt aufrufen:

```
/react-best-practices
```

Das sagt dem Agent: "Schau dir meinen Code an und wende diese Skill-Regeln an."

---

## Zusammenfassung in einem Satz

> `npx skills add vercel-labs/agent-skills` lädt eine Textdatei mit React-Regeln von GitHub
> herunter und legt sie in einen Ordner, den dein AI-Agent automatisch mitliest – so als
> würdest du deinem Agent ein Handbuch geben.

---

## Soll ich das in diesem Projekt installieren?

**Für Cursor:** Bedingt sinnvoll. Die React-Regeln von Vercel sind gut, aber viele davon
beziehen sich auf **Next.js** (Server Components, SSR, etc.) – was wir hier nicht benutzen
(Vite + React Router). Die allgemeinen Regeln (Parallel Awaits, Bundle Size, Re-Renders)
sind aber auch hier nützlich.

**Empfehlung:** Nur wenn du möchtest, dass Cursor dich aktiv auf Performance-Probleme hinweist.
Es schadet nicht, bringt aber auch keinen riesigen Mehrwert für ein SPA-Projekt ohne Next.js.

---

## Nützliche Befehle

```bash
# Alle verfügbaren Skills im Repository anzeigen
npx skills add vercel-labs/agent-skills --list

# Nur einen bestimmten Skill installieren
npx skills add vercel-labs/agent-skills --skill react-best-practices

# Global installieren (für alle Projekte)
npx skills add vercel-labs/agent-skills -g

# Für einen bestimmten Agent installieren
npx skills add vercel-labs/agent-skills -a cursor
```

---

## Quellen

- [add-skill CLI Dokumentation](https://add-skill.org/)
- [GitHub: vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills)
- [Vercel Blog: Introducing React Best Practices](https://vercel.com/blog/introducing-react-best-practices)
