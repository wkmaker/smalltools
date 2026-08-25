import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import vm from 'vm';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const translationsFile = path.join(rootDir, 'app', 'og-generator', 'translations.ts');

console.log('========================================');
console.log('🧪 測試 OG 圖片產生器雙語字典 (TRANSLATIONS)');
console.log('========================================\n');

if (!fs.existsSync(translationsFile)) {
  console.error(`❌ [錯誤] 找不到檔案: ${translationsFile}`);
  process.exit(1);
}

const rawTs = fs.readFileSync(translationsFile, 'utf-8');

// 去除 TS 類型註解與 import，轉換為純 JS 執行
const cleanJs = rawTs
  .replace(/import\s+[^;]+;/g, '')
  .replace(/:\s*Record<[^>]+,\s*OgTranslation>/g, '')
  .replace(/export\s+const\s+TRANSLATIONS\s*=/, 'const TRANSLATIONS =') + '\n;TRANSLATIONS;';

let TRANSLATIONS;
try {
  TRANSLATIONS = vm.runInNewContext(cleanJs);
} catch (err) {
  console.error('❌ [解析失敗] 無法評估 TRANSLATIONS 字典內容:', err);
  process.exit(1);
}

let passed = 0;
let total = 0;

function assert(condition, testName, errorDetails = '') {
  total++;
  if (condition) {
    passed++;
    console.log(`✅ [PASS] ${testName}`);
  } else {
    console.error(`❌ [FAIL] ${testName} - ${errorDetails}`);
  }
}

// 1. 測試雙語鍵值存在性
assert(!!TRANSLATIONS['zh-TW'], 'zh-TW 字典必須存在');
assert(!!TRANSLATIONS['en'], 'en 字典必須存在');

const zh = TRANSLATIONS['zh-TW'];
const en = TRANSLATIONS['en'];

// 2. 測試頂層欄位鍵值對稱性
const zhKeys = Object.keys(zh).sort();
const enKeys = Object.keys(en).sort();

const missingInEn = zhKeys.filter((k) => !enKeys.includes(k));
const missingInZh = enKeys.filter((k) => !zhKeys.includes(k));

assert(
  missingInEn.length === 0 && missingInZh.length === 0,
  '中英文頂層欄位鍵值必須完全對稱',
  `英文缺少: [${missingInEn.join(', ')}], 中文缺少: [${missingInZh.join(', ')}]`
);

// 3. 測試 4 大模板定義
const expectedTemplates = ['minimal', 'gradient', 'split', 'impact'];
const zhTemplates = Object.keys(zh.templates || {}).sort();
const enTemplates = Object.keys(en.templates || {}).sort();

assert(
  JSON.stringify(zhTemplates) === JSON.stringify(expectedTemplates.sort()) &&
  JSON.stringify(enTemplates) === JSON.stringify(expectedTemplates.sort()),
  '4 大模板 (minimal, gradient, split, impact) 必須在中英文字典中完整定義',
  `zh: [${zhTemplates.join(', ')}], en: [${enTemplates.join(', ')}]`
);

// 4. 測試 4 大 Presets 定義
const expectedPresets = ['devlog', 'news', 'product', 'tech'];
const zhPresets = Object.keys(zh.presets || {}).sort();
const enPresets = Object.keys(en.presets || {}).sort();

assert(
  JSON.stringify(zhPresets) === JSON.stringify(expectedPresets) &&
  JSON.stringify(enPresets) === JSON.stringify(expectedPresets),
  '4 大範例 Presets (tech, product, devlog, news) 必須完整存在',
  `zh: [${zhPresets.join(', ')}], en: [${enPresets.join(', ')}]`
);

// 5. 測試 FAQ 數量與結構 (必須有 6 組深度 FAQ)
assert(
  Array.isArray(zh.faqItems) && zh.faqItems.length === 6,
  'zh-TW FAQ 項目必須正好為 6 組深度 FAQ',
  `實際數量: ${zh.faqItems?.length}`
);

assert(
  Array.isArray(en.faqItems) && en.faqItems.length === 6,
  'en FAQ 項目必須正好為 6 組深度 FAQ',
  `實際數量: ${en.faqItems?.length}`
);

// 6. 檢查 FAQ 內容完整性 (q 與 a 不得為空字串)
let allFaqValid = true;
['zh-TW', 'en'].forEach((langKey) => {
  const items = TRANSLATIONS[langKey].faqItems || [];
  items.forEach((item, index) => {
    if (!item.q || !item.a || typeof item.q !== 'string' || typeof item.a !== 'string') {
      allFaqValid = false;
      console.error(`   [${langKey}] FAQ #${index + 1} 格式無效或內容為空`);
    }
  });
});

assert(allFaqValid, '所有 FAQ 項目之問題 (q) 與回答 (a) 皆不得為空且格式正確');

// 7. 檢查所有文字控制項欄位非空
let allFieldsFilled = true;
[zh, en].forEach((dict) => {
  for (const [key, val] of Object.entries(dict)) {
    if (key === 'faqItems' || key === 'templates' || key === 'presets') continue;
    if (typeof val !== 'string' || val.trim().length === 0) {
      allFieldsFilled = false;
      console.error(`   欄位 ${key} 未填寫或為空`);
    }
  }
});

assert(allFieldsFilled, '所有 UI 控制項與文案標籤皆非空');

console.log('\n----------------------------------------');
console.log(`📊 測試結果彙整: 通過 ${passed} / ${total} 項測試 (${Math.round((passed / total) * 100)}%)`);
console.log('----------------------------------------\n');

if (passed !== total) {
  process.exit(1);
}
