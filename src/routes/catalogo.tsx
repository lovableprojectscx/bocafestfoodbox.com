import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { Plus, Search, ArrowLeft, X } from "lucide-react";
import { useCart, formatPEN } from "@/lib/cart";
import { Navbar } from "@/components/bocafest/Navbar";
import { Footer } from "@/components/bocafest/Footer";
import { CartSheet } from "@/components/bocafest/CartSheet";
import { CartFab } from "@/components/bocafest/CartFab";
import { CursorDot } from "@/components/bocafest/CursorDot";
import { WhatsAppFab } from "@/components/bocafest/WhatsAppFab";
import { fetchProducts } from "@/lib/api/products";
import { fetchCategories } from "@/lib/api/categories";

type Category = string;
type CatalogProduct = { id: string; name: string; description: string; price: number; category: string; image: string; };

export const Route = createFileRoute("/catalogo")({
  validateSearch: (search: Record<string, unknown>) => {
    return {
      category: search.category as string | undefined,
    };
  },
  component: CatalogoPage,
  head: () => ({
    meta: [
      { title: "Catálogo — Bocafest Food Box" },
      { name: "description", content: "Explora todos los desayunos sorpresa de Bocafest. Filtra por categoría, busca tu favorito y pídelo por WhatsApp." },
    ],
  }),
});

function CatalogoPage() {
  return (
    <>
      <CursorDot />
      <Navbar />
      <main className="pt-16 md:pt-20">
        <CatalogContent />
      </main>
      <Footer />
      <CartSheet />
      <CartFab />
      <WhatsAppFab />
    </>
  );
}

function CatalogContent() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const [query, setQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<CatalogProduct | null>(null);
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [categories, setCategories] = useState<string[]>(['Todos']);
  const [loadingData, setLoadingData] = useState(true);

  // Cargar productos y categorías solo una vez al montar — el filtro se hace en useMemo
  useEffect(() => {
    setLoadingData(true);
    Promise.all([fetchProducts(), fetchCategories()]).then(([prods, cats]) => {
      setProducts(prods);
      setCategories(['Todos', ...cats]);
      setLoadingData(false);
    }).catch(() => setLoadingData(false));
  }, []);

  const category = (search.category as Category) || "Todos";

  const handleSetCategory = (c: Category) => {
    navigate({ search: { category: c === "Todos" ? undefined : c } });
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      const inCat = category === "Todos" || p.category === category;
      const inQ = !q || p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q);
      return inCat && inQ;
    });
  }, [query, category, products]);

  if (loadingData) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
    </div>
  );

  return (
    <section className="px-5 py-6 md:px-10 md:py-12">
      <div className="mx-auto max-w-7xl">
        <Link
          to="/"
          className="mb-4 inline-flex items-center gap-2 text-xs text-muted-foreground transition hover:text-primary md:text-sm"
        >
          <ArrowLeft className="h-4 w-4" /> Volver
        </Link>

        <header className="mb-6 max-w-2xl md:mb-8">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.3em] text-accent md:text-xs">
            Catálogo
          </p>
          <h1 className="font-display text-3xl text-primary md:text-5xl">
            Todos nuestros <em className="italic">boxes</em>
          </h1>
          <p className="mt-2 text-sm text-muted-foreground md:mt-3 md:text-base">
            Hechos a pedido en Ayacucho. Encuentra el desayuno perfecto para regalar o regalarte.
          </p>
        </header>

        {/* Search + filters */}
        <div className="mb-10 space-y-4">
          <div className="relative max-w-md">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar un box..."
              className="h-12 w-full rounded-full border border-primary/15 bg-card pl-11 pr-10 text-sm text-primary placeholder:text-muted-foreground/70 focus:border-primary/50 focus:outline-none"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                aria-label="Limpiar búsqueda"
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-muted-foreground transition hover:bg-primary/5 hover:text-primary"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 md:mx-0 md:flex-wrap md:px-0">
            {categories.map((c) => {
              const active = c === category;
              return (
                <button
                  key={c}
                  onClick={() => handleSetCategory(c)}
                  className={`shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition ${
                    active
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-primary/15 bg-card text-primary hover:border-primary/40"
                  }`}
                >
                  {c}
                </button>
              );
            })}
          </div>

          <p className="text-xs text-muted-foreground">
            {filtered.length} {filtered.length === 1 ? "resultado" : "resultados"}
          </p>
        </div>

        {/* Grid */}
        {filtered.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-primary/20 bg-card/50 px-6 py-20 text-center">
            <p className="font-display text-2xl text-primary">Sin resultados</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Prueba con otra palabra o cambia de categoría.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((p) => (
              <CatalogCard key={p.id} p={p} onClick={() => setSelectedProduct(p)} />
            ))}
          </div>
        )}
      </div>

      {selectedProduct && (
        <ProductModal p={selectedProduct} onClose={() => setSelectedProduct(null)} />
      )}
    </section>
  );
}

