"use client";
import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, Heart, User, ShoppingBag } from "lucide-react";
import { MegaMenu } from "../menu/MegaMenu";
import { CartDrawer } from "../cart/cart-drawer";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { cn } from "@/lib/utils";

export function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentSearchQuery = searchParams.get("q") ?? "";
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [query, setQuery] = useState(currentSearchQuery);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isSearchOpen) {
      inputRef.current?.focus();
    }
  }, [isSearchOpen]);

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalized = query.trim();
    if (normalized.length < 2) {
      inputRef.current?.focus();
      return;
    }

    const params = new URLSearchParams();
    params.set("q", normalized);
    router.push(`/search?${params.toString()}`);
    setIsSearchOpen(false);
  };

  return (
    <header
      className="sticky top-0 z-40 border-b border-season-gray bg-white/95 backdrop-blur-sm"
    >
      <nav className="flex items-center justify-between px-6 py-4">
        {/* Left: Menu */}
        <div className="flex-1">
          <MegaMenu />
        </div>

        {/* Center: Logo */}
        <div className="flex flex-col items-center justify-center flex-1">
          <Link
            href="/"
            className="text-1xl md:text-2xl tracking-mega font-light uppercase font-serif text-black hover:opacity-80 transition-opacity duration-300"
          >
            Season
          </Link>
        </div>

        {/* Right: Icons */}
        <div className="flex items-center justify-end space-x-6 flex-1 text-black">
          <button
            aria-label="Search"
            className="hover:opacity-60 transition-opacity duration-300"
            aria-expanded={isSearchOpen}
            onClick={() => {
              setQuery(currentSearchQuery);
              setIsSearchOpen((current) => !current);
            }}
          >
            <Search className="w-4 h-4 stroke-[1.5]" />
          </button>
          <button
            aria-label="Favorites"
            className="hover:opacity-60 transition-opacity duration-300"
          >
            <Heart className="w-4 h-4 stroke-[1.5]" />
          </button>
          <button
            aria-label="Account"
            className="hover:opacity-60 transition-opacity duration-300"
          >
            <User className="w-4 h-4 stroke-[1.5]" />
          </button>
          <CartDrawer>
            <button
              aria-label="Cart"
              className="hover:opacity-60 transition-opacity duration-300"
            >
              <ShoppingBag className="w-4 h-4 stroke-[1.5]" />
            </button>
          </CartDrawer>
        </div>
      </nav>

      <div
        className={cn(
          "overflow-hidden border-t border-season-gray bg-[#fbfaf7] transition-[max-height,opacity] duration-300",
          isSearchOpen ? "max-h-40 opacity-100" : "max-h-0 opacity-0",
        )}
      >
        <form
          onSubmit={handleSearchSubmit}
          className="mx-auto grid w-full max-w-5xl grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-6 py-5"
        >
          <div className="flex h-14 w-full items-center border border-[#1f1f1f] bg-white px-4">
            <Search className="mr-3 h-4 w-4 shrink-0 stroke-[1.5] text-neutral-500" />
            <Input
              ref={inputRef}
              type="search"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
              }}
              placeholder="Search frames, brands, collections..."
              className="h-full min-w-0 border-0 bg-transparent px-0 text-sm tracking-[0.08em] shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>
          <Button
            type="submit"
            variant="ghost"
            className="h-14 rounded-none border border-black px-6 uppercase tracking-[0.18em]"
          >
            Search
          </Button>
        </form>
        {pathname === "/search" && currentSearchQuery.trim().length < 2 ? (
          <p className="px-6 pb-4 text-center text-xs uppercase tracking-[0.18em] text-neutral-500">
            Enter at least 2 characters to search products.
          </p>
        ) : null}
      </div>
    </header>
  );
}
