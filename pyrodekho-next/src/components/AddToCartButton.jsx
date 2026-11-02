"use client";

import { usePathname, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { FaShoppingCart } from "react-icons/fa";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";

// Product page button. Visitors must be logged in to use the cart; after
// login they come back to this product.
function AddToCartButton({ productId, outOfStock = false, className = "" }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuth, loading: authLoading } = useAuth();
  const { addToCart, busy } = useCart();

  if (outOfStock) {
    return (
      <button type="button" className={`pd-btn pd-btn-cart ${className}`} disabled>
        Out of stock
      </button>
    );
  }

  const handleClick = () => {
    if (authLoading) return;

    if (!isAuth) {
      toast.error("Please login or sign up to use the cart 🔐");
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }

    addToCart(productId);
  };

  return (
    <button
      type="button"
      className={`pd-btn pd-btn-cart ${className}`}
      disabled={busy}
      onClick={handleClick}
    >
      <FaShoppingCart /> Add to Cart
    </button>
  );
}

export default AddToCartButton;
