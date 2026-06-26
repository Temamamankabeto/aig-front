import type { BaseUnit } from "@/types/inventory-management";

export function formatNumber(value: unknown, maximumFractionDigits = 3) {
  const number = Number(value ?? 0);
  if (!Number.isFinite(number)) return "0";

  return number.toLocaleString(undefined, {
    maximumFractionDigits,
  });
}

export function formatMoney(value: unknown) {
  const number = Number(value ?? 0);
  if (!Number.isFinite(number)) return "0.00";

  return number.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatBaseQuantity(value: unknown, unit: BaseUnit | string | null | undefined = "pcs") {
  const safeUnit = unit || "pcs";
  return `${formatNumber(value)} ${safeUnit}`;
}
