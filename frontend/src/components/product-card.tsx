"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ChatSheet } from "@/components/chat/chat-sheet";
import { formatApr, formatCurrency, formatTenure } from "@/lib/utils";
import type { Product } from "@/lib/types";
import { Sparkles } from "lucide-react";

interface ProductCardProps {
  product: Product;
  highlight?: boolean;
}

export function ProductCard({ product, highlight }: ProductCardProps) {
  const [open, setOpen] = useState(false);
  const badgeList = useMemo(() => product.badges ?? [], [product.badges]);

  return (
    <Card className={highlight ? "border-primary/60 shadow-lg shadow-primary/10" : undefined}>
      <CardHeader className="gap-2">
        <div className="flex items-center justify-between gap-2 text-sm text-muted-foreground">
          <span className="rounded-full bg-primary/10 px-2.5 py-1 font-medium text-primary">{product.bank}</span>
          <span className="rounded-full bg-muted px-2.5 py-1 capitalize">{product.loan_type.replace("_", " ")}</span>
        </div>
        <div className="flex items-center gap-2">
          {highlight ? <Sparkles className="h-5 w-5 text-primary" /> : null}
          <CardTitle className="text-xl md:text-2xl">{product.product_name}</CardTitle>
        </div>
        <CardDescription>{product.summary}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
          <div className="rounded-lg bg-muted/60 p-3">
            <p className="text-xs text-muted-foreground">APR</p>
            <p className="text-base font-semibold">{formatApr(product.rate_apr)}</p>
          </div>
          <div className="rounded-lg bg-muted/60 p-3">
            <p className="text-xs text-muted-foreground">Min Income</p>
            <p className="text-base font-semibold">{formatCurrency(product.min_income)}</p>
          </div>
          <div className="rounded-lg bg-muted/60 p-3">
            <p className="text-xs text-muted-foreground">Credit Score</p>
            <p className="text-base font-semibold">{product.min_credit_score}+</p>
          </div>
          <div className="rounded-lg bg-muted/60 p-3">
            <p className="text-xs text-muted-foreground">Tenure</p>
            <p className="text-base font-semibold">{formatTenure(product.tenure_min_months, product.tenure_max_months)}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {badgeList.map((badge) => (
            <Badge key={badge} variant="secondary">
              {badge}
            </Badge>
          ))}
        </div>
      </CardContent>
      <CardFooter className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm text-muted-foreground">
          {product.processing_fee_pct ? `Processing fee ${product.processing_fee_pct}%` : "Processing fee varies"}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
            Ask About Product
          </Button>
          <Button variant="secondary" size="sm">
            Compare
          </Button>
        </div>
      </CardFooter>
      <ChatSheet product={product} open={open} onOpenChange={setOpen} />
    </Card>
  );
}
