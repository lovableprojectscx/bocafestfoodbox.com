import { supabase, getBocafestTenantId } from '../supabase';

export type DbSettings = {
  tenant_id: string;
  whatsapp: string | null;
  store_name: string | null;
  yape_number: string | null;
  yape_qr_url: string | null;
  schedule: string | null;
  zones: string | null;
  plin_enabled: boolean | null;
  ad_active: boolean | null;
};

export async function fetchSettings(): Promise<DbSettings | null> {
  const tenantId = await getBocafestTenantId();
  const { data, error } = await supabase
    .from('tenant_settings')
    .select('*')
    .eq('tenant_id', tenantId)
    .single();
  if (error) return null;
  return data as DbSettings;
}

export async function saveSettings(settings: Partial<DbSettings>) {
  const tenantId = await getBocafestTenantId();
  const { error } = await supabase
    .from('tenant_settings')
    .update({ ...settings, updated_at: new Date().toISOString() })
    .eq('tenant_id', tenantId);
  if (error) throw error;
}
