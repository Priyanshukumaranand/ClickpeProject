export type LoanType =
  | "personal"
  | "education"
  | "vehicle"
  | "home"
  | "credit_line"
  | "debt_consolidation";

export type DisbursalSpeed = "standard" | "fast" | "instant";
export type DocsLevel = "standard" | "low" | "minimal";

export type FaqItem = {
  question: string;
  answer: string;
};

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export type Product = {
  id: string;
  product_name: string;
  bank: string;
  loan_type: LoanType;
  rate_apr: number;
  min_income: number;
  min_credit_score: number;
  tenure_min_months: number;
  tenure_max_months: number;
  processing_fee_pct?: number;
  prepayment_allowed?: boolean;
  disbursal_speed?: DisbursalSpeed;
  docs_level?: DocsLevel;
  summary?: string;
  faq?: FaqItem[];
  terms?: Record<string, string | number | boolean>;
  badges?: string[];
  match_score?: number;
};

export type ProductFilters = {
  bank?: string;
  minApr?: number;
  maxApr?: number;
  minIncome?: number;
  minCredit?: number;
  limit?: number;
};
