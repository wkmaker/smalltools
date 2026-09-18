'use client';

import { useState, useEffect, useId } from 'react';
import ToolLayout from '../components/ToolLayout';
import FaqSection from '../components/FaqSection';
import styles from './text-utility.module.css';
import { TRANSLATIONS } from './translations';

interface TextUtilityClientProps {
  lang?: 'zh-TW' | 'en';
}


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
