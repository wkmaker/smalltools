'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
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
}

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
  if (!rawText.trim()) return { meta: { protocol: '-', host: '-', pathname: '-' }, params: [], isFullUrl: false, urlObj: null };

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
        protocol: isFullUrl ? urlObj.protocol : '(相對路徑)',
        host: isFullUrl ? urlObj.host : '(無)',
        pathname: urlObj.pathname,
      },
      params,
      isFullUrl,
      urlObj,
    };
  } catch {
    return { meta: { protocol: '-', host: '-', pathname: '-' }, params: [], isFullUrl: false, urlObj: null };
  }
}

let _nextParamId = 100;

export default function UrlEncoderClient() {
  const [plainText, setPlainText] = useState('');
  const [encodedText, setEncodedText] = useState('');
  const [mode, setMode] = useState<UrlMode>('component');
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
    const ex = 'https://tools.cjkuo.net/search/v1?q=哈囉 世界!&category=極客工具&debug=true#result-hash';
    handlePlainChange(ex);
  };

  const clearPanel = (which: 'plain' | 'encoded') => {
    setPlainText(''); setEncodedText(''); setEncodedError(false); setShowParser(false);
  };

  const copyValue = (val: string) => {
    if (!val) { showToast('沒有可複製的內容'); return; }
    navigator.clipboard.writeText(val).then(() => showToast('已複製到剪貼簿')).catch(() => showToast('複製失敗'));
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
        title="URL 線上編碼與解碼器"
        subtitle="URL ENCODER & DECODER"
        description="專業免費的線上 URL 編碼與解碼工具，支援 Percent-encoding 與 Unicode 即時雙向轉換，提供網址結構拆解與 Query 參數表格雙向連動編輯。"
        accentColor="#0077ff"
        accentGlow="rgba(0,119,255,0.5)"
      >
        <div className={styles.mainLayout}>
          <div className={styles.panelsGrid}>
            {/* 原始文字 */}
            <div className={`${styles.panelContainer} ${encodedError ? styles.errorState : ''}`}>
              <div className={styles.panelHeader}>
                <div className={styles.panelTitle}>原始網址 / 文字 (Plain Text)</div>
              </div>
              <div className={styles.textAreaWrapper}>
                <textarea
                  className={styles.customTextarea}
                  placeholder="在此輸入要編碼的網址或文字..."
                  value={plainText}
                  onChange={e => handlePlainChange(e.target.value)}
                />
              </div>
              <div className={styles.panelFooter}>
                <div className={styles.controlGroup}>
                  <label>編碼模式：</label>
                  <select className={styles.selectStyle} value={mode} onChange={e => setMode(e.target.value as UrlMode)}>
                    <option value="component">EncodeURIComponent (編碼所有參數)</option>
                    <option value="uri">EncodeURI (保留網址基本結構)</option>
                  </select>
                </div>
                <div className={styles.btnGroup}>
                  <button onClick={loadExample} className={styles.techBtn}>範例</button>
                  <button onClick={() => clearPanel('plain')} className={styles.techBtn}>清除</button>
                  <button onClick={() => copyValue(plainText)} className={`${styles.techBtn} ${styles.techBtnPrimary}`}>複製</button>
                </div>
              </div>
            </div>

            {/* URL 編碼文字 */}
            <div className={`${styles.panelContainer} ${encodedError ? styles.errorState : ''}`}>
              <div className={styles.panelHeader}>
                <div className={styles.panelTitle}>URL 編碼文字 (Percent-Encoded)</div>
                {encodedError && (
                  <div className={styles.errorMsg}>
                    <svg viewBox="0 0 24 24" width={14} height={14} fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                    </svg>
                    無效的 URL 編碼格式
                  </div>
                )}
              </div>
              <div className={styles.textAreaWrapper}>
                <textarea
                  className={styles.customTextarea}
                  placeholder="在此貼上已編碼的文字進行解碼..."
                  value={encodedText}
                  onChange={e => handleEncodedChange(e.target.value)}
                />
              </div>
              <div className={styles.panelFooter}>
                <div className={styles.controlGroup}>
                  <label className={styles.checkboxContainer}>
                    <input type="checkbox" checked={spacePlus} onChange={e => setSpacePlus(e.target.checked)} />
                    <span className={styles.checkmark} />
                    空格轉 + (application/x-www-form-urlencoded)
                  </label>
                </div>
                <div className={styles.btnGroup}>
                  <button onClick={() => clearPanel('encoded')} className={styles.techBtn}>清除</button>
                  <button onClick={() => copyValue(encodedText)} className={`${styles.techBtn} ${styles.techBtnPrimary}`}>複製</button>
                </div>
              </div>
            </div>
          </div>

          {/* URL 解析面板 */}
          {showParser && urlMeta && (
            <div className={styles.urlParserSection}>
              <div className={styles.panelTitle}>網址結構與 Query 參數解析 (連動編輯)</div>

              <div className={styles.urlMetaGrid}>
                {[
                  { label: '傳輸協定 (Protocol)', value: urlMeta.protocol },
                  { label: '域名主機 (Host Domain)', value: urlMeta.host },
                  { label: '路徑 (Pathname)', value: urlMeta.pathname },
                ].map(item => (
                  <div key={item.label} className={styles.metaItem}>
                    <span className={styles.metaLabel}>{item.label}</span>
                    <div className={styles.metaValueWrapper}>
                      <span className={styles.metaValue}>{item.value}</span>
                      <button onClick={() => copyValue(item.value === '-' || item.value === '(無)' ? '' : item.value)}
                        className={styles.metaCopyBtn}>
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
                      <th style={{ width: '35%' }}>參數名稱 (Query Key)</th>
                      <th style={{ width: '45%' }}>參數內容 (Value)</th>
                      <th style={{ width: '20%', textAlign: 'center' }}>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {params.map(p => (
                      <tr key={p.id}>
                        <td><input type="text" className={styles.tableInput} value={p.key} onChange={e => onParamChange(p.id, 'key', e.target.value)} /></td>
                        <td><input type="text" className={styles.tableInput} value={p.value} onChange={e => onParamChange(p.id, 'value', e.target.value)} /></td>
                        <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                          <button className={styles.techBtn} onClick={() => copyValue(p.value)} title="複製參數內容" style={{ display: 'inline-flex', padding: '0.3rem 0.6rem' }}>
                            <svg viewBox="0 0 24 24" width={12} height={12} fill="currentColor"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z" /></svg>
                          </button>
                          <button className={styles.techBtn} onClick={() => deleteParam(p.id)} title="刪除此參數" style={{ display: 'inline-flex', padding: '0.3rem 0.6rem', marginLeft: '6px' }}>
                            <svg viewBox="0 0 24 24" width={12} height={12} fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" /></svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.8rem 1rem', background: 'rgba(0, 0, 0, 0.1)', borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>共 {params.filter(p => p.key.trim()).length} 個參數</span>
                  <button onClick={addParam} className={`${styles.techBtn} ${styles.techBtnPrimary}`} style={{ padding: '0.4rem 0.8rem' }}>
                    <svg viewBox="0 0 24 24" width={14} height={14} fill="currentColor" style={{ marginRight: '2px' }}><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" /></svg>
                    新增參數行
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </ToolLayout>

      <div className={`fixed bottom-8 right-8 flex items-center gap-2 px-6 py-3 text-sm rounded-lg z-[100] pointer-events-none
        bg-[rgba(0,119,255,0.15)] border border-[rgba(0,119,255,0.3)] backdrop-blur-[10px] text-[#0077ff]
        transition-all duration-400 ${toast.show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-[100px]'}`}>
        <svg viewBox="0 0 24 24" width={16} height={16} fill="currentColor">
          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
        </svg>
        {toast.msg}
      </div>
    </>
  );
}
