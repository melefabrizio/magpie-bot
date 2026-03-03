import { log } from "./logger.js";

export interface BookmarkResult {
  ok: boolean;
  error?: string;
}

// TODO: implement — POST to {config.karakeepApiUrl}/api/v1/bookmarks with Bearer auth
export async function submitBookmark(url: string, tags: string[]): Promise<BookmarkResult> {
  log("info", "would submit bookmark", { url, tags });
  return { ok: true };
}
