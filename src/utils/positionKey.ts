import { keccak256, solidityPacked } from 'ethers';

const getPositionKey = (address: string, lowerTick: number, upperTick: number): string =>
  keccak256(solidityPacked(['address', 'int24', 'int24'], [address, lowerTick, upperTick]));

export default getPositionKey;
