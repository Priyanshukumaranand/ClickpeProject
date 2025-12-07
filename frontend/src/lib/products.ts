import { createClient } from "@supabase/supabase-js";
import { deriveBadges } from "./badge";
import { mockProducts } from "./data";
import { normalizeSearch } from "./utils";
import type { Product, ProductFilters } from "./types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseBrowser = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

const supabaseServer = supabaseUrl && (supabaseServiceKey || supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseServiceKey || supabaseAnonKey)
  : null;

type DbProduct = {
  id: string;
  name: string;
  bank: string;
  type: Product["loan_type"];
  rate_apr: number;
  min_income: number;
  min_credit_score: number;
  tenure_min_months: number;
  tenure_max_months: number;
  processing_fee_pct?: number | null;
  prepayment_allowed?: boolean | null;
  disbursal_speed?: Product["disbursal_speed"] | null;
  docs_level?: Product["docs_level"] | null;
  summary?: string | null;
  faq?: Product["faq"] | null;
  terms?: Product["terms"] | null;
};

function mapDbProduct(row: DbProduct): Product {
  return {
    id: row.id,
    product_name: row.name,
    bank: row.bank,
    loan_type: row.type,
    rate_apr: row.rate_apr,
    min_income: row.min_income,
    min_credit_score: row.min_credit_score,
    tenure_min_months: row.tenure_min_months,
    tenure_max_months: row.tenure_max_months,
    processing_fee_pct: row.processing_fee_pct ?? undefined,
    prepayment_allowed: row.prepayment_allowed ?? undefined,
    disbursal_speed: row.disbursal_speed ?? undefined,
    docs_level: row.docs_level ?? undefined,
    summary: row.summary ?? undefined,
    faq: row.faq ?? undefined,
    terms: row.terms ?? undefined,
  };
}

function filterLocalProducts(filters: ProductFilters) {
  const bankQuery = normalizeSearch(filters.bank);
  const results = mockProducts.filter((p) => {
    const matchesBank = bankQuery ? normalizeSearch(p.bank).includes(bankQuery) : true;
    const matchesMinApr = filters.minApr ? p.rate_apr >= filters.minApr : true;
    const matchesMaxApr = filters.maxApr ? p.rate_apr <= filters.maxApr : true;
    const matchesIncome = filters.minIncome ? p.min_income <= filters.minIncome : true;
    const matchesCredit = filters.minCredit ? p.min_credit_score <= filters.minCredit : true;
    return matchesBank && matchesMinApr && matchesMaxApr && matchesIncome && matchesCredit;
  });

  return results.slice(0, filters.limit ?? results.length).map(attachBadgesAndScore);
}

export function attachBadgesAndScore(product: Product): Product {
  const badges = deriveBadges(product);
  const tenureSpan = product.tenure_max_months - product.tenure_min_months;
  const aprScore = 1 / Math.max(product.rate_apr, 0.1);
  const creditScore = 1 / Math.max(product.min_credit_score, 300);
  const tenureScore = tenureSpan > 0 ? tenureSpan / 120 : 0.1;
  const match_score = Number((aprScore * 0.55 + creditScore * 0.25 + tenureScore * 0.2).toFixed(3));
  return { ...product, badges, match_score };
}

export async function getProducts(filters: ProductFilters = {}): Promise<Product[]> {
  if (!supabaseBrowser) return filterLocalProducts(filters);

  let query = supabaseBrowser
    .from("products")
    .select(
      "id,name,bank,type,rate_apr,min_income,min_credit_score,tenure_min_months,tenure_max_months,processing_fee_pct,prepayment_allowed,disbursal_speed,docs_level,summary,faq,terms"
    )
    .order("rate_apr", { ascending: true });

  if (filters.bank) {
    query = query.ilike("bank", `%${filters.bank}%`);
  }
  if (filters.minApr) query = query.gte("rate_apr", filters.minApr);
  if (filters.maxApr) query = query.lte("rate_apr", filters.maxApr);
  if (filters.minIncome) query = query.lte("min_income", filters.minIncome);
  if (filters.minCredit) query = query.lte("min_credit_score", filters.minCredit);
  if (filters.limit) query = query.limit(filters.limit);

  const { data, error } = await query;
  if (error || !data) {
    console.error("Falling back to mock products", error);
    return filterLocalProducts(filters);
  }

  return data.map(mapDbProduct).map(attachBadgesAndScore);
}

export async function getProductById(id: string): Promise<Product | null> {
  if (supabaseServer) {
    const { data, error } = await supabaseServer
      .from("products")
      .select(
        "id,name,bank,type,rate_apr,min_income,min_credit_score,tenure_min_months,tenure_max_months,processing_fee_pct,prepayment_allowed,disbursal_speed,docs_level,summary,faq,terms"
      )
      .eq("id", id)
      .maybeSingle();

    if (data && !error) {
      return attachBadgesAndScore(mapDbProduct(data));
    }
  }

  const local = mockProducts.find((p) => p.id === id);
  return local ? attachBadgesAndScore(local) : null;
}

export async function getTopProducts(limit = 5) {
  const products = await getProducts({ limit });
  return products
    .sort((a, b) => (b.match_score ?? 0) - (a.match_score ?? 0))
    .slice(0, limit);
}
