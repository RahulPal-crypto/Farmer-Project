import { createContext, useContext, useEffect, useMemo, useState } from "react";

const CartContext = createContext(null);

const CART_STORAGE_KEY = "cart";

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    const storedItems = localStorage.getItem(CART_STORAGE_KEY);
    return storedItems ? JSON.parse(storedItems) : [];
  });

  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addToCart = (product) => {
    setItems((currentItems) => {
      const existingItem = currentItems.find((item) => item._id === product._id);

      if (existingItem) {
        return currentItems.map((item) =>
          item._id === product._id
            ? {
                ...item,
                cartQuantity: Math.min(item.cartQuantity + 1, item.quantity),
              }
            : item
        );
      }

      return [
        ...currentItems,
        {
          ...product,
          cartQuantity: 1,
        },
      ];
    });
  };

  const updateCartQuantity = (productId, quantity) => {
    setItems((currentItems) =>
      currentItems
        .map((item) =>
          item._id === productId
            ? {
                ...item,
                cartQuantity: Math.max(1, Math.min(quantity, item.quantity)),
              }
            : item
        )
        .filter((item) => item.cartQuantity > 0)
    );
  };

  const removeFromCart = (productId) => {
    setItems((currentItems) => currentItems.filter((item) => item._id !== productId));
  };

  const clearCart = () => {
    setItems([]);
  };

  const subtotal = items.reduce((total, item) => total + item.price * item.cartQuantity, 0);

  const value = useMemo(
    () => ({
      items,
      subtotal,
      itemCount: items.reduce((total, item) => total + item.cartQuantity, 0),
      addToCart,
      updateCartQuantity,
      removeFromCart,
      clearCart,
    }),
    [items, subtotal]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart must be used inside CartProvider");
  }

  return context;
}
