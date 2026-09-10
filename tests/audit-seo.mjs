import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const appDir = path.join(rootDir, 'app');

console.log('========================================');
console.log('🔍 Smalltools 全面 SEO 深度健康檢查');
console.log('========================================\n');

// 1. 取得所有 tool 目錄
const toolDirs = fs.readdirSync(appDir).filter(f => {
  const stat = fs.statSync(path.join(appDir, f));
  return stat.isDirectory() && !['components', 'config', 'utils', 'en', 'tests'].includes(f);
});

console.log(`📦 偵測到 ${toolDirs.length} 個主要工具模組\n`);

const issues = [];

// 2. 檢查 sitemap.ts 涵蓋率
// sitemap.ts 已改為由中央註冊表 app/config/tools.tsx 推導，故此處改驗「工具是否登記於註冊表」與「sitemap 確實引用註冊表」。
const sitemapContent = fs.readFileSync(path.join(appDir, 'sitemap.ts'), 'utf-8');
const toolsRegistry = fs.readFileSync(path.join(appDir, 'config', 'tools.tsx'), 'utf-8');

const sitemapUsesRegistry =
  /from '\.\/config\/tools'/.test(sitemapContent) &&
  (sitemapContent.includes('ALL_TOOLS') || sitemapContent.includes('CATEGORIES'));

if (!sitemapUsesRegistry) {
  issues.push({
    type: 'SITEMAP',
    severity: 'HIGH',
    message: `sitemap.ts 未由中央註冊表 app/config/tools.tsx 推導工具清單（應 import ALL_TOOLS / CATEGORIES）`,
  });
}

toolDirs.forEach(tool => {
  const hasPage = fs.existsSync(path.join(appDir, tool, 'page.tsx'));
  if (!hasPage) return;
  const registered =
    toolsRegistry.includes(`'/${tool}/'`) || toolsRegistry.includes(`"/${tool}/"`);
  if (!registered) {
    issues.push({
      type: 'SITEMAP',
      severity: 'HIGH',
      message: `工具 ${tool} 未登記於 app/config/tools.tsx，sitemap 與首頁將同時遺漏`,
    });
  }
});

// 檢查 rank 頁面在 sitemap 的英文版
let hasEnRankInSitemap = sitemapContent.includes('/hourly-rate-calculator/en/rank/');
if (!hasEnRankInSitemap) {
  issues.push({
    type: 'SITEMAP',
    severity: 'MEDIUM',
    message: `sitemap.ts 缺少 /hourly-rate-calculator/en/rank/{slug}/ 的英文動態 PR 路由！`
  });
}

// 3. 檢查每個工具的 page.tsx 及 en/page.tsx
toolDirs.forEach(tool => {
  ['zh', 'en'].forEach(lang => {
    const pagePath = lang === 'zh' 
      ? path.join(appDir, tool, 'page.tsx')
      : path.join(appDir, tool, 'en', 'page.tsx');

    const relPath = path.relative(rootDir, pagePath);

    if (!fs.existsSync(pagePath)) {
      issues.push({ type: 'FILE', severity: 'CRITICAL', message: `缺少檔案: ${relPath}` });
      return;
    }

    const content = fs.readFileSync(pagePath, 'utf-8');

    // 檢查 metadata
    if (!content.includes('metadata: Metadata') && !content.includes('generateMetadata')) {
      issues.push({ type: 'METADATA', severity: 'HIGH', message: `${relPath} 未導出 metadata 或 generateMetadata` });
    }

    // 檢查 title
    if (!content.includes('title:')) {
      issues.push({ type: 'TITLE', severity: 'HIGH', message: `${relPath} metadata 缺少 title` });
    }

    // 檢查 description
    if (!content.includes('description:')) {
      issues.push({ type: 'DESCRIPTION', severity: 'HIGH', message: `${relPath} metadata 缺少 description` });
    }

    // 檢查 canonical
    if (!content.includes('canonical:')) {
      issues.push({ type: 'CANONICAL', severity: 'HIGH', message: `${relPath} metadata 缺少 alternates.canonical` });
    }

    // 檢查 alternates languages (hreflang)
    if (!content.includes('languages:')) {
      issues.push({ type: 'HREFLANG', severity: 'MEDIUM', message: `${relPath} metadata 缺少 alternates.languages (hreflang 標籤)` });
    }

    // 檢查 openGraph
    if (!content.includes('openGraph:')) {
      issues.push({ type: 'OG', severity: 'MEDIUM', message: `${relPath} metadata 缺少 openGraph 設定` });
    }

    // 檢查 twitter
    if (!content.includes('twitter:')) {
      issues.push({ type: 'TWITTER', severity: 'LOW', message: `${relPath} metadata 缺少 twitter 卡片設定` });
    }

    // 檢查 Structured Data (JSON-LD)
    if (!content.includes('application/ld+json')) {
      issues.push({ type: 'SCHEMA', severity: 'MEDIUM', message: `${relPath} 缺少 application/ld+json 結構化資料` });
    }

    // 檢查 FAQ 結構化資料
    if (content.includes('FaqSection') && !content.includes('faqJsonLd') && !content.includes('FAQPage') && !content.includes('generateFaqSchema')) {
      issues.push({ type: 'FAQ_SCHEMA', severity: 'MEDIUM', message: `${relPath} 有渲染 FAQSection 但未注入 FAQPage Schema (JSON-LD)` });
    }
  });
});

// 4. 檢查首頁 (zh, en)
['app/page.tsx', 'app/en/page.tsx'].forEach(homeRel => {
  const p = path.join(rootDir, homeRel);
  if (fs.existsSync(p)) {
    const content = fs.readFileSync(p, 'utf-8');
    if (!content.includes('canonical:')) {
      issues.push({ type: 'CANONICAL', severity: 'HIGH', message: `${homeRel} 缺少 canonical` });
    }
    if (!content.includes('languages:')) {
      issues.push({ type: 'HREFLANG', severity: 'MEDIUM', message: `${homeRel} 缺少 hreflang alternates` });
    }
    if (!content.includes('application/ld+json')) {
      issues.push({ type: 'SCHEMA', severity: 'MEDIUM', message: `${homeRel} 缺少 WebSite Schema` });
    }
  }
});

// 5. 輸出報告
console.log('----------------------------------------');
console.log(`📊 檢查結果彙整 (共發現 ${issues.length} 個待優化/關注項目)：`);
console.log('----------------------------------------\n');

const severityOrder = { CRITICAL: 1, HIGH: 2, MEDIUM: 3, LOW: 4 };
issues.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

issues.forEach((item, idx) => {
  const icon = item.severity === 'CRITICAL' ? '⛔' : item.severity === 'HIGH' ? '❌' : item.severity === 'MEDIUM' ? '⚠️' : 'ℹ️';
  console.log(`${idx + 1}. [${item.severity}] ${icon} [${item.type}] ${item.message}`);
});

console.log('\n========================================\n');
