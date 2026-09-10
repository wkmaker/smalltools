import type { MetadataRoute } from 'next';
import { ALL_TOOLS } from './config/tools';
import milestoneData from './hourly-rate-calculator/config/percentile_milestones.json';

export const dynamic = 'force-static';

const BASE_URL = 'https://tools.cjkuo.net';

// 靜態匯出（force-static）時於建置當下取值，每次部署自動刷新，不再手工維護日期。
const LAST_MODIFIED = new Date();

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/`, lastModified: LAST_MODIFIED, changeFrequency: 'monthly', priority: 1.0 },
    { url: `${BASE_URL}/en/`, lastModified: LAST_MODIFIED, changeFrequency: 'monthly', priority: 1.0 },
  ];

  // 工具頁一律由中央註冊表 app/config/tools.tsx 推導，新增工具無需再改本檔。
  for (const tool of ALL_TOOLS) {
    entries.push(
      { url: `${BASE_URL}${tool.href}`, lastModified: LAST_MODIFIED, changeFrequency: 'monthly', priority: 0.8 },
      { url: `${BASE_URL}${tool.hrefEn}`, lastModified: LAST_MODIFIED, changeFrequency: 'monthly', priority: 0.8 },
    );
  }

  // 時薪計算機百分位里程碑排行頁（雙語）
  for (const m of milestoneData) {
    const prCode = `pr${m.pr < 10 ? '0' + m.pr : m.pr}`;
    entries.push(
      {
        url: `${BASE_URL}/hourly-rate-calculator/rank/${prCode}/`,
        lastModified: LAST_MODIFIED,
        changeFrequency: 'monthly',
        priority: 0.6,
      },
      {
        url: `${BASE_URL}/hourly-rate-calculator/en/rank/${prCode}/`,
        lastModified: LAST_MODIFIED,
        changeFrequency: 'monthly',
        priority: 0.6,
      },
    );
  }

  return entries;
}
