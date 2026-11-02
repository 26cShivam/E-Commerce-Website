import Header from "@/components/Header";
import SignupView from "@/views/SignupView";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Create Account",
  description: "Sign up for PyroDekho to save your cart, place orders and book cold pyro for your event.",
  path: "/signup",
});

export default function SignupPage() {
  return (
    <>
      <Header />
      <SignupView />
    </>
  );
}
