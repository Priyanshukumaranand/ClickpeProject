"use client";

import { useEffect, useMemo, useState } from "react";
import { ProductCard } from "@/components/product-card";
import { ProductFilters } from "@/components/product-filters";
import { Alert } from "@/components/ui/alert";
import { Product, ProductFilters as FilterType } from "@/lib/types";

interface AllProductsProps {
  initialProducts: Product[];
}

export function AllProducts({ initialProducts }: AllProductsProps) {
  const [filters, setFilters] = useState<FilterType>({});
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (filters.bank) params.set("bank", filters.bank);
    if (filters.minApr) params.set("minApr", filters.minApr.toString());
    if (filters.maxApr) params.set("maxApr", filters.maxApr.toString());
    if (filters.minIncome) params.set("minIncome", filters.minIncome.toString());
    if (filters.minCredit) params.set("minCredit", filters.minCredit.toString());
    return params.toString();
  }, [filters]);

  useEffect(() => {
    const controller = new AbortController();
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/products${queryString ? `?${queryString}` : ""}`, {
          signal: controller.signal,
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body?.error ?? "Failed to load products");
        }
        const data: { data: Product[] } = await res.json();
        setProducts(data.data);
      } catch (err) {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : "Unexpected error");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    load();
    return () => controller.abort();
  }, [queryString]);

  return (
    <div className="space-y-4">
      <ProductFilters onChange={setFilters} />
      {error ? <Alert variant="destructive" title="Could not load products">{error}</Alert> : null}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
      {loading ? <p className="text-sm text-muted-foreground">Loading results...</p> : null}
      {!loading && products.length === 0 ? (
        <p className="text-sm text-muted-foreground">No products match your filters yet.</p>
      ) : null}
    </div>
  );
}
