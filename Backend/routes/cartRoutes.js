const router = require("express").Router();
const {
  getCart,
  addItem,
  updateItem,
  removeItem,
  clearCart,
} = require("../controllers/cartController");
const { verifyToken } = require("../middleware/authMiddleware");

// Every cart route needs a logged-in user
router.use(verifyToken);

router.get("/", getCart);
router.post("/items", addItem);                  // { productId, quantity }
router.patch("/items/:productId", updateItem);   // { quantity }
router.delete("/items/:productId", removeItem);
router.delete("/", clearCart);

module.exports = router;
