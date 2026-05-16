import { describe, expect, it } from "vitest";

import { validateEstimatorSummary, SummaryValidationError } from "./summary-schema";

const validModelOutput = (): {
  title: unknown;
  overview: unknown;
  materialLines: Record<string, unknown>[];
  laborNotes: unknown[];
  doubleChecks: Record<string, unknown>[];
  disclaimer: unknown;
} => ({
  title: " Deck material estimate ",
  overview: " This estimate covers pressure-treated framing lumber for the submitted deck scope. ",
  materialLines: [
    {
      id: " 2x8-beams ",
      label: " 2x8 pressure-treated beam boards ",
      quantity: 4,
      unit: " boards ",
      unitCost: 22.5,
      totalCost: 90,
    },
    {
      id: " 2x6-joists ",
      label: " 2x6 pressure-treated joists ",
      quantity: 13,
      unit: " boards ",
      unitCost: 15.25,
      totalCost: 198.25,
    },
  ],
  laborNotes: [" Confirm post heights before cutting. ", " Stage lumber by nominal size before layout. "],
  doubleChecks: [
    {
      id: " beam-span ",
      severity: " warning ",
      title: " Verify beam span ",
      detail: " Confirm the final span against local code and actual footing placement. ",
    },
    {
      id: " waste ",
      severity: " info ",
      title: " Review waste ",
      detail: " Waste is based on deterministic browser optimization output. ",
    },
  ],
  disclaimer: " This is a planning estimate, not an engineered design or code approval. ",
});

const expectValidationIssues = (value: unknown, issueSubstring: string) => {
  expect(() => validateEstimatorSummary(value)).toThrow(SummaryValidationError);

  try {
    validateEstimatorSummary(value);
  } catch (error) {
    expect(error).toBeInstanceOf(SummaryValidationError);
    expect((error as SummaryValidationError).code).toBe("SUMMARY_VALIDATION_FAILED");
    expect((error as SummaryValidationError).issues).toEqual(
      expect.arrayContaining([expect.stringContaining(issueSubstring)]),
    );
  }
};

