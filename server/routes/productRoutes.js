import express from "express";
import {
  createProduct,
  fetchAllProducts,
  updateProduct,
  deleteProduct,
  fetchSingleProduct,
  postProductReview,
  deleteReview,
  fetchAIFilteredProducts,
} from "../controllers/productController.js";
import {
  authorizedRoles,
  isAuthenticated,
} from "../middlewares/authMiddleware.js";


const router = express.Router();

router.put(
  "/admin/create",
  isAuthenticated,
  authorizedRoles("Admin"),
  createProduct
);
router.get("/", fetchAllProducts);
router.get("/singleProduct/:productId", fetchSingleProduct);
router.put("/post-new/review/:productId", isAuthenticated, postProductReview);
router.delete("/delete/review/:productId", isAuthenticated, deleteReview);
router.put(
  "/admin/update/:productId",
  isAuthenticated,
  authorizedRoles("Admin"),
  updateProduct
);
// Debug endpoint (no auth) to reproduce request body/validation issues during development
router.put("/admin/debug-update/:productId", updateProduct);
router.delete( 
  "/admin/delete/:productId",
  isAuthenticated,
  authorizedRoles("Admin"),
  deleteProduct
);
router.post("/ai-search", isAuthenticated, fetchAIFilteredProducts);
// Debug route: allow unauthenticated requests for testing AI search
router.post("/ai-search-debug", fetchAIFilteredProducts);

export default router;