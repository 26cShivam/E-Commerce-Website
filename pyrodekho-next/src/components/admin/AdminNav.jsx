"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  ["/admin", "Dashboard"],
  ["/admin/orders", "Orders"],
  ["/admin/products", "Products"],
  ["/admin/videos", "Videos"],
  ["/admin/add-product", "+ Product"],
  ["/admin/add-video", "+ Video"],
];

function AdminNav() {
  const pathname = usePathname();

  // "/admin" only matches exactly; sections also match their sub-pages
  const isCurrent = (href) =>
    href === "/admin" ? pathname === href : pathname.startsWith(href);

  return (
    <nav className="adm-nav" aria-label="Admin">
      <Link href="/admin" className="adm-nav-brand">PyroDekho Admin</Link>

      <div className="adm-nav-links">
        {LINKS.map(([href, label]) => (
          <Link
            key={href}
            href={href}
            className={`adm-nav-link ${isCurrent(href) ? "active" : ""}`}
            aria-current={isCurrent(href) ? "page" : undefined}
          >
            {label}
          </Link>
        ))}
        <Link href="/" className="adm-nav-link adm-nav-site">View site ↗</Link>
      </div>
    </nav>
  );
}

export default AdminNav;
