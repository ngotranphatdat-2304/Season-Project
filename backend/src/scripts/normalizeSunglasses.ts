import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { v2 as cloudinary } from "cloudinary";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(process.cwd(), ".env.backend") });

const inputPath = path.resolve(
  __dirname,
  "../../season_data/sunglasses_with_collection.json",
);
const collectionsPath = path.resolve(
  __dirname,
  "../../season_data/collections-normalized.json",
);
const imagesRoot = path.resolve(__dirname, "../../season_data/images");
const sizeGuideRoots = {
  Big: path.resolve(__dirname, "../../season_data/big"),
  Medium: path.resolve(__dirname, "../../season_data/medium"),
  Small: path.resolve(__dirname, "../../season_data/small"),
} as const;
const outputPath = path.resolve(
  __dirname,
  "../../season_data/sunglasses-normalized.json",
);

const FRAME_MATERIAL_BY_NAME = {
  "THE ASSEMBLED 10": "Acetate",
  "THE ATHLETES 01": "Metal",
  "THE ATHLETES 05": "Metal",
  "THE ATHLETES 06": "Metal",
  "THE ATHLETES 07": "Metal",
  "THE ATHLETES 10": "Acetate",
  "THE ATHLETES 12": "Acetate",
  "THE ATHLETES 14": "Acetate",
  "THE ATHLETES 15": "Metal",
  "THE CUT EDGE 01": "Acetate",
  "THE OBSIDIAN 02": "Acetate",
  "THE PAPER KNIFE 01": "Acetate",
  "THE PAPER KNIFE 02": "Metal",
  "THE RULER 03": "Metal",
  "THE SET SQUARE 01": "Metal",
  "THE SET SQUARE 02": "Metal",
  "THE SNORKEL 03": "Metal",
  "THE SOAP 03": "Acetate",
  "THE SOAP 07": "Acetate",
  "THE SOAP 08": "Metal",
  "THE VERTEBRA 01": "Acetate",
  "THE VERTEBRA 02": "Acetate",
  "THE VERTEBRA 04": "Metal",
} as const;

const FRAME_SIZE_BY_NAME = {
  "THE ATHLETES 05": "Small",
  "THE ATHLETES 06": "Small",
  "THE RULER 03": "Small",
  "THE SET SQUARE 01": "Medium",
  "THE OBSIDIAN 02": "Medium",
  "THE ATHLETES 01": "Medium",
  "THE SOAP 08": "Medium",
  "THE VERTEBRA 02": "Medium",
  "THE SOAP 03": "Medium",
  "THE PAPER KNIFE 01": "Medium",
  "THE SET SQUARE 02": "Medium",
  "THE SOAP 07": "Medium",
  "THE PAPER KNIFE 02": "Medium",
  "THE ATHLETES 10": "Medium",
  "THE ATHLETES 15": "Medium",
  "THE ASSEMBLED 10": "Big",
  "THE VERTEBRA 01": "Big",
  "THE VERTEBRA 04": "Big",
  "THE CUT EDGE 01": "Big",
  "THE ATHLETES 12": "Big",
  "THE SNORKEL 03": "Big",
  "THE ATHLETES 14": "Big",
  "THE ATHLETES 07": "Big",
} as const;

type FrameMaterialName =
  (typeof FRAME_MATERIAL_BY_NAME)[keyof typeof FRAME_MATERIAL_BY_NAME];
type FrameSizeName =
  (typeof FRAME_SIZE_BY_NAME)[keyof typeof FRAME_SIZE_BY_NAME];

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

const assignGenderBySplit = <
  T extends { slug: string; specifications: { gender: string } },
>(
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

type SourceProduct = {
  slug: string;
  name: string;
  availability?: string;
  type?: string;
  vendor?: string;
  images?: string[];
  description?: string;
  price?: {
    amount?: number;
    formatted?: string;
  };
  sale?: boolean;
  collection?: string;
};

type NormalizedVariant = {
  sku: string;
  color: string;
  price: number;
  images: string[];
  isDefault: boolean;
  stock: number;
};

type GroupedProduct = {
  name: string;
  slug: string;
  brand: string;
  availability: string;
  type: string;
  description: string;
  specifications: {
    gender: string;
    frameType: {
      material: FrameMaterialName;
      size: {
        label: FrameSizeName;
        image: string;
      };
    };
  };
  variants: NormalizedVariant[];
  rating: {
    avg: number;
    count: number;
  };
  isActive: boolean;
  collectionId: string;
  salePercent: number;
};

type ExistingGroupedProduct = {
  name: string;
  collectionId?: string;
};

const toBaseName = (value: string) => {
  const trimmed = value.toUpperCase();
  const sunglassesIndex = trimmed.indexOf(" SUNGLASSES");
  const raw = sunglassesIndex !== -1 ? value.substring(0, sunglassesIndex).trim() : value;
  const dashIndex = raw.indexOf(" - ");
  return dashIndex !== -1 ? raw.substring(0, dashIndex).trim() : raw.trim();
};

const getRandomStock = () => Math.floor(Math.random() * 10) + 1;
const getRandomSalePercent = () => Math.floor(Math.random() * 30) + 1;

const normalizeColorFromName = (value: string) =>
  value.toLowerCase().replace(/\s*-/g, "-").replace(/\s+/g, "-");

const toBaseSlug = (value: string) =>
  value.toLowerCase().replace(/\s+/g, "-");

const getFrameType = (baseName: string) => {
  const material = FRAME_MATERIAL_BY_NAME[
    baseName as keyof typeof FRAME_MATERIAL_BY_NAME
  ];
  const size = FRAME_SIZE_BY_NAME[baseName as keyof typeof FRAME_SIZE_BY_NAME];

  if (material === undefined) {
    throw new Error(`Missing frame material mapping for ${baseName}`);
  }

  if (size === undefined) {
    throw new Error(`Missing frame size mapping for ${baseName}`);
  }

  return {
    material,
    size,
  };
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
  const cloudName = parsed.hostname;
  const apiKey = parsed.username;
  const apiSecret = parsed.password;

  return { cloudName, apiKey, apiSecret };
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
    (Object.entries(sizeGuideRoots) as Array<[FrameSizeName, string]>).map(
      async ([sizeLabel, folderPath]) => {
        const images = await uploadFolderImages(
          folderPath,
          `MyProject/size-guides/eyewear/${sizeLabel.toLowerCase()}`,
        );

        return [sizeLabel, images] as const;
      },
    ),
  );

  return Object.fromEntries(entries) as Record<FrameSizeName, string[]>;
};

