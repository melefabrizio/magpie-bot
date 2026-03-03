import type { UrlMetadata } from "./metadata.js";

export interface ClassifyResult {
  interesting: boolean;
  reason: string;
  tags: string[];
}

// TODO: implement — send metadata to Claude Haiku 4.5 via AWS Bedrock using Vercel AI SDK
export async function classify(_metadata: UrlMetadata): Promise<ClassifyResult> {
  return { interesting: true, reason: "stub — always interesting", tags: [] };
}
