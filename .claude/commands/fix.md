---
name: fix
description: Run typechecking and linting, then spawn parallel agents to fix all issues
---

# Project Code Quality Check

Run all linting and typechecking tools, collect errors, and spawn parallel agents to fix them.

## Step 1: Run Linting and Typechecking

Run both commands and capture their output:

```bash
bun run typecheck 2>&1 || true
bun run lint 2>&1 || true
```

## Step 2: Collect and Parse Errors

Parse the output from both commands. Group errors by domain:
- **Type errors**: Issues from `tsc --noEmit` (TS errors)
- **Lint errors**: Issues from `eslint` (lint warnings/errors)

Create a list of all files with issues and the specific problems in each file.

## Step 3: Spawn Parallel Agents

If there are errors in both domains, spawn agents in parallel using a SINGLE response with MULTIPLE Task tool calls:

- Spawn a **"type-fixer"** agent for all TypeScript type errors — provide the full list of files and error messages
- Spawn a **"lint-fixer"** agent for all ESLint errors — provide the full list of files and error messages

Each agent should:
1. Read each file with errors
2. Fix all errors in their domain
3. Run the relevant check command to verify fixes (`bun run typecheck` or `bun run lint`)
4. Report what was fixed

If errors exist in only one domain, spawn a single agent for that domain.

## Step 4: Verify All Fixes

After all agents complete, run the full check again:

```bash
bun run typecheck 2>&1 || true
bun run lint 2>&1 || true
```

Confirm all issues are resolved. If any remain, fix them directly.
