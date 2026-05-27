export const EVIDENCE_STRENGTHS = [
  "unsupported",
  "self-attested",
  "artifact-backed",
  "externally corroborated",
  "live-demonstrable",
] as const;

export type EvidenceStrength = (typeof EVIDENCE_STRENGTHS)[number];

const STRENGTH_RANK: Record<EvidenceStrength, number> = {
  unsupported: 0,
  "self-attested": 1,
  "artifact-backed": 2,
  "externally corroborated": 3,
  "live-demonstrable": 4,
};

const DEFAULT_HIGH_RISK_TERMS = new Set([
  "approved",
  "certified",
  "clinical",
  "compliant",
  "compliance",
  "enterprise",
  "financial",
  "hospital",
  "hospitals",
  "legal",
  "medical",
  "patient",
  "production",
  "regulated",
  "safe",
  "safety",
  "teams",
  "validated",
]);

const STOPWORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "as",
  "by",
  "for",
  "from",
  "in",
  "is",
  "it",
  "of",
  "on",
  "or",
  "our",
  "the",
  "this",
  "to",
  "we",
  "with",
]);

export interface Claim {
  text: string;
  line: number;
}

export interface EvidenceNote {
  label: string;
  evidenceProvided: string;
  evidenceStrength: EvidenceStrength;
  evidenceType: string;
  scopeSupported: string;
  limitations: string;
  corroborationStatus: string;
}

export interface EvidenceFloor {
  label: string;
  claimTerms: string[];
  minimumEvidence: EvidenceStrength;
  requiredScope: string;
  insufficientEvidence: string[];
  riskFlags: string[];
}

export interface ReviewRow {
  sourceLine: number;
  claim: string;
  claimClass: string;
  requiredEvidenceFloor: string;
  providedEvidence: string;
  floorStatus: string;
  riskFlags: string;
  boundedWording: string;
  nextVerificationStep: string;
}

export interface AnalysisResult {
  claims: Claim[];
  floors: EvidenceFloor[];
  evidenceNotes: EvidenceNote[];
  reviews: ReviewRow[];
}

export function analyzeEvidenceFloor(
  claimText: string,
  evidenceText: string,
  policyText: string,
): AnalysisResult {
  const claims = extractClaims(claimText);
  const evidenceNotes = parseEvidenceNotes(evidenceText);
  const floors = parseFloorPolicy(policyText);
  const reviews = claims.map((claim, index) => {
    const floor = matchFloor(claim.text, floors);
    const evidence = matchEvidence(claim.text, evidenceNotes) ?? evidenceNotes[index];
    return reviewClaim(claim, floor, evidence);
  });

  return { claims, floors, evidenceNotes, reviews };
}

export function extractClaims(text: string): Claim[] {
  const claims: Claim[] = [];
  let inFence = false;

  text.split(/\r?\n/).forEach((rawLine, index) => {
    const lineNumber = index + 1;
    const stripped = rawLine.trim();

    if (stripped.startsWith("```") || stripped.startsWith("~~~")) {
      inFence = !inFence;
      return;
    }
    if (inFence || skipMarkdownLine(stripped)) {
      return;
    }

    const content = stripped.replace(/^[-*]\s+/, "");
    for (const sentence of splitSentences(content)) {
      if (looksLikeClaim(sentence)) {
        claims.push({ text: sentence, line: lineNumber });
      }
    }
  });

  return claims;
}

export function parseEvidenceNotes(text: string): EvidenceNote[] {
  const notes: EvidenceNote[] = [];
  let current: Record<string, string> | null = null;

  const flush = () => {
    if (!current) {
      return;
    }
    notes.push(structuredEvidence(current));
    current = null;
  };

  for (const rawLine of text.split(/\r?\n/)) {
    const stripped = rawLine.trim();
    if (!stripped) {
      continue;
    }
    if (stripped.toLowerCase().startsWith("## evidence:")) {
      flush();
      current = { label: stripped.split(":", 2)[1].trim() };
      continue;
    }
    if (!current) {
      continue;
    }
    const fieldLine = stripped.replace(/^[-*]\s+/, "");
    if (fieldLine.includes(":")) {
      const [key, ...valueParts] = fieldLine.split(":");
      current[fieldKey(key)] = valueParts.join(":").trim();
    }
  }

  flush();
  return notes;
}

