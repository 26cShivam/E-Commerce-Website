import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CartView from "@/views/CartView";

// Personal page: keep it out of search results
export const metadata = {
  title: "Your Cart",
  robots: { index: false, follow: false },
};

export default function CartPage() {
  return (
    <>
      <Header />
      <CartView />
      <Footer />
    </>
  );
}
