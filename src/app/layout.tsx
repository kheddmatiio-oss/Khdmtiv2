import type { Metadata, Viewport } from 'next';
import { Tajawal } from 'next/font/google';
import { AppProvider } from '@/lib/store';
import { Toasts } from '@/components/Toasts';
import './globals.css';

// Self-hosted by Next at build time — no render-blocking font request.
const tajawal = Tajawal({
  subsets: ['arabic', 'latin'],
  weight: ['400', '500', '700', '800', '900'],
  variable: '--font-tajawal',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Khedmti — خدمتي',
  description: 'Work tracking, tasks and invoicing for freelancers, video editors and marketing agencies.',
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
    <html lang="ar" dir="rtl" data-theme="dark" suppressHydrationWarning>
      <body className={`${tajawal.variable} antialiased`}>
        <AppProvider>
          {children}
          <Toasts />
        </AppProvider>
      </body>
    </html>
  );
}
