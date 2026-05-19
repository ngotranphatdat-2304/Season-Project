import { MenuCategory } from "./types";

export const menuConfig: MenuCategory[] = [
  {
    name: "Eyeglasses",
    sections: [
      {
        items: [
          { label: "Big", href: "/products/eyeglasses/big" },
          { label: "Medium", href: "/products/eyeglasses/medium" },
          { label: "Small", href: "/products/eyeglasses/small" },
        ],
      },
      {
        items: [
          { label: "Acetate", href: "/products/eyeglasses/acetate" },
          { label: "Metal", href: "/products/eyeglasses/metal" },
        ],
      },
      {
        items: [
          {
            label: "Best Sellers",
            href: "/products/eyeglasses/bestsellers",
          },
        ],
      },
      {
        items: [
          {
            label: "Clearance Sale",
            href: "/products/eyeglasses/sale",
          },
        ],
      },
      {
        items: [
          {
            label: "View All Eyeglasses",
            href: "/products/eyeglasses/view-all",
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
            href: "/products/sunglasses/the-athletes",
          },
          { label: "The Soap", href: "/products/sunglasses/the-soap" },
          { label: "The Ruler", href: "/products/sunglasses/the-ruler" },
          { label: "The Cut", href: "/products/sunglasses/the-cut" },
          { label: "The Edge", href: "/products/sunglasses/the-edge" },
        ],
      },
      {
        items: [
          {
            label: "Best Sellers",
            href: "/products/sunglasses/bestsellers",
          },
        ],
      },
      {
        items: [
          {
            label: "Clearance Sale",
            href: "/products/sunglasses/sale",
          },
        ],
      },
      {
        items: [
          {
            label: "View All Sunglasses",
            href: "/products/sunglasses/view-all",
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
