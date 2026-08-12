'use client';

import { useState, useRef, useCallback, useEffect, useId } from 'react';
import Link from 'next/link';
import ToolLayout from '../components/ToolLayout';
import styles from './url.module.css';

type UrlMode = 'component' | 'uri';

interface QueryParam {
  id: number;
  key: string;
  value: string;
}

interface UrlMeta {
  protocol: string;
  host: string;
  pathname: string;
  hash: string;
}

interface Props {
  lang?: 'zh-TW' | 'en';
}

const TRANSLATIONS = {
  'zh-TW': {
    title: 'URL 線上編碼與解碼器',
    subtitle: 'URL ENCODER & DECODER',
    description:
      '專業免費的線上 URL 編碼與解碼工具，支援 Percent-encoding 與 Unicode 即時雙向轉換，提供網址結構拆解與 Query 參數表格雙向連動編輯。',
    langToggleLabel: 'English',
    langToggleUrl: '/url/en/',
    plainLabel: '原始網址 / 文字 (Plain Text)',
    encodedLabel: 'URL 編碼文字 (Percent-Encoded)',
    placeholderPlain: '在此輸入要編碼的網址或文字...',
    placeholderEncoded: '在此貼上已編碼的文字進行解碼...',
    modeLabel: '編碼模式：',
    modeComponent: 'EncodeURIComponent (編碼所有參數)',
    modeUri: 'EncodeURI (保留網址基本結構)',
    spacePlusLabel: '空格轉 + (application/x-www-form-urlencoded)',
    exampleBtn: '範例',
    clearBtn: '清除',
    copyBtn: '複製',
    invalidFormat: '無效的 URL 編碼格式',
    parserTitle: '網址結構與 Query 參數解析 (連動編輯)',
    protocolLabel: '傳輸協定 (Protocol)',
    hostLabel: '域名主機 (Host Domain)',
    pathLabel: '路徑 (Pathname)',
    hashLabel: '錨點 (Hash / Fragment)',
    tableKeyHeader: '參數名稱 (Query Key)',
    tableValueHeader: '參數內容 (Value)',
    tableActionsHeader: '操作',
    paramCount: (count: number) => `共 ${count} 個參數`,
    addParamBtn: '新增參數行',
    toastCopied: '已複製到剪貼簿',
    toastCopyFailed: '複製失敗，請手動複製',
    toastNoContent: '沒有可複製的內容',
  },
  en: {
    title: 'URL Encoder & Decoder',
    subtitle: 'URL ENCODER & DECODER',
    description:
      'Professional free online URL encoder and decoder tool. Instant Percent-encoding & Unicode conversion, URL structure parsing, and live interactive query parameter table editing.',
    langToggleLabel: '繁體中文',
    langToggleUrl: '/url/',
    plainLabel: 'Original URL / Text (Plain Text)',
    encodedLabel: 'URL Encoded Text (Percent-Encoded)',
    placeholderPlain: 'Type URL or text here to encode...',
    placeholderEncoded: 'Paste encoded URL string here to decode...',
    modeLabel: 'Encoding Mode:',
    modeComponent: 'EncodeURIComponent (Encode All Params)',
    modeUri: 'EncodeURI (Preserve Basic URL Structure)',
    spacePlusLabel: 'Encode Space as + (application/x-www-form-urlencoded)',
    exampleBtn: 'Sample',
    clearBtn: 'Clear',
    copyBtn: 'Copy',
    invalidFormat: 'Invalid URL encoded format',
    parserTitle: 'URL Structure & Query Parameter Parser (Interactive)',
    protocolLabel: 'Protocol',
    hostLabel: 'Host Domain',
    pathLabel: 'Pathname',
    hashLabel: 'Hash / Fragment',
    tableKeyHeader: 'Query Key',
    tableValueHeader: 'Value',
    tableActionsHeader: 'Actions',
    paramCount: (count: number) => `Total ${count} params`,
    addParamBtn: 'Add Query Row',
    toastCopied: 'Copied to clipboard',
    toastCopyFailed: 'Copy failed, please copy manually',
    toastNoContent: 'Nothing to copy',
  },
};

