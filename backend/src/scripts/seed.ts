import mongoose from "mongoose";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import { Collection } from "../models/Collection.js";
import { Eyeglasses } from "../models/Eyeglasses.js";
import { Sunglasses } from "../models/Sunglasses.js";

dotenv.config({ path: path.resolve(process.cwd(), ".env.backend") });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const seedDatabase = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (mongoUri === undefined || mongoUri === "") {
      throw new Error("Please provide a MongoDB URI in .env.backend");
    }

    await mongoose.connect(mongoUri);
    console.log("✅ Connected to MongoDB");

    // 1. Read the normalized JSON files
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

    const collections = JSON.parse(collectionsRaw);
    const sunglasses = JSON.parse(sunglassesRaw);
    const eyeglasses = JSON.parse(eyeglassesRaw);
    const uniqueSunglasses = Array.from(
      new Map(sunglasses.map((product: { slug: string }) => [product.slug, product])).values(),
    );
    const uniqueEyeglasses = Array.from(
      new Map(eyeglasses.map((product: { slug: string }) => [product.slug, product])).values(),
    );

    // 2. Clear entire database (drop all schemas and data)
    if (mongoose.connection.db) {
      await mongoose.connection.db.dropDatabase();
      console.log(
        "Completely dropped the database (all schemas and data cleared)",
      );
    } else {
      console.log("Could not drop database: connection.db is undefined");
    }

    // 3. Insert the normalized data
    await Collection.insertMany(collections);
    console.log(`Successfully seeded ${collections.length} collections!`);

    await Sunglasses.insertMany(uniqueSunglasses);
    console.log(`Successfully seeded ${uniqueSunglasses.length} sunglasses!`);

    await Eyeglasses.insertMany(uniqueEyeglasses);
    console.log(`Successfully seeded ${uniqueEyeglasses.length} eyeglasses!`);

    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  }
};

seedDatabase();
