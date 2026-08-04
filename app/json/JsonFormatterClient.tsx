'use client';

import { useState, useRef, useCallback, useEffect, useId } from 'react';
import Link from 'next/link';
import ToolLayout from '../components/ToolLayout';
import styles from './json.module.css';

function TreeNode({ data, isLast, name }: { data: any; isLast: boolean; name?: string }) {
  const [collapsed, setCollapsed] = useState(false);

  if (data === null) {
    return (
      <div className="font-mono text-sm leading-6">
        {name && <span className={styles.treeKey}>{name}: </span>}
        <span className={`${styles.treeNull} italic`}>null</span>
        {!isLast && <span className="text-text-sub">,</span>}
      </div>
    );
  }

  const type = typeof data;

  if (type === 'boolean') {
    return (
      <div className="font-mono text-sm leading-6">
        {name && <span className={styles.treeKey}>{name}: </span>}
        <span className={styles.treeBoolean}>{String(data)}</span>
        {!isLast && <span className="text-text-sub">,</span>}
      </div>
    );
  }

  if (type === 'number') {
    return (
      <div className="font-mono text-sm leading-6">
        {name && <span className={styles.treeKey}>{name}: </span>}
        <span className={styles.treeNumber}>{data}</span>
        {!isLast && <span className="text-text-sub">,</span>}
      </div>
    );
  }

  if (type === 'string') {
    return (
      <div className="font-mono text-sm leading-6">
        {name && <span className={styles.treeKey}>{name}: </span>}
        <span className={styles.treeString}>"{data}"</span>
        {!isLast && <span className="text-text-sub">,</span>}
      </div>
    );
  }

  if (Array.isArray(data)) {
    return (
      <div className="font-mono text-sm leading-6">
        <span
          onClick={() => setCollapsed(!collapsed)}
          className="cursor-pointer select-none text-xs text-text-sub hover:text-[var(--theme-color,#ff00aa)] mr-1 inline-flex items-center transition-transform duration-200"
        >
          <svg className="w-3 h-3 fill-current transition-transform duration-200" style={{ transform: collapsed ? 'rotate(0deg)' : 'rotate(90deg)' }} viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
        </span>
        {name && <span className={styles.treeKey}>{name}: </span>}
        <span className={styles.treeBracket}>[</span>
        {collapsed ? (
          <span className="text-xs text-text-sub mx-1">... Array({data.length}) ...</span>
        ) : (
          <div className="pl-4 border-l border-border-glass my-0.5">
            {data.map((item, idx) => (
              <TreeNode key={idx} data={item} isLast={idx === data.length - 1} />
            ))}
          </div>
        )}
        <span className={styles.treeBracket}>]</span>
        {!isLast && <span className="text-text-sub">,</span>}
      </div>
    );
  }

  if (type === 'object') {
    const keys = Object.keys(data);
    return (
      <div className="font-mono text-sm leading-6">
        <span
          onClick={() => setCollapsed(!collapsed)}
          className="cursor-pointer select-none text-xs text-text-sub hover:text-[var(--theme-color,#ff00aa)] mr-1 inline-flex items-center transition-transform duration-200"
        >
          <svg className="w-3 h-3 fill-current transition-transform duration-200" style={{ transform: collapsed ? 'rotate(0deg)' : 'rotate(90deg)' }} viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
        </span>
        {name && <span className={styles.treeKey}>{name}: </span>}
        <span className={styles.treeBracket}>&#123;</span>
        {collapsed ? (
          <span className="text-xs text-text-sub mx-1">... Object({keys.length}) ...</span>
        ) : (
          <div className="pl-4 border-l border-border-glass my-0.5">
            {keys.map((key, idx) => (
              <TreeNode key={key} name={`"${key}"`} data={data[key]} isLast={idx === keys.length - 1} />
            ))}
          </div>
        )}
        <span className={styles.treeBracket}>&#125;</span>
        {!isLast && <span className="text-text-sub">,</span>}
      </div>
    );
  }

  return null;
}

