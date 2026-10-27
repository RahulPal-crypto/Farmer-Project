import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import App from "./App";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import { WishlistProvider } from "./context/WishlistContext";
import { LanguageProvider } from "./context/LanguageContext";
import "./index.css";

if (typeof window !== "undefined") {
  console.log(
    "%c🌱 KrishiSetu (कृषिसेतु) %c| Designed & Developed by Rahul Pal",
    "background: #047857; color: #ffffff; font-weight: bold; padding: 4px 8px; border-radius: 4px;",
    "color: #047857; font-weight: bold;"
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <React.StrictMode>
    <BrowserRouter>
      <LanguageProvider>
        <AuthProvider>
          <WishlistProvider>
            <CartProvider>
              <App />
            </CartProvider>
          </WishlistProvider>
        </AuthProvider>
      </LanguageProvider>
    </BrowserRouter>
  </React.StrictMode>
);
