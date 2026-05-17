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
      if (!data || !data.is_active || !data.image_url) return;

      // Precargar la imagen en memoria antes de mostrar el popup.
      // El popup solo aparece cuando el navegador ya tiene la imagen lista,
      // eliminando el "flash" de carga o el espacio vacío inicial.
      const img = new Image();
      img.onload = () => {
        setBanner(data);
        setIsOpen(true);
      };
      img.onerror = () => {
        // Si falla la carga de la imagen, no mostrar el popup
        console.warn('AdBannerModal: no se pudo cargar la imagen del popup.');
      };
      img.src = data.image_url;
    });
  }, []);

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
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
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
      aria-modal="true"
      role="dialog"
      aria-labelledby="ad-banner-title"
    >
      {/* Fondo oscuro */}
      <div
        className="absolute inset-0 bg-primary/60 backdrop-blur-sm"
        onClick={() => setIsOpen(false)}
      />

      {/* Panel del popup */}
      <div className="bf-spring relative flex max-h-[85vh] w-full max-w-md flex-col overflow-hidden rounded-2xl shadow-2xl">
        {/* Título accesible oculto visualmente — requerido por ARIA para role=dialog */}
        <h2 id="ad-banner-title" className="sr-only">Promoción especial Bocafest</h2>
        {/* Botón cerrar */}
        <button
          onClick={() => setIsOpen(false)}
          aria-label="Cerrar anuncio"
          className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-background/60 text-foreground backdrop-blur hover:bg-background transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Imagen ya precargada — se muestra instantáneamente */}
        <img
          src={banner.image_url}
          alt={banner.title ?? "Promoción especial Bocafest"}
          width={665}
          height={371}
          className="h-auto w-full object-contain cursor-pointer"
          onClick={handleAction}
        />
      </div>
    </div>
  );
}
