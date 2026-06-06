export const parseMoney = (value: unknown) => (
  value ? parseFloat(String(value).replace(",", ".")) : null
);

export const parseStock = (value: unknown) => parseInt(String(value), 10) || 0;

export const parseQuantity = (value: unknown) => {
  const parsed = value ? parseFloat(String(value).replace(",", ".")) : null;
  return Number.isFinite(parsed) && parsed !== null ? Number(parsed.toFixed(3)) : null;
};
