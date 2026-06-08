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

export async function sendPasswordReset(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}${import.meta.env.BASE_URL}reset-password`,
  });
  return { error };
}

export async function updateAdminPassword(newPassword: string) {
  const { data, error } = await supabase.auth.updateUser({ password: newPassword });
  return { data, error };
}
