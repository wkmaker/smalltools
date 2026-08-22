const fs = require('fs');
const path = require('path');

const dirs = fs.readdirSync(path.join(process.cwd(), 'app'), { withFileTypes: true })
  .filter(d => d.isDirectory() && !['components', 'utils', 'rank', 'api'].includes(d.name))
  .map(d => d.name);

let total = 0;
let passed = 0;

dirs.forEach(tool => {
  const dir = path.join(process.cwd(), 'app', tool);
  const pagePath = path.join(dir, 'page.tsx');
  if (!fs.existsSync(pagePath)) return;

  total++;
  const page = fs.readFileSync(pagePath, 'utf8');
  const enPagePath = path.join(dir, 'en', 'page.tsx');
  const enPage = fs.existsSync(enPagePath) ? fs.readFileSync(enPagePath, 'utf8') : null;
  const files = fs.readdirSync(dir);
  const clientFile = files.find(f => f.endsWith('Client.tsx'));
  const client = clientFile ? fs.readFileSync(path.join(dir, clientFile), 'utf8') : null;

  const hasPageFaq = page.includes('FAQPage') || page.includes('generateFaqSchema');
  const hasEnPageFaq = enPage ? (enPage.includes('FAQPage') || enPage.includes('generateFaqSchema')) : true;
  const hasClientFaq = client ? (client.includes('FaqSection') || client.includes('faqItems')) : true;

  const ok = hasPageFaq && hasEnPageFaq && hasClientFaq;
  if (ok) passed++;
  console.log(`[${ok ? 'OK' : 'FAIL'}] ${tool.padEnd(26)} | page: ${hasPageFaq ? 'YES' : 'NO '} | enPage: ${hasEnPageFaq ? 'YES' : 'NO '} | client: ${hasClientFaq ? 'YES' : 'NO '}`);
});

console.log(`\nResults: ${passed} / ${total} tools completed (${Math.round((passed / total) * 100)}%)`);
