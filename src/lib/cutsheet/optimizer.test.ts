import { describe, expect, it } from "vitest";

import { MOCK_EXTRACTION_RESULT } from "./mock";
import { optimizeCuts } from "./optimizer";
import type { RequiredCut, StockBoard } from "./types";

const baseCut = (overrides: Partial<RequiredCut>): RequiredCut => ({
  id: "cut-1",
  label: "Test cut",
  material: "pressure-treated",
  nominalSize: "2x4",
  lengthInches: 48,
  quantity: 1,
  source: "misc",
  ...overrides,
});

describe("optimizeCuts", () => {
  it("optimizes the 10x12 mock deck fixture into deterministic layouts and totals", () => {
    const result = optimizeCuts(MOCK_EXTRACTION_RESULT.cuts);

    expect(result.unplacedCuts).toEqual([]);
    expect(result.totals).toEqual({
      boards: 21,
      placedCuts: 29,
      requiredCuts: 29,
      materialCost: 268.96,
      purchasedInches: 2688,
      usedInches: 2612,
      wasteInches: 76,
      wastePercent: 76 / 2688,
    });
    expect(result.purchaseList).toEqual([
      expect.objectContaining({ stockId: "pt-2x6-8", quantity: 2, totalCost: 15.68 }),
      expect.objectContaining({ stockId: "pt-2x6-10", quantity: 2, totalCost: 20.84 }),
      expect.objectContaining({ stockId: "pt-2x6-12", quantity: 11, totalCost: 13.28 * 11 }),
      expect.objectContaining({ stockId: "pt-2x8-10", quantity: 4, totalCost: 60.88 }),
      expect.objectContaining({ stockId: "pt-4x4-8", quantity: 2, totalCost: 25.48 }),
    ]);
    expect(result.layouts.map((layout) => layout.id).slice(0, 4)).toEqual([
      "pt-2x6-12-board-1",
      "pt-2x6-12-board-2",
      "pt-2x6-12-board-3",
      "pt-2x6-12-board-4",
    ]);
  });

  it("uses First Fit Decreasing order and reuses the first compatible board before opening another", () => {
    const stockCatalog: StockBoard[] = [
      { id: "pt-2x4-8", material: "pressure-treated", nominalSize: "2x4", lengthInches: 96, unitCost: 5, label: "PT 2x4x8'" },
    ];

    const result = optimizeCuts(
      [
        baseCut({ id: "cut-36-b", label: "Second 36", lengthInches: 36 }),
        baseCut({ id: "cut-24", label: "Twenty four", lengthInches: 24 }),
        baseCut({ id: "cut-60", label: "Sixty", lengthInches: 60 }),
        baseCut({ id: "cut-36-a", label: "First 36", lengthInches: 36 }),
      ],
      stockCatalog,
    );

    expect(result.unplacedCuts).toEqual([]);
    expect(result.layouts).toHaveLength(2);
    expect(result.layouts.map((layout) => layout.placedCuts.map((cut) => cut.lengthInches))).toEqual([
      [60, 36],
      [36, 24],
    ]);
    expect(result.layouts.map((layout) => layout.placedCuts.map((cut) => cut.requiredCutId))).toEqual([
      ["cut-60", "cut-36-a"],
      ["cut-36-b", "cut-24"],
    ]);
    expect(result.layouts.map((layout) => layout.usedInches)).toEqual([96, 60]);
    expect(result.layouts.map((layout) => layout.wasteInches)).toEqual([0, 36]);
  });

  it("computes inch totals, board waste, purchase quantities, and material cost without display formatting", () => {
    const stockCatalog: StockBoard[] = [
      { id: "pt-2x4-8", material: "pressure-treated", nominalSize: "2x4", lengthInches: 96, unitCost: 7.25, label: "PT 2x4x8'" },
    ];

    const result = optimizeCuts(
      [
        baseCut({ id: "blocking", label: "Blocking", lengthInches: 24, quantity: 1 }),
        baseCut({ id: "stud", label: "Stud", lengthInches: 48, quantity: 2 }),
      ],
      stockCatalog,
    );

    expect(result.unplacedCuts).toEqual([]);
    expect(result.totals).toEqual({
      boards: 2,
      placedCuts: 3,
      requiredCuts: 3,
      materialCost: 14.5,
      purchasedInches: 192,
      usedInches: 120,
      wasteInches: 72,
      wastePercent: 72 / 192,
    });
    expect(result.purchaseList).toEqual([
      {
        stockId: "pt-2x4-8",
        label: "PT 2x4x8'",
        material: "pressure-treated",
        nominalSize: "2x4",
        lengthInches: 96,
        quantity: 2,
        unitCost: 7.25,
        totalCost: 14.5,
      },
    ]);
    expect(result.layouts.map((layout) => ({ usedInches: layout.usedInches, wasteInches: layout.wasteInches, cost: layout.cost }))).toEqual([
      { usedInches: 96, wasteInches: 0, cost: 7.25 },
      { usedInches: 24, wasteInches: 72, cost: 7.25 },
    ]);
    expect(result.layouts.map((layout) => layout.placedCuts.map((cut) => [cut.requiredCutId, cut.instance]))).toEqual([
      [
        ["stud", 1],
        ["stud", 2],
      ],
      [["blocking", 1]],
    ]);
  });

  it("expands quantities into individual placed cut instances and counts them in required and placed totals", () => {
    const result = optimizeCuts([baseCut({ id: "blocking", label: "Blocking", lengthInches: 24, quantity: 5 })]);

    expect(result.unplacedCuts).toEqual([]);
    expect(result.totals.requiredCuts).toBe(5);
    expect(result.totals.placedCuts).toBe(5);
    expect(result.layouts).toHaveLength(2);
    expect(result.layouts.flatMap((layout) => layout.placedCuts.map((cut) => cut.instance))).toEqual([1, 2, 3, 4, 5]);
    expect(result.layouts[0]).toMatchObject({ usedInches: 96, wasteInches: 0 });
    expect(result.layouts[1]).toMatchObject({ usedInches: 24, wasteInches: 72 });
  });

  it("returns invalid quantity diagnostics for zero, negative, and non-integer quantities without counting them as required cuts", () => {
    const result = optimizeCuts([
      baseCut({ id: "zero-quantity", label: "Zero quantity", quantity: 0 }),
      baseCut({ id: "negative-quantity", label: "Negative quantity", quantity: -2 }),
      baseCut({ id: "fractional-quantity", label: "Fractional quantity", quantity: 1.5 }),
      baseCut({ id: "valid-quantity", label: "Valid quantity", lengthInches: 24, quantity: 2 }),
    ]);

    expect(result.totals.requiredCuts).toBe(2);
    expect(result.totals.placedCuts).toBe(2);
    expect(result.unplacedCuts.map((cut) => [cut.requiredCutId, cut.reason])).toEqual([
      ["zero-quantity", "invalid-quantity"],
      ["negative-quantity", "invalid-quantity"],
      ["fractional-quantity", "invalid-quantity"],
    ]);
    expect(result.unplacedCuts.map((cut) => cut.message)).toEqual([
      expect.stringContaining("positive whole number"),
      expect.stringContaining("positive whole number"),
      expect.stringContaining("positive whole number"),
    ]);
    expect(result.layouts.flatMap((layout) => layout.placedCuts.map((cut) => [cut.requiredCutId, cut.instance]))).toEqual([
      ["valid-quantity", 1],
      ["valid-quantity", 2],
    ]);
  });

  it("keeps same-size cuts separated by nominal size when compatible stock exists", () => {
    const stockCatalog: StockBoard[] = [
      { id: "pt-2x4-8", material: "pressure-treated", nominalSize: "2x4", lengthInches: 96, unitCost: 5, label: "PT 2x4x8'" },
      { id: "pt-2x6-8", material: "pressure-treated", nominalSize: "2x6", lengthInches: 96, unitCost: 8, label: "PT 2x6x8'" },
    ];

    const result = optimizeCuts(
      [
        baseCut({ id: "two-by-four", label: "2x4 cut", nominalSize: "2x4", lengthInches: 48 }),
        baseCut({ id: "two-by-six", label: "2x6 cut", nominalSize: "2x6", lengthInches: 48 }),
      ],
      stockCatalog,
    );

    expect(result.unplacedCuts).toEqual([]);
    expect(result.layouts).toHaveLength(2);
    expect(result.layouts.map((layout) => layout.stock.nominalSize)).toEqual(["2x4", "2x6"]);
    expect(result.layouts.map((layout) => layout.placedCuts[0].requiredCutId)).toEqual(["two-by-four", "two-by-six"]);
  });

  it("keeps same-size cuts separated by material when compatible stock exists", () => {
    const cedarMaterial = "cedar" as RequiredCut["material"];
    const stockCatalog: StockBoard[] = [
      { id: "cedar-2x4-8", material: cedarMaterial, nominalSize: "2x4", lengthInches: 96, unitCost: 11, label: "Cedar 2x4x8'" },
      { id: "pt-2x4-8", material: "pressure-treated", nominalSize: "2x4", lengthInches: 96, unitCost: 5, label: "PT 2x4x8'" },
    ];

    const result = optimizeCuts(
      [
        baseCut({ id: "pt-cut", label: "PT cut", lengthInches: 48 }),
        baseCut({ id: "cedar-cut", label: "Cedar cut", material: cedarMaterial, lengthInches: 48 }),
      ],
      stockCatalog,
    );

    expect(result.unplacedCuts).toEqual([]);
    expect(result.layouts).toHaveLength(2);
    expect(result.layouts.map((layout) => layout.stock.id)).toEqual(["cedar-2x4-8", "pt-2x4-8"]);
    expect(result.layouts.map((layout) => layout.placedCuts[0].requiredCutId)).toEqual(["cedar-cut", "pt-cut"]);
  });

  it("orders boards deterministically by material, nominal size, decreasing length, cut id, and instance", () => {
    const result = optimizeCuts([
      baseCut({ id: "short", label: "Short", nominalSize: "2x6", lengthInches: 24, quantity: 2 }),
      baseCut({ id: "long-b", label: "Long B", nominalSize: "2x4", lengthInches: 72, quantity: 1 }),
      baseCut({ id: "long-a", label: "Long A", nominalSize: "2x4", lengthInches: 72, quantity: 1 }),
    ]);

    expect(result.layouts.map((layout) => layout.stock.id)).toEqual(["pt-2x4-8", "pt-2x4-8", "pt-2x6-8"]);
    expect(result.layouts.flatMap((layout) => layout.placedCuts.map((cut) => cut.requiredCutId))).toEqual([
      "long-a",
      "long-b",
      "short",
      "short",
    ]);
  });

  it("returns unplaced diagnostics for unsupported stock, invalid lengths, invalid quantities, and oversize cuts", () => {
    const unsupportedMaterial = "cedar" as RequiredCut["material"];
    const unsupportedNominalSize = "2x10" as RequiredCut["nominalSize"];
    const result = optimizeCuts([
      baseCut({ id: "unsupported-material", label: "Unsupported material", material: unsupportedMaterial }),
      baseCut({ id: "unsupported-nominal", label: "Unsupported nominal", nominalSize: unsupportedNominalSize }),
      baseCut({ id: "zero-length", label: "Zero length", lengthInches: 0 }),
      baseCut({ id: "infinite-length", label: "Infinite length", lengthInches: Infinity }),
      baseCut({ id: "zero-quantity", label: "Zero quantity", quantity: 0 }),
      baseCut({ id: "negative-quantity", label: "Negative quantity", quantity: -1 }),
      baseCut({ id: "fractional-quantity", label: "Fractional quantity", quantity: 2.5 }),
      baseCut({ id: "too-long", label: "Too long", nominalSize: "4x4", lengthInches: 145 }),
    ]);

    expect(result.layouts).toEqual([]);
    expect(result.totals).toMatchObject({
      boards: 0,
      placedCuts: 0,
      requiredCuts: 5,
      materialCost: 0,
      purchasedInches: 0,
      usedInches: 0,
      wasteInches: 0,
      wastePercent: 0,
    });
    expect(result.unplacedCuts.map((cut) => [cut.requiredCutId, cut.reason])).toEqual([
      ["unsupported-material", "unsupported-stock"],
      ["unsupported-nominal", "unsupported-stock"],
      ["zero-length", "invalid-length"],
      ["infinite-length", "invalid-length"],
      ["zero-quantity", "invalid-quantity"],
      ["negative-quantity", "invalid-quantity"],
      ["fractional-quantity", "invalid-quantity"],
      ["too-long", "oversize-cut"],
    ]);
    expect(result.unplacedCuts.map((cut) => cut.message)).toEqual([
      expect.stringContaining("not available"),
      expect.stringContaining("not available"),
      expect.stringContaining("greater than zero"),
      expect.stringContaining("greater than zero"),
      expect.stringContaining("positive whole number"),
      expect.stringContaining("positive whole number"),
      expect.stringContaining("positive whole number"),
      expect.stringContaining("longer than the longest compatible stock board"),
    ]);
  });
});
