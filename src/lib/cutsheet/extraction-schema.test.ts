import { describe, expect, it } from "vitest";

import { validateExtractionResult, ExtractionValidationError } from "./extraction-schema";

const scopeText = " Build a 12 ft by 16 ft freestanding pressure-treated deck. ";

const validModelOutput = (): { cuts: Record<string, unknown>[]; assumptions: Record<string, unknown>[]; warnings: unknown[] } => ({
  cuts: [
    {
      id: " beam-front ",
      label: " Front doubled beam member ",
      material: " pressure-treated ",
      nominalSize: " 2x8 ",
      lengthInches: 192,
      quantity: 2,
      source: " beam ",
      notes: " Field verify beam splice locations. ",
    },
    {
      id: "joists",
      label: "Deck joists",
      material: "pressure-treated",
      nominalSize: "2x6",
      lengthInches: 144,
      quantity: 13,
      source: "joist",
    },
  ],
  assumptions: [
    {
      id: "spacing",
      label: "Joist spacing",
      detail: "Joists are assumed at 16 inches on center.",
    },
  ],
  warnings: [" Validate post height against site conditions. "],
});

const expectValidationIssues = (value: unknown, issueSubstring: string) => {
  expect(() => validateExtractionResult(value, scopeText)).toThrow(ExtractionValidationError);

  try {
    validateExtractionResult(value, scopeText);
  } catch (error) {
    expect(error).toBeInstanceOf(ExtractionValidationError);
    expect((error as ExtractionValidationError).code).toBe("EXTRACTION_VALIDATION_FAILED");
    expect((error as ExtractionValidationError).issues).toEqual(
      expect.arrayContaining([expect.stringContaining(issueSubstring)]),
    );
  }
};

describe("validateExtractionResult", () => {
  it("accepts valid sample-like extraction output and trims superficial string whitespace", () => {
    const result = validateExtractionResult(validModelOutput(), scopeText);

    expect(result).toEqual({
      scopeText: "Build a 12 ft by 16 ft freestanding pressure-treated deck.",
      cuts: [
        {
          id: "beam-front",
          label: "Front doubled beam member",
          material: "pressure-treated",
          nominalSize: "2x8",
          lengthInches: 192,
          quantity: 2,
          source: "beam",
          notes: "Field verify beam splice locations.",
        },
        {
          id: "joists",
          label: "Deck joists",
          material: "pressure-treated",
          nominalSize: "2x6",
          lengthInches: 144,
          quantity: 13,
          source: "joist",
        },
      ],
      assumptions: [
        {
          id: "spacing",
          label: "Joist spacing",
          detail: "Joists are assumed at 16 inches on center.",
        },
      ],
      warnings: ["Validate post height against site conditions."],
    });
  });

  it.each([
    ["material", { cuts: [{ ...validModelOutput().cuts[0], material: "cedar" }] }, "cuts[0].material"],
    ["nominal size", { cuts: [{ ...validModelOutput().cuts[0], nominalSize: "2x10" }] }, "cuts[0].nominalSize"],
    ["source", { cuts: [{ ...validModelOutput().cuts[0], source: "ledger" }] }, "cuts[0].source"],
  ])("rejects invalid %s enum values", (_label, override, issueSubstring) => {
    expectValidationIssues({ ...validModelOutput(), ...override }, issueSubstring);
  });

  it.each([
    ["string length", "144", "positive finite number"],
    ["zero length", 0, "positive finite number"],
    ["infinite length", Number.POSITIVE_INFINITY, "positive finite number"],
  ])("rejects invalid lengthInches: %s", (_label, lengthInches, issueSubstring) => {
    expectValidationIssues(
      { ...validModelOutput(), cuts: [{ ...validModelOutput().cuts[0], lengthInches }] },
      issueSubstring,
    );
  });

  it("rejects feet-based length fields instead of silently accepting them", () => {
    expectValidationIssues(
      { ...validModelOutput(), cuts: [{ ...validModelOutput().cuts[0], lengthFeet: 12 }] },
      "lengthFeet is not supported",
    );
  });

  it.each([
    ["zero quantity", 0],
    ["fractional quantity", 1.5],
    ["string quantity", "2"],
  ])("rejects invalid quantity: %s", (_label, quantity) => {
    expectValidationIssues({ ...validModelOutput(), cuts: [{ ...validModelOutput().cuts[0], quantity }] }, "positive integer");
  });

  it("rejects missing arrays", () => {
    expectValidationIssues({ assumptions: [], warnings: [] }, "cuts must be an array");
    expectValidationIssues({ cuts: [], warnings: [] }, "assumptions must be an array");
    expectValidationIssues({ cuts: [], assumptions: [] }, "warnings must be an array");
  });

  it.each([
    ["missing id", { label: "Joist spacing", detail: "16 inches on center" }, "assumptions[0].id"],
    ["blank detail", { id: "spacing", label: "Joist spacing", detail: " " }, "assumptions[0].detail"],
    ["non-object assumption", "spacing", "assumptions[0] must be an object"],
  ])("rejects malformed assumptions: %s", (_label, assumption, issueSubstring) => {
    expectValidationIssues({ ...validModelOutput(), assumptions: [assumption] }, issueSubstring);
  });

  it.each([
    ["non-string warning", 123, "warnings[0] must be a string"],
    ["blank warning", " ", "warnings[0] must be a non-empty string"],
  ])("rejects malformed warnings: %s", (_label, warning, issueSubstring) => {
    expectValidationIssues({ ...validModelOutput(), warnings: [warning] }, issueSubstring);
  });
});
