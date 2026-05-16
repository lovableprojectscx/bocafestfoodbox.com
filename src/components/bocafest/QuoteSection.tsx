import { useReveal } from "@/hooks/useReveal";
import bg from "@/assets/bocafest/pareja-pc.webp";

const pills = ["Lunes a domingo", "Delivery Ayacucho", "Siempre a pedido"];

export function QuoteSection() {
  const ref = useReveal();
  return (
    <section
      className="relative isolate flex min-h-[480px] items-center justify-center overflow-hidden px-6 py-24 md:min-h-[560px] md:bg-fixed"
      style={{
        backgroundImage: `linear-gradient(oklch(0.31 0.04 155 / .55), oklch(0.31 0.04 155 / .55)), url(${bg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div ref={ref} className="bf-reveal mx-auto max-w-3xl text-center text-primary-foreground">
        <div className="mx-auto mb-6 h-px w-16 bg-gold" />
        <p className="font-display text-3xl italic leading-snug md:text-5xl">
          “Preparado con cuidado, pensado para ti cada mañana.”
        </p>
        <p className="mt-6 font-serif text-base text-gold/90">— Bocafest Food Box</p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          {pills.map((p, i) => (
            <span
              key={p}
              className="bf-pop rounded-full border border-white/30 bg-white/10 px-4 py-2 text-sm backdrop-blur"
              style={{ animationDelay: `${i * 150 + 200}ms` }}
            >
              {p}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
