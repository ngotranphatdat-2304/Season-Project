import { notFound, redirect } from "next/navigation";
import { fetchCollectionFilters } from "@/lib/model";

export default async function CollectionsPage() {
  const collections = await fetchCollectionFilters();
  const firstCollection = collections[0];

  if (firstCollection === undefined) {
    notFound();
  }

  redirect(`/products/collections/${firstCollection.slug}`);
}

