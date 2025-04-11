export default function truncateToDecimals(num: number, decimals: number): string {
  const parts = num.toString().split('.');
  if (parts.length === 1 || decimals === 0) return parts[0];
  return `${parts[0]}.${parts[1].slice(0, decimals)}`;
}
