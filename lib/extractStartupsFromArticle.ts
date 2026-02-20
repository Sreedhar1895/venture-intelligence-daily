import Anthropic from "@anthropic-ai/sdk";

const SECTOR_OPTIONS = ["Vertical SaaS", "AI-native", "Fintech", "Robotics"] as const;

export interface ExtractedStartup {
  name: string;
  why_interesting: string;
  sector_relevance: typeof SECTOR_OPTIONS[number][];
  relevance_score: number;
  moat_note: string | null;
  signed_customers: boolean;
  team_grew: boolean;
  raised_funding: boolean;
}

const SYSTEM_PROMPT = `You extract startups/companies that are "potentially interesting to track" from venture and tech news.

Given an article title and content snippet, output a JSON array of objects. Each object has:
- name: the company/startup name (exact, as it appears or commonly known)
- why_interesting: one short sentence on why they're notable
- sector_relevance: array of sectors that apply from: "Vertical SaaS", "AI-native", "Fintech", "Robotics" (use only these exact strings; empty [] if none)
- relevance_score: integer 1-10 for how relevant this startup is to Vertical SaaS, AI-native, Fintech, or Robotics (10 = highly relevant)
- moat_note: short note on any interesting moat (IP, distribution, network effects, data, etc.) or null if not mentioned
- signed_customers: true if the article says they signed new customers, landed deals, or similar
- team_grew: true if the article says they hired, expanded team, or key hire
- raised_funding: true if the article is about them raising funding (any round)

Only include startups or growth companies that are clearly the subject of the article. Skip big tech (e.g. Google, Meta) unless about a startup acquisition. Prefer early-stage and venture-backed companies.

Return valid JSON only: an array of objects with those keys. If no relevant startup is found, return [].`;

export async function extractStartupsFromArticle(
  title: string,
  content: string
): Promise<ExtractedStartup[]> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return [];

  const client = new Anthropic({ apiKey });
  const text = `Title: ${title}\n\nContent: ${content.slice(0, 8000)}`;

  try {
    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: text }],
    });

    const block = response.content.find((b) => b.type === "text");
    if (!block || block.type !== "text") return [];

    const raw = block.text.trim().replace(/^```json\s*/i, "").replace(/\s*```$/i, "");
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter((x): x is Record<string, unknown> => typeof x === "object" && x !== null && typeof (x as { name?: unknown }).name === "string")
      .map((x) => {
        const name = String((x as { name: string }).name).trim();
        if (!name) return null;
        const sectors = Array.isArray((x as { sector_relevance?: unknown }).sector_relevance)
          ? ((x as { sector_relevance: unknown[] }).sector_relevance.filter((s) => SECTOR_OPTIONS.includes(s as typeof SECTOR_OPTIONS[number])) as typeof SECTOR_OPTIONS[number][])
          : [];
        const score = typeof (x as { relevance_score?: unknown }).relevance_score === "number"
          ? Math.min(10, Math.max(1, Math.round((x as { relevance_score: number }).relevance_score)))
          : 5;
        return {
          name,
          why_interesting: String((x as { why_interesting?: string }).why_interesting ?? "").trim(),
          sector_relevance: sectors,
          relevance_score: score,
          moat_note: typeof (x as { moat_note?: unknown }).moat_note === "string" && (x as { moat_note: string }).moat_note.trim()
            ? (x as { moat_note: string }).moat_note.trim()
            : null,
          signed_customers: Boolean((x as { signed_customers?: boolean }).signed_customers),
          team_grew: Boolean((x as { team_grew?: boolean }).team_grew),
          raised_funding: Boolean((x as { raised_funding?: boolean }).raised_funding),
        };
      })
      .filter((x): x is ExtractedStartup => x !== null);
  } catch {
    return [];
  }
}
