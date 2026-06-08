import { supabase } from './supabase';

export async function signInAdmin(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  return { data, error };
}

export async function signOutAdmin() {
  const { error } = await supabase.auth.signOut();
  return { error };
}

export async function getAdminSession() {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}