const seedDatabase = async () => {
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

  const collectionsData = JSON.parse(fs.readFileSync(collectionsPath, "utf-8")) as Array<{
    _id: string;
    name: string;
    slug: string;
  }>;

  const source = JSON.parse(fs.readFileSync(inputPath, "utf-8")) as {
    products: SourceProduct[];
  };
  const existingProducts = fs.existsSync(outputPath)
    ? (JSON.parse(fs.readFileSync(outputPath, "utf-8")) as ExistingGroupedProduct[])
    : [];

  const collectionByName = new Map(collectionsData.map((collection) => [collection.name.toLowerCase(), collection]));
  const collectionBySlug = new Map(collectionsData.map((collection) => [collection.slug, collection]));
  const existingCollectionIdByName = new Map(
    existingProducts
      .filter((product) => typeof product.collectionId === "string" && product.collectionId !== "")
      .map((product) => [product.name, product.collectionId as string]),
  );
  const sizeGuideImages = await uploadSizeGuideImages();

  const parsePrice = (product: SourceProduct) => {
    const formatted = product.price?.amount;
    if (typeof formatted === "number" && formatted > 0 && formatted < 10000000) {
      return formatted;
    }

    const text = product.price?.formatted ?? "";
    const match = text.match(/([0-9][0-9,\.]*)\s*VND/);
    if (match !== null && match[1] !== undefined) {
      return Number(match[1].replace(/,/g, ""));
    }

    return 2400000;
  };

  const groupedProducts: Record<string, GroupedProduct> = {};

  for (const product of source.products) {
    const baseName = toBaseName(product.name);
    const slugBase = product.slug;
    const normalizedCollectionName = normalizeCollectionName(product.collection);
    const collectionKey = normalizedCollectionName.replace(/\s+/g, "-");
    const matchingCollection =
      collectionByName.get(normalizedCollectionName) ??
      collectionBySlug.get(collectionKey);
    const fallbackCollectionId = existingCollectionIdByName.get(baseName);

    if (matchingCollection === undefined && fallbackCollectionId === undefined) {
      throw new Error(`Missing collection mapping for product: ${product.name}`);
    }

    const productFolder = path.join(imagesRoot, product.slug);
    if (fs.existsSync(productFolder) === false) {
      throw new Error(`Missing image folder for slug: ${product.slug}`);
    }

    const cloudinaryImages = await uploadFolderImages(productFolder, `MyProject/${product.slug}`);
    const price = parsePrice(product);
    const color = normalizeColorFromName(product.slug.replace(/^.*?-sunglasses-/, "").replace(/-/g, " "));

    const variants: NormalizedVariant[] = [
      {
        sku: product.slug,
        color,
        price,
        images: cloudinaryImages,
        isDefault: true,
        stock: getRandomStock(),
      },
    ];

    if (groupedProducts[baseName] === undefined) {
      groupedProducts[baseName] = {
        name: baseName,
        slug: toBaseSlug(baseName),
        brand: product.vendor ?? "SEESONvn",
        availability: product.availability ?? "in_stock",
        type: product.type ?? "Sunglasses",
        description: product.description ?? "",
        specifications: {
          gender: "Unisex",
          frameType: {
            material: getFrameType(baseName).material,
            size: {
              label: getFrameType(baseName).size,
              image: pickRandomItem(sizeGuideImages[getFrameType(baseName).size]),
            },
          },
        },
        variants: [],
        rating: {
          avg: 0,
          count: 0,
        },
        isActive: true,
        collectionId: matchingCollection?._id ?? fallbackCollectionId ?? "",
        salePercent: product.sale === true ? getRandomSalePercent() : 0,
      };
    }

    groupedProducts[baseName].variants.push(...variants);
  }

  const normalizedProducts = Object.values(groupedProducts).map((product) => {
    const sortedVariants = [...product.variants].sort((left, right) =>
      left.sku.localeCompare(right.sku),
    );

    return {
      ...product,
      variants: sortedVariants.map((variant, index) => ({
        ...variant,
        isDefault: index === 0,
      })),
    };
  });

  assignGenderBySplit(normalizedProducts);

  fs.writeFileSync(outputPath, JSON.stringify(normalizedProducts, null, 2));
  console.log(`✅ Normalized sunglasses saved to ${outputPath}`);
};

seedDatabase().catch((error: unknown) => {
  console.error("❌ Error normalizing sunglasses:", error);
  process.exit(1);
});
