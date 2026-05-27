# Evidence Floor Design

Evidence Floor is a small Unit27 adjacent claim-review utility. It asks whether a claim meets the minimum evidence required for its claim class.

## Purpose

The tool reviews Markdown claims, structured evidence notes, and a Markdown evidence-floor policy. It produces a review-only Markdown table for human judgment. It does not rewrite source documents or verify truth.

## Core Workflow

1. Read a Markdown claim document.
2. Read optional structured evidence notes.
3. Read a Markdown floor policy.
4. Extract claims from prose while skipping headings, tables, code fences, and blockquotes.
5. Match each claim to the strongest relevant floor.
6. Match each claim to a relevant evidence note.
7. Compare provided evidence strength and scope against the floor.
8. Write a review-only Markdown report.

## Public Boundary

Evidence Floor is a heuristic review aid, not a verifier, fact-checker, fraud detector, compliance system, certification system, medical/legal/safety tool, or truth oracle.

## Stack

TypeScript with Node.js. The MVP uses no runtime dependencies. Tests use Node's built-in test runner after TypeScript compilation.

