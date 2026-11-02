"use client";

import { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Loader from "@/components/Loader";
import { useConfirm } from "@/components/ConfirmDialog";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { cloudinaryLoader } from "@/utils/optimizeImage";

const MAX_QTY = 100;

const rupees = (n) => `₹${n.toLocaleString("en-IN")}`;

function CartView() {
  const router = useRouter();
  const { isAuth, loading: authLoading } = useAuth();
  const { cart, loading, busy, setQuantity, removeItem, clear } = useCart();
  const { confirm, confirmDialog } = useConfirm();

  // The cart needs a login; come back here afterwards
  useEffect(() => {
    if (!authLoading && !isAuth) router.replace("/login?redirect=/cart");
  }, [authLoading, isAuth, router]);

  if (authLoading || !isAuth || loading) return <Loader />;

  const handleClear = async () => {
    const ok = await confirm({
      title: "Clear your cart?",
      message: "All items will be removed from your cart.",
      confirmLabel: "Yes, clear cart",
      cancelLabel: "Keep items",
    });
    if (ok) clear();
  };

  if (cart.items.length === 0) {
    return (
      <main className="cart-page">
        <div className="cart-empty">
          <h1>Your cart is empty</h1>
          <p>Browse our effects and add the ones you like.</p>
          <Link href="/" className="cart-btn cart-btn-primary">
            Continue shopping
          </Link>
        </div>
      </main>
    );
  }

  const hasUnavailable = cart.items.some((item) => !item.available);

  return (
    <main className="cart-page">
      {confirmDialog}
      <div className="cart-head">
        <h1>Your Cart</h1>
        <button type="button" className="cart-link-btn" disabled={busy} onClick={handleClear}>
          Clear cart
        </button>
      </div>

      {hasUnavailable && (
        <p className="cart-warning">
          Some items are out of stock. They are not included in the total, so please
          remove them.
        </p>
      )}

      <div className="cart-layout">
        <ul className="cart-list">
          {cart.items.map((item) => (
            <li
              key={item.productId}
              className={`cart-item ${item.available ? "" : "is-unavailable"}`}
            >
              <Link href={`/${item.category}/${item.slug}`} className="cart-item-img">
                {item.image && (
                  <Image
                    loader={cloudinaryLoader}
                    src={item.image}
                    alt={item.title}
                    width={160}
                    height={120}
                    sizes="96px"
                  />
                )}
              </Link>

              <div className="cart-item-info">
                <Link href={`/${item.category}/${item.slug}`} className="cart-item-title">
                  {item.title}
                </Link>
                <p className="cart-item-price">{rupees(item.price)} / piece</p>
                {!item.available && <span className="cart-badge-out">Out of stock</span>}
              </div>

              <div className="cart-item-qty" aria-label={`Quantity of ${item.title}`}>
                <button
                  type="button"
                  aria-label="Decrease quantity"
                  disabled={busy || item.quantity <= 1}
                  onClick={() => setQuantity(item.productId, item.quantity - 1)}
                >
                  −
                </button>
                <span>{item.quantity}</span>
                <button
                  type="button"
                  aria-label="Increase quantity"
                  disabled={busy || item.quantity >= MAX_QTY}
                  onClick={() => setQuantity(item.productId, item.quantity + 1)}
                >
                  +
                </button>
              </div>

              <div className="cart-item-total">
                {item.available ? rupees(item.lineTotal) : "—"}
              </div>

              <button
                type="button"
                className="cart-link-btn cart-item-remove"
                disabled={busy}
                onClick={() => removeItem(item.productId)}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>

        <aside className="cart-summary">
          <h2>Summary</h2>
          <div className="cart-summary-row">
            <span>Items</span>
            <span>{cart.count}</span>
          </div>
          <div className="cart-summary-row cart-summary-total">
            <span>Total</span>
            <span>{rupees(cart.total)}</span>
          </div>
          {hasUnavailable ? (
            <button type="button" className="cart-btn cart-checkout" disabled>
              Remove out-of-stock items to continue
            </button>
          ) : (
            <Link href="/checkout" className="cart-btn cart-btn-primary cart-checkout">
              Proceed to checkout
            </Link>
          )}
          <p className="cart-summary-note">
            Prices are starting prices per piece. Final price and delivery are confirmed
            with you by phone.
          </p>
        </aside>
      </div>
    </main>
  );
}

export default CartView;
