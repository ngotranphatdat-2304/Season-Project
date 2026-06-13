import type { Metadata } from "next";
import { TryOnPage } from "@/components/tryon/TryOnPage";

export const metadata: Metadata = {
  title: "Try On - Season",
  description: "Preview Season eyewear on preset model images.",
};

export default function TryOnRoutePage() {
  return <TryOnPage />;
}
