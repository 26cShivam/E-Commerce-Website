"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Loader from "@/components/Loader";
import { adminFetch } from "@/lib/adminApi";

// The backend decides who is an admin (GET /auth/admin-check), so there is
// no admin list here. It accepts either login: the email/password token or
// the Google cookie. Hiding the pages is only for convenience: every admin
// API route checks the login again.
const AdminRoute = ({ children }) => {
  const router = useRouter();
  // "checking" | "admin" | "error"
  const [status, setStatus] = useState("checking");

  useEffect(() => {
    let cancelled = false;

    adminFetch("/auth/admin-check")
      .then(() => !cancelled && setStatus("admin"))
      .catch((err) => {
        if (cancelled) return;
        if (err.status === 401) {
          // Not logged in, or the login expired: log in again
          localStorage.removeItem("token");
          router.replace("/login");
        } else if (err.status === 403) {
          router.replace("/");
        } else {
          setStatus("error");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [router]);

  if (status === "admin") return children;
  if (status === "error") {
    return (
      <div className="adm-empty adm-route-error">
        <p>Could not reach the server to check admin access.</p>
        <button type="button" className="adm-btn" onClick={() => window.location.reload()}>
          Try again
        </button>
      </div>
    );
  }
  return <Loader />;
};

export default AdminRoute;
