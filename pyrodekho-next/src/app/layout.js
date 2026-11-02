import { Suspense } from "react";
import Script from "next/script";
import Providers from "@/components/Providers";
import AppBackground, { BackgroundLayer } from "@/components/AppBackground";
// All styles load once, here, in the same order as the old Vite app's single
// CSS bundle: page CSS first, then base styles, then mobile.css (which must
// come after page CSS to win), then the background. Pages and components don't
// import CSS themselves, so this order can't change between routes.
import "@/styles/header.css";
import "@/styles/Button.css";
import "@/styles/footer.css";
import "@/styles/videoGrid.css";
import "@/styles/slider.css";
import "@/styles/loader.css";
import "@/styles/Home.css";
import "@/styles/about.css";
import "@/styles/safety.css";
import "@/styles/contact.css";
import "@/styles/Term.css";
import "@/styles/privacyPolicy.css";
import "@/styles/company.css";
import "@/styles/howItWorks.css";
import "@/styles/login.css";
import "@/styles/signup.css";
import "@/styles/forgotPassword.css";
import "@/styles/listing.css";
import "@/styles/cracker.css";
import "@/styles/eventParties.css";
import "@/styles/ProductDetail.css";
import "@/styles/book.css";
import "@/styles/addProduct.css";
import "@/styles/addVideo.css";
import "@/styles/admin.css";
import "@/styles/cart.css";
import "@/styles/orders.css";
import "@/styles/adminOrders.css";
import "@/styles/confirm.css";
import "./globals.css";
import "@/styles/mobile.css";
import "@/styles/background.css";
import "@/styles/seoContent.css";

import JsonLd from "@/components/JsonLd";
import { SITE_URL, SITE_NAME, DEFAULT_DESCRIPTION, DEFAULT_TITLE, pageMetadata } from "@/lib/seo";

const GA_ID = "G-RLBPXWVQ1M";

// Defaults for every page; pages override title, description and share card
export const metadata = {
  metadataBase: new URL(SITE_URL),
  applicationName: "PyroDekho",
  ...pageMetadata({}),
  title: {
    default: DEFAULT_TITLE,
    template: "%s | PyroDekho",
  },
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
};

// Tells Google who the business is (shows in knowledge panels and results)
const ORGANIZATION_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: SITE_NAME,
  url: SITE_URL,
  logo: `${SITE_URL}/logo.png`,
  description: DEFAULT_DESCRIPTION,
  areaServed: "IN",
  contactPoint: {
    "@type": "ContactPoint",
    telephone: "+91-9718410923",
    contactType: "sales",
    areaServed: "IN",
    availableLanguage: ["English", "Hindi"],
  },
};

const WEBSITE_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: SITE_NAME,
  url: SITE_URL,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          {/* Product pages have URL params unknown at build time, so the
              pathname-based background resolves inside Suspense */}
          <Suspense fallback={<BackgroundLayer intensity="soft" />}>
            <AppBackground />
          </Suspense>
          {children}
        </Providers>

        <JsonLd data={ORGANIZATION_SCHEMA} />
        <JsonLd data={WEBSITE_SCHEMA} />

        {/* Google Analytics (GA4) */}
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
          strategy="afterInteractive"
        />
        <Script id="ga4" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_ID}');
          `}
        </Script>
      </body>
    </html>
  );
}
