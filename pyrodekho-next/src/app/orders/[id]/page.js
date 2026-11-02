import { Suspense } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Loader from "@/components/Loader";
import OrderDetailView from "@/views/OrderDetailView";

export const metadata = {
  title: "Order Details",
  robots: { index: false, follow: false },
};

export default function OrderDetailPage() {
  return (
    <>
      <Header />
      {/* Reads the order id and ?placed= from the URL */}
      <Suspense fallback={<Loader />}>
        <OrderDetailView />
      </Suspense>
      <Footer />
    </>
  );
}
