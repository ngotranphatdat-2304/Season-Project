import Link from "next/link";
import { Facebook, Twitter, Instagram, Linkedin } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-season-footer text-neutral-400 py-16 text-sm font-sans tracking-wide">
      <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-3  gap-8">
        {/* Column 1: Brand Info */}
        <div className="space-y-4">
          <Link
            href="/"
            className="text-xl font-serif text-white uppercase tracking-mega"
          >
            Season
          </Link>
          <p className="text-xs leading-relaxed max-w-2/3">
            Luxury eyewear defined by timeless design and uncompromising
            quality. Based in New York.
          </p>
          <div className="flex space-x-4 pt-4">
            <a
              href="#"
              className="hover:text-white transition-colors duration-300"
            >
              <Facebook className="w-4 h-4 stroke-[1.5]" />
            </a>
            <a
              href="#"
              className="hover:text-white transition-colors duration-300"
            >
              <Twitter className="w-4 h-4 stroke-[1.5]" />
            </a>
            <a
              href="#"
              className="hover:text-white transition-colors duration-300"
            >
              <Instagram className="w-4 h-4 stroke-[1.5]" />
            </a>
            <a
              href="#"
              className="hover:text-white transition-colors duration-300"
            >
              <Linkedin className="w-4 h-4 stroke-[1.5]" />
            </a>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 mt-16 pt-8 border-t border-season-border text-center text-xs text-neutral-600">
        <p>
          &copy; {new Date().getFullYear()} Season Eyewear. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
