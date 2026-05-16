import { STOCK_CATALOG } from "./stock";
import type {
  BoardLayout,
  OptimizationResult,
  PlacedCut,
  RequiredCut,
  StockBoard,
  StockPurchaseLine,
  UnplacedCut,
  UnplacedCutReason,
} from "./types";

interface CutInstance {
  cut: RequiredCut;
  instance: number;
}

const byStockPreference = (a: StockBoard, b: StockBoard) =>
  a.lengthInches - b.lengthInches || a.unitCost - b.unitCost || a.id.localeCompare(b.id);

const compatibleStock = (cut: RequiredCut, stockCatalog: StockBoard[]) =>
  stockCatalog
    .filter((stock) => stock.material === cut.material && stock.nominalSize === cut.nominalSize)
    .toSorted(byStockPreference);

const makeUnplacedCut = (cut: RequiredCut, reason: UnplacedCutReason, message: string): UnplacedCut => ({
  requiredCutId: cut.id,
  label: cut.label,
  material: cut.material,
  nominalSize: cut.nominalSize,
  lengthInches: cut.lengthInches,
  quantity: cut.quantity,
  reason,
  message,
});

const isPositiveInteger = (value: number) => Number.isInteger(value) && value > 0;
const isPositiveFiniteLength = (value: number) => Number.isFinite(value) && value > 0;

const layoutLeftover = (layout: BoardLayout) => layout.stock.lengthInches - layout.usedInches;

const toPlacedCut = ({ cut, instance }: CutInstance): PlacedCut => ({
  requiredCutId: cut.id,
  label: cut.label,
  lengthInches: cut.lengthInches,
  source: cut.source,
  instance,
});

/**
 * Runs a deterministic First Fit Decreasing layout over required cuts.
 *
 * The optimizer is intentionally pure and browser-safe: all malformed or unsupported
 * inputs that can be diagnosed are returned through `unplacedCuts` rather than thrown.
 */