function CatalogCard({ p, onClick }: { p: CatalogProduct; onClick: () => void }) {
  const { add } = useCart();
  return (
    <article 
      onClick={onClick}
      className="group flex h-full cursor-pointer flex-col overflow-hidden rounded-2xl bg-card transition hover:-translate-y-0.5 hover:shadow-lg md:rounded-3xl"
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={p.image}
          alt={p.name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <span className="absolute left-3 top-3 rounded-full bg-background/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-primary backdrop-blur">
          {p.category}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-3 md:gap-3 md:p-5">
        <div className="space-y-1">
          <h3 className="font-display text-lg leading-tight text-primary md:text-2xl">{p.name}</h3>
          <p className="line-clamp-2 text-xs text-muted-foreground md:text-sm">{p.description}</p>
        </div>
        <div className="mt-auto flex items-center justify-between gap-2 pt-1 md:pt-2">
          <span className="font-serif text-xl text-accent md:text-2xl">{formatPEN(p.price)}</span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              add(p);
            }}
            aria-label={`Agregar ${p.name}`}
            className="inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-1.5 text-xs font-medium text-primary-foreground transition-transform hover:scale-105 md:px-4 md:py-2 md:text-sm"
          >
            <Plus className="h-3.5 w-3.5 md:h-4 md:w-4" />
            <span className="hidden sm:inline">Agregar</span>
          </button>
        </div>
      </div>
    </article>
  );
}

function ProductModal({ p, onClose }: { p: CatalogProduct; onClose: () => void }) {
  const { add, open: openCart } = useCart();

  useEffect(() => {
    document.body.style.overflow = "hidden";

    // Cerrar con tecla Escape (estándar ARIA para modales)
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleEscape);
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6" aria-modal="true" role="dialog" aria-label={`Detalle de ${p.name}`}>
      <div className="absolute inset-0 bg-primary/60 backdrop-blur-sm transition-opacity" onClick={onClose} />
      <div className="bf-spring relative flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-[2rem] bg-background shadow-2xl md:flex-row">
        <button
          onClick={onClose}
          aria-label="Cerrar"
          className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-background/80 text-primary backdrop-blur transition hover:bg-background"
        >
          <X className="h-5 w-5" />
        </button>
        <div className="h-64 w-full shrink-0 md:h-auto md:w-1/2">
          <img src={p.image} alt={`${p.name} Bocafest — regalo sorpresa a domicilio en Ayacucho`} className="h-full w-full object-cover" />
        </div>
        <div className="flex flex-1 flex-col p-6 md:p-10 lg:p-12 overflow-y-auto">
          <span className="mb-3 inline-flex w-fit rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
            {p.category}
          </span>
          <h2 className="font-display text-3xl text-primary md:text-4xl">{p.name}</h2>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground md:text-lg">{p.description}</p>
          <div className="mt-auto pt-8">
            <span className="mb-6 block font-serif text-3xl text-accent md:text-4xl">{formatPEN(p.price)}</span>
            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                onClick={() => {
                  add(p);
                  onClose();
                  openCart(); // Comprar ahora → abre carrito directamente
                }}
                className="flex flex-1 items-center justify-center gap-2 rounded-full bg-accent px-6 py-4 text-base font-semibold text-accent-foreground shadow-lg transition-transform hover:scale-[1.02]"
              >
                Comprar ahora
              </button>
              <button
                onClick={() => {
                  add(p);
                  onClose();
                  // Agregar al carrito → solo añade, el carrito se abre por add()
                }}
                className="flex flex-1 items-center justify-center gap-2 rounded-full border-2 border-primary/20 bg-background px-6 py-4 text-base font-semibold text-primary transition-colors hover:bg-primary/5"
              >
                <Plus className="h-5 w-5" /> Agregar al carrito
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
