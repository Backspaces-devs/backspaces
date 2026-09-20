import { Router } from "express";
import { listNews, getNewsItem } from "../controllers/news.controller.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.get("/news", asyncHandler(listNews));
router.get("/news/:id", asyncHandler(getNewsItem));

export default router;
