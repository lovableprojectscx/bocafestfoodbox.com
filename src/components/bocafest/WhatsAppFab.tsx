import { MessageCircle } from "lucide-react";
import { useSettings } from "@/lib/settings-context";

export function WhatsAppFab() {
  const { waUrl } = useSettings();
  return (
    <a
      href={waUrl()}
      target="_blank"
      rel="noreferrer"
      aria-label="Escríbenos por WhatsApp"
      className="group fixed bottom-5 left-5 z-40 inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-xl shadow-black/20 transition-transform hover:scale-110 md:bottom-8 md:left-8 md:h-16 md:w-16"
    >
      <span className="absolute inset-0 -z-10 animate-ping rounded-full bg-[#25D366]/40" />
      <MessageCircle className="h-7 w-7 md:h-8 md:w-8" fill="currentColor" strokeWidth={0} />
    </a>
  );
}
