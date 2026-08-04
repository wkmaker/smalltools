const emojiRegex = /\p{Extended_Pictographic}/u;

export default {
  id: 'no-raw-emoji',
  name: '裸露 Emoji 檢測',
  description: '發現裸露 Emoji 符號（請替換為向量 SVG Icon）',
  checkLine({ line, trimmed, isConfigFile }) {
    if (isConfigFile) return null;

    if (emojiRegex.test(line)) {
      // 忽略複製到剪貼簿供社群分享的背後字串變數 (如 const defaultText =, const text =, funnyShareTitle =)
      if (trimmed.includes('const defaultText =') || trimmed.includes('const text =') || trimmed.includes('funnyShareTitle')) {
        return null;
      }
      return '發現裸露 Emoji (請替換為向量 SVG Icon)';
    }

    return null;
  }
};
