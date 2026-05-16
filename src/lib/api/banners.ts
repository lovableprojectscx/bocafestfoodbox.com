import { supabase, getBocafestTenantId } from '../supabase';

export type DbBanner = {
  id: string;
  tenant_id: string;
  image_url: string;
  link_url: string;
  whatsapp_message: string;
  is_active: boolean;
};

export async function fetchBanner(): Promise<DbBanner | null> {
  const tenantId = await getBocafestTenantId();
  const { data, error } = await supabase
    .from('ad_banners')
    .select('*')
    .eq('tenant_id', tenantId)
    .single();
  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching banner:', error);
    return null;
  }
  return data as DbBanner | null;
}

export async function saveBanner(banner: Partial<DbBanner>) {
  const tenantId = await getBocafestTenantId();
  
  // Ver si existe
  const { data: existing } = await supabase
    .from('ad_banners')
    .select('id')
    .eq('tenant_id', tenantId)
    .single();

  if (existing) {
    const { error } = await supabase
      .from('ad_banners')
      .update(banner)
      .eq('id', existing.id);
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from('ad_banners')
      .insert({ ...banner, tenant_id: tenantId });
    if (error) throw error;
  }
}

export async function uploadBannerImage(file: File): Promise<string> {
  const tenantId = await getBocafestTenantId();
  const fileExt = file.name.split('.').pop();
  const fileName = `banner-${Date.now()}.${fileExt}`;
  const filePath = `${tenantId}/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('images')
    .upload(filePath, file);

  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from('images').getPublicUrl(filePath);
  return data.publicUrl;
}
