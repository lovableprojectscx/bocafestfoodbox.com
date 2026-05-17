import { useState } from "react";
import { X, MessageCircle, FileText, CheckCircle2 } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { useCart, buildWhatsAppOrderUrl, formatPEN } from "@/lib/cart";
import { createOrder } from "@/lib/api/orders";
import { useSettings } from "@/lib/settings-context";

type CheckoutStep = 1 | 2 | 3;

export function CheckoutModal({ onClose }: { onClose: () => void }) {
  const { items, total, clear } = useCart();
  const navigate = useNavigate();
  const { whatsapp } = useSettings();
  const [step, setStep] = useState<CheckoutStep>(1);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    district: "",
    name: "",
    phone: "",
    delivery_date: "",
    time_slot: "",
    address: "",
    reference: "",
    receiver_phone: "",
    for_name: "",
    from_name: "",
    dedication: "",
  });

  const [trackingCode, setTrackingCode] = useState<string>("");

  const sendWhatsAppDirect = () => {
    // Si elige directo por WhatsApp, armamos el mensaje solo con los productos
    window.open(buildWhatsAppOrderUrl(items, total, whatsapp), "_blank", "noopener");
    onClose();
  };

  const generateTrackingCode = (): string => {
    const ts = Date.now().toString(36).toUpperCase().slice(-4);
    const rnd = Math.random().toString(36).toUpperCase().slice(2, 4);
    return `BOC-${ts}${rnd}`;
  };

  const calculateOneHourLater = (timeStr: string): string => {
    if (!timeStr) return "";
    
    // Soporta formatos como "8:30 am", "08:30 AM", "15:30", "8:30"
    const regex = /(\d{1,2}):(\d{2})\s*(AM|PM|am|pm)?/i;
    const match = timeStr.match(regex);
    if (!match) {
      // Si escriben texto libre que no es hora, se guarda con margen por defecto
      return `${timeStr} (Rango 1h)`;
    }
    
    const hours = parseInt(match[1]);
    const minutes = match[2];
    const ampm = match[3] ? match[3].toUpperCase() : '';
    
    // Sumamos 1 hora
    let nextHours = hours + 1;
    let nextAmpm = ampm;
    
    if (ampm === 'AM' && nextHours === 12) {
      nextAmpm = 'PM';
    } else if (ampm === 'PM' && nextHours === 12) {
      nextAmpm = 'AM';
    } else if (nextHours > 12 && ampm) {
      nextHours = nextHours - 12;
    } else if (nextHours >= 24) {
      nextHours = nextHours - 24;
    }
    
    const paddedNextHours = nextHours.toString().padStart(2, '0');
    
    if (ampm) {
      return `${timeStr.toUpperCase()} A ${paddedNextHours}:${minutes} ${nextAmpm}`;
    } else {
      const paddedHours = hours.toString().padStart(2, '0');
      return `${paddedHours}:${minutes} A ${paddedNextHours}:${minutes}`;
    }
  };

  const handleFinalizeFormOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    setSaveError(null);

    const code = generateTrackingCode();
    const computedTimeSlot = calculateOneHourLater(formData.time_slot.trim());

    try {
      await createOrder({
        // Datos básicos del cliente que compra
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        address: formData.address.trim(),
        
        // El date "técnico" del pedido (se guarda como hoy para reporting)
        date: new Date().toISOString().split('T')[0],
        time_slot: computedTimeSlot,
        
        // Nuevos campos
        district: formData.district.trim(),
        delivery_date: formData.delivery_date,
        reference: formData.reference.trim(),
        receiver_phone: formData.receiver_phone.trim(),
        for_name: formData.for_name.trim(),
        from_name: formData.from_name.trim(),
        dedication: formData.dedication.trim(),
        
        items: items.map(i => ({ id: i.id, name: i.name, qty: i.qty, price: i.price })),
        total: Math.max(0, total),
        payment_method: "WhatsApp", // Todo se coordina por WA ahora
        tracking_code: code,
      });

        // Enviar correo de notificación de pedido usando Web3Forms (silencioso, en segundo plano)
        try {
          const cleanPhone = formData.phone.trim();
          const customerWhatsAppPhone = cleanPhone.startsWith('51') ? cleanPhone : `51${cleanPhone}`;
          const orderDetailsLines = items.map((i) => `• ${i.qty} x ${i.name} (${formatPEN(i.price * i.qty)})`).join('\n');
          
          const ownerWhatsAppMsg = `Hola ${formData.name.trim()}, te saludamos de Bocafest. Hemos recibido tu pedido con el código *${code}*. A continuación coordinamos la entrega de tu Box para el día ${formData.delivery_date} en el rango de ${computedTimeSlot}.`;
          const ownerWhatsAppUrl = `https://wa.me/${customerWhatsAppPhone}?text=${encodeURIComponent(ownerWhatsAppMsg)}`;

          fetch("https://formspree.io/f/meedqaoy", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Accept": "application/json"
            },
            body: JSON.stringify({
              subject: `🎁 Nuevo Pedido en Bocafest - ${code} (${formData.name.trim()})`,
              "Código de Pedido": code,
              "Nombre Cliente": formData.name.trim(),
              "Celular Cliente": formData.phone.trim(),
              "Distrito de Entrega": formData.district.trim(),
              "Dirección de Entrega": formData.address.trim(),
              "Referencia": formData.reference.trim() || "Ninguna",
              "Fecha de Entrega": formData.delivery_date,
              "Rango de Hora": computedTimeSlot,
              "Para (Destinatario)": formData.for_name.trim(),
              "De (Remitente)": formData.from_name.trim(),
              "Celular Destinatario": formData.receiver_phone.trim(),
              "Dedicatoria": formData.dedication.trim(),
              "Detalle de Productos": orderDetailsLines,
              "Total a Pagar": formatPEN(total),
              "👉 Chatear con el Cliente (WhatsApp)": ownerWhatsAppUrl
            })
          }).then(res => res.json())
            .then(data => console.log("Correo notificado vía Formspree:", data))
            .catch(err => console.error("Error al enviar correo en segundo plano:", err));
        } catch (err) {
          console.error('Error preparando envío de correo:', err);
        }

      setTrackingCode(code);
      setStep(3); // Pantalla de éxito
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
      <div className="bf-spring relative w-full max-w-xl overflow-hidden rounded-[2rem] bg-background shadow-2xl">
        {step !== 3 && (
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
              <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-accent">Paso 1 de 2</p>
              <h3 className="mt-2 font-display text-3xl text-primary md:text-4xl">¿Cómo deseas pedir?</h3>
              <p className="mt-2 font-serif text-lg text-muted-foreground">
                Total de tus productos: <span className="font-bold text-accent">{formatPEN(total)}</span>
              </p>

              <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <button
                  onClick={sendWhatsAppDirect}
                  className="group relative flex flex-col items-center overflow-hidden rounded-2xl border-2 border-primary/10 bg-card p-6 text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-[#25D366] hover:bg-[#25D366]/5"
                >
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366]/10 text-[#25D366] transition-transform duration-300 group-hover:scale-110 group-hover:bg-[#25D366] group-hover:text-white">
                    <MessageCircle className="h-7 w-7" />
                  </div>
                  <p className="font-display text-xl font-bold text-primary">Chat Rápido</p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Envía tu lista de productos directo a WhatsApp y coordinamos todo por ahí.
                  </p>
                </button>

                <button
                  onClick={() => setStep(2)}
                  className="group relative flex flex-col items-center overflow-hidden rounded-2xl border-2 border-primary/10 bg-card p-6 text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-accent hover:bg-accent/5"
                >
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-accent/10 text-accent transition-transform duration-300 group-hover:scale-110 group-hover:bg-accent group-hover:text-white">
                    <FileText className="h-7 w-7" />
                  </div>
                  <p className="font-display text-xl font-bold text-primary">Formulario</p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Llena todos los datos de envío, dedicatoria y fechas para agilizar tu pedido.
                  </p>
                </button>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-accent">Paso 2 de 2</p>
              <h3 className="mt-2 font-display text-3xl text-primary md:text-4xl">Datos del Pedido</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                El costo de delivery será calculado y enviado por WhatsApp tras recibir tu solicitud.
              </p>

              <form onSubmit={handleFinalizeFormOrder} className="mt-6 flex flex-col gap-5 max-h-[60vh] overflow-y-auto pr-2 pb-4 bf-scrollbar">
                
                {/* 1. Datos de Entrega */}
                <div className="space-y-4 rounded-xl border border-primary/10 bg-primary/5 p-4">
                  <h4 className="font-serif text-lg font-bold text-primary">Lugar y Fecha</h4>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold uppercase tracking-wider text-primary">Distrito *</label>
                      <input
                        required type="text" placeholder="Ej. San Juan Bautista"
                        name="district" autocomplete="address-level2"
                        value={formData.district} onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                        className="w-full rounded-xl border border-primary/20 bg-background px-4 py-2.5 text-sm text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                      />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold uppercase tracking-wider text-primary">Fecha de entrega *</label>
                        <div className="flex gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              const today = new Date().toISOString().split('T')[0];
                              setFormData({ ...formData, delivery_date: today });
                            }}
                            className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold border transition-all ${
                              formData.delivery_date === new Date().toISOString().split('T')[0]
                                ? 'bg-accent border-accent text-white shadow-sm'
                                : 'bg-background border-primary/20 text-primary hover:bg-primary/5'
                            }`}
                          >
                            Hoy
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const tomorrow = new Date();
                              tomorrow.setDate(tomorrow.getDate() + 1);
                              const tomorrowStr = tomorrow.toISOString().split('T')[0];
                              setFormData({ ...formData, delivery_date: tomorrowStr });
                            }}
                            className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold border transition-all ${
                              formData.delivery_date === (() => {
                                const tomorrow = new Date();
                                tomorrow.setDate(tomorrow.getDate() + 1);
                                return tomorrow.toISOString().split('T')[0];
                              })()
                                ? 'bg-accent border-accent text-white shadow-sm'
                                : 'bg-background border-primary/20 text-primary hover:bg-primary/5'
                            }`}
                          >
                            Mañana
                          </button>
                        </div>
                      </div>
                      <input
                        required type="date"
                        min={new Date().toISOString().split('T')[0]}
                        value={formData.delivery_date} onChange={(e) => setFormData({ ...formData, delivery_date: e.target.value })}
                        className="w-full rounded-xl border border-primary/20 bg-background px-4 py-2.5 text-sm text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold uppercase tracking-wider text-primary">¿A qué hora deseas que llegue? *</label>
                    <input
                      required
                      type="text"
                      placeholder="Ej. 08:30 AM o 09:00 AM"
                      value={formData.time_slot}
                      onChange={(e) => setFormData({ ...formData, time_slot: e.target.value })}
                      className="w-full rounded-xl border border-primary/20 bg-background px-4 py-2.5 text-sm text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                    />
                    <p className="text-[11px] leading-relaxed text-accent/80 mt-1.5 font-medium bg-accent/5 p-2 rounded-lg border border-accent/10">
                      💡 <strong>Nota de Tolerancia:</strong> Tu box llegará en un rango de hasta 1 hora máximo a partir de tu hora indicada (Ej. si pides 8:30 AM, el rango agendado será de 8:30 AM a 9:30 AM).
                    </p>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold uppercase tracking-wider text-primary">Dirección Exacta *</label>
                    <input
                      required type="text" placeholder="Ej. Av. Los Pinos 123"
                      name="address" autocomplete="street-address"
                      value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="w-full rounded-xl border border-primary/20 bg-background px-4 py-2.5 text-sm text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-xs font-semibold uppercase tracking-wider text-primary">Referencia (Opcional)</label>
                    <input
                      type="text" placeholder="Ej. Casa verde frente al parque"
                      value={formData.reference} onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                      className="w-full rounded-xl border border-primary/20 bg-background px-4 py-2.5 text-sm text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                    />
                  </div>
                </div>

                {/* 2. Datos del Sorprendido */}
                <div className="space-y-4 rounded-xl border border-primary/10 bg-primary/5 p-4">
                  <h4 className="font-serif text-lg font-bold text-primary">Detalle de la Sorpresa</h4>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold uppercase tracking-wider text-primary">Para (Nombre) *</label>
                      <input
                        required type="text" placeholder="A quién va dirigido"
                        value={formData.for_name} onChange={(e) => setFormData({ ...formData, for_name: e.target.value })}
                        className="w-full rounded-xl border border-primary/20 bg-background px-4 py-2.5 text-sm text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold uppercase tracking-wider text-primary">De (Tu Nombre) *</label>
                      <input
                        required type="text" placeholder="Quién envía"
                        value={formData.from_name} onChange={(e) => setFormData({ ...formData, from_name: e.target.value })}
                        className="w-full rounded-xl border border-primary/20 bg-background px-4 py-2.5 text-sm text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold uppercase tracking-wider text-primary">Teléfono de quien recibe *</label>
                    <input
                      required type="tel" minLength={9} maxLength={12} placeholder="Celular de la persona sorprendida"
                      value={formData.receiver_phone} onChange={(e) => setFormData({ ...formData, receiver_phone: e.target.value.replace(/\D/g, '') })}
                      className="w-full rounded-xl border border-primary/20 bg-background px-4 py-2.5 text-sm text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold uppercase tracking-wider text-primary">Dedicatoria (Máx 50 palabras) *</label>
                    <textarea
                      required rows={3} placeholder="Escribe tu mensaje especial aquí..."
                      value={formData.dedication} onChange={(e) => setFormData({ ...formData, dedication: e.target.value })}
                      className="w-full resize-none rounded-xl border border-primary/20 bg-background px-4 py-2.5 text-sm text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                    />
                  </div>
                </div>

                {/* 3. Datos de Contacto (Comprador) */}
                <div className="space-y-4 rounded-xl border border-primary/10 bg-primary/5 p-4">
                  <h4 className="font-serif text-lg font-bold text-primary">Tus Datos de Contacto</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold uppercase tracking-wider text-primary">Tu Nombre *</label>
                      <input
                        required type="text" placeholder="Nombre de quien compra"
                        name="name" autocomplete="name"
                        value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full rounded-xl border border-primary/20 bg-background px-4 py-2.5 text-sm text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold uppercase tracking-wider text-primary">Tu Celular *</label>
                      <input
                        required type="tel" minLength={9} maxLength={12} placeholder="Celular (para coordinar el pago)"
                        name="tel" autocomplete="tel"
                        value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '') })}
                        className="w-full rounded-xl border border-primary/20 bg-background px-4 py-2.5 text-sm text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                      />
                    </div>
                  </div>
                </div>
                
                {saveError && (
                  <div className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive text-center">
                    {saveError}
                  </div>
                )}

                <div className="sticky bottom-0 bg-background pt-2 pb-1">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-4 text-base font-semibold text-primary-foreground shadow-lg transition-transform hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100"
                  >
                    {saving ? 'Enviando...' : 'Enviar Pedido'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="mt-3 block w-full text-sm font-medium text-muted-foreground transition-colors hover:text-accent"
                  >
                    ← Volver atrás
                  </button>
                </div>
              </form>
            </>
          )}

          {step === 3 && (
            <div className="bf-reveal is-visible text-center py-6">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100 text-green-600">
                <CheckCircle2 className="h-10 w-10" />
              </div>
              <h3 className="font-display text-3xl text-primary">¡Pedido Recibido!</h3>
              <p className="mt-3 text-muted-foreground">
                Hemos recibido tu solicitud correctamente. En breve nos pondremos en contacto contigo vía WhatsApp para confirmarte el costo del delivery y los datos de pago.
              </p>
              
              <div className="my-8 rounded-2xl bg-muted/50 p-6 border border-primary/10">
                <p className="text-xs font-semibold uppercase tracking-widest text-primary/60">Código de tu solicitud</p>
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
