import { generateObject } from "ai";
import { createAmazonBedrock } from "@ai-sdk/amazon-bedrock";
import { fromNodeProviderChain } from "@aws-sdk/credential-providers";
import { z } from "zod";
import { config } from "../config.js";
import type { UrlMetadata } from "./metadata.js";
import { log } from "../logger.js";

export interface ClassifyResult {
  interesting: boolean;
  reason: string;
}

const bedrock = createAmazonBedrock({
  region: config.awsRegion,
  credentialProvider: fromNodeProviderChain(),
});

const BEDROCK_MODEL = "eu.anthropic.claude-haiku-4-5-20251001-v1:0";

const schema = z.object({
  interesting: z.boolean(),
  reason: z.string(),
});

export async function classify(metadata: UrlMetadata): Promise<ClassifyResult> {
  try {
    const title = (metadata.title ?? "").slice(0, 200);
    const description = (metadata.description ?? "").slice(0, 500);

    const { object } = await generateObject({
      model: bedrock(BEDROCK_MODEL),
      schema,
      temperature: 0,
      maxTokens: 300,
      system: config.classifySystemPrompt,
      prompt: `Should this URL be bookmarked?

title: ${title || "(none)"}
description: ${description || "(none)"}

Respond with interesting: true only if it clearly fits the SAVE criteria above. When in doubt, discard. Write a short reason (one sentence).`,
    });
    return object;
  } catch (err) {
    log("warn", "classification failed", {
      error: err instanceof Error ? err.message : String(err),
    });
    return { interesting: false, reason: "classification failed" };
  }
}
