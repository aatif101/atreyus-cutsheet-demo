import { describe, expect, it } from "vitest";

import { formatCurrency, formatFeetInches, formatPercent } from "./format";

describe("formatCurrency", () => {
  it("formats zero with cents", () => {
    expect(formatCurrency(0)).toBe("$0.00");
  });

  it("formats non-whole currency with thousands separators", () => {
    expect(formatCurrency(1234.567)).toBe("$1,234.57");
  });
});

describe("formatPercent", () => {
  it("formats zero as a whole percentage", () => {
    expect(formatPercent(0)).toBe("0%");
  });

  it("formats non-whole percentages with one decimal place", () => {
    expect(formatPercent(0.1234)).toBe("12.3%");
  });
});

describe("formatFeetInches", () => {
  it("formats zero inches", () => {
    expect(formatFeetInches(0)).toBe('0"');
  });

  it("formats whole-foot measurements without trailing inches", () => {
    expect(formatFeetInches(96)).toBe("8'");
  });

  it("formats mixed feet and inches", () => {
    expect(formatFeetInches(101)).toBe("8' 5\"");
  });

  it("rounds fractional inches for display only", () => {
    expect(formatFeetInches(14.5)).toBe("1' 3\"");
  });
});
