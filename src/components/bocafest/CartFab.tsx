import { ShoppingBag } from "lucide-react";
import { useCart } from "@/lib/cart";

export function CartFab() {
  const { count, open } = useCart();
  if (count === 0) return null;
  return (
    <button
      onClick={open}
      aria-label="Abrir carrito"
      className="fixed bottom-5 right-5 z-30 inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-2xl shadow-primary/40 transition-transform hover:scale-105 md:hidden"
    >
      <ShoppingBag className="h-5 w-5" />
      <span className="bf-pop absolute -right-1 -top-1 inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-accent px-1.5 text-xs font-semibold text-accent-foreground">
        {count}
      </span>
    </button>
  );
}
