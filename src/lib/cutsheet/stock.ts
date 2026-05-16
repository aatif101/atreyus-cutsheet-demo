import type { StockBoard } from "./types";

const feetToInches = (feet: number) => feet * 12;

export const STOCK_CATALOG: StockBoard[] = [
  { id: "pt-2x4-8", material: "pressure-treated", nominalSize: "2x4", lengthInches: feetToInches(8), unitCost: 4.98, label: "PT 2x4x8'" },
  { id: "pt-2x4-10", material: "pressure-treated", nominalSize: "2x4", lengthInches: feetToInches(10), unitCost: 6.72, label: "PT 2x4x10'" },
  { id: "pt-2x4-12", material: "pressure-treated", nominalSize: "2x4", lengthInches: feetToInches(12), unitCost: 8.64, label: "PT 2x4x12'" },
  { id: "pt-2x4-16", material: "pressure-treated", nominalSize: "2x4", lengthInches: feetToInches(16), unitCost: 12.96, label: "PT 2x4x16'" },
  { id: "pt-2x6-8", material: "pressure-treated", nominalSize: "2x6", lengthInches: feetToInches(8), unitCost: 7.84, label: "PT 2x6x8'" },
  { id: "pt-2x6-10", material: "pressure-treated", nominalSize: "2x6", lengthInches: feetToInches(10), unitCost: 10.42, label: "PT 2x6x10'" },
  { id: "pt-2x6-12", material: "pressure-treated", nominalSize: "2x6", lengthInches: feetToInches(12), unitCost: 13.28, label: "PT 2x6x12'" },
  { id: "pt-2x6-16", material: "pressure-treated", nominalSize: "2x6", lengthInches: feetToInches(16), unitCost: 18.96, label: "PT 2x6x16'" },
  { id: "pt-2x8-8", material: "pressure-treated", nominalSize: "2x8", lengthInches: feetToInches(8), unitCost: 11.48, label: "PT 2x8x8'" },
  { id: "pt-2x8-10", material: "pressure-treated", nominalSize: "2x8", lengthInches: feetToInches(10), unitCost: 15.22, label: "PT 2x8x10'" },
  { id: "pt-2x8-12", material: "pressure-treated", nominalSize: "2x8", lengthInches: feetToInches(12), unitCost: 19.44, label: "PT 2x8x12'" },
  { id: "pt-2x8-16", material: "pressure-treated", nominalSize: "2x8", lengthInches: feetToInches(16), unitCost: 27.88, label: "PT 2x8x16'" },
  { id: "pt-4x4-8", material: "pressure-treated", nominalSize: "4x4", lengthInches: feetToInches(8), unitCost: 12.74, label: "PT 4x4x8'" },
  { id: "pt-4x4-10", material: "pressure-treated", nominalSize: "4x4", lengthInches: feetToInches(10), unitCost: 17.36, label: "PT 4x4x10'" },
  { id: "pt-4x4-12", material: "pressure-treated", nominalSize: "4x4", lengthInches: feetToInches(12), unitCost: 22.18, label: "PT 4x4x12'" },
];

export function findStockBoard(stockId: string): StockBoard | undefined {
  return STOCK_CATALOG.find((stock) => stock.id === stockId);
}

export function stockForSize(nominalSize: StockBoard["nominalSize"]): StockBoard[] {
  return STOCK_CATALOG.filter((stock) => stock.nominalSize === nominalSize);
}
