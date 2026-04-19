import { createContext, useContext, useEffect, useMemo, useState } from 'react';

export type CartItem = { listingId: string; title: string; providerId: string; price: number; qty: number; expiresAt: string; };
type CtxType = { items: CartItem[]; add: (item: Omit<CartItem, 'qty'>, qty?: number) => void; remove: (listingId: string) => void; setQty: (listingId: string, qty: number) => void; clear: () => void; subtotal: number; };
const Ctx = createContext<CtxType>({} as any);
const LS_KEY = 'ffe_cart';

export function CartProvider({ children }: any) {
  const [items, setItems] = useState<CartItem[]>([]);
  useEffect(() => { const raw = localStorage.getItem(LS_KEY); if (raw) setItems(JSON.parse(raw)); }, []);
  useEffect(() => { localStorage.setItem(LS_KEY, JSON.stringify(items)); }, [items]);

  function add(item: Omit<CartItem, 'qty'>, qty = 1) {
    setItems((cur) => {
      const idx = cur.findIndex(x => x.listingId === item.listingId);
      if (idx >= 0) { const copy = [...cur]; copy[idx] = { ...copy[idx], qty: copy[idx].qty + qty }; return copy; }
      return [...cur, { ...item, qty }];
    });
  }
  function remove(listingId: string) { setItems((cur) => cur.filter(x => x.listingId !== listingId)); }
  function setQty(listingId: string, qty: number) { setItems((cur) => cur.map(x => x.listingId === listingId ? { ...x, qty } : x)); }
  function clear() { setItems([]); }
  const subtotal = items.reduce((s, it) => s + it.price * it.qty, 0);
  const value = useMemo(() => ({ items, add, remove, setQty, clear, subtotal }), [items, subtotal]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
export const useCart = () => useContext(Ctx);