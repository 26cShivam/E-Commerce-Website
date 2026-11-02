"use client";

import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import optimizeImage from "@/utils/optimizeImage";
import { PRODUCT_CATEGORIES, PRODUCT_STATUSES, TECHNICAL_FIELDS } from "@/lib/adminOptions";

const EMPTY_FORM = {
  title: "",
  price: "",
  category: "",
  status: "available",
  ...Object.fromEntries(TECHNICAL_FIELDS.map(([key]) => [key, ""])),
};

const toForm = (product) =>
  product
    ? {
        title: product.title || "",
        price: product.price ?? "",
        category: product.category || "",
        status: product.status || "available",
        ...Object.fromEntries(
          TECHNICAL_FIELDS.map(([key]) => [key, product.technical?.[key] || ""])
        ),
      }
    : EMPTY_FORM;

// Shared by Add Product and Edit Product.
// product: existing product to edit (null when adding)
// onSubmit(formData): sends the request; throw to keep the form as is
function ProductForm({ product = null, heading, subheading, submitLabel, busyLabel, onSubmit }) {
  const isEdit = Boolean(product);
  const [form, setForm] = useState(() => toForm(product));
  const [image, setImage] = useState(null);
  const [regenerateSlug, setRegenerateSlug] = useState(false);
  const [loading, setLoading] = useState(false);
  // Changing the key clears the file input after a successful add
  const [fileKey, setFileKey] = useState(0);

  // Preview the newly picked file, else the current image
  const newImageUrl = useMemo(() => (image ? URL.createObjectURL(image) : null), [image]);
  useEffect(() => () => newImageUrl && URL.revokeObjectURL(newImageUrl), [newImageUrl]);
  const previewUrl = newImageUrl || optimizeImage(product?.image, 400);

  // Keep a category the dropdown doesn't know about (older products)
  const categories = PRODUCT_CATEGORIES.some(([key]) => key === form.category) || !form.category
    ? PRODUCT_CATEGORIES
    : [...PRODUCT_CATEGORIES, [form.category, form.category]];

  const titleChanged = isEdit && form.title.trim() !== product.title;

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.title.trim() || form.price === "" || !form.category) {
      toast.error("Title, price, and category are required ❗");
      return;
    }

    if (!isEdit && !image) {
      toast.error("Please upload a product image 🖼️");
      return;
    }

    setLoading(true);
    const fd = new FormData();
    Object.entries(form).forEach(([key, value]) => fd.append(key, value));
    if (image) fd.append("image", image);
    if (titleChanged && regenerateSlug) fd.append("regenerateSlug", "true");

    try {
      await onSubmit(fd);
      if (!isEdit) {
        setForm(EMPTY_FORM);
        setImage(null);
        setFileKey((k) => k + 1);
      }
    } catch {
      // onSubmit shows the error; keep what the admin typed
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-product-page">
      <form className="add-product-card" onSubmit={handleSubmit} noValidate>
        <h2 className="add-product-title">{heading}</h2>
        <p className="add-product-subtitle">{subheading}</p>

        <label htmlFor="pf-title">Title *</label>
        <input
          id="pf-title"
          name="title"
          value={form.title}
          onChange={handleChange}
          placeholder="Product title"
        />

        {titleChanged && (
          <label className="adm-pform-check">
            <input
              type="checkbox"
              checked={regenerateSlug}
              onChange={(e) => setRegenerateSlug(e.target.checked)}
            />
            <span>
              Also change the page URL to match the new title
              <small>Old links and Google results to /{product.slug} will stop working</small>
            </span>
          </label>
        )}

        <label htmlFor="pf-price">Price *</label>
        <input
          id="pf-price"
          name="price"
          type="number"
          min="0"
          inputMode="numeric"
          value={form.price}
          onChange={handleChange}
          placeholder="Price in ₹"
        />

        <label htmlFor="pf-category">Category *</label>
        <select id="pf-category" name="category" value={form.category} onChange={handleChange}>
          <option value="">Select category</option>
          {categories.map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>

        <label htmlFor="pf-status">Stock status</label>
        <select id="pf-status" name="status" value={form.status} onChange={handleChange}>
          {PRODUCT_STATUSES.map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>

        <div className="tech-grid">
          {TECHNICAL_FIELDS.map(([key, label]) => (
            <input
              key={key}
              name={key}
              placeholder={label}
              aria-label={label}
              value={form[key]}
              onChange={handleChange}
            />
          ))}
        </div>

        <label htmlFor="pf-image">
          Product Image {isEdit ? "(leave empty to keep current)" : "*"}
        </label>
        {previewUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="adm-pform-preview" src={previewUrl} alt="Product preview" />
        )}
        <input
          key={fileKey}
          id="pf-image"
          type="file"
          accept="image/*"
          onChange={(e) => setImage(e.target.files[0] || null)}
        />

        <button type="submit" disabled={loading}>
          {loading ? busyLabel : submitLabel}
        </button>
      </form>
    </div>
  );
}

export default ProductForm;
