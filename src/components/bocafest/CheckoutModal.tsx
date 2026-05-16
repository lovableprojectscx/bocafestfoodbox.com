import { useState } from "react";
import { X } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { useCart, buildWhatsAppOrderUrl, formatPEN } from "@/lib/cart";
import { createOrder } from "@/lib/api/orders";
import { useSettings } from "@/lib/settings-context";
import { supabase, getBocafestTenantId } from "@/lib/supabase";

import whatsappIcon from "@/assets/bocafest/whatsapp.svg";
import yapeIcon from "@/assets/bocafest/yape.png";
import plinIcon from "@/assets/bocafest/plin.png";

type Method = "WhatsApp" | "Yape" | "Plin";

const PAYMENT_METHODS = [
  { id: "WhatsApp" as Method, title: "WhatsApp", desc: "Coordina al chat", logoUrl: whatsappIcon, colorHover: "hover:border-[#25D366] hover:bg-[#25D366]/5" },
  { id: "Yape" as Method, title: "Yape", desc: "Paga con QR", logoUrl: yapeIcon, colorHover: "hover:border-[#742284] hover:bg-[#742284]/5" },
  { id: "Plin" as Method, title: "Plin", desc: "Paga con QR", logoUrl: plinIcon, colorHover: "hover:border-[#00D2D3] hover:bg-[#00D2D3]/5" },
];

