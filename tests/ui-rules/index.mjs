import noRawEmoji from './no-raw-emoji.mjs';
import noDirectThemeColor from './no-direct-theme-color.mjs';
import noUndersizedFont from './no-undersized-font.mjs';
import noRawTailwindColors from './no-raw-tailwind-colors.mjs';
import noDuplicateDropHandling from './no-duplicate-drop-handling.mjs';

// 規則以 checkLine 逐行檢查；需看整個檔案的規則可另外實作選用的 checkFile（回傳 { lineNumber, message } 或 null）
export const rules = [
  noRawEmoji,
  noDirectThemeColor,
  noUndersizedFont,
  noRawTailwindColors,
  noDuplicateDropHandling,
];
