import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'GrowEasy AI CSV Importer | Intelligent CRM Data Import',
  description:
    'Upload any CSV file and let AI intelligently map your data to GrowEasy CRM format. Supports Facebook leads, Google Ads exports, and custom spreadsheets.',
  keywords: 'CSV importer, CRM, AI, GrowEasy, lead import, data mapping',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#294744" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body>{children}</body>
    </html>
  );
}
