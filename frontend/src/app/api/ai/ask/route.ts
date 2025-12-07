import OpenAI from "openai";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getProductById } from "@/lib/products";
import type { ChatMessage } from "@/lib/types";

const askSchema = z.object({
  productId: z.string().uuid(),
  message: z.string().min(3).max(400),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1).max(800),
      })
    )
    .max(10)
    .optional()
    .default([]),
});

function buildPrompt(productJson: string) {
  return `You are a loan product assistant. Only answer using the PRODUCT_DATA below. If the question cannot be answered from the data, say: "I can only answer based on the product details and don't have that info yet." Keep answers short (under 120 words) and cite relevant fields when helpful.

PRODUCT_DATA:
${productJson}`;
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = askSchema.safeParse(body ?? {});

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request", details: parsed.error.flatten() }, { status: 400 });
  }

  const product = await getProductById(parsed.data.productId);
  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  const openaiKey = process.env.OPENAI_API_KEY;
  const history: ChatMessage[] = parsed.data.history ?? [];

  if (!openaiKey) {
    return NextResponse.json(
      {
        answer:
          "I can only answer based on the stored product details. For APR, eligibility, fees, and tenure please refer to the card above.",
      },
      { status: 200 }
    );
  }

  const client = new OpenAI({ apiKey: openaiKey });
  const prompt = buildPrompt(JSON.stringify(product, null, 2));

  const messages = [
    { role: "system" as const, content: prompt },
    ...history.map((m) => ({ role: m.role, content: m.content })),
    { role: "user" as const, content: parsed.data.message },
  ];

  try {
    const completion = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      messages,
      temperature: 0.3,
      max_tokens: 300,
    });

    const answer = completion.choices[0]?.message?.content ??
      "I could not generate an answer from the product data.";

    return NextResponse.json({ answer });
  } catch (error) {
    console.error("AI route error", error);
    return NextResponse.json(
      { answer: "I can only answer based on the product details and don't have that info yet." },
      { status: 200 }
    );
  }
}
