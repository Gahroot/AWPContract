---
description: Trace capabilities through every layer — find dropped config, missing wiring, drifted duplicates — and fix them automatically
---

# Wiring Checkpoint

Find where things silently break between layers. Not "does it compile" — "does the config/feature/option actually survive from entry point to the thing that uses it." Then fix it.

**What this catches that other tools don't:**
- Auth token enters at layer 1, credentials get stripped at layer 3
- A module exports 15 functions but only 3 are imported anywhere
- Same feature built in two places, one quietly falls behind
- Config/options silently dropped or defaulted away mid-pipeline
- Data shape mismatches where fields go missing mid-pipeline

## Instructions

### 1. Map the Project Architecture

Read CLAUDE.md, package.json, and directory structure. Identify:

**Entry points** — Where users/callers enter the system:
- API routes, exported functions, event handlers, page components
- Look for: `src/app/api/`, `src/app/`, main exports

**Orchestration layer** — Where entry points delegate to:
- Controllers, routers, middleware chains, server actions
- Look for: `middleware.*`, route handlers, auth wrappers

**Capability modules** — Where real work happens:
- Services, utilities, external integrations, business logic
- Look for: `src/lib/`, `src/services/`, `src/modules/`

**Config surface** — Where options/config flow:
- Types/interfaces, config loaders, env vars, option objects
- Look for: `*Options`, `*Config`, `*Settings` interfaces, `.env`, constants

Build a mental model:
```
Entry Points -> Orchestration -> Capability Modules -> External (APIs, DB, browser, network)
     ^                                                    ^
  Config/Options flow rightward through these layers
```

### 2. Identify Traceable Capabilities

From the architecture, extract capabilities that MUST work end-to-end:

| Category | What to trace | Example gap |
|----------|--------------|-------------|
| **Config propagation** | Form options -> validation -> API -> DB -> PDF | Option exists in constants but never reaches PDF |
| **Auth/credentials** | Session from login -> through middleware -> to every protected route | Route accepts unauthenticated requests |
| **Feature parity** | Public vs internal API, form vs API validation | Form allows values the API rejects |
| **Error paths** | Error thrown deep -> caught/propagated -> surfaced to user | Error swallowed silently, user sees nothing |
| **Data transformation** | Shape at entry -> transformations -> shape at destination | Field renamed mid-pipeline, destination gets undefined |
| **Module consumption** | Package exports -> actual imports elsewhere | Module built and exported but never imported |
| **Resource lifecycle** | Resource created -> used -> cleaned up | DB connection opened but never closed on error |

### 3. Trace and Fix — Automatic Parallel Execution

**Do NOT ask questions. Execute automatically.**

Analyze the capabilities identified in step 2 and group them by where fixes will land:

- **Frontend concerns**: Components, forms, client-side validation, UI state, hooks
- **Backend concerns**: API routes, server-side logic, DB queries, auth middleware, external integrations
- **Cross-cutting concerns**: Types/interfaces, shared validation schemas, config/constants

Spawn Explore agents in parallel — one per logical group. Each agent traces its capabilities AND identifies specific fixes needed.

For each agent, use this mandate:

```
Trace [CAPABILITIES] through every layer of the project at [DIRECTORY].

Start at the entry point(s) and follow through to where it's actually consumed.

DETECT:
1. Dropped config — Option/flag exists at entry but never reaches the function that needs it
2. Silent defaults — Value gets replaced with a default mid-pipeline instead of being passed through
3. Partial wiring — Feature works in path A but not path B
4. Stale wrappers — A wrapper/adapter exposes a subset of the underlying interface and has fallen behind
5. Dead exports — Module exports capability X but nothing imports it
6. Shape mismatches — Data enters as type A, gets transformed, arrives at destination missing fields

For each issue found, report:
- WHERE: exact file:line at each end (entry point AND consumption point)
- WHAT: what gets lost/broken between those two points
- THE FIX: exactly what code changes are needed

Do NOT report:
- Style issues, naming, code quality
- Theoretical problems that can't actually be triggered
- Things that work correctly end-to-end
```

### 4. Fix Everything

After traces complete, implement ALL fixes. Organize the work intelligently:

- If fixes are all frontend or all backend, batch them into one or two focused agents
- If fixes span both, spawn parallel agents — one for frontend fixes, one for backend fixes
- If fixes touch shared code (types, schemas, constants), do those FIRST, then spawn frontend/backend agents in parallel
- Each fixing agent should handle a coherent group of related changes

**Fix agents must:**
- Make the actual code changes
- Ensure type safety is maintained
- Not break existing functionality
- Keep changes minimal and focused — fix the wiring gap, nothing else

### 5. Verify

After all fixes are applied:
- Run `bun run typecheck` to verify no type errors introduced
- Run `bun run lint` to verify no lint errors
- Run `bun run test` if business logic was changed
- Fix any errors that surface from these checks

### 6. Cross-Reference and Report

Look for systemic patterns across the traces:
- Same gap repeated in multiple places
- Wrapper drift affecting multiple modules
- Missing symmetry in validation or error handling

Output a summary:

```
## Wiring Checkpoint Complete

**Capabilities traced**: [list what was traced]
**Gaps found**: [N] (Critical: X, Moderate: Y, Minor: Z)
**Gaps fixed**: [N]

**Changes made:**
- [file:line — what was fixed and why]
- ...

**Systemic patterns identified:**
- [pattern, if any]

**Verification:** typecheck [pass/fail] | lint [pass/fail] | tests [pass/fail]
```

If systemic patterns were found that affect how the project should be built going forward, note them for CLAUDE.md consideration.

## COMMAND COMPLETE — STOP HERE

**DO NOT proceed to next steps automatically.**
Wait for user to decide next action.

## Key Principles

- Trace capabilities, not files. The question is "does auth work everywhere" not "is auth.ts correct"
- Silent failures are the priority. If something throws an error, other tools catch it. This catches things that silently degrade
- "Works in path A but not path B" is the signature pattern
- Don't report style issues. If data flows correctly end-to-end, it's fine
- Fix everything. Don't ask, don't generate reports to fix later. Just fix it.
- Negative results are valid. "All capabilities traced cleanly" is a good outcome.
