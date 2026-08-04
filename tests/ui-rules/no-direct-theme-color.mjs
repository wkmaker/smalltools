export default {
  id: 'no-direct-theme-color',
  name: '亮色模式對比度檢測',
  description: '發現未適配亮色模式高對比度之語法',
  checkLine({ line }) {
    if (line.includes('text-[var(--theme-color)]')) {
      return '發現未適配亮色模式高對比度之語法 (請使用 styles.themeAccentText)';
    }
    return null;
  }
};
