import { createFileRoute } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { Save, Image as ImageIcon, Loader2 } from 'lucide-react';
import { fetchBanner, saveBanner, type DbBanner } from '@/lib/api/banners';

export const Route = createFileRoute('/admin/popup')({
  component: AdminPopupPage,
});

function AdminPopupPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState<Partial<DbBanner>>({
    image_url: '',
    link_url: '',
    whatsapp_message: '',
    is_active: false,
  });

  useEffect(() => {
    fetchBanner().then((data) => {
      if (data) {
        setFormData(data);
      }
      setLoading(false);
    });
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.image_url) {
      alert('Debes ingresar la URL de una imagen para el Pop Up.');
      return;
    }
    
    setSaving(true);
    try {
      await saveBanner(formData);
      alert('Pop Up guardado correctamente.');
    } catch (error) {
      console.error('Error saving popup:', error);
      alert('Hubo un error al guardar.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Pop Up Promocional</h1>
        <p className="text-muted-foreground mt-2">
          Configura el anuncio que aparecerá al entrar a la web. Si recargan la página, volverá a mostrarse.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-6 rounded-xl border bg-card p-6 shadow-sm">
          
          <div className="flex items-center justify-between rounded-lg border p-4 bg-muted/30">
            <div className="space-y-0.5">
              <label htmlFor="is_active" className="text-base font-semibold text-foreground cursor-pointer">
                Activar Pop Up
              </label>
              <p className="text-sm text-muted-foreground">
                Muestra la ventana emergente al cargar la web.
              </p>
            </div>
            <div className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                id="is_active" 
                name="is_active"
                className="sr-only peer"
                checked={formData.is_active || false}
                onChange={handleChange}
              />
              <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="image_url" className="text-sm font-medium text-foreground">
              Imagen del Anuncio (URL)
            </label>
            <input
              type="text"
              id="image_url"
              name="image_url"
              value={formData.image_url || ''}
              onChange={handleChange}
              placeholder="https://..."
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none"
            />
            <p className="text-xs text-muted-foreground">Formato recomendado: Vertical (9:16) o Cuadrado.</p>
          </div>

          <div className="space-y-2">
            <label htmlFor="whatsapp_message" className="text-sm font-medium text-foreground">
              Mensaje Predefinido de WhatsApp
            </label>
            <textarea
              id="whatsapp_message"
              name="whatsapp_message"
              rows={3}
              value={formData.whatsapp_message || ''}
              onChange={handleChange}
              placeholder="Ej. Hola, quiero más información sobre la oferta que vi al entrar."
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none"
            />
            <p className="text-xs text-muted-foreground">Si el usuario da clic en el Pop Up, se enviará este mensaje a tu WhatsApp.</p>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Guardar Cambios
          </button>
        </form>

        {/* Preview */}
        <div>
          <h3 className="mb-4 text-sm font-semibold text-muted-foreground uppercase tracking-wider">Vista Previa</h3>
          <div className="relative overflow-hidden rounded-xl border bg-muted/20 flex items-center justify-center h-[500px]">
            {formData.image_url ? (
              <img 
                src={formData.image_url} 
                alt="Vista previa" 
                className="h-full w-full object-contain"
              />
            ) : (
              <div className="flex flex-col items-center text-muted-foreground">
                <ImageIcon className="h-12 w-12 opacity-50 mb-2" />
                <p className="text-sm">Sin imagen</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
