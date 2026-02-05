---
name: test
description: Run all tests, then spawn parallel agents to fix any failures
---

# Run Tests

Run the full test suite and fix any failures.

## Step 1: Run All Tests

```bash
bun run test 2>&1
```

## Step 2: Analyze Results

If all tests pass, report success with the count.

If there are failures, parse the output to identify:
- Which test files have failures
- Which specific tests failed
- The error messages and expected vs received values

## Step 3: Fix Failures

If there are failures, group them by test file and spawn parallel agents using the Task tool (one per failing test file) to fix the issues. Each agent should:

1. Read the failing test file AND the source file it tests
2. Determine if the issue is in the test or the source code
3. Fix the issue (prefer fixing tests if they have wrong expectations, fix source if it has bugs)
4. Run the specific test file to verify: `bunx vitest run <path-to-test-file>`

**IMPORTANT**: Use a SINGLE response with MULTIPLE Task tool calls to fix files in parallel.

## Step 4: Verify

After all agents complete, run the full suite again:

```bash
bun run test 2>&1
```

Confirm all tests pass.

## Useful Commands

- Run all tests: `bun run test`
- Watch mode: `bun run test:watch`
- Coverage: `bun run test:coverage`
- Single file: `bunx vitest run src/lib/__tests__/pricing.test.ts`
- Filter by name: `bunx vitest run -t "calculateLineItem"`
