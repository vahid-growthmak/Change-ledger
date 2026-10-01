import type { Metadata } from 'next';
import './globals.css';

import { Plus_Jakarta_Sans } from 'next/font/google';

/**
 * One face carries the whole console. Weight and size do the work three
 * families used to: 800 for figures, 600–700 for headings and actions, 500
 * for metadata, 400 for prose. Plus Jakarta Sans is geometric with slightly
 * open counters, which keeps a 34px total legible and an 11px chip readable
 * without a second family being brought in to rescue either.
 */
const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-jakarta',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Change Ledger',
  description: 'The live commercial record shared between Growthmak and the client.',
  robots: { index: false, follow: false }, // A7 — belt and braces alongside middleware
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={jakarta.variable}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
