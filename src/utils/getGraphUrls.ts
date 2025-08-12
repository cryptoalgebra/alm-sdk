import { graphUrls } from '../graphql/constants';
import { SupportedChainId } from '../types';

export default function getGraphUrls(
  chainId: SupportedChainId,
  isGraphRequired?: boolean,
): { url: string; publishedUrl: string | undefined } {
  const { url, publishedUrl } = graphUrls[chainId];
  // const publishedUrl =
  //   process.env.SUBGRAPH_API_KEY &&
  //   graphUrls[chainId].publishedUrl.replace('[api-key]', process.env.SUBGRAPH_API_KEY);
  if (!url) throw new Error(`Unsupported on chain ${chainId}`);
  if (url === 'none' && isGraphRequired) throw new Error(`Function not available on chain ${chainId}`);
  return { url, publishedUrl };
}
