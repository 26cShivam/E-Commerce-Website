// Browser-side calls to routes that need a logged-in customer (cart, orders).
// Email/password login sends the token from localStorage; Google login uses
// the backend cookie. Any error response is thrown as an Error with the
// backend message (and HTTP status as err.status).
const API = process.env.NEXT_PUBLIC_API_BASE_URL;

export async function userRequest(path, { method = "GET", body } = {}) {
  const token = localStorage.getItem("token");

  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: "include",
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const error = new Error(data.message || `Request failed (${res.status})`);
    error.status = res.status;
    throw error;
  }
  return data;
}