export function parseFloorPolicy(text: string): EvidenceFloor[] {
  const floors: EvidenceFloor[] = [];
  let current: Record<string, string> | null = null;

  const flush = () => {
    if (!current) {
      return;
    }
    floors.push(structuredFloor(current));
    current = null;
  };

  for (const rawLine of text.split(/\r?\n/)) {
    const stripped = rawLine.trim();
    if (!stripped) {
      continue;
    }
    if (stripped.toLowerCase().startsWith("## floor:")) {
      flush();
      current = { label: stripped.split(":", 2)[1].trim() };
      continue;
    }
    if (!current) {
      continue;
    }
    const fieldLine = stripped.replace(/^[-*]\s+/, "");
    if (fieldLine.includes(":")) {
      const [key, ...valueParts] = fieldLine.split(":");
      current[fieldKey(key)] = valueParts.join(":").trim();
    }
  }

  flush();
  return floors;
}

export function matchFloor(claim: string, floors: EvidenceFloor[]): EvidenceFloor | undefined {
  const claimTokens = tokens(claim);
  let bestFloor: EvidenceFloor | undefined;
  let bestScore = 0;

  for (const floor of floors) {
    const score = floor.claimTerms.reduce((sum, term) => {
      const termTokens = tokens(term);
      return sum + [...termTokens].filter((token) => claimTokens.has(token)).length;
    }, 0);
    if (score > bestScore) {
      bestFloor = floor;
      bestScore = score;
    }
  }

  return bestScore > 0 ? bestFloor : undefined;
}

export function matchEvidence(claim: string, notes: EvidenceNote[]): EvidenceNote | undefined {
  const claimTokens = tokens(claim);
  let bestNote: EvidenceNote | undefined;
  let bestScore = 0;

  for (const note of notes) {
    const noteTokens = tokens(
      [
        note.label,
        note.evidenceProvided,
        note.evidenceType,
        note.scopeSupported,
        note.limitations,
      ].join(" "),
    );
    const score = [...claimTokens].filter((token) => noteTokens.has(token)).length;
    if (score > bestScore) {
      bestNote = note;
      bestScore = score;
    }
  }

  return bestScore > 0 ? bestNote : undefined;
}

export function reviewClaim(
  claim: Claim,
  floor: EvidenceFloor | undefined,
  evidence: EvidenceNote | undefined,
): ReviewRow {
  const providedStrength = evidence?.evidenceStrength ?? "unsupported";
  const requiredStrength = floor?.minimumEvidence ?? "self-attested";
  const status = STRENGTH_RANK[providedStrength] >= STRENGTH_RANK[requiredStrength] ? "meets_floor" : "below_floor";
  const flags = riskFlags(claim.text, floor, evidence, status);

  return {
    sourceLine: claim.line,
    claim: claim.text,
    claimClass: floor?.label ?? "unclassified claim",
    requiredEvidenceFloor: floor
      ? `${floor.minimumEvidence}; scope: ${floor.requiredScope || "not stated"}`
      : "No matching floor. Treat as manual review.",
    providedEvidence: evidence
      ? `${evidence.evidenceProvided || evidence.label}; strength: ${evidence.evidenceStrength}; scope: ${
          evidence.scopeSupported || "not stated"
        }`
      : "No matching evidence note found.",
    floorStatus: status,
    riskFlags: flags.length ? flags.join(", ") : "none",
    boundedWording: boundedWording(claim.text, floor, evidence, status),
    nextVerificationStep: nextVerificationStep(floor, evidence, status),
  };
}

function structuredEvidence(fields: Record<string, string>): EvidenceNote {
  return {
    label: fields.label ?? "untitled evidence",
    evidenceProvided: fields.evidenceProvided ?? "",
    evidenceStrength: normalizeStrength(fields.evidenceStrength),
    evidenceType: fields.evidenceType ?? "",
    scopeSupported: fields.scopeSupported ?? "",
    limitations: fields.limitations ?? "",
    corroborationStatus: fields.corroborationStatus ?? "",
  };
}

function structuredFloor(fields: Record<string, string>): EvidenceFloor {
  return {
    label: fields.label ?? "untitled floor",
    claimTerms: splitList(fields.claimTerms ?? ""),
    minimumEvidence: normalizeStrength(fields.minimumEvidence),
    requiredScope: fields.requiredScope ?? "",
    insufficientEvidence: splitList(fields.insufficientEvidence ?? ""),
    riskFlags: splitList(fields.riskFlags ?? ""),
  };
}

function normalizeStrength(value = ""): EvidenceStrength {
  const normalized = value.trim().toLowerCase();
  if (EVIDENCE_STRENGTHS.includes(normalized as EvidenceStrength)) {
    return normalized as EvidenceStrength;
  }
  return "unsupported";
}

