"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import Loader from "@/components/Loader";
import { useConfirm } from "@/components/ConfirmDialog";
import { useAuth } from "@/context/AuthContext";
import { cancelMyOrder, fetchMyOrder, ORDER_STATUS_LABELS } from "@/lib/orderApi";

const rupees = (n) => `₹${n.toLocaleString("en-IN")}`;
const formatDateTime = (iso) =>
  new Date(iso).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

function OrderDetailView() {
  const { id } = useParams();
  const justPlaced = useSearchParams().get("placed") === "1";
  const router = useRouter();
  const { isAuth, loading: authLoading } = useAuth();

  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");
  const [cancelling, setCancelling] = useState(false);
  const { confirm, confirmDialog } = useConfirm();

  useEffect(() => {
    if (authLoading) return;
    if (!isAuth) {
      router.replace(`/login?redirect=/orders/${id}`);
      return;
    }
    fetchMyOrder(id)
      .then((res) => setOrder(res.data))
      .catch((err) => setError(err.message));
  }, [authLoading, isAuth, id, router]);

  if (error) {
    return (
      <main className="ord-page">
        <p className="ord-error">{error}</p>
        <Link href="/orders" className="chk-btn">My orders</Link>
      </main>
    );
  }
  if (!order) return <Loader />;

  const handleCancel = async () => {
    const ok = await confirm({
      title: `Cancel order ${order.orderNumber}?`,
      message: "Once cancelled, this order cannot be restored. You can place a new order any time.",
      confirmLabel: "Yes, cancel order",
      cancelLabel: "Keep order",
    });
    if (!ok) return;

    setCancelling(true);
    try {
      const res = await cancelMyOrder(order._id);
      setOrder(res.data);
      toast.success(res.message);
    } catch (err) {
      toast.error(err.message || "Could not cancel the order ❌");
    } finally {
      setCancelling(false);
    }
  };

  return (
    <main className="ord-page">
      {confirmDialog}
      {justPlaced && order.status === "placed" && (
        <div className="ord-success">
          <strong>Thank you! Your order is placed.</strong>
          <span>We will call you on {order.customer.phone} to confirm it.</span>
        </div>
      )}

      <div className="ord-head">
        <div>
          <h1>Order {order.orderNumber}</h1>
          <span className={`ord-status ord-status-${order.status}`}>
            {ORDER_STATUS_LABELS[order.status]}
          </span>
        </div>
        <Link href="/orders" className="ord-back">← All orders</Link>
      </div>

      <div className="ord-grid">
        <section className="ord-box">
          <h2>Items</h2>
          <ul className="ord-items">
            {order.items.map((item) => (
              <li key={item.product || item.title}>
                <span>
                  {item.slug ? (
                    <Link href={`/${item.category}/${item.slug}`}>{item.title}</Link>
                  ) : (
                    item.title
                  )}{" "}
                  × {item.quantity}
                </span>
                <span>{rupees(item.price * item.quantity)}</span>
              </li>
            ))}
          </ul>
          <div className="ord-total">
            <span>Total</span>
            <span>{rupees(order.total)}</span>
          </div>
          <p className="ord-hint">Final price and delivery are confirmed with you by phone.</p>
        </section>

        <section className="ord-box">
          <h2>Delivery details</h2>
          <p className="ord-detail">
            <strong>{order.customer.name}</strong>
            <br />
            {order.customer.phone}
            <br />
            {order.customer.address}
          </p>
          {order.note && (
            <p className="ord-detail">
              <strong>Note:</strong> {order.note}
            </p>
          )}

          <h2>Status</h2>
          <ol className="ord-timeline">
            {order.statusHistory.map((h, i) => (
              <li key={i}>
                <span>{ORDER_STATUS_LABELS[h.status]}</span>
                <time dateTime={h.at}>{formatDateTime(h.at)}</time>
              </li>
            ))}
          </ol>

          {order.status === "placed" && (
            <button
              type="button"
              className="ord-cancel"
              disabled={cancelling}
              onClick={handleCancel}
            >
              {cancelling ? "Cancelling..." : "Cancel order"}
            </button>
          )}
        </section>
      </div>
    </main>
  );
}

export default OrderDetailView;
