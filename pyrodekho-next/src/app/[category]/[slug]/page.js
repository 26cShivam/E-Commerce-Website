import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FaWhatsapp, FaPhoneAlt } from "react-icons/fa";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Loader from "@/components/Loader";
import CardListing from "@/components/CardListing";
import ProductImageZoom from "@/components/ProductImageZoom";
import ShareButton from "@/components/ShareButton";
import AddToCartButton from "@/components/AddToCartButton";
import JsonLd from "@/components/JsonLd";
import { getProduct, getProductsByCategory } from "@/lib/api";
import { pageMetadata, SITE_URL, SITE_NAME } from "@/lib/seo";
import { buildProductDescription } from "@/lib/seoContent";

const WHATSAPP_NUMBER = "919412660853";
const CALL_NUMBER = "9718410923";

// Categories that have their own listing page
const CATEGORY_PAGES = {
  indoor: "/indoor",
  outdoor: "/outdoor",
  cracker: "/crackers",
};

const formatLabel = (key) =>
  key
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (char) => char.toUpperCase());

// Product photo as a 1200x630 JPG share card (padded so the whole product
// shows). JPG because WhatsApp doesn't reliably preview WebP/AVIF.
const shareImage = (url) =>
  url?.includes("res.cloudinary.com") && url.includes("/upload/")
    ? url.replace("/upload/", "/upload/f_jpg,q_auto,w_1200,h_630,c_pad,b_white/")
    : url;

export async function generateMetadata({ params }) {
  const { category, slug } = await params;
  const product = await getProduct(slug);

  if (!product) return { title: "Product not found" };

  return pageMetadata({
    title: product.title,
    description: `Buy ${product.title} starting ₹${product.price} / piece. Safe, smokeless cold pyro by PyroDekho, delivered all over India.`,
    path: `/${category}/${slug}`,
    images: product.image
      ? [{ url: shareImage(product.image), width: 1200, height: 630, alt: product.title }]
      : undefined,
  });
}

async function RelatedProducts({ product }) {
  const all = await getProductsByCategory(product.category);
  const related = all.filter((item) => item._id !== product._id).slice(0, 4);

  if (related.length === 0) return null;

  return (
    <section className="pd-related">
      <h2>You may also like</h2>
      <div className="listings">
        {related.map((item) => (
          <CardListing key={item._id} {...item} />
        ))}
      </div>
    </section>
  );
}

