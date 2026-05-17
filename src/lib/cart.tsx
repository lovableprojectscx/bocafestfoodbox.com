import { createContext, useContext, useMemo, useReducer, type ReactNode } from "react";

export type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
};

export type CartItem = Product & { qty: number };

type State = { items: CartItem[]; isOpen: boolean };
type Action =
  | { type: "add"; product: Product }
  | { type: "remove"; id: string }
  | { type: "inc"; id: string }
  | { type: "dec"; id: string }
  | { type: "clear" }
  | { type: "open" }
  | { type: "close" };

const initial: State = { items: [], isOpen: false };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "add": {
      const existing = state.items.find((i) => i.id === action.product.id);
      const items = existing
        ? state.items.map((i) => (i.id === existing.id ? { ...i, qty: i.qty + 1 } : i))
        : [...state.items, { ...action.product, qty: 1 }];
      return { ...state, items, isOpen: true };
    }
    case "remove":
      return { ...state, items: state.items.filter((i) => i.id !== action.id) };
    case "inc":
      return { ...state, items: state.items.map((i) => (i.id === action.id ? { ...i, qty: i.qty + 1 } : i)) };
    case "dec":
      return {
        ...state,
        items: state.items
          .map((i) => (i.id === action.id ? { ...i, qty: i.qty - 1 } : i))
          .filter((i) => i.qty > 0),
      };
    case "clear":
      return { ...state, items: [] };
    case "open":
      return { ...state, isOpen: true };
    case "close":
      return { ...state, isOpen: false };
  }
}

type Ctx = {
  items: CartItem[];
  isOpen: boolean;
  count: number;
  total: number;
  add: (p: Product) => void;
  remove: (id: string) => void;
  inc: (id: string) => void;
  dec: (id: string) => void;
  clear: () => void;
  open: () => void;
  close: () => void;
};

const CartContext = createContext<Ctx | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initial);
  const value = useMemo<Ctx>(() => {
    const count = state.items.reduce((n, i) => n + i.qty, 0);
    const total = state.items.reduce((n, i) => n + i.qty * i.price, 0);
    return {
      items: state.items,
      isOpen: state.isOpen,
      count,
      total,
      add: (p) => dispatch({ type: "add", product: p }),
      remove: (id) => dispatch({ type: "remove", id }),
      inc: (id) => dispatch({ type: "inc", id }),
      dec: (id) => dispatch({ type: "dec", id }),
      clear: () => dispatch({ type: "clear" }),
      open: () => dispatch({ type: "open" }),
      close: () => dispatch({ type: "close" }),
    };
  }, [state]);
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}

export const WHATSAPP_NUMBER = "51901180198";

export function formatPEN(n: number) {
  return new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" }).format(n);
}

export function buildWhatsAppOrderUrl(
  items: CartItem[], 
  total: number, 
  phoneNumber?: string
) {
  const phone = phoneNumber || WHATSAPP_NUMBER;
  const lines = items.map((i) => `• ${i.qty} × ${i.name} — ${formatPEN(i.price * i.qty)}`).join("\n");
  
  const msg =
    `*Nuevo pedido Bocafest*\n\n` +
    `${lines}\n\n` +
    `*Total:* ${formatPEN(total)}\n\n` +
    `Hola, me gustaría coordinar los detalles de mi pedido y realizar el pago por aquí. ¡Gracias!`;
    
  return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
}
