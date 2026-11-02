"use client";

import Link from "next/link";
import Image from "next/image";
import { cloudinaryLoader } from "@/utils/optimizeImage";

// Client component: the image loader function can't be passed from a server page.
// Product details are public. Only the cart and orders need a login.
function CardListing({ image, title, price, slug, category, status }) {
  const outOfStock = status === "out_of_stock";

  return (
    <div className={`card ${outOfStock ? "card-soldout" : ""}`}>
      {outOfStock && <span className="card-stock-badge">Out of stock</span>}
      {image && (
        <Image
          loader={cloudinaryLoader}
          src={image}
          alt={title}
          width={500}
          height={400}
          sizes="(max-width: 768px) 50vw, 25vw"
        />
      )}

      <div className="card-body flex flex-col gap-4">
        <h3>{title}</h3>

        <p className="text-gray-600">
          Starting ₹{price} / piece
        </p>

        <Link href={`/${category}/${slug}`} className="btn-filled mt-2">
          View Details
        </Link>
      </div>
    </div>
  );
}

export default CardListing;
