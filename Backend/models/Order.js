const mongoose = require("mongoose");

// placed    - customer placed it, we still need to call and confirm
// confirmed - confirmed with the customer by phone
// delivered - handed over
// cancelled - cancelled by the customer or by us
const ORDER_STATUSES = ["placed", "confirmed", "delivered", "cancelled"];

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Shown to the customer and read out on the phone, e.g. PD-241102-4821
    orderNumber: { type: String, required: true, unique: true },

    // A copy of each product as it was when ordered, so later edits or
    // deletes of the product never change an old order
    items: [
      {
        _id: false,
        product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
        title: { type: String, required: true },
        slug: String,
        category: String,
        image: String,
        price: { type: Number, required: true },
        quantity: { type: Number, required: true, min: 1 },
      },
    ],

    total: { type: Number, required: true },

    customer: {
      name: { type: String, required: true },
      phone: { type: String, required: true },
      address: { type: String, required: true },
    },

    note: { type: String, default: "" },

    status: { type: String, enum: ORDER_STATUSES, default: "placed" },

    statusHistory: [
      {
        _id: false,
        status: { type: String, enum: ORDER_STATUSES },
        at: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

orderSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model("Order", orderSchema);
module.exports.ORDER_STATUSES = ORDER_STATUSES;
