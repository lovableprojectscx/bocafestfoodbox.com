import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { SettingsProvider } from "@/lib/settings-context";
import { AuthProvider } from "@/lib/auth-context";
import { CartProvider } from "@/lib/cart";
import faviconWebp from "@/assets/bocafest/favicon.webp";
import hero1Mobile from "@/assets/bocafest/hero-1-mobile.webp";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

const seoJsonLd = {
  "@context": "https://schema.org",
  "@type": ["LocalBusiness", "Store"],
  "name": "Bocafest Food Box",
  "description": "Boxes de regalo y desayunos sorpresa a domicilio en Ayacucho. Regalos personalizados para cumpleaños, aniversarios, Día de la Madre y ocasiones especiales.",
  "url": "https://bocafestfoodbox.com",
  "telephone": "+51901180198",
  "priceRange": "S/59 - S/150",
  "address": {
    "@type": "PostalAddress",
    "addressLocality": "Ayacucho",
    "addressRegion": "Ayacucho",
    "addressCountry": "PE"
  },
  "areaServed": { "@type": "City", "name": "Ayacucho" },
  "openingHoursSpecification": {
    "@type": "OpeningHoursSpecification",
    "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
    "opens": "07:00",
    "closes": "20:00"
  },
  "hasOfferCatalog": {
    "@type": "OfferCatalog",
    "name": "Boxes de regalo y desayunos",
    "itemListElement": [
      { "@type": "Offer", "itemOffered": { "@type": "Product", "name": "Box Clásico", "description": "Regalo sorpresa con waffles, granola, miel y frutas frescas. Ideal para cumpleaños en Ayacucho" }, "price": "65", "priceCurrency": "PEN" },
      { "@type": "Offer", "itemOffered": { "@type": "Product", "name": "Box Pareja", "description": "Detalle romántico para dos — sándwiches, parfait y jugo natural. Delivery Ayacucho" }, "price": "89", "priceCurrency": "PEN" },
      { "@type": "Offer", "itemOffered": { "@type": "Product", "name": "Box Fit", "description": "Regalo saludable y especial — equilibrado, fresco y lleno de energía" }, "price": "59", "priceCurrency": "PEN" },
      { "@type": "Offer", "itemOffered": { "@type": "Product", "name": "Box Dulce", "description": "Sorpresa dulce con cupcakes, macarons y chocolate caliente. Cumpleaños Ayacucho" }, "price": "75", "priceCurrency": "PEN" },
      { "@type": "Offer", "itemOffered": { "@type": "Product", "name": "Box Cumpleaños", "description": "El regalo perfecto para cumpleaños con delivery en Ayacucho" }, "price": "89", "priceCurrency": "PEN" },
      { "@type": "Offer", "itemOffered": { "@type": "Product", "name": "Box Autocuidado", "description": "Detalle especial de autocuidado — el regalo que ella merece" }, "price": "79", "priceCurrency": "PEN" }
    ]
  }
};

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      // ── Primary SEO ──────────────────────────────────────────────────────────
      { title: "Bocafest Food Box | Regalos Sorpresa y Desayunos a Domicilio en Ayacucho" },
      { name: "description", content: "Sorprende a quien más quieres con un box regalo especial en Ayacucho. Desayunos personalizados, boxes románticos y detalles únicos con delivery a domicilio. Pide por WhatsApp." },
      { name: "author", content: "Bocafest" },
      { name: "robots", content: "index, follow" },
      // ── Open Graph (WhatsApp / Facebook previews) ────────────────────────────
      { property: "og:title", content: "Bocafest Food Box · El regalo que marca la diferencia en Ayacucho" },
      { property: "og:description", content: "Boxes de regalo y desayunos sorpresa a domicilio en Ayacucho. Hechos con amor, siempre a pedido. El detalle perfecto para cada ocasión." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://bocafestfoodbox.com/" },
      { property: "og:locale", content: "es_PE" },
      { property: "og:image", content: "https://bocafestfoodbox.com/og-image.jpg" },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { property: "og:image:type", content: "image/jpeg" },
      { property: "og:image:alt", content: "Bocafest Food Box — Boxes de regalo y desayunos sorpresa a domicilio en Ayacucho" },
      // ── Twitter / X card ─────────────────────────────────────────────────────
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Bocafest Food Box · El regalo que marca la diferencia en Ayacucho" },
      { name: "twitter:description", content: "Boxes de regalo y desayunos sorpresa a domicilio en Ayacucho. El detalle perfecto para cada ocasión." },
      { name: "twitter:image", content: "https://bocafestfoodbox.com/og-image.jpg" },
      { name: "twitter:image:alt", content: "Bocafest Food Box — Boxes de regalo y desayunos sorpresa a domicilio en Ayacucho" },
      // ── Geolocation ───────────────────────────────────────────────────────────
      { name: "geo.region", content: "PE-AYA" },
      { name: "geo.placename", content: "Ayacucho, Perú" },
      { name: "geo.position", content: "-13.1631;-74.2244" },
      { name: "ICBM", content: "-13.1631, -74.2244" },
    ],
    links: [
      // ── Favicon oficial (Versión Círculo Rosa) ───────────────────────────────
      { rel: "icon", type: "image/webp", href: faviconWebp },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
      { rel: "shortcut icon", href: "/favicon.webp" },
      { rel: "manifest", href: "/site.webmanifest" },
      // ── Preload LCP — descarga hero antes que React monte el árbol ───────────
      { rel: "preload", href: hero1Mobile, as: "image", type: "image/webp", fetchPriority: "high" },
      // ── Preconnect a Supabase para acelerar carga de banner/productos ─────────
      { rel: "preconnect", href: "https://llasbukvdjlvwlgofgke.supabase.co", crossOrigin: "anonymous" },
      // ── Estilos y fuentes ───────────────────────────────────────────────────
      { rel: "stylesheet", href: appCss },
      { rel: "canonical", href: "https://bocafestfoodbox.com/" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400;1,600&family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400&family=DM+Sans:wght@400;500;600;700&display=swap" },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify(seoJsonLd),
      }
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SettingsProvider>
          {/* CartProvider aquí = carrito compartido entre todas las rutas públicas */}
          <CartProvider>
            <Outlet />
          </CartProvider>
        </SettingsProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
