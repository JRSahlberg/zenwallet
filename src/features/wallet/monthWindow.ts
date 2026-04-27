export type MonthWindow = {
  start: string;
  endExclusive: string;
};

export function currentMonthWindow(now: Date = new Date()): MonthWindow {
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const endExclusive = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return {
    start: start.toISOString(),
    endExclusive: endExclusive.toISOString(),
  };
}