export function optimizeCuts(cuts: RequiredCut[], stockCatalog: StockBoard[] = STOCK_CATALOG): OptimizationResult {
  const sortedStockCatalog = [...stockCatalog].sort(
    (a, b) =>
      a.material.localeCompare(b.material) ||
      a.nominalSize.localeCompare(b.nominalSize) ||
      byStockPreference(a, b),
  );

  const unplacedCuts: UnplacedCut[] = [];
  const placeableInstances: CutInstance[] = [];
  let requiredCuts = 0;

  for (const cut of cuts) {
    if (!isPositiveInteger(cut.quantity)) {
      unplacedCuts.push(
        makeUnplacedCut(
          cut,
          "invalid-quantity",
          `${cut.label} has invalid quantity ${cut.quantity}; quantity must be a positive whole number.`,
        ),
      );
      continue;
    }

    requiredCuts += cut.quantity;

    if (!isPositiveFiniteLength(cut.lengthInches)) {
      unplacedCuts.push(
        makeUnplacedCut(
          cut,
          "invalid-length",
          `${cut.label} has invalid length ${cut.lengthInches}; length must be greater than zero inches.`,
        ),
      );
      continue;
    }

    const compatible = compatibleStock(cut, sortedStockCatalog);

    if (compatible.length === 0) {
      unplacedCuts.push(
        makeUnplacedCut(
          cut,
          "unsupported-stock",
          `${cut.label} uses ${cut.material} ${cut.nominalSize}, which is not available in the stock catalog.`,
        ),
      );
      continue;
    }

    const longestCompatibleStock = compatible[compatible.length - 1];
    if (cut.lengthInches > longestCompatibleStock.lengthInches) {
      unplacedCuts.push(
        makeUnplacedCut(
          cut,
          "oversize-cut",
          `${cut.label} is ${cut.lengthInches} in, longer than the longest compatible stock board (${longestCompatibleStock.lengthInches} in).`,
        ),
      );
      continue;
    }

    for (let instance = 1; instance <= cut.quantity; instance += 1) {
      placeableInstances.push({ cut, instance });
    }
  }

  placeableInstances.sort(
    (a, b) =>
      a.cut.material.localeCompare(b.cut.material) ||
      a.cut.nominalSize.localeCompare(b.cut.nominalSize) ||
      b.cut.lengthInches - a.cut.lengthInches ||
      a.cut.id.localeCompare(b.cut.id) ||
      a.instance - b.instance,
  );

  const layouts: BoardLayout[] = [];
  const nextLayoutNumberByStockId = new Map<string, number>();

  for (const cutInstance of placeableInstances) {
    const { cut } = cutInstance;
    const existingLayout = layouts.find(
      (layout) =>
        layout.stock.material === cut.material &&
        layout.stock.nominalSize === cut.nominalSize &&
        layoutLeftover(layout) >= cut.lengthInches,
    );

    const layout = existingLayout ?? createLayoutForCut(cut, sortedStockCatalog, layouts, nextLayoutNumberByStockId);
    const placedCut = toPlacedCut(cutInstance);

    layout.placedCuts.push(placedCut);
    layout.usedInches += placedCut.lengthInches;
    layout.wasteInches = layout.stock.lengthInches - layout.usedInches;
  }

  const purchaseList = buildPurchaseList(layouts, sortedStockCatalog);
  const materialCost = layouts.reduce((sum, layout) => sum + layout.cost, 0);
  const purchasedInches = layouts.reduce((sum, layout) => sum + layout.stock.lengthInches, 0);
  const usedInches = layouts.reduce((sum, layout) => sum + layout.usedInches, 0);
  const wasteInches = layouts.reduce((sum, layout) => sum + layout.wasteInches, 0);

  return {
    layouts,
    purchaseList,
    unplacedCuts,
    totals: {
      boards: layouts.length,
      placedCuts: placeableInstances.length,
      requiredCuts,
      materialCost,
      purchasedInches,
      usedInches,
      wasteInches,
      wastePercent: purchasedInches === 0 ? 0 : wasteInches / purchasedInches,
    },
  };
}

function createLayoutForCut(
  cut: RequiredCut,
  stockCatalog: StockBoard[],
  layouts: BoardLayout[],
  nextLayoutNumberByStockId: Map<string, number>,
): BoardLayout {
  const stock = compatibleStock(cut, stockCatalog).find((candidate) => candidate.lengthInches >= cut.lengthInches);

  if (!stock) {
    throw new Error(`Invariant violation: no compatible stock found for validated cut ${cut.id}.`);
  }

  const nextLayoutNumber = (nextLayoutNumberByStockId.get(stock.id) ?? 0) + 1;
  nextLayoutNumberByStockId.set(stock.id, nextLayoutNumber);

  const layout: BoardLayout = {
    id: `${stock.id}-board-${nextLayoutNumber}`,
    stock,
    placedCuts: [],
    usedInches: 0,
    wasteInches: stock.lengthInches,
    cost: stock.unitCost,
  };

  layouts.push(layout);
  return layout;
}

function buildPurchaseList(layouts: BoardLayout[], stockCatalog: StockBoard[]): StockPurchaseLine[] {
  const quantityByStockId = layouts.reduce((lines, layout) => {
    lines.set(layout.stock.id, (lines.get(layout.stock.id) ?? 0) + 1);
    return lines;
  }, new Map<string, number>());

  return stockCatalog
    .filter((stock) => quantityByStockId.has(stock.id))
    .map((stock) => {
      const quantity = quantityByStockId.get(stock.id) ?? 0;
      return {
        stockId: stock.id,
        label: stock.label,
        material: stock.material,
        nominalSize: stock.nominalSize,
        lengthInches: stock.lengthInches,
        quantity,
        unitCost: stock.unitCost,
        totalCost: stock.unitCost * quantity,
      };
    });
}
