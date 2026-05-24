import type { ReactNode } from "react";
import { CollectionsLayout as CollectionsPageLayout } from "@/components/products/view-by-collection/collections-layout";

type CollectionsLayoutProps = {
  children: ReactNode;
};

export default function CollectionsRouteLayout({
  children,
}: CollectionsLayoutProps) {
  return <CollectionsPageLayout>{children}</CollectionsPageLayout>;
}
