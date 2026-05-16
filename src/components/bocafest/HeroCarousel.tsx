import { useEffect, useRef, useState } from "react";
import { ArrowDown, ChevronLeft, ChevronRight } from "lucide-react";
import hero1Pc from "@/assets/bocafest/hero-1-pc.webp";
import hero2Pc from "@/assets/bocafest/hero-2-pc.webp";
import hero3Pc from "@/assets/bocafest/hero-3-pc.webp";
import hero1M from "@/assets/bocafest/hero-1-mobile.webp";
import hero2M from "@/assets/bocafest/hero-2-mobile.webp";
import hero3M from "@/assets/bocafest/hero-3-mobile.webp";
import logo from "@/assets/bocafest/logo.png";

const slides = [
  { pc: hero1Pc, mobile: hero1M, alt: "Bocafest Food Box — regalos sorpresa y desayunos a domicilio en Ayacucho Perú" },
  { pc: hero2Pc, mobile: hero2M, alt: "Bocafest Food Box — regalos sorpresa y desayunos a domicilio en Ayacucho Perú" },
  { pc: hero3Pc, mobile: hero3M, alt: "Bocafest Food Box — regalos sorpresa y desayunos a domicilio en Ayacucho Perú" },
];

export function HeroCarousel() {
  const [active, setActive] = useState(0);
  const [showCta, setShowCta] = useState(false);
  const [paused, setPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);

  const go = (dir: 1 | -1) => setActive((i) => (i + dir + slides.length) % slides.length);

  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => setActive((i) => (i + 1) % slides.length), 5000);
    return () => clearInterval(t);
  }, [paused]);

  useEffect(() => {
    const s = setTimeout(() => setShowCta(true), 2000);
    return () => clearTimeout(s);
  }, []);

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    setPaused(true);
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current == null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
    touchStartX.current = null;
    setTimeout(() => setPaused(false), 4000);
  };

  return (
    <section
      id="top"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      className="relative w-full overflow-hidden bg-[oklch(0.957_0.018_80)] mt-16 md:mt-[112px] aspect-[4/5] md:h-[80vh] md:aspect-auto touch-pan-y select-none"
    >
      {/* SEO: invisible h1 — visible only to search engines */}
      <h1 className="sr-only">Bocafest Food Box — Regalos Sorpresa y Desayunos a Domicilio en Ayacucho</h1>

      {slides.map((s, i) => (
        <div
          key={i}
          className="absolute inset-0 transition-opacity duration-1000 ease-in-out"
          style={{ opacity: i === active ? 1 : 0 }}
          aria-hidden={i !== active}
        >
          <picture>
            <source media="(min-width: 768px)" srcSet={s.pc} />
            <img
              src={s.mobile}
              alt={s.alt}
              className="h-full w-full object-cover object-center"
              loading={i === 0 ? "eager" : "lazy"}
              fetchPriority={i === 0 ? "high" : "auto"}
            />
          </picture>
        </div>
      ))}



      {/* Dots */}
      <div className="absolute bottom-10 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2">
        {slides.map((_, i) => (
          <button
            key={i}
            aria-label={`Ir al slide ${i + 1}`}
            onClick={() => setActive(i)}
            className={`h-2 rounded-full bg-white/80 transition-all duration-500 ${
              i === active ? "w-8" : "w-2 opacity-60 hover:opacity-100"
            }`}
          />
        ))}
      </div>

      {/* Prev / Next */}
      <button
        onClick={() => go(-1)}
        aria-label="Anterior"
        className="absolute left-2 top-1/2 z-10 -translate-y-1/2 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/70 text-primary backdrop-blur transition hover:bg-white md:left-6 md:h-12 md:w-12"
      >
        <ChevronLeft className="h-5 w-5 md:h-6 md:w-6" />
      </button>
      <button
        onClick={() => go(1)}
        aria-label="Siguiente"
        className="absolute right-2 top-1/2 z-10 -translate-y-1/2 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/70 text-primary backdrop-blur transition hover:bg-white md:right-6 md:h-12 md:w-12"
      >
        <ChevronRight className="h-5 w-5 md:h-6 md:w-6" />
      </button>

      {/* Floating CTA */}
      <a
        href="#catalogo"
        className={`fixed bottom-6 right-6 z-30 hidden items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground shadow-xl shadow-primary/20 transition-opacity duration-700 hover:opacity-90 md:inline-flex ${
          showCta ? "opacity-100" : "opacity-0"
        }`}
      >
        Ver boxes <ArrowDown className="h-4 w-4" />
      </a>
    </section>
  );
}
