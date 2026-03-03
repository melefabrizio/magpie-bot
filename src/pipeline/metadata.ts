import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { load } from "cheerio";
import { config } from "../config.js";

export interface UrlMetadata {
  url: string;
  resolvedUrl?: string;
  domain: string;
  title?: string;
  description?: string;
  ogType?: string;
  keywords?: string;
  fetchFailed: boolean;
}

function isPrivateIp(ip: string): boolean {
  if (isIP(ip) === 4) {
    const [a, b] = ip.split(".").map(Number);
    return (
      a === 127 ||
      a === 10 ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 169 && b === 254) ||
      a === 0 ||
      a >= 224
    );
  }
  if (isIP(ip) === 6) {
    // Unwrap IPv4-mapped addresses (::ffff:192.168.1.1)
    const unwrapped = ip.toLowerCase().replace(/^::ffff:/i, "");
    if (isIP(unwrapped) === 4) return isPrivateIp(unwrapped);
    return (
      unwrapped === "::1" ||
      unwrapped === "::" ||
      unwrapped.startsWith("fe80") ||
      unwrapped.startsWith("fc") ||
      unwrapped.startsWith("fd")
    );
  }
  return true;
}

async function assertNotSsrf(url: string): Promise<void> {
  const { hostname } = new URL(url);
  if (isIP(hostname)) {
    if (isPrivateIp(hostname))
      throw new Error(`SSRF blocked: private address ${hostname}`);
    return;
  }
  const records = await lookup(hostname, { all: true });
  for (const { address } of records) {
    if (isPrivateIp(address))
      throw new Error(
        `SSRF blocked: ${hostname} resolves to private address ${address}`,
      );
  }
}

export async function fetchMetadata(url: string): Promise<UrlMetadata> {
  const domain = new URL(url).hostname;
  const base: UrlMetadata = { url, domain, fetchFailed: true };

  try {
    await assertNotSsrf(url);

    const res = await fetch(url, {
      signal: AbortSignal.timeout(config.fetchTimeoutMs),
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
      },
    });
    if (!res.ok) return base;

    // Guard against SSRF via redirect chains
    if (res.url !== url) await assertNotSsrf(res.url);

    const resolvedUrl = res.url !== url ? res.url : undefined;
    const resolvedDomain = new URL(res.url).hostname;
    const $ = load(await res.text());
    return {
      url,
      resolvedUrl,
      domain: resolvedDomain,
      fetchFailed: false,
      title:
        $("title").first().text().trim() ||
        $('meta[property="og:title"]').attr("content")?.trim(),
      description:
        $('meta[name="description"]').attr("content")?.trim() ||
        $('meta[property="og:description"]').attr("content")?.trim(),
      ogType: $('meta[property="og:type"]').attr("content")?.trim(),
      keywords: $('meta[name="keywords"]').attr("content")?.trim(),
    };
  } catch {
    return base;
  }
}
