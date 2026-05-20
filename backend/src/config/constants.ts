import dotenv from "dotenv";

dotenv.config({ path: "./.env.backend" });

export const DB_URI = process.env.MONGO_URI;
export const PORT = process.env.PORT || 3001;
export const DB_NAME = process.env.MONGO_DB;
