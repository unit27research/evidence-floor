import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { analyzeEvidenceFloor, type ReviewRow } from "./evidence-floor.js";

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
  writeFileSync(args.outputPath, renderReport(result.reviews), "utf8");
}

export function parseArgs(argv: string[]): CliArgs {
  const [claimsPath, ...rest] = argv;
  if (!claimsPath || rest.includes("--help") || rest.includes("-h")) {
    usage();
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
      usage();
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
      usage();
    }
  }

  if (!args.evidencePath || !args.policyPath || !args.outputPath) {
    usage();
  }

  return args;
}

export function renderReport(rows: ReviewRow[]): string {
  const lines = [
    "# Evidence Floor Review",
    "",
    "This is a review-only report for human judgment. It does not rewrite the source document.",
    "",
    "| source line | claim | claim class | match basis | required evidence floor | provided evidence | floor status | risk flags | bounded wording | next verification step |",
    "| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |",
    ...rows.map(renderRow),
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

function usage(): never {
  throw new Error(
    [
      "Usage:",
      "  node dist/src/cli.js claims.md --evidence evidence.md --policy policy.md --output review.md --review-only",
    ].join("\n"),
  );
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  main();
}
