import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { rules } from './ui-rules/index.mjs';

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
let errorCount = 0;

console.log(`🔍 [UI 設計規範與單元檢查] 開始掃描 app/ 目錄下所有 TSX/TS 組件 (已載入 ${rules.length} 條模組化規則)...\n`);

tsxFiles.forEach((filePath) => {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const relPath = path.relative(appDir, filePath);
  const isConfigFile = relPath.includes('config') || relPath.includes('ToolLayout');

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    // 忽略標準註解行
    if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) return;

    rules.forEach((rule) => {
      // 支援舊有 ui-standards-ignore-emoji 及通用/特定規則標記 (例如 ui-standards-ignore: no-raw-emoji)
      if (
        trimmed.includes('ui-standards-ignore') &&
        (trimmed.includes(rule.id) || trimmed.includes('ui-standards-ignore-emoji') || !trimmed.includes(':'))
      ) {
        return;
      }

      const errorMsg = rule.checkLine({ line, trimmed, relPath, isConfigFile, lineNumber: index + 1 });
      if (errorMsg) {
        console.error(`❌ [UI 規範硬性卡關 - ${rule.name}] ${errorMsg}:`);
        console.error(`   檔案: ${relPath}:${index + 1}`);
        console.error(`   內容: ${trimmed}\n`);
        hasErrors = true;
        errorCount++;
      }
    });
  });
});

if (hasErrors) {
  console.error(`⛔ [建置中斷] UI 設計與顏色規範單元檢查未通過 (共發現 ${errorCount} 處違規)！打包已自動終止。請修復上述問題後重新執行 npm run build。\n`);
  process.exit(1);
} else {
  console.log('✅ [通關認證] UI 設計規範與亮/暗模式對比度單元檢查 100% 通過！可以安全進行打包建置。\n');
}
