import type { MetadataRoute } from 'next';

export const dynamic = 'force-static';

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: '工具庫 | 免費線上工具集',
    short_name: 'Smalltools',
    description:
      '免費線上工具庫，包含房貸/信貸計算機、JSON格式化、Base64、密碼生成器、IP計算機等 20+ 精緻實用工具，支援離線使用。',
    start_url: '/',
    display: 'standalone',
    background_color: '#0f172a',
    theme_color: '#0f172a',
    icons: [
      {
        src: '/android-chrome-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/android-chrome-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/android-chrome-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/support.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any',
      },
    ],
    shortcuts: [
      {
        name: '房貸試算機',
        short_name: '房貸試算',
        description: '試算房貸月付額、利息與本息攤提明細',
        url: '/mortgage-loan/',
        icons: [{ src: '/android-chrome-192x192.png', sizes: '192x192' }],
      },
      {
        name: '信貸試算機',
        short_name: '信貸試算',
        description: '信用貸款月付額與開辦費總費用年率 APR 試算',
        url: '/personal-loan/',
        icons: [{ src: '/android-chrome-192x192.png', sizes: '192x192' }],
      },
      {
        name: '全螢幕倒數計時器',
        short_name: '倒數計時',
        description: '極簡現代全螢幕數位時鐘、倒數計時與碼表工具',
        url: '/time/',
        icons: [{ src: '/android-chrome-192x192.png', sizes: '192x192' }],
      },
      {
        name: '安全密碼生成器',
        short_name: '密碼生成',
        description: '快速產生高強度密碼與強度檢測',
        url: '/password/',
        icons: [{ src: '/android-chrome-192x192.png', sizes: '192x192' }],
      },
    ],
  };
}

