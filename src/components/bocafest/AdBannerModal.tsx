import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { fetchBanner, type DbBanner } from '@/lib/api/banners';
import { useSettings } from '@/lib/settings-context';

export function AdBannerModal() {
  const [banner, setBanner] = useState<DbBanner | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const { waUrl } = useSettings();

  useEffect(() => {
    fetchBanner().then((data) => {
      if (data && data.is_active && data.image_url) {
        setBanner(data);
        // Pequeño delay para que no sea tan agresivo al cargar
        setTimeout(() => setIsOpen(true), 1500);
      }
    });
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!banner || !isOpen) return null;

  const handleAction = () => {
    if (banner.whatsapp_message) {
      window.open(waUrl(banner.whatsapp_message), '_blank');
    } else if (banner.link_url) {
      window.open(banner.link_url, '_blank');
    } else {
      window.open(waUrl('Hola, vi el anuncio en la página y quiero más información.'), '_blank');
    }
    setIsOpen(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6" aria-modal="true" role="dialog">
      <div 
        className="absolute inset-0 bg-primary/60 backdrop-blur-sm transition-opacity" 
        onClick={() => setIsOpen(false)} 
      />
      
      <div className="bf-spring relative flex max-h-[85vh] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-transparent shadow-2xl">
        <button
          onClick={() => setIsOpen(false)}
          aria-label="Cerrar anuncio"
          className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-background/50 text-foreground backdrop-blur hover:bg-background"
        >
          <X className="h-4 w-4" />
        </button>

        <img 
          src={banner.image_url} 
          alt="Promoción" 
          className="h-auto w-full object-contain cursor-pointer"
          onClick={handleAction}
        />
      </div>
    </div>
  );
}
