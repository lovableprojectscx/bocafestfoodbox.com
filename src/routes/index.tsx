import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/bocafest/Navbar";
import { HeroCarousel } from "@/components/bocafest/HeroCarousel";
import { Catalog } from "@/components/bocafest/Catalog";
import { Occasions } from "@/components/bocafest/Occasions";
import { QuoteSection } from "@/components/bocafest/QuoteSection";
import { FinalCTA } from "@/components/bocafest/FinalCTA";
import { Footer } from "@/components/bocafest/Footer";
import { CartSheet } from "@/components/bocafest/CartSheet";
import { CartFab } from "@/components/bocafest/CartFab";
import { CursorDot } from "@/components/bocafest/CursorDot";
import { WhatsAppFab } from "@/components/bocafest/WhatsAppFab";

import { AdBannerModal } from "@/components/bocafest/AdBannerModal";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <>
      <CursorDot />
      <Navbar />
      <main>
        <HeroCarousel />
        <Catalog />
        <Occasions />
        <QuoteSection />
        <FinalCTA />
      </main>
      <Footer />
      <CartSheet />
      <CartFab />
      <WhatsAppFab />
      <AdBannerModal />
    </>
  );
}
