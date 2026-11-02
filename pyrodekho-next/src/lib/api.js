import "server-only";
import { cacheLife, cacheTag } from "next/cache";

// Server-side data helpers. The server can use a separate (e.g. internal)
// URL when API_BASE_URL is set; otherwise it uses the public one.
export const SERVER_API =
  process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL;

// Fetch JSON from the backend for server-rendered pages.
// Successful responses are cached and refreshed every minute; failures are
// cached only briefly so a backend hiccup doesn't stick around.
// With throwOnError, a failure (other than 404) shows the error page instead
// of the fallback.
// Each result is tagged "products" or "videos" (the first path segment) so
// admin changes can expire it right away (see app/admin/actions.js).
async function getData(path, fallback, throwOnError = false) {
  "use cache";
  cacheTag(path.split(/[/?]/)[1]);

  try {
    const res = await fetch(`${SERVER_API}${path}`);
    if (res.status === 404) {
      cacheLife("minutes");
      return fallback;
    }
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const json = await res.json();
    cacheLife("minutes");
    return json?.data ?? fallback;
  } catch (error) {
    console.error(`API error for ${path}:`, error.message);
    if (throwOnError) throw error;
    cacheLife({ stale: 60, revalidate: 30, expire: 300 });
    return fallback;
  }
}

export const getHomeProducts = () => getData("/products/home", {});

export const getProductsByCategory = (category) =>
  getData(`/products?category=${encodeURIComponent(category)}`, []);

// Only a real 404 becomes "Product not found" (which tells Google to drop the
// page); a backend outage shows the error page instead
export const getProduct = (slug) =>
  getData(`/products/${encodeURIComponent(slug)}`, null, true);

export const getVideos = (type) =>
  getData(`/videos?type=${encodeURIComponent(type)}`, []);

// Every product, used to build the sitemap
export const getAllProducts = () => getData("/products", []);
