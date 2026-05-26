import cookieParser from "cookie-parser";
import cors from "cors";
import express, { type Request, type Response } from "express";
import authRouter from "./routes/auth.route.js";
import adminRouter from "./routes/admin.route.js";
import cartRouter from "./routes/cart.route.js";
import checkoutRouter from "./routes/checkout.route.js";
import collectionsRouter from "./routes/collections.route.js";
import ordersRouter from "./routes/orders.route.js";
import productsRouter from "./routes/products.route.js";
import usersRouter from "./routes/users.route.js";
import {
  globalErrorHandler,
  notFoundHandler,
} from "./middleware/error-handler.js";
import {
  ALLOWED_ORIGINS,
  IS_PRODUCTION,
} from "./config/constants.js";
import { setSecurityHeaders } from "./middleware/security-headers.js";

const app = express();

function isCorsOriginAllowed(origin: string | undefined): boolean {
  if (origin === undefined) {
    return true;
  }

  if (ALLOWED_ORIGINS.includes(origin) === true) {
    return true;
  }

  return IS_PRODUCTION === false && ALLOWED_ORIGINS.length === 0;
}

app.disable("x-powered-by");
app.use(setSecurityHeaders);

app.use(
  cors({
    origin(origin, callback) {
      callback(null, isCorsOriginAllowed(origin));
    },
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());

app.get("/", (_req: Request, res: Response) => {
  res.send("TypeScript Express Backend is running!");
});

app.get("/api", (_req: Request, res: Response) => {
  res.send("TypeScript Express Backend is running!");
});

app.use("/api/auth", authRouter);
app.use("/api/admin", adminRouter);
app.use("/api/cart", cartRouter);
app.use("/api/checkout", checkoutRouter);
app.use("/api/collections", collectionsRouter);
app.use("/api/orders", ordersRouter);
app.use("/api/products", productsRouter);
app.use("/api/users", usersRouter);

app.use(notFoundHandler);
app.use(globalErrorHandler);

export default app;
