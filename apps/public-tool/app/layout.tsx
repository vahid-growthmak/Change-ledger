import type { Metadata } from 'next';
import { Manrope } from 'next/font/google';
import './globals.css';

// Growthmak's own typeface — --font-mono stays a static system stack,
// declared in tokens.css, matching growthmak.com's own --font-mono token.
const manrope = Manrope({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-manrope',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Change Ledger — one shared count of every change request',
  description:
    'A shared ledger where every change request is logged, marked in or beyond scope, and both sides watch the same number move. Free, browser-local — nothing leaves your browser.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={manrope.variable}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
