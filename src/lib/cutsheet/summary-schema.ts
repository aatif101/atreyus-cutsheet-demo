import type { DoubleCheckItem, EstimatorSummary, SummaryCostLine } from "./types";

export const SUMMARY_VALIDATION_ERROR_CODE = "SUMMARY_VALIDATION_FAILED" as const;

const VALID_DOUBLE_CHECK_SEVERITIES = ["info", "warning", "review"] as const satisfies readonly DoubleCheckItem["severity"][];

export class SummaryValidationError extends Error {
  readonly code = SUMMARY_VALIDATION_ERROR_CODE;
  readonly issues: string[];

  constructor(issues: string[]) {
    super(`Claude summary output failed validation: ${issues.length} issue${issues.length === 1 ? "" : "s"}`);
    this.name = "SummaryValidationError";
    this.issues = issues;
  }
}

export function validateEstimatorSummary(modelOutput: unknown): EstimatorSummary {
  const issues: string[] = [];
  const root = readRecord(modelOutput, "summary", issues);

  const materialLines = readArray(root, "materialLines", issues).map((value, index) =>
    validateMaterialLine(value, `materialLines[${index}]`, issues),
  );
  const laborNotes = readArray(root, "laborNotes", issues).map((value, index) =>
    trimRequiredString(value, `laborNotes[${index}]`, issues),
  );
  const doubleChecks = readArray(root, "doubleChecks", issues).map((value, index) =>
    validateDoubleCheck(value, `doubleChecks[${index}]`, issues),
  );

  const summary: EstimatorSummary = {
    title: trimRequiredString(root.title, "title", issues),
    overview: trimRequiredString(root.overview, "overview", issues),
    materialLines,
    laborNotes,
    doubleChecks,
    disclaimer: trimRequiredString(root.disclaimer, "disclaimer", issues),
  };

  if (issues.length > 0) {
    throw new SummaryValidationError(issues);
  }

  return summary;
}

function validateMaterialLine(value: unknown, path: string, issues: string[]): SummaryCostLine {
  const materialLine = readRecord(value, path, issues);

  return {
    id: trimRequiredString(materialLine.id, `${path}.id`, issues),
    label: trimRequiredString(materialLine.label, `${path}.label`, issues),
    quantity: readPositiveFiniteNumber(materialLine.quantity, `${path}.quantity`, issues),
    unit: trimRequiredString(materialLine.unit, `${path}.unit`, issues),
    unitCost: readPositiveFiniteNumber(materialLine.unitCost, `${path}.unitCost`, issues),
    totalCost: readPositiveFiniteNumber(materialLine.totalCost, `${path}.totalCost`, issues),
  };
}

function validateDoubleCheck(value: unknown, path: string, issues: string[]): DoubleCheckItem {
  const doubleCheck = readRecord(value, path, issues);

  return {
    id: trimRequiredString(doubleCheck.id, `${path}.id`, issues),
    severity: readEnum(doubleCheck.severity, VALID_DOUBLE_CHECK_SEVERITIES, `${path}.severity`, issues),
    title: trimRequiredString(doubleCheck.title, `${path}.title`, issues),
    detail: trimRequiredString(doubleCheck.detail, `${path}.detail`, issues),
  };
}

function readRecord(value: unknown, path: string, issues: string[]): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    issues.push(`${path} must be an object`);
    return {};
  }

  return value as Record<string, unknown>;
}

function readArray(
  root: Record<string, unknown>,
  property: "materialLines" | "laborNotes" | "doubleChecks",
  issues: string[],
): unknown[] {
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