describe("validateEstimatorSummary", () => {
  it("accepts valid estimator summary output", () => {
    const result = validateEstimatorSummary(validModelOutput());

    expect(result).toEqual({
      title: "Deck material estimate",
      overview: "This estimate covers pressure-treated framing lumber for the submitted deck scope.",
      materialLines: [
        {
          id: "2x8-beams",
          label: "2x8 pressure-treated beam boards",
          quantity: 4,
          unit: "boards",
          unitCost: 22.5,
          totalCost: 90,
        },
        {
          id: "2x6-joists",
          label: "2x6 pressure-treated joists",
          quantity: 13,
          unit: "boards",
          unitCost: 15.25,
          totalCost: 198.25,
        },
      ],
      laborNotes: ["Confirm post heights before cutting.", "Stage lumber by nominal size before layout."],
      doubleChecks: [
        {
          id: "beam-span",
          severity: "warning",
          title: "Verify beam span",
          detail: "Confirm the final span against local code and actual footing placement.",
        },
        {
          id: "waste",
          severity: "info",
          title: "Review waste",
          detail: "Waste is based on deterministic browser optimization output.",
        },
      ],
      disclaimer: "This is a planning estimate, not an engineered design or code approval.",
    });
  });

  it("trims superficial string whitespace throughout the summary", () => {
    const result = validateEstimatorSummary(validModelOutput());

    expect(result.title).toBe("Deck material estimate");
    expect(result.materialLines[0]).toMatchObject({ id: "2x8-beams", label: "2x8 pressure-treated beam boards", unit: "boards" });
    expect(result.laborNotes[0]).toBe("Confirm post heights before cutting.");
    expect(result.doubleChecks[0]).toMatchObject({
      id: "beam-span",
      severity: "warning",
      title: "Verify beam span",
      detail: "Confirm the final span against local code and actual footing placement.",
    });
    expect(result.disclaimer).toBe("This is a planning estimate, not an engineered design or code approval.");
  });

  it("aggregates issues before throwing", () => {
    try {
      validateEstimatorSummary({
        ...validModelOutput(),
        title: " ",
        materialLines: [{ ...validModelOutput().materialLines[0], quantity: 0, unitCost: Number.POSITIVE_INFINITY }],
        laborNotes: [" "],
        doubleChecks: [{ ...validModelOutput().doubleChecks[0], severity: "urgent", detail: " " }],
      });
    } catch (error) {
      expect(error).toBeInstanceOf(SummaryValidationError);
      expect((error as SummaryValidationError).issues).toEqual(
        expect.arrayContaining([
          expect.stringContaining("title"),
          expect.stringContaining("materialLines[0].quantity"),
          expect.stringContaining("materialLines[0].unitCost"),
          expect.stringContaining("laborNotes[0]"),
          expect.stringContaining("doubleChecks[0].severity"),
          expect.stringContaining("doubleChecks[0].detail"),
        ]),
      );
    }
  });

  it.each([
    ["null", null],
    ["array", []],
    ["string", "summary"],
  ])("rejects wrong root type: %s", (_label, value) => {
    expectValidationIssues(value, "summary must be an object");
  });

  it("rejects missing required arrays", () => {
    expectValidationIssues({ ...validModelOutput(), materialLines: undefined }, "materialLines must be an array");
    expectValidationIssues({ ...validModelOutput(), laborNotes: undefined }, "laborNotes must be an array");
    expectValidationIssues({ ...validModelOutput(), doubleChecks: undefined }, "doubleChecks must be an array");
  });

  it.each([
    ["unknown severity", "urgent"],
    ["numeric severity", 1],
  ])("rejects invalid double-check severity: %s", (_label, severity) => {
    expectValidationIssues(
      { ...validModelOutput(), doubleChecks: [{ ...validModelOutput().doubleChecks[0], severity }] },
      "doubleChecks[0].severity must be one of: info, warning, review",
    );
  });

  it.each([
    ["string quantity", "4", "materialLines[0].quantity"],
    ["zero quantity", 0, "materialLines[0].quantity"],
    ["negative unitCost", -1, "materialLines[0].unitCost"],
    ["infinite totalCost", Number.POSITIVE_INFINITY, "materialLines[0].totalCost"],
  ])("rejects invalid numeric cost fields: %s", (_label, value, issueSubstring) => {
    const materialLine = { ...validModelOutput().materialLines[0] };
    if (issueSubstring.endsWith("quantity")) {
      materialLine.quantity = value;
    } else if (issueSubstring.endsWith("unitCost")) {
      materialLine.unitCost = value;
    } else {
      materialLine.totalCost = value;
    }

    expectValidationIssues({ ...validModelOutput(), materialLines: [materialLine] }, issueSubstring);
  });

  it.each([
    ["blank note", " ", "laborNotes[0] must be a non-empty string"],
    ["non-string note", 42, "laborNotes[0] must be a string"],
  ])("rejects empty or malformed labor notes: %s", (_label, laborNote, issueSubstring) => {
    expectValidationIssues({ ...validModelOutput(), laborNotes: [laborNote] }, issueSubstring);
  });

  it.each([
    ["non-object double-check", "verify spans", "doubleChecks[0] must be an object"],
    ["blank id", { ...validModelOutput().doubleChecks[0], id: " " }, "doubleChecks[0].id"],
    ["blank title", { ...validModelOutput().doubleChecks[0], title: " " }, "doubleChecks[0].title"],
    ["blank detail", { ...validModelOutput().doubleChecks[0], detail: " " }, "doubleChecks[0].detail"],
  ])("rejects malformed double-check entries: %s", (_label, doubleCheck, issueSubstring) => {
    expectValidationIssues({ ...validModelOutput(), doubleChecks: [doubleCheck] }, issueSubstring);
  });

  it.each([
    ["blank title", { title: " " }, "title must be a non-empty string"],
    ["non-string overview", { overview: 123 }, "overview must be a string"],
    ["blank disclaimer", { disclaimer: " " }, "disclaimer must be a non-empty string"],
    ["blank material id", { materialLines: [{ ...validModelOutput().materialLines[0], id: " " }] }, "materialLines[0].id"],
    ["blank material label", { materialLines: [{ ...validModelOutput().materialLines[0], label: " " }] }, "materialLines[0].label"],
    ["blank material unit", { materialLines: [{ ...validModelOutput().materialLines[0], unit: " " }] }, "materialLines[0].unit"],
  ])("rejects empty required strings: %s", (_label, override, issueSubstring) => {
    expectValidationIssues({ ...validModelOutput(), ...override }, issueSubstring);
  });
});
