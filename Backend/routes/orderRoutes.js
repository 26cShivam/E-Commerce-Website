const router = require("express").Router();
const {
  createOrder,
  getMyOrders,
  getMyOrder,
  cancelMyOrder,
  getAllOrders,
  updateOrderStatus,
} = require("../controllers/orderController");
const { verifyToken, isAdmin } = require("../middleware/authMiddleware");

// Every order route needs a logged-in user
router.use(verifyToken);

router.post("/", createOrder);                     // { name, phone, address, note }
router.get("/mine", getMyOrders);
router.get("/mine/:id", getMyOrder);
router.patch("/mine/:id/cancel", cancelMyOrder);

// Admin
router.get("/", isAdmin, getAllOrders);            // ?status=
router.patch("/:id/status", isAdmin, updateOrderStatus); // { status }

module.exports = router;
