import { createFileRoute } from '@tanstack/react-router';
import { Search, Eye, X, Save, Trash2, MessageSquare, CheckCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { fetchOrders, updateOrderStatus, updateOrderDeliveryFee, deleteOrder, type DbOrder, mapOrderStatus } from '@/lib/api/orders';
import { useSettings } from '@/lib/settings-context';

export const Route = createFileRoute('/admin/pedidos')({
  component: PedidosPage,
});

const STATUS_OPTIONS: Array<DbOrder['status']> = ['pendiente', 'confirmado', 'preparacion', 'camino', 'entregado', 'cancelado'];

const STATUS_UI: Record<string, { label: string; color: string }> = {
  'pendiente':   { label: 'Recibido',        color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  'confirmado':  { label: 'Validado',        color: 'bg-green-100 text-green-800 border-green-200' },
  'preparacion': { label: 'En Preparación',  color: 'bg-orange-100 text-orange-800 border-orange-200' },
  'camino':      { label: 'En Camino',       color: 'bg-blue-100 text-blue-800 border-blue-200' },
  'entregado':   { label: 'Entregado',       color: 'bg-purple-100 text-purple-800 border-purple-200' },
  'cancelado':   { label: 'Cancelado',       color: 'bg-red-100 text-red-800 border-red-200' },
};

function PedidosPage() {
  const { whatsapp: adminWhatsapp, yape_number, yape_holder_name, bcp_account } = useSettings();
  const [search, setSearch] = useState('');
  const [orders, setOrders] = useState<DbOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<DbOrder | null>(null);
  const [newStatus, setNewStatus] = useState<DbOrder['status']>('pendiente');
  const [deliveryFee, setDeliveryFee] = useState<number>(0);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'activos' | 'entregados' | 'cancelados'>('activos');

  useEffect(() => {
    fetchOrders().then(data => {
      setOrders(data);
      setLoading(false);
    }).catch(console.error);
  }, []);

  const filtered = orders.filter(o => {
    // 1. Filtrar por buscador
    const matchesSearch = (o.tracking_code || '').toLowerCase().includes(search.toLowerCase()) ||
                          o.name.toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;

    // 2. Filtrar por pestaña activa
    if (activeTab === 'activos') {
      return o.status !== 'entregado' && o.status !== 'cancelado';
    } else if (activeTab === 'entregados') {
      return o.status === 'entregado';
    } else {
      return o.status === 'cancelado';
    }
  });

  const handleOpenModal = (order: DbOrder) => {
    setSelectedOrder(order);
    setNewStatus(order.status);
    setDeliveryFee(order.delivery_fee || 0);
  };

  const handleCloseModal = () => setSelectedOrder(null);

  const handleModalStatusChange = async (status: DbOrder['status']) => {
    if (!selectedOrder) return;
    setNewStatus(status);
    setSelectedOrder(prev => prev ? { ...prev, status } : null);
    setOrders(orders.map(o => o.id === selectedOrder.id ? { ...o, status } : o));

    try {
      await updateOrderStatus(selectedOrder.id, status);
    } catch (e) {
      console.error(e);
      alert('Error al actualizar el estado.');
      fetchOrders().then(setOrders).catch(console.error);
    }
  };

  const handleDirectStatusChange = async (id: string, status: DbOrder['status']) => {
    try {
      setOrders(orders.map(o => o.id === id ? { ...o, status } : o));
      await updateOrderStatus(id, status);
    } catch (e) {
      console.error(e);
      alert('Error al actualizar el estado.');
      fetchOrders().then(setOrders).catch(console.error);
    }
  };

  const handleDeleteOrder = async (id: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este pedido?')) return;
    try {
      await deleteOrder(id);
      setOrders(orders.filter(o => o.id !== id));
    } catch (e) {
      console.error(e);
      alert('Error al eliminar el pedido.');
    }
  };

  const formatDate = (d: string) => new Date(d).toLocaleString('es-PE', { dateStyle: 'medium', timeStyle: 'short' });

  const getFriendlyDate = (dateStr?: string | null) => {
    if (!dateStr) return '—';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    return d.toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long' }).toUpperCase();
  };

  // WhatsApp 1: Enviar cobro con los precios y cuentas
  const sendBillingWhatsApp = (order: DbOrder) => {
    const productsSum = order.items.reduce((acc, i) => acc + (i.price * i.qty), 0);
    const totalWithDelivery = productsSum + Number(deliveryFee);

    let itemsText = "";
    order.items.forEach(i => {
      itemsText += `- ${i.qty}x ${i.name}: S/ ${(i.price * i.qty).toFixed(2)}\n`;
    });

    const message = `*RESUMEN DE SU PEDIDO:*\n\n` +
      `${itemsText.trim()}\n` +
      `----------------------------------------\n` +
      `*PRODUCTOS:* S/ ${productsSum.toFixed(2)}\n` +
      `*DELIVERY:* S/ ${Number(deliveryFee).toFixed(2)}\n` +
      `*TOTAL A PAGAR:* S/ ${totalWithDelivery.toFixed(2)}\n` +
      `----------------------------------------\n\n` +
      `*DATOS DE ENTREGA:*\n` +
      `- Distrito: ${order.district || '—'}\n` +
      `- Dirección: ${order.address || '—'}\n\n` +
      `*MEDIOS DE PAGO:*\n` +
      `- Yape: ${yape_number || adminWhatsapp.replace(/^51/, '')} (A nombre de: ${yape_holder_name || 'Bocafest'})\n` +
      `- Plin: ${yape_number || adminWhatsapp.replace(/^51/, '')}\n` +
      (bcp_account ? `- Cuenta BCP: ${bcp_account}\n\n` : `\n`) +
      `Por favor envíanos la captura de tu pago para agendar formalmente tu entrega. ¡Muchas gracias!`;

    window.open(`https://wa.me/51${order.phone}?text=${encodeURIComponent(message)}`, "_blank", "noopener");
  };

  // WhatsApp 2: Enviar Tracking
  const sendTrackingWhatsApp = (order: DbOrder) => {
    const trackingLink = `${window.location.origin}/tracking?code=${order.tracking_code}`;
    const friendlyDate = getFriendlyDate(order.delivery_date);

    const message = `¡Muchas gracias por preferirnos!\n\n` +
      `Tu pedido está agendado para el día *${friendlyDate}* en el rango de *${order.time_slot || '8:30 AM A 10:30 AM'}*\n\n` +
      `Tu código de seguimiento es: *${order.tracking_code}*\n\n` +
      `Puedes ver el estado en tiempo real de tu pedido aquí:\n${trackingLink}`;

    window.open(`https://wa.me/51${order.phone}?text=${encodeURIComponent(message)}`, "_blank", "noopener");
  };

  if (loading) return (
    <div className="flex items-center justify-center h-48">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Pedidos</h2>
        <p className="text-muted-foreground">Gestiona los pedidos y su estado de entrega. ({orders.length} en total)</p>
      </div>

      {/* Pestañas de Filtrado */}
      <div className="flex border-b border-muted">
        <button
          onClick={() => setActiveTab('activos')}
          className={`px-4 py-2.5 font-semibold text-sm border-b-2 transition-all ${
            activeTab === 'activos'
              ? 'border-primary text-primary bg-primary/5 font-bold'
              : 'border-transparent text-muted-foreground hover:text-primary'
          }`}
        >
          Activos ({orders.filter(o => o.status !== 'entregado' && o.status !== 'cancelado').length})
        </button>
        <button
          onClick={() => setActiveTab('entregados')}
          className={`px-4 py-2.5 font-semibold text-sm border-b-2 transition-all ${
            activeTab === 'entregados'
              ? 'border-primary text-primary bg-primary/5 font-bold'
              : 'border-transparent text-muted-foreground hover:text-primary'
          }`}
        >
          Entregados ({orders.filter(o => o.status === 'entregado').length})
        </button>
        <button
          onClick={() => setActiveTab('cancelados')}
          className={`px-4 py-2.5 font-semibold text-sm border-b-2 transition-all ${
            activeTab === 'cancelados'
              ? 'border-primary text-primary bg-primary/5 font-bold'
              : 'border-transparent text-muted-foreground hover:text-primary'
          }`}
        >
          Cancelados ({orders.filter(o => o.status === 'cancelado').length})
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <input type="text" placeholder="Buscar por código o cliente..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="h-9 w-full rounded-md border border-input bg-background pl-9 pr-4 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" />
        </div>
      </div>

      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                <th className="whitespace-nowrap px-6 py-3 font-medium">Código</th>
                <th className="whitespace-nowrap px-6 py-3 font-medium">Cliente</th>
                <th className="whitespace-nowrap px-6 py-3 font-medium">Fecha</th>
                <th className="whitespace-nowrap px-6 py-3 font-medium">Total</th>
                <th className="whitespace-nowrap px-6 py-3 font-medium">Delivery</th>
                <th className="whitespace-nowrap px-6 py-3 font-medium">Estado</th>
                <th className="whitespace-nowrap px-6 py-3 font-medium text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y border-t">
              {filtered.map((order) => {
                const ui = STATUS_UI[order.status] || STATUS_UI['pendiente'];
                return (
                  <tr key={order.id} className="hover:bg-muted/50 transition-colors">
                    <td className="whitespace-nowrap px-6 py-4 font-medium text-primary">{order.tracking_code || '—'}</td>
                    <td className="whitespace-nowrap px-6 py-4">{order.name}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-muted-foreground">{formatDate(order.created_at)}</td>
                    <td className="whitespace-nowrap px-6 py-4 font-medium">S/ {Number(order.total).toFixed(2)}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-muted-foreground">S/ {Number(order.delivery_fee || 0).toFixed(2)}</td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <select
                        value={order.status}
                        onChange={(e) => handleDirectStatusChange(order.id, e.target.value as DbOrder['status'])}
                        className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring cursor-pointer ${ui.color}`}
                      >
                        {STATUS_OPTIONS.map(s => (
                          <option key={s} value={s} className="bg-background text-foreground font-normal">
                            {STATUS_UI[s]?.label || s}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right">
                      <div className="inline-flex gap-1 justify-end">
                        <button onClick={() => handleOpenModal(order)} className="inline-flex h-8 w-8 items-center justify-center rounded-md border bg-background text-muted-foreground hover:bg-muted transition-colors" title="Ver Detalles">
                          <Eye className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleDeleteOrder(order.id)} className="inline-flex h-8 w-8 items-center justify-center rounded-md border bg-background text-destructive hover:bg-destructive/10 transition-colors" title="Eliminar Pedido">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="px-6 py-8 text-center text-muted-foreground">{orders.length === 0 ? 'Aún no hay pedidos registrados.' : 'No se encontraron pedidos.'}</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t px-6 py-3 text-sm text-muted-foreground">
          <div>Mostrando {filtered.length} de {orders.length} pedidos</div>
        </div>
      </div>

      {selectedOrder && (
        <div className="fixed inset-0 z-[60] flex justify-center items-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-background w-full max-w-xl rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <div>
                <h3 className="text-lg font-semibold">Detalle del Pedido</h3>
                <p className="text-sm text-muted-foreground">{selectedOrder.tracking_code || selectedOrder.id.slice(0, 8)}</p>
              </div>
              <button onClick={handleCloseModal} className="rounded-full p-1 hover:bg-muted text-muted-foreground"><X className="h-5 w-5" /></button>
            </div>
            
            <div className="overflow-y-auto p-6 space-y-6">
              {/* 1. Datos de Entrega y Delivery */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm border-b pb-4">
                <div><p className="text-muted-foreground font-semibold">Distrito</p><p className="font-medium text-base">{selectedOrder.district || '—'}</p></div>
                <div><p className="text-muted-foreground font-semibold">Dirección</p><p className="font-medium text-base">{selectedOrder.address || '—'}</p></div>
                <div><p className="text-muted-foreground font-semibold">Referencia</p><p className="font-medium text-base">{selectedOrder.reference || '—'}</p></div>
                <div><p className="text-muted-foreground font-semibold">Rango de entrega</p><p className="font-medium text-base text-accent">{selectedOrder.time_slot || '—'}</p></div>
                <div><p className="text-muted-foreground font-semibold">Fecha de entrega</p><p className="font-medium text-base">{getFriendlyDate(selectedOrder.delivery_date)}</p></div>
              </div>

              {/* 2. Datos de Sorpresa */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm border-b pb-4">
                <div><p className="text-muted-foreground font-semibold">Para (Nombre)</p><p className="font-medium text-base">{selectedOrder.for_name || '—'}</p></div>
                <div><p className="text-muted-foreground font-semibold">De (Nombre)</p><p className="font-medium text-base">{selectedOrder.from_name || '—'}</p></div>
                <div><p className="text-muted-foreground font-semibold">Teléfono del destinatario</p><p className="font-medium text-base">{selectedOrder.receiver_phone || '—'}</p></div>
                <div className="col-span-1 md:col-span-2">
                  <p className="text-muted-foreground font-semibold">Dedicatoria</p>
                  <p className="font-medium text-base italic bg-primary/5 p-3 rounded-lg border border-primary/10 mt-1">"{selectedOrder.dedication || '—'}"</p>
                </div>
              </div>

              {/* 3. Datos del Comprador */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm border-b pb-4">
                <div><p className="text-muted-foreground font-semibold">Comprador</p><p className="font-medium text-base">{selectedOrder.name}</p></div>
                <div><p className="text-muted-foreground font-semibold">Teléfono</p><p className="font-medium text-base">{selectedOrder.phone}</p></div>
              </div>

              {/* 4. Resumen de Pago */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><p className="text-muted-foreground font-semibold">Total Productos</p><p className="font-medium text-lg">S/ {Number(selectedOrder.total).toFixed(2)}</p></div>
                <div>
                  <p className="text-muted-foreground font-semibold">Costo Delivery (S/)</p>
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="number"
                      min="0"
                      placeholder="0.00"
                      value={deliveryFee}
                      onChange={(e) => setDeliveryFee(Number(e.target.value))}
                      className="flex h-9 w-28 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring font-semibold text-accent"
                    />
                    <button
                      type="button"
                      onClick={async () => {
                        if (!selectedOrder) return;
                        try {
                          await updateOrderDeliveryFee(selectedOrder.id, Number(deliveryFee));
                          setOrders(orders.map(o => o.id === selectedOrder.id ? { ...o, delivery_fee: Number(deliveryFee) } : o));
                          setSelectedOrder(prev => prev ? { ...prev, delivery_fee: Number(deliveryFee) } : null);
                          alert('¡Costo de delivery guardado!');
                        } catch (e) {
                          console.error(e);
                          alert('Error al guardar el costo de delivery.');
                        }
                      }}
                      className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-3 text-xs font-semibold text-primary-foreground shadow transition-colors hover:bg-primary/90 cursor-pointer active:scale-95"
                    >
                      Guardar
                    </button>
                  </div>
                </div>
              </div>

              {selectedOrder.items && selectedOrder.items.length > 0 && (
                <div className="border-t pt-4 bg-muted/30 p-4 rounded-xl">
                  <p className="text-sm font-semibold mb-2 text-primary">Productos del pedido</p>
                  <div className="space-y-1">
                    {selectedOrder.items.map((item: { name: string; qty: number; price: number }, i: number) => (
                      <div key={i} className="flex justify-between text-sm">
                        <span>{item.qty}x {item.name}</span>
                        <span className="text-muted-foreground">S/ {(item.price * item.qty).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 5. Acciones de Envío a WhatsApp */}
              <div className="flex flex-col gap-2 pt-4 border-t">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Acciones de WhatsApp</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    onClick={() => sendBillingWhatsApp(selectedOrder)}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 hover:bg-orange-600 px-4 py-3 text-sm font-bold text-white shadow-lg transition-transform active:scale-[0.98]"
                  >
                    <MessageSquare className="h-4 w-4" />
                    Enviar Cobro a WA
                  </button>

                  <button
                    onClick={() => sendTrackingWhatsApp(selectedOrder)}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-600 hover:bg-green-700 px-4 py-3 text-sm font-bold text-white shadow-lg transition-transform active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
                    disabled={selectedOrder.status !== 'confirmado'}
                    title={selectedOrder.status !== 'confirmado' ? "Solo disponible cuando el estado del pago sea Validado (Confirmado)" : ""}
                  >
                    <CheckCircle className="h-4 w-4" />
                    Enviar Tracking a WA
                  </button>
                </div>
                {selectedOrder.status !== 'confirmado' && (
                  <p className="text-[11px] text-muted-foreground text-center">
                    💡 Cambia el estado a *Validado* abajo para activar instantáneamente el envío de tracking.
                  </p>
                )}
              </div>

              {/* 6. Selector de Estado Interno */}
              <div className="space-y-2 pt-4 border-t">
                <label className="text-sm font-semibold">Actualizar Estado en Sistema</label>
                <select value={newStatus} onChange={(e) => handleModalStatusChange(e.target.value as DbOrder['status'])}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring cursor-pointer">
                  {STATUS_OPTIONS.map(s => <option key={s} value={s}>{STATUS_UI[s]?.label || s}</option>)}
                </select>
              </div>
            </div>
            
            <div className="border-t bg-muted/50 px-6 py-4 flex justify-end">
              <button onClick={handleCloseModal} className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-6 py-2 text-sm font-semibold text-primary-foreground shadow transition-colors hover:bg-primary/90">
                Cerrar Ventana
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
