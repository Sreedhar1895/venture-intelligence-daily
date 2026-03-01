import Anthropic from "@anthropic-ai/sdk";
import type { SectorTag } from "@/types/database";

export interface ResearchClassification {
  sector_tags: SectorTag[];
  summary: string;
  relevance_score: number;
}

const SYSTEM_PROMPT = `You classify academic research papers for a venture capital firm interested in AI-native, robotics, and frontier tech.

Given a paper title and abstract, output JSON with:
- sector_tags: array from: AI-native, Fintech, Robotics, Vertical SaaS, Other (pick the most relevant 1-2)
- summary: 2-3 sentence plain-language summary of what the paper contributes and why it matters for venture/industry
- relevance_score: integer 1-10 (10 = highly relevant: breakthrough in AI/robotics, clear commercial implications, top venue)

Return valid JSON only with keys: sector_tags, summary, relevance_score.`;

export async function classifyResearch(
  title: string,
  abstract: string
): Promise<ResearchClassification> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set");

  const client = new Anthropic({ apiKey });
  const text = `Title: ${title}\n\nAbstract: ${abstract.slice(0, 4000)}`;

  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 512,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: text }],
  });

  const block = response.content.find((b) => b.type === "text");
  if (!block || block.type !== "text") throw new Error("No text in response");

  let raw = block.text.trim().replace(/^```json\s*/i, "").replace(/\s*```$/i, "").trim();
  const firstBrace = raw.indexOf("{");
  if (firstBrace >= 0) {
    let depth = 0;
    let end = -1;
    for (let i = firstBrace; i < raw.length; i++) {
      if (raw[i] === "{") depth++;
      else if (raw[i] === "}") {
        depth--;
        if (depth === 0) {
          end = i;
          break;
        }
      }
    }
    if (end >= 0) raw = raw.slice(firstBrace, end + 1);
  }
  const parsed = JSON.parse(raw) as {
    sector_tags: string[];
    summary: string;
    relevance_score: number;
  };

  return {
    sector_tags: (parsed.sector_tags as SectorTag[]) || [],
    summary: parsed.summary || "",
    relevance_score: Math.min(10, Math.max(1, Math.round(parsed.relevance_score))),
  };
}
