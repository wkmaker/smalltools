'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import ToolLayout from '../components/ToolLayout';
import styles from './base64.module.css';

function utf8ToB64(str: string): string {
  return btoa(
    encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, p1) =>
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

export default function Base64Client() {
  const [activeTab, setActiveTab] = useState<TabType>('text');
  const [plainText, setPlainText] = useState('');
  const [base64Text, setBase64Text] = useState('');
  const [encoding, setEncoding] = useState<EncodingType>('UTF-8');
  const [urlSafe, setUrlSafe] = useState(false);
  const [rfc2045, setRfc2045] = useState(false);
  const [base64Error, setBase64Error] = useState(false);
  const [fileState, setFileState] = useState<FileState>({
    file: null, dataUrl: '', rawBase64: '', previewType: null, previewContent: '', loading: false,
  });
  const [isDragOver, setIsDragOver] = useState(false);
  const [toast, setToast] = useState<{ msg: string; show: boolean }>({ msg: '', show: false });

  const isCalculating = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((msg: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ msg, show: true });
    toastTimer.current = setTimeout(() => setToast(t => ({ ...t, show: false })), 2500);
  }, []);

  const encodeText = useCallback((text: string, enc: EncodingType, safe: boolean, wrap: boolean) => {
    if (!text) { setBase64Text(''); setBase64Error(false); return; }
    try {
      let encoded = enc === 'UTF-8' ? utf8ToB64(text) : btoa(text);
      if (safe) encoded = encoded.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
      if (wrap) {
        const chunks = encoded.match(/.{1,76}/g);
        encoded = chunks ? chunks.join('\n') : encoded;
      }
      setBase64Text(encoded);
      setBase64Error(false);
    } catch { setBase64Text(''); }
  }, []);

  const decodeBase64 = useCallback((b64: string, enc: EncodingType) => {
    if (!b64) { setPlainText(''); setBase64Error(false); return; }
    let str = b64.trim().replace(/\s/g, '');
    if (str.includes('-') || str.includes('_') || !str.includes('=')) {
      let norm = str.replace(/-/g, '+').replace(/_/g, '/');
      while (norm.length % 4) norm += '=';
      str = norm;
    }
    try {
      const decoded = enc === 'UTF-8' ? b64ToUtf8(str) : atob(str);
      setPlainText(decoded);
      setBase64Error(false);
    } catch { setBase64Error(true); }
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
    const ex = `哈囉，世界！這是一個美麗、精緻的 Base64 編碼/解碼工具。🚀\nHello World! This is a beautiful & premium Base64 Encoder / Decoder.\n0123456789 +-=/`;
    setPlainText(ex);
    encodeText(ex, encoding, urlSafe, rfc2045);
  };

  const clearPlain = () => { setPlainText(''); setBase64Text(''); setBase64Error(false); };
  const clearBase64 = () => { setBase64Text(''); setPlainText(''); setBase64Error(false); };

  const copyValue = (val: string) => {
    if (!val) { showToast('沒有可複製的內容'); return; }
    navigator.clipboard.writeText(val)
      .then(() => showToast('已複製到剪貼簿'))
      .catch(() => showToast('複製失敗，請手動複製'));
  };

  const processFile = useCallback((file: File) => {
    if (file.size > 30 * 1024 * 1024) { showToast('檔案過大，請選擇小於 30MB 的檔案'); return; }
    setFileState(s => ({ ...s, file, loading: true, dataUrl: '', rawBase64: '', previewType: null }));

    const reader = new FileReader();
    reader.onload = (e) => {
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
          const txt = b64ToUtf8(raw);
          previewContent = txt.length > 3000 ? txt.substring(0, 3000) + '\n\n... (後續內容已省略)' : txt;
        } catch { previewContent = '文字檔解析失敗'; }
      }

      setFileState({ file, dataUrl, rawBase64: raw, previewType, previewContent, loading: false });
    };
    reader.onerror = () => { showToast('檔案讀取出錯'); setFileState(s => ({ ...s, loading: false })); };
    reader.readAsDataURL(file);
  }, [showToast]);

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
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .spinner-b64 { width:40px; height:40px; border:3px solid rgba(255,115,0,0.1);
          border-top-color:#ff7300; border-radius:50%; animation:spin 1s linear infinite; }
        .custom-textarea-b64 { width:100%; min-height:180px; background:rgba(0,0,0,0.2);
          border:1px solid var(--card-border, rgba(255,255,255,0.06)); border-radius:8px; padding:1rem;
          color:var(--text-primary, #ffffff); font-family:'JetBrains Mono',monospace; font-size:0.9rem;
          outline:none; resize:vertical; transition:border-color 0.3s; }
        .custom-textarea-b64:focus { border-color:rgba(255,115,0,0.4); }
        .output-textarea-b64 { width:100%; height:90px; background:rgba(0,0,0,0.25);
          border:1px solid var(--card-border, rgba(255,255,255,0.05)); border-radius:8px; padding:0.8rem;
          color:var(--text-primary, #ffffff); font-family:'JetBrains Mono',monospace; font-size:0.875rem;
          resize:none; outline:none; }
        .b64-select { background:var(--select-bg); border:1px solid var(--card-border, rgba(255,255,255,0.08));
          border-radius:6px; padding:0.35rem 0.65rem; color:var(--text-primary, #fff); font-size:0.875rem; outline:none; cursor:pointer; }
        .custom-checkbox-b64 input { display:none; }
        .checkmark-b64 { width:16px; height:16px; border:1px solid var(--card-border, rgba(255,255,255,0.1));
          border-radius:3px; background:rgba(255,255,255,0.02);
          display:inline-block; position:relative; transition:all 0.3s; flex-shrink:0; }
        .custom-checkbox-b64 input:checked + .checkmark-b64 {
          background:#ff7300; border-color:#ff7300; box-shadow:0 0 6px rgba(255,115,0,0.5); }
        .custom-checkbox-b64 input:checked + .checkmark-b64::after {
          content:''; position:absolute; left:5px; top:1px;
          width:3px; height:7px; border:solid #030305; border-width:0 2px 2px 0; transform:rotate(45deg); }
        .preview-img-b64 { max-width:100%; max-height:300px; outline:none; }
      `}</style>

      <ToolLayout
        title="Base64 線上編碼與解碼器"
        subtitle="BASE64 ENCODER & DECODER"
        description="專業免費的線上 Base64 編碼與解碼工具，支援純文字與檔案的快速雙向轉換，提供 UTF-8 中文解碼防亂碼、Data URL 生成與多媒體預覽功能。"
        accentColor="#ff7300"
        accentGlow="rgba(255,115,0,0.5)"
      >
        <div className="flex gap-2 mb-8 border-b border-white/[.06] pb-0">
          {(['text', 'file'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-5 py-2.5 text-sm font-medium tracking-wide cursor-pointer border-none rounded-t-lg transition-all duration-200
                ${activeTab === tab
                  ? 'bg-[rgba(255,115,0,0.12)] text-[#ff7300] border-b-2 border-[#ff7300]'
                  : 'bg-transparent text-text-sub hover:text-white hover:bg-white/[.04]'}`}>
              {tab === 'text' ? '文字編解碼' : '檔案轉 Base64'}
            </button>
          ))}
        </div>

        {activeTab === 'text' && (
          <div className="grid grid-cols-2 gap-6 max-[900px]:grid-cols-1">
            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-center px-1">
                <span className="text-sm font-medium text-text-sub">純文字 (Plain Text)</span>
                <span className="text-xs text-text-sub">{plainText.length} 字元</span>
              </div>
              <div className="bg-black/20 border border-white/[.06] rounded-xl overflow-hidden">
                <textarea
                  className="custom-textarea-b64"
                  placeholder="在此輸入要編碼的文字... (支援中文/外語/表情符號)"
                  value={plainText}
                  onChange={e => handlePlainChange(e.target.value)}
                />
                <div className="flex items-center justify-between px-4 py-3 border-t border-white/[.04] flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-text-sub">編碼：</label>
                    <select className="b64-select" value={encoding} onChange={e => setEncoding(e.target.value as EncodingType)}>
                      <option value="UTF-8">UTF-8 (預設/相容性佳)</option>
                      <option value="ASCII">ASCII (英文數字)</option>
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={loadExample} className="px-3 py-1.5 text-xs bg-white/[.03] border border-white/[.08] text-[#94a3b8] rounded hover:text-white hover:bg-white/[.06] transition-all cursor-pointer">範例</button>
                    <button onClick={clearPlain} className="px-3 py-1.5 text-xs bg-white/[.03] border border-white/[.08] text-[#94a3b8] rounded hover:text-white hover:bg-white/[.06] transition-all cursor-pointer">清除</button>
                    <button onClick={() => copyValue(plainText)} className="px-3 py-1.5 text-xs bg-[rgba(255,115,0,0.12)] border border-[rgba(255,115,0,0.3)] text-[#ff7300] rounded hover:bg-[#ff7300] hover:text-[#030305] transition-all cursor-pointer font-medium">複製</button>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-center px-1">
                <span className="text-sm font-medium text-[#94a3b8]">Base64 編碼文字</span>
                {base64Error && (
                  <span className="flex items-center gap-1 text-xs text-[#ff3366]">
                    <svg viewBox="0 0 24 24" width={12} height={12} fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                    </svg>
                    無效的 Base64 格式
                  </span>
                )}
              </div>
              <div className={`bg-black/20 border rounded-xl overflow-hidden transition-colors ${base64Error ? 'border-[rgba(255,51,102,0.4)]' : 'border-white/[.06]'}`}>
                <textarea
                  className="custom-textarea-b64"
                  placeholder="在此貼上 Base64 代碼進行解碼..."
                  value={base64Text}
                  onChange={e => handleBase64Change(e.target.value)}
                />
                <div className="flex items-center justify-between px-4 py-3 border-t border-white/[.04] flex-wrap gap-2">
                  <div className="flex items-center gap-4 flex-wrap">
                    {[
                      { label: 'URL 安全格式 (-_無等號)', val: urlSafe, set: setUrlSafe },
                      { label: '自動換行 (76字元)', val: rfc2045, set: setRfc2045 },
                    ].map(opt => (
                      <label key={opt.label} className="custom-checkbox-b64 flex items-center gap-1.5 cursor-pointer select-none text-xs text-[#d1d5db] hover:text-white transition-colors">
                        <input type="checkbox" checked={opt.val} onChange={e => opt.set(e.target.checked)} />
                        <span className="checkmark-b64" />
                        {opt.label}
                      </label>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={clearBase64} className="px-3 py-1.5 text-xs bg-white/[.03] border border-white/[.08] text-[#94a3b8] rounded hover:text-white hover:bg-white/[.06] transition-all cursor-pointer">清除</button>
                    <button onClick={() => copyValue(base64Text)} className="px-3 py-1.5 text-xs bg-[rgba(255,115,0,0.12)] border border-[rgba(255,115,0,0.3)] text-[#ff7300] rounded hover:bg-[#ff7300] hover:text-[#030305] transition-all cursor-pointer font-medium">複製</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'file' && (
          <div className="flex flex-col gap-6">
            {!fileState.file && (
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragEnter={e => { e.preventDefault(); setIsDragOver(true); }}
                onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop}
                className={`flex flex-col items-center justify-center gap-3 min-h-[200px] border-2 border-dashed rounded-2xl cursor-pointer
                  transition-all duration-300 p-8
                  ${isDragOver
                    ? 'border-[rgba(255,115,0,0.6)] bg-[rgba(255,115,0,0.05)] shadow-[0_0_30px_rgba(255,115,0,0.1)]'
                    : 'border-white/15 bg-white/[.01] hover:border-[rgba(255,115,0,0.35)] hover:bg-[rgba(255,115,0,0.02)]'
                  }`}
              >
                <input ref={fileInputRef} type="file" className="hidden" onChange={e => { if (e.target.files?.[0]) processFile(e.target.files[0]); }} />
                <svg viewBox="0 0 24 24" className="w-12 h-12 text-[#94a3b8] fill-none stroke-current" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                <div className="text-base text-[#94a3b8]">將檔案拖曳至此處，或點擊選擇檔案</div>
                <div className="text-xs text-[#64748b]">支援圖片、音訊、影片、文件等，大小建議小於 20MB</div>
              </div>
            )}

            {fileState.file && (
              <div className="flex flex-col gap-5 bg-white/[.01] border border-white/[.08] rounded-2xl p-6">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-[rgba(255,115,0,0.12)] rounded-lg flex items-center justify-center shrink-0">
                    <svg viewBox="0 0 24 24" width={22} height={22} fill="#ff7300">
                      <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
                    </svg>
                  </div>
                  <div className="flex flex-col flex-1 min-w-0">
                    <span className="text-sm font-medium text-white truncate">{fileState.file.name}</span>
                    <span className="text-xs text-[#64748b]">
                      {formatBytes(fileState.file.size)} | {fileState.file.type || '未知類型'}
                    </span>
                  </div>
                  <button onClick={resetFile} className="px-3 py-1.5 text-xs bg-white/[.03] border border-white/[.08] text-[#94a3b8] rounded hover:text-white hover:bg-white/[.06] transition-all cursor-pointer ml-auto shrink-0">
                    移除檔案
                  </button>
                </div>

                <div>
                  <div className="text-xs text-[#94a3b8] uppercase tracking-wide mb-3">資料預覽 (Data Preview)</div>
                  <div className="bg-black/20 border border-white/[.04] rounded-xl p-4 flex items-center justify-center min-h-[80px]">
                    {fileState.loading && <div className="spinner-b64" />}
                    {!fileState.loading && fileState.previewType === 'image' && (
                      <img src={fileState.dataUrl} alt={fileState.file.name} className="preview-img-b64" />
                    )}
                    {!fileState.loading && fileState.previewType === 'audio' && (
                      <audio src={fileState.dataUrl} controls className="w-full" />
                    )}
                    {!fileState.loading && fileState.previewType === 'video' && (
                      <video src={fileState.dataUrl} controls className="w-full max-h-[300px]" />
                    )}
                    {!fileState.loading && fileState.previewType === 'text' && (
                      <pre className="w-full max-h-[200px] overflow-y-auto font-mono text-sm text-[#a8b2d1] whitespace-pre-wrap break-all text-left">
                        {fileState.previewContent}
                      </pre>
                    )}
                    {!fileState.loading && fileState.previewType === 'binary' && (
                      <div className="text-center text-[#94a3b8] text-sm">
                        <svg viewBox="0 0 24 24" width={40} height={40} fill="currentColor" className="mx-auto mb-2 opacity-30">
                          <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
                        </svg>
                        二進制檔案，不支援即時預覽
                      </div>
                    )}
                  </div>
                </div>

                {fileState.rawBase64 && (
                  <div className="flex flex-col gap-4">
                    {[
                      { label: '完整 Data URL 格式 (可用於 HTML/CSS)', val: fileState.dataUrl, btnLabel: '複製 Data URL' },
                      { label: '純 Base64 編碼數據 (Raw Base64)', val: fileState.rawBase64, btnLabel: '複製純數據' },
                    ].map(row => (
                      <div key={row.label} className="flex flex-col gap-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-[#94a3b8]">{row.label}</span>
                          <button onClick={() => copyValue(row.val)}
                            className="px-3 py-1.5 text-xs bg-[rgba(255,115,0,0.12)] border border-[rgba(255,115,0,0.3)] text-[#ff7300] rounded hover:bg-[#ff7300] hover:text-[#030305] transition-all cursor-pointer">
                            {row.btnLabel}
                          </button>
                        </div>
                        <textarea readOnly value={row.val} className="output-textarea-b64" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </ToolLayout>

      <div className={`fixed bottom-8 right-8 flex items-center gap-2 px-6 py-3 text-sm rounded-lg z-[100] pointer-events-none
        bg-[rgba(255,115,0,0.15)] border border-[rgba(255,115,0,0.3)] backdrop-blur-[10px] text-[#ff7300]
        transition-all duration-400 ${toast.show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-[100px]'}`}>
        <svg viewBox="0 0 24 24" width={16} height={16} fill="currentColor">
          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
        </svg>
        {toast.msg}
      </div>
    </>
  );
}
