import { utils } from 'ethers';

const getPositionKey = (address: string, lowerTick: number, upperTick: number): string =>
  utils.keccak256(utils.solidityPack(['address', 'int24', 'int24'], [address, lowerTick, upperTick]));

export default getPositionKey;
