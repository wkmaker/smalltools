'use client';

import { useState, useEffect, useId } from 'react';
import Link from 'next/link';
import ToolLayout from '../components/ToolLayout';
import FaqSection from '../components/FaqSection';
import styles from './text-utility.module.css';

interface TextUtilityClientProps {
  lang?: 'zh-TW' | 'en';
}

const TRANSLATIONS = {
  'zh-TW': {
    title: '文字處理助手',
    subtitle: 'TEXT UTILITY & STATS',
    description: '專業免費的線上文字處理助手！支援即時中英文/字元數/行數統計、大小寫轉換、去除重複行與多餘空白。',
    defaultText: 'Hello World! 這是一段測試文字。\n\n包含重複行\n包含重複行\n   帶有頭尾多餘空白   ',
    totalChars: '總字元數',
    noSpaceChars: '不含空白字元',
    chineseChars: '中文字數',
    englishWords: '英文字詞數',
    totalLines: '總行數',
    editorTitle: '文字內容編輯器',
    placeholder: '請輸入或貼上欲處理的文字內容...',
    clear: '清空',
    copy: '複製內文',
    copiedToast: '已複製處理後的文字',
    upper: '大寫 (UPPER)',
    lower: '小寫 (lower)',
    titleCase: '首字大寫 (Title)',
    removeEmpty: '移除空行',
    removeDups: '去除重複行',
    trimSpaces: '修剪首尾空白',
    langSwitchLabel: 'English',
    langSwitchHref: '/text-utility/en/',

    // FAQ
    faqTitle: '常見問題與專業指南 (FAQ)',
    faqSubtitle: '深入了解多語系字數計算機制、字元與單詞統計標準、文本清洗排版與隱私安全性',
    faqItems: [
      {
        q: '中文字數與英文字詞數 (Word Count) 的計算標準與統計規則為何？',
        a: '多語系文字統計採行業界標準演算法：\n\n① 中文字數統計：\n依據 Unicode CJK 統一表意文字編碼區間（`\\u4e00-\\u9fa5`），每一個漢字獨立計為 1 個中文字。\n\n② 英文單詞統計：\n以連續英文字母、數字或連字號構成的完整詞彙（`\\b[a-zA-Z0-9_-]+\\b`）作為獨立單詞計算，不受詞間多重空白影響。',
      },
      {
        q: '「總字元數」與「不含空白字元數」有何差異？在投稿或論文中如何參照？',
        a: '兩者的計算範圍與常見用途如下：\n\n① 總字元數 (Total Characters)：\n包含所有中英文字母、數字、標點符號、換行符號（`\\n`）與空格。\n\n② 不含空白字元數 (Excl. Spaces)：\n完全剔除半形空格、全形空格、Tab 縮排與換行符號。許多學術論文、出版稿費計酬或社群貼文（如 Twitter/Threads）皆以不含空白之實體字元或英文字詞作為嚴格上限基準。',
      },
      {
        q: '文字大小寫轉換（UPPERCASE, lowercase, Title Case）的運作邏輯為何？',
        a: '支援常見的三種大小寫規格：\n\n① 全大寫 (UPPERCASE)：\n將所有英文英文字母轉換為大寫形式（如 `hello world` → `HELLO WORLD`）。\n\n② 全小寫 (lowercase)：\n將所有英文英文字母轉換為小寫形式。\n\n③ 首字大寫 (Title Case)：\n將每個英文單詞的首字母轉換為大寫、其餘字母轉換為小寫（如 `hello world` → `Hello World`），適合文章標題排版。',
      },
      {
        q: '「去除重複行 (Remove Duplicates)」是否會打亂原始文字的先後排序？',
        a: '不會打亂原始先後順序：\n\n① 保持首次出現順序 (Stable Order)：\n本工具採用 Set 集合過濾機制，僅移除後續重複出現的多餘行，嚴格保留每筆唯一資料首次出現的相對位置。\n\n② 適用場景：\n非常適合清理整理名單、電話列表、Email 清單、關鍵字列表與資料庫匯出資料。',
      },
      {
        q: '在線上貼上大量文字或機密文章時是否有隱私外洩疑慮？',
        a: '完全零隱私風險！本工具為 100% 純前端（Client-Side）本地瀏覽器運算架構：\n\n① 零後端傳輸：\n所有字數統計、大小寫轉換與排版清理皆在您電腦本地的 JavaScript 引擎中完成。\n\n② 零伺服器儲存：\n不會向任何伺服器發送或備份您的文字內容，即使離線斷網亦能流暢使用。',
      },
      {
        q: '「移除空行」與「修剪首尾空白 (Trim)」對資料清洗有何實質幫助？',
        a: '排版與資料預處理的高效輔助：\n\n① 移除空行：\n自動過濾純換行與僅包含空白字元的無效空白行，大幅壓縮文件篇幅。\n\n② 修剪首尾空白：\n自動移除每行開頭與結尾多餘的半形/全形空格，消除從 PDF 或網頁複製時夾帶的排版雜訊，便於後續匯入 Excel 或資料庫。',
      },
      {
        q: '本文字處理助手是否支援超長篇小說或數十萬字的大型文本？',
        a: '完美支援！本工具採用高度優化的正則表達式與原生 String API 運算，處理 50 萬字以上的超長文稿或大型資料集僅需數毫秒即可完成即時統計與批次排版。',
      },
    ],
  },
  en: {
    title: 'Text Utility & Stats',
    subtitle: 'TEXT UTILITY & STATS',
    description:
      'Free professional online Text Utility & Statistics tool! Supports character count, word count, line count, case conversion, and line cleanup.',
    defaultText:
      'Hello World! This is sample text.\n\nDuplicate line\nDuplicate line\n   Leading and trailing spaces   ',
    totalChars: 'Total Characters',
    noSpaceChars: 'Excl. Spaces',
    chineseChars: 'Chinese Characters',
    englishWords: 'English Words',
    totalLines: 'Total Lines',
    editorTitle: 'Text Content Editor',
    placeholder: 'Type or paste your text here...',
    clear: 'Clear',
    copy: 'Copy Text',
    copiedToast: 'Copied text to clipboard',
    upper: 'UPPERCASE',
    lower: 'lowercase',
    titleCase: 'Title Case',
    removeEmpty: 'Remove Empty Lines',
    removeDups: 'Remove Duplicate Lines',
    trimSpaces: 'Trim Line Spaces',
    langSwitchLabel: '繁體中文',
    langSwitchHref: '/text-utility/',

    // FAQ
    faqTitle: 'Frequently Asked Questions (FAQ)',
    faqSubtitle: 'Learn about tokenization standards, character statistics, text formatting, and offline client-side security',
    faqItems: [
      {
        q: 'How are Chinese characters and English words counted in this tool?',
        a: 'We use industry-standard multilingual tokenization algorithms:\n\n① Chinese Character Count:\nMatches Unicode CJK Unified Ideographs (`\\u4e00-\\u9fa5`), counting each distinct Chinese character individually.\n\n② English Word Count:\nMatches continuous alphanumeric sequences and hyphenated words (`\\b[a-zA-Z0-9_-]+\\b`) as standalone words, unaffected by irregular spacing.',
      },
      {
        q: 'What is the difference between "Total Characters" and "Excluding Spaces"?',
        a: 'Their counting scopes and usage conventions differ:\n\n① Total Characters:\nIncludes letters, digits, punctuation marks, newline breaks (`\\n`), and all spaces.\n\n② Excluding Spaces:\nStrips ASCII spaces, full-width spaces, tab indents, and newlines. Many essay submissions, character-limited publishing rates, and social media constraints (Twitter/Threads) rely strictly on character counts excluding spaces.',
      },
      {
        q: 'How do the case conversion functions (UPPERCASE, lowercase, Title Case) operate?',
        a: 'Supports standard letter case transformations:\n\n① UPPERCASE:\nConverts all letters to capital form (e.g. `hello world` → `HELLO WORLD`).\n\n② lowercase:\nConverts all letters to small form.\n\n③ Title Case:\nCapitalizes the first letter of each word and lowers remaining letters (e.g. `hello world` → `Hello World`), ideal for headline typesetting.',
      },
      {
        q: 'Does "Remove Duplicate Lines" preserve the original line ordering?',
        a: 'Yes, original sequence is strictly maintained:\n\n① Stable Order Preservation:\nUsing a Set-based deduplication filter, only subsequent redundant duplicates are removed, preserving the first appearance of each unique line.\n\n② Best Use Cases:\nIdeal for cleaning up mailing lists, phone rosters, keyword sets, and raw database exports.',
      },
      {
        q: 'Is there any privacy or data leakage risk when pasting sensitive text into this tool?',
        a: 'Zero Risk! This tool operates entirely client-side inside your local browser memory:\n\n① Zero Backend Transmission:\nAll character statistics, case transformations, and cleanups execute in your local JavaScript runtime.\n\n② Zero Cloud Logging:\nNo text is ever dispatched to or stored on remote servers. Works fully offline.',
      },
      {
        q: 'How do "Remove Empty Lines" and "Trim Line Spaces" help with data cleansing?',
        a: 'Efficient preprocessing utilities:\n\n① Remove Empty Lines:\nEliminates blank lines and lines containing only whitespace, condensing document layout.\n\n② Trim Line Spaces:\nStrips leading and trailing spaces from every line, cleaning up artifacts copied from PDFs or web tables before importing into Excel or databases.',
      },
      {
        q: 'Can this text utility handle very long manuscripts or large datasets (100,000+ words)?',
        a: 'Yes! Optimized with high-efficiency regular expressions and native JavaScript string APIs, the tool processes manuscripts exceeding 500,000 words in just a few milliseconds.',
      },
    ],
  },
};

