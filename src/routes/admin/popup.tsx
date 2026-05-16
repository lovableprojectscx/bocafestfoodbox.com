import { createFileRoute } from '@tanstack/react-router';
import { useState, useEffect, useRef } from 'react';
import {
  Save, Image as ImageIcon, Loader2, CheckCircle2,
  AlertCircle, CloudUpload, X,
} from 'lucide-react';
import { fetchBanner, saveBanner, type DbBanner } from '@/lib/api/banners';

export const Route = createFileRoute('/admin/popup')({
  component: AdminPopupPage,
});

type SaveStatus = 'idle' | 'success' | 'error';

/** Convierte cualquier imagen (File) a WebP usando Canvas API en el navegador.
 *  quality: 0–1 (0.85 = alta calidad, ~30-50 % menos peso). */
async function toWebP(file: File, quality = 0.85): Promise<{ dataUrl: string; originalKB: number; webpKB: number }> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) { URL.revokeObjectURL(objectUrl); reject(new Error('No canvas context')); return; }
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(objectUrl);

      const dataUrl = canvas.toDataURL('image/webp', quality);
      // Calcular tamaño aproximado del base64
      const base64 = dataUrl.split(',')[1] ?? '';
      const webpKB = Math.round((base64.length * 3) / 4 / 1024);
      const originalKB = Math.round(file.size / 1024);
      resolve({ dataUrl, originalKB, webpKB });
    };
    img.onerror = () => { URL.revokeObjectURL(objectUrl); reject(new Error('No se pudo cargar la imagen.')); };
    img.src = objectUrl;
  });
}

function AdminPopupPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [saveError, setSaveError] = useState('');

  const [converting, setConverting] = useState(false);
  const [convertInfo, setConvertInfo] = useState<{ originalKB: number; webpKB: number } | null>(null);
  const [convertError, setConvertError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<Partial<DbBanner>>({
    image_url: '',
    link_url: '',
    whatsapp_message: '',
    is_active: false,
  });

  useEffect(() => {
    fetchBanner()
      .then((data) => { if (data) setFormData(data); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  /* ── Selección y conversión de imagen ── */
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 20 * 1024 * 1024) {
      setConvertError('Archivo demasiado grande (máx. 20 MB).');
      return;
    }

    setConverting(true);
    setConvertError(null);
    setConvertInfo(null);

    try {
      const { dataUrl, originalKB, webpKB } = await toWebP(file, 0.85);
      setFormData(prev => ({ ...prev, image_url: dataUrl }));
      setConvertInfo({ originalKB, webpKB });
      if (saveStatus !== 'idle') setSaveStatus('idle');
    } catch (err) {
      setConvertError(err instanceof Error ? err.message : 'Error al convertir la imagen.');
    } finally {
      setConverting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  /* ── Toggle activar/desactivar ── */
  const handleToggle = () => {
    setFormData(prev => ({ ...prev, is_active: !prev.is_active }));
    if (saveStatus !== 'idle') setSaveStatus('idle');
  };

  /* ── Cambios en inputs de texto ── */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (saveStatus !== 'idle') setSaveStatus('idle');
  };

  /* ── Guardar ── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.image_url) {
      alert('Debes subir una imagen para el Pop Up.');
      return;
    }

    setSaving(true);
    setSaveStatus('idle');
    setSaveError('');
    try {
      await saveBanner(formData);
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      setSaveError(msg || 'Error desconocido al guardar.');
      setSaveStatus('error');
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
        {/* ── Formulario ── */}
        <form onSubmit={handleSubmit} className="space-y-6 rounded-xl border bg-card p-6 shadow-sm">

          {/* Toggle */}
          <div
            className="flex items-center justify-between rounded-lg border p-4 bg-muted/30 cursor-pointer select-none"
            onClick={handleToggle}
          >
            <div className="space-y-0.5">
              <p className="text-base font-semibold text-foreground">Activar Pop Up</p>
              <p className="text-sm text-muted-foreground">Muestra la ventana emergente al cargar la web.</p>
            </div>
            <div
              className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${
                formData.is_active ? 'bg-primary' : 'bg-muted border border-input'
              }`}
            >
              <span
                className={`absolute top-[2px] left-[2px] h-5 w-5 rounded-full bg-white border border-gray-300 shadow transition-transform duration-200 ${
                  formData.is_active ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </div>
          </div>

          {/* ── Subida + conversión WebP ── */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Imagen del Anuncio</label>

            <div
              className="relative flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-input bg-muted/20 px-4 py-6 text-center cursor-pointer hover:border-primary/60 hover:bg-muted/40 transition-colors"
              onClick={() => !converting && fileInputRef.current?.click()}
            >
              {converting ? (
                <>
                  <Loader2 className="h-7 w-7 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">Convirtiendo a WebP…</p>
                </>
              ) : (
                <>
                  <CloudUpload className="h-7 w-7 text-muted-foreground" />
                  <p className="text-sm font-medium text-foreground">
                    {formData.image_url ? 'Cambiar imagen' : 'Subir imagen'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    PNG, JPG, WebP · se convierte a WebP automáticamente
                  </p>
                </>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                className="hidden"
                onChange={handleFileChange}
                disabled={converting}
              />
            </div>

            {/* Info de compresión */}
            {convertInfo && (
              <div className="flex items-center gap-2 rounded-md bg-green-50 border border-green-200 px-3 py-2 text-xs text-green-700">
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                Convertido a WebP · {convertInfo.originalKB} KB → {convertInfo.webpKB} KB
                {convertInfo.webpKB < convertInfo.originalKB && (
                  <span className="font-semibold">
                    ({Math.round((1 - convertInfo.webpKB / convertInfo.originalKB) * 100)}% menos)
                  </span>
                )}
              </div>
            )}

            {/* Error de conversión */}
            {convertError && (
              <div className="flex items-center gap-2 rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {convertError}
              </div>
            )}

            {/* Miniatura */}
            {formData.image_url && (
              <div className="relative mt-1 inline-block">
                <img
                  src={formData.image_url}
                  alt="Vista previa"
                  className="h-20 w-20 rounded-md object-cover border"
                />
                <button
                  type="button"
                  onClick={() => { setFormData(prev => ({ ...prev, image_url: '' })); setConvertInfo(null); }}
                  className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white shadow hover:bg-red-600"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}

            <p className="text-xs text-muted-foreground">Formato recomendado: Vertical (9:16) o Cuadrado.</p>
          </div>

          {/* Enlace opcional */}
          <div className="space-y-2">
            <label htmlFor="link_url" className="text-sm font-medium text-foreground">
              Enlace al hacer clic <span className="text-muted-foreground font-normal">(opcional)</span>
            </label>
            <input
              type="text"
              id="link_url"
              name="link_url"
              value={formData.link_url || ''}
              onChange={handleChange}
              placeholder="https://..."
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none"
            />
            <p className="text-xs text-muted-foreground">Si se deja vacío, el Pop Up abrirá WhatsApp con el mensaje de abajo.</p>
          </div>

          {/* Mensaje WhatsApp */}
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

          {/* Feedback guardado */}
          {saveStatus === 'success' && (
            <div className="flex items-center gap-2 rounded-md bg-green-50 border border-green-200 px-3 py-2 text-sm text-green-700">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              Pop Up guardado correctamente.
            </div>
          )}
          {saveStatus === 'error' && (
            <div className="flex items-start gap-2 rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              Error al guardar: {saveError}
            </div>
          )}

          <button
            type="submit"
            disabled={saving || converting}
            className="flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-opacity"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? 'Guardando…' : 'Guardar Cambios'}
          </button>
        </form>

        {/* ── Vista Previa ── */}
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
              <div className="flex flex-col items-center text-muted-foreground gap-2">
                <ImageIcon className="h-12 w-12 opacity-50" />
                <p className="text-sm">Sin imagen</p>
              </div>
            )}
          </div>
          <p className="mt-2 text-xs text-muted-foreground text-center">
            El pop up aparece centrado sobre la web con fondo oscuro al entrar.
          </p>
        </div>
      </div>
    </div>
  );
}
