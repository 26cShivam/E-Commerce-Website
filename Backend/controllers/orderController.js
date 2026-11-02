const mongoose = require("mongoose");
const Cart = require("../models/Cart");
const Order = require("../models/Order");
const { ORDER_STATUSES } = Order;

const fail = (res, status, message) =>
  res.status(status).json({ success: false, message });

const serverError = (res, label, error) => {
  console.error(label, error);
  res.status(500).json({ success: false, message: "Server error" });
};

// PD-YYMMDD-NNNN. Random digits, so a clash is possible but rare: the caller
// retries when the unique index rejects a number.
const makeOrderNumber = () => {
  const d = new Date();
  const date = [d.getFullYear() % 100, d.getMonth() + 1, d.getDate()]
    .map((n) => String(n).padStart(2, "0"))
    .join("");
  const rand = String(Math.floor(1000 + Math.random() * 9000));
  return `PD-${date}-${rand}`;
};

const createWithUniqueNumber = async (data) => {
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      return await Order.create({ ...data, orderNumber: makeOrderNumber() });
    } catch (error) {
      // 11000 = duplicate key; only retry when it is the order number
      if (error.code !== 11000 || !error.keyPattern?.orderNumber) throw error;
    }
  }
  throw new Error("Could not generate a unique order number");
};

/* ===============================
   PLACE ORDER FROM CART  { name, phone, address, note? }
   No payment: we call the customer to confirm. Prices and the total are
   taken from the products here, never from the browser.
================================ */
exports.createOrder = async (req, res) => {
  try {
    const name = String(req.body.name ?? "").trim();
    const phone = String(req.body.phone ?? "").trim();
    const address = String(req.body.address ?? "").trim();
    const note = String(req.body.note ?? "").trim();

    /* ---------- Validation ---------- */
    if (!name || !phone || !address) {
      return fail(res, 400, "Name, phone and address are required");
    }
    if (name.length > 100) return fail(res, 400, "Name is too long");

    const digits = phone.replace(/\D/g, "");
    if (digits.length < 10 || digits.length > 13) {
      return fail(res, 400, "Enter a valid phone number");
    }

    if (address.length < 10) {
      return fail(res, 400, "Please enter your full delivery address");
    }
    if (address.length > 500 || note.length > 500) {
      return fail(res, 400, "Address and note must be under 500 characters");
    }

    /* ---------- Cart must be non-empty and fully orderable ---------- */
    const cart = await Cart.findOne({ user: req.user.userId }).populate(
      "items.product",
      "title slug category image price status isActive"
    );

    // Deleted products are ignored, the same way the cart page ignores them
    const lines = (cart?.items || []).filter(
      (item) => item.product && item.product.isActive !== false
    );

    if (lines.length === 0) return fail(res, 400, "Your cart is empty");

    const soldOut = lines.filter((i) => i.product.status === "out_of_stock");
    if (soldOut.length > 0) {
      return fail(
        res,
        400,
        `Out of stock: ${soldOut.map((i) => i.product.title).join(", ")}. Please remove it from your cart.`
      );
    }

    const items = lines.map(({ product, quantity }) => ({
      product: product._id,
      title: product.title,
      slug: product.slug,
      category: product.category,
      image: product.image,
      price: product.price,
      quantity,
    }));
    const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

    /* ---------- Save, then empty the cart ---------- */
    const order = await createWithUniqueNumber({
      user: req.user.userId,
      items,
      total,
      customer: { name, phone, address },
      note,
      statusHistory: [{ status: "placed" }],
    });

    cart.items = [];
    await cart.save();

    res.status(201).json({
      success: true,
      message: "Order placed. We will call you to confirm it.",
      data: order,
    });
  } catch (error) {
    serverError(res, "CREATE ORDER ERROR:", error);
  }
};

/* ===============================
   ALL ORDERS (ADMIN, newest first)
   ?status=placed|confirmed|delivered|cancelled  (default: all)
================================ */
exports.getAllOrders = async (req, res) => {
  try {
    const { status } = req.query;
    if (status && !ORDER_STATUSES.includes(status)) {
      return fail(res, 400, "Invalid status");
    }

    const orders = await Order.find(status ? { status } : {})
      .populate("user", "email")
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({ success: true, count: orders.length, data: orders });
  } catch (error) {
    serverError(res, "GET ALL ORDERS ERROR:", error);
  }
};

/* ===============================
   SET ORDER STATUS (ADMIN)  { status }
   Allowed moves only: placed -> confirmed, confirmed -> delivered, and
   cancelling while placed or confirmed. Delivered and cancelled are final.
================================ */
const NEXT_STATUSES = {
  placed: ["confirmed", "cancelled"],
  confirmed: ["delivered", "cancelled"],
  delivered: [],
  cancelled: [],
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!mongoose.isValidObjectId(req.params.id)) {
      return fail(res, 400, "Invalid order id");
    }
    if (!ORDER_STATUSES.includes(status)) return fail(res, 400, "Invalid status");

    const current = await Order.findById(req.params.id).select("status").lean();
    if (!current) return fail(res, 404, "Order not found");

    if (!NEXT_STATUSES[current.status].includes(status)) {
      return fail(res, 400, `A ${current.status} order cannot be changed to ${status}`);
    }

    // Conditional on the status we just read, so two admins (or the
    // customer cancelling) can't both apply a move to the same order
    const order = await Order.findOneAndUpdate(
      { _id: req.params.id, status: current.status },
      {
        $set: { status },
        $push: { statusHistory: { status, at: new Date() } },
      },
      { returnDocument: "after" }
    )
      .populate("user", "email")
      .lean();

    if (!order) {
      return fail(res, 409, "This order was just changed. Reload and try again.");
    }

    res.status(200).json({ success: true, message: `Order ${status}`, data: order });
  } catch (error) {
    serverError(res, "UPDATE ORDER STATUS ERROR:", error);
  }
};

/* ===============================
   MY ORDERS (newest first)
================================ */
exports.getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user.userId })
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({ success: true, count: orders.length, data: orders });
  } catch (error) {
    serverError(res, "GET MY ORDERS ERROR:", error);
  }
};

/* ===============================
   ONE OF MY ORDERS
================================ */
exports.getMyOrder = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return fail(res, 400, "Invalid order id");
    }

    // Filtering by user means nobody can open someone else's order
    const order = await Order.findOne({
      _id: req.params.id,
      user: req.user.userId,
    }).lean();
    if (!order) return fail(res, 404, "Order not found");

    res.status(200).json({ success: true, data: order });
  } catch (error) {
    serverError(res, "GET MY ORDER ERROR:", error);
  }
};

/* ===============================
   CANCEL MY ORDER
   Only while it is still "placed". After we have confirmed it by phone,
   changes go through us.
================================ */
exports.cancelMyOrder = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return fail(res, 400, "Invalid order id");
    }

    // One conditional update, so a simultaneous confirm can't be overwritten
    const order = await Order.findOneAndUpdate(
      { _id: req.params.id, user: req.user.userId, status: "placed" },
      {
        $set: { status: "cancelled" },
        $push: { statusHistory: { status: "cancelled", at: new Date() } },
      },
      { returnDocument: "after" }
    );

    if (!order) {
      const exists = await Order.exists({
        _id: req.params.id,
        user: req.user.userId,
      });
      return exists
        ? fail(res, 400, "This order can no longer be cancelled here. Please call us.")
        : fail(res, 404, "Order not found");
    }

    res.status(200).json({ success: true, message: "Order cancelled", data: order });
  } catch (error) {
    serverError(res, "CANCEL ORDER ERROR:", error);
  }
};
