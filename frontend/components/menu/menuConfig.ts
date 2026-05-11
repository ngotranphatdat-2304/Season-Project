/**
 * Mega Menu Configuration - Simplified Structure
 * 3 main categories: Eyeglasses, Sunglasses, Support
 * Eyeglasses: All frame sizes + all materials + sale
 * Sunglasses: Top 5 collections + sale
 */

import { MenuCategory } from "./types";

export const menuConfig: MenuCategory[] = [
  // 1. EYEGLASSES
  {
    name: "Eyeglasses",
    sections: [
      {
        title: "Frame Size",
        items: [
          { label: "Big", href: "/eyeglasses/frame-size/big" },
          { label: "Medium", href: "/eyeglasses/frame-size/medium" },
          { label: "Small", href: "/eyeglasses/frame-size/small" },
        ],
      },
      {
        title: "Frame Material",
        items: [
          { label: "Acetate", href: "/eyeglasses/frame-material/acetate" },
          { label: "Metal", href: "/eyeglasses/frame-material/metal" },
        ],
      },
      {
        title: "Bestsellers",
        items: [
          {
            label: "Best Sellers",
            href: "/eyeglasses/bestsellers",
            badge: "bestseller",
          },
        ],
      },
      {
        title: "Sale",
        items: [
          {
            label: "Clearance Sale",
            href: "/eyeglasses/sale/clearance",
            isSale: true,
          },
        ],
      },
      {
        title: "View All",
        items: [
          {
            label: "View All Eyeglasses",
            href: "/products",
            badge: "viewall",
          },
        ],
      },
    ],
  },

  // 2. SUNGLASSES - Top 5 Collections
  {
    name: "Sunglasses",
    sections: [
      {
        title: "Collections",
        items: [
          {
            label: "The Athletes",
            href: "/sunglasses/collection/the-athletes",
          },
          { label: "The Soap", href: "/sunglasses/collection/the-soap" },
          { label: "The Ruler", href: "/sunglasses/collection/the-ruler" },
          { label: "The Cut", href: "/sunglasses/collection/the-cut" },
          { label: "The Edge", href: "/sunglasses/collection/the-edge" },
        ],
      },
      {
        title: "Bestsellers",
        items: [
          {
            label: "Best Sellers",
            href: "/sunglasses/bestsellers",
            badge: "bestseller",
          },
        ],
      },
      {
        title: "Sale",
        items: [
          {
            label: "Clearance Sale",
            href: "/sunglasses/sale/clearance",
            isSale: true,
          },
        ],
      },
      {
        title: "View All",
        items: [
          {
            label: "View All Sunglasses",
            href: "/products/sunglasses",
            badge: "viewall",
          },
        ],
      },
    ],
  },

  // 3. SUPPORT
  {
    name: "Support",
    sections: [
      {
        title: "Help",
        items: [
          { label: "Contact Us", href: "/support/contact" },
          { label: "FAQ", href: "/support/faq" },
          { label: "Shipping & Returns", href: "/support/shipping" },
          { label: "Store Locator", href: "/support/locations" },
          { label: "Care Guide", href: "/support/care" },
        ],
      },
    ],
  },
];
