import { MessageCircle } from "lucide-react";
import { useReveal } from "@/hooks/useReveal";
import { useSettings } from "@/lib/settings-context";

export function FinalCTA() {
  const ref = useReveal();
  const { waUrl } = useSettings();
  return (
    <section className="px-5 py-14 md:px-10 md:py-24">
      <div ref={ref} className="bf-reveal mx-auto max-w-3xl text-center">
        <h2 className="font-display text-4xl text-primary md:text-6xl">
          ¿Lista para <em className="italic">sorprender?</em>
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
          Cada box se prepara a pedido con ingredientes frescos. Elige el tuyo y lo dejamos en la puerta de tu hogar.
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <a
            href="#catalogo"
            className="inline-flex h-12 items-center justify-center rounded-full bg-primary px-8 text-sm font-medium text-primary-foreground transition-transform hover:scale-105"
          >
            Ver el menú
          </a>
          <a
            href={waUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-primary/30 px-8 text-sm font-medium text-primary transition-colors hover:bg-primary/5"
          >
            <MessageCircle className="h-4 w-4" /> Escribir por WhatsApp
          </a>
        </div>
      </div>
    </section>
  );
}
