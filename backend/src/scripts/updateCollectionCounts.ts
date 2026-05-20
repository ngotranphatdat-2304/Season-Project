import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

type CollectionRecord = {
  _id: string;
  name: string;
  slug: string;
  eyeglassesInStockCount?: number;
  sunglassesInStockCount?: number;
};

type ProductRecord = {
  collectionId: string;
  availability?: string;
  variants?: Array<{
    stock?: number;
  }>;
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const collectionsPath = path.resolve(
  __dirname,
  "../../season_data/collections-normalized.json",
);
const eyeglassesPath = path.resolve(
  __dirname,
  "../../season_data/eyeglasses-normalized.json",
);
const sunglassesPath = path.resolve(
  __dirname,
  "../../season_data/sunglasses-normalized.json",
);

const isProductInStock = (product: ProductRecord) => {
  if (product.availability !== undefined && product.availability !== "in_stock") {
    return false;
  }

  return (product.variants ?? []).some((variant) => (variant.stock ?? 0) > 0);
};

const countProductsByCollection = (products: ProductRecord[]) => {
  const counts = new Map<string, number>();

  products.forEach((product) => {
    if (!isProductInStock(product)) {
      return;
    }

    counts.set(product.collectionId, (counts.get(product.collectionId) ?? 0) + 1);
  });

  return counts;
};

const collections = JSON.parse(
  fs.readFileSync(collectionsPath, "utf8"),
) as CollectionRecord[];
const eyeglasses = JSON.parse(
  fs.readFileSync(eyeglassesPath, "utf8"),
) as ProductRecord[];
const sunglasses = JSON.parse(
  fs.readFileSync(sunglassesPath, "utf8"),
) as ProductRecord[];

const eyeglassesCounts = countProductsByCollection(eyeglasses);
const sunglassesCounts = countProductsByCollection(sunglasses);

const updatedCollections = collections.map((collection) => ({
  ...collection,
  eyeglassesInStockCount: eyeglassesCounts.get(collection._id) ?? 0,
  sunglassesInStockCount: sunglassesCounts.get(collection._id) ?? 0,
}));

fs.writeFileSync(collectionsPath, JSON.stringify(updatedCollections, null, 2));
console.log(`✅ Updated collection stock counts in ${collectionsPath}`);
