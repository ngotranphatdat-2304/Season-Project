import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Input file paths
const inputPath = path.resolve(
  __dirname,
  "../../season_data/eyeglasses-raw.json",
);
const collectionsPath = path.resolve(
  __dirname,
  "../../season_data/collections-normalized.json",
);

// Frame size reference files
const bigsizePath = path.resolve(__dirname, "../../season_data/frame-size-big.json");
const mediumSizePath = path.resolve(
  __dirname,
  "../../season_data/frame-size-medium.json",
);
const smallSizePath = path.resolve(
  __dirname,
  "../../season_data/frame-size-small.json",
);
const metalFramePath = path.resolve(
  __dirname,
  "../../season_data/frame-material-metal.json",
);
const clearanceSalePath = path.resolve(
  __dirname,
  "../../season_data/clearance-sale.json",
);

// Output file path
const outputPath = path.resolve(
  __dirname,
  "../../season_data/eyeglasses-normalized.json",
);

const normalizeNewData = () => {
  const rawData = fs.readFileSync(inputPath, "utf8");
  const data = JSON.parse(rawData);

  // Load collections data
  const collectionsData = JSON.parse(fs.readFileSync(collectionsPath, "utf8"));
  const clearanceSaleData = JSON.parse(fs.readFileSync(clearanceSalePath, "utf8"));
  
  const groupedProducts: Record<string, any> = {};

  const bigSizeData = JSON.parse(fs.readFileSync(bigsizePath, "utf8"));
  const mediumSizeData = JSON.parse(fs.readFileSync(mediumSizePath, "utf8"));
  const smallSizeData = JSON.parse(fs.readFileSync(smallSizePath, "utf8"));
  const metalFrameData = JSON.parse(fs.readFileSync(metalFramePath, "utf8"));
  
  // Extract base names from clearance sale products (remove colors)
  const clearanceSaleBaseNames = new Set(
    clearanceSaleData.product_names.map((name: string) => {
      const dashIndex = name.indexOf(" - ");
      return dashIndex !== -1 ? name.substring(0, dashIndex).trim() : name;
    })
  );

  // Helper function to generate random sale percent (1-30%)
  const getRandomSalePercent = () => Math.floor(Math.random() * 30) + 1;
  
  // Helper function to generate random stock (1-10)
  const getRandomStock = () => Math.floor(Math.random() * 10) + 1;
  
  const bigSizeProduct = bigSizeData.product_names;
  const mediumSizeProduct = mediumSizeData.product_names;
  const smallSizeProduct = smallSizeData.product_names;
  const metalProduct = metalFrameData.product_names;
  data.products.forEach((product: any) => {
    // Extract base product name by matching against collections
    // This is the most reliable way since product names vary in format
    let baseName = "";
    let color = "";
    
    // Find which collection this product belongs to
    let collectionId = null;
    let matchingCollection = null;
    
    for (const collection of collectionsData) {
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

    if (!collectionId) {
      collectionId = null;
    }

    // Determine frameType object - size and material
    let frameSize = "Medium"; // Default to Medium
    let frameMaterial = "Acetate"; // Default to Acetate
    
    // Check frame size - product can only have ONE size
    if (bigSizeProduct.some((name: string) => name.startsWith(baseName))) {
      frameSize = "Big";
    } else if (smallSizeProduct.some((name: string) => name.startsWith(baseName))) {
      frameSize = "Small";
    } else if (mediumSizeProduct.some((name: string) => name.startsWith(baseName))) {
      frameSize = "Medium";
    }
    // If not found in any size list, default to Medium (already set above)
    
    // Check frame material
    if (metalProduct.some((name: string) => name.startsWith(baseName))) {
      frameMaterial = "Metal";
    }
    // Otherwise default to Acetate (already set above)
    
    const frameType = {
      size: frameSize,
      material: frameMaterial
    };

    if (!color && product.slug && matchingCollection) {
      // Extract color from SKU by removing the collection slug prefix
      // e.g., "the-paper-knife-01-brown" -> remove "the-paper-knife" prefix -> "01-brown"
      // Then skip numeric parts -> "brown"
      
      const collectionSlug = matchingCollection.slug;
      
      if (product.slug.startsWith(collectionSlug + "-")) {
        // Remove collection slug and separator
        const afterCollection = product.slug.substring(collectionSlug.length + 1);
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
          color = colorParts.slice(colorStartIndex).join("-");
        }
      }
    } else if (color !== "") {
      // Normalize color from name to match SKU format (lowercase with hyphens)
      // "Brown - Rhino" -> "brown-rhino"
      color = color.toLowerCase().replace(/\s*-\s*/g, "-").replace(/\s+/g, "-");
    }

    // Determine base slug - always generate from base name to ensure consistency
    let baseSlug = baseName.toLowerCase().replace(/\s+/g, "-");

    if (!groupedProducts[baseName]) {
      // Check if this product is in clearance sale
      const isInClearanceSale = clearanceSaleBaseNames.has(baseName);
      const salePercent = isInClearanceSale ? getRandomSalePercent() : 0;

      groupedProducts[baseName] = {
        name: baseName,
        slug: baseSlug,
        collectionId: collectionId,
        brand: product.vendor || "SEESONvn",
        salePercent,
        availability: product.availability || "in_stock",
        type: "Eyeglasses",
        description: product.description || "",
        specifications: {
          frameType: frameType,
          gender: "Unisex"
        },
        variants: [],
        rating: {
          avg: 0,
          count: 0,
        },
        isActive: true,
      };
    }

    // Handle unusually large scientific notation prices that were in the original data
    let price =
      typeof product.price?.amount === "number"
        ? product.price.amount
        : 2400000;
    if (price > 10000000) {
      price = 2400000;
    }

    groupedProducts[baseName].variants.push({
      sku: product.slug,
      color: color,
      size: "",
      price: price,
      images: product.images || [],
      isDefault: groupedProducts[baseName].variants.length === 0, // Make first variant default
      stock: getRandomStock(), // Random stock 1-10
    });
  });

  const result = Object.values(groupedProducts);

  fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
  console.log(`✅ Normalized newly scraped products saved to ${outputPath}`);
};

normalizeNewData();
