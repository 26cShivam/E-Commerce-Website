import AdminRoute from "@/components/AdminRoute";
import AdminNav from "@/components/admin/AdminNav";

// Admin pages are private: keep them out of search results
export const metadata = {
  title: {
    default: "Admin",
    template: "%s | PyroDekho Admin",
  },
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }) {
  return (
    <AdminRoute>
      <div className="adm-shell">
        <AdminNav />
        <main className="adm-main">{children}</main>
      </div>
    </AdminRoute>
  );
}
