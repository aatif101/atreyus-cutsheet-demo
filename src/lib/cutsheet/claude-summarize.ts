import "server-only";

import Anthropic from "@anthropic-ai/sdk";

import { SummaryValidationError, validateEstimatorSummary } from "./summary-schema";
import { SummarySetupError, SummaryUpstreamError, type SummaryInput } from "./summarize-handler";
import type { EstimatorSummary } from "./types";

const CLAUDE_MODEL = "claude-haiku-4-5";

export async function summarizeCutsWithClaude(input: SummaryInput): Promise<EstimatorSummary> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new SummarySetupError();
  }

  const client = new Anthropic({ apiKey });
  let responseText: string;

  try {
    const message = await client.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 2400,
      temperature: 0,
      system: buildSystemPrompt(),
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: [
                "Create estimator-facing material summary and double-check guidance from this validated CutSheet extraction and deterministic browser optimization result.",
                "Return JSON only.",
                "",
                "Input JSON:",
                JSON.stringify(input),
              ].join("\n"),
            },
          ],
        },
      ],
    });

    responseText = collectTextContent(message.content);
  } catch (error) {
    if (error instanceof SummarySetupError) {
      throw error;
    }

    throw new SummaryUpstreamError();
  }

  try {
    return validateEstimatorSummary(JSON.parse(responseText));
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new SummaryValidationError(["provider response must be valid JSON"]);
    }

    throw error;
  }
}

function buildSystemPrompt(): string {
  return [
    "You convert validated lumber extraction plus deterministic optimization data into a strict estimator summary JSON object.",
    "Return ONLY valid JSON. Do not wrap it in markdown, commentary, or code fences.",
    "The JSON object shape is exactly:",
    "{\"title\":string,\"overview\":string,\"materialLines\":[{\"id\":string,\"label\":string,\"quantity\":positive number,\"unit\":string,\"unitCost\":positive number,\"totalCost\":positive number}],\"laborNotes\":[string],\"doubleChecks\":[{\"id\":string,\"severity\":\"info\"|\"warning\"|\"review\",\"title\":string,\"detail\":string}],\"disclaimer\":string}",
    "Base materialLines on optimization.purchaseList and totals. Do not invent unsupported stock beyond the provided input.",
    "Use doubleChecks for assumptions, warnings, unplaced cuts, high waste, field verification, and any scope ambiguity.",
    "Mention that optimization is deterministic planning guidance, not an engineered design, code approval, or final bid.",
    "Do not include raw provider diagnostics, secrets, stack traces, or extra top-level keys.",
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
