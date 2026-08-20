import type { MetadataRoute } from 'next';
import milestoneData from './hourly-rate-calculator/config/percentile_milestones.json';

export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://tools.cjkuo.net';

  const pages: Array<{
    url: string;
    lastModified: string;
    changeFrequency: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
    priority: number;
  }> = [
    { url: '/', lastModified: '2026-07-28', changeFrequency: 'monthly', priority: 1.0 },
    { url: '/time/', lastModified: '2026-07-28', changeFrequency: 'monthly', priority: 0.8 },
    { url: '/time/en/', lastModified: '2026-07-30', changeFrequency: 'monthly', priority: 0.8 },
    { url: '/compound-interest/', lastModified: '2026-08-14', changeFrequency: 'monthly', priority: 0.8 },
    { url: '/compound-interest/en/', lastModified: '2026-08-14', changeFrequency: 'monthly', priority: 0.8 },
    { url: '/personal-loan/', lastModified: '2026-07-28', changeFrequency: 'monthly', priority: 0.8 },
    { url: '/personal-loan/en/', lastModified: '2026-08-11', changeFrequency: 'monthly', priority: 0.8 },
    { url: '/car-loan/', lastModified: '2026-07-28', changeFrequency: 'monthly', priority: 0.8 },
    { url: '/car-loan/en/', lastModified: '2026-08-11', changeFrequency: 'monthly', priority: 0.8 },
    { url: '/mortgage-loan/', lastModified: '2026-07-28', changeFrequency: 'monthly', priority: 0.8 },
    { url: '/mortgage-loan/en/', lastModified: '2026-08-11', changeFrequency: 'monthly', priority: 0.8 },
    { url: '/base64/', lastModified: '2026-07-28', changeFrequency: 'monthly', priority: 0.8 },
    { url: '/base64/en/', lastModified: '2026-07-29', changeFrequency: 'monthly', priority: 0.8 },
    { url: '/url/', lastModified: '2026-07-28', changeFrequency: 'monthly', priority: 0.8 },
    { url: '/url/en/', lastModified: '2026-07-29', changeFrequency: 'monthly', priority: 0.8 },
    { url: '/password/', lastModified: '2026-08-14', changeFrequency: 'monthly', priority: 0.8 },
    { url: '/password/en/', lastModified: '2026-08-14', changeFrequency: 'monthly', priority: 0.8 },
    { url: '/epoch/', lastModified: '2026-07-28', changeFrequency: 'monthly', priority: 0.8 },
    { url: '/epoch/en/', lastModified: '2026-07-30', changeFrequency: 'monthly', priority: 0.8 },
    { url: '/json/', lastModified: '2026-07-28', changeFrequency: 'monthly', priority: 0.8 },
    { url: '/json/en/', lastModified: '2026-07-29', changeFrequency: 'monthly', priority: 0.8 },
    { url: '/pledge-calculator/', lastModified: '2026-08-13', changeFrequency: 'monthly', priority: 0.8 },
    { url: '/pledge-calculator/en/', lastModified: '2026-08-13', changeFrequency: 'monthly', priority: 0.8 },
    { url: '/futures-calculator/', lastModified: '2026-08-13', changeFrequency: 'monthly', priority: 0.8 },
    { url: '/futures-calculator/en/', lastModified: '2026-08-13', changeFrequency: 'monthly', priority: 0.8 },
    { url: '/dns-dig/', lastModified: '2026-08-13', changeFrequency: 'monthly', priority: 0.8 },
    { url: '/dns-dig/en/', lastModified: '2026-08-13', changeFrequency: 'monthly', priority: 0.8 },
    { url: '/text-utility/', lastModified: '2026-07-28', changeFrequency: 'monthly', priority: 0.8 },
    { url: '/text-utility/en/', lastModified: '2026-07-30', changeFrequency: 'monthly', priority: 0.8 },
    { url: '/qr-generator/', lastModified: '2026-08-13', changeFrequency: 'monthly', priority: 0.8 },
    { url: '/qr-generator/en/', lastModified: '2026-08-13', changeFrequency: 'monthly', priority: 0.8 },
    { url: '/ip-detector/', lastModified: '2026-07-28', changeFrequency: 'monthly', priority: 0.8 },
    { url: '/ip-detector/en/', lastModified: '2026-07-30', changeFrequency: 'monthly', priority: 0.8 },
    { url: '/ssl-converter/', lastModified: '2026-08-14', changeFrequency: 'monthly', priority: 0.8 },
    { url: '/ssl-converter/en/', lastModified: '2026-08-14', changeFrequency: 'monthly', priority: 0.8 },
    { url: '/diff-checker/', lastModified: '2026-07-28', changeFrequency: 'monthly', priority: 0.8 },
    { url: '/diff-checker/en/', lastModified: '2026-07-30', changeFrequency: 'monthly', priority: 0.8 },
    { url: '/image-processor/', lastModified: '2026-07-28', changeFrequency: 'monthly', priority: 0.8 },
    { url: '/image-processor/en/', lastModified: '2026-07-30', changeFrequency: 'monthly', priority: 0.8 },
    { url: '/my-salary-calculator/', lastModified: '2026-07-28', changeFrequency: 'monthly', priority: 0.8 },
    { url: '/my-salary-calculator/en/', lastModified: '2026-07-29', changeFrequency: 'monthly', priority: 0.8 },
    { url: '/lucky-wheel/', lastModified: '2026-08-20', changeFrequency: 'monthly', priority: 0.8 },
    { url: '/lucky-wheel/en/', lastModified: '2026-08-20', changeFrequency: 'monthly', priority: 0.8 },
    { url: '/pdf-processor/', lastModified: '2026-08-20', changeFrequency: 'monthly', priority: 0.8 },
    { url: '/pdf-processor/en/', lastModified: '2026-08-20', changeFrequency: 'monthly', priority: 0.8 },
    { url: '/pdf-compressor/', lastModified: '2026-08-20', changeFrequency: 'monthly', priority: 0.8 },
    { url: '/pdf-compressor/en/', lastModified: '2026-08-20', changeFrequency: 'monthly', priority: 0.8 },
    { url: '/https-dns-generator/', lastModified: '2026-07-28', changeFrequency: 'monthly', priority: 0.8 },
    { url: '/https-dns-generator/en/', lastModified: '2026-07-28', changeFrequency: 'monthly', priority: 0.8 },
    { url: '/ip-calculator/', lastModified: '2026-08-20', changeFrequency: 'monthly', priority: 0.8 },
    { url: '/ip-calculator/en/', lastModified: '2026-08-20', changeFrequency: 'monthly', priority: 0.8 },
    { url: '/resignation-calculator/', lastModified: '2026-08-13', changeFrequency: 'monthly', priority: 0.8 },
    { url: '/resignation-calculator/en/', lastModified: '2026-08-13', changeFrequency: 'monthly', priority: 0.8 },
    { url: '/hourly-rate-calculator/', lastModified: '2026-08-01', changeFrequency: 'monthly', priority: 0.8 },
    { url: '/hourly-rate-calculator/en/', lastModified: '2026-08-11', changeFrequency: 'monthly', priority: 0.8 },
    { url: '/liars-dice/', lastModified: '2026-08-20', changeFrequency: 'monthly', priority: 0.8 },
    { url: '/liars-dice/en/', lastModified: '2026-08-20', changeFrequency: 'monthly', priority: 0.8 },
    { url: '/pregnancy-calculator/', lastModified: '2026-08-20', changeFrequency: 'monthly', priority: 0.8 },
    { url: '/pregnancy-calculator/en/', lastModified: '2026-08-20', changeFrequency: 'monthly', priority: 0.8 },
  ];

  milestoneData.forEach((m) => {
    const prCode = `pr${m.pr < 10 ? '0' + m.pr : m.pr}`;
    pages.push({
      url: `/hourly-rate-calculator/rank/${prCode}/`,
      lastModified: '2026-08-02',
      changeFrequency: 'monthly',
      priority: 0.6,
    });
  });

  return pages.map((page) => ({
    url: `${baseUrl}${page.url}`,
    lastModified: new Date(page.lastModified),
    changeFrequency: page.changeFrequency,
    priority: page.priority,
  }));
}
