# AGENTS.md

Codex operating notes for `prototype`.

## Read First

- `CLAUDE.md`
- `DESIGN.md`
- `RULES.md`
- `STRUCTURAL-RUBRIC.md`

## Project Summary

- Daily service plus Video LLM SaaS API proxy.
- Main areas: `src/server/`, `src/client/`, `src/video-llm/`, `scripts/`, `data/`.
- `data/` is a tracked operational knowledge store and must stay consistent.

## Constraints

- Keep `data/` JSON files git-tracked when the task intentionally changes operational data.
- Keep `dist/` as build output only.
- Prefer zero runtime dependencies unless the existing code already uses them.
- Preserve idempotency for cron or daily jobs.
- Gracefully degrade on external API failure.
- Do not modify `RULES.md` to make the score easier.

## Practical Guidance

- Treat API routes, router logic, and provider adapters as separate concerns.
- If a change affects provider routing or billing logic, inspect both `src/video-llm/` and `src/server/`.
- For durable notes, the preferred Vault destination is `projects/prototype/`.