function smartEncodeURI(input: string): string {
  const trimText = input.trim();
  const qIndex = trimText.indexOf('?');
  if (qIndex === -1) return encodeURI(trimText);

  const basePart = trimText.substring(0, qIndex);
  const queryPart = trimText.substring(qIndex + 1);
  const encodedBase = encodeURI(basePart);
  if (!queryPart) return encodedBase + '?';

  let hashPart = '';
  let paramsStr = queryPart;
  const hashIndex = queryPart.indexOf('#');
  if (hashIndex !== -1) {
    paramsStr = queryPart.substring(0, hashIndex);
    hashPart = queryPart.substring(hashIndex);
  }

  const encodedPairs = paramsStr.split('&').map(pair => {
    if (!pair) return '';
    const eqIndex = pair.indexOf('=');
    if (eqIndex === -1) return encodeURIComponent(pair);
    return encodeURIComponent(pair.substring(0, eqIndex)) + '=' + encodeURIComponent(pair.substring(eqIndex + 1));
  });

  const encodedHash = hashPart ? '#' + encodeURI(hashPart.substring(1)) : '';
  return encodedBase + '?' + encodedPairs.filter(Boolean).join('&') + encodedHash;
}

function parseUrlStructure(rawText: string): {
  meta: UrlMeta;
  params: QueryParam[];
  isFullUrl: boolean;
  urlObj: URL | null;
} {
  if (!rawText.trim()) return { meta: { protocol: '-', host: '-', pathname: '-', hash: '-' }, params: [], isFullUrl: false, urlObj: null };

  let urlToParse = rawText.trim();
  let isFullUrl = false;

  if (/^[a-zA-Z0-9+.-]+:\/\//i.test(urlToParse)) {
    isFullUrl = true;
  } else {
    urlToParse = 'http://temporary-domain.com/' + urlToParse.replace(/^\/+/, '');
  }

  try {
    const urlObj = new URL(urlToParse);
    const params: QueryParam[] = [];
    let id = 0;
    urlObj.searchParams.forEach((value, key) => {
      params.push({ id: id++, key, value });
    });

    return {
      meta: {
        protocol: isFullUrl ? urlObj.protocol : '(Relative)',
        host: isFullUrl ? urlObj.host : '(None)',
        pathname: urlObj.pathname,
        hash: urlObj.hash || '-',
      },
      params,
      isFullUrl,
      urlObj,
    };
  } catch {
    return { meta: { protocol: '-', host: '-', pathname: '-', hash: '-' }, params: [], isFullUrl: false, urlObj: null };
  }
}

let _nextParamId = 100;