async function ProductDetail({ params }) {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product) notFound();

  const tech = product.technical || {};
  // The admin's stock status decides; older products without one fall back
  // to the free-text availability
  const inStock = product.status
    ? product.status !== "out_of_stock"
    : !/out/i.test(tech.availability || "");

  // Key specs shown as chips; everything else goes in the table
  const chipKeys = ["burnTime", "sparkHeight", "smoke"];
  const chips = chipKeys.filter((key) => tech[key]);
  const tableRows = Object.entries(tech).filter(
    ([key, value]) => value && !chipKeys.includes(key),
  );

  const categoryLabel = product.category ? formatLabel(product.category) : "";
  const categoryPage = CATEGORY_PAGES[product.category];

  const message = `Hi PyroDekho, I'm interested in "${product.title}" (Starting ₹${product.price} / piece). Please share more details.`;
  const whatsappLink = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;

  // Pre-fills the booking form message
  const bookLink = `/book?product=${encodeURIComponent(product.title)}`;

  const description = buildProductDescription(product);
  const productUrl = `${SITE_URL}/${product.category}/${slug}`;
  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    image: product.image ? [product.image] : undefined,
    description: description,
    brand: { "@type": "Brand", name: SITE_NAME },
    offers: {
      "@type": "Offer",
      url: productUrl,
      priceCurrency: "INR",
      price: product.price,
      availability: inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
    },
  };
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      ...(categoryPage
        ? [{ "@type": "ListItem", position: 2, name: categoryLabel, item: `${SITE_URL}${categoryPage}` }]
        : []),
      {
        "@type": "ListItem",
        position: categoryPage ? 3 : 2,
        name: product.title,
        item: productUrl,
      },
    ],
  };

  return (
    <>
      <JsonLd data={productSchema} />
      <JsonLd data={breadcrumbSchema} />
      <div className="pd-page">
        {/* BREADCRUMBS */}
        <nav className="pd-breadcrumbs" aria-label="Breadcrumb">
          <Link href="/">Home</Link>
          {categoryLabel && (
            <>
              <span>/</span>
              {categoryPage ? (
                <Link href={categoryPage}>{categoryLabel}</Link>
              ) : (
                <span>{categoryLabel}</span>
              )}
            </>
          )}
          <span>/</span>
          <span className="pd-crumb-current">{product.title}</span>
        </nav>

        <div className="pd-layout">
          {/* LEFT IMAGE */}
          <ProductImageZoom src={product.image} alt={product.title} />

          {/* RIGHT DETAILS */}
          <div className="pd-info">
            <div className="pd-top-row">
              {categoryLabel && <span className="pd-tag">{categoryLabel}</span>}
              {(product.status || tech.availability) && (
                <span className={`pd-stock ${inStock ? "in" : "out"}`}>
                  {inStock ? tech.availability || "Available" : "Out of stock"}
                </span>
              )}
              <ShareButton title={product.title} />
            </div>

            <h1 className="pd-title">{product.title}</h1>

            <p className="pd-price">
              Starting ₹{product.price}
              <span> / piece</span>
            </p>

            <p className="seoc-product-about">{description}</p>

            {/* KEY SPECS */}
            {chips.length > 0 && (
              <div className="pd-chips">
                {chips.map((key) => (
                  <div className="pd-chip" key={key}>
                    <span className="pd-chip-label">{formatLabel(key)}</span>
                    <span className="pd-chip-value">{tech[key]}</span>
                  </div>
                ))}
              </div>
            )}

            {/* ACTIONS */}
            <div className="pd-actions">
              <Link className="pd-btn pd-btn-primary" href={bookLink}>
                Book Now / Get Quote
              </Link>
              <AddToCartButton productId={String(product._id)} outOfStock={!inStock} />
              <a
                className="pd-btn pd-btn-whatsapp"
                href={whatsappLink}
                target="_blank"
                rel="noreferrer"
              >
                <FaWhatsapp /> WhatsApp
              </a>
              <a className="pd-btn pd-btn-outline" href={`tel:${CALL_NUMBER}`}>
                <FaPhoneAlt /> Call
              </a>
            </div>

            {/* TRUST */}
            <ul className="pd-trust">
              <li>✔ Safe & smokeless pyro effect</li>
              <li>✔ Suitable for events & celebrations</li>
              <li>✔ Easy to use</li>
              <li>🚚 All India delivery</li>
            </ul>

            {/* TECHNICAL TABLE */}
            {tableRows.length > 0 && (
              <div className="pd-specs">
                <h2>Technical Parameters</h2>
                {tableRows.map(([key, value]) => (
                  <div className="pd-spec-row" key={key}>
                    <span>{formatLabel(key)}</span>
                    <span>{value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RELATED */}
        <RelatedProducts product={product} />
      </div>

      {/* STICKY MOBILE BAR */}
      <div className="pd-sticky-bar">
        <AddToCartButton
          productId={String(product._id)}
          outOfStock={!inStock}
          className="pd-sticky-cart"
        />
        <a className="pd-btn pd-btn-whatsapp" href={whatsappLink} target="_blank" rel="noreferrer">
          <FaWhatsapp /> WhatsApp
        </a>
        <Link className="pd-btn pd-btn-primary" href={bookLink}>
          Book Now
        </Link>
      </div>
    </>
  );
}

export default function ProductPage({ params }) {
  return (
    <>
      <Header />

      {/* The product slug is only known at request time */}
      <Suspense fallback={<Loader />}>
        <ProductDetail params={params} />
      </Suspense>

      <Footer />
    </>
  );
}
