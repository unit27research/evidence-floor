import test from "node:test";
import assert from "node:assert/strict";
import {
  analyzeEvidenceFloor,
  extractClaims,
  parseEvidenceNotes,
  parseFloorPolicy,
} from "../src/evidence-floor.js";
import { parseArgs, renderReport } from "../src/cli.js";

const policy = `
## Floor: medical or clinical safety
- claim terms: safe; safety; clinical; medical; hospital; hospitals; patient
- minimum evidence: externally corroborated
- required scope: medical or clinical safety
- insufficient evidence: local checklist; synthetic demo; self-attested review
- risk flags: medical_or_clinical_safety; scope_mismatch; proofwashing

## Floor: regulated or organization readiness
- claim terms: regulated; organization; enterprise; production; ready; teams; compliant; compliance
- minimum evidence: externally corroborated
- required scope: regulated-use or organization readiness
- insufficient evidence: local demo; synthetic sample; one run
- risk flags: scope_mismatch; proofwashing

## Floor: portfolio demo claim
- claim terms: demo; sample; local; portfolio; review table
- minimum evidence: artifact-backed
- required scope: local demo behavior
- insufficient evidence: self-attested note; unsupported summary
- risk flags: limited_artifact
`;

test("parses structured evidence floor policy", () => {
  const floors = parseFloorPolicy(policy);
  assert.equal(floors.length, 3);
  assert.equal(floors[0].label, "medical or clinical safety");
  assert.equal(floors[0].minimumEvidence, "externally corroborated");
  assert.deepEqual(floors[0].riskFlags, ["medical_or_clinical_safety", "scope_mismatch", "proofwashing"]);
});

test("parses structured evidence notes", () => {
  const evidence = `
## Evidence: local checklist
- evidence provided: local checklist and synthetic demo
- evidence strength: artifact-backed
- evidence type: local checklist
- scope supported: local checklist on synthetic prompts
- limitations: no clinical review
- corroboration status: none
`;
  const notes = parseEvidenceNotes(evidence);
  assert.equal(notes.length, 1);
  assert.equal(notes[0].evidenceStrength, "artifact-backed");
  assert.equal(notes[0].scopeSupported, "local checklist on synthetic prompts");
});

test("artifact-backed local checklist is below medical safety floor", () => {
  const result = analyzeEvidenceFloor(
    "The model is safe for hospitals.",
    `
## Evidence: local checklist
- evidence provided: local checklist and synthetic demo
- evidence strength: artifact-backed
- evidence type: local checklist
- scope supported: local checklist on synthetic prompts
- limitations: no clinical review; no patient data; no hospital environment; no external validation
- corroboration status: none
`,
    policy,
  );
  const row = result.reviews[0];
  assert.equal(row.floorStatus, "below_floor");
  assert.match(row.riskFlags, /scope_mismatch/);
  assert.match(row.riskFlags, /proofwashing/);
  assert.match(row.boundedWording, /does not establish medical or clinical safety/);
});

test("artifact-backed local demo is below organization readiness floor", () => {
  const result = analyzeEvidenceFloor(
    "The workflow is production-ready for regulated teams.",
    `
## Evidence: local demo
- evidence provided: one local demo run on synthetic sample data
- evidence strength: artifact-backed
- evidence type: local demo
- scope supported: local demo behavior on synthetic sample data
- limitations: no regulated environment; no organization-wide rollout; no external corroboration
- corroboration status: none
`,
    policy,
  );
  const row = result.reviews[0];
  assert.equal(row.floorStatus, "below_floor");
  assert.match(row.riskFlags, /scope_mismatch/);
  assert.match(row.riskFlags, /proofwashing/);
});

test("artifact-backed portfolio demo meets local demo floor", () => {
  const result = analyzeEvidenceFloor(
    "The portfolio demo produces a review table from a local sample.",
    `
## Evidence: local review output
- evidence provided: local sample output showing a generated review table
- evidence strength: artifact-backed
- evidence type: generated Markdown artifact
- scope supported: local demo behavior on one synthetic sample
- limitations: no external users; no production workflow
- corroboration status: none
`,
    policy,
  );
  const row = result.reviews[0];
  assert.equal(row.floorStatus, "meets_floor");
  assert.match(row.riskFlags, /limited_artifact/);
});

