'use client';

import { useState, useEffect, useCallback, useId } from 'react';
import ToolLayout from '../components/ToolLayout';
import styles from './text-utility.module.css';

export default function TextUtilityClient() {
  const [text, setText] = useState<string>(
    'Hello World! 這是一段測試文字。\n\n包含重複行\n包含重複行\n   帶有頭尾多餘空白   '
  );
  const [toast, setToast] = useState<string>('');

  const textInputId = useId();

  useEffect(() => {
    document.documentElement.style.setProperty('--theme-color', '#ff007f');
    document.documentElement.style.setProperty('--accent-glow', 'rgba(255, 0, 127, 0.6)');
  }, []);

  // 統計數字
  const totalChars = text.length;
  const totalCharsNoSpace = text.replace(/\s/g, '').length;
  const totalLines = text ? text.split('\n').length : 0;
  const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
  const englishWords = (text.match(/[a-zA-Z]+/g) || []).length;

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  };

  const copyText = () => {
    navigator.clipboard.writeText(text).then(() => showToast('已複製處理後的文字'));
  };

  const toUppercase = () => setText(text.toUpperCase());
  const toLowercase = () => setText(text.toLowerCase());
  const toTitleCase = () =>
    setText(text.replace(/\w\S*/g, txt => txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase()));

  const removeEmptyLines = () =>
    setText(text.split('\n').filter(line => line.trim().length > 0).join('\n'));

  const removeDups = () =>
    setText(Array.from(new Set(text.split('\n'))).join('\n'));

  const trimLines = () =>
    setText(text.split('\n').map(l => l.trim()).join('\n'));

  return (
    <ToolLayout
      title="文字處理助手"
      subtitle="TEXT UTILITY & STATS"
      description="專業免費的線上文字處理助手！支援即時中英文/字元數/行數統計、大小寫轉換、去除重複行與多餘空白。"
      accentColor="#ff007f"
      accentGlow="rgba(255, 0, 127, 0.6)"
    >
      <div className="flex flex-col gap-6 text-left">
        {/* 上方：多維度統計看板 */}
        <div className="grid grid-cols-5 gap-4 max-lg:grid-cols-3 max-sm:grid-cols-2">
          <div className={styles.statBadge}>
            <span className="text-sm font-semibold text-text-sub">總字元數</span>
            <span className="text-xl font-bold text-white font-mono">{totalChars.toLocaleString()}</span>
          </div>

          <div className={styles.statBadge}>
            <span className="text-sm font-semibold text-text-sub">不含空白字元</span>
            <span className="text-xl font-bold text-[#ff007f] font-mono">{totalCharsNoSpace.toLocaleString()}</span>
          </div>

          <div className={styles.statBadge}>
            <span className="text-sm font-semibold text-text-sub">中文字數</span>
            <span className="text-xl font-bold text-[#4ade80] font-mono">{chineseChars.toLocaleString()}</span>
          </div>

          <div className={styles.statBadge}>
            <span className="text-sm font-semibold text-text-sub">英文字詞數</span>
            <span className="text-xl font-bold text-[#fbbf24] font-mono">{englishWords.toLocaleString()}</span>
          </div>

          <div className={styles.statBadge}>
            <span className="text-sm font-semibold text-text-sub">總行數</span>
            <span className="text-xl font-bold text-text-main font-mono">{totalLines.toLocaleString()}</span>
          </div>
        </div>

        {/* 中間：文字編輯器與快速操作區 */}
        <div className="bg-black/20 border border-white/[.08] rounded-2xl p-6 flex flex-col gap-4 shadow-lg">
          <div className="flex justify-between items-center border-b border-white/[.06] pb-3">
            <span className="text-sm text-[#ff007f] font-semibold uppercase tracking-[1px]">文字內容編輯器</span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setText('')}
                className="px-3 py-1.5 text-sm font-semibold text-text-sub hover:text-white rounded-xl cursor-pointer transition-colors"
              >
                清空
              </button>
              <button
                type="button"
                onClick={copyText}
                className="px-4 py-1.5 text-sm bg-[#ff007f]/20 border border-[#ff007f]/40 text-[#ff007f] font-semibold rounded-xl hover:bg-[#ff007f] hover:text-white transition-all cursor-pointer shadow-md"
              >
                複製內文
              </button>
            </div>
          </div>

          <textarea
            id={textInputId}
            rows={10}
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="請輸入或貼上欲處理的文字內容..."
            className="w-full bg-black/40 border border-white/[.08] text-white p-4 rounded-xl text-sm outline-none focus:border-[#ff007f] font-mono resize-y leading-relaxed"
          />

          {/* 快捷排版工具列 */}
          <div className="flex flex-wrap gap-2.5 border-t border-white/[.05] pt-4">
            <button
              type="button"
              onClick={toUppercase}
              className="px-3.5 py-2 text-sm font-medium bg-white/[.04] border border-white/[.08] text-text-sub rounded-xl hover:text-white hover:bg-white/[.1] transition-all cursor-pointer"
            >
              大寫 (UPPER)
            </button>
            <button
              type="button"
              onClick={toLowercase}
              className="px-3.5 py-2 text-sm font-medium bg-white/[.04] border border-white/[.08] text-text-sub rounded-xl hover:text-white hover:bg-white/[.1] transition-all cursor-pointer"
            >
              小寫 (lower)
            </button>
            <button
              type="button"
              onClick={toTitleCase}
              className="px-3.5 py-2 text-sm font-medium bg-white/[.04] border border-white/[.08] text-text-sub rounded-xl hover:text-white hover:bg-white/[.1] transition-all cursor-pointer"
            >
              首字大寫 (Title)
            </button>
            <button
              type="button"
              onClick={removeEmptyLines}
              className="px-3.5 py-2 text-sm font-medium bg-[#ff007f]/10 border border-[#ff007f]/30 text-[#ff007f] rounded-xl hover:bg-[#ff007f]/20 transition-all cursor-pointer"
            >
              移除空行
            </button>
            <button
              type="button"
              onClick={removeDups}
              className="px-3.5 py-2 text-sm font-medium bg-[#ff007f]/10 border border-[#ff007f]/30 text-[#ff007f] rounded-xl hover:bg-[#ff007f]/20 transition-all cursor-pointer"
            >
              去除重複行
            </button>
            <button
              type="button"
              onClick={trimLines}
              className="px-3.5 py-2 text-sm font-medium bg-[#ff007f]/10 border border-[#ff007f]/30 text-[#ff007f] rounded-xl hover:bg-[#ff007f]/20 transition-all cursor-pointer"
            >
              修剪首尾空白
            </button>
          </div>
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-8 right-8 px-6 py-3 text-sm rounded-xl bg-[#ff007f]/20 border border-[#ff007f]/40 text-[#ff007f] backdrop-blur-md shadow-lg z-[100]">
          {toast}
        </div>
      )}
    </ToolLayout>
  );
}
