import Header from "@/components/Header";
import Footer from "@/components/Footer";
import OrdersView from "@/views/OrdersView";

export const metadata = {
  title: "My Orders",
  robots: { index: false, follow: false },
};

export default function OrdersPage() {
  return (
    <>
      <Header />
      <OrdersView />
      <Footer />
    </>
  );
}
