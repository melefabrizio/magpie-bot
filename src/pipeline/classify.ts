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
    const { object } = await generateObject({
      model: bedrock(BEDROCK_MODEL),
      schema,
      temperature: 0,
      maxTokens: 300,
      system: `You are the final gatekeeper for a bookmark bot used by a small, senior software engineering team.

Your job: decide whether a URL deserves a permanent bookmark. You are the last line of defence — if something slips past you it gets saved forever, so be selective.

SAVE if the URL is substantively about:
- Engineering craft: architecture, distributed systems, databases, performance, reliability, security
- Any programming language, framework, or technology stack — not limited to what the team currently uses
- Open source tools, libraries, or projects worth knowing about
- SaaS or developer tools that solve a real problem and would make a developer say "oh, neat"
- Thoughtful industry analysis, post-mortems, or research papers
- Team culture, engineering management, or agile practices with real insight
- Genuinely funny or clever programmer/tech humour

DISCARD if the URL is:
- A login page, redirect loop, or fetch-failed stub with no real content
- Pure marketing fluff with no concrete product or technical substance
- Social media profiles, search results, or aggregator homepages
- News articles about funding rounds, acquisitions, or corporate drama with no technical content
- Anything unrelated to software, technology, or building things`,
      prompt: `Should this URL be bookmarked?

${JSON.stringify(metadata, null, 2)}

Respond with interesting: true only if it clearly fits the SAVE criteria above. When in doubt, discard. Write a short reason (one sentence).`,
    });
    return object;
  } catch (err) {
    log("warn", "classification failed", { error: err instanceof Error ? err.message : String(err) });
    return { interesting: false, reason: "classification failed" };
  }
}
