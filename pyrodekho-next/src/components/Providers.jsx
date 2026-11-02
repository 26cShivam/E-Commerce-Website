"use client";

import { Toaster } from "react-hot-toast";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import { SearchProvider } from "@/context/SearchContext";

function Providers({ children }) {
  return (
    <AuthProvider>
      <CartProvider>
        <SearchProvider>
          {children}

          <Toaster
            position="top-center"
            reverseOrder={false}
            toastOptions={{
              duration: 3000,
            }}
          />
        </SearchProvider>
      </CartProvider>
    </AuthProvider>
  );
}

export default Providers;
