import { Router } from "express";
import newsRoutes from "./news.routes.js";
import practiceRoutes from "./practice.routes.js";
import { health } from "../controllers/news.controller.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.get("/health", asyncHandler(health));
router.use("/api", newsRoutes);
router.use("/api", practiceRoutes);

export default router;
