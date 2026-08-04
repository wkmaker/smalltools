// 規範：全站嚴禁在一般卡片、標題與按鈕中硬編碼寫死主題色標 (如 text-emerald-400, bg-emerald-500/10, border-blue-400)
// 一律套用語意化 Token (text-text-main, text-text-sub, bg-surface-glass, border-border-glass, styles.themeAccentText)
const rawTailwindColorRegex = /\b(?:text|bg|border)-(?:emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|orange|yellow|green)-(?:300|400|500|600)(?:\/\d+)?\b/i;

export default {
  id: 'no-raw-tailwind-colors',
  name: '硬編碼 Tailwind 色彩 Utility 檢測',
  description: '發現硬編碼 Tailwind 色彩類別 (請改用語意化 Token 如 text-text-main, text-text-sub, bg-surface-glass, border-border-glass 或 styles.themeAccentText)',
  checkLine({ line, trimmed }) {
    if (trimmed.startsWith('//') || trimmed.startsWith('/*')) return null;

    // 允許特定系統告警、錯誤訊息、刪除按鈕與狀態指示燈等特化情境
    if (
      line.includes('starCount') ||
      line.includes('isExpired') ||
      line.includes('isNotYetValid') ||
      line.includes('isComplete') ||
      line.includes('error') ||
      line.includes('Error') ||
      line.includes('danger') ||
      line.includes('delete') ||
      line.includes('remove') ||
      line.includes('warning') ||
      line.includes('Warning') ||
      line.includes('alert') ||
      line.includes('Alert') ||
      line.includes('dark:') ||
      line.includes('animate-') ||
      line.includes('hover:text-') ||
      line.includes('sponsor') ||
      line.includes('donate')
    ) {
      return null;
    }

    if (rawTailwindColorRegex.test(line)) {
      return '發現硬編碼 Tailwind 顏色類別 (如 text-emerald-400, bg-emerald-500/10, border-blue-400)。請改用語意 Token (text-text-main, text-text-sub, styles.themeAccentText, bg-surface-glass) 以符合雙主題對比規範';
    }

    return null;
  }
};
