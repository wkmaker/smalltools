import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import vm from 'vm';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const constantsFile = path.join(rootDir, 'app', 'og-generator', 'constants.ts');

console.log('========================================');
console.log('🧪 測試 OG 圖片產生器常數 (CONSTANTS)');
console.log('========================================\n');

if (!fs.existsSync(constantsFile)) {
  console.error(`❌ [錯誤] 找不到檔案: ${constantsFile}`);
  process.exit(1);
}

const rawTs = fs.readFileSync(constantsFile, 'utf-8');

// 去除 TS 類型與 import
const cleanJs = rawTs
  .replace(/import\s+[^;]+;/g, '')
  .replace(/:\s*PresetColor\[\]/g, '')
  .replace(/:\s*PresetIcon\[\]/g, '')
  .replace(/:\s*Record<[^>]+>/g, '')
  .replace(/export\s+const\s+/g, 'const ') +
  '\n;({ PRESET_COLORS, PRESET_ICONS, RATIO_DIMENSIONS });';

let constants;
try {
  constants = vm.runInNewContext(cleanJs);
} catch (err) {
  console.error('❌ [解析失敗] 無法評估 constants 檔案內容:', err);
  process.exit(1);
}

const { PRESET_COLORS, PRESET_ICONS, RATIO_DIMENSIONS } = constants;

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

// 1. 測試 PRESET_COLORS 常數
assert(
  Array.isArray(PRESET_COLORS) && PRESET_COLORS.length >= 6,
  'PRESET_COLORS 必須為陣列且至少包含 6 組配色',
  `實際長度: ${PRESET_COLORS?.length}`
);

const hexColorRegex = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
let allColorsValid = true;
PRESET_COLORS.forEach((color, idx) => {
  if (
    !color.id ||
    !color.name ||
    !color.nameZh ||
    !hexColorRegex.test(color.color1) ||
    !hexColorRegex.test(color.color2) ||
    !hexColorRegex.test(color.lightColor1) ||
    !hexColorRegex.test(color.lightColor2) ||
    !hexColorRegex.test(color.accent)
  ) {
    allColorsValid = false;
    console.error(`   PRESET_COLORS[${idx}] 格式錯誤:`, color);
  }
});
assert(allColorsValid, 'PRESET_COLORS 每一組均包含合法之 id, name, nameZh, color1, color2, lightColor1, lightColor2 與 accent 十六進位色碼');

const expectedColorIds = ['slate', 'cyber', 'emerald', 'sunset', 'amber', 'sky'];
const actualColorIds = (PRESET_COLORS || []).map((c) => c.id);
assert(
  expectedColorIds.every((id) => actualColorIds.includes(id)),
  'PRESET_COLORS 必須精確包含 slate, cyber, emerald, sunset, amber, sky 6 大主題配色',
  `實際包含: [${actualColorIds.join(', ')}]`
);

// 2. 測試 PRESET_ICONS 常數
assert(
  Array.isArray(PRESET_ICONS) && PRESET_ICONS.length >= 6,
  'PRESET_ICONS 必須為陣列且至少包含 6 組精選圖示',
  `實際長度: ${PRESET_ICONS?.length}`
);

let allIconsValid = true;
PRESET_ICONS.forEach((icon, idx) => {
  if (!icon.id || !icon.label || !icon.path || typeof icon.path !== 'string' || icon.path.length < 10) {
    allIconsValid = false;
    console.error(`   PRESET_ICONS[${idx}] 圖示路徑無效:`, icon);
  }
});
assert(allIconsValid, 'PRESET_ICONS 每一項皆具備正確的 id, label 與 SVG path 資料');

// 3. 測試 RATIO_DIMENSIONS 完整性
const expectedRatios = ['og', 'twitter', 'square', 'story', 'linkedin'];
const actualRatios = Object.keys(RATIO_DIMENSIONS || {}).sort();

assert(
  JSON.stringify(actualRatios) === JSON.stringify(expectedRatios.sort()),
  'RATIO_DIMENSIONS 必須精確支援 5 大長寬比 (og, twitter, square, story, linkedin)',
  `實際定義: [${actualRatios.join(', ')}]`
);

// 4. 測試各長寬比之解析度規格
assert(
  RATIO_DIMENSIONS.og.width === 1200 && RATIO_DIMENSIONS.og.height === 630,
  'Open Graph (og) 尺寸必須為 1200 x 630'
);

assert(
  RATIO_DIMENSIONS.twitter.width === 1200 && RATIO_DIMENSIONS.twitter.height === 675,
  'Twitter Card 尺寸必須為 1200 x 675 (16:9)'
);

assert(
  RATIO_DIMENSIONS.square.width === 1080 && RATIO_DIMENSIONS.square.height === 1080,
  'Square 尺寸必須為 1080 x 1080 (1:1)'
);

assert(
  RATIO_DIMENSIONS.story.width === 1080 && RATIO_DIMENSIONS.story.height === 1920,
  'Stories / Mobile 尺寸必須為 1080 x 1920 (9:16)'
);

assert(
  RATIO_DIMENSIONS.linkedin.width === 1200 && RATIO_DIMENSIONS.linkedin.height === 627,
  'LinkedIn Post 尺寸必須為 1200 x 627'
);

console.log('\n----------------------------------------');
console.log(`📊 測試結果彙整: 通過 ${passed} / ${total} 項測試 (${Math.round((passed / total) * 100)}%)`);
console.log('----------------------------------------\n');

if (passed !== total) {
  process.exit(1);
}
