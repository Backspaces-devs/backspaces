import { Router } from "express";
import {
  listRevision,
  createRevision,
  reviewRevision,
  removeRevision,
  getSheetProgress,
  updateSheetProgress,
} from "../controllers/practice.controller.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// Problem Solving page: spaced-repetition queue + DSA sheet progress.
const router = Router();

router.get("/revision", asyncHandler(listRevision));
router.post("/revision", asyncHandler(createRevision));
router.post("/revision/:id/review", asyncHandler(reviewRevision));
router.delete("/revision/:id", asyncHandler(removeRevision));

router.get("/sheets/progress", asyncHandler(getSheetProgress));
router.put("/sheets/progress", asyncHandler(updateSheetProgress));

export default router;
