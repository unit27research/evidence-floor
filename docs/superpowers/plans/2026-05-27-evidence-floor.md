# Evidence Floor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a local TypeScript CLI that reviews whether claims meet declared evidence floors.

**Architecture:** Keep the analyzer in `src/evidence-floor.ts` and the CLI in `src/cli.ts`. Use Markdown files for policies, evidence notes, scenarios, and generated review outputs.

**Tech Stack:** TypeScript, Node.js, Node built-in test runner, GitHub Actions CI.

---

### Task 1: Core Analyzer

**Files:**
- Create: `src/evidence-floor.ts`
- Test: `tests/evidence-floor.test.ts`

- [x] Define claim, evidence note, floor policy, and review result types.
- [x] Parse structured Markdown floors and evidence notes.
- [x] Extract prose claims while skipping Markdown structures.
- [x] Classify each claim against the strongest matching floor.
- [x] Generate bounded wording and next verification steps.

### Task 2: CLI and Report Output

**Files:**
- Create: `src/cli.ts`
- Create: `run.js`

- [x] Parse input, evidence, policy, and output arguments.
- [x] Call the analyzer.
- [x] Write review-only Markdown with a boundary note.

### Task 3: Examples, Tests, and Public Package Files

**Files:**
- Create: `examples/policies/evidence-floor.md`
- Create: `examples/scenarios/*.md`
- Create: `examples/reviews/*.md`
- Create: `README.md`
- Create: `RELEASE_CHECKLIST.md`
- Create: `LINKEDIN_DRAFT.md`
- Create: `LICENSE`
- Create: `.github/workflows/ci.yml`

- [x] Add three synthetic scenarios.
- [x] Add tests for floor matching, insufficient evidence, policy parsing, and Markdown skipping.
- [x] Generate review-only outputs.
- [x] Add modest Unit27-compatible public copy.

