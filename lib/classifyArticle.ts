import Anthropic from "@anthropic-ai/sdk";
import type { ClaudeClassification, SectorTag, EventType, StageFilter } from "@/types/database";

const SYSTEM_PROMPT = `You are building for an end user who is an investment research analyst for a venture capital firm focused on early stage.

Tasks:
1. Determine sector tags (array): AI-native, Vertical SaaS, Fintech, Robotics, Other
2. Determine event type (single): Fundraise, Major Hiring, Product Launch, Accelerator, Research Breakthrough, University Lab Initiative, Policy / Regulation, Acquisition, Event, General News
3. Determine stage (single): early_stage (accelerators, pre-seed, seed, Series A), growth_late_stage (Series B+, growth equity, late VC), or public_pe (public company, PE, buyout, secondary)
4. Provide: 3 sentence summary, strategic relevance note, relevance score (1-10 integer)

Scoring (we add more value to early stage): Base 1-5. +2 for early_stage (pre-seed/seed/Series A/accelerator). +1 for AI-native/Fintech/Robotics. +1 for accelerator backed. +1 for top-tier university research. +2 if about tracked startup. Cap at 10.

Return valid JSON only with keys: sector_tags, event_type, stage, summary, strategic_note, relevance_score.`;

export async function classifyArticle(
  title: string,
  content: string,
  relatedTrackedStartup?: string | null
): Promise<ClaudeClassification> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set");

  const client = new Anthropic({ apiKey });
  const userContent = relatedTrackedStartup
    ? `Title: ${title}\n\nContent: ${content.slice(0, 12000)}\n\nTracked startup: ${relatedTrackedStartup}`
    : `Title: ${title}\n\nContent: ${content.slice(0, 12000)}`;

  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: userContent }],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") throw new Error("No text in response");

  const raw = textBlock.text.trim().replace(/^```json\s*/i, "").replace(/\s*```$/i, "");
  const parsed = JSON.parse(raw) as {
    sector_tags: string[];
    event_type: string;
    stage: string;
    summary: string;
    strategic_note: string;
    relevance_score: number;
  };

  const stage = ["early_stage", "growth_late_stage", "public_pe"].includes(parsed.stage)
    ? (parsed.stage as StageFilter)
    : "growth_late_stage";

  let score = Math.min(10, Math.max(1, Math.round(parsed.relevance_score)));
  if (stage === "early_stage") score = Math.min(10, score + 2);

  return {
    sector_tags: parsed.sector_tags as SectorTag[],
    event_type: parsed.event_type as EventType,
    stage,
    summary: parsed.summary,
    strategic_note: parsed.strategic_note,
    relevance_score: score,
  };
}
