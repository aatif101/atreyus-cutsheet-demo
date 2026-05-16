import { describe, expect, it } from "vitest";

import {
  EXTRACT_ERROR_CODES,
  ExtractionSetupError,
  ExtractionUpstreamError,
  handleExtractRequest,
  type ExtractService,
} from "./extract-handler";
import { ExtractionValidationError } from "./extraction-schema";
import type { ExtractionResult } from "./types";

const validScopeText = "Build a 12 ft by 16 ft pressure-treated deck with 2x8 beams and 2x6 joists.";

const validExtraction: ExtractionResult = {
  scopeText: validScopeText,
  cuts: [
    {
      id: "front-beam",
      label: "Front beam member",
      material: "pressure-treated",
      nominalSize: "2x8",
      lengthInches: 192,
      quantity: 2,
      source: "beam",
    },
  ],
  assumptions: [
    {
      id: "joist-spacing",
      label: "Joist spacing",
      detail: "Joists are assumed at 16 inches on center.",
    },
  ],
  warnings: ["Field verify final post heights."],
};

const jsonRequest = (body: unknown): Request =>
  new Request("http://localhost/api/extract", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

const rawRequest = (body: string): Request =>
  new Request("http://localhost/api/extract", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body,
  });

async function readJson(response: Response): Promise<unknown> {
  return response.json();
}

describe("handleExtractRequest", () => {
  it("returns validated extraction JSON for a valid request", async () => {
    const calls: string[] = [];
    const extractService: ExtractService = async (scopeText) => {
      calls.push(scopeText);
      return { ...validExtraction, scopeText };
    };

    const response = await handleExtractRequest(jsonRequest({ scopeText: ` ${validScopeText} ` }), extractService);

    expect(response.status).toBe(200);
    expect(calls).toEqual([validScopeText]);
    expect(await readJson(response)).toEqual({ ...validExtraction, scopeText: validScopeText });
  });

  it("rejects invalid JSON with a 400 safe error shape", async () => {
    const response = await handleExtractRequest(rawRequest("{"), async () => validExtraction);

    expect(response.status).toBe(400);
    expect(await readJson(response)).toEqual({
      error: {
        code: EXTRACT_ERROR_CODES.invalidJson,
        message: "Request body must be valid JSON.",
      },
    });
  });

  it.each([
    ["missing scopeText", {}, "scopeText must be a string."],
    ["non-string scopeText", { scopeText: 123 }, "scopeText must be a string."],
    ["empty scopeText", { scopeText: "   " }, "scopeText must be a non-empty string."],
    ["non-object body", null, "Request body must be an object with a scopeText string."],
  ])("rejects %s with 400 before calling the extraction service", async (_label, body, message) => {
    let calls = 0;
    const response = await handleExtractRequest(jsonRequest(body), async () => {
      calls += 1;
      return validExtraction;
    });

    expect(calls).toBe(0);
    expect(response.status).toBe(400);
    expect(await readJson(response)).toEqual({
      error: {
        code: EXTRACT_ERROR_CODES.invalidScopeText,
        message,
      },
    });
  });

  it("maps missing setup to 503 without exposing the setup error details", async () => {
    const response = await handleExtractRequest(jsonRequest({ scopeText: validScopeText }), async () => {
      throw new ExtractionSetupError("ANTHROPIC_API_KEY is missing");
    });

    expect(response.status).toBe(503);
    expect(await readJson(response)).toEqual({
      error: {
        code: EXTRACT_ERROR_CODES.setupMissing,
        message: "Extraction service is not configured.",
      },
    });
  });

  it("maps upstream provider failure to 502 without exposing raw provider details", async () => {
    const response = await handleExtractRequest(jsonRequest({ scopeText: validScopeText }), async () => {
      throw new ExtractionUpstreamError("provider stack trace and secret-ish request details");
    });

    expect(response.status).toBe(502);
    expect(await readJson(response)).toEqual({
      error: {
        code: EXTRACT_ERROR_CODES.upstreamFailed,
        message: "Extraction provider request failed.",
      },
    });
  });

  it("maps malformed model output validation failure to 502 without exposing validator internals", async () => {
    const response = await handleExtractRequest(jsonRequest({ scopeText: validScopeText }), async () => {
      throw new ExtractionValidationError(["cuts[0].lengthInches must be a positive finite number"]);
    });

    expect(response.status).toBe(502);
    expect(await readJson(response)).toEqual({
      error: {
        code: EXTRACT_ERROR_CODES.validationFailed,
        message: "Extraction provider returned invalid structured output.",
      },
    });
  });

  it("maps unexpected extraction failures to the sanitized upstream 502 shape", async () => {
    const response = await handleExtractRequest(jsonRequest({ scopeText: validScopeText }), async () => {
      throw new Error("unexpected implementation detail");
    });

    expect(response.status).toBe(502);
    expect(await readJson(response)).toEqual({
      error: {
        code: EXTRACT_ERROR_CODES.upstreamFailed,
        message: "Extraction provider request failed.",
      },
    });
  });
});
