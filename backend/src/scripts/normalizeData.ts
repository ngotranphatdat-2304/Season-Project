import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const collectionsPath = path.join(
  __dirname,
  "../../season_data/collections.json",
);
const productsPath = path.join(
  __dirname,
  "../../season_data/Products_Grouped (1).json",
);

const normalizedCollectionsPath = path.join(
  __dirname,
  "../../season_data/normalized_collections.json",
);
const normalizedProductsPath = path.join(
  __dirname,
  "../../season_data/normalized_products.json",
);

const normalizeData = () => {
  // 1. Read files
  const collectionsData = JSON.parse(fs.readFileSync(collectionsPath, "utf-8"));
  const productsData = JSON.parse(fs.readFileSync(productsPath, "utf-8"));

  // 2. Generate normalized collections with ObjectIds
  const normalizedCollections = collectionsData.collections.map(
    (name: string) => ({
      _id: new mongoose.Types.ObjectId().toString(),
      name: name,
      slug: name.toLowerCase().replace(/\s+/g, "-"),
    }),
  );

  // 3. Group products by base name and extract colors from SKU
  const groupedProducts: Record<string, any> = {};

  productsData.forEach((product: any) => {
    // Extract base product name by matching against collections
    let baseName = "";
    let color = "";
    let collectionId = null;
    let matchingCollection = null;

    // Find which collection this product belongs to
    for (const collection of normalizedCollections) {
      if (product.name.toLowerCase().startsWith(collection.name.toLowerCase())) {
        matchingCollection = collection;
        collectionId = collection._id;

        // Check if product name contains "SUNGLASSES"
        if (product.name.toUpperCase().includes(" SUNGLASSES")) {
          const sunglassesIndex = product.name.toUpperCase().indexOf(" SUNGLASSES");
          baseName = product.name.substring(0, sunglassesIndex).trim();
          // For SUNGLASSES products, don't extract color from name - use variant SKU instead
          color = "";
        } else {
          // Extract everything up to the first " - "
          const dashIndex = product.name.indexOf(" - ");
          if (dashIndex !== -1) {
            baseName = product.name.substring(0, dashIndex).trim();
            color = product.name.substring(dashIndex + 3).trim();
          } else {
            baseName = product.name;
          }
        }
        break;
      }
    }

    if (!baseName) {
      console.warn(`⚠️ No collection found for product: ${product.name}`);
      baseName = product.name;
    }

    // Normalize color from name to match SKU format (lowercase with hyphens)
    // "Brown - Rhino" -> "brown-rhino"
    if (color) {
      color = color.toLowerCase().replace(/\s*-\s*/g, "-").replace(/\s+/g, "-");
    }

    // Extract color from SKU if not already extracted from name
    if (!color && product.sku) {
      // e.g., "the-paper-knife-01-brown" -> color = "brown"
      // e.g., "the-athletes-10-blue-rhino" -> color = "blue-rhino"
      const collectionSlug = matchingCollection?.slug || baseName.toLowerCase().replace(/\s+/g, "-");

      if (product.sku.startsWith(collectionSlug + "-")) {
        // Remove collection slug and separator
        const afterCollection = product.sku.substring(collectionSlug.length + 1);
        const colorParts = afterCollection.split("-");

        // Skip numeric parts (like "01", "02", "10", etc.)
        let colorStartIndex = 0;
        while (colorStartIndex < colorParts.length && /^\d+$/.test(colorParts[colorStartIndex])) {
          colorStartIndex++;
        }

        if (colorStartIndex < colorParts.length) {
          color = colorParts.slice(colorStartIndex).join("-");
        }
      }
    }

    // Determine base slug - always generate from base name to ensure consistency
    let baseSlug = baseName.toLowerCase().replace(/\s+/g, "-");

    // Group products by base name
    if (!groupedProducts[baseName]) {
      groupedProducts[baseName] = {
        ...product,
        name: baseName,
        slug: baseSlug,
        collectionId: collectionId,
        variants: [],
      };
      // Remove fields that shouldn't be at root level or are outdated
      delete groupedProducts[baseName].categoryId;
      delete groupedProducts[baseName].CollectionId;
      delete groupedProducts[baseName].images; // Images should only be in variants
    }

    // Normalize variants - extract and normalize colors from each variant's SKU
    if (product.variants && Array.isArray(product.variants)) {
      product.variants.forEach((variant: any, index: number) => {
        let variantColor = "";

        // For SUNGLASSES products, always extract color from SKU
        if (product.name.toUpperCase().includes(" SUNGLASSES") && variant.sku && matchingCollection) {
          const collectionSlug = matchingCollection.slug;
          if (variant.sku.startsWith(collectionSlug + "-")) {
            const afterCollection = variant.sku.substring(collectionSlug.length + 1);
            const colorParts = afterCollection.split("-");

            // Skip numeric parts and "sunglasses" keyword
            let colorStartIndex = 0;
            while (
              colorStartIndex < colorParts.length &&
              (/^\d+$/.test(colorParts[colorStartIndex]) ||
                colorParts[colorStartIndex].toLowerCase() === "sunglasses")
            ) {
              colorStartIndex++;
            }

            if (colorStartIndex < colorParts.length) {
              variantColor = colorParts.slice(colorStartIndex).join("-");
            }
          }
        } else {
          // For other products, use variant.color field
          variantColor = variant.color || "";

          // Normalize the color (convert to lowercase with hyphens)
          if (variantColor !== "") {
            variantColor = variantColor.toLowerCase().replace(/\s*-\s*/g, "-").replace(/\s+/g, "-");
          } else if (variant.sku && matchingCollection) {
            // Try to extract color from variant SKU if color is empty
            const collectionSlug = matchingCollection.slug;
            if (variant.sku.startsWith(collectionSlug + "-")) {
              const afterCollection = variant.sku.substring(collectionSlug.length + 1);
              const colorParts = afterCollection.split("-");

              // Skip numeric parts and "sunglasses" keyword
              let colorStartIndex = 0;
              while (
                colorStartIndex < colorParts.length &&
                (/^\d+$/.test(colorParts[colorStartIndex]) ||
                  colorParts[colorStartIndex].toLowerCase() === "sunglasses")
              ) {
                colorStartIndex++;
              }

              if (colorStartIndex < colorParts.length) {
                variantColor = colorParts.slice(colorStartIndex).join("-");
              }
            }
          }
        }

        groupedProducts[baseName].variants.push({
          sku: variant.sku,
          color: variantColor,
          size: variant.size || "",
          price: variant.price,
          images: variant.images || [],
          isDefault: index === 0, // First variant is default
        });
      });
    } else {
      // If no variants array, add a single variant entry
      groupedProducts[baseName].variants.push({
        sku: product.sku || "",
        color: color,
        size: product.size || "",
        price: product.price,
        images: product.images || [],
        isDefault: groupedProducts[baseName].variants.length === 0,
      });
    }
  });

  const normalizedProducts = Object.values(groupedProducts);

  // 4. Write normalized files
  fs.writeFileSync(
    normalizedCollectionsPath,
    JSON.stringify(normalizedCollections, null, 2),
  );
  console.log(
    `✅ Normalized collections saved to ${normalizedCollectionsPath}`,
  );

  fs.writeFileSync(
    normalizedProductsPath,
    JSON.stringify(normalizedProducts, null, 2),
  );
  console.log(`✅ Normalized products saved to ${normalizedProductsPath}`);
};

normalizeData();
