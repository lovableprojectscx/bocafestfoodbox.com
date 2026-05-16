import { createFileRoute } from '@tanstack/react-router';
import { Save, CloudUpload, Loader2, CheckCircle2 } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { fetchSettings, saveSettings, type DbSettings } from '@/lib/api/settings';
import { supabase, getBocafestTenantId } from '@/lib/supabase';

export const Route = createFileRoute('/admin/ajustes')({
  component: AjustesPage,
});

function AjustesPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [settings, setSettings] = useState<Partial<DbSettings>>({
    store_name: '',
    whatsapp: '',
    yape_number: '',
    plin_enabled: true,
  });

  useEffect(() => {
    fetchSettings().then((data) => {
      if (data) setSettings(data);
      setLoading(false);
    });
  }, []);

  const handleQrUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('El archivo es demasiado grande. Máximo 5MB.');
      return;
    }
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
      setUploadError('Formato no soportado. Usa PNG, JPG o WebP.');
      return;
    }

    setUploading(true);
    setUploadError(null);

    try {
      const tenantId = await getBocafestTenantId();
      const ext = file.name.split('.').pop();
      const path = `${tenantId}/qr-yape.${ext}`;

      const { error: upError } = await supabase.storage
        .from('bocafest-assets')
        .upload(path, file, { upsert: true, contentType: file.type });

      if (upError) throw upError;

      const { data: urlData } = supabase.storage
        .from('bocafest-assets')
        .getPublicUrl(path);

      const publicUrl = urlData.publicUrl + '?t=' + Date.now(); // cache-bust
      setSettings(prev => ({ ...prev, yape_qr_url: publicUrl }));
    } catch (err: any) {
      console.error(err);
      setUploadError('Error al subir la imagen: ' + (err.message || 'Intenta de nuevo.'));
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveSettings(settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      console.error(e);
      alert('Error al guardar. Intenta de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-48">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  );

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Ajustes</h2>
        <p className="text-muted-foreground">Configura los detalles de tu tienda.</p>
      </div>

      <div className="grid gap-6">
        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
          <div className="border-b px-6 py-4">
            <h3 className="font-semibold text-lg">Información del Negocio</h3>
            <p className="text-sm text-muted-foreground">Los detalles públicos de Bocafest.</p>
          </div>
          <div className="p-6 space-y-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Nombre de la Tienda</label>
              <input 
                type="text" 
                value={settings.store_name || ''}
                onChange={e => setSettings({ ...settings, store_name: e.target.value })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" 
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Número de WhatsApp (Recepción de Pedidos)</label>
              <div className="flex h-10 w-full overflow-hidden rounded-md border border-input bg-background focus-within:ring-1 focus-within:ring-ring">
                <span className="flex items-center border-r bg-muted px-3 text-sm font-medium text-muted-foreground select-none">+51</span>
                <input 
                  type="tel"
                  maxLength={9}
                  placeholder="901180198"
                  value={(settings.whatsapp || '').replace(/^51/, '')}
                  onChange={e => {
                    const digits = e.target.value.replace(/\D/g, '').slice(0, 9);
                    setSettings({ ...settings, whatsapp: '51' + digits });
                  }}
                  className="flex-1 bg-transparent px-3 py-2 text-sm outline-none" 
                />
              </div>
              <p className="text-xs text-muted-foreground">Solo ingresa tus 9 dígitos, el código de país (+51) se agrega automáticamente.</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
          <div className="border-b px-6 py-4">
            <h3 className="font-semibold text-lg">Pagos</h3>
            <p className="text-sm text-muted-foreground">Configuración de los métodos de pago disponibles.</p>
          </div>
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium">Habilitar Yape / Plin</label>
                <p className="text-xs text-muted-foreground">Permite a los usuarios subir su comprobante de pago.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={settings.plin_enabled ?? true}
                  onChange={e => setSettings({ ...settings, plin_enabled: e.target.checked })}
                  className="sr-only peer" 
                />
                <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
            
            <div className="grid gap-2">
              <label className="text-sm font-medium">Número de Yape</label>
              <div className="flex h-10 w-full overflow-hidden rounded-md border border-input bg-background focus-within:ring-1 focus-within:ring-ring">
                <span className="flex items-center border-r bg-muted px-3 text-sm font-medium text-muted-foreground select-none">+51</span>
                <input 
                  type="tel"
                  maxLength={9}
                  placeholder="901180198"
                  value={(settings.yape_number || '').replace(/\s/g, '')}
                  onChange={e => {
                    const digits = e.target.value.replace(/\D/g, '').slice(0, 9);
                    setSettings({ ...settings, yape_number: digits });
                  }}
                  className="flex-1 bg-transparent px-3 py-2 text-sm outline-none" 
                />
              </div>
              <p className="text-xs text-muted-foreground">Solo ingresa tus 9 dígitos.</p>
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium">Nombre del Titular (Yape / Plin)</label>
              <input 
                type="text" 
                placeholder="Ej. Juan Pérez"
                value={settings.yape_holder_name || ''}
                onChange={e => setSettings({ ...settings, yape_holder_name: e.target.value })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" 
              />
              <p className="text-xs text-muted-foreground">Este nombre aparecerá al cliente para que verifique a quién está transfiriendo.</p>
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium">Imagen del QR (Yape / Plin)</label>
              <p className="text-xs text-muted-foreground">Esta imagen se mostrará al cliente al momento de pagar.</p>
              
              {/* Upload area */}
              <div
                onClick={() => !uploading && fileInputRef.current?.click()}
                className={`mt-2 flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-6 transition-all
                  ${uploading ? 'border-primary/40 bg-primary/5 cursor-wait' : 'border-primary/20 bg-muted/30 hover:border-primary/50 hover:bg-muted/50'}
                  ${uploadError ? 'border-destructive/40 bg-destructive/5' : ''}
                `}
              >
                {settings.yape_qr_url && !uploading ? (
                  /* Preview */
                  <div className="flex flex-col items-center gap-2">
                    <img
                      src={settings.yape_qr_url}
                      alt="QR Yape/Plin"
                      className="h-32 w-32 rounded-lg object-contain border shadow-sm"
                    />
                    <span className="text-xs text-muted-foreground">Haz clic para cambiar la imagen</span>
                  </div>
                ) : uploading ? (
                  /* Loading */
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <span className="text-sm font-medium text-primary">Subiendo imagen...</span>
                  </div>
                ) : (
                  /* Empty state */
                  <div className="flex flex-col items-center gap-2 text-center">
                    <CloudUpload className="h-8 w-8 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Seleccionar imagen del QR</p>
                      <p className="text-xs text-muted-foreground mt-1">PNG, JPG, WebP · Máximo 5MB</p>
                    </div>
                    <span className="rounded-md border bg-background px-3 py-1.5 text-xs font-medium hover:bg-muted">
                      Seleccionar Archivo
                    </span>
                  </div>
                )}
              </div>

              {/* Hidden real input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={handleQrUpload}
              />

              {/* Success / Error messages */}
              {settings.yape_qr_url && !uploading && !uploadError && (
                <p className="flex items-center gap-1 text-xs text-green-600">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Imagen guardada correctamente
                </p>
              )}
              {uploadError && (
                <p className="text-xs text-destructive">{uploadError}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end items-center gap-3 pt-4">
        {saved && <p className="text-sm text-green-600 font-medium">✓ Cambios guardados</p>}
        <button 
          onClick={handleSave}
          disabled={saving}
          className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-6 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 disabled:opacity-60"
        >
          <Save className="mr-2 h-4 w-4" />
          {saving ? 'Guardando...' : 'Guardar Cambios'}
        </button>
      </div>
    </div>
  );
}
