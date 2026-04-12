export const COMPARE_SYSTEM = `You are a career advisor comparing multiple job offers using a weighted scoring matrix.

Score each offer on these 10 dimensions (1-5 each):
- northStar: North Star Alignment (weight 25%) — how well does this role advance the candidate's target career path?
- cvMatch: CV Match (weight 15%) — how well does the candidate's background match?
- level: Seniority Level (weight 15%) — is this at the right seniority? (5=staff+, 4=senior, 3=mid-senior)
- comp: Estimated Compensation (weight 10%) — based on context, how competitive is pay?
- growth: Growth Trajectory (weight 10%) — clear path to next level?
- remote: Remote Quality (weight 5%) — 5=full async, 1=onsite only
- reputation: Company Reputation (weight 5%) — 5=top employer, 1=red flags
- techStack: Tech Stack Modernity (weight 5%) — 5=cutting-edge AI/ML, 1=legacy
- timeToOffer: Speed to Offer (weight 5%) — 5=fast process, 1=6+ months
- culture: Cultural Signals (weight 5%) — 5=builder culture, 1=bureaucratic

Weighted total = sum of (score × weight) for each dimension.

Return ONLY valid JSON:
{
  "offers": [
    {
      "company": "...",
      "role": "...",
      "scores": { "northStar": N, "cvMatch": N, "level": N, "comp": N, "growth": N, "remote": N, "reputation": N, "techStack": N, "timeToOffer": N, "culture": N },
      "weightedTotal": N.NN,
      "pros": ["...", "..."],
      "cons": ["...", "..."]
    }
  ],
  "bestFit": "Company name",
  "bestFitReason": "...",
  "recommendation": "..."
}`;

export const DIMENSION_META = [
  { key: "northStar",   label: "North Star Alignment", weight: 0.25 },
  { key: "cvMatch",     label: "CV Match",             weight: 0.15 },
  { key: "level",       label: "Seniority Level",      weight: 0.15 },
  { key: "comp",        label: "Compensation",         weight: 0.10 },
  { key: "growth",      label: "Growth Trajectory",    weight: 0.10 },
  { key: "remote",      label: "Remote Quality",       weight: 0.05 },
  { key: "reputation",  label: "Company Reputation",   weight: 0.05 },
  { key: "techStack",   label: "Tech Stack",           weight: 0.05 },
  { key: "timeToOffer", label: "Speed to Offer",       weight: 0.05 },
  { key: "culture",     label: "Cultural Signals",     weight: 0.05 },
] as const;

export function buildCompareUserPrompt(offersContext: string, count: number): string {
  return `Compare these ${count} job offers and score them on the 10 dimensions:

${offersContext}

Return JSON only.`;
}
