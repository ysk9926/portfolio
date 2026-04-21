import { User } from '@supabase/supabase-js';
import { createServerSupabaseClient } from '@/utils/supabase/server';

export interface AdminContext {
  user: User | null;
  isAdmin: boolean;
  adminEmail: string | null;
}

export const getAdminContext = async (): Promise<AdminContext> => {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return {
      user: null,
      isAdmin: false,
      adminEmail: null,
    };
  }

  const { data: adminRow, error: adminError } = await supabase
    .from('admin_users')
    .select('email')
    .eq('user_id', user.id)
    .maybeSingle();

  if (adminError) {
    throw new Error(`Failed to resolve admin user: ${adminError.message}`);
  }

  return {
    user,
    isAdmin: Boolean(adminRow),
    adminEmail: adminRow?.email ?? null,
  };
};
