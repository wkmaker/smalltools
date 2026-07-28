import type { MetadataRoute } from 'next';

export const dynamic = 'force-static';

export default function manifest(): MetadataRoute.Manifest {
  return {
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
        src: '/support.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any',
      },
    ],
  };
}

