"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Loader from "@/components/Loader";
import { useAuth } from "@/context/AuthContext";
import { fetchMyOrders, ORDER_STATUS_LABELS } from "@/lib/orderApi";

const rupees = (n) => `₹${n.toLocaleString("en-IN")}`;
const formatDate = (iso) =>
  new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

function OrdersView() {
  const router = useRouter();
  const { isAuth, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (authLoading) return;
    if (!isAuth) {
      router.replace("/login?redirect=/orders");
      return;
    }
    fetchMyOrders()
      .then((res) => setOrders(res.data))
      .catch((err) => setError(err.message));
  }, [authLoading, isAuth, router]);

  if (error) return <main className="ord-page"><p className="ord-error">{error}</p></main>;
  if (!orders) return <Loader />;

  return (
    <main className="ord-page">
      <h1>My Orders</h1>

      {orders.length === 0 ? (
        <div className="ord-empty">
          <p>You have not placed any orders yet.</p>
          <Link href="/" className="chk-btn">Continue shopping</Link>
        </div>
      ) : (
        <ul className="ord-list">
          {orders.map((o) => (
            <li key={o._id}>
              <Link href={`/orders/${o._id}`} className="ord-card">
                <div>
                  <strong>{o.orderNumber}</strong>
                  <span className="ord-meta">
                    {formatDate(o.createdAt)} · {o.items.length}{" "}
                    {o.items.length === 1 ? "item" : "items"}
                  </span>
                </div>
                <div className="ord-card-right">
                  <span className={`ord-status ord-status-${o.status}`}>
                    {ORDER_STATUS_LABELS[o.status]}
                  </span>
                  <strong>{rupees(o.total)}</strong>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

export default OrdersView;
