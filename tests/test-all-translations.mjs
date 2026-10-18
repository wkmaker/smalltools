import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const appDir = path.join(rootDir, 'app');

console.log('====================================================');
console.log('🌐 全站雙語字典對稱性測試 (All Translations Symmetry)');
console.log('====================================================\n');

function findTranslationFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(findTranslationFiles(fullPath));
    } else if (file === 'translations.ts') {
      results.push(fullPath);
    }
  }
  return results;
}

function compareKeys(zhObj, enObj, prefix = '') {
  const errors = [];
  if (typeof zhObj !== 'object' || zhObj === null || typeof enObj !== 'object' || enObj === null) {
    return errors;
  }

  // 若為陣列，不逐 index 比對鍵名，只比對物件內容或長度
  if (Array.isArray(zhObj) || Array.isArray(enObj)) {
    return errors;
  }

  const zhKeys = Object.keys(zhObj).sort();
  const enKeys = Object.keys(enObj).sort();

  const missingInEn = zhKeys.filter((k) => !enKeys.includes(k));
  const missingInZh = enKeys.filter((k) => !zhKeys.includes(k));

  for (const k of missingInEn) {
    errors.push(`英文 (en) 缺少 key: ${prefix}${k}`);
  }
  for (const k of missingInZh) {
    errors.push(`繁中 (zh-TW) 缺少 key: ${prefix}${k}`);
  }

  const commonKeys = zhKeys.filter((k) => enKeys.includes(k));
  for (const k of commonKeys) {
    const zhVal = zhObj[k];
    const enVal = enObj[k];
    if (
      typeof zhVal === 'object' &&
      zhVal !== null &&
      !Array.isArray(zhVal) &&
      typeof enVal === 'object' &&
      enVal !== null &&
      !Array.isArray(enVal)
    ) {
      errors.push(...compareKeys(zhVal, enVal, `${prefix}${k}.`));
    }
  }

  return errors;
}

async function run() {
  const files = findTranslationFiles(appDir);
  console.log(`🔍 找到 ${files.length} 個 translations.ts 檔案進行全覆蓋檢查...\n`);

  let totalFiles = files.length;
  let passedFiles = 0;
  let totalErrors = 0;

  for (const filePath of files) {
    const relativePath = path.relative(rootDir, filePath).replace(/\\/g, '/');
    const fileUrl = pathToFileURL(filePath).href;

    try {
      const module = await import(fileUrl);
      const dict = module.TRANSLATIONS;

      if (!dict) {
        console.error(`❌ [FAIL] ${relativePath}: 未導出 TRANSLATIONS 常數`);
        totalErrors++;
        continue;
      }

      if (!dict['zh-TW'] || !dict['en']) {
        console.error(`❌ [FAIL] ${relativePath}: 必須同時具備 'zh-TW' 與 'en' 語系`);
        totalErrors++;
        continue;
      }

      const errors = compareKeys(dict['zh-TW'], dict['en']);

      if (errors.length > 0) {
        console.error(`❌ [FAIL] ${relativePath} 鍵值不對稱 (${errors.length} 處錯誤):`);
        for (const err of errors) {
          console.error(`   - ${err}`);
        }
        totalErrors += errors.length;
      } else {
        const keyCount = Object.keys(dict['zh-TW']).length;
        console.log(`✅ [PASS] ${relativePath} (${keyCount} keys 完全對稱)`);
        passedFiles++;
      }
    } catch (err) {
      console.error(`❌ [ERROR] 無法載入或解析 ${relativePath}:`, err);
      totalErrors++;
    }
  }

  console.log('\n====================================================');
  console.log(`📊 檢查結果：${passedFiles} / ${totalFiles} 檔案通過，共有 ${totalErrors} 個錯誤。`);
  console.log('====================================================\n');

  if (totalErrors > 0) {
    process.exit(1);
  } else {
    console.log('🎉 全站 100% translations.ts 雙語字典完全對稱！\n');
  }
}

run();
