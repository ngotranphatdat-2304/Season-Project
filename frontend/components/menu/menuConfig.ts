import { MenuCategory } from "./types";

export const menuConfig: MenuCategory[] = [
  {
    name: "Eyeglasses",
    sections: [
      {
        items: [
          {
            label: "View All Eyeglasses",
            href: "/eyeglasses/view-all",
          },
          { label: "Women Eyeglasses", href: "/eyeglasses/women" },
          { label: "Men Eyeglasses", href: "/eyeglasses/men" },
          { label: "Clearance Sale", href: "/eyeglasses/sale" },
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
            label: "View All Sunglasses",
            href: "/sunglasses/view-all",
          },
          { label: "Women Sunglasses", href: "/sunglasses/women" },
          { label: "Men Sunglasses", href: "/sunglasses/men" },
          { label: "Clearance Sale", href: "/sunglasses/sale" },
        ],
      },
    ],
  },

  {
    name: "Collections",
    sections: [
      {
        items: [
          { label: "The Athletes", href: "/collections/the-athletes" },
          { label: "The Office", href: "/collections/the-office" },
          { label: "The Soap", href: "/collections/the-soap" },
          { label: "The Vertebra", href: "/collections/the-vertebra" },
          { label: "The Cut", href: "/collections/the-cut" },
        ],
      },
    ],
  },
];
