import { createClient } from '@supabase/supabase-js';

// Las claves viven en .env (nunca en Git)
// Archivo: VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Faltan variables de entorno VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY. Crea un archivo .env en la raíz del proyecto.');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Bocafest tenant slug — used to filter all queries
export const BOCAFEST_SLUG = 'bocafest';

// Get the Bocafest tenant ID (cached after first call)
let _tenantId: string | null = null;
export async function getBocafestTenantId(): Promise<string> {
  if (_tenantId) return _tenantId;
  const { data, error } = await supabase
    .from('tenants')
    .select('id')
    .eq('slug', BOCAFEST_SLUG)
    .single();
  if (error || !data) throw new Error('Bocafest tenant not found');
  _tenantId = data.id;
  return _tenantId;
}
