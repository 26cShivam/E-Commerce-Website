"use client";

import { useState, useEffect, useRef, useSyncExternalStore } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useSearch } from "@/context/SearchContext";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import logo from "@/assets/pyrodekhologo.jpg";

const FILTER_OPTIONS = [
  ["mostSearched", "Most Searched"],
  ["smokeless", "Smokeless"],
  ["event", "Event"],
  ["club", "Club"],
  ["wedding", "Wedding"],
  ["stage", "Stage"],
  ["birthday", "Birthday"],
  ["fog", "Fog"],
];

const MOBILE_QUERY = "(max-width: 768px)";

const subscribeMobile = (onChange) => {
  const mq = window.matchMedia(MOBILE_QUERY);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
};

// searchPlaceholder: shows the search box (only on pages that have a product list)
// showFilter: shows the category filter (Home page only)
function Header({ searchPlaceholder, showFilter = false }) {
  const router = useRouter();
  const { searchTerm, setSearchTerm, filters, toggleFilter, clearFilters, resetSearch } =
    useSearch();
  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef = useRef(null);

  // Each page renders its own Header, so a page starts with a clean search and filter
  useEffect(() => {
    resetSearch();
  }, [resetSearch]);

  // Close the filter panel on outside click
  useEffect(() => {
    const onClick = (e) => {
      if (filterRef.current && !filterRef.current.contains(e.target)) {
        setFilterOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  // Short placeholder on phones so it is not cut off
  const isMobile = useSyncExternalStore(
    subscribeMobile,
    () => window.matchMedia(MOBILE_QUERY).matches,
    () => false,
  );

  const placeholderText = isMobile ? "Search products..." : searchPlaceholder;

  const { isAuth, name, logout: authLogout } = useAuth();
  const { cart } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);

  const logout = async () => {
    await authLogout();
    closeMenu();
    router.push("/");
  };

  const navLink = (href, label) => (
    <Link href={href} className="btn-filled" onClick={closeMenu}>
      {label}
    </Link>
  );

  return (
    <header className="header">
      {/* LOGO */}
      <Link href="/" className="logo">
        <Image src={logo} alt="PyroDekho" width={42} height={42} priority />
        <div>
          <div className="logo-text">PyroDekho</div>
          <div className="tagline">DIGITAL INDIA KA BHAROSA</div>
        </div>
      </Link>

      {/* SEARCH (only on pages that have a product list) */}
      {searchPlaceholder && (
        <div className="header-search-group">
          <div className="header-search">
            <svg
              className="header-search-icon"
              viewBox="0 0 24 24"
              width="18"
              height="18"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="7" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>

            <input
              type="text"
              placeholder={placeholderText}
              aria-label="Search products"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />

            {searchTerm && (
              <button
                type="button"
                className="header-search-clear"
                aria-label="Clear search"
                onClick={() => setSearchTerm("")}
              >
                ✕
              </button>
            )}
          </div>

          {showFilter && (
            <div className="header-filter-wrap" ref={filterRef}>
              <button
                type="button"
                className={`header-filter ${filters.length ? "active" : ""}`}
                aria-haspopup="true"
                aria-expanded={filterOpen}
                onClick={() => setFilterOpen((open) => !open)}
              >
                Filter{filters.length > 0 && ` (${filters.length})`}
              </button>

              {filterOpen && (
                <div className="filter-panel">
                  {FILTER_OPTIONS.map(([value, label]) => (
                    <label className="filter-option" key={value}>
                      <input
                        type="checkbox"
                        checked={filters.includes(value)}
                        onChange={() => toggleFilter(value)}
                      />
                      <span>{label}</span>
                    </label>
                  ))}

                  {filters.length > 0 && (
                    <button
                      type="button"
                      className="filter-clear"
                      onClick={clearFilters}
                    >
                      Clear all
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* HAMBURGER */}
      <div className="hamburger" onClick={() => setMenuOpen(true)}>
        ☰
      </div>

      {/* MENU / DRAWER */}
      <nav className={`menu ${menuOpen ? "open" : ""}`} aria-label="Main">
        <button className="close-btn" onClick={closeMenu}>
          ✕
        </button>

        {isAuth && (
          <div className="drawer-user">
            Hello, <strong>{name}</strong>
          </div>
        )}

        {navLink("/book", "Book Now")}
        {isAuth && navLink("/cart", cart.count > 0 ? `Cart (${cart.count})` : "Cart")}
        {isAuth && navLink("/orders", "My Orders")}
        {navLink("/safety", "Safety")}
        {navLink("/contact", "Contact")}

        {isAuth ? (
          <button className="btn-filled logout-btn" onClick={logout}>
            Logout
          </button>
        ) : (
          <>
            {navLink("/signup", "Signup")}
            {navLink("/login", "Login")}
          </>
        )}
      </nav>
    </header>
  );
}

export default Header;
