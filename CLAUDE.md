@AGENTS.md

# Project reference

The full project brief lives at `brief.md` in the repo root. Always read it before building any new feature. It contains: data models, page structure, design system rules, data architecture rules, and phase breakdown.

The codebase reference lives at `CODEBASE.md` in the repo root. Always read it at the start of every session. It contains: directory structure, code patterns, design system tokens, auth flow, Supabase patterns, business type system, and migration log.

Key rule from brief: **All data loads server-side via URL query params. No client-side data fetching. No useState for data.**
