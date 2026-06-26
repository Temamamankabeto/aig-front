import type { BaseUnit } from "@/types/inventory-management";

export function normalizeBaseUnit(unit?: string | null): BaseUnit {
  if (unit === "ml" || unit === "pc" || unit === "g") return unit;
  return "pc";
}

export function formatBaseQuantity(value?: number | string | null, unit?: string | null) {
  const amount = Number(value ?? 0);
  const baseUnit = normalizeBaseUnit(unit);

  if (baseUnit === "g" && Math.abs(amount) >= 1000) {
    return `${formatNumber(amount / 1000)} kg`;
  }
  if (baseUnit === "ml" && Math.abs(amount) >= 1000) {
    return `${formatNumber(amount / 1000)} L`;
  }
  return `${formatNumber(amount)} ${baseUnit}`;
}

export function formatMoney(value?: number | string | null) {
  return Number(value ?? 0).toLocaleString(undefined, { maximumFractionDigits: 2 });
}

export function formatNumber(value?: number | string | null) {
  return Number(value ?? 0).toLocaleString(undefined, { maximumFractionDigits: 3 });
}

export function toBaseQuantity(value: number | string, baseUnit: BaseUnit) {
  // The UI accepts already-base quantities only: g, ml, pc.
  // This helper exists for consistency and intentionally does no runtime unit conversion.
  const n = Number(value ?? 0);
  return baseUnit === "pc" ? Math.round(n) : n;
}
