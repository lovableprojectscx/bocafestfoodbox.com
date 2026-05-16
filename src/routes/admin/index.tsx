import { createFileRoute } from '@tanstack/react-router';
import { DollarSign, ShoppingBag, Package, TrendingUp, Eye } from 'lucide-react';
import { useState, useEffect } from 'react';
import { fetchOrders, type DbOrder } from '@/lib/api/orders';
import { fetchProducts } from '@/lib/api/products';
import { Link } from '@tanstack/react-router';

export const Route = createFileRoute('/admin/')({
  component: DashboardPage,
});

const STATUS_UI: Record<string, { label: string; color: string }> = {
  'pendiente':   { label: 'Recibido',       color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  'confirmado':  { label: 'Validado',        color: 'bg-green-100 text-green-800 border-green-200' },
  'cancelado':   { label: 'Cancelado',       color: 'bg-red-100 text-red-800 border-red-200' },
};

function DashboardPage() {
  const [orders, setOrders] = useState<DbOrder[]>([]);
  const [productCount, setProductCount] = useState(0);
  const [outOfStockCount, setOutOfStockCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchOrders(), fetchProducts()])
      .then(([ordersData, productsData]) => {
        setOrders(ordersData);
        setProductCount(productsData.length);
        setOutOfStockCount(productsData.filter(p => p.stock === 'Agotado').length);
        setLoading(false);
      })
      .catch(console.error);
  }, []);

  // Calcular estadísticas
  const validOrders = orders.filter(o => o.status !== 'cancelado');
  const totalSales = validOrders.reduce((sum, o) => sum + Number(o.total || 0), 0);
  const pendingOrders = orders.filter(o => o.status === 'pendiente');

  const stats = [
    { 
      name: 'Ventas Totales', 
      value: `S/ ${totalSales.toFixed(2)}`, 
      icon: DollarSign, 
      trend: `${validOrders.length} pedidos validados` 
    },
    { 
      name: 'Pedidos Nuevos', 
      value: `${pendingOrders.length}`, 
      icon: ShoppingBag, 
      trend: `${pendingOrders.length} pendientes de validación` 
    },
    { 
      name: 'Productos Activos', 
      value: `${productCount}`, 
      icon: Package, 
      trend: outOfStockCount > 0 ? `${outOfStockCount} sin stock` : 'Todos con stock disponible' 
    },
  ];

  const formatDate = (d: string) => new Date(d).toLocaleString('es-PE', { dateStyle: 'medium', timeStyle: 'short' });

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  );

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Dashboard General</h2>
        <p className="text-muted-foreground">Resumen en tiempo real del estado de tu tienda y pedidos recientes.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.name} className="rounded-2xl border bg-card p-6 shadow-sm transition-all hover:shadow-md">
              <div className="flex flex-row items-center justify-between pb-2">
                <h3 className="text-sm font-medium text-muted-foreground">{stat.name}</h3>
                <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold font-display">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1">{stat.trend}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-2xl border bg-card p-6 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-lg">Últimos Pedidos Recibidos</h3>
          <Link to="/admin/pedidos" className="text-xs font-semibold text-primary hover:underline">
            Ver todos los pedidos →
          </Link>
        </div>
        <div className="divide-y">
          {orders.slice(0, 5).map((order) => {
            const ui = STATUS_UI[order.status] || STATUS_UI['pendiente'];
            return (
              <div key={order.id} className="flex flex-col sm:flex-row sm:items-center justify-between py-3.5 gap-2 transition-colors hover:bg-muted/30 px-2 rounded-xl">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-primary leading-none">
                      {order.tracking_code || order.id.slice(0, 8)}
                    </p>
                    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${ui.color}`}>
                      {ui.label}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground font-medium">
                    {order.name} · {formatDate(order.created_at)}
                  </p>
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-0 pt-2 sm:pt-0">
                  <div className="font-semibold text-sm">S/ {Number(order.total).toFixed(2)}</div>
                  <Link
                    to="/admin/pedidos"
                    className="inline-flex h-8 items-center justify-center rounded-lg border bg-background px-3 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                  >
                    <Eye className="mr-1.5 h-3 w-3" /> Gestionar
                  </Link>
                </div>
              </div>
            );
          })}
          {orders.length === 0 && (
            <div className="py-8 text-center text-muted-foreground text-sm">
              Aún no se han recibido pedidos en la tienda.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