test("matching strength alone does not meet floor when evidence scope is too narrow", () => {
  const result = analyzeEvidenceFloor(
    "The model is safe for hospitals.",
    `
## Evidence: external review of checklist
- evidence provided: external review of local checklist
- evidence strength: externally corroborated
- evidence type: external review
- scope supported: local checklist on synthetic prompts
- limitations: no clinical safety validation
- corroboration status: external reviewer
`,
    policy,
  );
  const row = result.reviews[0];
  assert.equal(row.floorStatus, "below_floor");
  assert.match(row.riskFlags, /scope_mismatch/);
  assert.match(row.riskFlags, /proofwashing/);
});

test("met floor does not inherit failure-only policy flags", () => {
  const result = analyzeEvidenceFloor(
    "The model is safe for hospitals.",
    `
## Evidence: external clinical safety review
- evidence provided: external clinical safety review
- evidence strength: externally corroborated
- evidence type: external review
- scope supported: medical or clinical safety for hospital pilots
- limitations: pilot scope only
- corroboration status: external reviewer
`,
    policy,
  );
  const row = result.reviews[0];
  assert.equal(row.floorStatus, "meets_floor");
  assert.doesNotMatch(row.riskFlags, /scope_mismatch/);
  assert.doesNotMatch(row.riskFlags, /proofwashing/);
  assert.match(row.riskFlags, /medical_or_clinical_safety/);
});

test("ordered evidence fallback is visible and low confidence", () => {
  const result = analyzeEvidenceFloor(
    "The model is safe for hospitals.",
    `
## Evidence: unrelated portfolio output
- evidence provided: unrelated generated review table
- evidence strength: artifact-backed
- evidence type: generated Markdown artifact
- scope supported: local portfolio demo behavior
- limitations: no clinical review
- corroboration status: none
`,
    policy,
  );
  const row = result.reviews[0];
  assert.equal(row.matchBasis, "ordered_fallback");
  assert.match(row.riskFlags, /low_confidence_match/);
});

test("invalid policy floor strength is flagged instead of weakening the floor silently", () => {
  const invalidPolicy = `
## Floor: medical or clinical safety
- claim terms: safe; safety; hospital
- minimum evidence: externally confirmed-ish
- required scope: medical or clinical safety
- insufficient evidence: local checklist
- risk flags: medical_or_clinical_safety; scope_mismatch; proofwashing
`;
  const result = analyzeEvidenceFloor(
    "The model is safe for hospitals.",
    `
## Evidence: external clinical safety review
- evidence provided: external clinical safety review
- evidence strength: externally corroborated
- evidence type: external review
- scope supported: medical or clinical safety for hospital pilots
- limitations: pilot scope only
- corroboration status: external reviewer
`,
    invalidPolicy,
  );
  const row = result.reviews[0];
  assert.equal(row.floorStatus, "below_floor");
  assert.match(row.requiredEvidenceFloor, /invalid policy value/);
  assert.match(row.riskFlags, /invalid_floor_policy/);
});

test("Markdown extraction skips headings, tables, code fences, and blockquotes", () => {
  const claims = extractClaims(`
# The model is safe for hospitals

> The quoted demo says the model is certified.

| claim | status |
| --- | --- |
| The table says the model is safe. | draft |

\`\`\`
The code block says the model is safe for hospitals.
\`\`\`

The model is safe for hospitals.
`);
  assert.equal(claims.length, 1);
  assert.equal(claims[0].line, 14);
});

test("CLI helpers can be imported without executing main", () => {
  const args = parseArgs([
    "claims.md",
    "--evidence",
    "evidence.md",
    "--policy",
    "policy.md",
    "--output",
    "review.md",
    "--review-only",
  ]);
  assert.equal(args.claimsPath, "claims.md");
  assert.match(renderReport([]), /Evidence Floor Review/);
});
