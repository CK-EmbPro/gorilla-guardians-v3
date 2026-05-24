import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

const CART_KEY = "gg_cart_v1";

export interface CartItem {
  productId: number;
  name: string;
  price: number;
  discountPrice: number | null;
  quantity: number;
  artisanName: string | null;
  image: string | null;
}

interface CartContextType {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  addToCart: (product: {
    id: number;
    name: string;
    price: number;
    discountPrice?: number | null;
    artisan?: { name: string } | null;
    images?: string[] | null;
  }, qty?: number) => void;
  removeFromCart: (productId: number) => void;
  updateQty: (productId: number, quantity: number) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | null>(null);

function load(): CartItem[] {
  try {
    const raw = localStorage.getItem(CART_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function save(items: CartItem[]) {
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
  } catch {}
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(load);

  useEffect(() => {
    save(items);
  }, [items]);

  const addToCart = (product: any, qty = 1) => {
    setItems(prev => {
      const idx = prev.findIndex(i => i.productId === product.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], quantity: next[idx].quantity + qty };
        return next;
      }
      return [
        ...prev,
        {
          productId: product.id,
          name: product.name,
          price: product.price,
          discountPrice: product.discountPrice ?? null,
          quantity: qty,
          artisanName: product.artisan?.name ?? null,
          image: product.images?.[0] ?? null,
        },
      ];
    });
  };

  const removeFromCart = (productId: number) => {
    setItems(prev => prev.filter(i => i.productId !== productId));
  };

  const updateQty = (productId: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setItems(prev =>
      prev.map(i => (i.productId === productId ? { ...i, quantity } : i))
    );
  };

  const clearCart = () => setItems([]);

  const itemCount = items.reduce((s, i) => s + i.quantity, 0);
  const subtotal = items.reduce(
    (s, i) => s + (i.discountPrice ?? i.price) * i.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{ items, itemCount, subtotal, addToCart, removeFromCart, updateQty, clearCart }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
