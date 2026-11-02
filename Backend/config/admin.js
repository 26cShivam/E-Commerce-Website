// Admin emails come from the ADMIN_EMAILS env var (comma-separated).
// This is the only admin list: the website asks the backend
// (GET /api/auth/admin-check) instead of keeping its own copy.
const FALLBACK_ADMINS = ["shivam8130752247@gmail.com"];

const fromEnv = (process.env.ADMIN_EMAILS || "")
  .split(",")
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

if (fromEnv.length === 0) {
  console.warn("ADMIN_EMAILS is not set, using the built-in admin list");
}

module.exports = {
  ADMIN_EMAILS: fromEnv.length ? fromEnv : FALLBACK_ADMINS,
};
