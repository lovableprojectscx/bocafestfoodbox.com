import { Plus } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useCart, type Product } from "@/lib/cart";
import { useReveal } from "@/hooks/useReveal";
import { useEffect, useState } from "react";
import { fetchProducts } from "@/lib/api/products";

function ProductCard({ p, delay }: { p: Product; delay: number }) {
  const ref = useReveal();
  const { add } = useCart();
  return (
    <article
      ref={ref}
      className="bf-reveal group bf-card-hover flex h-full flex-col overflow-hidden rounded-2xl bg-card md:rounded-3xl"
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={p.image}
          alt={`${p.name} Bocafest — regalo sorpresa a domicilio en Ayacucho`}
          loading="lazy"
          width={800}
          height={600}
          className="bf-img-zoom h-full w-full object-cover"
        />
      </div>
      <div className="flex flex-1 flex-col gap-2 p-3 md:gap-3 md:p-5">
        <div className="space-y-1">
          <h3 className="font-display text-lg leading-tight text-primary md:text-2xl">{p.name}</h3>
          <p className="line-clamp-2 text-xs text-muted-foreground md:text-sm">{p.description}</p>
        </div>
        <div className="mt-auto flex items-center justify-between gap-2 pt-1 md:pt-2">
          <span className="font-serif text-xl text-accent md:text-3xl">S/ {p.price}</span>
          <button
            onClick={() => add(p)}
            aria-label={`Agregar ${p.name}`}
            className="inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-1.5 text-xs font-medium text-primary-foreground transition-transform hover:scale-105 md:px-4 md:py-2 md:text-sm"
          >
            <Plus className="h-3.5 w-3.5 md:h-4 md:w-4" /> <span className="hidden sm:inline">Agregar</span>
          </button>
        </div>
      </div>
    </article>
  );
}

function ProductCardSkeleton() {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl bg-card md:rounded-3xl animate-pulse">
      <div className="aspect-[4/3] bg-muted" />
      <div className="flex flex-col gap-3 p-3 md:p-5">
        <div className="h-5 w-3/4 rounded bg-muted" />
        <div className="h-3 w-full rounded bg-muted" />
        <div className="mt-auto flex items-center justify-between pt-2">
          <div className="h-6 w-16 rounded bg-muted" />
          <div className="h-8 w-20 rounded-full bg-muted" />
        </div>
      </div>
    </div>
  );
}

export function Catalog() {
  const headRef = useReveal();
  const [productsList, setProductsList] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts()
      .then((data) => {
        setProductsList(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <section id="catalogo" className="relative px-5 py-14 md:px-10 md:py-24">
      {/* SEO: invisible h2 — visible only to search engines */}
      <h2 className="sr-only">Boxes de regalo personalizados para cumpleaños, aniversarios y ocasiones especiales en Ayacucho con delivery</h2>
      <div className="mx-auto max-w-7xl">
        <div ref={headRef} className="bf-reveal mb-14 text-center">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-accent">
            Nuestro menú
          </p>
          <h2 className="font-display text-4xl text-primary md:text-6xl">
            Lo más <em className="italic">pedido</em>
          </h2>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-4">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => <ProductCardSkeleton key={i} />)
            : productsList.map((p, i) => (
                <ProductCard key={p.id} p={p} delay={i * 100} />
              ))
          }
        </div>
        <div className="mt-12 text-center">
          <Link
            to="/catalogo"
            className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-card px-6 py-3 text-sm font-medium text-primary transition hover:bg-primary hover:text-primary-foreground"
          >
            Ver catálogo completo
          </Link>
        </div>
      </div>
    </section>
  );
}
