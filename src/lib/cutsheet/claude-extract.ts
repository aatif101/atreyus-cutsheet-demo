import "server-only";

import Anthropic from "@anthropic-ai/sdk";

import { ExtractionValidationError, validateExtractionResult } from "./extraction-schema";
import { ExtractionSetupError, ExtractionUpstreamError } from "./extract-handler";
import type { ExtractionResult } from "./types";

const CLAUDE_MODEL = "claude-haiku-4-5";

export async function extractCutsWithClaude(scopeText: string): Promise<ExtractionResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new ExtractionSetupError();
  }

  const client = new Anthropic({ apiKey });
  let responseText: string;

  try {
    const message = await client.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 3000,
      temperature: 0,
      system: buildSystemPrompt(),
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Extract a lumber cut list from this construction scope. Return JSON only.\n\nScope:\n${scopeText}`,
            },
          ],
        },
      ],
    });

    responseText = collectTextContent(message.content);
  } catch (error) {
    if (error instanceof ExtractionSetupError) {
      throw error;
    }

    throw new ExtractionUpstreamError();
  }

  try {
    return validateExtractionResult(JSON.parse(responseText), scopeText);
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new ExtractionValidationError(["provider response must be valid JSON"]);
    }

    throw error;
  }
}

function buildSystemPrompt(): string {
  return [
    "You convert residential deck/construction scope text into a strict lumber cut-list JSON object.",
    "Return ONLY valid JSON. Do not wrap it in markdown, commentary, or code fences.",
    "The JSON object shape is exactly:",
    "{\"cuts\":[{\"id\":string,\"label\":string,\"material\":\"pressure-treated\",\"nominalSize\":\"2x4\"|\"2x6\"|\"2x8\"|\"4x4\",\"lengthInches\":number,\"quantity\":positive integer,\"source\":\"beam\"|\"joist\"|\"rim\"|\"post\"|\"blocking\"|\"stair\"|\"misc\",\"notes\"?:string}],\"assumptions\":[{\"id\":string,\"label\":string,\"detail\":string}],\"warnings\":[string]}",
    "Use inches for every lengthInches value. Never emit feet-based length fields.",
    "Use only the listed enum values. If a material or member is ambiguous, choose the closest listed source and add an assumption or warning.",
    "Include assumptions for inferred spacing, framing choices, or dimensions. Include warnings for items requiring field verification.",
    "Do not include optimization layouts, material purchasing summaries, costs, prose explanations, or extra top-level keys.",
  ].join("\n");
}

function collectTextContent(content: Anthropic.Messages.Message["content"]): string {
  const text = content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("\n")
    .trim();

  const fenced = text.match(/^```(?:json)?\s*\n?([\s\S]*?)\n?```$/);
  return fenced ? fenced[1].trim() : text;
}
