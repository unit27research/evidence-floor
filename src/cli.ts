import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { analyzeEvidenceFloor, type AnalysisResult, type ReviewRow } from "./evidence-floor.js";

interface CliArgs {
  claimsPath: string;
  evidencePath: string;
  policyPath: string;
  outputPath: string;
}

export function main(argv = process.argv.slice(2)): void {
  const args = parseArgs(argv);
  const claims = readFileSync(args.claimsPath, "utf8");
  const evidence = readFileSync(args.evidencePath, "utf8");
  const policy = readFileSync(args.policyPath, "utf8");
  const result = analyzeEvidenceFloor(claims, evidence, policy);
  writeFileSync(args.outputPath, renderReport(result), "utf8");
}

export function parseArgs(argv: string[]): CliArgs {
  const [claimsPath, ...rest] = argv;
  if (!claimsPath || rest.includes("--help") || rest.includes("-h")) {
    throw usageError();
  }

  const args: CliArgs = {
    claimsPath,
    evidencePath: "",
    policyPath: "",
    outputPath: "",
  };

  for (let index = 0; index < rest.length; index += 1) {
    const key = rest[index];
    if (key === "--review-only") {
      continue;
    }
    const value = rest[index + 1];
    if (!value) {
      throw usageError();
    }
    if (key === "--evidence") {
      args.evidencePath = value;
      index += 1;
    } else if (key === "--policy") {
      args.policyPath = value;
      index += 1;
    } else if (key === "--output") {
      args.outputPath = value;
      index += 1;
    } else {
      throw usageError();
    }
  }

  if (!args.evidencePath || !args.policyPath || !args.outputPath) {
    throw usageError();
  }

  return args;
}

export function runCli(argv = process.argv.slice(2)): void {
  try {
    main(argv);
  } catch (error) {
    if (error instanceof UsageError) {
      console.error(error.message);
      process.exitCode = 1;
      return;
    }
    throw error;
  }
}

export function renderReport(result: AnalysisResult): string {
  const lines = [
    "# Evidence Floor Review",
    "",
    "This is a review-only report for human judgment. It does not rewrite the source document.",
    "",
    "## Policy Health",
    "",
    ...(result.policyHealth.length ? result.policyHealth.map((issue) => `- ${issue}`) : ["- No policy health issues detected."]),
    "",
    "## Input Health",
    "",
    `- Claims extracted: ${result.claims.length}`,
    `- Evidence notes parsed: ${result.evidenceNotes.length}`,
    ...(result.claims.length ? [] : ["- No claims were extracted from the input document."]),
    ...(result.evidenceNotes.length ? [] : ["- No structured evidence notes were provided."]),
    "",
    "## Claim Review",
    "",
    "| source line | claim | claim class | match basis | required evidence floor | provided evidence | floor status | risk flags | bounded wording | next verification step |",
    "| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |",
    ...result.reviews.map(renderRow),
    "",
    "## Boundary Note",
    "",
    "Evidence Floor is a heuristic review aid. It is not a verifier, fact-checker, fraud detector, compliance system, certification system, medical/legal/safety tool, or truth oracle.",
    "",
  ];
  return `${lines.join("\n")}\n`;
}

function renderRow(row: ReviewRow): string {
  return [
    row.sourceLine.toString(),
    row.claim,
    row.claimClass,
    row.matchBasis,
    row.requiredEvidenceFloor,
    row.providedEvidence,
    row.floorStatus,
    row.riskFlags,
    row.boundedWording,
    row.nextVerificationStep,
  ]
    .map(markdownCell)
    .join(" | ")
    .replace(/^/, "| ")
    .replace(/$/, " |");
}

function markdownCell(value: string): string {
  return value.replace(/\|/g, "\\|").replace(/\n/g, " ").trim();
}

class UsageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UsageError";
  }
}

function usageError(): UsageError {
  return new UsageError(
    ["Usage:", "  node dist/src/cli.js claims.md --evidence evidence.md --policy policy.md --output review.md --review-only"].join(
      "\n",
    ),
  );
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  runCli();
}
