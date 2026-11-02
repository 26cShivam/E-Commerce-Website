"use server";

import { cookies } from "next/headers";
import { updateTag } from "next/cache";
import { SERVER_API } from "@/lib/api";

const TAGS = ["products", "videos"];

// Called by the admin pages after a change is saved, so the public site shows
// it on the next visit instead of after the 1-minute cache. Anyone can call a
// Server Action, so the backend confirms the caller is an admin first, using
// the login token, or the Google login cookie when this server receives it
// (same host as the API). If neither works, the cache just expires on its own.
export async function refreshPublicContent(token, tag) {
  if (!TAGS.includes(tag)) return false;

  const headers = {};
  if (typeof token === "string" && token) {
    headers.Authorization = `Bearer ${token}`;
  } else {
    const cookie = (await cookies()).get("token")?.value;
    if (!cookie) return false;
    headers.Cookie = `token=${cookie}`;
  }

  const res = await fetch(`${SERVER_API}/auth/admin-check`, {
    headers,
    cache: "no-store",
  });
  if (!res.ok) return false;

  updateTag(tag);
  return true;
}
