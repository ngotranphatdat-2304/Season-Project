/**
 * Individual menu item component
 * Dark theme styling for #202126 menu background
 */
import Link from "next/link";
import { MenuItem as MenuItemType } from "./types";
import { cn } from "@/lib/utils";

interface MenuItemProps extends MenuItemType {
  onItemClick?: () => void;
  className?: string;
}

export function MenuItem({
  label,
  href,
  icon,
  onItemClick,
  className,
}: MenuItemProps) {
  return (
    <Link
      href={href}
      onClick={onItemClick}
      className={cn(
        // Base styles
        "group block  py-2 rounded transition-all duration-200",
        // Text styling - Light text for dark background
        "text-xs sm:text-base font-light",
        // Hover states - Light up on hover
        "hover:text-white",
        // Focus states - Accessibility
        "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neutral-600 focus-visible:ring-offset-1 focus-visible:ring-offset-season-menu-bg hover:bg-neutral text-neutral-300",
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon && (
            <span
              className={cn("text-neutral transition-colors group-hover:text-neutral-200")}
            >
              {icon}
            </span>
          )}
          <span>{label}</span>
        </div>
        {/* Arrow indicator - Appears on hover */}
        <span
          className="ml-2 opacity-0 transition-opacity duration-200 text-neutral group-hover:opacity-100 group-hover:text-neutral-400"
        >
          →
        </span>
      </div>
    </Link>
  );
}
