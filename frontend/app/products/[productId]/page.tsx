import { toPlainObject } from "@/lib/model/misc";
import { notFound } from "next/navigation";
import { ProductDetailView } from "@/components/products/view-product-detail/product-detail";
import {
  fetchCollectionFilters,
  fetchProductById,
  getCollectionPageData,
} from "@/lib/model";

type ProductPageProps = {
  params: Promise<{ productId: string }>;
};

export default async function ProductsPage({
  params,
}: ProductPageProps) {
  const { productId } = await params;

  let product;
  let relatedProducts = [] as Awaited<ReturnType<typeof getCollectionPageData>>["records"];
  let collectionSlug: string | undefined;

  try {
    product = await fetchProductById(productId);

    const collections = await fetchCollectionFilters();
    const matchedCollection = collections.find(
      (collection) => collection.id === product.collectionId,
    );

    if (matchedCollection !== undefined) {
      collectionSlug = matchedCollection.slug;

      const relatedCollectionData = await getCollectionPageData(collectionSlug);
      relatedProducts = relatedCollectionData.records
        .filter((relatedProduct) => relatedProduct.id !== product.id)
        .slice(0, 8);
    }
  } catch {
    console.error(`Failed to fetch product with id ${productId}`);
    notFound();
  }

  return (
    <ProductDetailView
      product={toPlainObject(product)}
      relatedProducts={toPlainObject(relatedProducts)}
      collectionSlug={collectionSlug}
    />
  );
}
