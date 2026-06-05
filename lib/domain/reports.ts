export function percent(value: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((value / total) * 10000) / 100;
}

export function groupSum<T extends Record<string, unknown>>(rows: T[], key: keyof T, amount: keyof T) {
  const result = new Map<string, number>();

  for (const row of rows) {
    const group = String(row[key] ?? "sin_valor");
    const current = result.get(group) ?? 0;
    result.set(group, current + Number(row[amount] ?? 0));
  }

  return Array.from(result.entries()).map(([name, total]) => ({ name, total }));
}
