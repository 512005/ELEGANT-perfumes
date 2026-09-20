import { createContext, useContext, useEffect, useMemo, useState } from "react";

export type CartItem = { id: number; name: string; price: number; imageUrl: string | null; size: string | null; reservationToken: string; reservationExpiresAt: number };
type CartContextValue = { items: CartItem[]; count: number; total: number; addItem: (item: CartItem) => boolean; removeItem: (id: number) => void; clear: () => void };
const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "perfume-brand-cart";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      const parsed = saved ? JSON.parse(saved) : [];
      return Array.isArray(parsed) ? parsed.filter((item) => item?.reservationToken && item?.reservationExpiresAt) : [];
    } catch { return []; }
  });
  useEffect(() => localStorage.setItem(STORAGE_KEY, JSON.stringify(items)), [items]);
  const value = useMemo(() => ({
    items,
    count: items.length,
    total: items.reduce((sum, item) => sum + item.price, 0),
    addItem: (item: CartItem) => { if (items.some((existing) => existing.id === item.id)) return false; setItems((current) => [...current, item]); return true; },
    removeItem: (id: number) => setItems((current) => current.filter((item) => item.id !== id)),
    clear: () => setItems([]),
  }), [items]);
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used inside CartProvider");
  return context;
}
