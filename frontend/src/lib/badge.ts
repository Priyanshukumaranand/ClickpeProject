import type { Product } from "./types";

const BADGE_RULES: Array<{ label: string; predicate: (product: Product) => boolean }> = [
  { label: "Low APR", predicate: (p) => p.rate_apr <= 11 },
  { label: "No Prepayment", predicate: (p) => p.prepayment_allowed === true },
  { label: "Fast Disbursal", predicate: (p) => p.disbursal_speed === "fast" || p.disbursal_speed === "instant" },
  { label: "Flexible Tenure", predicate: (p) => p.tenure_max_months - p.tenure_min_months >= 36 },
  { label: "Low Docs", predicate: (p) => p.docs_level === "low" || p.docs_level === "minimal" },
  {
    label: "Salary Friendly",
    predicate: (p) => p.min_income <= 45000,
  },
  {
    label: "Credit Score Friendly",
    predicate: (p) => p.min_credit_score <= 700,
  },
  {
    label: "Limited-Time Offer",
    predicate: (p) => Boolean(p.terms?.limited_time_offer),
  },
];

export function deriveBadges(product: Product) {
  const badges = BADGE_RULES.filter((rule) => rule.predicate(product)).map((rule) => rule.label);
  return badges.length ? badges.slice(0, 5) : ["Popular Pick"];
}
