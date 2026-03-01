import Anthropic from "@anthropic-ai/sdk";

const SECTOR_OPTIONS = ["Vertical SaaS", "AI-native", "Fintech", "Robotics"] as const;

export const ACCELERATOR_VALUES = ["YC", "SPC", "Neo", "Techstars", "500 Global"] as const;
export const UNIVERSITY_VALUES = ["CMU", "MIT", "Stanford", "Berkeley", "Harvard", "Other"] as const;

export interface CofounderLinkedIn {
  name: string;
  url: string;
}

export interface ExtractedStartup {
  name: string;
  why_interesting: string;
  sector_relevance: typeof SECTOR_OPTIONS[number][];
  relevance_score: number;
  moat_note: string | null;
  signed_customers: boolean;
  team_grew: boolean;
  raised_funding: boolean;
  accelerator: typeof ACCELERATOR_VALUES[number] | null;
  university: typeof UNIVERSITY_VALUES[number] | null;
  cofounder_linkedins?: CofounderLinkedIn[];
}

const SYSTEM_PROMPT = `You extract startups/companies that are "potentially interesting to track" from venture and tech news.

Given an article title and content snippet, output a JSON array of objects. Each object has:
- name: the company/startup name (exact, as it appears or commonly known)
- why_interesting: one short sentence on why they're notable
- sector_relevance: array of sectors from: "Vertical SaaS", "AI-native", "Fintech", "Robotics" (use only these; empty [] if none)
- relevance_score: integer 1-10 (10 = highly relevant)
- moat_note: short note on moat (IP, distribution, network effects, data) or null
- signed_customers: true if they signed new customers, landed deals
- team_grew: true if they hired, expanded team
- raised_funding: true if article is about them raising funding
- accelerator: if backed by Y Combinator use "YC", South Park Commons "SPC", Neo "Neo", Techstars "Techstars", 500 Global "500 Global"; else null
- university: if spinoff/affiliated with Carnegie Mellon "CMU", MIT "MIT", Stanford "Stanford", Berkeley "Berkeley", Harvard "Harvard", or another university "Other"; else null
- cofounder_linkedins: optional array of { "name": "Person Name", "url": "https://www.linkedin.com/in/..." } for founders/cofounders mentioned in the article when their LinkedIn profile URL is explicitly given. Use empty [] or omit if no LinkedIn URLs are in the text.

Only include startups clearly the subject of the article. Skip big tech unless startup acquisition.

Return valid JSON only: an array of objects with those keys. If none found, return [].`;

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
        const acc = (x as { accelerator?: string }).accelerator;
        const uni = (x as { university?: string }).university;
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
          accelerator: acc && ACCELERATOR_VALUES.includes(acc as never) ? (acc as typeof ACCELERATOR_VALUES[number]) : null,
          university: uni && UNIVERSITY_VALUES.includes(uni as never) ? (uni as typeof UNIVERSITY_VALUES[number]) : null,
          cofounder_linkedins: (() => {
            const arr = (x as { cofounder_linkedins?: unknown }).cofounder_linkedins;
            if (!Array.isArray(arr)) return undefined;
            return arr
              .filter((c): c is { name?: unknown; url?: unknown } => c && typeof c === "object")
              .map((c) => ({ name: String(c.name ?? "").trim(), url: String(c.url ?? "").trim() }))
              .filter((c) => c.name && c.url && c.url.toLowerCase().includes("linkedin.com"));
          })(),
        };
      })
      .filter((x): x is ExtractedStartup => x !== null);
  } catch {
    return [];
  }
}
