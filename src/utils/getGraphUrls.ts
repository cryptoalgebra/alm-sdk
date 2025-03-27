import { graphUrls } from '../graphql/constants';
import { SupportedChainId, SupportedDex } from '../types';

export default function getGraphUrls(
  chainId: SupportedChainId,
  dex: SupportedDex,
  isGraphRequired?: boolean,
): { url: string; publishedUrl: string | undefined; version: number } {
  const url = graphUrls[chainId]![dex]?.url;
  const publishedUrl =
    process.env.SUBGRAPH_API_KEY &&
    graphUrls[chainId]![dex]?.publishedUrl.replace('[api-key]', process.env.SUBGRAPH_API_KEY);
  const version = graphUrls[chainId]![dex]?.version ?? 1;
  if (!url) throw new Error(`Unsupported DEX ${dex} on chain ${chainId}`);
  if (url === 'none' && isGraphRequired) throw new Error(`Function not available for DEX ${dex} on chain ${chainId}`);
  return { url, publishedUrl, version };
}
