import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { toast } from 'sonner';

export type CartItem = { listingId: string; title: string; providerId: string; price: number; qty: number; expiresAt: string; qtyAvailable: number; };
type CtxType = { items: CartItem[]; add: (item: Omit<CartItem, 'qty'>, qty?: number) => void; remove: (listingId: string) => void; setQty: (listingId: string, qty: number) => void; clear: () => void; subtotal: number; };
const Ctx = createContext<CtxType>({} as any);
const LS_KEY = 'ffe_cart';

export function CartProvider({ children }: any) {
  const [items, setItems] = useState<CartItem[]>([]);
  useEffect(() => { const raw = localStorage.getItem(LS_KEY); if (raw) setItems(JSON.parse(raw)); }, []);
  useEffect(() => { localStorage.setItem(LS_KEY, JSON.stringify(items)); }, [items]);

  const add = useCallback((item: Omit<CartItem, 'qty'>, qty = 1) => {
    setItems((cur) => {
      const idx = cur.findIndex(x => x.listingId === item.listingId);
      if (idx >= 0) {
        const copy = [...cur];
        const newQty = copy[idx].qty + qty;
        if (newQty > item.qtyAvailable) {
          toast.error(`Only ${item.qtyAvailable} items available in stock!`, { id: 'qty-limit' });
          copy[idx] = { ...copy[idx], qty: item.qtyAvailable };
        } else {
          copy[idx] = { ...copy[idx], qty: newQty };
        }
        return copy;
      }
      if (qty > item.qtyAvailable) {
        toast.error(`Only ${item.qtyAvailable} items available in stock!`, { id: 'qty-limit' });
        return [...cur, { ...item, qty: item.qtyAvailable }];
      }
      return [...cur, { ...item, qty }];
    });
  }, []);

  const remove = useCallback((listingId: string) => { 
    setItems((cur) => cur.filter(x => x.listingId !== listingId)); 
  }, []);

  const setQty = useCallback((listingId: string, qty: number) => { 
    setItems((cur) => cur.map(x => {
      if (x.listingId === listingId) {
        if (qty > x.qtyAvailable) {
          toast.error(`Only ${x.qtyAvailable} items available in stock!`, { id: 'qty-limit' });
          return { ...x, qty: x.qtyAvailable };
        }
        return { ...x, qty };
      }
      return x;
    })); 
  }, []);

  const clear = useCallback(() => { 
    setItems([]); 
  }, []);
  const subtotal = items.reduce((s, it) => s + it.price * it.qty, 0);
  const value = useMemo(() => ({ items, add, remove, setQty, clear, subtotal }), [items, subtotal]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
export const useCart = () => useContext(Ctx);