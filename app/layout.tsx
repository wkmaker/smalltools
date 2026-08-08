import type { Metadata, Viewport } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import ParticleCanvas from '@/components/ParticleCanvas';
import ServiceWorkerRegister from '@/components/ServiceWorkerRegister';
import { ThemeProvider } from '@/components/ThemeProvider';

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '700'],
  variable: '--font-inter',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-jetbrains',
  display: 'swap',
});

const BASE_URL = 'https://tools.cjkuo.net';

export const viewport: Viewport = {
  themeColor: '#0f172a',
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  alternates: {
    canonical: 'https://tools.cjkuo.net/',
  },
  title: {
    default: '工具庫 | 免費線上工具集 - 房貸/信貸/JSON/圖片/密碼/SSL 計算機',
    template: '%s | 工具庫 - tools.cjkuo.net',
  },
  description:
    '免費線上工具庫，包含房貸計算機、信貸計算機、JSON格式化、Base64編碼解碼、SSL憑證轉換、密碼生成器、圖片壓縮裁切等 20+ 精緻實用工具，無廣告、免下載。',
  keywords:
    '免費線上工具,房貸計算機,信貸計算機,JSON格式化,Base64編碼,SSL憑證轉換,密碼生成器,圖片壓縮,台股期貨,複利計算機,薪資計算機',
  authors: [{ name: 'CJKuo' }],
  robots: 'index, follow',
  openGraph: {
    type: 'website',
    siteName: '工具庫',
    locale: 'zh_TW',
    images: [
      {
        url: '/img/StockSnap_00F7DB5857.webp',
        width: 1200,
        height: 630,
        alt: '工具庫 - 免費線上工具集',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: '工具庫 | 免費線上工具集 - 20+ 精緻實用工具',
    description:
      '免費線上工具庫，包含房貸計算機、信貸計算機、JSON格式化、Base64編碼解碼、SSL憑證轉換、密碼生成器、圖片壓縮裁切等 20+ 精緻實用工具，無廣告、免下載。',
    images: ['/img/StockSnap_00F7DB5857.webp'],
  },
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/support.svg', type: 'image/svg+xml' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
};

const themeScript = `
  (function() {
    try {
      var saved = localStorage.getItem('theme');
      var theme = saved ? saved : 'dark';
      document.documentElement.setAttribute('data-theme', theme);
      if (theme === 'light') {
        document.documentElement.classList.add('light');
      } else {
        document.documentElement.classList.remove('light');
      }
    } catch (e) {}
  })();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-TW" className={`${inter.variable} ${jetbrainsMono.variable}`} suppressHydrationWarning>
      <head>
        <script suppressHydrationWarning dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <ThemeProvider>
          {/* 全站粒子背景動效 */}
          <ParticleCanvas />
          <ServiceWorkerRegister />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}

