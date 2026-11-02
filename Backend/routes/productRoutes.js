const router = require("express").Router();
const {
  getProducts,
  getProductBySlug,
  getHomeProducts,
  createProduct,
  getAdminProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  restoreProduct,
  setProductStatus,
} = require("../controllers/productController");

const {verifyToken,isAdmin} = require('../middleware/authMiddleware')

// Admin routes go before "/:slug" so "admin" isn't read as a slug
router.get("/admin", verifyToken, isAdmin, getAdminProducts);      // ?category= &status=
router.get("/admin/:id", verifyToken, isAdmin, getProductById);
router.post("/create", verifyToken, isAdmin, createProduct);
router.put("/:id", verifyToken, isAdmin, updateProduct);
router.delete("/:id", verifyToken, isAdmin, deleteProduct);        // soft delete
router.patch("/:id/status", verifyToken, isAdmin, setProductStatus); // { status }
router.patch("/:id/restore", verifyToken, isAdmin, restoreProduct);

router.get("/home", getHomeProducts);
router.get("/", getProducts);           // ?category=
router.get("/:slug", getProductBySlug); // ✅ single route


module.exports = router;
