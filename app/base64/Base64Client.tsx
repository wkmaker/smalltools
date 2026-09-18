'use client';

import { useState, useRef, useCallback, useEffect, useId } from 'react';
import ToolLayout from '../components/ToolLayout';
import FaqSection from '../components/FaqSection';
import styles from './base64.module.css';
import { TRANSLATIONS } from './translations';

function utf8ToB64(str: string): string {
  const safeStr = typeof str.toWellFormed === 'function' ? str.toWellFormed() : str;
  return btoa(
    encodeURIComponent(safeStr).replace(/%([0-9A-F]{2})/g, (_, p1) =>
      String.fromCharCode(parseInt(p1, 16))
    )
  );
}

function b64ToUtf8(str: string): string {
  return decodeURIComponent(
    Array.prototype.map
      .call(atob(str), (c: string) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
      .join('')
  );
}

function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
}

type TabType = 'text' | 'file';
type EncodingType = 'UTF-8' | 'ASCII';

interface FileState {
  file: File | null;
  dataUrl: string;
  rawBase64: string;
  previewType: 'image' | 'audio' | 'video' | 'text' | 'binary' | null;
  previewContent: string;
  loading: boolean;
}

interface Props {
  lang?: 'zh-TW' | 'en';
}

export default function Base64Client({ lang = 'zh-TW' }: Props) {
  const t = TRANSLATIONS[lang];

  // DOM IDs for Accessibility
  const plainTextId = useId();
  const base64TextId = useId();
  const encodingSelectId = useId();
  const urlSafeCheckboxId = useId();
  const rfc2045CheckboxId = useId();
  const fileInputId = useId();

  const [activeTab, setActiveTab] = useState<TabType>('text');
  const [plainText, setPlainText] = useState('');
  const [base64Text, setBase64Text] = useState('');
  const [encoding, setEncoding] = useState<EncodingType>('UTF-8');
  const [urlSafe, setUrlSafe] = useState(false);
  const [rfc2045, setRfc2045] = useState(false);
  const [base64Error, setBase64Error] = useState(false);
  const [fileState, setFileState] = useState<FileState>({
    file: null,
    dataUrl: '',
    rawBase64: '',
    previewType: null,
    previewContent: '',
    loading: false,
  });
  const [isDragOver, setIsDragOver] = useState(false);
  const [toast, setToast] = useState<{ msg: string; show: boolean }>({ msg: '', show: false });

  const isCalculating = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Bind dynamic theme color to root
  useEffect(() => {
    document.documentElement.style.setProperty('--theme-color', '#ff7300');
    document.documentElement.style.setProperty('--accent-glow', 'rgba(255, 115, 0, 0.6)');
  }, []);

  const showToast = useCallback((msg: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ msg, show: true });
    toastTimer.current = setTimeout(() => setToast(t => ({ ...t, show: false })), 2500);
  }, []);

  const activeFileReaderRef = useRef<FileReader | null>(null);

  const encodeText = useCallback((text: string, enc: EncodingType, safe: boolean, wrap: boolean) => {
    if (!text) {
      setBase64Text('');
      setBase64Error(false);
      return;
    }
    try {
      let encoded = enc === 'UTF-8' ? utf8ToB64(text) : btoa(text);
      if (safe) encoded = encoded.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
      if (wrap) {
        const chunks = encoded.match(/.{1,76}/g);
        encoded = chunks ? chunks.join('\n') : encoded;
      }
      setBase64Text(encoded);
      setBase64Error(false);
    } catch {
      setBase64Text('');
      setBase64Error(true);
    }
  }, []);

  const decodeBase64 = useCallback((b64: string, enc: EncodingType) => {
    if (!b64) {
      setPlainText('');
      setBase64Error(false);
      return;
    }
    let str = b64.trim().replace(/\s+/g, '').replace(/-/g, '+').replace(/_/g, '/');
    while (str.length % 4 !== 0) {
      str += '=';
    }
    try {
      const decoded = enc === 'UTF-8' ? b64ToUtf8(str) : atob(str);
      setPlainText(decoded);
      setBase64Error(false);
    } catch {
      setBase64Error(true);
    }
  }, []);

  const handlePlainChange = (val: string) => {
    if (isCalculating.current) return;
    isCalculating.current = true;
    setPlainText(val);
    encodeText(val, encoding, urlSafe, rfc2045);
    isCalculating.current = false;
  };

  const handleBase64Change = (val: string) => {
    if (isCalculating.current) return;
    isCalculating.current = true;
    setBase64Text(val);
    decodeBase64(val, encoding);
    isCalculating.current = false;
  };

  useEffect(() => {
    if (plainText) encodeText(plainText, encoding, urlSafe, rfc2045);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [encoding, urlSafe, rfc2045]);

  const loadExample = () => {
    const ex =
      lang === 'en'
        ? `Hello World! This is a beautiful & premium Base64 Encoder / Decoder.\n0123456789 +-=/`
        : `哈囉，世界！這是一個美麗、精緻的 Base64 編碼/解碼工具。\nHello World! This is a beautiful & premium Base64 Encoder / Decoder.\n0123456789 +-=/`;
    setPlainText(ex);
    encodeText(ex, encoding, urlSafe, rfc2045);
  };

  const clearPlain = () => {
    setPlainText('');
    setBase64Text('');
    setBase64Error(false);
  };

  const clearBase64 = () => {
    setBase64Text('');
    setPlainText('');
    setBase64Error(false);
  };

  const copyValue = (val: string) => {
    if (!val) {
      showToast(t.toastNoContent);
      return;
    }
    navigator.clipboard
      .writeText(val)
      .then(() => showToast(t.toastCopied))
      .catch(() => showToast(t.toastCopyFailed));
  };

  const processFile = useCallback(
    (file: File) => {
      if (file.size > 30 * 1024 * 1024) {
        showToast(t.toastFileTooLarge);
        return;
      }
      if (activeFileReaderRef.current) {
        activeFileReaderRef.current.abort();
      }

      setFileState(s => ({ ...s, file, loading: true, dataUrl: '', rawBase64: '', previewType: null }));

      const reader = new FileReader();
      activeFileReaderRef.current = reader;

      reader.onload = e => {
        if (activeFileReaderRef.current !== reader) return;
        const dataUrl = e.target?.result as string;
        const raw = dataUrl.split(',')[1];
        const type = file.type;

        let previewType: FileState['previewType'] = 'binary';
        let previewContent = '';

        if (type.startsWith('image/')) previewType = 'image';
        else if (type.startsWith('audio/')) previewType = 'audio';
        else if (type.startsWith('video/')) previewType = 'video';
        else if (type.startsWith('text/') || type === 'application/json' || type === 'application/javascript') {
          previewType = 'text';
          try {
            const safeRawChunk = raw.substring(0, 4000);
            const txt = b64ToUtf8(safeRawChunk);
            previewContent = txt.length > 3000 ? txt.substring(0, 3000) + t.truncatedSuffix : txt;
          } catch {
            previewContent = t.textDecodeFailed;
          }
        }

        setFileState({ file, dataUrl, rawBase64: raw, previewType, previewContent, loading: false });
      };
      reader.onerror = () => {
        if (activeFileReaderRef.current !== reader) return;
        showToast(t.toastReadError);
        setFileState(s => ({ ...s, loading: false }));
      };
      reader.readAsDataURL(file);
    },
    [showToast, t]
  );

  const resetFile = () => {
    if (fileInputRef.current) fileInputRef.current.value = '';
    setFileState({ file: null, dataUrl: '', rawBase64: '', previewType: null, previewContent: '', loading: false });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files[0]) processFile(e.dataTransfer.files[0]);
  };

  return (
    <>
      <ToolLayout
        title={t.title}
        subtitle={t.subtitle}
        description={t.description}
        accentColor="#ff7300"
        accentGlow="rgba(255,115,0,0.5)"
      >
        <div className={styles.container}>
          {/* Top Bar: Tabs & Language Switcher */}
          <div className="flex justify-between items-center mb-8 border-b border-border-glass pb-0 flex-wrap gap-4">
            <div className="flex gap-2">
              {(['text', 'file'] as const).map(tab => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`px-5 py-2.5 text-sm font-semibold tracking-wide cursor-pointer rounded-t-lg transition-all duration-200 ${
                    activeTab === tab
                      ? 'bg-[rgba(255,115,0,0.12)] text-[var(--theme-color,#ff7300)] border-b-2 border-[#ff7300]'
                      : 'bg-transparent text-text-sub hover:text-text-main hover:bg-white/[.04]'
                  }`}
                >
                  {tab === 'text' ? t.tabText : t.tabFile}
                </button>
              ))}
            </div>

          </div>

          {/* Text Tab Content */}
          {activeTab === 'text' && (
            <div className="grid grid-cols-2 gap-6 max-[900px]:grid-cols-1">
              {/* Plain Text Panel */}
              <div className="flex flex-col gap-3">
                <div className="flex justify-between items-center px-1">
                  <label htmlFor={plainTextId} className="text-sm font-medium text-text-sub">
                    {t.plainTextLabel}
                  </label>
                  <span className="text-xs text-text-sub">{t.charCount(plainText.length)}</span>
                </div>
                <div className={styles.panelCard}>
                  <textarea
                    id={plainTextId}
                    className={styles.customTextarea}
                    placeholder={t.placeholderPlain}
                    value={plainText}
                    onChange={e => handlePlainChange(e.target.value)}
                  />
                  <div className="flex items-center justify-between px-4 py-3 border-t border-border-glass flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <label htmlFor={encodingSelectId} className="text-sm font-medium text-text-sub">
                        {t.encodingLabel}
                      </label>
                      <select
                        id={encodingSelectId}
                        className={styles.b64Select}
                        value={encoding}
                        onChange={e => setEncoding(e.target.value as EncodingType)}
                      >
                        <option value="UTF-8">UTF-8 (Default / Universal)</option>
                        <option value="ASCII">ASCII (Basic Latin)</option>
                      </select>
                    </div>
                    <div className="flex gap-2">
                      <button type="button" onClick={loadExample} className={styles.btnSecondary}>
                        {t.exampleBtn}
                      </button>
                      <button type="button" onClick={clearPlain} className={styles.btnSecondary}>
                        {t.clearBtn}
                      </button>
                      <button type="button" onClick={() => copyValue(plainText)} className={styles.btnPrimary}>
                        {t.copyBtn}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Base64 Text Panel */}
              <div className="flex flex-col gap-3">
                <div className="flex justify-between items-center px-1">
                  <label htmlFor={base64TextId} className="text-sm font-medium text-text-sub">
                    {t.base64TextLabel}
                  </label>
                  {base64Error && (
                    <span className="flex items-center gap-1 text-xs text-red-500 font-medium">
                      <svg viewBox="0 0 24 24" width={14} height={14} fill="currentColor">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                      </svg>
                      {t.invalidFormat}
                    </span>
                  )}
                </div>
                <div className={`${styles.panelCard} ${base64Error ? styles.panelError : ''}`}>
                  <textarea
                    id={base64TextId}
                    className={styles.customTextarea}
                    placeholder={t.placeholderBase64}
                    value={base64Text}
                    onChange={e => handleBase64Change(e.target.value)}
                  />
                  <div className="flex items-center justify-between px-4 py-3 border-t border-border-glass flex-wrap gap-2">
                    <div className="flex items-center gap-4 flex-wrap">
                      <label htmlFor={urlSafeCheckboxId} className={styles.customCheckbox}>
                        <input
                          id={urlSafeCheckboxId}
                          type="checkbox"
                          checked={urlSafe}
                          onChange={e => setUrlSafe(e.target.checked)}
                        />
                        <span className={styles.checkmark} />
                        <span>{t.urlSafeLabel}</span>
                      </label>

                      <label htmlFor={rfc2045CheckboxId} className={styles.customCheckbox}>
                        <input
                          id={rfc2045CheckboxId}
                          type="checkbox"
                          checked={rfc2045}
                          onChange={e => setRfc2045(e.target.checked)}
                        />
                        <span className={styles.checkmark} />
                        <span>{t.rfc2045Label}</span>
                      </label>
                    </div>
                    <div className="flex gap-2">
                      <button type="button" onClick={clearBase64} className={styles.btnSecondary}>
                        {t.clearBtn}
                      </button>
                      <button type="button" onClick={() => copyValue(base64Text)} className={styles.btnPrimary}>
                        {t.copyBtn}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* File Tab Content */}
          {activeTab === 'file' && (
            <div className="flex flex-col gap-6">
              {!fileState.file && (
                <div
                  onClick={() => fileInputRef.current?.click()}
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
                  className={`${styles.dropzone} ${isDragOver ? styles.dropzoneActive : ''}`}
                >
                  <label htmlFor={fileInputId} className="sr-only">
                    {t.tabFile}
                  </label>
                  <input
                    id={fileInputId}
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={e => {
                      if (e.target.files?.[0]) processFile(e.target.files[0]);
                    }}
                  />
                  <svg
                    viewBox="0 0 24 24"
                    className="w-12 h-12 text-text-sub fill-none stroke-current"
                    strokeWidth={1.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                  <span className="text-base text-text-sub font-medium">{t.dropzoneText}</span>
                  <span className="text-xs text-text-sub opacity-80">{t.dropzoneSub}</span>
                </div>
              )}

              {fileState.file && (
                <div className={`${styles.panelCard} p-6 flex flex-col gap-5`}>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-[rgba(255,115,0,0.12)] rounded-lg flex items-center justify-center shrink-0">
                      <svg viewBox="0 0 24 24" width={22} height={22} fill="#ff7300">
                        <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
                      </svg>
                    </div>
                    <div className="flex flex-col flex-1 min-w-0">
                      <span className="text-sm font-semibold text-text-main truncate">{fileState.file.name}</span>
                      <span className="text-xs text-text-sub">
                        {formatBytes(fileState.file.size)} | {fileState.file.type || 'Unknown Type'}
                      </span>
                    </div>
                    <button type="button" onClick={resetFile} className={styles.btnSecondary}>
                      {t.removeFile}
                    </button>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-3 flex-wrap">
                      <span className="text-xs font-semibold text-text-sub uppercase tracking-wide">
                        {t.dataPreview}
                      </span>
                      {fileState.previewType === 'text' && fileState.file && fileState.file.size > 3000 && (
                        <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20 font-medium">
                          <svg viewBox="0 0 24 24" width={12} height={12} fill="currentColor">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
                          </svg>
                          {t.previewTruncatedBadge}
                        </span>
                      )}
                    </div>
                    <div className={styles.previewBox}>
                      {fileState.loading && <div className={styles.spinner} />}
                      {!fileState.loading && fileState.previewType === 'image' && (
                        <img src={fileState.dataUrl} alt={fileState.file.name} className={styles.previewImg} />
                      )}
                      {!fileState.loading && fileState.previewType === 'audio' && (
                        <audio src={fileState.dataUrl} controls className="w-full" />
                      )}
                      {!fileState.loading && fileState.previewType === 'video' && (
                        <video src={fileState.dataUrl} controls className="w-full max-h-[300px]" />
                      )}
                      {!fileState.loading && fileState.previewType === 'text' && (
                        <pre className="w-full max-h-[200px] overflow-y-auto font-mono text-sm text-text-main whitespace-pre-wrap break-all text-left">
                          {fileState.previewContent}
                        </pre>
                      )}
                      {!fileState.loading && fileState.previewType === 'binary' && (
                        <div className="text-center text-text-sub text-sm">
                          <svg
                            viewBox="0 0 24 24"
                            width={40}
                            height={40}
                            fill="currentColor"
                            className="mx-auto mb-2 opacity-40"
                          >
                            <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
                          </svg>
                          {t.binaryNoPreview}
                        </div>
                      )}
                    </div>
                  </div>

                  {fileState.rawBase64 && (
                    <div className="flex flex-col gap-4">
                      {[
                        { label: t.dataUrlLabel, val: fileState.dataUrl, btnLabel: t.copyDataUrl },
                        { label: t.rawBase64Label, val: fileState.rawBase64, btnLabel: t.copyRawData },
                      ].map(row => (
                        <div key={row.label} className="flex flex-col gap-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-text-sub">{row.label}</span>
                            <button type="button" onClick={() => copyValue(row.val)} className={styles.btnPrimary}>
                              {row.btnLabel}
                            </button>
                          </div>
                          <textarea readOnly value={row.val} className={styles.outputTextarea} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* 常見問題 FAQ 區塊 */}
        <div className="mt-8">
          <FaqSection
            title={t.faqTitle}
            subtitle={t.faqSubtitle}
            items={t.faqItems}
            accentColor="#00d2ff"
          />
        </div>
      </ToolLayout>

      {/* Toast Notification */}
      <div
        className={`fixed bottom-8 right-8 flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-xl z-[100] pointer-events-none
          bg-surface-glass border border-border-glass backdrop-blur-[16px] text-text-main shadow-lg
          transition-all duration-300 ${toast.show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
      >
        <svg viewBox="0 0 24 24" width={16} height={16} fill="#ff7300">
          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
        </svg>
        {toast.msg}
      </div>
    </>
  );
}
