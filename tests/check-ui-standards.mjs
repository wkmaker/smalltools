import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const appDir = path.resolve(__dirname, '../app');

function getAllTsxFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      if (!file.startsWith('.') && file !== 'node_modules') {
        results = results.concat(getAllTsxFiles(filePath));
      }
    } else if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
      results.push(filePath);
    }
  });
  return results;
}

const tsxFiles = getAllTsxFiles(appDir);
let hasErrors = false;

// 1. Unicode Extended Pictographic 覆蓋所有 Emoji 符號
const emojiRegex = /\p{Extended_Pictographic}/u;

console.log('🔍 [UI 設計規範與單元檢查] 開始嚴格掃描 app/ 目錄下所有 TSX/TS 組件...\n');

tsxFiles.forEach((filePath) => {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const relPath = path.relative(appDir, filePath);

  // 白名單設定檔與特殊複製文字處理
  const isConfigFile = relPath.includes('config') || relPath.includes('ToolLayout');

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    // 忽略註解與帶有 // ui-standards-ignore-emoji 標記的行
    if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*') || trimmed.includes('ui-standards-ignore-emoji')) return;

    // 1. Emoji 殘留硬性卡關檢查 (Strict Error Entry)
    if (!isConfigFile && emojiRegex.test(line)) {
      // 忽略複製到剪貼簿供社群分享的背後字串變數 (如 const defaultText =, const text =, funnyShareTitle =)
      if (trimmed.includes('const defaultText =') || trimmed.includes('const text =') || trimmed.includes('funnyShareTitle')) {
        return;
      }

      console.error(`❌ [UI 規範硬性卡關] 發現裸露 Emoji (請替換為向量 SVG Icon):`);
      console.error(`   檔案: ${relPath}:${index + 1}`);
      console.error(`   內容: ${trimmed}\n`);
      hasErrors = true;
    }

    // 2. 亮色模式對比度反模式 text-[var(--theme-color)] 硬性卡關
    if (line.includes('text-[var(--theme-color)]')) {
      console.error(`❌ [UI 規範硬性卡關] 發現未適配亮色模式高對比度之語法 (請使用 styles.themeAccentText):`);
      console.error(`   檔案: ${relPath}:${index + 1}`);
      console.error(`   內容: ${trimmed}\n`);
      hasErrors = true;
    }
  });
});

if (hasErrors) {
  console.error('⛔ [建置中斷] UI 設計與顏色規範單元檢查未通過！打包已自動終止。請修復上述問題後重新執行 npm run build。\n');
  process.exit(1);
} else {
  console.log('✅ [通關認證] UI 設計規範與亮/暗模式對比度單元檢查 100% 通過！可以安全進行打包建置。\n');
}
