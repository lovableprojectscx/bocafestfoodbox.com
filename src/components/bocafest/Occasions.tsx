import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useReveal } from "@/hooks/useReveal";
import { fetchCategories } from "@/lib/api/categories";
import cumplePc from "@/assets/bocafest/cumpleanos-pc.webp";
import cumpleM from "@/assets/bocafest/cumpleanos-mobile.webp";
import parejaPc from "@/assets/bocafest/pareja-pc.webp";
import parejaM from "@/assets/bocafest/pareja-mobile.webp";
import sorpresaPc from "@/assets/bocafest/sorpresa-pc.webp";
import sorpresaM from "@/assets/bocafest/sorpresa-mobile.webp";
import autoPc from "@/assets/bocafest/autocuidado-pc.webp";
import autoM from "@/assets/bocafest/autocuidado-mobile.webp";

type Occasion = {
  id: string;
  title: string;
  phrase: string;
  pc: string;
  mobile: string;
};

const occasions: Occasion[] = [
  {
    id: "cumple",
    title: "Cumpleaños",
    phrase: "El mejor regalo es empezar su día con amor.",
    pc: cumplePc,
    mobile: cumpleM,
  },
  {
    id: "pareja",
    title: "Para dos",
    phrase: "Para los momentos que merecen ser especiales.",
    pc: parejaPc,
    mobile: parejaM,
  },
  {
    id: "sorpresa",
    title: "Sorpresa",
    phrase: "Sorpréndela esta mañana, sin razón aparente.",
    pc: sorpresaPc,
    mobile: sorpresaM,
  },
  {
    id: "auto",
    title: "Para ti",
    phrase: "Porque tú también te mereces ese momento.",
    pc: autoPc,
    mobile: autoM,
  },
];

export function Occasions() {
  const headRef = useReveal();
  const [active, setActive] = useState(0);
  const [dbCategories, setDbCategories] = useState<string[]>([]);
  const current = occasions[active];
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    fetchCategories().then(cats => setDbCategories(cats)).catch(console.error);
  }, []);

  useEffect(() => {
    timer.current = setInterval(() => {
      setActive((a) => (a + 1) % occasions.length);
    }, 4000);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, []);

  return (
    <section id="ocasiones" className="relative overflow-hidden px-5 py-12 md:px-10 md:py-20">
      {/* Decorative shapes */}
      <div
        aria-hidden
        className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-rose/30 blur-3xl md:h-96 md:w-96"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-32 bottom-0 h-80 w-80 rounded-full bg-accent/10 blur-3xl md:h-[28rem] md:w-[28rem]"
      />

      <div className="relative mx-auto max-w-5xl">
        <div ref={headRef} className="bf-reveal mb-6 text-center md:mb-8">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.3em] text-accent md:text-xs">
            Categorías
          </p>
          <h2 className="font-display text-3xl text-primary md:text-5xl">
            ¿Para quién es <em className="italic">este regalo?</em>
          </h2>
        </div>

        {/* Image stage */}
        <div className="relative mx-auto aspect-[4/5] w-full max-w-md overflow-hidden rounded-[2rem] bg-card shadow-xl shadow-primary/10 sm:aspect-[16/10] sm:max-w-3xl md:rounded-[2.5rem]">
          {occasions.map((o, i) => (
            <picture key={o.id}>
              <source media="(min-width: 768px)" srcSet={o.pc} />
              <img
                src={o.mobile}
                alt={o.title}
                loading="lazy"
                width={651}
                height={872}
                className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${
                  i === active ? "opacity-100" : "opacity-0"
                }`}
              />
            </picture>
          ))}
          <div className="absolute inset-0 bg-gradient-to-t from-primary/85 via-primary/20 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-6 md:p-10">
            <p className="max-w-md font-display text-xl italic leading-snug text-primary-foreground md:text-3xl">
              "{current.phrase}"
            </p>
          </div>
          {/* Progress bar */}
          <div className="absolute inset-x-0 top-0 h-1 bg-background/20">
            <div
              key={active}
              className="h-full bg-accent"
              style={{
                animation: "bf-progress 4s linear forwards",
                transformOrigin: "left center",
              }}
            />
          </div>
        </div>

        {/* Category Links */}
        <div className="-mx-5 mt-5 flex gap-2 overflow-x-auto px-5 pb-2 md:mx-0 md:mt-7 md:flex-wrap md:justify-center md:px-0">
          {dbCategories.map((cat, i) => {
            const num = (i + 1).toString().padStart(2, "0");
            return (
              <Link
                key={cat}
                to="/catalogo"
                search={{ category: cat }}
                className="shrink-0 rounded-full border border-primary/15 bg-card px-4 py-2 text-sm font-medium text-primary transition hover:border-primary/40 hover:bg-primary/5 md:text-base"
              >
                <span className="mr-2 font-mono text-[10px] text-muted-foreground">
                  {num}
                </span>
                {cat}
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
