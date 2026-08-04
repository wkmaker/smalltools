// 規範：次要備註與對應級距小字說明至少保持 12px (text-xs / text-text-sub)，嚴禁使用 < 12px (如 text-[10px], text-[11px]) 之過小微縮字體
const undersizedFontRegex = /\btext-\[\s*(?:[1-9]|10|11)px\s*\]/i;

export default {
  id: 'no-undersized-font',
  name: '過小字體檢測 (< 12px)',
  description: '發現低於 12px 之微縮字體語法（請改用 text-xs [12px] 或 text-sm [14px]）',
  checkLine({ line, trimmed }) {
    if (trimmed.startsWith('//') || trimmed.startsWith('/*')) return null;

    if (undersizedFontRegex.test(line)) {
      if (line.includes('disabled:')) return null;

      return '發現過小字體 (< 12px, 如 text-[10px] / text-[11px])，請提升字級至 text-xs (12px) 或 text-sm (14px) 以符合無障礙可讀性規範';
    }

    return null;
  }
};
