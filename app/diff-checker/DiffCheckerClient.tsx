'use client';

import { useState, useEffect, useLayoutEffect, useCallback, useRef, useId } from 'react';
import * as Diff from 'diff';
import ToolLayout from '../components/ToolLayout';
import styles from './diff-checker.module.css';

// Split 視窗單列型態
interface SplitRow {
  leftLineNum?: number;
  leftContent?: string;
  leftType?: 'removed' | 'unchanged' | 'empty';
  rightLineNum?: number;
  rightContent?: string;
  rightType?: 'added' | 'unchanged' | 'empty';
}

// Unified 視窗互動式決策列型態
interface UnifiedDecision {
  id: number;
  type: 'keep' | 'removed' | 'added';
  text: string;
  leftLineNum?: number;
  rightLineNum?: number;
  state: 'active' | 'skipped';
  defaultState: 'active' | 'skipped';
}

export default function DiffCheckerClient() {
  // --- 預設範例文字 ---
  const [originalText, setOriginalText] = useState<string>(
    '// 原始版本範例程式碼\nfunction calculateTotal(price, tax) {\n  return price + tax;\n}\nconsole.log(calculateTotal(100, 5));'
  );
  const [modifiedText, setModifiedText] = useState<string>(
    '// 修改後版本範例程式碼\nfunction calculateTotal(price, tax, discount = 0) {\n  const subtotal = price + tax;\n  return subtotal - discount;\n}\nconsole.log(calculateTotal(100, 5, 10));'
  );

  // --- UI 與設定狀態 ---
  const [viewMode, setViewMode] = useState<'split' | 'unified'>('split');
  const [ignoreCase, setIgnoreCase] = useState<boolean>(false);
  const [isEditorVisible, setIsEditorVisible] = useState<boolean>(true);

  // --- 比對計算結果 ---
  const [splitRows, setSplitRows] = useState<SplitRow[]>([]);
  const [unifiedDecisions, setUnifiedDecisions] = useState<UnifiedDecision[]>([]);
  const [mergeResultText, setMergeResultText] = useState<string>('');
  const [addedCount, setAddedCount] = useState<number>(0);
  const [removedCount, setRemovedCount] = useState<number>(0);

  // --- 拖曳 Highlight 狀態 ---
  const [isLeftDragOver, setIsLeftDragOver] = useState<boolean>(false);
  const [isRightDragOver, setIsRightDragOver] = useState<boolean>(false);

  // --- Toast 狀態 ---
  const [toast, setToast] = useState<string>('');

  // --- HTML ID 宣告 ---
  const originalInputId = useId();
  const modifiedInputId = useId();

  // --- Scroll Synchronization Refs ---
  const leftPaneRef = useRef<HTMLDivElement>(null);
  const rightPaneRef = useRef<HTMLDivElement>(null);
  const isSyncingLeft = useRef<boolean>(false);
  const isSyncingRight = useRef<boolean>(false);
  const mergeTextareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustMergeTextareaHeight = useCallback(() => {
    const el = mergeTextareaRef.current;
    if (!el) return;

    // 1. 記錄變更前頁面捲動位置
    const currentScrollY = window.scrollY;

    // 2. 高度計算
    el.style.height = 'auto';
    const newHeight = Math.max(80, el.scrollHeight);
    el.style.height = `${newHeight}px`;

    // 3. 瞬間還原捲動位置，消除瀏覽器因為 DOM 暫時坍塌導致的跳頁問題
    window.scrollTo(window.scrollX, currentScrollY);
  }, []);

  // 初始化主題顏色
  useEffect(() => {
    document.documentElement.style.setProperty('--theme-color', '#8b5cf6');
    document.documentElement.style.setProperty('--accent-glow', 'rgba(139, 92, 246, 0.6)');
  }, []);

  // 使用 useLayoutEffect 在 Paint 之前完成微調，徹底避免畫面閃爍與跳捲
  useLayoutEffect(() => {
    if (viewMode === 'unified') {
      adjustMergeTextareaHeight();
    }
  }, [mergeResultText, viewMode, adjustMergeTextareaHeight]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  };

  // 輔助函數：換行符與字串規範化
  const normalizeNewlines = (str: string): string => {
    if (!str) return '';
    return str.replace(/\r\n/g, '\n').replace(/\n*$/, '\n');
  };

  const getLines = (str: string): string[] => {
    const lines = str.split(/\r?\n/);
    if (lines.length > 0 && lines[lines.length - 1] === '') {
      lines.pop();
    }
    return lines;
  };

  // 核心比對處理：Myers 演算法 (`Diff.diffLines`)
  const runDiff = useCallback(() => {
    const oldStr = normalizeNewlines(originalText);
    const newStr = normalizeNewlines(modifiedText);

    const diffParts = (Diff.diffLines as any)(oldStr, newStr, { ignoreCase });

    let totalAdd = 0;
    let totalRem = 0;

    // === 1. 計算 Split 雙欄視窗對齊列 ===
    const newSplitRows: SplitRow[] = [];
    let leftLineNum = 1;
    let rightLineNum = 1;

    let pendingRemoved: string[] = [];
    let pendingAdded: string[] = [];

    const flushPending = () => {
      const maxLen = Math.max(pendingRemoved.length, pendingAdded.length);
      for (let i = 0; i < maxLen; i++) {
        const row: SplitRow = {};
        if (i < pendingRemoved.length) {
          row.leftLineNum = leftLineNum++;
          row.leftContent = pendingRemoved[i];
          row.leftType = 'removed';
        } else {
          row.leftType = 'empty';
        }

        if (i < pendingAdded.length) {
          row.rightLineNum = rightLineNum++;
          row.rightContent = pendingAdded[i];
          row.rightType = 'added';
        } else {
          row.rightType = 'empty';
        }
        newSplitRows.push(row);
      }
      pendingRemoved = [];
      pendingAdded = [];
    };

    diffParts.forEach((part: Diff.Change) => {
      const lines = getLines(part.value);
      if (part.removed) {
        pendingRemoved.push(...lines);
        totalRem += lines.length;
      } else if (part.added) {
        pendingAdded.push(...lines);
        totalAdd += lines.length;
      } else {
        flushPending();
        lines.forEach((line) => {
          newSplitRows.push({
            leftLineNum: leftLineNum++,
            leftContent: line,
            leftType: 'unchanged',
            rightLineNum: rightLineNum++,
            rightContent: line,
            rightType: 'unchanged',
          });
        });
      }
    });
    flushPending();

    setSplitRows(newSplitRows);
    setAddedCount(totalAdd);
    setRemovedCount(totalRem);

    // === 2. 計算 Unified 單欄混合與互動式決策列表 ===
    const newDecisions: UnifiedDecision[] = [];
    let uLeftNum = 1;
    let uRightNum = 1;
    let decIndex = 0;

    diffParts.forEach((part: Diff.Change) => {
      const lines = getLines(part.value);
      if (part.removed) {
        lines.forEach((line) => {
          newDecisions.push({
            id: decIndex++,
            type: 'removed',
            text: line,
            leftLineNum: uLeftNum++,
            state: 'skipped',
            defaultState: 'skipped',
          });
        });
      } else if (part.added) {
        lines.forEach((line) => {
          newDecisions.push({
            id: decIndex++,
            type: 'added',
            text: line,
            rightLineNum: uRightNum++,
            state: 'active',
            defaultState: 'active',
          });
        });
      } else {
        lines.forEach((line) => {
          newDecisions.push({
            id: decIndex++,
            type: 'keep',
            text: line,
            leftLineNum: uLeftNum++,
            rightLineNum: uRightNum++,
            state: 'active',
            defaultState: 'active',
          });
        });
      }
    });

    setUnifiedDecisions(newDecisions);

    // 初始構建合併結果
    const initialMergedText = newDecisions
      .filter((d) => d.state === 'active')
      .map((d) => d.text)
      .join('\n');
    setMergeResultText(initialMergedText);
  }, [originalText, modifiedText, ignoreCase]);

  // 監聽文字或設定變化，觸發比對
  useEffect(() => {
    runDiff();
  }, [runDiff]);

  // --- 雙欄同步滾動鎖定事件處理 ---
  const handleLeftScroll = () => {
    if (!isSyncingLeft.current && leftPaneRef.current && rightPaneRef.current) {
      isSyncingRight.current = true;
      rightPaneRef.current.scrollTop = leftPaneRef.current.scrollTop;
      rightPaneRef.current.scrollLeft = leftPaneRef.current.scrollLeft;
    }
    isSyncingLeft.current = false;
  };

  const handleRightScroll = () => {
    if (!isSyncingRight.current && leftPaneRef.current && rightPaneRef.current) {
      isSyncingLeft.current = true;
      leftPaneRef.current.scrollTop = rightPaneRef.current.scrollTop;
      leftPaneRef.current.scrollLeft = rightPaneRef.current.scrollLeft;
    }
    isSyncingRight.current = false;
  };

  // --- 操作按鈕功能 ---
  const swapDocuments = () => {
    setOriginalText(modifiedText);
    setModifiedText(originalText);
    showToast('已完成左右文件交換');
  };

  const clearAll = () => {
    setOriginalText('');
    setModifiedText('');
    showToast('已清空所有內容');
  };

  const toggleEditorVisibility = () => {
    setIsEditorVisible(!isEditorVisible);
  };

  // --- 檔案拖曳讀取處理 ---
  const handleDropFile = (file: File, target: 'left' | 'right') => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = (e.target?.result as string) || '';
      if (target === 'left') {
        setOriginalText(content);
      } else {
        setModifiedText(content);
      }
      showToast(`已成功載入檔案：${file.name}`);
    };
    reader.readAsText(file);
  };

  // --- Unified 互動式行切換處理 ---
  const toggleUnifiedLine = (idx: number) => {
    setUnifiedDecisions((prev) => {
      const next = [...prev];
      const dec = { ...next[idx] };

      const isDefault = dec.state === dec.defaultState;
      if (isDefault) {
        dec.state = dec.defaultState === 'active' ? 'skipped' : 'active';
      } else {
        dec.state = dec.defaultState;
      }

      next[idx] = dec;

      // 同步更新合併結果
      const newMergedText = next
        .filter((d) => d.state === 'active')
        .map((d) => d.text)
        .join('\n');
      setMergeResultText(newMergedText);

      return next;
    });
  };

  // --- 複製合併結果 ---
  const copyMergeResult = async () => {
    try {
      await navigator.clipboard.writeText(mergeResultText);
      showToast('✓ 已複製合併結果至剪貼簿！');
    } catch (err) {
      showToast('複製失敗，請手動複製文字框內容。');
    }
  };

  return (
    <ToolLayout
      title="兩份文件比對工具"
      subtitle="TEXT DIFF CHECKER"
      description="專業免費的線上文件比對工具 (Text Diff Checker)！支援 Myers 演算法精確對比、雙欄同步滾動鎖定、檔案拖曳匯入與 Unified 互動式逐行合併。"
      accentColor="#8b5cf6"
      accentGlow="rgba(139, 92, 246, 0.6)"
    >
      <div className="flex flex-col gap-6 text-left w-full px-4 max-sm:px-0">
        {/* 控制設定列 */}
        <div className="bg-black/20 border border-white/[.08] rounded-2xl p-4 sm:p-6 flex items-center justify-between flex-wrap gap-4 backdrop-blur-md">
          <div className="flex items-center gap-4 flex-wrap">
            {/* 模式切換 */}
            <div className="flex bg-black/40 p-1 rounded-xl border border-white/[.08]">
              <button
                type="button"
                onClick={() => setViewMode('split')}
                className={`px-4 py-1.5 text-sm rounded-lg cursor-pointer transition-all font-semibold ${
                  viewMode === 'split'
                    ? 'bg-[#8b5cf6]/20 border border-[#8b5cf6]/40 text-[#8b5cf6] shadow-[0_0_10px_rgba(139,92,246,0.2)]'
                    : 'text-text-sub hover:text-white'
                }`}
              >
                左右對比 (Split)
              </button>
              <button
                type="button"
                onClick={() => setViewMode('unified')}
                className={`px-4 py-1.5 text-sm rounded-lg cursor-pointer transition-all font-semibold ${
                  viewMode === 'unified'
                    ? 'bg-[#8b5cf6]/20 border border-[#8b5cf6]/40 text-[#8b5cf6] shadow-[0_0_10px_rgba(139,92,246,0.2)]'
                    : 'text-text-sub hover:text-white'
                }`}
              >
                單欄混合 (Unified)
              </button>
            </div>

            {/* 忽略大小寫 Toggle */}
            <label className="flex items-center gap-2 text-sm font-medium text-text-sub cursor-pointer select-none">
              <input
                type="checkbox"
                checked={ignoreCase}
                onChange={(e) => setIgnoreCase(e.target.checked)}
                className="accent-[#8b5cf6] w-4 h-4 rounded"
              />
              忽略大小寫
            </label>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* 交換與清空按鈕 */}
            <button
              type="button"
              onClick={swapDocuments}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-text-sub bg-white/[0.03] border border-white/[0.08] rounded-xl hover:border-[#8b5cf6] hover:text-[#8b5cf6] transition-all cursor-pointer"
            >
              <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current">
                <path d="M16 17.01V10h-2v7.01h-3L15 21l4-3.99h-3zM9 3L5 6.99h3V14h2V6.99h3L9 3z" />
              </svg>
              交換左右
            </button>

            <button
              type="button"
              onClick={clearAll}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-text-sub bg-white/[0.03] border border-white/[0.08] rounded-xl hover:border-red-500/50 hover:text-red-400 transition-all cursor-pointer"
            >
              <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
              </svg>
              清除
            </button>

            <button
              type="button"
              onClick={toggleEditorVisibility}
              className="flex items-center gap-1.5 px-4 py-1.5 text-sm font-semibold text-white bg-[#8b5cf6]/20 border border-[#8b5cf6]/40 rounded-xl hover:bg-[#8b5cf6]/30 hover:border-[#8b5cf6] hover:shadow-[0_0_15px_rgba(139,92,246,0.3)] transition-all cursor-pointer"
            >
              {isEditorVisible ? '隱藏編輯器 (Show Diff Only)' : '展開編輯器 (Show Editors)'}
            </button>

            {/* 統計面板 */}
            <div className="flex items-center gap-3 text-xs font-mono bg-black/40 px-3 py-1.5 rounded-xl border border-white/[.05]">
              <span className="text-[#00ffaa]">+ {addedCount} 新增</span>
              <span className="text-[#ff3b30]">- {removedCount} 刪除</span>
            </div>
          </div>
        </div>

        {/* 文字輸入區 (雙欄拖曳) */}
        {isEditorVisible && (
          <div className="grid grid-cols-2 gap-6 max-md:grid-cols-1">
            {/* 左側：Original */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <label htmlFor={originalInputId} className="text-sm font-medium text-text-sub">
                  原始文件 (Original)
                </label>
                <span className="text-xs text-text-sub">支援拖曳 txt / code</span>
              </div>
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsLeftDragOver(true);
                }}
                onDragLeave={() => setIsLeftDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsLeftDragOver(false);
                  if (e.dataTransfer.files.length > 0) {
                    handleDropFile(e.dataTransfer.files[0], 'left');
                  }
                }}
                className={`relative rounded-xl overflow-hidden transition-all border ${
                  isLeftDragOver
                    ? styles.dropZoneDragover
                    : 'border-white/[.08] hover:border-white/20'
                }`}
              >
                <textarea
                  id={originalInputId}
                  value={originalText}
                  onChange={(e) => setOriginalText(e.target.value)}
                  placeholder="在此貼上原始文字，或將檔案拖曳至此..."
                  className="w-full h-[200px] bg-black/30 text-white p-4 font-mono text-xs outline-none focus:border-[#8b5cf6] resize-y leading-relaxed"
                />
              </div>
            </div>

            {/* 右側：Modified */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <label htmlFor={modifiedInputId} className="text-sm font-medium text-text-sub">
                  修改後文件 (Modified)
                </label>
                <span className="text-xs text-text-sub">支援拖曳 txt / code</span>
              </div>
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsRightDragOver(true);
                }}
                onDragLeave={() => setIsRightDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsRightDragOver(false);
                  if (e.dataTransfer.files.length > 0) {
                    handleDropFile(e.dataTransfer.files[0], 'right');
                  }
                }}
                className={`relative rounded-xl overflow-hidden transition-all border ${
                  isRightDragOver
                    ? styles.dropZoneDragover
                    : 'border-white/[.08] hover:border-white/20'
                }`}
              >
                <textarea
                  id={modifiedInputId}
                  value={modifiedText}
                  onChange={(e) => setModifiedText(e.target.value)}
                  placeholder="在此貼上變更後的文字，或將檔案拖曳至此..."
                  className="w-full h-[200px] bg-black/30 text-white p-4 font-mono text-xs outline-none focus:border-[#8b5cf6] resize-y leading-relaxed"
                />
              </div>
            </div>
          </div>
        )}

        {/* 比對結果預覽面板 */}
        <div className="bg-black/30 border border-white/[.08] rounded-2xl p-4 sm:p-6 flex flex-col gap-4 overflow-hidden shadow-lg backdrop-blur-md">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-semibold text-text-sub">比對分析結果</h3>
            <span className="text-xs text-text-sub">
              {viewMode === 'split' ? '雙欄同步滾動檢視' : '可點擊右側按鈕進行互動式合併'}
            </span>
          </div>

          {viewMode === 'split' ? (
            /* Split 雙視窗對齊樣式 (帶同步滾動 Lock) */
            <div
              className={`${styles.splitViewWrapper} ${
                !isEditorVisible ? 'h-[600px]' : 'h-[380px]'
              }`}
            >
              <div className={styles.splitDivider} />
              {/* 左側面板 */}
              <div
                ref={leftPaneRef}
                onScroll={handleLeftScroll}
                className={styles.diffPane}
              >
                <table className={styles.diffTable}>
                  <tbody>
                    {splitRows.map((row, idx) => (
                      <tr
                        key={idx}
                        className={
                          row.leftType === 'removed'
                            ? styles.diffRemoved
                            : row.leftType === 'empty'
                            ? styles.emptyRow
                            : styles.diffUnchanged
                        }
                      >
                        <td className={styles.lineNum}>{row.leftLineNum || ''}</td>
                        <td className={styles.codeLine}>
                          {row.leftType === 'removed' ? `- ${row.leftContent}` : row.leftContent || ''}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* 右側面板 */}
              <div
                ref={rightPaneRef}
                onScroll={handleRightScroll}
                className={styles.diffPane}
              >
                <table className={styles.diffTable}>
                  <tbody>
                    {splitRows.map((row, idx) => (
                      <tr
                        key={idx}
                        className={
                          row.rightType === 'added'
                            ? styles.diffAdded
                            : row.rightType === 'empty'
                            ? styles.emptyRow
                            : styles.diffUnchanged
                        }
                      >
                        <td className={styles.lineNum}>{row.rightLineNum || ''}</td>
                        <td className={styles.codeLine}>
                          {row.rightType === 'added' ? `+ ${row.rightContent}` : row.rightContent || ''}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* Unified 單視窗樣式 (互動式逐行選擇合併) */
            <div className="bg-black/40 border border-white/[.05] rounded-xl p-3 flex flex-col gap-1 overflow-x-auto">
              <table className={styles.unifiedTable}>
                <tbody>
                  {unifiedDecisions.map((dec, idx) => {
                    const isDefault = dec.state === dec.defaultState;
                    return (
                      <tr
                        key={idx}
                        className={`${
                          dec.type === 'removed'
                            ? styles.diffRemoved
                            : dec.type === 'added'
                            ? styles.diffAdded
                            : styles.diffUnchanged
                        } ${dec.state === 'skipped' ? styles.skipped : styles.accepted}`}
                      >
                        <td className={styles.lineNum}>{dec.leftLineNum || ''}</td>
                        <td className={styles.lineNum}>{dec.rightLineNum || ''}</td>
                        <td className={styles.codeLine}>
                          {dec.type === 'added' ? `+ ${dec.text}` : dec.type === 'removed' ? `- ${dec.text}` : `  ${dec.text}`}
                        </td>
                        <td className={styles.actionCol}>
                          {dec.type !== 'keep' && (
                            <button
                              type="button"
                              onClick={() => toggleUnifiedLine(idx)}
                              className={`${styles.actionBtn} ${
                                isDefault
                                  ? dec.type === 'removed'
                                    ? styles.restore
                                    : styles.exclude
                                  : styles.revert
                              }`}
                            >
                              {isDefault
                                ? dec.type === 'removed'
                                  ? '↩ 保留舊版'
                                  : '✕ 排除此行'
                                : '↺ 還原預設'}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* 合併結果區 (Unified 模式下顯示) */}
          {viewMode === 'unified' && (
            <div className="flex flex-col gap-3 border-t border-white/[.08] pt-4 mt-2">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-text-sub flex items-center gap-2">
                  <span>✏️ 最終合併結果</span>
                  <span className="text-xs text-text-sub font-normal">（可直接編輯此區域）</span>
                </label>
                <button
                  type="button"
                  onClick={copyMergeResult}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#00ffaa] bg-[#00ffaa]/10 border border-[#00ffaa]/30 rounded-xl hover:bg-[#00ffaa]/20 hover:shadow-[0_0_10px_rgba(0,255,170,0.2)] transition-all cursor-pointer"
                >
                  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current">
                    <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z" />
                  </svg>
                  複製結果
                </button>
              </div>
              <textarea
                ref={mergeTextareaRef}
                value={mergeResultText}
                onChange={(e) => {
                  setMergeResultText(e.target.value);
                  adjustMergeTextareaHeight();
                }}
                placeholder="（Unified 模式比對後，可在此取得動態合併結果）"
                className="w-full min-h-[80px] bg-black/40 border border-white/[.08] text-white p-3 rounded-xl font-mono text-xs outline-none focus:border-[#8b5cf6] leading-relaxed overflow-hidden transition-[height] duration-150"
              />
            </div>
          )}
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-8 right-8 px-6 py-3 text-sm font-medium rounded-xl bg-[#8b5cf6]/20 border border-[#8b5cf6]/40 text-[#8b5cf6] backdrop-blur-md shadow-lg z-50">
          {toast}
        </div>
      )}
    </ToolLayout>
  );
}
