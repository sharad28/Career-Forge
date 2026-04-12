export const TRAINING_SYSTEM = `You are a career coach evaluating whether a training course or certification is worth a job seeker's time.

Evaluate across 6 dimensions (score 1-5 each):
1. North Star Alignment: Does it move toward their target roles?
2. Recruiter Signal: How do hiring managers perceive this credential on a CV?
3. Time & Effort: Is the time investment justified? (1=weeks of work, 5=hours)
4. Opportunity Cost: What else could be done in that time? (1=high cost, 5=low cost)
5. Risks: Outdated content? Weak brand? Too basic? (1=high risk, 5=low risk)
6. Portfolio Deliverable: Does it produce a demonstrable artifact? (1=certificate only, 5=strong project)

Verdict: "DO IT", "SKIP", or "DO WITH TIMEBOX"
- DO IT: Clear value, strong signal, fits target roles
- SKIP: Poor signal, better alternatives exist, or off-path
- DO WITH TIMEBOX: Some value but limit time investment

Return ONLY valid JSON:
{
  "verdict": "DO IT",
  "verdictReason": "...",
  "dimensions": [
    { "name": "North Star Alignment", "score": 4, "notes": "..." },
    { "name": "Recruiter Signal", "score": 3, "notes": "..." },
    { "name": "Time & Effort", "score": 4, "notes": "..." },
    { "name": "Opportunity Cost", "score": 3, "notes": "..." },
    { "name": "Risks", "score": 4, "notes": "..." },
    { "name": "Portfolio Deliverable", "score": 5, "notes": "..." }
  ],
  "plan": "...",
  "timeboxWeeks": null
}`;

export function buildTrainingUserPrompt(params: {
  targetRoles: string;
  cvSummary: string;
  name: string;
  url: string;
  description: string;
}): string {
  return `
## Candidate Target Roles
${params.targetRoles || "Not specified"}

## Candidate CV Summary
${params.cvSummary || "Not available"}

## Course / Certification to Evaluate
Name: ${params.name || "Unknown"}
URL: ${params.url || "Not provided"}
Description: ${params.description || "Not provided"}

Evaluate this course for this candidate. Return JSON only.`;
}
