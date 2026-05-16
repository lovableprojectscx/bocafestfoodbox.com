import { createFileRoute } from '@tanstack/react-router';
import { Search, Eye, X, Save, Trash2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { fetchOrders, updateOrderStatus, deleteOrder, type DbOrder, mapOrderStatus } from '@/lib/api/orders';

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
  const [search, setSearch] = useState('');
  const [orders, setOrders] = useState<DbOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<DbOrder | null>(null);
  const [newStatus, setNewStatus] = useState<DbOrder['status']>('pendiente');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchOrders().then(data => {
      setOrders(data);
      setLoading(false);
    }).catch(console.error);
  }, []);

  const filtered = orders.filter(o =>
    (o.tracking_code || '').toLowerCase().includes(search.toLowerCase()) ||
    o.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleOpenModal = (order: DbOrder) => {
    setSelectedOrder(order);
    setNewStatus(order.status);
  };

  const handleCloseModal = () => setSelectedOrder(null);

  const handleSaveStatus = async () => {
    if (!selectedOrder) return;
    setSaving(true);
    try {
      await updateOrderStatus(selectedOrder.id, newStatus);
      setOrders(orders.map(o => o.id === selectedOrder.id ? { ...o, status: newStatus } : o));
      handleCloseModal();
    } catch (e) {
      console.error(e);
      alert('Error al actualizar el estado.');
    } finally {
      setSaving(false);
    }
  };

  const handleDirectStatusChange = async (id: string, status: DbOrder['status']) => {
    try {
      setOrders(orders.map(o => o.id === id ? { ...o, status } : o));
      await updateOrderStatus(id, status);
    } catch (e) {
      console.error(e);
      alert('Error al actualizar el estado.');
      // Revert on error
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

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <input type="text" placeholder="Buscar por código o cliente..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="h-9 w-full rounded-md border border-input bg-background pl-9 pr-4 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" />
        </div>
        {/* Botón Filtros — pendiente de implementación */}
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
                <th className="whitespace-nowrap px-6 py-3 font-medium">Pago</th>
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
                    <td className="whitespace-nowrap px-6 py-4 text-muted-foreground">{order.payment_method || '—'}</td>
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
          <div className="bg-background w-full max-w-md rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <div>
                <h3 className="text-lg font-semibold">Detalle del Pedido</h3>
                <p className="text-sm text-muted-foreground">{selectedOrder.tracking_code || selectedOrder.id.slice(0, 8)}</p>
              </div>
              <button onClick={handleCloseModal} className="rounded-full p-1 hover:bg-muted text-muted-foreground"><X className="h-5 w-5" /></button>
            </div>
            <div className="overflow-y-auto p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><p className="text-muted-foreground">Cliente</p><p className="font-medium">{selectedOrder.name}</p></div>
                <div><p className="text-muted-foreground">Teléfono</p><p className="font-medium">{selectedOrder.phone}</p></div>
                <div><p className="text-muted-foreground">Dirección</p><p className="font-medium">{selectedOrder.address || '—'}</p></div>
                <div><p className="text-muted-foreground">Hora</p><p className="font-medium">{selectedOrder.time_slot || '—'}</p></div>
                <div><p className="text-muted-foreground">Total</p><p className="font-medium text-accent">S/ {Number(selectedOrder.total).toFixed(2)}</p></div>
                <div><p className="text-muted-foreground">Método de Pago</p><p className="font-medium">{selectedOrder.payment_method || '—'}</p></div>
              </div>

              {selectedOrder.items && selectedOrder.items.length > 0 && (
                <div className="border-t pt-4">
                  <p className="text-sm font-medium mb-2">Productos del pedido</p>
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

              {selectedOrder.receipt_url && (
                <div className="border-t pt-4">
                  <p className="text-sm font-medium mb-2">Comprobante de pago</p>
                  <img src={selectedOrder.receipt_url} alt="Comprobante" className="w-full rounded-xl border" />
                </div>
              )}

              <div className="space-y-2 pt-4 border-t">
                <label className="text-sm font-medium">Actualizar Estado</label>
                <select value={newStatus} onChange={(e) => setNewStatus(e.target.value as DbOrder['status'])}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                  {STATUS_OPTIONS.map(s => <option key={s} value={s}>{STATUS_UI[s]?.label || s}</option>)}
                </select>
              </div>
            </div>
            <div className="border-t bg-muted/50 px-6 py-4 flex justify-end gap-2">
              <button onClick={handleCloseModal} className="inline-flex h-10 items-center justify-center rounded-md border bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-muted">Cerrar</button>
              <button onClick={handleSaveStatus} disabled={saving} className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 disabled:opacity-60">
                <Save className="mr-2 h-4 w-4" />
                {saving ? 'Guardando...' : 'Actualizar Pedido'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
