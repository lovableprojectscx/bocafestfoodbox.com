import { supabase, getBocafestTenantId } from '../supabase';

export async function fetchCategories(): Promise<string[]> {
  const tenantId = await getBocafestTenantId();
  const { data, error } = await supabase
    .from('categories')
    .select('name')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data || []).map((c: { name: string }) => c.name);
}

export async function createCategory(name: string) {
  const tenantId = await getBocafestTenantId();
  const slug = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-');
  const { data, error } = await supabase
    .from('categories')
    .insert({ tenant_id: tenantId, name, slug })
    .select('id, name, slug')
    .single();
  if (error) throw error;
  return data;
}

export async function updateCategory(oldName: string, newName: string) {
  const tenantId = await getBocafestTenantId();
  const slug = newName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-');
  const { error } = await supabase
    .from('categories')
    .update({ name: newName, slug })
    .eq('tenant_id', tenantId)
    .eq('name', oldName);
  if (error) throw error;
}

export async function deleteCategory(name: string) {
  const tenantId = await getBocafestTenantId();
  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('tenant_id', tenantId)
    .eq('name', name);
  if (error) throw error;
}
