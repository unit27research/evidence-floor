# Evidence Floor Review

This is a review-only report for human judgment. It does not rewrite the source document.

## Policy Health

- No policy health issues detected.

## Input Health

- Claims extracted: 1
- Evidence notes parsed: 1

## Claim Review

| source line | claim | claim class | match basis | required evidence floor | provided evidence | floor status | risk flags | bounded wording | next verification step |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 3 | The model is safe for hospitals. | medical or clinical safety | weak_keyword_match | externally corroborated; scope: medical or clinical safety | local hospital-safety checklist and synthetic demo; strength: artifact-backed; scope: local hospital safety checklist on synthetic prompts | below_floor | below_floor, weak_keyword_match, high_stakes_claim, medical_or_clinical_safety, scope_mismatch, proofwashing, insufficient_evidence_type | Local hospital-safety checklist and synthetic demo. It supports local hospital safety checklist on synthetic prompts. This does not establish medical or clinical safety. | Either narrow the claim to local hospital safety checklist on synthetic prompts or provide externally corroborated evidence for medical or clinical safety. |

## Boundary Note

Evidence Floor is a heuristic review aid. It is not a verifier, fact-checker, fraud detector, compliance system, certification system, medical/legal/safety tool, or truth oracle.

