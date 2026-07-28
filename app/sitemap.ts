import type { MetadataRoute } from 'next';

export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://tools.cjkuo.net';

  const pages: Array<{
    url: string;
    lastModified: string;
    changeFrequency: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
    priority: number;
  }> = [
    { url: '/', lastModified: '2026-07-21', changeFrequency: 'monthly', priority: 1.0 },
    { url: '/time/', lastModified: '2026-07-21', changeFrequency: 'monthly', priority: 0.8 },
    { url: '/compound-interest/', lastModified: '2026-07-21', changeFrequency: 'monthly', priority: 0.8 },
    { url: '/personal-loan/', lastModified: '2026-07-21', changeFrequency: 'monthly', priority: 0.8 },
    { url: '/car-loan/', lastModified: '2026-07-21', changeFrequency: 'monthly', priority: 0.8 },
    { url: '/mortgage-loan/', lastModified: '2026-07-21', changeFrequency: 'monthly', priority: 0.8 },
    { url: '/base64/', lastModified: '2026-07-21', changeFrequency: 'monthly', priority: 0.8 },
    { url: '/url/', lastModified: '2026-07-21', changeFrequency: 'monthly', priority: 0.8 },
    { url: '/password/', lastModified: '2026-07-21', changeFrequency: 'monthly', priority: 0.8 },
    { url: '/epoch/', lastModified: '2026-07-21', changeFrequency: 'monthly', priority: 0.8 },
    { url: '/json/', lastModified: '2026-07-21', changeFrequency: 'monthly', priority: 0.8 },
    { url: '/pledge-calculator/', lastModified: '2026-07-21', changeFrequency: 'monthly', priority: 0.8 },
    { url: '/futures-calculator/', lastModified: '2026-07-21', changeFrequency: 'monthly', priority: 0.8 },
    { url: '/dns-dig/', lastModified: '2026-07-21', changeFrequency: 'monthly', priority: 0.8 },
    { url: '/text-utility/', lastModified: '2026-07-21', changeFrequency: 'monthly', priority: 0.8 },
    { url: '/qr-generator/', lastModified: '2026-07-21', changeFrequency: 'monthly', priority: 0.8 },
    { url: '/ip-detector/', lastModified: '2026-07-21', changeFrequency: 'monthly', priority: 0.8 },
    { url: '/ssl-converter/', lastModified: '2026-07-21', changeFrequency: 'monthly', priority: 0.8 },
    { url: '/diff-checker/', lastModified: '2026-07-21', changeFrequency: 'monthly', priority: 0.8 },
    { url: '/image-processor/', lastModified: '2026-07-21', changeFrequency: 'monthly', priority: 0.8 },
    { url: '/my-salary-calculator/', lastModified: '2026-07-21', changeFrequency: 'monthly', priority: 0.8 },
    { url: '/lucky-wheel/', lastModified: '2026-07-21', changeFrequency: 'monthly', priority: 0.8 },
    { url: '/pdf-processor/', lastModified: '2026-07-21', changeFrequency: 'monthly', priority: 0.8 },
    { url: '/pdf-compressor/', lastModified: '2026-07-21', changeFrequency: 'monthly', priority: 0.8 },
    { url: '/https-dns-generator/', lastModified: '2026-07-22', changeFrequency: 'monthly', priority: 0.8 },
    { url: '/https-dns-generator/en/', lastModified: '2026-07-22', changeFrequency: 'monthly', priority: 0.8 },
    { url: '/ip-calculator/', lastModified: '2026-07-23', changeFrequency: 'monthly', priority: 0.8 },
  ];

  return pages.map((page) => ({
    url: `${baseUrl}${page.url}`,
    lastModified: new Date(page.lastModified),
    changeFrequency: page.changeFrequency,
    priority: page.priority,
  }));
}
