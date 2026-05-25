import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { v2 as cloudinary } from "cloudinary";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(process.cwd(), ".env.backend") });

// Input file paths
const inputPath = path.resolve(
  __dirname,
  "../../season_data/eyeglasses-raw.json",
);
const collectionsPath = path.resolve(
  __dirname,
  "../../season_data/collections-normalized.json",
);

const sizeGuideRoots = {
  Big: path.resolve(__dirname, "../../season_data/big"),
  Medium: path.resolve(__dirname, "../../season_data/medium"),
  Small: path.resolve(__dirname, "../../season_data/small"),
} as const;

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

type FrameSize = keyof typeof sizeGuideRoots;
type NormalizedCollection = {
  _id: string;
  name: string;
  slug: string;
};

const OFFICE_COLLECTION_ALIASES = new Set([
  "the paper knife",
  "the ruler",
  "the set square",
]);

const normalizeCollectionName = (value?: string) => {
  const normalized = value?.trim().toLowerCase() ?? "";

  if (OFFICE_COLLECTION_ALIASES.has(normalized)) {
    return "the office";
  }

  return normalized;
};

const pickRandomItem = <T,>(items: T[]): T => {
  const index = Math.floor(Math.random() * items.length);
  const item = items[index];

  if (item === undefined) {
    throw new Error("Cannot pick an item from an empty list");
  }

  return item;
};

const parseCloudinaryUrl = (value: string) => {
  const parsed = new URL(value);

  return {
    cloudName: parsed.hostname,
    apiKey: parsed.username,
    apiSecret: parsed.password,
  };
};

const uploadFolderImages = async (folderPath: string, publicFolder: string) => {
  const files = fs
    .readdirSync(folderPath)
    .filter((file) => !file.includes(":Zone.Identifier"))
    .filter((file) => /\.(jpe?g|png)$/i.test(file))
    .sort((left, right) => left.localeCompare(right));

  const uploaded = [] as string[];

  for (const file of files) {
    const uploadedFile = await cloudinary.uploader.upload(path.join(folderPath, file), {
      folder: publicFolder,
      public_id: path.parse(file).name,
      overwrite: true,
      unique_filename: false,
      resource_type: "image",
    });
    uploaded.push(uploadedFile.secure_url);
  }

  return uploaded;
};

const uploadSizeGuideImages = async () => {
  const entries = await Promise.all(
    (Object.entries(sizeGuideRoots) as Array<[FrameSize, string]>).map(
      async ([sizeLabel, folderPath]) => {
        const images = await uploadFolderImages(
          folderPath,
          `MyProject/size-guides/eyewear/${sizeLabel.toLowerCase()}`,
        );

        return [sizeLabel, images] as const;
      },
    ),
  );

  return Object.fromEntries(entries) as Record<FrameSize, string[]>;
};

const assignGenderBySplit = <T extends { slug: string; specifications: { gender: string } }>(
  products: T[],
) => {
  const sortedProducts = [...products].sort((left, right) =>
    left.slug.localeCompare(right.slug),
  );
  const maleCount = Math.ceil(sortedProducts.length / 2);

  sortedProducts.forEach((product, index) => {
    product.specifications.gender = index < maleCount ? "Male" : "Female";
  });
};

const normalizeNewData = async () => {
  const cloudinaryUrl = process.env.CLOUDINARY_URL;
  if (cloudinaryUrl === undefined || cloudinaryUrl === "") {
    throw new Error("Please provide CLOUDINARY_URL in .env.backend");
  }

  const cloudinaryConfig = parseCloudinaryUrl(cloudinaryUrl);
  cloudinary.config({
    cloud_name: cloudinaryConfig.cloudName,
    api_key: cloudinaryConfig.apiKey,
    api_secret: cloudinaryConfig.apiSecret,
    secure: true,
  });

  const rawData = fs.readFileSync(inputPath, "utf8");
  const data = JSON.parse(rawData);

  // Load collections data
  const collectionsData = JSON.parse(
    fs.readFileSync(collectionsPath, "utf8"),
  ) as NormalizedCollection[];
  const collectionByName = new Map(
    collectionsData.map((collection) => [collection.name.toLowerCase(), collection]),
  );
  const collectionBySlug = new Map(
    collectionsData.map((collection) => [collection.slug, collection]),
  );
  const clearanceSaleData = JSON.parse(fs.readFileSync(clearanceSalePath, "utf8"));
  
  const groupedProducts: Record<string, any> = {};

  const bigSizeData = JSON.parse(fs.readFileSync(bigsizePath, "utf8"));
  const mediumSizeData = JSON.parse(fs.readFileSync(mediumSizePath, "utf8"));
  const smallSizeData = JSON.parse(fs.readFileSync(smallSizePath, "utf8"));
  const metalFrameData = JSON.parse(fs.readFileSync(metalFramePath, "utf8"));
  const sizeGuideImages = await uploadSizeGuideImages();
  
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
    
    const normalizedCollectionName = normalizeCollectionName(product.collection);
    const normalizedCollectionSlug = normalizedCollectionName.replace(/\s+/g, "-");
    matchingCollection =
      collectionByName.get(normalizedCollectionName) ??
      collectionBySlug.get(normalizedCollectionSlug) ??
      null;

    if (matchingCollection !== null) {
      collectionId = matchingCollection._id;
    }

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

    if (!baseName) {
      console.warn(`⚠️ No collection found for product: ${product.name}`);
      baseName = product.name;
    }

    if (!collectionId) {
      collectionId = null;
    }

    // Determine frameType object - size and material
    let frameSize: FrameSize = "Medium"; // Default to Medium
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
      material: frameMaterial,
      size: {
        label: frameSize,
        image: pickRandomItem(sizeGuideImages[frameSize]),
      },
    };

    if (!color && product.slug && matchingCollection) {
      // Extract color from SKU by removing the collection slug prefix
      // e.g., "the-paper-knife-01-brown" -> remove "the-paper-knife" prefix -> "01-brown"
      // Then skip numeric parts -> "brown"
      
      const collectionSlug = baseName.toLowerCase().replace(/\s+/g, "-");
      
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
      price: price,
      images: product.images || [],
      isDefault: groupedProducts[baseName].variants.length === 0, // Make first variant default
      stock: getRandomStock(), // Random stock 1-10
    });
  });

  const result = Object.values(groupedProducts);
  assignGenderBySplit(result as Array<{ slug: string; specifications: { gender: string } }>);

  fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
  console.log(`✅ Normalized newly scraped products saved to ${outputPath}`);
};

normalizeNewData().catch((error: unknown) => {
  console.error("❌ Error normalizing eyeglasses:", error);
  process.exit(1);
});
