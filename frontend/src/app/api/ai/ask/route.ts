import { GoogleGenerativeAI } from "@google/generative-ai";
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

  const geminiKey = process.env.GEMINI_API_KEY;
  const history: ChatMessage[] = parsed.data.history ?? [];

  const fallbackAnswer =
    "I can only answer based on the stored product details. For APR, eligibility, fees, and tenure please refer to the card above.";

  if (!geminiKey) {
    return NextResponse.json(
      { answer: fallbackAnswer },
      { status: 200 }
    );
  }

  const client = new GoogleGenerativeAI(geminiKey);
  const model = client.getGenerativeModel({
    model: process.env.GEMINI_MODEL || "gemini-2.0-flash",
    systemInstruction: buildPrompt(JSON.stringify(product, null, 2)),
  });

  const contents = [
    ...history.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    })),
    { role: "user", parts: [{ text: parsed.data.message }] },
  ];

  try {
    const result = await model.generateContent({
      contents,
      generationConfig: { temperature: 0.3, maxOutputTokens: 300 },
    });

    const answer = result.response?.text()?.trim() ??
      "I could not generate an answer from the product data.";

    return NextResponse.json({ answer });
  } catch (error) {
    console.error("AI route error", error);
    return NextResponse.json(
      { answer: fallbackAnswer },
      { status: 200 }
    );
  }
}
