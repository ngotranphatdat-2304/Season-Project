/**
 * Type definitions for Mega Menu Drawer
 */

export interface MenuItem {
  label: string;
  href: string;
  icon?: React.ReactNode;
  isSale?: boolean;
  badge?: "bestseller" | "viewall";
}

export interface MenuSection {
  items: MenuItem[];
}

export interface MenuCategory {
  name: string;
  href?: string;
  sections: MenuSection[];
  featuredImage?: {
    src: string;
    alt: string;
    caption?: string;
  };
}

export interface MegaMenuContextType {
  isOpen: boolean;
  toggleOpen: () => void;
  closeMenu: () => void;
  openMenu: () => void;
}
