import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import mongoose from "mongoose";
import { Collection } from "../models/collection.model.js";
import { Product } from "../models/product.model.js";

dotenv.config({ path: path.resolve(process.cwd(), ".env.backend") });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

type SeedCollection = {
  _id: string;
  name: string;
  slug: string;
  inStockCount: number;
};

type SeedProduct = {
  name: string;
  slug: string;
  collectionId?: string | null;
  availability: string;
};

const seedDatabase = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (mongoUri === undefined || mongoUri === "") {
      throw new Error("Please provide a MongoDB URI in .env.backend");
    }

    await mongoose.connect(mongoUri);
    console.log("✅ Connected to MongoDB");

    const collectionsPath = path.join(
      __dirname,
      "../../season_data/collections-normalized.json",
    );
    const sunglassesPath = path.join(
      __dirname,
      "../../season_data/sunglasses-normalized.json",
    );
    const eyeglassesPath = path.join(
      __dirname,
      "../../season_data/eyeglasses-normalized.json",
    );

    const collectionsRaw = fs.readFileSync(collectionsPath, "utf-8");
    const sunglassesRaw = fs.readFileSync(sunglassesPath, "utf-8");
    const eyeglassesRaw = fs.readFileSync(eyeglassesPath, "utf-8");

    const collections = JSON.parse(collectionsRaw) as SeedCollection[];
    const sunglasses = JSON.parse(sunglassesRaw) as SeedProduct[];
    const eyeglasses = JSON.parse(eyeglassesRaw) as SeedProduct[];
    const uniqueProducts = Array.from(
      new Map(
        [...sunglasses, ...eyeglasses].map((product: SeedProduct) => [
          product.slug,
          product,
        ]),
      ).values(),
    ) as SeedProduct[];

    for (const collection of collections) {
      collection.inStockCount = 0;
    }

    const collectionById = new Map(
      collections.map((collection) => [collection._id, collection]),
    );

    for (const product of uniqueProducts) {
      if (product.collectionId === undefined || product.collectionId === null) {
        throw new Error(`Missing normalized collectionId for ${product.name}`);
      }

      const collection = collectionById.get(product.collectionId);
      if (collection === undefined) {
        throw new Error(
          `Unknown collectionId ${product.collectionId} for ${product.name}`,
        );
      }

      if (product.availability === "in_stock") {
        collection.inStockCount += 1;
      }
    }

    if (mongoose.connection.db) {
      await mongoose.connection.db.dropDatabase();
      console.log(
        "Completely dropped the database (all schemas and data cleared)",
      );
    } else {
      console.log("Could not drop database: connection.db is undefined");
    }

    await Collection.insertMany(collections);
    console.log(`Successfully seeded ${collections.length} collections!`);

    await Product.insertMany(uniqueProducts);
    console.log(`Successfully seeded ${uniqueProducts.length} products!`);

    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  }
};

seedDatabase();
