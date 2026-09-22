import type { Metadata } from 'next';
import './globals.css';

import { Archivo, Archivo_Narrow, Courier_Prime } from 'next/font/google';

/**
 * A form prints its labels and is written into. Archivo sets the prose,
 * Archivo Narrow the pre-printed labels, and Courier Prime every value that
 * was measured, counted or machine-assigned. The split is the type system,
 * not a texture — request titles are Archivo because a person wrote them,
 * request refs are Courier because the system assigned them.
 */
const archivo = Archivo({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-archivo',
  display: 'swap',
});

const archivoNarrow = Archivo_Narrow({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-archivo-narrow',
  display: 'swap',
});

const courier = Courier_Prime({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-courier-prime',
  display: 'swap',
});

const fontVars = `${archivo.variable} ${archivoNarrow.variable} ${courier.variable}`;

export const metadata: Metadata = {
  title: 'Change Ledger',
  description: 'The live commercial record shared between Growthmak and the client.',
  robots: { index: false, follow: false }, // A7 — belt and braces alongside middleware
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={fontVars}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
