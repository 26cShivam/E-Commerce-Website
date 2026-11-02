"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import Loader from "@/components/Loader";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { placeOrder } from "@/lib/orderApi";

const rupees = (n) => `₹${n.toLocaleString("en-IN")}`;

// No payment: the order is saved and we call the customer to confirm it
function CheckoutView() {
  const router = useRouter();
  const { isAuth, name, loading: authLoading } = useAuth();
  const { cart, loading: cartLoading, refresh } = useCart();

  const [form, setForm] = useState({ name: "", phone: "", address: "", note: "" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuth) router.replace("/login?redirect=/checkout");
  }, [authLoading, isAuth, router]);

  // Prefill the name once login is known, without overwriting what was typed
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (name) setForm((f) => (f.name ? f : { ...f, name }));
  }, [name]);

  if (authLoading || !isAuth || cartLoading) return <Loader />;

  const hasUnavailable = cart.items.some((item) => !item.available);
  const orderable = cart.items.filter((item) => item.available);

  if (cart.items.length === 0 && !submitting) {
    return (
      <main className="chk-page">
        <div className="chk-empty">
          <h1>Nothing to check out</h1>
          <p>Your cart is empty.</p>
          <Link href="/" className="chk-btn">Continue shopping</Link>
        </div>
      </main>
    );
  }

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (hasUnavailable) {
      toast.error("Please remove out-of-stock items from your cart first");
      return;
    }
    if (!form.name.trim() || !form.phone.trim() || !form.address.trim()) {
      toast.error("Name, phone and address are required ❗");
      return;
    }
    if (form.phone.replace(/\D/g, "").length < 10) {
      toast.error("Enter a valid phone number 📞");
      return;
    }

    setSubmitting(true);
    try {
      const res = await placeOrder(form);
      await refresh();
      router.replace(`/orders/${res.data._id}?placed=1`);
    } catch (err) {
      toast.error(err.message || "Could not place the order ❌");
      setSubmitting(false);
    }
  };

  return (
    <main className="chk-page">
      <h1>Checkout</h1>

      <div className="chk-layout">
        <form className="chk-form" onSubmit={handleSubmit} noValidate>
          <h2>Delivery details</h2>

          <label htmlFor="chk-name">Full name *</label>
          <input id="chk-name" name="name" value={form.name} onChange={handleChange} />

          <label htmlFor="chk-phone">Phone number *</label>
          <input
            id="chk-phone"
            name="phone"
            type="tel"
            inputMode="tel"
            placeholder="We will call this number to confirm"
            value={form.phone}
            onChange={handleChange}
          />

          <label htmlFor="chk-address">Delivery address *</label>
          <textarea
            id="chk-address"
            name="address"
            rows={3}
            placeholder="House / venue, area, city, pincode"
            value={form.address}
            onChange={handleChange}
          />

          <label htmlFor="chk-note">Note (optional)</label>
          <textarea
            id="chk-note"
            name="note"
            rows={2}
            placeholder="Event date, venue details, anything we should know"
            value={form.note}
            onChange={handleChange}
          />

          {hasUnavailable && (
            <p className="chk-warning">
              Some items are out of stock. <Link href="/cart">Go to cart</Link> and remove
              them to continue.
            </p>
          )}

          <button type="submit" className="chk-submit" disabled={submitting || hasUnavailable}>
            {submitting ? "Placing order..." : "Place order"}
          </button>
          <p className="chk-note">
            No payment is taken now. We will call you to confirm the order, price and delivery.
          </p>
        </form>

        <aside className="chk-summary">
          <h2>Order summary</h2>
          <ul>
            {orderable.map((item) => (
              <li key={item.productId}>
                <span>
                  {item.title} × {item.quantity}
                </span>
                <span>{rupees(item.lineTotal)}</span>
              </li>
            ))}
          </ul>
          <div className="chk-total">
            <span>Total</span>
            <span>{rupees(cart.total)}</span>
          </div>
          <Link href="/cart" className="chk-edit">Edit cart</Link>
        </aside>
      </div>
    </main>
  );
}

export default CheckoutView;
