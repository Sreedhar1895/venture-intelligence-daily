import type { SectorTag } from "@/types/database";

const VERTICALS: SectorTag[] = ["AI-native", "Fintech", "Robotics", "Vertical SaaS"];

/** Rubric: 1 = vertical OR in our ingested news, 5 = customers/partnerships, 4 = accelerator/funding, 2 = key hires, 3 = research */
export function computeArticleScoreForStartup(
  sectorTags: string[] | undefined,
  eventType: string | null,
  signedCustomers: boolean,
  teamGrew: boolean,
  raisedFunding: boolean,
  /** If true, give 1 point for appearing in our ingested venture news (ensures extracted startups show up) */
  inIngestedNews = true
): number {
  let score = 0;
  const sectors = sectorTags ?? [];
  if (sectors.some((s) => VERTICALS.includes(s as SectorTag))) score += 1;
  else if (inIngestedNews) score += 1; // base point for appearing in our venture news feeds
  if (signedCustomers) score += 5;
  const acceleratorOrFundraise =
    eventType === "Accelerator" || eventType === "Fundraise" || raisedFunding;
  if (acceleratorOrFundraise) score += 4;
  const keyHires = eventType === "Major Hiring" || teamGrew;
  if (keyHires) score += 2;
  const research =
    eventType === "Research Breakthrough" || eventType === "University Lab Initiative";
  if (research) score += 3;
  return score;
}
