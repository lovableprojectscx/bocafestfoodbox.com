/**
 * Global settings store — loads once from Supabase and is shared across the entire app.
 * All WhatsApp links, FABs, Navbar buttons, etc. read from here.
 */
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { fetchSettings, type DbSettings } from '@/lib/api/settings';

const FALLBACK_WHATSAPP = '51901180198';

type SettingsCtx = {
  whatsapp: string;         // Full number with country code, e.g. "51901180198"
  waUrl: (msg?: string) => string;  // ready-to-use wa.me URL
  yape_qr_url?: string | null;
  yape_number?: string | null;
  yape_holder_name?: string | null;
  bcp_account?: string | null;
  plin_enabled?: boolean | null;
  loading: boolean;
};

const Ctx = createContext<SettingsCtx>({
  whatsapp: FALLBACK_WHATSAPP,
  waUrl: (msg) => `https://wa.me/${FALLBACK_WHATSAPP}${msg ? '?text=' + encodeURIComponent(msg) : ''}`,
  loading: true,
});

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Partial<DbSettings>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSettings().then((data) => {
      if (data) setSettings(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const whatsapp = settings.whatsapp || FALLBACK_WHATSAPP;
  const waUrl = (msg?: string) =>
    `https://wa.me/${whatsapp}${msg ? '?text=' + encodeURIComponent(msg) : ''}`;

  return (
    <Ctx.Provider 
      value={{ 
        whatsapp, 
        waUrl, 
        yape_qr_url: settings.yape_qr_url,
        yape_number: settings.yape_number,
        yape_holder_name: settings.yape_holder_name,
        bcp_account: settings.bcp_account,
        plin_enabled: settings.plin_enabled,
        loading 
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useSettings() {
  return useContext(Ctx);
}