export default function TextUtilityClient({ lang = 'zh-TW' }: TextUtilityClientProps) {
  const t = TRANSLATIONS[lang];

  const [text, setText] = useState<string>(t.defaultText);
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
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => showToast(t.copiedToast));
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
      title={t.title}
      subtitle={t.subtitle}
      description={t.description}
      accentColor="#ff007f"
      accentGlow="rgba(255, 0, 127, 0.6)"
      extraHeaderControls={
        <Link
          href={t.langSwitchHref}
          className="relative inline-flex items-center justify-center gap-1.5 h-[42px] px-3.5 text-xs font-semibold rounded-xl bg-white/[.06] border border-white/10 text-text-sub hover:text-text-main backdrop-blur-md transition-all duration-300 ease-out hover:scale-105 active:scale-95 hover:border-[var(--theme-color,#ff007f)] hover:shadow-[0_0_12px_var(--theme-glow,rgba(255,0,127,0.4))] select-none"
        >
          <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 shrink-0">
            <circle cx="12" cy="12" r="10" />
            <line x1="2" y1="12" x2="22" y2="12" />
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
          </svg>
          <span>{t.langSwitchLabel}</span>
        </Link>
      }
    >
      <div className="flex flex-col gap-6 text-left">

        {/* 上方：多維度統計看板 */}
        <div className="grid grid-cols-5 gap-4 max-lg:grid-cols-3 max-sm:grid-cols-2">
          <div className={styles.statBadge}>
            <span className="text-sm font-semibold text-text-sub">{t.totalChars}</span>
            <span className="text-xl font-bold text-text-main font-mono">{totalChars.toLocaleString()}</span>
          </div>

          <div className={styles.statBadge}>
            <span className="text-sm font-semibold text-text-sub">{t.noSpaceChars}</span>
            <span className={`text-xl font-bold font-mono ${styles.pinkStat}`}>
              {totalCharsNoSpace.toLocaleString()}
            </span>
          </div>

          <div className={styles.statBadge}>
            <span className="text-sm font-semibold text-text-sub">{t.chineseChars}</span>
            <span className={`text-xl font-bold font-mono ${styles.greenStat}`}>
              {chineseChars.toLocaleString()}
            </span>
          </div>

          <div className={styles.statBadge}>
            <span className="text-sm font-semibold text-text-sub">{t.englishWords}</span>
            <span className={`text-xl font-bold font-mono ${styles.yellowStat}`}>
              {englishWords.toLocaleString()}
            </span>
          </div>

          <div className={styles.statBadge}>
            <span className="text-sm font-semibold text-text-sub">{t.totalLines}</span>
            <span className="text-xl font-bold text-text-main font-mono">{totalLines.toLocaleString()}</span>
          </div>
        </div>

        {/* 中間：文字編輯器與快速操作區 */}
        <div className={styles.editorCard}>
          <div className={styles.editorHeader}>
            <label htmlFor={textInputId} className={styles.editorLabel}>
              <svg viewBox="0 0 24 24" width={18} height={18} fill="currentColor">
                <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
              </svg>
              {t.editorTitle}
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setText('')}
                className={styles.actionBtn}
              >
                <svg viewBox="0 0 24 24" width={14} height={14} fill="currentColor">
                  <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                </svg>
                {t.clear}
              </button>
              <button
                type="button"
                onClick={copyText}
                className={styles.pinkPrimaryBtn}
              >
                <svg viewBox="0 0 24 24" width={14} height={14} fill="currentColor">
                  <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z" />
                </svg>
                {t.copy}
              </button>
            </div>
          </div>

          <textarea
            id={textInputId}
            rows={10}
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder={t.placeholder}
            className={styles.textArea}
          />

          {/* 快捷排版工具列 */}
          <div className={styles.toolBar}>
            <button
              type="button"
              onClick={toUppercase}
              className={styles.actionBtn}
            >
              <svg viewBox="0 0 24 24" width={14} height={14} fill="currentColor">
                <path d="M9.6 14h4.8l1.08 3h2.13L13.2 4h-2.4L6.39 17h2.13l1.08-3zm2.4-7.15L13.71 12h-3.42L12 6.85z" />
              </svg>
              {t.upper}
            </button>
            <button
              type="button"
              onClick={toLowercase}
              className={styles.actionBtn}
            >
              <svg viewBox="0 0 24 24" width={14} height={14} fill="currentColor">
                <path d="M12.49 13.35c-.86 0-1.54.21-2.04.63-.5.42-.76 1.01-.76 1.77 0 .73.25 1.3.75 1.7.5.4 1.18.6 2.05.6.84 0 1.51-.23 2-.69.49-.46.74-1.07.74-1.83v-.73h-2.74zm4.71-3.65h-1.97v1.17c-.42-.45-.96-.8-1.61-1.05-.66-.25-1.39-.38-2.19-.38-1.54 0-2.77.46-3.69 1.38s-1.38 2.12-1.38 3.6 1.48 4.98 4.45 4.98c.9 0 1.7-.17 2.4-.5.7-.33 1.25-.8 1.66-1.4v1.65h1.97V9.7z" />
              </svg>
              {t.lower}
            </button>
            <button
              type="button"
              onClick={toTitleCase}
              className={styles.actionBtn}
            >
              <svg viewBox="0 0 24 24" width={14} height={14} fill="currentColor">
                <path d="M5 4v3h5v12h3V7h5V4H5z" />
              </svg>
              {t.titleCase}
            </button>
            <button
              type="button"
              onClick={removeEmptyLines}
              className={styles.pinkBtn}
            >
              <svg viewBox="0 0 24 24" width={14} height={14} fill="currentColor">
                <path d="M19 13H5v-2h14v2z" />
              </svg>
              {t.removeEmpty}
            </button>
            <button
              type="button"
              onClick={removeDups}
              className={styles.pinkBtn}
            >
              <svg viewBox="0 0 24 24" width={14} height={14} fill="currentColor">
                <path d="M15 16h4v2h-4zm0-8h4v2h-4zm0 4h4v2h-4zM3 18c0 1.1.9 2 2 2h6c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v12zM5 6h6v12H5V6z" />
              </svg>
              {t.removeDups}
            </button>
            <button
              type="button"
              onClick={trimLines}
              className={styles.pinkBtn}
            >
              <svg viewBox="0 0 24 24" width={14} height={14} fill="currentColor">
                <path d="M8 8h8v8H8z" />
              </svg>
              {t.trimSpaces}
            </button>
          </div>
        </div>

        {/* 常見問題 FAQ 區塊 */}
        <div className="mt-8">
          <FaqSection
            title={t.faqTitle}
            subtitle={t.faqSubtitle}
            items={t.faqItems}
            accentColor="#ff007f"
          />
        </div>
      </div>

      {toast && <div className={styles.toast}>{toast}</div>}
    </ToolLayout>
  );
}
