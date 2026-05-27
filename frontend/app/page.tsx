import { Hero } from "@/components/sections/Hero";
import { CategoryGrid } from "@/components/sections/CategorySection";
// import { Collaboration } from "@/components/sections/Collaboration";
import { AccessoryFeature } from "@/components/sections/CampaignCollections";
import { Newsletter } from "@/components/sections/Newsletter";

export default function Home() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-white">
      <Hero />
      <CategoryGrid />
      <AccessoryFeature />
      <Newsletter />
    </main>
  );
}
