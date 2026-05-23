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
const outputPath = path.resolve(
  __dirname,
  "../../season_data/sunglasses-normalized.json",
);

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

  const collectionByName = new Map(collectionsData.map((collection) => [collection.name.toLowerCase(), collection]));
  const collectionBySlug = new Map(collectionsData.map((collection) => [collection.slug, collection]));

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

  const normalizedProducts = [] as Array<Record<string, unknown>>;

  for (const product of source.products) {
    const baseName = toBaseName(product.name);
    const slugBase = product.slug;
    const collectionKey = (product.collection ?? "").toLowerCase().replace(/\s+/g, "-");
    const matchingCollection =
      collectionByName.get((product.collection ?? "").toLowerCase()) ??
      collectionBySlug.get(collectionKey);

    if (matchingCollection === undefined) {
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

    normalizedProducts.push({
      name: baseName,
      slug: slugBase,
      brand: product.vendor ?? "SEESONvn",
      availability: product.availability ?? "in_stock",
      type: product.type ?? "Sunglasses",
      description: product.description ?? "",
      specifications: {
        gender: "Unisex",
      },
      variants,
      rating: {
        avg: 0,
        count: 0,
      },
      isActive: true,
      collectionId: matchingCollection._id,
      salePercent: product.sale === true ? getRandomSalePercent() : 0,
    });
  }

  assignGenderBySplit(
    normalizedProducts as Array<{ slug: string; specifications: { gender: string } }>,
  );

  fs.writeFileSync(outputPath, JSON.stringify(normalizedProducts, null, 2));
  console.log(`✅ Normalized sunglasses saved to ${outputPath}`);
};

seedDatabase().catch((error: unknown) => {
  console.error("❌ Error normalizing sunglasses:", error);
  process.exit(1);
});
