"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Loader from "@/components/Loader";
import { adminFetch } from "@/lib/adminApi";
import { isActive } from "@/lib/adminOptions";

const countByStatus = (items) => {
  const active = items.filter(isActive).length;
  return { active, deleted: items.length - active };
};

function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      adminFetch("/products/admin"),
      adminFetch("/videos/admin"),
      adminFetch("/orders"),
    ])
      .then(([products, videos, orders]) =>
        setStats({
          products: countByStatus(products.data),
          videos: countByStatus(videos.data),
          orders: {
            new: orders.data.filter((o) => o.status === "placed").length,
            confirmed: orders.data.filter((o) => o.status === "confirmed").length,
            total: orders.data.length,
          },
        })
      )
      .catch((err) => setError(err.message));
  }, []);

  if (error) return <div className="adm-empty"><p>{error}</p></div>;
  if (!stats) return <Loader />;

  const sections = [
    ["Products", stats.products, "/admin/products", "/admin/add-product", "+ Add Product"],
    ["Videos", stats.videos, "/admin/videos", "/admin/add-video", "+ Upload Video"],
  ];

  return (
    <div className="adm-dash">
      <div className="adm-page-head">
        <h1>Dashboard</h1>
      </div>

      <div className="adm-dash-grid">
        <section className="adm-dash-card">
          <h2>Orders</h2>
          <p className={`adm-dash-count ${stats.orders.new > 0 ? "is-alert" : ""}`}>
            {stats.orders.new}
          </p>
          <p className="adm-dash-sub">
            new, waiting for your call · {stats.orders.confirmed} confirmed ·{" "}
            {stats.orders.total} total
          </p>
          <div className="adm-actions">
            <Link href="/admin/orders" className="adm-btn adm-btn-primary">Manage Orders</Link>
          </div>
        </section>

        {sections.map(([title, counts, listHref, addHref, addLabel]) => (
          <section key={title} className="adm-dash-card">
            <h2>{title}</h2>
            <p className="adm-dash-count">{counts.active}</p>
            <p className="adm-dash-sub">
              live on site{counts.deleted > 0 && ` · ${counts.deleted} deleted`}
            </p>
            <div className="adm-actions">
              <Link href={listHref} className="adm-btn">Manage</Link>
              <Link href={addHref} className="adm-btn adm-btn-primary">{addLabel}</Link>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

export default AdminDashboard;
