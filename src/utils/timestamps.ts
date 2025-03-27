export function daysToMilliseconds(days: number): number {
  return days * 24 * 60 * 60 * 1000;
}

export function millisecondsToDays(ms: number): number {
  return ms / (24 * 60 * 60 * 1000);
}
