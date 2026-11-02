import { userRequest } from "@/lib/userApi";

export const placeOrder = (details) =>
  userRequest("/orders", { method: "POST", body: details });

export const fetchMyOrders = () => userRequest("/orders/mine");

export const fetchMyOrder = (id) => userRequest(`/orders/mine/${id}`);

export const cancelMyOrder = (id) =>
  userRequest(`/orders/mine/${id}/cancel`, { method: "PATCH" });

export const ORDER_STATUS_LABELS = {
  placed: "Placed - awaiting our call",
  confirmed: "Confirmed",
  delivered: "Delivered",
  cancelled: "Cancelled",
};
