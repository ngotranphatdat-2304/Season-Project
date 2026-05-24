"use client";
import Link from "next/link";
import { Search, Heart, User, ShoppingBag } from "lucide-react";
import { MegaMenu } from "../menu/MegaMenu";

export function Header() {
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
          <button
            aria-label="Cart"
            className="hover:opacity-60 transition-opacity duration-300"
          >
            <ShoppingBag className="w-4 h-4 stroke-[1.5]" />
          </button>
        </div>
      </nav>
    </header>
  );
}
