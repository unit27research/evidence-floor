# Evidence Floor

Evidence Floor is a small local instrument for reviewing whether a claim meets the minimum evidence required for its claim class.

The category is evidence-floor review: proof before claim, and enough proof for the kind of claim being made.

## Release Status

`SOURCE_STATUS: PUBLIC_PACKAGE`
`ACCESS_STATUS: CLEARED_FOR_EXTERNAL_USE`
`UNIT27_POSITION: ADJACENT_CLAIM_REVIEW_UTILITY`

This repository is a Unit27 public utility: visible, inspectable, and intended for orientation, testing, and practical use. Controlled protocol materials remain outside this source package.

It answers one narrow question:

> Does this claim meet the declared evidence floor for its claim class?

## Failure Mode

Evidence-floor failure happens when a claim requires stronger evidence than the material being cited.

This is one way proofwashing happens: a local checklist, screenshot, toy demo, or self-attested note may be real, but still below the floor for claims about medical safety, compliance, regulated use, production readiness, or organization-wide behavior.

## What Evidence Floor Does

Evidence Floor reads:

- a Markdown claim document
- structured Markdown evidence notes
- a structured Markdown evidence-floor policy

It produces a review-only table with:

- policy health notes
- input health notes
- source line
- claim
- claim class
- match basis
- required evidence floor
- provided evidence
- floor status
- risk flags
- bounded wording
- next verification step

## What It Does Not Do

Evidence Floor is not a verifier, fact-checker, fraud detector, certification system, compliance system, legal reviewer, medical safety tool, or truth oracle.

It does not prove that a claim is true or false. It does not inspect external sources, validate screenshots, audit code, certify evidence, or decide what you should publish.

It is a heuristic review aid. The output is a prompt for human judgment, not a final authority.

## Where It Fits

Evidence Floor sits beside Humility Engine, Claim Drift, and Proof Decay as an adjacent claim-review utility.

- Humility Engine asks: "Does this claim outrun its evidence?"
- Claim Drift asks: "Did this claim become stronger between drafts?"
- Proof Decay asks: "Is old proof being reused as current proof?"
- Evidence Floor asks: "Does this claim meet the minimum evidence required for this claim class?"

## Who It Is For

- builders reviewing public claims before release
- researchers and operators preserving evidence boundaries
- teams declaring proof requirements before publishing claims
- anyone trying to avoid treating a real but limited artifact as enough proof for a broader claim

## Quick Demo

Install dependencies and run the synthetic medical safety scenario:

```bash
npm install
npm run demo
```

Or run one scenario directly:

```bash
npm run review -- examples/scenarios/medical_safety_claim.md \
  --evidence examples/scenarios/medical_safety_evidence.md \
  --policy examples/policies/evidence-floor.md \
  --output examples/reviews/medical_safety_floor_review.md \
  --review-only
```

The output is a review-only evidence-floor table. It does not rewrite the source document.

## Before / After Example

Claim:

> The model is safe for hospitals.

Evidence available:

> Local checklist and synthetic demo only. No clinical review, no patient data, and no external validation.

Evidence Floor review result:

> Local checklist and synthetic demo. It supports local checklist on synthetic prompts. This does not establish medical or clinical safety.

## Synthetic Demo Scenarios

The repo includes three synthetic scenarios:

- `examples/scenarios/portfolio_claim.md`
- `examples/scenarios/org_readiness_claim.md`
- `examples/scenarios/medical_safety_claim.md`

Generated review-only outputs live in:

- `examples/reviews/portfolio_floor_review.md`
- `examples/reviews/org_readiness_floor_review.md`
- `examples/reviews/medical_safety_floor_review.md`

## Structured Evidence Notes

Evidence notes use a small structured Markdown format:

```markdown
## Evidence: local checklist
- evidence provided: local checklist and synthetic demo
- evidence strength: artifact-backed
- evidence type: local checklist
- scope supported: local checklist on synthetic prompts
- limitations: no clinical review; no patient data; no external validation
- corroboration status: none
```

## Evidence Floor Policy

Policies use the same plain Markdown pattern:

```markdown
## Floor: medical or clinical safety
- claim terms: safe; safety; clinical; medical; hospital; patient
- minimum evidence: externally corroborated
- required scope: medical or clinical safety
- insufficient evidence: local checklist; synthetic demo; self-attested review
- risk flags: medical_or_clinical_safety; scope_mismatch; proofwashing
```

Supported evidence-strength values:

- `unsupported`
- `self-attested`
- `artifact-backed`
- `externally corroborated`
- `live-demonstrable`

## Current Limits

- Claim extraction is sentence-based and may miss claims spread across sections.
- Matching is keyword-based, not semantic verification. Ordered evidence fallback is marked as `ordered_fallback`.
- Very small keyword overlaps are marked as `weak_keyword_match`.
- Evidence floors are policy declarations, not universal standards.
- `meets_floor` means the provided evidence appears to meet both the declared strength and declared scope for the matched floor.
- Review-only output is the only supported output shape.
- The tool does not inspect files, URLs, screenshots, logs, demos, or external sources.
- Suggested bounded wording is for manual editing, not automatic source replacement.

## Verify

```bash
npm install
npm test
npm run demo
npm run build
```

## License

MIT
