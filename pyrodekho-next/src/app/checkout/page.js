import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CheckoutView from "@/views/CheckoutView";

export const metadata = {
  title: "Checkout",
  robots: { index: false, follow: false },
};

export default function CheckoutPage() {
  return (
    <>
      <Header />
      <CheckoutView />
      <Footer />
    </>
  );
}
