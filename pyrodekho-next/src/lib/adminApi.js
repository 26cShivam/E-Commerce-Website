import { refreshPublicContent } from "@/app/admin/actions";

// Browser-side calls to admin-only backend routes. Logged in with email and
// password: sends the token from localStorage. Logged in with Google: the
// backend cookie is sent instead (credentials: "include"). Any error response
// is thrown as an Error with the backend message (and HTTP status as err.status).
const API = process.env.NEXT_PUBLIC_API_BASE_URL;

export async function adminFetch(path, { method = "GET", body, headers = {} } = {}) {
  const token = localStorage.getItem("token");

  const res = await fetch(`${API}${path}`, {
    method,
    headers: token ? { ...headers, Authorization: `Bearer ${token}` } : headers,
    credentials: "include",
    body,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const error = new Error(data.message || `Request failed (${res.status})`);
    error.status = res.status;
    throw error;
  }
  return data;
}

// For changes (create / update / delete / restore): after the backend saves,
// expire the public site's cached "products" or "videos" data. A failed
// refresh only means the site updates within a minute, so it never throws.
export async function adminMutate(path, { method, body, headers, refresh }) {
  const data = await adminFetch(path, { method, body, headers });

  try {
    await refreshPublicContent(localStorage.getItem("token"), refresh);
  } catch (err) {
    console.error("Site refresh failed:", err);
  }
  return data;
}
