import type { Metadata } from 'next';
import { Cormorant_Garamond, Jost, Instrument_Sans } from 'next/font/google';
import CustomCursor from '@/components/CustomCursor';
import './globals.css';

const cormorantGaramond = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-cormorant-garamond',
});

const jost = Jost({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  variable: '--font-jost',
});

const instrumentSans = Instrument_Sans({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-instrument-sans',
});

export const metadata: Metadata = {
  title: 'Kōsh — Private Kitchen · Sadashivanagar, Bengaluru',
  description: 'Precision-built meals for 40 members. Delivered in your personalised vessel, every morning. No plastic. No repetition. Bengaluru.',
  keywords: ['Kōsh Onboarding', 'personalized meals', 'nutritional coaching', 'diet program', 'client onboarding', 'bespoke culinary delivery', 'Sadashivanagar', 'Bengaluru'],
  authors: [{ name: 'Kōsh Team' }],
  openGraph: {
    title: 'Kōsh — Private Kitchen · Sadashivanagar, Bengaluru',
    description: 'Precision-built meals for 40 members. Delivered in your personalised vessel, every morning. No plastic. No repetition. Bengaluru.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${cormorantGaramond.variable} ${jost.variable} ${instrumentSans.variable}`} data-scroll-behavior="smooth">
      <body>
        <CustomCursor />
        {/* Grain overlay for paper effect */}
        <div className="grain" aria-hidden="true" />
        {children}
      </body>
    </html>
  );
}
