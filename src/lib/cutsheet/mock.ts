import type { EstimatorSummary, ExtractionResult } from "./types";

export const SAMPLE_DECK_SCOPE = `Build a 10×12 pressure-treated deck with 16-inch joist spacing, 4×4 posts, single level`;

export const MOCK_EXTRACTION_RESULT: ExtractionResult = {
  scopeText: SAMPLE_DECK_SCOPE,
  cuts: [
    {
      id: "beam-front",
      label: "Front beam member",
      material: "pressure-treated",
      nominalSize: "2x8",
      lengthInches: 120,
      quantity: 2,
      source: "beam",
    },
    {
      id: "beam-back",
      label: "Back beam member",
      material: "pressure-treated",
      nominalSize: "2x8",
      lengthInches: 120,
      quantity: 2,
      source: "beam",
    },
    {
      id: "joists",
      label: "Deck joists",
      material: "pressure-treated",
      nominalSize: "2x6",
      lengthInches: 144,
      quantity: 9,
      source: "joist",
      notes: "10 ft run at 16 in on center yields 9 joists.",
    },
    {
      id: "rim-long",
      label: "Long rim boards",
      material: "pressure-treated",
      nominalSize: "2x6",
      lengthInches: 144,
      quantity: 2,
      source: "rim",
    },
    {
      id: "rim-short",
      label: "Short rim boards",
      material: "pressure-treated",
      nominalSize: "2x6",
      lengthInches: 120,
      quantity: 2,
      source: "rim",
    },
    {
      id: "blocking",
      label: "Mid-span blocking",
      material: "pressure-treated",
      nominalSize: "2x6",
      lengthInches: 14.5,
      quantity: 8,
      source: "blocking",
    },
    {
      id: "posts",
      label: "Support posts",
      material: "pressure-treated",
      nominalSize: "4x4",
      lengthInches: 48,
      quantity: 4,
      source: "post",
    },
  ],
  assumptions: [
    {
      id: "spacing",
      label: "Joist spacing",
      detail: "Joists are at 16 inches on center per the deck scope.",
    },
    {
      id: "kerf",
      label: "Saw kerf excluded",
      detail: "Cut lengths are exact design lengths; add kerf allowance before ordering.",
    },
    {
      id: "tax-delivery",
      label: "Tax and delivery excluded",
      detail: "Stock costs are material-only fixture values for this demo.",
    },
  ],
  warnings: ["Validate post height against site conditions before purchase."],
};

export const MOCK_ESTIMATOR_SUMMARY: EstimatorSummary = {
  title: "10×12 pressure-treated deck — material estimate",
  overview:
    "Single-level 10×12 deck with 16-inch joist spacing and 4×4 posts. Beams, joists, rim boards, blocking, and posts separated by material category for optimizer and UI verification.",
  materialLines: [
    { id: "framing", label: "Pressure-treated framing lumber", quantity: 1, unit: "lot", unitCost: 480, totalCost: 480 },
    { id: "fasteners", label: "Structural screws and joist hangers", quantity: 1, unit: "allowance", unitCost: 145, totalCost: 145 },
    { id: "waste", label: "Waste and field-fit allowance", quantity: 1, unit: "allowance", unitCost: 72, totalCost: 72 },
  ],
  laborNotes: [
    "Confirm beam spans and footing placement with the final plan set.",
    "Field trim blocking after joists are crowned and installed.",
  ],
  doubleChecks: [
    {
      id: "oversize-review",
      severity: "review",
      title: "Review any unplaced cuts",
      detail: "If the optimizer reports unplaced cuts, choose longer stock or split the member before ordering.",
    },
    {
      id: "hardware-review",
      severity: "warning",
      title: "Hardware quantity not derived from scope",
      detail: "Fastener allowance is a fixture estimate; a production build should derive hardware from extracted cut count.",
    },
    {
      id: "cost-review",
      severity: "info",
      title: "Costs are illustrative",
      detail: "Catalog unit costs are stable demo data, not live supplier pricing.",
    },
  ],
  disclaimer: "Demo estimate only; not a permit, engineering document, or supplier quote.",
};
