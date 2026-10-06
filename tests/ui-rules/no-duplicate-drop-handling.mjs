// 同一頁同時有 window 全域 drop 監聽與元件 onDrop 拖放區時，事件會從拖放區冒泡到 window，
// 若全域監聽沒先檢查 e.defaultPrevented，拖入一個檔案會被加入兩次（checksum-verifier 曾發生）。
const WINDOW_DROP = /window\.addEventListener\(\s*['"]drop['"]/;
const ZONE_DROP = /\bonDrop=/;

const rule = {
  id: 'no-duplicate-drop-handling',
  name: '拖放事件重複處理檢測',
  description: '全域 drop 監聽須先檢查 e.defaultPrevented，避免與拖放區 onDrop 重複加入檔案',
  checkLine() {
    return null;
  },
  checkFile({ content }) {
    if (!WINDOW_DROP.test(content) || !ZONE_DROP.test(content)) return null;
    if (/\.defaultPrevented\b/.test(content)) return null;
    const lineNumber = content.split('\n').findIndex(l => WINDOW_DROP.test(l)) + 1;
    return { lineNumber, message: '全域 drop 監聽未檢查 e.defaultPrevented，拖放區的 drop 冒泡後會重複加入檔案' };
  },
};

export default rule;
