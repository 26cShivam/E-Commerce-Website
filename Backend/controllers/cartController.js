const mongoose = require("mongoose");
const Cart = require("../models/Cart");
const Product = require("../models/Product");

const MAX_QTY = 100;

// Same "not false" match as the product list: older products have no isActive
const isVisible = (product) => product && product.isActive !== false;
const isBuyable = (product) =>
  isVisible(product) && product.status !== "out_of_stock";

const validQuantity = (q) => Number.isInteger(q) && q >= 1 && q <= MAX_QTY;

/* ---------- Cart as the website needs it ----------
   Deleted products are left out. Out-of-stock products stay in the cart
   (marked available: false) so the customer can see and remove them, but
   they are not counted in the total. */
const shapeCart = (cart) => {
  const items = (cart?.items || [])
    .filter((item) => isVisible(item.product))
    .map(({ product, quantity }) => {
      const available = isBuyable(product);
      return {
        productId: product._id,
        title: product.title,
        slug: product.slug,
        category: product.category,
        image: product.image,
        price: product.price,
        quantity,
        available,
        lineTotal: available ? product.price * quantity : 0,
      };
    });

  return {
    items,
    count: items.reduce((sum, item) => sum + item.quantity, 0),
    total: items.reduce((sum, item) => sum + item.lineTotal, 0),
  };
};

const sendCart = async (res, userId, message, status = 200) => {
  const cart = await Cart.findOne({ user: userId })
    .populate("items.product", "title slug category image price status isActive")
    .lean();

  res.status(status).json({ success: true, message, data: shapeCart(cart) });
};

const fail = (res, status, message) =>
  res.status(status).json({ success: false, message });

const serverError = (res, label, error) => {
  console.error(label, error);
  res.status(500).json({ success: false, message: "Server error" });
};

/* ===============================
   GET CART
================================ */
exports.getCart = async (req, res) => {
  try {
    await sendCart(res, req.user.userId);
  } catch (error) {
    serverError(res, "GET CART ERROR:", error);
  }
};

/* ===============================
   ADD ITEM  { productId, quantity = 1 }
   Adding a product already in the cart increases its quantity
================================ */
exports.addItem = async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;

    if (!mongoose.isValidObjectId(productId)) {
      return fail(res, 400, "Invalid product id");
    }
    if (!validQuantity(quantity)) {
      return fail(res, 400, `Quantity must be a whole number from 1 to ${MAX_QTY}`);
    }

    const product = await Product.findById(productId).lean();
    if (!isVisible(product)) return fail(res, 404, "Product not found");
    if (!isBuyable(product)) return fail(res, 400, "This product is out of stock");

    const cart =
      (await Cart.findOne({ user: req.user.userId })) ||
      new Cart({ user: req.user.userId, items: [] });

    const existing = cart.items.find((i) => i.product.equals(productId));
    if (existing) {
      existing.quantity = Math.min(existing.quantity + quantity, MAX_QTY);
    } else {
      cart.items.push({ product: productId, quantity });
    }
    await cart.save();

    await sendCart(res, req.user.userId, "Added to cart", 201);
  } catch (error) {
    serverError(res, "ADD TO CART ERROR:", error);
  }
};

/* ===============================
   SET QUANTITY  { quantity }
================================ */
exports.updateItem = async (req, res) => {
  try {
    const { productId } = req.params;
    const { quantity } = req.body;

    if (!mongoose.isValidObjectId(productId)) {
      return fail(res, 400, "Invalid product id");
    }
    if (!validQuantity(quantity)) {
      return fail(res, 400, `Quantity must be a whole number from 1 to ${MAX_QTY}`);
    }

    const result = await Cart.updateOne(
      { user: req.user.userId, "items.product": productId },
      { $set: { "items.$.quantity": quantity } }
    );
    if (result.matchedCount === 0) return fail(res, 404, "Item not in cart");

    await sendCart(res, req.user.userId, "Cart updated");
  } catch (error) {
    serverError(res, "UPDATE CART ERROR:", error);
  }
};

/* ===============================
   REMOVE ITEM
================================ */
exports.removeItem = async (req, res) => {
  try {
    const { productId } = req.params;

    if (!mongoose.isValidObjectId(productId)) {
      return fail(res, 400, "Invalid product id");
    }

    await Cart.updateOne(
      { user: req.user.userId },
      { $pull: { items: { product: productId } } }
    );

    await sendCart(res, req.user.userId, "Removed from cart");
  } catch (error) {
    serverError(res, "REMOVE FROM CART ERROR:", error);
  }
};

/* ===============================
   CLEAR CART
================================ */
exports.clearCart = async (req, res) => {
  try {
    await Cart.updateOne({ user: req.user.userId }, { $set: { items: [] } });
    await sendCart(res, req.user.userId, "Cart cleared");
  } catch (error) {
    serverError(res, "CLEAR CART ERROR:", error);
  }
};
