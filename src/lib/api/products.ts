import { supabase, getBocafestTenantId } from '../supabase';

export type DbProduct = {
  id: string;
  tenant_id: string;
  title: string;
  description: string | null;
  price: number;
  offer_price: number | null;
  category: string[];
  image: string | null;
  stock: string | null;
  rating: number;
  created_at: string;
};

// Map DB product to the format used in the frontend
export function mapProduct(p: DbProduct) {
  return {
    id: p.id,
    name: p.title,
    description: p.description || '',
    price: Number(p.price),
    category: p.category?.[0] || 'Sin categoría',
    image: p.image || 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?q=80&w=800&auto=format&fit=crop',
    stock: p.stock,
  };
}

export async function fetchProducts() {
  const tenantId = await getBocafestTenantId();
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data as DbProduct[]).map(mapProduct);
}

export async function createProduct(payload: {
  title: string;
  description: string;
  price: number;
  category: string;
  image: string;
}) {
  const tenantId = await getBocafestTenantId();
  const { data, error } = await supabase
    .from('products')
    .insert({
      tenant_id: tenantId,
      title: payload.title,
      description: payload.description,
      price: payload.price,
      category: [payload.category],
      image: payload.image,
    })
    .select()
    .single();
  if (error) throw error;
  return mapProduct(data as DbProduct);
}

export async function updateProduct(id: string, payload: {
  title: string;
  description: string;
  price: number;
  category: string;
  image: string;
}) {
  const { data, error } = await supabase
    .from('products')
    .update({
      title: payload.title,
      description: payload.description,
      price: payload.price,
      category: [payload.category],
      image: payload.image,
    })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return mapProduct(data as DbProduct);
}

export async function deleteProduct(id: string) {
  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) throw error;
}
