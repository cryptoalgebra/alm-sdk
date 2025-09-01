export default function parseBigInt(_value: number | string, decimals: number): bigint {
  let valueStr = _value.toString();

  // Handle scientific notation by converting to a full decimal string
  if (valueStr.includes('e') || valueStr.includes('E')) {
    valueStr = Number(valueStr).toFixed(decimals);
  }
  const [wholePart, fractionalPart = ''] = valueStr.split('.');
  if (fractionalPart.length > decimals) throw new Error(`Number ${valueStr} is too long`);

  const combined = wholePart + fractionalPart.padEnd(decimals, '0');

  const bigIntValue = BigInt(combined);

  return bigIntValue;
}
