export interface UrlMetadata {
  url: string;
  domain: string;
  title?: string;
  description?: string;
  ogType?: string;
  keywords?: string;
  fetchFailed: boolean;
}

// TODO: implement — fetch URL, parse HTML with cheerio, extract title/description/og tags
export async function fetchMetadata(url: string): Promise<UrlMetadata> {
  const domain = new URL(url).hostname;
  return { url, domain, fetchFailed: true };
}
