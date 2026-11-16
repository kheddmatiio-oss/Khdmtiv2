import type { Metadata, Viewport } from 'next';
import { Plus_Jakarta_Sans, IBM_Plex_Sans_Arabic } from 'next/font/google';
import { AppProvider } from '@/lib/store';
import { Toasts } from '@/components/Toasts';
import './globals.css';

// Self-hosted by Next at build time — no render-blocking font request.
// Latin and Arabic each get a face drawn for them; the stack lets the
// browser pick per glyph, so mixed text stays even in both scripts.
const latin = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-latin',
  display: 'swap',
});
const arabic = IBM_Plex_Sans_Arabic({
  subsets: ['arabic'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-arabic',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://khedmti.app'),
  title: { default: 'Khedmti — خدمتي | Work tracking & invoicing for freelancers', template: '%s · Khedmti' },
  description: 'خدمتي: تتبّع خدمتك من الطلب حتى التسليم وابعث فواتيرك بضغطة. Track every project from brief to delivery and invoice it in one tap. For freelancers and teams. 14 days free.',
  applicationName: 'Khedmti',
  keywords: ['Khedmti', 'خدمتي', 'freelancer', 'freelance', 'facture', 'فاتورة', 'invoicing', 'video editor', 'مونتاج', 'فريلانسر'],
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website', url: 'https://khedmti.app', siteName: 'Khedmti — خدمتي',
    title: 'Khedmti — خدمتي',
    description: 'Track every project from brief to delivery, then invoice it in one tap. 14 days free.',
    images: [{ url: '/icon-512.png', width: 512, height: 512, alt: 'Khedmti' }],
  },
  twitter: { card: 'summary', title: 'Khedmti — خدمتي', description: 'Work tracking and invoicing for freelancers.', images: ['/icon-512.png'] },
  manifest: '/manifest.webmanifest',
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F4F7FB' },
    { media: '(prefers-color-scheme: dark)', color: '#0B111A' },
  ],
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" dir="ltr" data-theme="dark" className={`${latin.variable} ${arabic.variable}`} suppressHydrationWarning>
      <body className="antialiased">
        <AppProvider>
          {children}
          <Toasts />
        </AppProvider>
      </body>
    </html>
  );
}
