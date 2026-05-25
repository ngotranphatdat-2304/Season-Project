import { connectDB } from "./database.js";
import { assertRuntimeConfig, PORT } from "./config/constants.js";
import app from "./app.js";

const startServer = async () => {
  try {
    assertRuntimeConfig();
    await connectDB();
    const server = app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
    server.on("error", (error) => {
      console.log("ERROR", error);
      throw error;
    });
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
};

startServer();
