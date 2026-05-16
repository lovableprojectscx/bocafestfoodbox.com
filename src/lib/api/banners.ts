import { supabase, getBocafestTenantId } from '../supabase';

export type DbBanner = {
  id?: string;
  tenant_id: string;
  image_url: string;
  link_url: string;
  whatsapp_message: string;
  is_active: boolean;
};

export async function fetchBanner(): Promise<DbBanner | null> {
  const tenantId = await getBocafestTenantId();
  const { data, error } = await supabase
    .from('tenant_settings')
    .select('ad_active, ad_image_url, ad_link, ad_message')
    .eq('tenant_id', tenantId)
    .single();
    
  if (error) {
    console.error('Error fetching banner:', error);
    return null;
  }
  
  if (!data) return null;
  
  return {
    tenant_id: tenantId,
    is_active: data.ad_active || false,
    image_url: data.ad_image_url || '',
    link_url: data.ad_link || '',
    whatsapp_message: data.ad_message || ''
  };
}

export async function saveBanner(banner: Partial<DbBanner>) {
  const tenantId = await getBocafestTenantId();
  
  const { error } = await supabase
    .from('tenant_settings')
    .update({
      ad_active: banner.is_active,
      ad_image_url: banner.image_url,
      ad_link: banner.link_url,
      ad_message: banner.whatsapp_message,
      updated_at: new Date().toISOString()
    })
    .eq('tenant_id', tenantId);
    
  if (error) throw error;
}
