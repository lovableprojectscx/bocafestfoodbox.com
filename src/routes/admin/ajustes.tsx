import { createFileRoute } from '@tanstack/react-router';
import { Save } from 'lucide-react';
import { useState, useEffect } from 'react';
import { fetchSettings, saveSettings, type DbSettings } from '@/lib/api/settings';

export const Route = createFileRoute('/admin/ajustes')({
  component: AjustesPage,
});

function AjustesPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [settings, setSettings] = useState<Partial<DbSettings>>({
    store_name: '',
    whatsapp: '',
    yape_number: '',
    plin_enabled: true,
    yape_holder_name: '',
    bcp_account: '',
  });

  useEffect(() => {
    fetchSettings().then((data) => {
      if (data) setSettings(data);
      setLoading(false);
    });
  }, []);

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
            <h3 className="font-semibold text-lg">Pagos y Cuentas</h3>
            <p className="text-sm text-muted-foreground">Configuración de los medios de pago que enviarás a tus clientes por WhatsApp.</p>
          </div>
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium">Habilitar Yape / Plin</label>
                <p className="text-xs text-muted-foreground">Muestra los números de Yape/Plin configurados en los mensajes de cobro.</p>
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
              <label className="text-sm font-medium">Número de Yape / Plin</label>
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
              <label className="text-sm font-medium">Nombre del Titular (Yape / Plin / BCP)</label>
              <input 
                type="text" 
                placeholder="Ej. Juan Pérez"
                value={settings.yape_holder_name || ''}
                onChange={e => setSettings({ ...settings, yape_holder_name: e.target.value })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" 
              />
              <p className="text-xs text-muted-foreground">Este nombre aparecerá en el texto de cobro para que el cliente verifique el destinatario.</p>
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium">Cuenta Bancaria BCP (Opcional)</label>
              <input 
                type="text" 
                placeholder="Ej. 193-98765432-0-91 (CCI: 002-193...)"
                value={settings.bcp_account || ''}
                onChange={e => setSettings({ ...settings, bcp_account: e.target.value })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" 
              />
              <p className="text-xs text-muted-foreground">Si configuras una cuenta, se agregará automáticamente al final del mensaje de WhatsApp de cobro.</p>
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
