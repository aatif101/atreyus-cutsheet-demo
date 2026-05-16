import type { CutSource, ExtractionAssumption, ExtractionResult, LumberMaterial, NominalSize, RequiredCut } from "./types";

export const EXTRACTION_VALIDATION_ERROR_CODE = "EXTRACTION_VALIDATION_FAILED" as const;

const VALID_MATERIALS = ["pressure-treated"] as const satisfies readonly LumberMaterial[];
const VALID_NOMINAL_SIZES = ["2x4", "2x6", "2x8", "4x4"] as const satisfies readonly NominalSize[];
const VALID_SOURCES = ["beam", "joist", "rim", "post", "blocking", "stair", "misc"] as const satisfies readonly CutSource[];

export class ExtractionValidationError extends Error {
  readonly code = EXTRACTION_VALIDATION_ERROR_CODE;
  readonly issues: string[];

  constructor(issues: string[]) {
    super(`Claude extraction output failed validation: ${issues.length} issue${issues.length === 1 ? "" : "s"}`);
    this.name = "ExtractionValidationError";
    this.issues = issues;
  }
}

export function validateExtractionResult(modelOutput: unknown, scopeText: string): ExtractionResult {
  const issues: string[] = [];
  const root = readRecord(modelOutput, "extraction", issues);
  const trimmedScopeText = trimRequiredString(scopeText, "scopeText", issues);

  const cuts = readArray(root, "cuts", issues).map((value, index) => validateCut(value, `cuts[${index}]`, issues));
  const assumptions = readArray(root, "assumptions", issues).map((value, index) =>
    validateAssumption(value, `assumptions[${index}]`, issues),
  );
  const warnings = readArray(root, "warnings", issues).map((value, index) =>
    trimRequiredString(value, `warnings[${index}]`, issues),
  );

  if (issues.length > 0) {
    throw new ExtractionValidationError(issues);
  }

  return {
    scopeText: trimmedScopeText,
    cuts,
    assumptions,
    warnings,
  };
}

function validateCut(value: unknown, path: string, issues: string[]): RequiredCut {
  const cut = readRecord(value, path, issues);

  rejectFeetFields(cut, path, issues);

  return {
    id: trimRequiredString(cut.id, `${path}.id`, issues),
    label: trimRequiredString(cut.label, `${path}.label`, issues),
    material: readEnum(cut.material, VALID_MATERIALS, `${path}.material`, issues),
    nominalSize: readEnum(cut.nominalSize, VALID_NOMINAL_SIZES, `${path}.nominalSize`, issues),
    lengthInches: readPositiveFiniteNumber(cut.lengthInches, `${path}.lengthInches`, issues),
    quantity: readPositiveInteger(cut.quantity, `${path}.quantity`, issues),
    source: readEnum(cut.source, VALID_SOURCES, `${path}.source`, issues),
    ...(cut.notes === undefined ? {} : { notes: trimOptionalString(cut.notes, `${path}.notes`, issues) }),
  };
}

function validateAssumption(value: unknown, path: string, issues: string[]): ExtractionAssumption {
  const assumption = readRecord(value, path, issues);

  return {
    id: trimRequiredString(assumption.id, `${path}.id`, issues),
    label: trimRequiredString(assumption.label, `${path}.label`, issues),
    detail: trimRequiredString(assumption.detail, `${path}.detail`, issues),
  };
}

function readRecord(value: unknown, path: string, issues: string[]): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    issues.push(`${path} must be an object`);
    return {};
  }

  return value as Record<string, unknown>;
}

function readArray(root: Record<string, unknown>, property: "cuts" | "assumptions" | "warnings", issues: string[]): unknown[] {
  const value = root[property];

  if (!Array.isArray(value)) {
    issues.push(`${property} must be an array`);
    return [];
  }

  return value;
}

function trimRequiredString(value: unknown, path: string, issues: string[]): string {
  if (typeof value !== "string") {
    issues.push(`${path} must be a string`);
    return "";
  }

  const trimmed = value.trim();
  if (trimmed.length === 0) {
    issues.push(`${path} must be a non-empty string`);
  }

  return trimmed;
}

function trimOptionalString(value: unknown, path: string, issues: string[]): string | undefined {
  if (typeof value !== "string") {
    issues.push(`${path} must be a string when provided`);
    return undefined;
  }

  const trimmed = value.trim();
  if (trimmed.length === 0) {
    issues.push(`${path} must be a non-empty string when provided`);
    return undefined;
  }

  return trimmed;
}

function readEnum<T extends string>(value: unknown, allowedValues: readonly T[], path: string, issues: string[]): T {
  if (typeof value !== "string") {
    issues.push(`${path} must be one of: ${allowedValues.join(", ")}`);
    return allowedValues[0];
  }

  const trimmed = value.trim();
  if ((allowedValues as readonly string[]).includes(trimmed)) {
    return trimmed as T;
  }

  issues.push(`${path} must be one of: ${allowedValues.join(", ")}`);
  return allowedValues[0];
}

function readPositiveFiniteNumber(value: unknown, path: string, issues: string[]): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    issues.push(`${path} must be a positive finite number`);
    return 0;
  }

  return value;
}

function readPositiveInteger(value: unknown, path: string, issues: string[]): number {
  if (typeof value !== "number" || !Number.isInteger(value) || value <= 0) {
    issues.push(`${path} must be a positive integer`);
    return 0;
  }

  return value;
}

function rejectFeetFields(cut: Record<string, unknown>, path: string, issues: string[]): void {
  for (const field of ["lengthFeet", "lengthFt", "feet"] as const) {
    if (field in cut) {
      issues.push(`${path}.${field} is not supported; provide lengthInches as a positive finite number`);
    }
  }
}
