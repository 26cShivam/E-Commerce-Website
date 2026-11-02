const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    title: String,
    slug: { type: String, unique: true },
    price: Number,
    category: String, // indoor, outdoor, event, club, wedding, stage, birthday, fog, cracker
    image: String,

    technical: {
      availability: String,
      delivery: String,
      safety: String,
      spark: String,
      burnTime: String,
      sparkHeight: String,
      smoke: String,
    },

    // Whether the product can be bought. Products created before this field
    // existed have no status and count as available.
    status: {
      type: String,
      enum: ["available", "out_of_stock"],
      default: "available",
    },

    // Soft delete: hidden from the site when false, restorable by admin
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

productSchema.index({ category: 1, createdAt: -1 });

module.exports = mongoose.model("Product", productSchema);
