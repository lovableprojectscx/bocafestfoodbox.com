import { supabase, getBocafestTenantId } from '../supabase';

export type DbOrder = {
  id: string;
  tenant_id: string;
  name: string;
  phone: string;
  address: string | null;
  date: string;
  time_slot: string | null;
  message: string | null;
  items: Array<{ id: string; name: string; qty: number; price: number }>;
  total: number;
  payment_method: string | null;
  receipt_url: string | null;
  tracking_code: string | null;
  status: 'pendiente' | 'confirmado' | 'preparacion' | 'camino' | 'entregado' | 'cancelado';
  created_at: string;
};

const STATUS_MAP: Record<string, string> = {
  'pendiente':   'Recibido',
  'confirmado':  'Validado',
  'preparacion': 'En Preparación',
  'camino':      'En Camino',
  'entregado':   'Entregado',
  'cancelado':   'Cancelado',
};

export function mapOrderStatus(dbStatus: string): string {
  return STATUS_MAP[dbStatus] || dbStatus;
}

export async function fetchOrders(): Promise<DbOrder[]> {
  const tenantId = await getBocafestTenantId();
  const { data, error } = await supabase
    .from('reservations')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data as DbOrder[];
}

export async function updateOrderStatus(id: string, status: 'pendiente' | 'confirmado' | 'preparacion' | 'camino' | 'entregado' | 'cancelado') {
  const { error } = await supabase
    .from('reservations')
    .update({ status })
    .eq('id', id);
  if (error) throw error;
}

export async function createOrder(payload: {
  name: string;
  phone: string;
  address: string;
  date: string;
  time_slot: string;
  message?: string;
  items: Array<{ id: string; name: string; qty: number; price: number }>;
  total: number;
  payment_method: string;
  receipt_url?: string;
  tracking_code: string;
}) {
  const tenantId = await getBocafestTenantId();
  const { data, error } = await supabase
    .from('reservations')
    .insert({
      tenant_id: tenantId,
      name: payload.name,
      phone: payload.phone,
      address: payload.address,
      date: payload.date,
      time_slot: payload.time_slot,
      message: payload.message,
      items: payload.items,
      total: payload.total,
      payment_method: payload.payment_method,
      receipt_url: payload.receipt_url,
      tracking_code: payload.tracking_code,
      status: 'pendiente',
    })
    .select()
    .single();
  if (error) throw error;
  return data as DbOrder;
}

export async function fetchOrderByTrackingCode(code: string): Promise<DbOrder | null> {
  const tenantId = await getBocafestTenantId();
  const { data, error } = await supabase
    .from('reservations')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('tracking_code', code.toUpperCase())
    .single();
  if (error) return null;
  return data as DbOrder;
}

export async function deleteOrder(id: string) {
  const { error } = await supabase
    .from('reservations')
    .delete()
    .eq('id', id);
  if (error) throw error;
}
