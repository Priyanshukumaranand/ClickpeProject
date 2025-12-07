"use client";

import { useEffect, useMemo, useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { formatApr, formatTenure } from "@/lib/utils";
import type { ChatMessage, Product } from "@/lib/types";
import { Loader2, SendHorizonal } from "lucide-react";

interface ChatSheetProps {
  product: Product;
  open: boolean;
  onOpenChange: (next: boolean) => void;
}

type AskResponse = {
  answer: string;
  citedFields?: string[];
};

export function ChatSheet({ product, open, onOpenChange }: ChatSheetProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const headerBadges = useMemo(() => product.badges ?? [], [product.badges]);

  useEffect(() => {
    if (open) {
      setMessages([]);
      setInput("");
      setError(null);
    }
  }, [open, product.id]);

  const handleSend = async () => {
    if (!input.trim()) return;
    setPending(true);
    setError(null);
    const userMessage: ChatMessage = { role: "user", content: input.trim() };
    const optimisticHistory = [...messages, userMessage];
    setMessages(optimisticHistory);
    setInput("");

    try {
      const res = await fetch("/api/ai/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          message: userMessage.content,
          history: optimisticHistory,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? "Unable to get a response right now.");
      }

      const data: AskResponse = await res.json();
      const assistantMessage: ChatMessage = { role: "assistant", content: data.answer };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setPending(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full max-w-xl flex-col gap-4 p-0">
        <SheetHeader className="border-b px-6 py-4">
          <SheetTitle className="flex flex-col gap-1 text-left">
            <div className="text-sm font-semibold text-muted-foreground">{product.bank}</div>
            <div className="text-xl">{product.product_name}</div>
            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
              <span>{formatApr(product.rate_apr)}</span>
              <span>•</span>
              <span>{formatTenure(product.tenure_min_months, product.tenure_max_months)}</span>
              <span>•</span>
              <span>Credit score {product.min_credit_score}+</span>
            </div>
            <div className="flex flex-wrap gap-2 pt-2">
              {headerBadges.map((badge) => (
                <Badge key={badge} variant="secondary">
                  {badge}
                </Badge>
              ))}
            </div>
          </SheetTitle>
        </SheetHeader>

        <div className="flex flex-1 flex-col gap-3 px-6">
          <ScrollArea className="h-[360px] w-full rounded-lg border bg-muted/30 p-4">
            <div className="flex flex-col gap-3">
              {messages.length === 0 ? (
                <div className="text-sm text-muted-foreground">
                  Ask anything about this product (eligibility, fees, tenure, prepayment, docs). I will only answer using the product data.
                </div>
              ) : null}
              {messages.map((msg, idx) => (
                <div
                  key={`${msg.role}-${idx}`}
                  className={
                    msg.role === "user"
                      ? "ml-auto max-w-[85%] rounded-lg bg-primary text-primary-foreground px-3 py-2 text-sm"
                      : "max-w-[90%] rounded-lg bg-background px-3 py-2 text-sm shadow"
                  }
                >
                  {msg.content}
                </div>
              ))}
              {pending ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Thinking...
                </div>
              ) : null}
            </div>
          </ScrollArea>
          {error ? <Alert variant="destructive" title="Could not get an answer">{error}</Alert> : null}
        </div>

        <div className="border-t px-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="chat-input">Ask about this product</Label>
            <div className="flex items-center gap-2">
              <Input
                id="chat-input"
                placeholder="e.g. What is the minimum credit score?"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                disabled={pending}
              />
              <Button variant="secondary" size="icon" disabled={pending} onClick={handleSend} aria-label="Send message">
                {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <SendHorizonal className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
