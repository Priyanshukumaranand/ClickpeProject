import Link from "next/link";
import { AllProducts } from "@/components/all-products";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getProducts } from "@/lib/products";

export const revalidate = 0;

export default async function ProductsPage() {
  const products = await getProducts({});

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="container space-y-6 pb-16 pt-10">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold text-primary">All products</p>
            <h1 className="text-2xl font-semibold md:text-3xl">Explore every available loan product</h1>
            <p className="text-muted-foreground">Filter by bank, APR, income, and credit score, then ask questions right inside each card.</p>
          </div>
          <Button asChild variant="outline">
            <Link href="/">Back to dashboard</Link>
          </Button>
        </div>

        <Card>
          <CardContent className="space-y-6 p-6">
            <AllProducts initialProducts={products} />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
