import { ProductCard } from "@/components/product-card";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getTopProducts } from "@/lib/products";

export const revalidate = 0;

export default async function Home() {
  const products = await getTopProducts(5);
  const [bestMatch, ...others] = products;
  const averageApr = products.length
    ? (products.reduce((sum, p) => sum + p.rate_apr, 0) / products.length).toFixed(1)
    : "--";
  const minCredit = products.length
    ? products.reduce((acc, p) => Math.min(acc, p.min_credit_score), 1000)
    : null;
  const badgeCount = products.length ? products.flatMap((p) => p.badges ?? []).length : 0;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <main className="container space-y-8 pb-16 pt-10">
        <section className="grid gap-6 md:grid-cols-[1.2fr,0.8fr]">
          <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent">
            <CardContent className="space-y-4 p-6">
              <p className="text-sm font-semibold text-primary">Personalized picks</p>
              <h1 className="text-3xl font-semibold leading-tight md:text-4xl">
                Discover loan products tailored to your profile
              </h1>
              <p className="max-w-2xl text-muted-foreground">
                View your top matches, compare APR, eligibility, and instantly ask the AI assistant about any product’s fine print.
              </p>
              <div className="flex flex-wrap gap-3 text-sm">
                <span className="rounded-full bg-background px-3 py-1 font-medium shadow-sm">Top 5 matches updated live</span>
                <span className="rounded-full bg-background px-3 py-1 font-medium shadow-sm">Grounded AI answers</span>
                <span className="rounded-full bg-background px-3 py-1 font-medium shadow-sm">Zod validated APIs</span>
              </div>
              <div className="flex flex-wrap gap-3 pt-2">
                <Button asChild>
                  <a href="#best">View best match</a>
                </Button>
                <Button asChild variant="outline">
                  <a href="/products">Browse all products</a>
                </Button>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="grid h-full grid-cols-2 gap-4 p-6">
              <div>
                <p className="text-xs text-muted-foreground">Average APR</p>
                <p className="text-3xl font-semibold">{averageApr}%</p>
                <p className="text-xs text-muted-foreground">Across your top picks</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Fastest disbursal</p>
                <p className="text-3xl font-semibold">24 hrs</p>
                <p className="text-xs text-muted-foreground">On instant credit lines</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Min credit score</p>
                <p className="text-3xl font-semibold">{minCredit ?? "N/A"}</p>
                <p className="text-xs text-muted-foreground">Required among picks</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Badge coverage</p>
                <p className="text-3xl font-semibold">{badgeCount}</p>
                <p className="text-xs text-muted-foreground">Signals calculated</p>
              </div>
            </CardContent>
          </Card>
        </section>

        {bestMatch ? (
          <section id="best" className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-primary" />
              <p className="text-sm font-semibold text-primary">Best match</p>
            </div>
            <ProductCard product={bestMatch} highlight />
          </section>
        ) : null}

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Runner-up matches</h2>
            <Button asChild variant="ghost" size="sm">
              <a href="/products">View all products</a>
            </Button>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {others.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
