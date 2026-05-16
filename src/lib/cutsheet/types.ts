export type LumberMaterial = "pressure-treated";

export type NominalSize = "2x4" | "2x6" | "2x8" | "4x4";

export type CutSource = "beam" | "joist" | "rim" | "post" | "blocking" | "stair" | "misc";

export interface RequiredCut {
  id: string;
  label: string;
  material: LumberMaterial;
  nominalSize: NominalSize;
  lengthInches: number;
  quantity: number;
  source: CutSource;
  notes?: string;
}

export interface ExtractionAssumption {
  id: string;
  label: string;
  detail: string;
}

export interface ExtractionResult {
  scopeText: string;
  cuts: RequiredCut[];
  assumptions: ExtractionAssumption[];
  warnings: string[];
}

export interface StockBoard {
  id: string;
  material: LumberMaterial;
  nominalSize: NominalSize;
  lengthInches: number;
  unitCost: number;
  label: string;
}

export interface PlacedCut {
  requiredCutId: string;
  label: string;
  lengthInches: number;
  source: CutSource;
  instance: number;
}

export interface BoardLayout {
  id: string;
  stock: StockBoard;
  placedCuts: PlacedCut[];
  usedInches: number;
  wasteInches: number;
  cost: number;
}

export type UnplacedCutReason = "unsupported-stock" | "oversize-cut" | "invalid-quantity" | "invalid-length";

export interface UnplacedCut {
  requiredCutId: string;
  label: string;
  material: LumberMaterial;
  nominalSize: NominalSize;
  lengthInches: number;
  quantity: number;
  reason: UnplacedCutReason;
  message: string;
}

export interface StockPurchaseLine {
  stockId: string;
  label: string;
  material: LumberMaterial;
  nominalSize: NominalSize;
  lengthInches: number;
  quantity: number;
  unitCost: number;
  totalCost: number;
}

export interface OptimizationTotals {
  boards: number;
  placedCuts: number;
  requiredCuts: number;
  materialCost: number;
  purchasedInches: number;
  usedInches: number;
  wasteInches: number;
  wastePercent: number;
}

export interface OptimizationResult {
  layouts: BoardLayout[];
  purchaseList: StockPurchaseLine[];
  unplacedCuts: UnplacedCut[];
  totals: OptimizationTotals;
}

export interface SummaryCostLine {
  id: string;
  label: string;
  quantity: number;
  unit: string;
  unitCost: number;
  totalCost: number;
}

export interface DoubleCheckItem {
  id: string;
  severity: "info" | "warning" | "review";
  title: string;
  detail: string;
}

export interface EstimatorSummary {
  title: string;
  overview: string;
  materialLines: SummaryCostLine[];
  laborNotes: string[];
  doubleChecks: DoubleCheckItem[];
  disclaimer: string;
}