interface Props {
  lang?: 'zh-TW' | 'en';
}

const TRANSLATIONS = {
  'zh-TW': {
    title: 'JSON 格式化與美化器',
    subtitle: 'JSON FORMATTER & MINIFIER',
    description:
      '專業免費的線上 JSON 格式化與美化器，支援即時語法 Lint 驗證定位、多縮排格式排版、單行壓縮與互動式樹狀檢視。',
    langToggleLabel: 'English',
    langToggleUrl: '/json/en/',
    inputLabel: '原始 JSON 輸入',
    placeholderInput: '貼上或拖曳 JSON 內容至此處...',
    sampleBtn: '載入範例',
    clearBtn: '清除',
    copyBtn: '複製',
    downloadBtn: '下載 .json',
    tabFormatted: '美化 (Format)',
    tabMinified: '單行壓縮 (Minify)',
    tabTree: '樹狀結構 (Tree)',
    indentLabel: '縮排:',
    spaceOption: (num: number) => `${num} 空格`,
    emptyPrompt: '請在左側輸入或拖曳 JSON 內容',
    errorPrompt: '語法錯誤，無法展示結果',
    lintErrorTitle: 'JSON 語法錯誤',
    toastCopied: '已複製到剪貼簿',
    toastCopyFailed: '複製失敗',
    toastNoContent: '無可複製的內容',
    toastEmptyExport: '內容為空無法匯出',
    toastExported: '已匯出 JSON 檔案',
  },
  en: {
    title: 'JSON Formatter & Validator',
    subtitle: 'JSON FORMATTER & MINIFIER',
    description:
      'Professional free online JSON formatter and validator tool. Supports live syntax error positioning, custom indent sizes, minification, and interactive tree view.',
    langToggleLabel: '繁體中文',
    langToggleUrl: '/json/',
    inputLabel: 'Input JSON',
    placeholderInput: 'Paste or drag JSON content here...',
    sampleBtn: 'Sample',
    clearBtn: 'Clear',
    copyBtn: 'Copy',
    downloadBtn: 'Export .json',
    tabFormatted: 'Beautify (Format)',
    tabMinified: 'Minify',
    tabTree: 'Tree View',
    indentLabel: 'Indent:',
    spaceOption: (num: number) => `${num} spaces`,
    emptyPrompt: 'Paste or drag JSON on the left to start',
    errorPrompt: 'Syntax error, unable to render output',
    lintErrorTitle: 'JSON Syntax Error',
    toastCopied: 'Copied to clipboard',
    toastCopyFailed: 'Copy failed',
    toastNoContent: 'Nothing to copy',
    toastEmptyExport: 'Cannot export empty content',
    toastExported: 'Exported JSON file',
  },
};

