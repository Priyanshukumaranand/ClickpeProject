import Link from "next/link";
import { Banknote } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 w-full border-b bg-background/80 backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Banknote className="h-5 w-5" />
          </div>
          <span className="text-lg">Loan Picks</span>
        </Link>
        <nav className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/" className="rounded-md px-3 py-2 transition hover:bg-muted hover:text-foreground">
            Dashboard
          </Link>
          <Link href="/products" className="rounded-md px-3 py-2 transition hover:bg-muted hover:text-foreground">
            All Products
          </Link>
          <Link href="/upload" className="rounded-md px-3 py-2 transition hover:bg-muted hover:text-foreground">
            Upload CSV
          </Link>
          <Button asChild variant="outline" size="sm" className="hidden sm:inline-flex">
            <Link href="https://github.com/">GitHub</Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}
