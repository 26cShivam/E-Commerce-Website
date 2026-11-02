const mongoose = require("mongoose");
const Product = require("../models/Product");
const cloudinary = require("../config/cloudinary");
const { destroyAsset } = require("../utils/cloudinaryAsset");

// Products created before soft delete have no isActive field, so match
// "not false" rather than "true"
const ACTIVE = { isActive: { $ne: false } };

const TECHNICAL_FIELDS = [
  "availability",
  "delivery",
  "safety",
  "spark",
  "burnTime",
  "sparkHeight",
  "smoke",
];

const STATUSES = ["available", "out_of_stock"];

/* ---------- Unique Slug ---------- */
const makeUniqueSlug = async (title, excludeId) => {
  const baseSlug = title.toLowerCase().trim().replace(/\s+/g, "-");
  let slug = baseSlug;
  let count = 1;

  const others = excludeId ? { _id: { $ne: excludeId } } : {};
  while (await Product.exists({ ...others, slug })) {
    slug = `${baseSlug}-${count++}`;
  }
  return slug;
};

/* ===============================
   GET PRODUCTS (CATEGORY FILTER)
================================ */
exports.getProducts = async (req, res) => {
  try {
    const { category } = req.query;
    const filter = category ? { ...ACTIVE, category } : ACTIVE;
    const products = await Product.find(filter).sort({ createdAt: -1 }).lean();

    res.status(200).json({
      success: true,
      count: products.length,
      data: products,
    });
  } catch (error) {
    console.error("GET PRODUCTS ERROR:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* ===============================
   GET PRODUCT BY SLUG
================================ */
exports.getProductBySlug = async (req, res) => {
  try {
    const product = await Product.findOne({ ...ACTIVE, slug: req.params.slug });

    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    res.status(200).json({ success: true, data: product });
  } catch (error) {
    console.error("GET PRODUCT BY SLUG ERROR:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* ===============================
   HOME PAGE GROUPED PRODUCTS
   (OPTIMIZED WITH Promise.all)
================================ */
exports.getHomeProducts = async (req, res) => {
  try {
    const categories = [
      "mostSearched",
      "smokeless",
      "event",
      "club",
      "wedding",
      "stage",
      "birthday",
      "fog",
    ];

    const queries = categories.map((cat) =>
      Product.find({ ...ACTIVE, category: cat }).sort({ createdAt: -1 }).lean()
    );

    const results = await Promise.all(queries);

    const response = {};
    categories.forEach((cat, index) => {
      response[cat] = results[index];
    });

    res.set("Cache-Control", "public, max-age=60");
    res.status(200).json({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error("HOME PRODUCTS ERROR:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* ===============================
   CREATE PRODUCT (ADMIN)
================================ */
exports.createProduct = async (req, res) => {
  try {
    const {
      title,
      price,
      category,
      status,
      availability,
      delivery,
      safety,
      spark,
      burnTime,
      sparkHeight,
      smoke,
    } = req.body;

    /* ---------- Validation ---------- */
    if (!title || !price || !category) {
      return res.status(400).json({
        success: false,
        message: "Title, price and category are required",
      });
    }

    if (isNaN(price)) {
      return res.status(400).json({
        success: false,
        message: "Price must be a number",
      });
    }

    if (status && !STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be available or out_of_stock",
      });
    }

    const slug = await makeUniqueSlug(title);

    /* ---------- Image Upload ---------- */
    let imageUrl = "";
    if (req.files?.image) {
      const imageFile = req.files.image;

      const uploadResult = await cloudinary.uploader.upload(
        imageFile.tempFilePath,
        { folder: "pyro/products" }
      );

      imageUrl = uploadResult.secure_url;
    }

    /* ---------- Save Product ---------- */
    const product = await Product.create({
      title: title.trim(),
      slug,
      price,
      category,
      status: status || "available",
      image: imageUrl,
      technical: {
        availability,
        delivery,
        safety,
        spark,
        burnTime,
        sparkHeight,
        smoke,
      },
    });

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      data: product,
    });
  } catch (error) {
    console.error("CREATE PRODUCT ERROR:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* ===============================
   GET ALL PRODUCTS (ADMIN)
   ?category=  ?status=active|inactive  (default: all)
================================ */
exports.getAdminProducts = async (req, res) => {
  try {
    const { category, status } = req.query;
    const filter = {};
    if (category) filter.category = category;
    if (status === "active") Object.assign(filter, ACTIVE);
    if (status === "inactive") filter.isActive = false;

    const products = await Product.find(filter).sort({ createdAt: -1 }).lean();

    res.status(200).json({
      success: true,
      count: products.length,
      data: products,
    });
  } catch (error) {
    console.error("ADMIN GET PRODUCTS ERROR:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* ===============================
   GET PRODUCT BY ID (ADMIN)
================================ */
exports.getProductById = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid product id" });
    }

    const product = await Product.findById(req.params.id).lean();
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    res.status(200).json({ success: true, data: product });
  } catch (error) {
    console.error("GET PRODUCT BY ID ERROR:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* ===============================
   UPDATE PRODUCT (ADMIN)
   Only fields that are sent get updated. The slug stays the same (so
   existing links keep working) unless regenerateSlug=true is sent.
================================ */
exports.updateProduct = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid product id" });
    }

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    const { title, price, category, status, regenerateSlug } = req.body;

    /* ---------- Validation ---------- */
    if (title !== undefined && !title.trim()) {
      return res
        .status(400)
        .json({ success: false, message: "Title cannot be empty" });
    }

    if (price !== undefined && (price === "" || isNaN(price))) {
      return res
        .status(400)
        .json({ success: false, message: "Price must be a number" });
    }

    if (category !== undefined && !category.trim()) {
      return res
        .status(400)
        .json({ success: false, message: "Category cannot be empty" });
    }

    if (status !== undefined && !STATUSES.includes(status)) {
      return res
        .status(400)
        .json({ success: false, message: "Status must be available or out_of_stock" });
    }

    /* ---------- Apply Changes ---------- */
    if (title !== undefined) product.title = title.trim();
    if (price !== undefined) product.price = price;
    if (category !== undefined) product.category = category;
    if (status !== undefined) product.status = status;

    TECHNICAL_FIELDS.forEach((field) => {
      if (req.body[field] !== undefined) {
        product.set(`technical.${field}`, req.body[field]);
      }
    });

    if (regenerateSlug === true || regenerateSlug === "true") {
      product.slug = await makeUniqueSlug(product.title, product._id);
    }

    /* ---------- Image Replace ---------- */
    const oldImage = product.image;
    if (req.files?.image) {
      const uploadResult = await cloudinary.uploader.upload(
        req.files.image.tempFilePath,
        { folder: "pyro/products" }
      );
      product.image = uploadResult.secure_url;
    }

    await product.save();

    // Remove the old image only after the new one is saved
    if (req.files?.image && oldImage) await destroyAsset(oldImage);

    res.status(200).json({
      success: true,
      message: "Product updated successfully",
      data: product,
    });
  } catch (error) {
    console.error("UPDATE PRODUCT ERROR:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* ===============================
   SET PRODUCT STATUS (ADMIN)
   Quick available / out_of_stock switch from the product list
================================ */
exports.setProductStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!mongoose.isValidObjectId(req.params.id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid product id" });
    }

    if (!STATUSES.includes(status)) {
      return res
        .status(400)
        .json({ success: false, message: "Status must be available or out_of_stock" });
    }

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { status },
      { returnDocument: "after" }
    );
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    res.status(200).json({
      success: true,
      message: status === "available" ? "Marked as available" : "Marked as out of stock",
      data: product,
    });
  } catch (error) {
    console.error("SET PRODUCT STATUS ERROR:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* ===============================
   DELETE / RESTORE PRODUCT (ADMIN)
   Soft delete: the product and its image are kept
================================ */
const setProductActive = (isActive) => async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid product id" });
    }

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { isActive },
      { returnDocument: "after" }
    );
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    res.status(200).json({
      success: true,
      message: isActive ? "Product restored" : "Product deleted",
      data: product,
    });
  } catch (error) {
    console.error("SET PRODUCT ACTIVE ERROR:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.deleteProduct = setProductActive(false);
exports.restoreProduct = setProductActive(true);
