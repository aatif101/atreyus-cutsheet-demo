import { describe, it, expect } from "vitest";
import { SAMPLE_DECK_SCOPE, MOCK_EXTRACTION_RESULT, MOCK_ESTIMATOR_SUMMARY } from "./mock";

describe("demo contract — sample scope and fixture surfaces", () => {
  it("SAMPLE_DECK_SCOPE matches the milestone acceptance phrase exactly", () => {
    expect(SAMPLE_DECK_SCOPE).toBe(
      "Build a 10×12 pressure-treated deck with 16-inch joist spacing, 4×4 posts, single level",
    );
  });

  it("mock extraction result references the accepted sample scope", () => {
    expect(MOCK_EXTRACTION_RESULT.scopeText).toBe(SAMPLE_DECK_SCOPE);
  });

  it("mock extraction has no stair cuts (single-level deck)", () => {
    const stairCuts = MOCK_EXTRACTION_RESULT.cuts.filter((c) => c.source === "stair");
    expect(stairCuts).toHaveLength(0);
  });

  it("mock extraction includes all required structural categories", () => {
    const sources = new Set(MOCK_EXTRACTION_RESULT.cuts.map((c) => c.source));
    expect(sources.has("beam")).toBe(true);
    expect(sources.has("joist")).toBe(true);
    expect(sources.has("rim")).toBe(true);
    expect(sources.has("post")).toBe(true);
  });

  it("mock optimizer surfaces: all cuts are finite positive-inch lengths", () => {
    for (const cut of MOCK_EXTRACTION_RESULT.cuts) {
      expect(cut.lengthInches).toBeGreaterThan(0);
      expect(Number.isFinite(cut.lengthInches)).toBe(true);
    }
  });

  it("mock estimator summary includes material lines, labor notes, and double-checks", () => {
    expect(MOCK_ESTIMATOR_SUMMARY.materialLines.length).toBeGreaterThan(0);
    expect(MOCK_ESTIMATOR_SUMMARY.laborNotes.length).toBeGreaterThan(0);
    expect(MOCK_ESTIMATOR_SUMMARY.doubleChecks.length).toBeGreaterThan(0);
  });

  it("mock summary title does not reference 12x16 or stair", () => {
    const title = MOCK_ESTIMATOR_SUMMARY.title.toLowerCase();
    expect(title).not.toContain("12 ft x 16");
    expect(title).not.toContain("stair");
  });
});
