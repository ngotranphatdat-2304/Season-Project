"use client";
import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, Heart, User, ShoppingBag, X } from "lucide-react";
import { MegaMenu } from "../menu/MegaMenu";
import { CartDrawer } from "../cart/cart-drawer";
import { Input } from "../ui/input";
import { cn } from "@/lib/utils";

export function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentSearchQuery = searchParams.get("q") ?? "";
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [query, setQuery] = useState(currentSearchQuery);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchFormRef = useRef<HTMLFormElement>(null);

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
    <header className="sticky top-0 z-40 border-b border-season-gray bg-white/95 backdrop-blur-sm">
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
          <Link
            href="/admin/auth"
            aria-label="Account"
            className="hover:opacity-60 transition-opacity duration-300"
          >
            <User className="w-4 h-4 stroke-[1.5]" />
          </Link>
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
          "overflow-hidden border-t border-[#ddd8d1] bg-[#f5f5f7] transition-[max-height,opacity] duration-300",
          isSearchOpen ? "max-h-32 opacity-100" : "max-h-0 opacity-0",
        )}
      >
        <form
          ref={searchFormRef}
          onSubmit={handleSearchSubmit}
          onBlur={(event) => {
            const nextFocusedElement = event.relatedTarget as Node | null;

            if (
              nextFocusedElement !== null &&
              searchFormRef.current?.contains(nextFocusedElement)
            ) {
              return;
            }

            setIsSearchOpen(false);
          }}
          className="mx-auto flex w-full max-w-208 items-center justify-center gap-4 px-6 py-5 md:px-8"
        >
          <div className="flex h-12 min-w-0 w-full max-w-152 items-center border-b border-[#cfc8bf] bg-transparent">
            <Input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
              }}
              placeholder="Search products..."
              aria-label="Search products"
              className="h-full min-w-0 border-0 bg-transparent px-0 text-[20px] font-light tracking-[0.02em] text-neutral-800 shadow-none placeholder:text-[#7b746b] focus-visible:ring-0 focus-visible:ring-offset-0 md:text-[22px]"
            />
            <button
              type="submit"
              aria-label="Search"
              className="ml-3 inline-flex size-8 shrink-0 items-center justify-center text-neutral-700 transition-colors hover:text-black"
            >
              <Search className="h-4.5 w-4.5 stroke-[1.5]" />
            </button>
          </div>
          <button
            type="button"
            aria-label="Clear search"
            className="inline-flex size-9 shrink-0 items-center justify-center text-neutral-800 transition-colors hover:text-black"
            onClick={() => {
              setQuery("");
              inputRef.current?.focus();
            }}
          >
            <X className="h-6 w-6 stroke-[1.5]" />
          </button>
        </form>
        {pathname === "/search" && currentSearchQuery.trim().length < 2 ? (
          <p className="px-4 pb-4 text-center text-xs uppercase tracking-[0.18em] text-neutral-500 md:px-8">
            Enter at least 2 characters to search products.
          </p>
        ) : null}
      </div>
    </header>
  );
}
