export type Tier = "strong" | "good" | "marginal" | "skip";

export function scoreTier(score: number): Tier {
  if (score >= 4.5) return "strong";
  if (score >= 4.0) return "good";
  if (score >= 3.5) return "marginal";
  return "skip";
}

export const TIER_STYLES: Record<Tier, { badge: string; border: string; bg: string; label: string }> = {
  strong:   { badge: "badge-green",  border: "border-[#86efac]", bg: "bg-[#14532d]/30", label: "Strong Match — Apply Now" },
  good:     { badge: "badge-purple", border: "border-[#6366f1]", bg: "bg-[#6366f1]/10", label: "Good Match — Apply" },
  marginal: { badge: "badge-yellow", border: "border-[#fde68a]", bg: "bg-[#713f12]/20", label: "Marginal — Apply with Changes" },
  skip:     { badge: "badge-red",    border: "border-[#fca5a5]", bg: "bg-[#7f1d1d]/20", label: "Skip — Not a Fit" },
};