function riskFlags(
  claim: string,
  floor: EvidenceFloor | undefined,
  evidence: EvidenceNote | undefined,
  status: string,
): string[] {
  const flags = new Set<string>();
  if (status === "below_floor") {
    flags.add("below_floor");
  }
  const claimTokens = tokens(claim);
  if ([...claimTokens].some((token) => DEFAULT_HIGH_RISK_TERMS.has(token))) {
    flags.add("high_stakes_claim");
  }
  if (floor) {
    floor.riskFlags.forEach((flag) => flags.add(flag));
  }
  if (evidence && floor && status === "below_floor") {
    const weakEvidence = floor.insufficientEvidence.some((phrase) =>
      containsPhrase(`${evidence.evidenceProvided} ${evidence.evidenceType} ${evidence.scopeSupported} ${evidence.limitations}`, phrase),
    );
    if (weakEvidence) {
      flags.add("insufficient_evidence_type");
    }
  }
  if (evidence && floor && status === "below_floor" && hasScopeMismatch(floor, evidence)) {
    flags.add("scope_mismatch");
  }
  if (status === "below_floor" && (flags.has("scope_mismatch") || claimLooksProofy(claim))) {
    flags.add("proofwashing");
  }
  return [...flags];
}

function hasScopeMismatch(floor: EvidenceFloor, evidence: EvidenceNote): boolean {
  const requiredTokens = tokens(floor.requiredScope);
  const scopeTokens = tokens(`${evidence.scopeSupported} ${evidence.limitations}`);
  if (requiredTokens.size === 0) {
    return false;
  }
  return [...requiredTokens].some((token) => !scopeTokens.has(token));
}

function boundedWording(
  claim: string,
  floor: EvidenceFloor | undefined,
  evidence: EvidenceNote | undefined,
  status: string,
): string {
  if (status === "meets_floor") {
    return `Evidence appears to meet the declared floor for this claim class. Manual review is still required before publication.`;
  }
  if (!evidence) {
    return `No evidence note was matched for this claim. Do not publish the broader claim without declared supporting evidence.`;
  }
  const subject = sentenceStart(evidence.evidenceProvided || evidence.label || "The available evidence");
  const scope = evidence.scopeSupported ? ` It supports ${evidence.scopeSupported}.` : "";
  const floorText = floor?.requiredScope
    ? ` This does not establish ${floor.requiredScope}.`
    : ` This does not establish the broader claim.`;
  return `${subject}.${scope}${floorText}`.replace(/\s+/g, " ").trim();
}

function nextVerificationStep(
  floor: EvidenceFloor | undefined,
  evidence: EvidenceNote | undefined,
  status: string,
): string {
  if (status === "meets_floor") {
    return "Confirm the evidence is current, relevant, and accurately represented before publication.";
  }
  if (!floor) {
    return "Classify the claim and declare a minimum evidence floor before publication.";
  }
  if (!evidence) {
    return `Provide at least ${floor.minimumEvidence} evidence for ${floor.requiredScope || floor.label}.`;
  }
  return `Either narrow the claim to ${evidence.scopeSupported || "the documented evidence"} or provide ${floor.minimumEvidence} evidence for ${
    floor.requiredScope || floor.label
  }.`;
}

function skipMarkdownLine(stripped: string): boolean {
  return (
    stripped.length === 0 ||
    stripped.startsWith("#") ||
    stripped.startsWith(">") ||
    stripped.startsWith("|") ||
    /^[-:| ]{3,}$/.test(stripped) ||
    /^[-*]\s*\*\*/.test(stripped)
  );
}

function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

function looksLikeClaim(sentence: string): boolean {
  if (sentence.length < 18) {
    return false;
  }
  return /\b(is|are|will|can|does|produces|supports|meets|ready|safe|validated|proven|compliant|certified)\b/i.test(
    sentence,
  );
}

function splitList(value: string): string[] {
  return value
    .split(/[;,]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function fieldKey(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+([a-z0-9])/g, (_, char: string) => char.toUpperCase());
}

function tokens(value: string): Set<string> {
  return new Set(
    value
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, " ")
      .split(/\s+/)
      .map((token) => token.trim())
      .filter((token) => token.length > 2 && !STOPWORDS.has(token)),
  );
}

function containsPhrase(text: string, phrase: string): boolean {
  return text.toLowerCase().includes(phrase.toLowerCase());
}

function claimLooksProofy(claim: string): boolean {
  return /\b(proven|validated|verified|certified|approved|compliant|ready|safe)\b/i.test(claim);
}

function sentenceStart(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    return "The available evidence is limited";
  }
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}
