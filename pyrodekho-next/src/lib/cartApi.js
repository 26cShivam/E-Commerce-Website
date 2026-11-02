import { userRequest } from "@/lib/userApi";

export const fetchCart = () => userRequest("/cart");

export const addCartItem = (productId, quantity = 1) =>
  userRequest("/cart/items", { method: "POST", body: { productId, quantity } });

export const setCartItemQuantity = (productId, quantity) =>
  userRequest(`/cart/items/${productId}`, { method: "PATCH", body: { quantity } });

export const removeCartItem = (productId) =>
  userRequest(`/cart/items/${productId}`, { method: "DELETE" });

export const clearCart = () => userRequest("/cart", { method: "DELETE" });
