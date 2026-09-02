'use server';

import { signIn } from '@/auth';

export async function signInWithGoogle() {
  await signIn('google', { redirectTo: '/' });
}

export async function signInWithMagicLink(formData: FormData) {
  const email = String(formData.get('email') ?? '').trim();
  if (!email) return;
  await signIn('resend', { email, redirectTo: '/login/check-email' });
}

export async function signInWithDev(formData: FormData) {
  const email = String(formData.get('email') ?? '').trim();
  if (!email) return;
  await signIn('dev', { email, redirectTo: '/' });
}