export default function JsonFormatterClient({ lang = 'zh-TW' }: Props) {
  const t = TRANSLATIONS[lang];

  const jsonInputTextareaId = useId();
  const indentSelectId = useId();
  const fileInputId = useId();

  const [inputText, setInputText] = useState('');
  const [indentSize, setIndentSize] = useState(2);
  const [activeTab, setActiveTab] = useState<'formatted' | 'minified' | 'tree'>('formatted');
  const [formattedText, setFormattedText] = useState('');
  const [minifiedText, setMinifiedText] = useState('');
  const [parsedObject, setParsedObject] = useState<any>(null);
  const [lintError, setLintError] = useState<{ title: string; msg: string } | null>(null);

  const [isDragOver, setIsDragOver] = useState(false);
  const [toast, setToast] = useState<{ msg: string; show: boolean }>({ msg: '', show: false });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((msg: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ msg, show: true });
    toastTimer.current = setTimeout(() => setToast(t => ({ ...t, show: false })), 2500);
  }, []);

  useEffect(() => {
    document.documentElement.style.setProperty('--theme-color', '#ff00aa');
    document.documentElement.style.setProperty('--accent-glow', 'rgba(255, 0, 170, 0.6)');
  }, []);

  const processJson = useCallback(
    (text: string, space: number) => {
      if (!text.trim()) {
        setFormattedText('');
        setMinifiedText('');
        setParsedObject(null);
        setLintError(null);
        return;
      }
      try {
        const obj = JSON.parse(text);
        setParsedObject(obj);
        setFormattedText(JSON.stringify(obj, null, space));
        setMinifiedText(JSON.stringify(obj));
        setLintError(null);
      } catch (err: any) {
        setFormattedText('');
        setMinifiedText('');
        setParsedObject(null);
        setLintError({ title: t.lintErrorTitle, msg: err.message || 'Invalid JSON format' });
      }
    },
    [t.lintErrorTitle]
  );

  const handleInputChange = (val: string) => {
    setInputText(val);
    processJson(val, indentSize);
  };

  const handleIndentChange = (val: number) => {
    setIndentSize(val);
    if (inputText) processJson(inputText, val);
  };

  const loadExample = () => {
    const ex = JSON.stringify(
      {
        site: 'SmallTools Platform',
        author: 'CJKuo',
        tools: ['JSON Formatter', 'Base64 Encoder', 'URL Encoder', 'Password Generator'],
        status: { online: true, activeUsers: 1250 },
        version: 2.0,
      },
      null,
      2
    );
    handleInputChange(ex);
  };

  const clearInput = () => {
    handleInputChange('');
  };

  const copyResult = () => {
    let content = '';
    if (activeTab === 'formatted') content = formattedText;
    else if (activeTab === 'minified') content = minifiedText;
    else if (activeTab === 'tree' && parsedObject) content = JSON.stringify(parsedObject, null, indentSize);

    if (!content) {
      showToast(t.toastNoContent);
      return;
    }
    navigator.clipboard
      .writeText(content)
      .then(() => showToast(t.toastCopied))
      .catch(() => showToast(t.toastCopyFailed));
  };

  const downloadJson = () => {
    const content = formattedText || inputText;
    if (!content) {
      showToast(t.toastEmptyExport);
      return;
    }
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'formatted.json';
    a.click();
    URL.revokeObjectURL(url);
    showToast(t.toastExported);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = evt => {
        if (evt.target?.result) handleInputChange(evt.target.result as string);
      };
      reader.readAsText(file);
    }
  };

  return (
    <>
      <ToolLayout
        title={t.title}
        subtitle={t.subtitle}
        description={t.description}
        accentColor="#ff00aa"
        accentGlow="rgba(255,0,170,0.5)"
      >
        <div className={styles.mainLayout}>
          {/* Top Bar Language Switcher */}
          <div className="flex justify-end mb-6">
            <Link
              href={t.langToggleUrl}
              className="px-3 py-1.5 text-xs font-semibold rounded-md border border-border-glass bg-select-bg text-text-sub hover:text-text-main hover:border-[var(--theme-color,#ff00aa)] transition-all no-underline"
            >
              {t.langToggleLabel}
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-8 mb-6 max-[900px]:grid-cols-1">
            {/* Input Panel */}
            <div className={styles.panelCard}>
              <div className="flex items-center justify-between">
                <label htmlFor={jsonInputTextareaId} className="text-sm font-semibold text-text-sub uppercase tracking-[1px]">
                  {t.inputLabel}
                </label>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={loadExample} className={styles.btnSecondary}>
                    {t.sampleBtn}
                  </button>
                  <button type="button" onClick={clearInput} className={styles.btnSecondary}>
                    {t.clearBtn}
                  </button>
                </div>
              </div>

              <div
                onDragEnter={e => {
                  e.preventDefault();
                  setIsDragOver(true);
                }}
                onDragOver={e => {
                  e.preventDefault();
                  setIsDragOver(true);
                }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop}
                className={`${styles.dropzoneBox} ${isDragOver ? styles.dropzoneBoxActive : ''}`}
              >
                <textarea
                  id={jsonInputTextareaId}
                  className={styles.jsonTextareaField}
                  placeholder={t.placeholderInput}
                  value={inputText}
                  onChange={e => handleInputChange(e.target.value)}
                />
                <input
                  id={fileInputId}
                  ref={fileInputRef}
                  type="file"
                  accept=".json,text/plain"
                  className="hidden"
                  onChange={e => {
                    const f = e.target.files?.[0];
                    if (f) {
                      const r = new FileReader();
                      r.onload = ev => {
                        if (ev.target?.result) handleInputChange(ev.target.result as string);
                      };
                      r.readAsText(f);
                    }
                  }}
                />
              </div>

              {lintError && (
                <div className="flex items-start gap-3 bg-[rgba(255,68,68,0.07)] border border-[rgba(255,68,68,0.25)] rounded-xl p-3.5 text-sm text-red-400">
                  <svg viewBox="0 0 24 24" width={18} height={18} fill="#ef4444" className="shrink-0 mt-0.5">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                  </svg>
                  <div className="flex flex-col gap-0.5">
                    <span className="font-bold text-red-500">{lintError.title}</span>
                    <span className="font-mono break-all text-xs">{lintError.msg}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Output Panel */}
            <div className={styles.panelCard}>
              <div className="flex items-center justify-between flex-wrap gap-2 border-b border-border-glass pb-3">
                <div className="flex gap-2">
                  {(['formatted', 'minified', 'tree'] as const).map(tab => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setActiveTab(tab)}
                      className={`${styles.tabBtn} ${activeTab === tab ? styles.tabActive : ''}`}
                    >
                      {tab === 'formatted' && t.tabFormatted}
                      {tab === 'minified' && t.tabMinified}
                      {tab === 'tree' && t.tabTree}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-3">
                  {activeTab === 'formatted' && (
                    <div className="flex items-center gap-1.5 text-sm font-medium text-text-sub">
                      <label htmlFor={indentSelectId}>{t.indentLabel}</label>
                      <select
                        id={indentSelectId}
                        className="bg-select-bg border border-border-glass rounded-xl px-2.5 py-1 text-text-main text-sm font-mono font-medium outline-none cursor-pointer"
                        value={indentSize}
                        onChange={e => handleIndentChange(Number(e.target.value))}
                      >
                        <option value={2}>{t.spaceOption(2)}</option>
                        <option value={4}>{t.spaceOption(4)}</option>
                        <option value={8}>{t.spaceOption(8)}</option>
                      </select>
                    </div>
                  )}
                  <button type="button" onClick={copyResult} className={styles.btnPrimary}>
                    {t.copyBtn}
                  </button>
                  <button type="button" onClick={downloadJson} className={styles.btnSecondary}>
                    {t.downloadBtn}
                  </button>
                </div>
              </div>

              <div className={styles.resultBox}>
                {!inputText.trim() && (
                  <div className="flex items-center justify-center h-full text-sm text-text-sub">
                    {t.emptyPrompt}
                  </div>
                )}

                {inputText.trim() && lintError && (
                  <div className="flex items-center justify-center h-full text-sm text-red-400/80 font-medium">
                    {t.errorPrompt}
                  </div>
                )}

                {inputText.trim() && !lintError && activeTab === 'formatted' && (
                  <pre className={styles.formattedCode}>{formattedText}</pre>
                )}

                {inputText.trim() && !lintError && activeTab === 'minified' && (
                  <pre className={styles.formattedCode}>{minifiedText}</pre>
                )}

                {inputText.trim() && !lintError && activeTab === 'tree' && parsedObject && (
                  <div className="p-2">
                    <TreeNode data={parsedObject} isLast={true} />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </ToolLayout>

      {/* Toast Notification */}
      <div
        className={`fixed bottom-8 right-8 flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-xl z-[100] pointer-events-none
          bg-surface-glass border border-border-glass backdrop-blur-[16px] text-text-main shadow-lg
          transition-all duration-300 ${toast.show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
      >
        <svg viewBox="0 0 24 24" width={16} height={16} fill="#ff00aa">
          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
        </svg>
        {toast.msg}
      </div>
    </>
  );
}
