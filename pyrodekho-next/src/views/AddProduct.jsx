"use client";

import toast from "react-hot-toast";
import ProductForm from "@/components/admin/ProductForm";
import { adminMutate } from "@/lib/adminApi";

function AddProduct() {
  const createProduct = async (fd) => {
    const toastId = toast.loading("Creating product...");
    try {
      await adminMutate("/products/create", { method: "POST", body: fd, refresh: "products" });
      toast.success("Product created successfully ✅", { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Something went wrong ❌", { id: toastId });
      throw err;
    }
  };

  return (
    <ProductForm
      heading="Add New Product"
      subheading="Upload product details & image"
      submitLabel="Create Product"
      busyLabel="Creating..."
      onSubmit={createProduct}
    />
  );
}

export default AddProduct;
