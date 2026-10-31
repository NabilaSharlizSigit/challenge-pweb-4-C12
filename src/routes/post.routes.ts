import { Router } from "express";
import {
  createPost,
  deletePost,
  getAllPosts,
  getPostById,
  updatePost,
  getDailyStats,
  bulkCreatePosts,
} from "../controllers/postController";

const router = Router();

router.post("/", createPost);
router.post("/bulk", bulkCreatePosts);

router.get("/", getAllPosts);
router.get("/stats/daily", getDailyStats);
router.get("/:id", getPostById);

router.patch("/:id", updatePost);
router.delete("/:id", deletePost);

export default router;