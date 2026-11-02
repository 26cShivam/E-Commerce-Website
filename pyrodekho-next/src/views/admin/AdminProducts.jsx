"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import Loader from "@/components/Loader";
import { useConfirm } from "@/components/ConfirmDialog";
import optimizeImage from "@/utils/optimizeImage";
import { adminFetch, adminMutate } from "@/lib/adminApi";
import { PRODUCT_CATEGORIES, labelFor, isActive, isOutOfStock } from "@/lib/adminOptions";

const STATUS_TABS = [
  ["active", "Active"],
  ["deleted", "Deleted"],
  ["all", "All"],
];

const STOCK_FILTERS = [
  ["", "All stock"],
  ["available", "Available"],
  ["out_of_stock", "Out of stock"],
];

// The list from the server is already newest first
const SORTS = {
  newest: ["Newest first", null],
  "price-asc": ["Price: low to high", (a, b) => a.price - b.price],
  "price-desc": ["Price: high to low", (a, b) => b.price - a.price],
  title: ["Title: A to Z", (a, b) => (a.title || "").localeCompare(b.title || "")],
};

const PAGE_SIZE = 25;

const matchesStatus = (product, status) =>
  status === "all" || (status === "active") === isActive(product);

function AdminProducts() {
  const [products, setProducts] = useState(null);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("active");
  const [stock, setStock] = useState("");
  const [sort, setSort] = useState("newest");
  const [limit, setLimit] = useState(PAGE_SIZE);
  const [busyId, setBusyId] = useState(null);
  const { confirm, confirmDialog } = useConfirm();

  useEffect(() => {
    adminFetch("/products/admin")
      .then((res) => setProducts(res.data))
      .catch((err) => setError(err.message));
  }, []);

  if (error) return <div className="adm-empty"><p>{error}</p></div>;
  if (!products) return <Loader />;

  // Changing any filter or the sort starts again from the first page
  const onFilter = (setter) => (value) => {
    setter(value);
    setLimit(PAGE_SIZE);
  };

  const term = search.trim().toLowerCase();
  const filtered = products.filter(
    (p) =>
      matchesStatus(p, status) &&
      (!category || p.category === category) &&
      (!stock || (stock === "out_of_stock") === isOutOfStock(p)) &&
      (!term || p.title?.toLowerCase().includes(term))
  );
  const sorter = SORTS[sort][1];
  const visible = sorter ? [...filtered].sort(sorter) : filtered;
  const shown = visible.slice(0, limit);

  const outOfStockCount = products.filter((p) => isActive(p) && isOutOfStock(p)).length;

  // Soft delete or restore, then update the row in place
  const setActive = async (product, active) => {
    if (!active && !(await confirm({
      title: `Delete "${product.title}"?`,
      message: "It will be hidden from the site. You can restore it later from the Deleted tab.",
      confirmLabel: "Yes, delete",
    }))) {
      return;
    }

    setBusyId(product._id);
    try {
      const res = active
        ? await adminMutate(`/products/${product._id}/restore`, { method: "PATCH", refresh: "products" })
        : await adminMutate(`/products/${product._id}`, { method: "DELETE", refresh: "products" });

      setProducts((list) => list.map((p) => (p._id === product._id ? res.data : p)));
      toast.success(res.message);
    } catch (err) {
      toast.error(err.message || "Something went wrong ❌");
    } finally {
      setBusyId(null);
    }
  };

  // Flip available / out of stock, then update the row in place
  const toggleStock = async (product) => {
    const next = isOutOfStock(product) ? "available" : "out_of_stock";

    setBusyId(product._id);
    try {
      const res = await adminMutate(`/products/${product._id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: next }),
        headers: { "Content-Type": "application/json" },
        refresh: "products",
      });

      setProducts((list) => list.map((p) => (p._id === product._id ? res.data : p)));
      toast.success(`${product.title}: ${res.message.toLowerCase()}`);
    } catch (err) {
      toast.error(err.message || "Something went wrong ❌");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="adm-plist">
      {confirmDialog}
      <div className="adm-page-head">
        <h1>Products</h1>
        <Link href="/admin/add-product" className="adm-btn adm-btn-primary">+ Add Product</Link>
      </div>

      <div className="adm-tabs" role="tablist">
        {STATUS_TABS.map(([key, label]) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={status === key}
            className={`adm-tab ${status === key ? "active" : ""}`}
            onClick={() => onFilter(setStatus)(key)}
          >
            {label} ({products.filter((p) => matchesStatus(p, key)).length})
          </button>
        ))}
      </div>

      <div className="adm-toolbar">
        <input
          type="search"
          placeholder="Search by title..."
          aria-label="Search products"
          value={search}
          onChange={(e) => onFilter(setSearch)(e.target.value)}
        />
        <select
          aria-label="Filter by category"
          value={category}
          onChange={(e) => onFilter(setCategory)(e.target.value)}
        >
          <option value="">All categories</option>
          {PRODUCT_CATEGORIES.map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
        <select
          aria-label="Filter by stock"
          value={stock}
          onChange={(e) => onFilter(setStock)(e.target.value)}
        >
          {STOCK_FILTERS.map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
        <select
          aria-label="Sort products"
          value={sort}
          onChange={(e) => onFilter(setSort)(e.target.value)}
        >
          {Object.entries(SORTS).map(([key, [label]]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
      </div>

      <p className="adm-plist-summary">
        <span>
          Showing {shown.length} of {visible.length} products
        </span>
        {outOfStockCount > 0 && (
          <span className="is-warn">{outOfStockCount} out of stock</span>
        )}
      </p>

      {visible.length === 0 ? (
        <div className="adm-empty"><p>No products found.</p></div>
      ) : (
        <ul className="adm-plist-rows">
          <li className="adm-plist-row adm-plist-header" aria-hidden="true">
            <span>Image</span>
            <span>Title</span>
            <span>Category</span>
            <span>Price</span>
            <span>Stock</span>
            <span>Actions</span>
          </li>

          {shown.map((p) => {
            const active = isActive(p);
            const inStock = !isOutOfStock(p);
            return (
              <li key={p._id} className={`adm-plist-row ${active ? "" : "is-deleted"}`}>
                {p.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img className="adm-plist-img" src={optimizeImage(p.image, 160)} alt="" loading="lazy" />
                ) : (
                  <span className="adm-plist-img adm-plist-noimg">No image</span>
                )}

                <div className="adm-plist-title">
                  {active ? (
                    <a href={`/${p.category}/${p.slug}`} target="_blank" rel="noreferrer">{p.title}</a>
                  ) : (
                    <span>{p.title}</span>
                  )}
                  {!active && <span className="adm-badge">Deleted</span>}
                </div>

                <span className="adm-plist-cat">{labelFor(PRODUCT_CATEGORIES, p.category)}</span>
                <span className="adm-plist-price">₹{p.price}</span>

                <div className="adm-plist-stock">
                  {active ? (
                    <button
                      type="button"
                      role="switch"
                      aria-checked={inStock}
                      aria-label={`${p.title} stock`}
                      className="adm-switch"
                      disabled={busyId === p._id}
                      onClick={() => toggleStock(p)}
                    >
                      <span className="adm-switch-track" />
                      {inStock ? "In stock" : "Out of stock"}
                    </button>
                  ) : (
                    "—"
                  )}
                </div>

                <div className="adm-actions">
                  <Link href={`/admin/products/${p._id}/edit`} className="adm-btn">Edit</Link>
                  {active ? (
                    <button
                      type="button"
                      className="adm-btn adm-btn-danger"
                      disabled={busyId === p._id}
                      onClick={() => setActive(p, false)}
                    >
                      Delete
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="adm-btn adm-btn-success"
                      disabled={busyId === p._id}
                      onClick={() => setActive(p, true)}
                    >
                      Restore
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {visible.length > shown.length && (
        <div className="adm-plist-more">
          <button type="button" className="adm-btn" onClick={() => setLimit(limit + PAGE_SIZE)}>
            Show {Math.min(PAGE_SIZE, visible.length - shown.length)} more ({visible.length - shown.length} left)
          </button>
        </div>
      )}
    </div>
  );
}

export default AdminProducts;
