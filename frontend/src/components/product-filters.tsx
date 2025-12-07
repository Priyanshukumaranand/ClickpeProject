"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import type { ProductFilters } from "@/lib/types";

interface FiltersProps {
  defaultValues?: ProductFilters;
  onChange: (next: ProductFilters) => void;
}

const APR_MIN = 6;
const APR_MAX = 20;

export function ProductFilters({ defaultValues, onChange }: FiltersProps) {
  const [filters, setFilters] = useState<ProductFilters>({
    bank: defaultValues?.bank ?? "",
    minApr: defaultValues?.minApr ?? APR_MIN,
    maxApr: defaultValues?.maxApr ?? 16,
    minIncome: defaultValues?.minIncome ?? 75000,
    minCredit: defaultValues?.minCredit ?? 750,
  });

  useEffect(() => {
    onChange(filters);
  }, [filters, onChange]);

  return (
    <div className="grid gap-4 rounded-xl border bg-card p-4 shadow-sm md:grid-cols-2 lg:grid-cols-4">
      <div className="space-y-2">
        <Label htmlFor="bank">Bank</Label>
        <Input
          id="bank"
          placeholder="Search bank"
          value={filters.bank ?? ""}
          onChange={(e) => setFilters((prev) => ({ ...prev, bank: e.target.value }))}
        />
      </div>
      <div className="space-y-2">
        <Label>APR range ({filters.minApr?.toFixed(1)} - {filters.maxApr?.toFixed(1)}%)</Label>
        <Slider
          value={[filters.minApr ?? APR_MIN, filters.maxApr ?? APR_MAX]}
          min={APR_MIN}
          max={APR_MAX}
          step={0.25}
          onValueChange={([min, max]) => setFilters((prev) => ({ ...prev, minApr: min, maxApr: max }))}
        />
      </div>
      <div className="space-y-2">
        <Label>Your monthly income (₹)</Label>
        <Slider
          value={[filters.minIncome ?? 75000]}
          min={20000}
          max={200000}
          step={5000}
          onValueChange={([income]) => setFilters((prev) => ({ ...prev, minIncome: income }))}
        />
        <p className="text-xs text-muted-foreground">Show loans that accept income requirements up to ₹{filters.minIncome?.toLocaleString("en-IN")}</p>
      </div>
      <div className="space-y-2">
        <Label>Maximum credit score requirement</Label>
        <Slider
          value={[filters.minCredit ?? 750]}
          min={600}
          max={850}
          step={10}
          onValueChange={([score]) => setFilters((prev) => ({ ...prev, minCredit: score }))}
        />
        <p className="text-xs text-muted-foreground">Show loans that allow credit score up to {filters.minCredit}</p>
      </div>
      <div className="md:col-span-2 lg:col-span-4 flex flex-wrap items-center gap-3">
        <Button
          variant="secondary"
          size="sm"
          onClick={() =>
            setFilters({ bank: "", minApr: APR_MIN, maxApr: APR_MAX, minIncome: 75000, minCredit: 750 })
          }
        >
          Reset filters
        </Button>
        <span className="text-xs text-muted-foreground">Filters apply instantly.</span>
      </div>
    </div>
  );
}
