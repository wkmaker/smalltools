'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import ToolLayout from '../components/ToolLayout';


function TreeNode({ data, isLast, name }: { data: any; isLast: boolean; name?: string }) {
  const [collapsed, setCollapsed] = useState(false);

  if (data === null) {
    return (
      <div className="font-mono text-sm leading-6">
        {name && <span className="text-[#e06c75]">{name}: </span>}
        <span className="text-[#c678dd] italic">null</span>
        {!isLast && <span className="text-[#abb2bf]">,</span>}
      </div>
    );
  }

  const type = typeof data;

  if (type === 'boolean') {
    return (
      <div className="font-mono text-sm leading-6">
        {name && <span className="text-[#e06c75]">{name}: </span>}
        <span className="text-[#56b6c2]">{String(data)}</span>
        {!isLast && <span className="text-[#abb2bf]">,</span>}
      </div>
    );
  }

  if (type === 'number') {
    return (
      <div className="font-mono text-sm leading-6">
        {name && <span className="text-[#e06c75]">{name}: </span>}
        <span className="text-[#d19a66]">{data}</span>
        {!isLast && <span className="text-[#abb2bf]">,</span>}
      </div>
    );
  }

  if (type === 'string') {
    return (
      <div className="font-mono text-sm leading-6">
        {name && <span className="text-[#e06c75]">{name}: </span>}
        <span className="text-[#98c379]">"{data}"</span>
        {!isLast && <span className="text-[#abb2bf]">,</span>}
      </div>
    );
  }

  if (Array.isArray(data)) {
    return (
      <div className="font-mono text-sm leading-6">
        <span
          onClick={() => setCollapsed(!collapsed)}
          className="cursor-pointer select-none text-xs text-text-sub hover:text-[#ff00aa] mr-1 inline-block transition-transform duration-200"
          style={{ transform: collapsed ? 'rotate(0deg)' : 'rotate(90deg)' }}
        >
          ▶
        </span>
        {name && <span className="text-[#e06c75]">{name}: </span>}
        <span className="text-[#e5c07b] font-bold">[</span>
        {collapsed ? (
          <span className="text-xs text-text-sub mx-1">... Array({data.length}) ...</span>
        ) : (
          <div className="pl-4 border-l border-white/[.08] my-0.5">
            {data.map((item, idx) => (
              <TreeNode key={idx} data={item} isLast={idx === data.length - 1} />
            ))}
          </div>
        )}
        <span className="text-[#e5c07b] font-bold">]</span>
        {!isLast && <span className="text-[#abb2bf]">,</span>}
      </div>
    );
  }

  if (type === 'object') {
    const keys = Object.keys(data);
    return (
      <div className="font-mono text-sm leading-6">
        <span
          onClick={() => setCollapsed(!collapsed)}
          className="cursor-pointer select-none text-xs text-text-sub hover:text-[#ff00aa] mr-1 inline-block transition-transform duration-200"
          style={{ transform: collapsed ? 'rotate(0deg)' : 'rotate(90deg)' }}
        >
          ▶
        </span>
        {name && <span className="text-[#e06c75]">{name}: </span>}
        <span className="text-[#e5c07b] font-bold">&#123;</span>
        {collapsed ? (
          <span className="text-xs text-text-sub mx-1">... Object({keys.length}) ...</span>
        ) : (
          <div className="pl-4 border-l border-white/[.08] my-0.5">
            {keys.map((key, idx) => (
              <TreeNode key={key} name={`"${key}"`} data={data[key]} isLast={idx === keys.length - 1} />
            ))}
          </div>
        )}
        <span className="text-[#e5c07b] font-bold">&#125;</span>
        {!isLast && <span className="text-[#abb2bf]">,</span>}
      </div>
    );
  }

  return null;
}

