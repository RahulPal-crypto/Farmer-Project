import { createContext, useContext, useEffect, useMemo, useState } from "react";

const WishlistContext = createContext(null);
const WISHLIST_STORAGE_KEY = "wishlist";

export function WishlistProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      const storedItems = localStorage.getItem(WISHLIST_STORAGE_KEY);
      return storedItems ? JSON.parse(storedItems) : [];
    } catch (error) {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const isWishlisted = (productId) => items.some((item) => item._id === productId);

  const toggleWishlist = (product) => {
    setItems((currentItems) => {
      if (currentItems.some((item) => item._id === product._id)) {
        return currentItems.filter((item) => item._id !== product._id);
      }

      return [product, ...currentItems];
    });
  };

  const removeFromWishlist = (productId) => {
    setItems((currentItems) => currentItems.filter((item) => item._id !== productId));
  };

  const value = useMemo(
    () => ({
      items,
      itemCount: items.length,
      isWishlisted,
      toggleWishlist,
      removeFromWishlist,
    }),
    [items]
  );

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist() {
  const context = useContext(WishlistContext);

  if (!context) {
    throw new Error("useWishlist must be used inside WishlistProvider");
  }

  return context;
}
