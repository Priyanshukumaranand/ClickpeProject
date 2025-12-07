import { NextResponse } from "next/server";
import { z } from "zod";
import { getProducts } from "@/lib/products";

const filtersSchema = z.object({
  bank: z.string().optional(),
  minApr: z.coerce.number().positive().optional(),
  maxApr: z.coerce.number().positive().optional(),
  minIncome: z.coerce.number().positive().optional(),
  minCredit: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(50).optional(),
});

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parseResult = filtersSchema.safeParse(Object.fromEntries(url.searchParams.entries()));

  if (!parseResult.success) {
    return NextResponse.json({ error: "Invalid filters", details: parseResult.error.flatten() }, { status: 400 });
  }

  const products = await getProducts(parseResult.data);
  return NextResponse.json({ data: products });
}
