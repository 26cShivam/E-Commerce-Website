"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import Loader from "@/components/Loader";
import ProductForm from "@/components/admin/ProductForm";
import { adminFetch, adminMutate } from "@/lib/adminApi";

function EditProduct() {
  const { id } = useParams();
  const router = useRouter();
  const [product, setProduct] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    adminFetch(`/products/admin/${id}`)
      .then((res) => setProduct(res.data))
      .catch((err) => setError(err.message));
  }, [id]);

  const updateProduct = async (fd) => {
    const toastId = toast.loading("Saving changes...");
    try {
      await adminMutate(`/products/${id}`, { method: "PUT", body: fd, refresh: "products" });
      toast.success("Product updated ✅", { id: toastId });
      router.push("/admin/products");
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Something went wrong ❌", { id: toastId });
      throw err;
    }
  };

  if (error) {
    return (
      <div className="adm-empty">
        <p>{error}</p>
        <Link href="/admin/products" className="adm-btn">Back to products</Link>
      </div>
    );
  }

  if (!product) return <Loader />;

  return (
    <ProductForm
      product={product}
      heading="Edit Product"
      subheading={product.isActive === false ? "This product is deleted (hidden from the site)" : "Update product details & image"}
      submitLabel="Save Changes"
      busyLabel="Saving..."
      onSubmit={updateProduct}
    />
  );
}

export default EditProduct;
