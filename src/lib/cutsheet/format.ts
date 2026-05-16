const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const percentFormatter = new Intl.NumberFormat("en-US", {
  style: "percent",
  minimumFractionDigits: 0,
  maximumFractionDigits: 1,
});

export function formatCurrency(amount: number): string {
  return currencyFormatter.format(amount);
}

export function formatPercent(value: number): string {
  return percentFormatter.format(value);
}

export function formatFeetInches(totalInches: number): string {
  const sign = totalInches < 0 ? "-" : "";
  const absoluteInches = Math.abs(totalInches);
  const wholeInches = Math.round(absoluteInches);
  const feet = Math.floor(wholeInches / 12);
  const inches = wholeInches % 12;

  if (feet === 0) {
    return `${sign}${inches}"`;
  }

  if (inches === 0) {
    return `${sign}${feet}'`;
  }

  return `${sign}${feet}' ${inches}"`;
}