export default function UrlEncoderClient({ lang = 'zh-TW' }: Props) {
  const t = TRANSLATIONS[lang];

  const plainTextId = useId();
  const encodedTextId = useId();
  const modeSelectId = useId();
  const spacePlusId = useId();

  const [plainText, setPlainText] = useState('');
  const [encodedText, setEncodedText] = useState('');
  const [mode, setMode] = useState<UrlMode>('uri');
  const [spacePlus, setSpacePlus] = useState(false);
  const [encodedError, setEncodedError] = useState(false);
  const [urlMeta, setUrlMeta] = useState<UrlMeta | null>(null);
  const [params, setParams] = useState<QueryParam[]>([]);
  const [showParser, setShowParser] = useState(false);
  const [toast, setToast] = useState<{ msg: string; show: boolean }>({ msg: '', show: false });

  const isCalculating = useRef(false);
  const activeUrlObjRef = useRef<URL | null>(null);
  const isFullUrlRef = useRef(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    document.documentElement.style.setProperty('--theme-color', '#ff7300');
    document.documentElement.style.setProperty('--accent-glow', 'rgba(255, 115, 0, 0.6)');
  }, []);

  const showToast = useCallback((msg: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ msg, show: true });
    toastTimer.current = setTimeout(() => setToast(t => ({ ...t, show: false })), 2500);
  }, []);

  const encodeValue = useCallback((text: string, m: UrlMode, sp: boolean): string => {
    if (!text) return '';
    let encoded = m === 'component' ? encodeURIComponent(text) : smartEncodeURI(text);
    if (sp) encoded = encoded.replace(/%20/g, '+');
    return encoded;
  }, []);

  const parseAndUpdate = useCallback((text: string) => {
    if (!text.trim()) { setShowParser(false); setUrlMeta(null); setParams([]); return; }
    const { meta, params: p, isFullUrl, urlObj } = parseUrlStructure(text);
    if (urlObj) {
      activeUrlObjRef.current = urlObj;
      isFullUrlRef.current = isFullUrl;
      setUrlMeta(meta);
      setParams(p);
      setShowParser(true);
    } else {
      setShowParser(false);
    }
  }, []);

  const handlePlainChange = (val: string) => {
    if (isCalculating.current) return;
    isCalculating.current = true;
    setPlainText(val);
    try {
      const encoded = encodeValue(val, mode, spacePlus);
      setEncodedText(encoded);
      setEncodedError(false);
    } catch { setEncodedText(''); }
    isCalculating.current = false;
    parseAndUpdate(val);
  };

  const handleEncodedChange = (val: string) => {
    if (isCalculating.current) return;
    isCalculating.current = true;
    setEncodedText(val);
    if (!val) { setPlainText(''); setEncodedError(false); setShowParser(false); isCalculating.current = false; return; }
    try {
      let str = spacePlus ? val.replace(/\+/g, '%20') : val;
      const decoded = decodeURIComponent(str);
      setPlainText(decoded);
      setEncodedError(false);
      isCalculating.current = false;
      parseAndUpdate(decoded);
    } catch { setEncodedError(true); isCalculating.current = false; }
  };

  useEffect(() => {
    if (plainText) {
      const enc = encodeValue(plainText, mode, spacePlus);
      setEncodedText(enc);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, spacePlus]);

  const loadExample = () => {
    const ex = 'https://tools.cjkuo.net/search/v1?q=Hello World!&category=developer&debug=true#result-hash';
    handlePlainChange(ex);
  };

  const clearPanel = () => {
    setPlainText(''); setEncodedText(''); setEncodedError(false); setShowParser(false);
  };

  const copyValue = (val: string) => {
    if (!val) { showToast(t.toastNoContent); return; }
    navigator.clipboard.writeText(val).then(() => showToast(t.toastCopied)).catch(() => showToast(t.toastCopyFailed));
  };

  const onParamChange = (id: number, field: 'key' | 'value', val: string) => {
    const newParams = params.map(p => p.id === id ? { ...p, [field]: val } : p);
    setParams(newParams);
    rebuildFromParams(newParams);
  };

  const addParam = () => {
    const newP: QueryParam = { id: _nextParamId++, key: '', value: '' };
    const newParams = [...params, newP];
    setParams(newParams);
    rebuildFromParams(newParams);
  };

  const deleteParam = (id: number) => {
    const newParams = params.filter(p => p.id !== id);
    setParams(newParams);
    rebuildFromParams(newParams);
  };

  const rebuildFromParams = (p: QueryParam[]) => {
    if (!activeUrlObjRef.current) return;
    const activeUrl = activeUrlObjRef.current;
    const queryArr = p.filter(r => r.key.trim()).map(r => r.key + '=' + r.value);
    const searchStr = queryArr.length > 0 ? '?' + queryArr.join('&') : '';
    const newUrl = isFullUrlRef.current
      ? activeUrl.protocol + '//' + activeUrl.host + activeUrl.pathname + searchStr + activeUrl.hash
      : activeUrl.pathname.substring(1) + searchStr + activeUrl.hash;

    isCalculating.current = true;
    setPlainText(newUrl);
    try {
      const encoded = encodeValue(newUrl, mode, spacePlus);
      setEncodedText(encoded);
      setEncodedError(false);
    } catch { setEncodedText(''); }
    isCalculating.current = false;

    try {
      const urlToParse = isFullUrlRef.current
        ? newUrl
        : 'http://temporary-domain.com/' + newUrl.replace(/^\/+/, '');
      activeUrlObjRef.current = new URL(urlToParse);
    } catch {}
  };

  return (
    <>
      <ToolLayout
        title={t.title}
        subtitle={t.subtitle}
        description={t.description}
        accentColor="#ff7300"
        accentGlow="rgba(255,115,0,0.6)"
        extraHeaderControls={
          <Link
            href={t.langToggleUrl}
            className="relative inline-flex items-center justify-center gap-1.5 h-[42px] px-3.5 text-xs font-semibold rounded-xl bg-white/[.06] border border-white/10 text-text-sub hover:text-text-main backdrop-blur-md transition-all duration-300 ease-out hover:scale-105 active:scale-95 hover:border-[var(--theme-color,#ff7300)] hover:shadow-[0_0_12px_var(--theme-glow,rgba(255,115,0,0.4))] select-none"
          >
            <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 shrink-0">
              <circle cx="12" cy="12" r="10" />
              <line x1="2" y1="12" x2="22" y2="12" />
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
            <span>{t.langToggleLabel}</span>
          </Link>
        }
      >
        <div className={styles.mainLayout}>

          <div className={styles.panelsGrid}>
            {/* Plain Text Panel */}
            <div className={`${styles.panelContainer} ${encodedError ? styles.errorState : ''}`}>
              <div className={styles.panelHeader}>
                <label htmlFor={plainTextId} className="text-sm font-semibold text-text-main flex items-center gap-2 cursor-pointer">
                  <span className="w-1.5 h-4 bg-[var(--theme-color,#ff7300)] rounded-full shadow-[0_0_8px_var(--theme-color,#ff7300)] inline-block flex-shrink-0" />
                  {t.plainLabel}
                </label>
              </div>
              <div className={styles.textAreaWrapper}>
                <textarea
                  id={plainTextId}
                  className={styles.customTextarea}
                  placeholder={t.placeholderPlain}
                  value={plainText}
                  onChange={e => handlePlainChange(e.target.value)}
                />
              </div>
              <div className={styles.panelFooter}>
                <div className={styles.controlGroup}>
                  <label htmlFor={modeSelectId} className="text-sm font-medium text-text-sub flex-shrink-0">
                    {t.modeLabel}
                  </label>
                  <select id={modeSelectId} className={styles.selectStyle} value={mode} onChange={e => setMode(e.target.value as UrlMode)}>
                    <option value="uri">{t.modeUri}</option>
                    <option value="component">{t.modeComponent}</option>
                  </select>
                </div>
                <div className={styles.btnGroup}>
                  <button type="button" onClick={loadExample} className={styles.techBtn}>{t.exampleBtn}</button>
                  <button type="button" onClick={clearPanel} className={styles.techBtn}>{t.clearBtn}</button>
                  <button type="button" onClick={() => copyValue(plainText)} className={`${styles.techBtn} ${styles.techBtnPrimary}`}>{t.copyBtn}</button>
                </div>
              </div>
            </div>

            {/* URL Encoded Panel */}
            <div className={`${styles.panelContainer} ${encodedError ? styles.errorState : ''}`}>
              <div className={styles.panelHeader}>
                <label htmlFor={encodedTextId} className="text-sm font-semibold text-text-main flex items-center gap-2 cursor-pointer">
                  <span className="w-1.5 h-4 bg-[var(--theme-color,#ff7300)] rounded-full shadow-[0_0_8px_var(--theme-color,#ff7300)] inline-block flex-shrink-0" />
                  {t.encodedLabel}
                </label>
                {encodedError && (
                  <div className={styles.errorMsg}>
                    <svg viewBox="0 0 24 24" width={14} height={14} fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                    </svg>
                    {t.invalidFormat}
                  </div>
                )}
              </div>
              <div className={styles.textAreaWrapper}>
                <textarea
                  id={encodedTextId}
                  className={styles.customTextarea}
                  placeholder={t.placeholderEncoded}
                  value={encodedText}
                  onChange={e => handleEncodedChange(e.target.value)}
                />
              </div>
              <div className={styles.panelFooter}>
                <div className={styles.controlGroup}>
                  <label htmlFor={spacePlusId} className={styles.checkboxContainer}>
                    <input id={spacePlusId} type="checkbox" checked={spacePlus} onChange={e => setSpacePlus(e.target.checked)} />
                    <span className={styles.checkmark} />
                    <span>{t.spacePlusLabel}</span>
                  </label>
                </div>
                <div className={styles.btnGroup}>
                  <button type="button" onClick={clearPanel} className={styles.techBtn}>{t.clearBtn}</button>
                  <button type="button" onClick={() => copyValue(encodedText)} className={`${styles.techBtn} ${styles.techBtnPrimary}`}>{t.copyBtn}</button>
                </div>
              </div>
            </div>
          </div>

          {/* URL Parser Section */}
          {showParser && urlMeta && (
            <div className={styles.urlParserSection}>
              <div className="text-base font-semibold text-text-main flex items-center gap-2">
                <span className="w-1.5 h-4 bg-[var(--theme-color,#ff7300)] rounded-full shadow-[0_0_8px_var(--theme-color,#ff7300)] inline-block flex-shrink-0" />
                {t.parserTitle}
              </div>

              <div className={styles.urlMetaGrid}>
                {[
                  { label: t.protocolLabel, value: urlMeta.protocol },
                  { label: t.hostLabel, value: urlMeta.host },
                  { label: t.pathLabel, value: urlMeta.pathname },
                  { label: t.hashLabel, value: urlMeta.hash },
                ].map(item => (
                  <div key={item.label} className={styles.metaItem}>
                    <span className="text-xs text-text-sub uppercase tracking-[0.5px] font-semibold">{item.label}</span>
                    <div className={styles.metaValueWrapper}>
                      <span className={styles.metaValue}>{item.value}</span>
                      <button type="button" onClick={() => copyValue(item.value === '-' || item.value === '(無)' || item.value === '(None)' || item.value === '(Relative)' ? '' : item.value)}
                        className={styles.metaCopyBtn} title="Copy">
                        <svg viewBox="0 0 24 24" width={14} height={14} fill="currentColor">
                          <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className={styles.paramsTableWrapper}>
                <table className={styles.paramsTable}>
                  <thead>
                    <tr>
                      <th style={{ width: '35%' }} className="p-3 text-sm font-semibold text-text-sub">{t.tableKeyHeader}</th>
                      <th style={{ width: '45%' }} className="p-3 text-sm font-semibold text-text-sub">{t.tableValueHeader}</th>
                      <th style={{ width: '20%', textAlign: 'center' }} className="p-3 text-sm font-semibold text-text-sub">{t.tableActionsHeader}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {params.map(p => (
                      <tr key={p.id}>
                        <td><input type="text" className={styles.tableInput} value={p.key} onChange={e => onParamChange(p.id, 'key', e.target.value)} aria-label="Query Key" /></td>
                        <td><input type="text" className={styles.tableInput} value={p.value} onChange={e => onParamChange(p.id, 'value', e.target.value)} aria-label="Query Value" /></td>
                        <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                          <button type="button" className={styles.techBtn} onClick={() => copyValue(p.value)} title="Copy Value" style={{ display: 'inline-flex', padding: '0.3rem 0.6rem' }}>
                            <svg viewBox="0 0 24 24" width={12} height={12} fill="currentColor"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z" /></svg>
                          </button>
                          <button type="button" className={styles.techBtn} onClick={() => deleteParam(p.id)} title="Delete Param" style={{ display: 'inline-flex', padding: '0.3rem 0.6rem', marginLeft: '6px' }}>
                            <svg viewBox="0 0 24 24" width={12} height={12} fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" /></svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className={styles.tableFooter}>
                  <span className="text-sm font-medium text-text-sub">{t.paramCount(params.filter(p => p.key.trim()).length)}</span>
                  <button type="button" onClick={addParam} className={`${styles.techBtn} ${styles.techBtnPrimary}`} style={{ padding: '0.4rem 0.8rem' }}>
                    <svg viewBox="0 0 24 24" width={14} height={14} fill="currentColor" style={{ marginRight: '2px' }}><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" /></svg>
                    {t.addParamBtn}
                  </button>
                </div>
              </div>
            </div>
          )}
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
