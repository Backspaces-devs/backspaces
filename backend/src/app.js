import express from "express";
import cors from "cors";
import routes from "./routes/index.js";
import { env } from "./config/env.js";
import { notFound, errorHandler } from "./middlewares/error.middleware.js";

const app = express();

// Only the configured frontend origins may call this API directly.
// (When the Next.js proxy is added later, browser calls go through the
// frontend's own origin anyway — this keeps direct dev access working too.)
app.use(cors({ origin: env.corsOrigins }));
app.use(express.json());

app.use(routes);

app.use(notFound);
app.use(errorHandler);

export default app;
