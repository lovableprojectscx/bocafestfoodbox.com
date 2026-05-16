# Bocafest Food Box — Landing Page

A premium, emotional, conversion-focused single-page site in Spanish for a breakfast gift-box brand from Ayacucho. Editorial luxury feel with warm ivory + deep forest green + burdeos/gold accents.

## Scope

Single-page experience at `/` (TanStack Start route) with anchored sections, plus a persistent cart + checkout flow. Spanish copy. Fully responsive, mobile-first.

## Brand & design tokens

Add to `src/styles.css` (oklch conversions of the final palette you supplied):
- `--background` ivory `#F8F2E6`
- `--primary` pine green `#1B3A2F`
- `--accent` burdeos `#8C1A34`
- `--gold` `#F5A800`
- `--rose` `#F2C4CE`
- `--kraft` `#C4A882`
- `--muted-foreground` `#6B5B4E`
- White `#FFFFFF`

Typography (Google Fonts via `<link>` in `__root.tsx` head):
- Headings: **Playfair Display** (italic for emotional phrases)
- Subheads: **Cormorant Garamond**
- Body/UI: **DM Sans**

Motion rules (global):
- Page-load fade + 40px slide-up, staggered
- IntersectionObserver scroll reveals (custom `useInView` hook)
- Hover scale 1→1.03 on cards/buttons; image zoom 1→1.08 inside `overflow:hidden`
- Custom dark-green cursor dot (desktop only)
- Smooth scroll, `prefers-reduced-motion` respected

## Sections (in `src/routes/index.tsx` composing components from `src/components/bocafest/`)

1. **Navbar** — fixed, blurred backdrop, "Boca**fest**" wordmark, cart button with animated badge; border-bottom appears after hero scroll.
2. **Hero carousel** — 100vh, 3 slides, crossfade 1.5s, autoplay 5s, Ken Burns zoom, dot pills, bouncing scroll arrow, floating "Ver boxes ↓" CTA after 2s. Desktop uses `Hero_{1,2,3}_PC.webp`, mobile swaps to `Hero_{1,2,3}_Movil.webp` via `<picture>`. Text already baked in — no overlay.
3. **Lo más pedido** catalog — eyebrow + serif heading; 4/2/1 col grid of product cards (image, name, desc, price, "+ Agregar"); placeholder 4:3 product shots generated via imagegen since client hasn't supplied them yet (6 boxes).
4. **Ocasiones** — asymmetric masonry of 4 cards (Cumpleaños, Pareja, Sorpresa, Autocuidado) with heart `clip-path` on desktop, rounded rect on mobile. Hover dark-overlay reveals italic phrase. Note: only `Pareja_*` and `Emoción_autocuidado_mañana_propia_*` were uploaded — Cumpleaños and Regalo sorpresa images will be generated via imagegen.
5. **Frase** — full-width parallax background (use `Pareja_PC.webp` as the atmospheric fallback since `regalo_sorpresa_PC.jpeg` wasn't uploaded), 0.4 brightness, gold rule, italic serif quote, three animated pill chips.
6. **CTA final** — "¿Lista para sorprender?" with primary "Ver el menú" (scrolls to catalog) + outline WhatsApp button (`https://wa.me/51901180198`).
7. **Footer** — dark `#1B3A2F`, logo, tagline, WhatsApp button, social icons (lucide), copyright Idenza 2025.

## Cart & checkout

- `CartProvider` (Context + useReducer) holding `{items, add, remove, qty}`.
- Floating cart FAB bottom-right on mobile.
- `CartSheet` slide-in from right (translateX), item rows with thumb + qty +/− + subtotal + total + "Confirmar pedido →".
- `CheckoutModal` spring scale-in: payment selector (WhatsApp / Yape / Plin).
  - WhatsApp: builds order text and opens `wa.me/51901180198?text=...`
  - Yape/Plin: shows QR via `https://api.qrserver.com/v1/create-qr-code/?data=901180198&size=240x240` + order summary + "Enviar comprobante por WhatsApp" button.

## Assets handling

Copy uploaded `.webp` hero/ocasiones images to `src/assets/bocafest/` and import as ES modules. Generate the missing imagery (product placeholders, Cumpleaños, Regalo sorpresa) with imagegen at the listed dimensions.

## Technical

- TanStack Start route `src/routes/index.tsx` (replace placeholder); per-route SEO `head()` with title, description, og tags.
- `src/components/bocafest/` for Navbar, HeroCarousel, Catalog, ProductCard, Occasions, QuoteSection, FinalCTA, Footer, CartFab, CartSheet, CheckoutModal.
- `src/hooks/useInView.ts`, `src/hooks/useCustomCursor.ts`.
- `src/lib/cart.tsx` (context + reducer + types).
- Tailwind v4 utility additions via `@theme` tokens (font families, brand colors).
- No new UI libraries — pure custom + existing shadcn primitives where useful (Sheet, Dialog optional but spec says custom; will hand-roll to honor "no external UI libraries").
- Lazy-load below-the-fold images (`loading="lazy"`).

## Out of scope (this pass)

- Real product data / CMS — placeholders only.
- Payment confirmation backend — order is delivered via WhatsApp.
- Auth, accounts, order history.

Confirm and I'll build it.