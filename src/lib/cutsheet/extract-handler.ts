import { EXTRACTION_VALIDATION_ERROR_CODE, ExtractionValidationError } from "./extraction-schema";
import type { ExtractionResult } from "./types";

export const EXTRACT_ERROR_CODES = {
  invalidJson: "INVALID_JSON",
  invalidScopeText: "INVALID_SCOPE_TEXT",
  setupMissing: "EXTRACTION_SETUP_MISSING",
  upstreamFailed: "EXTRACTION_UPSTREAM_FAILED",
  validationFailed: EXTRACTION_VALIDATION_ERROR_CODE,
} as const;

export type ExtractErrorCode = (typeof EXTRACT_ERROR_CODES)[keyof typeof EXTRACT_ERROR_CODES];

export interface ExtractErrorResponse {
  error: {
    code: ExtractErrorCode;
    message: string;
  };
}

export type ExtractService = (scopeText: string) => Promise<ExtractionResult>;

const MAX_SCOPE_TEXT_LENGTH = 12_000;

export class ExtractionSetupError extends Error {
  readonly code = EXTRACT_ERROR_CODES.setupMissing;

  constructor(message = "Extraction service is not configured.") {
    super(message);
    this.name = "ExtractionSetupError";
  }
}

export class ExtractionUpstreamError extends Error {
  readonly code = EXTRACT_ERROR_CODES.upstreamFailed;

  constructor(message = "Extraction provider request failed.") {
    super(message);
    this.name = "ExtractionUpstreamError";
  }
}

export async function POST(request: Request): Promise<Response> {
  return handleExtractRequest(request);
}

export async function handleExtractRequest(
  request: Request,
  extractService: ExtractService = defaultExtractService,
): Promise<Response> {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return jsonError(EXTRACT_ERROR_CODES.invalidJson, "Request body must be valid JSON.", 400);
  }

  const scopeTextResult = readScopeText(body);
  if (!scopeTextResult.ok) {
    return jsonError(EXTRACT_ERROR_CODES.invalidScopeText, scopeTextResult.message, 400);
  }

  try {
    const extraction = await extractService(scopeTextResult.scopeText);
    return Response.json(extraction, { status: 200 });
  } catch (error) {
    if (error instanceof ExtractionSetupError) {
      return jsonError(EXTRACT_ERROR_CODES.setupMissing, "Extraction service is not configured.", 503);
    }

    if (error instanceof ExtractionValidationError) {
      return jsonError(EXTRACT_ERROR_CODES.validationFailed, "Extraction provider returned invalid structured output.", 502);
    }

    if (error instanceof ExtractionUpstreamError) {
      return jsonError(EXTRACT_ERROR_CODES.upstreamFailed, "Extraction provider request failed.", 502);
    }

    return jsonError(EXTRACT_ERROR_CODES.upstreamFailed, "Extraction provider request failed.", 502);
  }
}

async function defaultExtractService(scopeText: string): Promise<ExtractionResult> {
  const { extractCutsWithClaude } = await import("./claude-extract");
  return extractCutsWithClaude(scopeText);
}

function readScopeText(body: unknown): { ok: true; scopeText: string } | { ok: false; message: string } {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return { ok: false, message: "Request body must be an object with a scopeText string." };
  }

  const scopeText = (body as { scopeText?: unknown }).scopeText;
  if (typeof scopeText !== "string") {
    return { ok: false, message: "scopeText must be a string." };
  }

  const trimmedScopeText = scopeText.trim();
  if (trimmedScopeText.length === 0) {
    return { ok: false, message: "scopeText must be a non-empty string." };
  }

  if (trimmedScopeText.length > MAX_SCOPE_TEXT_LENGTH) {
    return { ok: false, message: `scopeText must be ${MAX_SCOPE_TEXT_LENGTH} characters or fewer.` };
  }

  return { ok: true, scopeText: trimmedScopeText };
}

function jsonError(code: ExtractErrorCode, message: string, status: number): Response {
  return Response.json({ error: { code, message } } satisfies ExtractErrorResponse, { status });
}
