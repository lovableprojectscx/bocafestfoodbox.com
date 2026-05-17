import { Instagram, Facebook, MessageCircle } from "lucide-react";
import { useSettings } from "@/lib/settings-context";
import logoFooter from "@/assets/bocafest/logo-footer.png";

export function Footer() {
  const { whatsapp, waUrl } = useSettings();
  // Format number for display: 51901180198 → +51 901 180 198
  const displayNumber = whatsapp
    ? '+' + whatsapp.replace(/^51/, '51 ').replace(/(.{2})(.{3})(.{3})(.{3})/, '$1 $2 $3 $4')
    : '+51 901 180 198';
  return (
    <footer className="bg-primary px-5 py-16 text-primary-foreground md:px-10">
      <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-3 md:items-center">
        <div>
          <img src={logoFooter} alt="Bocafest Food Box" width={444} height={122} decoding="async" className="h-12 w-auto" style={{ filter: "brightness(0) invert(1)" }} />
          <p className="mt-2 max-w-xs font-serif text-base text-primary-foreground/80">Desayunos equilibrados que marcan la diferencia.</p>
        </div>
        <div className="flex md:justify-center">
          <a
            href={waUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-[#1db954] px-5 py-3 text-sm font-medium text-[#064e20] transition-transform hover:scale-105"
          >
            <MessageCircle className="h-4 w-4" /> {displayNumber}
          </a>
        </div>
        <div className="flex gap-4 md:justify-end">
          <a aria-label="Instagram" target="_blank" rel="noopener noreferrer" href="https://www.instagram.com/bocafest.oficial?utm_source=qr&igsh=MW1saHI0enMzOHlsNw==" className="grid h-11 w-11 place-items-center rounded-full border border-white/20 transition-colors hover:bg-white/10">
            <Instagram className="h-4 w-4" />
          </a>
          <a aria-label="TikTok" target="_blank" rel="noopener noreferrer" href="https://www.tiktok.com/@bocafest.oficial?_r=1&_t=ZS-96OgvhVPzXR" className="grid h-11 w-11 place-items-center rounded-full border border-white/20 transition-colors hover:bg-white/10">
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
              <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
            </svg>
          </a>
          <a aria-label="Facebook" target="_blank" rel="noopener noreferrer" href="https://www.facebook.com/share/1ATdxZDbRv/" className="grid h-11 w-11 place-items-center rounded-full border border-white/20 transition-colors hover:bg-white/10">
            <Facebook className="h-4 w-4" />
          </a>
        </div>
      </div>
      <div className="mx-auto mt-12 max-w-7xl border-t border-white/10 pt-6 text-center text-xs text-primary-foreground/60">
        © 2025 Bocafest · Ayacucho · Hecho con cariño por Idenza
      </div>
    </footer>
  );
}
