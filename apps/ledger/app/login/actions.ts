'use server';

import { signIn } from '@/auth';

export async function signInWithGoogle() {
  await signIn('google', { redirectTo: '/' });
}

export async function signInWithMagicLink(formData: FormData) {
  const email = String(formData.get('email') ?? '').trim();
  if (!email) return;
  // redirectTo is where the *emailed link* lands, not where the requester
  // goes now — pointing it at the check-email page would drop someone who
  // just clicked the link onto a screen telling them to check their email.
  // Home resolves to their own project. The "check your email" screen is
  // configured as pages.verifyRequest in auth.ts instead.
  await signIn('resend', { email, redirectTo: '/' });
}

export async function signInWithDev(formData: FormData) {
  const email = String(formData.get('email') ?? '').trim();
  if (!email) return;
  await signIn('dev', { email, redirectTo: '/' });
}
