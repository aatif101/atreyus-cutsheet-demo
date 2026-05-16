import { optimizeCuts as defaultOptimizeCuts } from "./optimizer";
import type { EstimatorSummary, ExtractionResult, OptimizationResult, RequiredCut } from "./types";

export type CutSheetPhase = "idle" | "extracting" | "optimizing" | "summarizing" | "complete" | "error";
export type FailableCutSheetPhase = "extracting" | "optimizing" | "summarizing";

export interface CutSheetStageError {
  phase: FailableCutSheetPhase;
  code: string;
  message: string;
}

export interface CutSheetStageResult {
  extraction: ExtractionResult;
  optimization: OptimizationResult;
  summary: EstimatorSummary;
}

export interface RunCutSheetStagesOptions {
  fetcher?: typeof fetch;
  optimizeCuts?: (cuts: RequiredCut[]) => OptimizationResult;
  onPhaseChange?: (phase: CutSheetPhase) => void;
  onExtraction?: (extraction: ExtractionResult) => void;
  onOptimization?: (optimization: OptimizationResult) => void;
  onSummary?: (summary: EstimatorSummary) => void;
}

export class CutSheetFlowError extends Error {
  readonly phase: FailableCutSheetPhase;
  readonly code: string;

  constructor(error: CutSheetStageError) {
    super(error.message);
    this.name = "CutSheetFlowError";
    this.phase = error.phase;
    this.code = error.code;
  }

  toStageError(): CutSheetStageError {
    return {
      phase: this.phase,
      code: this.code,
      message: this.message,
    };
  }
}

export function validateScopeText(scopeText: string): string | null {
  return scopeText.trim().length === 0 ? "Enter a deck scope before running the CutSheet flow." : null;
}

export async function runCutSheetStages(
  scopeText: string,
  {
    fetcher = fetch,
    optimizeCuts = defaultOptimizeCuts,
    onPhaseChange,
    onExtraction,
    onOptimization,
    onSummary,
  }: RunCutSheetStagesOptions = {},
): Promise<CutSheetStageResult> {
  const trimmedScopeText = scopeText.trim();
  const validationMessage = validateScopeText(trimmedScopeText);
  if (validationMessage) {
    throw new CutSheetFlowError({ phase: "extracting", code: "EMPTY_SCOPE_TEXT", message: validationMessage });
  }

  onPhaseChange?.("extracting");
  const extraction = await postJson<ExtractionResult>(
    "/api/extract",
    { scopeText: trimmedScopeText },
    "extracting",
    "MALFORMED_EXTRACTION_RESPONSE",
    isExtractionResult,
    fetcher,
  );
  onExtraction?.(extraction);

  onPhaseChange?.("optimizing");
  let optimization: OptimizationResult;
  try {
    optimization = optimizeCuts(extraction.cuts);
  } catch {
    throw new CutSheetFlowError({
      phase: "optimizing",
      code: "OPTIMIZATION_FAILED",
      message: "Browser optimization failed before the summary request could run.",
    });
  }
  onOptimization?.(optimization);

  onPhaseChange?.("summarizing");
  const summary = await postJson<EstimatorSummary>(
    "/api/summarize",
    { extraction, optimization },
    "summarizing",
    "MALFORMED_SUMMARY_RESPONSE",
    isEstimatorSummary,
    fetcher,
  );
  onSummary?.(summary);

  onPhaseChange?.("complete");
  return { extraction, optimization, summary };
}

async function postJson<T>(
  url: string,
  body: unknown,
  phase: FailableCutSheetPhase,
  malformedCode: string,
  validate: (value: unknown) => value is T,
  fetcher: typeof fetch,
): Promise<T> {
  let response: Response;

  try {
    response = await fetcher(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    throw new CutSheetFlowError({
      phase,
      code: "NETWORK_ERROR",
      message: `The ${phase} request could not reach the CutSheet API.`,
    });
  }

  const payload = await readJson(response);

  if (!response.ok) {
    const apiError = readApiError(payload);
    throw new CutSheetFlowError({
      phase,
      code: apiError.code,
      message: apiError.message,
    });
  }

  if (!validate(payload)) {
    throw new CutSheetFlowError({
      phase,
      code: malformedCode,
      message: `The ${phase} API returned an unexpected payload shape.`,
    });
  }

  return payload;
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function readApiError(payload: unknown): { code: string; message: string } {
  if (isRecord(payload) && isRecord(payload.error)) {
    const code = typeof payload.error.code === "string" && payload.error.code.trim() ? payload.error.code : "API_ERROR";
    const message =
      typeof payload.error.message === "string" && payload.error.message.trim()
        ? payload.error.message
        : "The CutSheet API returned an error.";
    return { code, message };
  }

  return { code: "API_ERROR", message: "The CutSheet API returned an error." };
}

export function isExtractionResult(value: unknown): value is ExtractionResult {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.scopeText === "string" &&
    Array.isArray(value.cuts) &&
    value.cuts.every(isRequiredCut) &&
    Array.isArray(value.assumptions) &&
    value.assumptions.every(isExtractionAssumption) &&
    Array.isArray(value.warnings) &&
    value.warnings.every((warning) => typeof warning === "string")
  );
}

export function isEstimatorSummary(value: unknown): value is EstimatorSummary {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.title === "string" &&
    typeof value.overview === "string" &&
    Array.isArray(value.materialLines) &&
    value.materialLines.every(isSummaryCostLine) &&
    Array.isArray(value.laborNotes) &&
    value.laborNotes.every((note) => typeof note === "string") &&
    Array.isArray(value.doubleChecks) &&
    value.doubleChecks.every(isDoubleCheckItem) &&
    typeof value.disclaimer === "string"
  );
}

function isOptimizationResult(value: unknown): value is OptimizationResult {
  if (!isRecord(value) || !isRecord(value.totals)) {
    return false;
  }

  const totals = value.totals;
  const totalFields = ["boards", "placedCuts", "requiredCuts", "materialCost", "purchasedInches", "usedInches", "wasteInches", "wastePercent"];
  return (
    Array.isArray(value.layouts) &&
    Array.isArray(value.purchaseList) &&
    Array.isArray(value.unplacedCuts) &&
    totalFields.every((field) => typeof totals[field] === "number" && Number.isFinite(totals[field]))
  );
}

function isRequiredCut(value: unknown): value is RequiredCut {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.id === "string" &&
    typeof value.label === "string" &&
    value.material === "pressure-treated" &&
    ["2x4", "2x6", "2x8", "4x4"].includes(String(value.nominalSize)) &&
    typeof value.lengthInches === "number" &&
    Number.isFinite(value.lengthInches) &&
    typeof value.quantity === "number" &&
    Number.isInteger(value.quantity) &&
    ["beam", "joist", "rim", "post", "blocking", "stair", "misc"].includes(String(value.source))
  );
}

function isExtractionAssumption(value: unknown): boolean {
  return isRecord(value) && typeof value.id === "string" && typeof value.label === "string" && typeof value.detail === "string";
}

function isSummaryCostLine(value: unknown): boolean {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.label === "string" &&
    typeof value.quantity === "number" &&
    typeof value.unit === "string" &&
    typeof value.unitCost === "number" &&
    typeof value.totalCost === "number"
  );
}

function isDoubleCheckItem(value: unknown): boolean {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    ["info", "warning", "review"].includes(String(value.severity)) &&
    typeof value.title === "string" &&
    typeof value.detail === "string"
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export const stagedFlowTestHooks = {
  isOptimizationResult,
};