export default function JsonFormatterClient() {
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

  const processJson = useCallback((text: string, space: number) => {
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
      setLintError({ title: 'JSON 語法錯誤', msg: err.message || '無法解析 JSON 格式' });
    }
  }, []);

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
        site: 'SmallTools 工具庫',
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
      showToast('無可複製的內容');
      return;
    }
    navigator.clipboard.writeText(content).then(() => showToast('已複製到剪貼簿')).catch(() => showToast('複製失敗'));
  };

  const downloadJson = () => {
    const content = formattedText || inputText;
    if (!content) {
      showToast('內容為空無法匯出');
      return;
    }
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'formatted.json';
    a.click();
    URL.revokeObjectURL(url);
    showToast('已匯出 JSON 檔案');
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
      <style>{`
        .json-textarea-field { width:100%; height:100%; min-height:420px; background:transparent;
          border:none; outline:none; color:#fff; padding:1.2rem; font-family:'JetBrains Mono',monospace;
          font-size:0.95rem; line-height:1.5; resize:none; }
      `}</style>

      <ToolLayout
        title="JSON 格式化與美化器"
        subtitle="JSON FORMATTER & MINIFIER"
        description="專業免費的線上 JSON 格式化與美化器，支援即時語法 Lint 驗證定位、多縮排格式排版、單行壓縮與互動式樹狀檢視。"
        accentColor="#ff00aa"
        accentGlow="rgba(255,0,170,0.5)"
      >
        <div className="grid grid-cols-2 gap-8 mb-6 max-[900px]:grid-cols-1">
          <div className="bg-white/[.02] border border-white/[.08] rounded-2xl p-6 flex flex-col gap-4 min-w-0">
            <div className="flex items-center justify-between">
              <span className="text-base font-medium text-white tracking-wide">原始 JSON 輸入</span>
              <div className="flex items-center gap-2">
                <button onClick={loadExample} className="px-3 py-1.5 text-sm font-medium bg-white/[.03] border border-white/[.08] text-text-sub rounded hover:text-white hover:bg-white/[.06] transition-all cursor-pointer">載入範例</button>
                <button onClick={clearInput} className="px-3 py-1.5 text-sm font-medium bg-white/[.03] border border-white/[.08] text-text-sub rounded hover:text-white hover:bg-white/[.06] transition-all cursor-pointer">清除</button>
              </div>
            </div>

            <div
              onDragEnter={e => { e.preventDefault(); setIsDragOver(true); }}
              onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleDrop}
              className={`relative flex-1 bg-white/[.035] border rounded-xl overflow-hidden transition-all shadow-[inset_0_2px_6px_rgba(0,0,0,0.5)]
                ${isDragOver
                  ? 'border-[#ff00aa] bg-[rgba(255,0,170,0.03)] shadow-[0_0_15px_rgba(255,0,170,0.25)]'
                  : 'border-white/15 focus-within:border-[#ff00aa] focus-within:shadow-[0_0_15px_rgba(255,0,170,0.35)]'
                }`}
            >
              <textarea
                className="json-textarea-field"
                placeholder="貼上或拖曳 JSON 內容至此處..."
                value={inputText}
                onChange={e => handleInputChange(e.target.value)}
              />
              <input ref={fileInputRef} type="file" accept=".json,text/plain" className="hidden"
                onChange={e => {
                  const f = e.target.files?.[0];
                  if (f) {
                    const r = new FileReader();
                    r.onload = ev => { if (ev.target?.result) handleInputChange(ev.target.result as string); };
                    r.readAsText(f);
                  }
                }}
              />
            </div>

            {lintError && (
              <div className="flex items-start gap-3 bg-[rgba(255,68,68,0.07)] border border-[rgba(255,68,68,0.25)] rounded-xl p-3 text-xs text-[#ff9999]">
                <svg viewBox="0 0 24 24" width={18} height={18} fill="#ff4444" className="shrink-0 mt-0.5">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                </svg>
                <div className="flex flex-col gap-0.5">
                  <span className="font-bold text-[#ff4444]">{lintError.title}</span>
                  <span className="font-mono break-all">{lintError.msg}</span>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white/[.02] border border-white/[.08] rounded-2xl p-6 flex flex-col gap-4 min-w-0">
            <div className="flex items-center justify-between flex-wrap gap-2 border-b border-white/[.06] pb-3">
              <div className="flex gap-2">
                {(['formatted', 'minified', 'tree'] as const).map(tab => (
                  <button key={tab} onClick={() => setActiveTab(tab)}
                    className={`px-3.5 py-1.5 text-sm font-medium rounded-lg cursor-pointer transition-all border-none
                      ${activeTab === tab
                        ? 'bg-[rgba(255,0,170,0.15)] text-[#ff00aa] border border-[rgba(255,0,170,0.3)] shadow-[0_0_10px_rgba(255,0,170,0.2)]'
                        : 'bg-transparent text-text-sub hover:text-white hover:bg-white/[.04]'
                      }`}
                  >
                    {tab === 'formatted' && '美化 (Format)'}
                    {tab === 'minified' && '單行壓縮 (Minify)'}
                    {tab === 'tree' && '樹狀結構 (Tree)'}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-3">
                {activeTab === 'formatted' && (
                  <div className="flex items-center gap-1.5 text-sm font-medium text-text-sub">
                    <span>縮排:</span>
                    <select
                      className="bg-select-bg border border-border-glass rounded px-2 py-1 text-text-main text-xs outline-none cursor-pointer"
                      value={indentSize}
                      onChange={e => handleIndentChange(Number(e.target.value))}
                    >
                      <option value={2}>2 空格</option>
                      <option value={4}>4 空格</option>
                      <option value={8}>8 空格</option>
                    </select>
                  </div>
                )}
                <button onClick={copyResult} className="px-3 py-1.5 text-sm bg-[rgba(255,0,170,0.12)] border border-[rgba(255,0,170,0.3)] text-[#ff00aa] rounded hover:bg-[#ff00aa] hover:text-[#030305] transition-all cursor-pointer font-medium">
                  複製
                </button>
                <button onClick={downloadJson} className="px-3 py-1.5 text-sm font-medium bg-white/[.03] border border-white/[.08] text-text-sub rounded hover:text-white hover:bg-white/[.06] transition-all cursor-pointer">
                  下載 .json
                </button>
              </div>
            </div>

            <div className="flex-1 bg-white/[.02] border border-white/[.08] rounded-xl overflow-auto p-4 max-h-[500px] min-h-[420px] shadow-[inset_0_2px_6px_rgba(0,0,0,0.5)]">
              {!inputText.trim() && (
                <div className="flex items-center justify-center h-full text-sm text-text-sub">
                  請在左側輸入或拖曳 JSON 內容
                </div>
              )}

              {inputText.trim() && lintError && (
                <div className="flex items-center justify-center h-full text-sm text-[#ff4444]/60">
                  語法錯誤，無法展示結果
                </div>
              )}

              {inputText.trim() && !lintError && activeTab === 'formatted' && (
                <pre className="font-mono text-sm text-[#e5c07b] leading-relaxed whitespace-pre-wrap break-all">
                  {formattedText}
                </pre>
              )}

              {inputText.trim() && !lintError && activeTab === 'minified' && (
                <pre className="font-mono text-sm text-[#e5c07b] leading-relaxed whitespace-pre-wrap break-all">
                  {minifiedText}
                </pre>
              )}

              {inputText.trim() && !lintError && activeTab === 'tree' && parsedObject && (
                <div className="p-2">
                  <TreeNode data={parsedObject} isLast={true} />
                </div>
              )}
            </div>
          </div>
        </div>
      </ToolLayout>

      <div className={`fixed bottom-8 right-8 flex items-center gap-2 px-6 py-3 text-sm rounded-lg z-[100] pointer-events-none
        bg-[rgba(255,0,170,0.15)] border border-[rgba(255,0,170,0.3)] backdrop-blur-[10px] text-[#ff00aa]
        transition-all duration-400 ${toast.show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-[100px]'}`}>
        <svg viewBox="0 0 24 24" width={16} height={16} fill="currentColor">
          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
        </svg>
        {toast.msg}
      </div>
    </>
  );
}
