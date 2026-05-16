import { useState } from "react";
import { Minus, Plus, X, Trash2 } from "lucide-react";
import { useCart, formatPEN } from "@/lib/cart";
import { CheckoutModal } from "./CheckoutModal";

export function CartSheet() {
  const { isOpen, close, items, inc, dec, remove, total, count } = useCart();
  const [checkout, setCheckout] = useState(false);

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={close}
        className={`fixed inset-0 z-50 bg-primary/40 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        aria-hidden
      />
      {/* Panel */}
      <aside
        role="dialog"
        aria-label="Carrito"
        className={`fixed right-0 top-0 z-50 flex h-[100svh] w-full max-w-md flex-col bg-background shadow-2xl transition-transform duration-500 ease-[cubic-bezier(.2,.7,.2,1)] ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-border px-6 py-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-accent">Tu pedido</p>
            <h3 className="font-display text-2xl text-primary">Carrito ({count})</h3>
          </div>
          <button
            onClick={close}
            aria-label="Cerrar carrito"
            className="grid h-10 w-10 place-items-center rounded-full text-primary hover:bg-muted"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
          {items.length === 0 ? (
            <p className="mt-12 text-center font-serif text-lg text-muted-foreground">
              Tu carrito está vacío.<br />Elige un box delicioso para empezar.
            </p>
          ) : (
            items.map((i) => (
              <div key={i.id} className="flex gap-3 rounded-2xl border border-border p-3">
                <img src={i.image} alt={i.name} className="h-20 w-20 rounded-xl object-cover" />
                <div className="flex flex-1 flex-col">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-display text-lg leading-tight text-primary">{i.name}</p>
                    <button
                      onClick={() => remove(i.id)}
                      aria-label={`Quitar ${i.name}`}
                      className="text-muted-foreground hover:text-accent"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="mt-auto flex items-center justify-between">
                    <div className="inline-flex items-center rounded-full border border-border">
                      <button onClick={() => dec(i.id)} aria-label="Restar" className="grid h-8 w-8 place-items-center text-primary">
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="w-7 text-center text-sm">{i.qty}</span>
                      <button onClick={() => inc(i.id)} aria-label="Sumar" className="grid h-8 w-8 place-items-center text-primary">
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <span className="font-serif text-lg text-accent">{formatPEN(i.price * i.qty)}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t border-border px-6 py-5">
            <div className="mb-4 flex items-center justify-between">
              <span className="font-serif text-lg text-muted-foreground">Total</span>
              <span className="font-display text-2xl text-primary">{formatPEN(total)}</span>
            </div>
            <button
              onClick={() => setCheckout(true)}
              className="inline-flex h-12 w-full items-center justify-center rounded-full bg-primary text-sm font-medium text-primary-foreground transition-transform hover:scale-[1.02]"
            >
              Confirmar pedido →
            </button>
          </div>
        )}
      </aside>

      {checkout && <CheckoutModal onClose={() => setCheckout(false)} />}
    </>
  );
}
