"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useAuth } from "@/context/AuthContext";
import * as cartApi from "@/lib/cartApi";

const EMPTY_CART = { items: [], count: 0, total: 0 };

const CartContext = createContext({
  cart: EMPTY_CART,
  loading: true,
  busy: false,
  addToCart: async () => false,
  setQuantity: async () => false,
  removeItem: async () => false,
  clear: async () => false,
  refresh: async () => {},
});

// The cart lives on the server (one per logged-in user). Every call returns
// the full updated cart, which replaces what is shown here.
export function CartProvider({ children }) {
  const { isAuth, loading: authLoading } = useAuth();
  const [cart, setCart] = useState(EMPTY_CART);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  // Load the cart on login, empty it on logout
  useEffect(() => {
    if (authLoading) return;

    if (!isAuth) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCart(EMPTY_CART);
      setLoading(false);
      return;
    }

    let cancelled = false;
    cartApi
      .fetchCart()
      .then((res) => !cancelled && setCart(res.data))
      .catch((err) => console.error("Cart load failed:", err))
      .finally(() => !cancelled && setLoading(false));

    return () => {
      cancelled = true;
    };
  }, [isAuth, authLoading]);

  // Runs one cart call and shows errors as a toast. Returns true on success.
  const run = useCallback(async (call, successMessage) => {
    setBusy(true);
    try {
      const res = await call();
      setCart(res.data);
      if (successMessage) toast.success(successMessage);
      return true;
    } catch (err) {
      toast.error(err.message || "Something went wrong ❌");
      return false;
    } finally {
      setBusy(false);
    }
  }, []);

  const addToCart = useCallback(
    (productId, quantity = 1) =>
      run(() => cartApi.addCartItem(productId, quantity), "Added to cart 🛒"),
    [run],
  );

  const setQuantity = useCallback(
    (productId, quantity) => run(() => cartApi.setCartItemQuantity(productId, quantity)),
    [run],
  );

  const removeItem = useCallback(
    (productId) => run(() => cartApi.removeCartItem(productId), "Removed from cart"),
    [run],
  );

  const clear = useCallback(() => run(() => cartApi.clearCart()), [run]);

  // Re-read the cart from the server (e.g. after an order empties it)
  const refresh = useCallback(async () => {
    try {
      setCart((await cartApi.fetchCart()).data);
    } catch (err) {
      console.error("Cart refresh failed:", err);
    }
  }, []);

  return (
    <CartContext.Provider
      value={{ cart, loading, busy, addToCart, setQuantity, removeItem, clear, refresh }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
