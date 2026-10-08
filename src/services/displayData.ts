// Illustrative UI estimates only; fare values are not stored in the project database.
export const fareBaseByRoute: Record<string, { economy: number; business: number }> = {
  '1-2': { economy: 4850, business: 14500 },
  '3-4': { economy: 3200, business: 9800 },
  '5-1': { economy: 4600, business: 12800 },
  '2-6': { economy: 5100, business: 15200 },
  '6-1': { economy: 4400, business: 13900 },
  '1-4': { economy: 3900, business: 11500 },
  '4-2': { economy: 5600, business: 16800 },
  '3-2': { economy: 4300, business: 12900 },
  '1-6': { economy: 4200, business: 12500 },
  default: { economy: 4500, business: 13500 }
};
