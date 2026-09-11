import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// 稽核腳本（非阻斷）：掃描 app/ 與 components/ 下所有 <button>，
// 找出「看起來沒有可訪問名稱」的候選項目（無文字子節點、無 aria-label / aria-labelledby / title、
// SVG 內也無 <title>），供人工複查後決定是否補上 aria-label（規範 17）。
// 目前刻意不接入 npm run test / prebuild，等候人工確認候選清單的誤判率後再評估是否納入硬性關卡。

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const scanDirs = ['app', 'components'].map((d) => path.join(rootDir, d));

function getAllTsxFiles(dir) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  for (const file of fs.readdirSync(dir)) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      if (!file.startsWith('.') && file !== 'node_modules') {
        results = results.concat(getAllTsxFiles(filePath));
      }
    } else if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
      results.push(filePath);
    }
  }
  return results;
}

// 保守地把 JSX 標籤拿掉，只留下純文字節點；
// {expression} 一律視為「可能是文字」（換成佔位字元 X 讓 hasVisibleText 判為真），
// 寧可漏抓也不要把「其實有文字，只是用變數/i18n key 帶入」的按鈕誤判成純圖示。
function stripJsxToText(inner) {
  return inner
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
    .replace(/\{[\s\S]*?\}/g, ' X ')
    .replace(/<[^>]+>/g, ' ');
}

function hasVisibleText(str) {
  return /[A-Za-z一-鿿]/.test(str);
}

const buttonBlockRegex = /<button\b([^>]*)>([\s\S]*?)<\/button>/g;
const candidates = [];

for (const dir of scanDirs) {
  for (const filePath of getAllTsxFiles(dir)) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const relPath = path.relative(rootDir, filePath);

    let match;
    buttonBlockRegex.lastIndex = 0;
    while ((match = buttonBlockRegex.exec(content)) !== null) {
      const [fullMatch, attrs, inner] = match;
      const hasAccessibleAttr = /\b(aria-label|aria-labelledby|title)\s*=/.test(attrs);
      const hasSvgTitle = /<title[\s>]/.test(inner);
      const text = stripJsxToText(inner);

      if (!hasAccessibleAttr && !hasSvgTitle && !hasVisibleText(text)) {
        const lineNumber = content.slice(0, match.index).split('\n').length;
        candidates.push({ relPath, lineNumber, snippet: fullMatch.split('\n')[0].slice(0, 80) });
      }
    }
  }
}

console.log('========================================');
console.log('🔍 圖示型按鈕 aria-label 覆蓋率稽核（規範 17，非阻斷）');
console.log('========================================\n');

if (candidates.length === 0) {
  console.log('✅ 沒有掃到明顯缺少可訪問名稱的 <button>。\n');
} else {
  console.log(`⚠️ 找到 ${candidates.length} 個候選項目，建議人工複查是否為純圖示按鈕：\n`);
  candidates.forEach((c, i) => {
    console.log(`${i + 1}. ${c.relPath}:${c.lineNumber}`);
    console.log(`   ${c.snippet}${c.snippet.length >= 80 ? '...' : ''}\n`);
  });
  console.log('※ 本腳本刻意保守（遇到 {表達式} 一律當作可能有文字而跳過），實際缺漏可能更多；');
  console.log('※ 也可能有誤判（例如子層已用其他方式提供文字），逐項確認後再補 aria-label。\n');
}
