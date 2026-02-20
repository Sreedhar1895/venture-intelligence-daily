import Anthropic from "@anthropic-ai/sdk";

export interface EventValidationResult {
  relevant: boolean;
  sector_tags?: string[];
  event_type?: string;
}

const RELEVANT_DOMAINS = ["AI", "ML", "robotics", "venture", "startup", "investor", "demo day", "accelerator", "funding"];

/**
 * Validates that an event is relevant for our VC intelligence app.
 * Relevant = AI/ML, robotics, venture capital, startups, demo days, or founder/investor meetups.
 * Use this when ingesting from scraped/API sources (Lu.ma, Eventbrite, etc.) - curated events skip validation.
 */
export async function validateEventRelevance(
  title: string,
  description?: string | null
): Promise<EventValidationResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    // Fallback: keyword check when no API key (e.g. CI)
    return keywordRelevance(title, description);
  }

  const client = new Anthropic({ apiKey });
  const text = description
    ? `Title: ${title}\n\nDescription: ${description.slice(0, 2000)}`
    : `Title: ${title}`;

  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 256,
    system: `You validate events for a venture capital firm focused on AI-native, robotics, and frontier tech.
An event is RELEVANT if it's about: AI/ML, robotics, venture capital, startups, demo days, accelerators, founder/investor meetups, or tech conferences in those areas.
An event is NOT relevant if it's general culture (SXSW, music, film), unrelated industries, or purely social.
Return JSON: { "relevant": boolean, "sector_tags": string[] (from: AI-native, Robotics, Other), "event_type": "demo_day"|"conference"|"meetup"|null }`,
    messages: [{ role: "user", content: text }],
  });

  const block = response.content.find((b) => b.type === "text");
  if (!block || block.type !== "text") return { relevant: false };

  const raw = block.text.trim().replace(/^```json\s*/i, "").replace(/\s*```$/i, "");
  const parsed = JSON.parse(raw) as { relevant: boolean; sector_tags?: string[]; event_type?: string };
  return {
    relevant: Boolean(parsed.relevant),
    sector_tags: parsed.sector_tags,
    event_type: parsed.event_type,
  };
}

function keywordRelevance(title: string, description?: string | null): EventValidationResult {
  const combined = `${title} ${description || ""}`.toLowerCase();
  const hasRelevant = RELEVANT_DOMAINS.some((d) => combined.includes(d.toLowerCase()));
  return { relevant: hasRelevant };
}
