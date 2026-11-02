"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import Loader from "@/components/Loader";
import { useConfirm } from "@/components/ConfirmDialog";
import { adminFetch } from "@/lib/adminApi";

const STATUS_TABS = [
  ["placed", "New"],
  ["confirmed", "Confirmed"],
  ["delivered", "Delivered"],
  ["cancelled", "Cancelled"],
  ["all", "All"],
];

const STATUS_LABELS = {
  placed: "New",
  confirmed: "Confirmed",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

// Moves the backend allows (it enforces the same rules)
const ACTIONS = {
  placed: [
    ["confirmed", "Confirm", "adm-btn-success"],
    ["cancelled", "Cancel", "adm-btn-danger"],
  ],
  confirmed: [
    ["delivered", "Mark delivered", "adm-btn-success"],
    ["cancelled", "Cancel", "adm-btn-danger"],
  ],
  delivered: [],
  cancelled: [],
};

const rupees = (n) => `₹${n.toLocaleString("en-IN")}`;
const formatDateTime = (iso) =>
  new Date(iso).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });

function AdminOrders() {
  const [orders, setOrders] = useState(null);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("placed");
  const [search, setSearch] = useState("");
  const [openId, setOpenId] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const { confirm, confirmDialog } = useConfirm();

  useEffect(() => {
    adminFetch("/orders")
      .then((res) => setOrders(res.data))
      .catch((err) => setError(err.message));
  }, []);

  if (error) return <div className="adm-empty"><p>{error}</p></div>;
  if (!orders) return <Loader />;

  const term = search.trim().toLowerCase();
  const visible = orders.filter(
    (o) =>
      (tab === "all" || o.status === tab) &&
      (!term ||
        o.orderNumber.toLowerCase().includes(term) ||
        o.customer.name.toLowerCase().includes(term) ||
        o.customer.phone.includes(term))
  );

  const countFor = (key) =>
    key === "all" ? orders.length : orders.filter((o) => o.status === key).length;

  const changeStatus = async (order, status, label) => {
    if (
      status === "cancelled" &&
      !(await confirm({
        title: `Cancel order ${order.orderNumber}?`,
        message: `This cancels ${order.customer.name}'s order. It cannot be undone.`,
        confirmLabel: "Yes, cancel order",
        cancelLabel: "Keep order",
      }))
    ) {
      return;
    }

    setBusyId(order._id);
    try {
      const res = await adminFetch(`/orders/${order._id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
        headers: { "Content-Type": "application/json" },
      });
      setOrders((list) => list.map((o) => (o._id === order._id ? res.data : o)));
      toast.success(`${order.orderNumber}: ${label.toLowerCase()} ✅`);
    } catch (err) {
      toast.error(err.message || "Something went wrong ❌");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="adm-ord">
      {confirmDialog}
      <div className="adm-page-head">
        <h1>Orders</h1>
      </div>

      <div className="adm-tabs" role="tablist">
        {STATUS_TABS.map(([key, label]) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={tab === key}
            className={`adm-tab ${tab === key ? "active" : ""}`}
            onClick={() => setTab(key)}
          >
            {label} ({countFor(key)})
          </button>
        ))}
      </div>

      <div className="adm-toolbar">
        <input
          type="search"
          placeholder="Search by order no., name or phone..."
          aria-label="Search orders"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {visible.length === 0 ? (
        <div className="adm-empty"><p>No orders found.</p></div>
      ) : (
        <ul className="adm-ord-list">
          {visible.map((o) => {
            const open = openId === o._id;
            return (
              <li key={o._id} className="adm-ord-card">
                <div className="adm-ord-row">
                  <button
                    type="button"
                    className="adm-ord-toggle"
                    aria-expanded={open}
                    onClick={() => setOpenId(open ? null : o._id)}
                  >
                    <strong>{o.orderNumber}</strong>
                    <span className="adm-ord-sub">{formatDateTime(o.createdAt)}</span>
                  </button>

                  <div className="adm-ord-cust">
                    <span>{o.customer.name}</span>
                    <a href={`tel:${o.customer.phone}`}>{o.customer.phone}</a>
                  </div>

                  <strong className="adm-ord-total">{rupees(o.total)}</strong>

                  <span className={`adm-ord-status adm-ord-status-${o.status}`}>
                    {STATUS_LABELS[o.status]}
                  </span>

                  <div className="adm-actions">
                    {ACTIONS[o.status].map(([status, label, cls]) => (
                      <button
                        key={status}
                        type="button"
                        className={`adm-btn ${cls}`}
                        disabled={busyId === o._id}
                        onClick={() => changeStatus(o, status, label)}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {open && (
                  <div className="adm-ord-detail">
                    <div>
                      <h3>Items</h3>
                      <ul>
                        {o.items.map((item, i) => (
                          <li key={i}>
                            <span>{item.title} × {item.quantity}</span>
                            <span>{rupees(item.price * item.quantity)}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h3>Delivery</h3>
                      <p>{o.customer.address}</p>
                      {o.user?.email && <p className="adm-ord-sub">Account: {o.user.email}</p>}
                      {o.note && <p><strong>Note:</strong> {o.note}</p>}
                    </div>

                    <div>
                      <h3>History</h3>
                      <ul>
                        {o.statusHistory.map((h, i) => (
                          <li key={i}>
                            <span>{STATUS_LABELS[h.status]}</span>
                            <span className="adm-ord-sub">{formatDateTime(h.at)}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default AdminOrders;