export function CheckoutModal({ onClose }: { onClose: () => void }) {
  const { items, total, clear } = useCart();
  const navigate = useNavigate();
  const { whatsapp, waUrl, yape_qr_url, yape_number, yape_holder_name, plin_enabled } = useSettings();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [method, setMethod] = useState<Method | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  
  const [deliveryData, setDeliveryData] = useState({
    name: "", phone: "", address: "", hour: "10", minute: "00", ampm: "AM", message: "",
  });

  const [receiptImage, setReceiptImage] = useState<string | null>(null);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [trackingCode, setTrackingCode] = useState<string>("");

  const qrUrl = yape_qr_url || `https://api.qrserver.com/v1/create-qr-code/?data=${yape_number || whatsapp}&size=240x240&bgcolor=F8F2E6`;

  const availableMethods = plin_enabled === false ? PAYMENT_METHODS.filter(m => m.id === "WhatsApp") : PAYMENT_METHODS;

  const sendWhatsApp = (m: Method, skipDeliveryData = false) => {
    window.open(buildWhatsAppOrderUrl(items, total, m, skipDeliveryData ? undefined : deliveryData, whatsapp), "_blank", "noopener");
  };

  const handleSelectMethod = (m: Method) => {
    if (m === "WhatsApp") {
      sendWhatsApp(m, true);
    } else {
      setMethod(m);
      setStep(2);
    }
  };

  const handleNextStep = (e: React.FormEvent) => { e.preventDefault(); setStep(3); };


  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      // Security check: Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Por favor, sube un archivo de imagen válido (PNG, JPG, WEBP).');
        return;
      }

      // Validar tamaño (máx 5MB, coherente con admin)
      if (file.size > 5 * 1024 * 1024) {
        alert('El comprobante es muy grande (máximo 5MB). Por favor sube una imagen más liviana.');
        return;
      }

      setReceiptFile(file);
      // Show preview locally
      const previewUrl = URL.createObjectURL(file);
      setReceiptImage(previewUrl);
    }
  };

  // Sube el comprobante a Supabase Storage y devuelve la URL pública
  const uploadReceiptToStorage = async (file: File): Promise<string> => {
    const tenantId = await getBocafestTenantId();
    const ext = file.name.split('.').pop() || 'jpg';
    // Nombre único usando timestamp + random para evitar colisiones
    const path = `${tenantId}/receipts/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const { error: upError } = await supabase.storage
      .from('bocafest-assets')
      .upload(path, file, { upsert: false, contentType: file.type });

    if (upError) throw new Error(`Error al subir comprobante: ${upError.message}`);

    const { data: urlData } = supabase.storage
      .from('bocafest-assets')
      .getPublicUrl(path);

    return urlData.publicUrl;
  };

  // Genera código de seguimiento con mayor entropía: BF-XXXXXX (base36 timestamp + random)
  const generateTrackingCode = (): string => {
    const ts = Date.now().toString(36).toUpperCase().slice(-4);
    const rnd = Math.random().toString(36).toUpperCase().slice(2, 4);
    return `BF-${ts}${rnd}`;
  };

  const handleFinalizeOrder = async () => {
    if (saving) return;
    setSaving(true);
    setSaveError(null);

    const code = generateTrackingCode();
    const today = new Date().toISOString().split('T')[0];
    const timeSlot = `${deliveryData.hour}:${deliveryData.minute} ${deliveryData.ampm}`;

    try {
      // Subir comprobante a Storage (no base64 en DB)
      let receiptUrl: string | undefined = undefined;
      if (receiptFile) {
        receiptUrl = await uploadReceiptToStorage(receiptFile);
      }

      // Sanitizar inputs antes de enviar a Supabase
      const cleanName = (deliveryData.name || 'Cliente').trim().slice(0, 100);
      const cleanPhone = (deliveryData.phone || '').trim().slice(0, 20);
      const cleanAddress = (deliveryData.address || '').trim().slice(0, 255);
      const cleanMessage = deliveryData.message ? deliveryData.message.trim().slice(0, 500) : undefined;

      await createOrder({
        name: cleanName,
        phone: cleanPhone,
        address: cleanAddress,
        date: today,
        time_slot: timeSlot,
        message: cleanMessage,
        items: items.map(i => ({ id: i.id, name: i.name, qty: i.qty, price: i.price })),
        total: Math.max(0, total),
        payment_method: method || 'WhatsApp',
        receipt_url: receiptUrl,
        tracking_code: code,
      });

      // Solo avanzar si el pedido se guardó correctamente
      setTrackingCode(code);
      setStep(4);
      clear();
    } catch (e) {
      console.error('Error al guardar pedido:', e);
      setSaveError('Hubo un problema al registrar tu pedido. Verifica tu conexión e intenta de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] grid place-items-center overflow-y-auto bg-primary/50 p-4 py-8 backdrop-blur-sm">
      <div className="bf-spring relative w-full max-w-lg overflow-hidden rounded-[2rem] bg-background shadow-2xl">
        {step !== 4 && (
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="absolute right-5 top-5 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-muted/80 text-primary backdrop-blur transition hover:bg-muted"
          >
            <X className="h-5 w-5" />
          </button>
        )}
        
        <div className="px-5 pb-6 pt-8 sm:px-8 sm:pb-8 sm:pt-10">
          {step === 1 && (
            <>
              <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-accent">Paso 1 de 3</p>
              <h3 className="mt-2 font-display text-3xl text-primary md:text-4xl">¿Cómo prefieres pagar?</h3>
              <p className="mt-2 font-serif text-lg text-muted-foreground">
                Total a pagar: <span className="font-bold text-accent">{formatPEN(total)}</span>
              </p>

              <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
                {availableMethods.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => handleSelectMethod(m.id)}
                    className={`group relative flex flex-col items-center overflow-hidden rounded-2xl border-2 border-primary/10 bg-card p-5 text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${m.colorHover}`}
                  >
                    <div className="mb-3 flex h-14 w-full items-center justify-center">
                      <img src={m.logoUrl} alt={`Logo de ${m.title}`} className="h-full w-auto max-w-[80px] object-contain drop-shadow-sm transition-transform duration-300 group-hover:scale-110" />
                    </div>
                    <p className="font-display text-xl font-bold text-primary">{m.title}</p>
                    <p className="mt-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground transition-colors group-hover:text-primary/70">
                      {m.desc}
                    </p>
                  </button>
                ))}
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-accent">Paso 2 de 3</p>
              <h3 className="mt-2 font-display text-3xl text-primary md:text-4xl">Datos de entrega</h3>
              <p className="mt-2 font-serif text-lg text-muted-foreground">
                Total a pagar: <span className="font-bold text-accent">{formatPEN(total)}</span>
              </p>

              <form onSubmit={handleNextStep} className="mt-8 flex flex-col gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wider text-primary">Nombre del cliente</label>
                  <input
                    required
                    type="text"
                    placeholder="Ej. María López"
                    value={deliveryData.name}
                    onChange={(e) => setDeliveryData({ ...deliveryData, name: e.target.value })}
                    className="w-full rounded-2xl border border-primary/20 bg-card px-4 py-3 text-sm text-primary transition-colors focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wider text-primary">Teléfono</label>
                  <input
                    required
                    type="tel"
                    placeholder="Ej. 987654321"
                    value={deliveryData.phone}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 9);
                      setDeliveryData({ ...deliveryData, phone: value });
                    }}
                    minLength={9}
                    maxLength={9}
                    className="w-full rounded-2xl border border-primary/20 bg-card px-4 py-3 text-sm text-primary transition-colors focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wider text-primary">Dirección de delivery</label>
                  <input
                    required
                    type="text"
                    placeholder="Ej. Av. Los Pinos 123"
                    value={deliveryData.address}
                    onChange={(e) => setDeliveryData({ ...deliveryData, address: e.target.value })}
                    className="w-full rounded-2xl border border-primary/20 bg-card px-4 py-3 text-sm text-primary transition-colors focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wider text-primary">Hora de entrega preferida</label>
                  <div className="flex items-center gap-2">
                    <select
                      value={deliveryData.hour}
                      onChange={(e) => setDeliveryData({ ...deliveryData, hour: e.target.value })}
                      className="w-full appearance-none rounded-2xl border border-primary/20 bg-card px-4 py-3 text-sm text-primary text-center transition-colors focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                    >
                      {Array.from({ length: 12 }).map((_, i) => (
                        <option key={i + 1} value={String(i + 1)}>{i + 1}</option>
                      ))}
                    </select>
                    
                    <span className="font-bold text-primary">:</span>
                    
                    <select
                      value={deliveryData.minute}
                      onChange={(e) => setDeliveryData({ ...deliveryData, minute: e.target.value })}
                      className="w-full appearance-none rounded-2xl border border-primary/20 bg-card px-4 py-3 text-sm text-primary text-center transition-colors focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                    >
                      <option value="00">00</option>
                      <option value="30">30</option>
                    </select>

                    <select
                      value={deliveryData.ampm}
                      onChange={(e) => setDeliveryData({ ...deliveryData, ampm: e.target.value })}
                      className="w-full appearance-none rounded-2xl border border-primary/20 bg-card px-4 py-3 text-sm text-primary text-center transition-colors focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                    >
                      <option value="AM">AM</option>
                      <option value="PM">PM</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wider text-primary">Mensaje extra (opcional)</label>
                  <textarea
                    rows={2}
                    placeholder="Ej. Feliz cumpleaños..."
                    value={deliveryData.message}
                    onChange={(e) => setDeliveryData({ ...deliveryData, message: e.target.value })}
                    className="w-full resize-none rounded-2xl border border-primary/20 bg-card px-4 py-3 text-sm text-primary transition-colors focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                </div>
                
                <button
                  type="submit"
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-primary py-4 text-base font-semibold text-primary-foreground shadow-lg transition-transform hover:scale-[1.02]"
                >
                  Continuar al pago
                </button>
              </form>

              <button
                onClick={() => { setStep(1); setMethod(null); }}
                className="mt-6 block w-full text-sm font-medium text-muted-foreground transition-colors hover:text-accent"
              >
                ← Volver a métodos de pago
              </button>
            </>
          )}

          {step === 3 && method && (
            <div className="bf-reveal is-visible mt-2 overflow-hidden rounded-3xl border-2 border-primary/5 bg-card p-8 text-center shadow-inner">
              <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-accent mb-4">Paso 3 de 3</p>
              <p className="font-display text-2xl text-primary">Escanea con <span className="font-bold">{method}</span></p>
              <p className="mt-2 text-sm text-muted-foreground">
                Abre tu app, escanea el QR o transfiere al número <strong className="text-primary">{yape_number || whatsapp.replace(/^51/, '')}</strong>. 
                Luego sube la captura aquí abajo.
              </p>
              
              <div className="mx-auto my-6 flex flex-col items-center">
                <div className="aspect-square w-48 overflow-hidden rounded-2xl bg-white p-3 shadow-lg ring-1 ring-primary/10">
                  <img src={qrUrl} alt={`QR ${method}`} className="h-full w-full object-cover" />
                </div>
                {yape_holder_name && (
                  <div className="mt-4 rounded-full bg-primary/5 px-4 py-1.5 text-xs font-semibold text-primary">
                    Titular: {yape_holder_name}
                  </div>
                )}
              </div>
              
              <div className="mt-8">
                <label className="relative flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-primary/20 bg-muted/50 p-6 text-center transition-colors hover:border-accent hover:bg-accent/5">
                  {receiptImage ? (
                    <div className="relative h-24 w-auto overflow-hidden rounded-xl border border-primary/10">
                      <img src={receiptImage} alt="Comprobante" className="h-full w-full object-cover" />
                      <div className="absolute inset-0 grid place-items-center bg-black/40 opacity-0 transition-opacity hover:opacity-100">
                        <span className="text-xs font-bold text-white">Cambiar</span>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="mb-2 rounded-full bg-primary/10 p-3 text-primary">
                        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
                      </div>
                      <p className="text-sm font-semibold text-primary">Subir comprobante</p>
                      <p className="mt-1 text-xs text-muted-foreground">PNG, JPG (Max. 5MB)</p>
                    </>
                  )}
                  <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                </label>
              </div>

              {saveError && (
                <div className="mt-4 rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive text-center">
                  {saveError}
                </div>
              )}

              <button
                disabled={!receiptImage || saving}
                onClick={handleFinalizeOrder}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-primary py-4 text-base font-bold text-primary-foreground shadow-lg transition-transform hover:scale-[1.02] hover:shadow-xl disabled:opacity-50 disabled:hover:scale-100"
              >
                {saving ? 'Guardando pedido...' : 'Finalizar pedido'}
              </button>
              
              <button
                onClick={() => setStep(2)}
                className="mt-4 block w-full text-sm font-medium text-muted-foreground transition-colors hover:text-accent"
              >
                ← Volver a datos de entrega
              </button>
            </div>
          )}

          {step === 4 && (
            <div className="bf-reveal is-visible text-center py-6">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100 text-green-600">
                <svg className="h-10 w-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
              </div>
              <h3 className="font-display text-3xl text-primary">¡Pedido Confirmado!</h3>
              <p className="mt-3 text-muted-foreground">Tu pago y datos han sido registrados exitosamente. Te estaremos notificando sobre tu envío.</p>
              
              <div className="my-8 rounded-2xl bg-muted/50 p-6 border border-primary/10">
                <p className="text-xs font-semibold uppercase tracking-widest text-primary/60">Código de seguimiento</p>
                <p className="mt-1 font-serif text-4xl font-bold tracking-widest text-accent">{trackingCode}</p>
              </div>

              <button
                onClick={() => {
                  onClose();
                  navigate({ to: "/tracking", search: { code: trackingCode } });
                }}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-4 text-base font-bold text-primary-foreground shadow-lg transition-transform hover:scale-[1.02] hover:shadow-xl"
              >
                Ver estado de mi pedido
              </button>
              <button
                onClick={() => {
                  onClose();
                  navigate({ to: "/" });
                }}
                className="mt-4 block w-full text-sm font-medium text-muted-foreground transition-colors hover:text-accent"
              >
                Volver al inicio
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
