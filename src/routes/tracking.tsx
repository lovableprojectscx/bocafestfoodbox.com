import { createFileRoute, useNavigate, Link } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { Search, CheckCircle2, Clock, Package, Truck, ArrowLeft, Gift } from 'lucide-react';
import { useSettings } from '@/lib/settings-context';
import { fetchOrderByTrackingCode, type DbOrder } from '@/lib/api/orders';

export const Route = createFileRoute('/tracking')({
  validateSearch: (search: Record<string, unknown>) => {
    return {
      code: search.code as string | undefined,
    };
  },
  component: TrackingPage,
});

function TrackingPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const { waUrl } = useSettings();
  
  const [code, setCode] = useState(search.code || '');
  const [searchedCode, setSearchedCode] = useState<string | null>(search.code || null);
  const [orderData, setOrderData] = useState<DbOrder | null>(null);
  const [loadingOrder, setLoadingOrder] = useState(false);

  // Sync state if URL changes externally
  useEffect(() => {
    if (search.code) {
      setCode(search.code);
      setSearchedCode(search.code);
    }
  }, [search.code]);

  useEffect(() => {
    if (searchedCode) {
      setLoadingOrder(true);
      fetchOrderByTrackingCode(searchedCode)
        .then(data => setOrderData(data))
        .catch(console.error)
        .finally(() => setLoadingOrder(false));
    }
  }, [searchedCode]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const upperCode = code.trim().toUpperCase();
    // Validar formato BF- seguido de caracteres alfanuméricos (mínimo 4)
    if (!upperCode || !/^BF-[A-Z0-9]{4,}$/.test(upperCode)) {
      alert('Ingresa un código de seguimiento válido. Ejemplo: BF-1A2B3C');
      return;
    }
    setSearchedCode(upperCode);
    navigate({ search: { code: upperCode } });
  };

  return (
    <div className="min-h-screen bg-background pb-20 pt-24">
      <div className="mx-auto max-w-3xl px-4">
        
        <Link
          to="/"
          className="mb-8 flex w-fit items-center gap-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver
        </Link>

        <div className="mb-10 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent">Tu Pedido</p>
          <h1 className="mt-2 font-display text-4xl text-primary md:text-5xl">Rastrea tu Caja</h1>
          <p className="mx-auto mt-4 max-w-lg font-serif text-lg text-muted-foreground">
            Ingresa el código que te proporcionamos al finalizar tu compra para conocer el estado actual de tu pedido.
          </p>
        </div>

        <div className="mx-auto max-w-xl rounded-[2rem] bg-card p-6 shadow-xl ring-1 ring-primary/5 md:p-10">
          <form onSubmit={handleSearch} className="relative flex items-center">
            <Search className="absolute left-5 h-5 w-5 text-primary/40" />
            <input
              type="text"
              placeholder="Ej. BF-1092"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full rounded-full border-2 border-primary/10 bg-background py-4 pl-14 pr-32 text-lg font-bold uppercase tracking-widest text-primary transition-colors focus:border-accent focus:outline-none"
            />
            <button
              type="submit"
              className="absolute right-2 top-2 bottom-2 rounded-full bg-primary px-6 font-bold text-primary-foreground transition-transform hover:scale-105"
            >
              Buscar
            </button>
          </form>

          {searchedCode && (
            <div className="bf-reveal is-visible mt-12 border-t border-primary/10 pt-10">
              {loadingOrder ? (
                <div className="flex flex-col items-center justify-center py-10">
                  <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
                  <p className="mt-4 text-sm text-muted-foreground">Buscando tu pedido...</p>
                </div>
              ) : orderData ? (
                <>
                  <div className="mb-8 flex items-center justify-between rounded-2xl bg-muted/50 p-5">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Código de Orden</p>
                      <p className="font-serif text-2xl font-bold tracking-widest text-primary">{searchedCode}</p>
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
                        orderData.status === 'cancelado' ? 'bg-red-100 text-red-600' : 
                        orderData.status === 'entregado' ? 'bg-purple-100 text-purple-700' : 'bg-accent/10 text-accent'
                      }`}>
                        {orderData.status !== 'cancelado' && orderData.status !== 'entregado' && (
                          <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse"></span>
                        )}
                        {orderData.status === 'cancelado' ? 'Cancelado' : 
                         orderData.status === 'entregado' ? 'Entregado' : 'Activo'}
                      </span>
                    </div>
                  </div>

                  {orderData.status !== 'cancelado' && (
                    <div className="relative pl-6">
                      <div className="absolute bottom-0 left-[15px] top-4 w-0.5 bg-primary/10"></div>
                      
                      <div className="relative mb-8 flex items-start gap-4">
                        <div className={`absolute -left-[30px] grid h-8 w-8 place-items-center rounded-full ${
                          ['pendiente', 'confirmado', 'preparacion', 'camino', 'entregado'].includes(orderData.status) 
                            ? 'bg-accent text-white shadow-md shadow-accent/20' 
                            : 'bg-background ring-4 ring-card text-muted-foreground'
                        }`}>
                          <CheckCircle2 className="h-4 w-4" />
                        </div>
                        <div className={['pendiente', 'confirmado', 'preparacion', 'camino', 'entregado'].includes(orderData.status) ? '' : 'opacity-50'}>
                          <h4 className="font-bold text-primary">Pedido Recibido</h4>
                          <p className="text-sm text-muted-foreground">Hemos recibido tu comprobante y estamos validando el pago.</p>
                          {orderData.status === 'pendiente' && <p className="mt-1 text-xs font-semibold text-primary/50">Estado actual</p>}
                        </div>
                      </div>

                      <div className="relative mb-8 flex items-start gap-4">
                        <div className={`absolute -left-[30px] grid h-8 w-8 place-items-center rounded-full ${
                          ['confirmado', 'preparacion', 'camino', 'entregado'].includes(orderData.status) 
                            ? 'bg-accent text-white shadow-md shadow-accent/20' 
                            : 'bg-background ring-4 ring-card text-muted-foreground'
                        }`}>
                          <Clock className="h-4 w-4" />
                        </div>
                        <div className={['confirmado', 'preparacion', 'camino', 'entregado'].includes(orderData.status) ? '' : 'opacity-50'}>
                          <h4 className="font-bold text-primary">Pago Validado</h4>
                          <p className="text-sm text-muted-foreground">Pago confirmado. Pedido agendado para preparación.</p>
                          {orderData.status === 'confirmado' && <p className="mt-1 text-xs font-semibold text-primary/50">Estado actual</p>}
                        </div>
                      </div>

                      <div className="relative mb-8 flex items-start gap-4">
                        <div className={`absolute -left-[30px] grid h-8 w-8 place-items-center rounded-full ${
                          ['preparacion', 'camino', 'entregado'].includes(orderData.status) 
                            ? 'bg-accent text-white shadow-md shadow-accent/20' 
                            : 'bg-background ring-4 ring-card text-muted-foreground'
                        }`}>
                          <Package className="h-4 w-4" />
                        </div>
                        <div className={['preparacion', 'camino', 'entregado'].includes(orderData.status) ? '' : 'opacity-50'}>
                          <h4 className="font-bold text-primary">En Preparación</h4>
                          <p className="text-sm text-muted-foreground">Estamos elaborando tu caja Bocafest con mucho amor.</p>
                          {orderData.status === 'preparacion' && <p className="mt-1 text-xs font-semibold text-primary/50">Estado actual</p>}
                        </div>
                      </div>

                      <div className="relative mb-8 flex items-start gap-4">
                        <div className={`absolute -left-[30px] grid h-8 w-8 place-items-center rounded-full ${
                          ['camino', 'entregado'].includes(orderData.status)
                            ? 'bg-accent text-white shadow-md shadow-accent/20' 
                            : 'bg-background ring-4 ring-card text-muted-foreground'
                        }`}>
                          <Truck className="h-4 w-4" />
                        </div>
                        <div className={['camino', 'entregado'].includes(orderData.status) ? '' : 'opacity-50'}>
                          <h4 className="font-bold text-primary">En Camino</h4>
                          <p className="text-sm text-muted-foreground">Tu pedido ha sido despachado y está en ruta hacia el destino.</p>
                          {orderData.status === 'camino' && <p className="mt-1 text-xs font-semibold text-primary/50">Estado actual</p>}
                        </div>
                      </div>

                      <div className="relative flex items-start gap-4">
                        <div className={`absolute -left-[30px] grid h-8 w-8 place-items-center rounded-full ${
                          orderData.status === 'entregado'
                            ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20 ring-4 ring-purple-100' 
                            : 'bg-background ring-4 ring-card text-muted-foreground'
                        }`}>
                          <Gift className="h-4 w-4" />
                        </div>
                        <div className={orderData.status === 'entregado' ? '' : 'opacity-50'}>
                          <h4 className="font-bold text-purple-700">¡Pedido Entregado!</h4>
                          <p className="text-sm text-muted-foreground">La sorpresa ha sido entregada con éxito. ¡Esperamos que la disfruten!</p>
                          {orderData.status === 'entregado' && <p className="mt-1 text-xs font-semibold text-purple-600">Estado finalizado</p>}
                        </div>
                      </div>

                    </div>
                  )}

                  <div className="mt-10 rounded-2xl bg-primary/5 p-6 text-center">
                    <p className="text-sm font-medium text-primary">¿Tienes alguna duda con tu pedido?</p>
                    <a href={waUrl(`Hola, tengo una consulta sobre mi pedido ${searchedCode}`)} target="_blank" rel="noopener noreferrer" className="mt-3 inline-block font-bold text-accent transition-colors hover:text-primary">
                      Contáctanos por WhatsApp →
                    </a>
                  </div>
                </>
              ) : (
                <div className="text-center py-10">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-500">
                    <Search className="h-8 w-8" />
                  </div>
                  <h3 className="text-lg font-bold text-primary">Pedido no encontrado</h3>
                  <p className="mt-2 text-sm text-muted-foreground">No hemos podido encontrar un pedido con el código <strong>{searchedCode}</strong>.</p>
                  <p className="text-sm text-muted-foreground">Por favor verifica que lo hayas escrito correctamente.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
