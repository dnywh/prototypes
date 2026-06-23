# Warehouse Vision prototype

A throwaway prototype painting Supabase Warehouse's **3-year agentic future**: analytical
queries on existing Postgres tables are fast enough that agents can watch your business
goals in real time and deliver preemptive daily standups.

**Persona:** Meridian Marketplace, a two-sided handmade-goods marketplace.

Standalone Vite + React + TypeScript app in the [prototypes](https://github.com/dnywh/prototypes) repo at
`~/Developer/prototypes/warehouse-vision` (not part of the Supabase monorepo).

## Run it

```bash
cd ~/Developer/prototypes/warehouse-vision
npm install
npm run dev   # http://localhost:5174
```

**Screencast auto-play:** append `?demo=1`.

## Layout

Linear conversation thread:

1. **Today's standup** with citation pills; tap **Based on: N live queries** to open the data dialog
2. **Evidence** inserts inline below (Framer Motion, minimal layout shift)
3. **Recommended actions** with Why? + pills
4. **Thread continuations** from the bottom composer (replaces ⌘K)
5. **Fixed composer** at bottom with suggestion chips

Standup insights and evidence cards are powered by **live queries** (run on demand when you
open the standup or drill into evidence), not cached snapshots. Warehouse stats and data
sources live in the data dialog, linked from standup meta.
