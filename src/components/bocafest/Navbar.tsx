import { useEffect, useState } from "react";
import { ShoppingBag, Menu, X, ArrowRight, ChevronDown } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useCart } from "@/lib/cart";
import { useSettings } from "@/lib/settings-context";
import { fetchCategories } from "@/lib/api/categories";
import logo from "@/assets/bocafest/logo.png";

export function Navbar() {
  const { count, open } = useCart();
  const { waUrl, whatsapp } = useSettings();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [catOpen, setCatOpen] = useState(false);
  const [categories, setCategories] = useState<string[]>(['Todos']);

  // Cargar categorías una sola vez al montar el Navbar
  useEffect(() => {
    fetchCategories().then(cats => setCategories(['Todos', ...cats]));
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-40 transition-all duration-500 ${
          scrolled ? "p-0 md:p-4" : "p-0 md:p-6 md:pt-6"
        }`}
      >
        <div
          className={`mx-auto flex max-w-5xl items-center justify-between transition-all duration-500 px-4 md:px-6 ${
            scrolled
              ? "h-14 md:h-16 bg-white/95 shadow-lg shadow-primary/5 backdrop-blur-xl md:rounded-full md:border md:border-white/40 border-b border-primary/10"
              : "h-16 md:h-20 bg-white/95 shadow-sm backdrop-blur-md md:rounded-full md:border md:border-white/40 border-b border-primary/5"
          }`}
        >
          {/* Left Area: Menu Button (Mobile) or Links (Desktop) */}
          <div className="flex flex-1 items-center justify-start">
            <button
              onClick={() => setMenuOpen(true)}
              aria-label="Abrir menú"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full text-primary transition-colors hover:bg-primary/5 md:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>

            <nav className="hidden items-center gap-2 md:flex">
              <Link
                to="/"
                className="rounded-full px-4 py-2 text-sm font-semibold text-primary transition-all hover:bg-primary/5 hover:text-accent"
                activeOptions={{ exact: true }}
                activeProps={{ className: "text-accent bg-primary/5" }}
              >
                Inicio
              </Link>
              <Link
                to="/catalogo"
                className="rounded-full px-4 py-2 text-sm font-semibold text-primary transition-all hover:bg-primary/5 hover:text-accent"
                activeProps={{ className: "text-accent bg-primary/5" }}
              >
                Catálogo
              </Link>
            </nav>
          </div>

          {/* Center Area: Logo */}
          <Link
            to="/"
            className="flex flex-shrink-0 items-center justify-center transition-transform hover:scale-105"
            aria-label="Bocafest"
          >
            <img
              src={logo}
              alt="Bocafest Food Box"
              width={444}
              height={122}
              decoding="async"
              className={`w-auto transition-all duration-500 ${
                scrolled ? "h-8 md:h-10" : "h-10 md:h-12"
              }`}
            />
          </Link>

          {/* Right Area: Contact (Desktop) & Cart */}
          <div className="flex flex-1 items-center justify-end gap-2">
            <a
              href={waUrl()}
              target="_blank"
              rel="noreferrer"
              className="hidden rounded-full px-4 py-2 text-sm font-semibold text-primary transition-all hover:bg-primary/5 hover:text-accent md:inline-flex"
            >
              Contacto
            </a>

            <button
              onClick={open}
              aria-label="Abrir carrito"
              className="relative inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md transition-transform hover:scale-105"
            >
              <ShoppingBag className="h-[18px] w-[18px]" />
              {count > 0 && (
                <span className="bf-pop absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-white shadow-sm ring-2 ring-white">
                  {count}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile menu drawer */}
      <div
        className={`fixed inset-0 z-50 md:hidden ${menuOpen ? "" : "pointer-events-none"}`}
        aria-hidden={!menuOpen}
      >
        <div
          onClick={() => setMenuOpen(false)}
          className={`absolute inset-0 bg-primary/20 backdrop-blur-sm transition-opacity duration-300 ${
            menuOpen ? "opacity-100" : "opacity-0"
          }`}
        />
        <aside
          className={`absolute bottom-0 left-0 top-0 flex w-[85%] max-w-xs flex-col overflow-y-auto bg-background/95 backdrop-blur-xl shadow-2xl transition-transform duration-500 ease-out ${
            menuOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex shrink-0 items-center justify-between border-b border-primary/10 px-6 py-5">
            <img src={logo} alt="Bocafest" width={444} height={122} decoding="async" className="h-8 w-auto" />
            <button
              onClick={() => setMenuOpen(false)}
              aria-label="Cerrar menú"
              className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/5 text-primary transition-colors hover:bg-primary/10"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          
          <nav className="flex flex-col gap-2 p-6">
            <Link
              to="/"
              onClick={() => setMenuOpen(false)}
              className="group flex items-center justify-between rounded-2xl px-4 py-4 text-lg font-display text-primary transition-all hover:bg-primary/5"
            >
              Inicio
              <ArrowRight className="h-4 w-4 opacity-0 transition-all group-hover:translate-x-1 group-hover:opacity-100" />
            </Link>
            
            <div className="flex flex-col">
              <button
                onClick={() => setCatOpen(!catOpen)}
                className="group flex w-full items-center justify-between rounded-2xl px-4 py-4 text-left text-lg font-display text-primary transition-all hover:bg-primary/5"
              >
                Catálogo
                <ChevronDown className={`h-4 w-4 text-primary/50 transition-transform duration-300 ${catOpen ? "rotate-180" : ""}`} />
              </button>
              
              <div
                className={`overflow-hidden transition-all duration-300 ease-in-out ${
                  catOpen ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0"
                }`}
              >
                <div className="flex flex-col gap-1 py-2 pl-8 pr-4">
                  {categories.map((cat) => (
                    <Link
                      key={cat}
                      to="/catalogo"
                      search={{ category: cat === "Todos" ? undefined : cat }}
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center justify-between rounded-xl px-4 py-2.5 text-sm font-medium text-muted-foreground transition-all hover:bg-primary/5 hover:text-accent"
                    >
                      {cat}
                      <ArrowRight className="h-3 w-3 opacity-0 transition-all group-hover:translate-x-1 group-hover:opacity-100" />
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            <a
              href={waUrl()}
              target="_blank"
              rel="noreferrer"
              onClick={() => setMenuOpen(false)}
              className="group flex items-center justify-between rounded-2xl px-4 py-4 text-lg font-display text-primary transition-all hover:bg-primary/5"
            >
              Escríbenos
              <ArrowRight className="h-4 w-4 opacity-0 transition-all group-hover:translate-x-1 group-hover:opacity-100" />
            </a>
          </nav>
          
          <div className="mt-auto shrink-0 p-6">
            <div className="rounded-2xl bg-primary/5 p-5 text-center">
              <p className="font-serif text-sm italic text-muted-foreground">¿Necesitas ayuda?</p>
              <a
                href={waUrl()}
                target="_blank"
                rel="noreferrer"
                className="mt-1 block font-bold text-primary hover:text-accent transition-colors"
              >
                {whatsapp ? '+' + whatsapp.replace(/^(51)(.{3})(.{3})(.{3})/, '$1 $2 $3 $4') : '+51 901 180 198'}
              </a>
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}
