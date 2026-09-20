import { Router } from "express";
import newsRoutes from "./news.routes.js";
import { health } from "../controllers/news.controller.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.get("/health", asyncHandler(health));
router.use("/api", newsRoutes);

export default router;
