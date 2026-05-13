import { MenuCategory } from "./types";

export const menuConfig: MenuCategory[] = [
  {
    name: "Eyeglasses",
    sections: [
      {
        items: [
          { label: "Big", href: "/eyeglasses/frame-size/big" },
          { label: "Medium", href: "/eyeglasses/frame-size/medium" },
          { label: "Small", href: "/eyeglasses/frame-size/small" },
        ],
      },
      {
        items: [
          { label: "Acetate", href: "/eyeglasses/frame-material/acetate" },
          { label: "Metal", href: "/eyeglasses/frame-material/metal" },
        ],
      },
      {
        items: [
          {
            label: "Best Sellers",
            href: "/eyeglasses/bestsellers",
            badge: "bestseller",
          },
        ],
      },
      {
        items: [
          {
            label: "Clearance Sale",
            href: "/eyeglasses/sale/clearance",
            isSale: true,
          },
        ],
      },
      {
        items: [
          {
            label: "View All Eyeglasses",
            href: "/products/eyeglasses/view-all",
            badge: "viewall",
          },
        ],
      },
    ],
  },

  {
    name: "Sunglasses",
    sections: [
      {
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
        items: [
          {
            label: "Best Sellers",
            href: "/sunglasses/bestsellers",
            badge: "bestseller",
          },
        ],
      },
      {
        items: [
          {
            label: "Clearance Sale",
            href: "/sunglasses/sale/clearance",
            isSale: true,
          },
        ],
      },
      {
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

  {
    name: "Support",
    sections: [
      {
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
