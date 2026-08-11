'use client';

import { useState, useEffect, useLayoutEffect, useCallback, useRef, useId } from 'react';
import Link from 'next/link';
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

interface DiffCheckerClientProps {
  lang?: 'zh-TW' | 'en';
}

const TRANSLATIONS = {
  'zh-TW': {
    title: '兩份文件比對工具',
    subtitle: 'TEXT DIFF CHECKER',
    description:
      '專業免費的線上文件比對工具 (Text Diff Checker)！支援 Myers 演算法精確對比、雙欄同步滾動鎖定、檔案拖曳匯入與 Unified 互動式逐行合併。',
    defaultOriginal:
      '// 原始版本範例程式碼\nfunction calculateTotal(price, tax) {\n  return price + tax;\n}\nconsole.log(calculateTotal(100, 5));',
    defaultModified:
      '// 修改後版本範例程式碼\nfunction calculateTotal(price, tax, discount = 0) {\n  const subtotal = price + tax;\n  return subtotal - discount;\n}\nconsole.log(calculateTotal(100, 5, 10));',
    splitMode: '左右對比 (Split)',
    unifiedMode: '單欄混合 (Unified)',
    ignoreCase: '忽略大小寫',
    swap: '交換左右',
    swapToast: '已完成左右文件交換',
    clear: '清除',
    clearToast: '已清空所有內容',
    showDiffOnly: '隱藏編輯器 (Show Diff Only)',
    showEditors: '展開編輯器 (Show Editors)',
    addedStat: '新增',
    removedStat: '刪除',
    originalDoc: '原始文件 (Original)',
    modifiedDoc: '修改後文件 (Modified)',
    dropHint: '支援拖曳 txt / code',
    placeholderOriginal: '在此貼上原始文字，或將檔案拖曳至此...',
    placeholderModified: '在此貼上變更後的文字，或將檔案拖曳至此...',
    loadedFileToast: '已成功載入檔案：',
    analysisTitle: '比對分析結果',
    splitSubtext: '雙欄同步滾動檢視',
    unifiedSubtext: '可點擊右側按鈕進行互動式合併',
    restoreOld: '保留舊版',
    excludeLine: '✕ 排除此行',
    revertDefault: '↺ 還原預設',
    finalMergeResult: '最終合併結果',
    canEditNotice: '（可直接編輯此區域）',
    copyResult: '複製結果',
    copiedResultToast: '✓ 已複製合併結果至剪貼簿！',
    copyFailedToast: '複製失敗，請手動複製文字框內容。',
    unifiedPlaceholder: '（Unified 模式比對後，可在此取得動態合併結果）',
    toastFileTooLarge: '檔案過大，請選擇小於 10MB 的文字檔案',
    langSwitchLabel: 'English',
    langSwitchHref: '/diff-checker/en/',
  },
  en: {
    title: 'Document Diff Checker',
    subtitle: 'TEXT DIFF CHECKER',
    description:
      'Free online Document Diff Checker! Supports Myers algorithm accurate diff, synchronized side-by-side scrolling, drag & drop files, and interactive line-by-line unified merge.',
    defaultOriginal:
      '// Original Version Sample Code\nfunction calculateTotal(price, tax) {\n  return price + tax;\n}\nconsole.log(calculateTotal(100, 5));',
    defaultModified:
      '// Modified Version Sample Code\nfunction calculateTotal(price, tax, discount = 0) {\n  const subtotal = price + tax;\n  return subtotal - discount;\n}\nconsole.log(calculateTotal(100, 5, 10));',
    splitMode: 'Split View',
    unifiedMode: 'Unified View',
    ignoreCase: 'Ignore Case',
    swap: 'Swap Sides',
    swapToast: 'Swapped original and modified text',
    clear: 'Clear',
    clearToast: 'Cleared all text contents',
    showDiffOnly: 'Hide Editors (Show Diff Only)',
    showEditors: 'Show Editors',
    addedStat: 'Added',
    removedStat: 'Removed',
    originalDoc: 'Original File',
    modifiedDoc: 'Modified File',
    dropHint: 'Supports drag & drop txt / code',
    placeholderOriginal: 'Paste original text here, or drop file...',
    placeholderModified: 'Paste modified text here, or drop file...',
    loadedFileToast: 'Successfully loaded file: ',
    analysisTitle: 'Diff Analysis Result',
    splitSubtext: 'Synchronized dual-pane scrolling view',
    unifiedSubtext: 'Click action buttons on the right for interactive merge',
    restoreOld: 'Keep Old',
    excludeLine: '✕ Exclude Line',
    revertDefault: '↺ Revert Default',
    finalMergeResult: 'Final Merged Result',
    canEditNotice: '(Editable area)',
    copyResult: 'Copy Result',
    copiedResultToast: '✓ Merged result copied to clipboard!',
    copyFailedToast: 'Copy failed. Please manually copy from text area.',
    unifiedPlaceholder: '(Merged result will appear here after unified diff analysis)',
    toastFileTooLarge: 'File is too large. Please select a text file under 10MB',
    langSwitchLabel: '繁體中文',
    langSwitchHref: '/diff-checker/',
  },
};

export default function DiffCheckerClient({ lang = 'zh-TW' }: DiffCheckerClientProps) {
  const t = TRANSLATIONS[lang];

  // --- 預設範例文字 ---
  const [originalText, setOriginalText] = useState<string>(t.defaultOriginal);
  const [modifiedText, setModifiedText] = useState<string>(t.defaultModified);

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
  const mergeResultInputId = useId();

  // --- Scroll Synchronization Refs ---
  const leftPaneRef = useRef<HTMLDivElement>(null);
  const rightPaneRef = useRef<HTMLDivElement>(null);
  const isSyncingLeft = useRef<boolean>(false);
  const isSyncingRight = useRef<boolean>(false);
  const mergeTextareaRef = useRef<HTMLTextAreaElement>(null);

  const activeLeftReaderRef = useRef<FileReader | null>(null);
  const activeRightReaderRef = useRef<FileReader | null>(null);

  const adjustMergeTextareaHeight = useCallback(() => {
    const el = mergeTextareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.max(100, el.scrollHeight)}px`;
  }, []);

  // 初始化主題顏色
  useEffect(() => {
    document.documentElement.style.setProperty('--theme-color', '#8b5cf6');
    document.documentElement.style.setProperty('--accent-glow', 'rgba(139, 92, 246, 0.6)');
  }, []);

  useLayoutEffect(() => {
    if (viewMode === 'unified') {
      adjustMergeTextareaHeight();
    }
  }, [mergeResultText, viewMode, adjustMergeTextareaHeight]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  };

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

  // 核心比對處理
  const runDiff = useCallback(() => {
    const safeOldStr = originalText.length > 3000000 ? originalText.substring(0, 3000000) : originalText;
    const safeNewStr = modifiedText.length > 3000000 ? modifiedText.substring(0, 3000000) : modifiedText;

    const oldStr = normalizeNewlines(safeOldStr);
    const newStr = normalizeNewlines(safeNewStr);

    const diffParts = (Diff.diffLines as any)(oldStr, newStr, { ignoreCase });

    let totalAdd = 0;
    let totalRem = 0;

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

    const initialMergedText = newDecisions
      .filter((d) => d.state === 'active')
      .map((d) => d.text)
      .join('\n');
    setMergeResultText(initialMergedText);
  }, [originalText, modifiedText, ignoreCase]);

  useEffect(() => {
    runDiff();
  }, [runDiff]);

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

  const swapDocuments = () => {
    setOriginalText(modifiedText);
    setModifiedText(originalText);
    showToast(t.swapToast);
  };

  const clearAll = () => {
    setOriginalText('');
    setModifiedText('');
    showToast(t.clearToast);
  };

  const toggleEditorVisibility = () => {
    setIsEditorVisible(!isEditorVisible);
  };

  const handleDropFile = (file: File, target: 'left' | 'right') => {
    if (file.size > 10 * 1024 * 1024) {
      showToast(t.toastFileTooLarge);
      return;
    }

    const readerRef = target === 'left' ? activeLeftReaderRef : activeRightReaderRef;
    if (readerRef.current) {
      readerRef.current.abort();
    }

    const reader = new FileReader();
    readerRef.current = reader;

    reader.onload = (e) => {
      if (readerRef.current !== reader) return;
      const content = (e.target?.result as string) || '';
      if (target === 'left') {
        setOriginalText(content);
      } else {
        setModifiedText(content);
      }
      showToast(`${t.loadedFileToast}${file.name}`);
    };
    reader.readAsText(file);
  };

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

      const newMergedText = next
        .filter((d) => d.state === 'active')
        .map((d) => d.text)
        .join('\n');
      setMergeResultText(newMergedText);

      return next;
    });
  };

  const copyMergeResult = async () => {
    try {
      await navigator.clipboard.writeText(mergeResultText);
      showToast(t.copiedResultToast);
    } catch (err) {
      showToast(t.copyFailedToast);
    }
  };

  return (
    <ToolLayout
      title={t.title}
      subtitle={t.subtitle}
      description={t.description}
      accentColor="#8b5cf6"
      accentGlow="rgba(139, 92, 246, 0.6)"
    >
      <div className="flex flex-col gap-6 text-left w-full px-4 max-sm:px-0">
        {/* 右上方雙語切換按鈕 */}
        <div className="flex justify-end items-center">
          <Link
            href={t.langSwitchHref}
            className="px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-select-bg border border-border-glass text-text-sub hover:text-text-main transition-colors flex items-center gap-1.5"
          >
            <svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth={2}>
              <circle cx="12" cy="12" r="10" />
              <path d="M12 2a14.5 14.5 0 0 0 0 20M12 2a14.5 14.5 0 0 1 0 20M2 12h20" />
            </svg>
            {t.langSwitchLabel}
          </Link>
        </div>

        {/* 控制設定列 */}
        <div className={styles.panelCard}>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4 flex-wrap">
              {/* 模式切換 */}
              <div className={styles.segmentedBg}>
                <button
                  type="button"
                  onClick={() => setViewMode('split')}
                  className={viewMode === 'split' ? styles.modeBtnActive : styles.modeBtnInactive}
                >
                  {t.splitMode}
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('unified')}
                  className={viewMode === 'unified' ? styles.modeBtnActive : styles.modeBtnInactive}
                >
                  {t.unifiedMode}
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
                {t.ignoreCase}
              </label>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              {/* 交換與清空按鈕 */}
              <button type="button" onClick={swapDocuments} className={styles.actionHeaderBtn}>
                <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current">
                  <path d="M16 17.01V10h-2v7.01h-3L15 21l4-3.99h-3zM9 3L5 6.99h3V14h2V6.99h3L9 3z" />
                </svg>
                {t.swap}
              </button>

              <button type="button" onClick={clearAll} className={styles.actionHeaderBtn}>
                <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                </svg>
                {t.clear}
              </button>

              <button type="button" onClick={toggleEditorVisibility} className={styles.toggleEditorBtn}>
                {isEditorVisible ? t.showDiffOnly : t.showEditors}
              </button>

              {/* 統計面板 */}
              <div className={styles.statPill}>
                <span className={styles.addedStat}>+ {addedCount} {t.addedStat}</span>
                <span className={styles.removedStat}>- {removedCount} {t.removedStat}</span>
              </div>
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
                  {t.originalDoc}
                </label>
                <span className="text-xs text-text-sub">{t.dropHint}</span>
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
                className={`${styles.editorBox} ${isLeftDragOver ? styles.dropZoneDragover : ''}`}
              >
                <textarea
                  id={originalInputId}
                  value={originalText}
                  onChange={(e) => setOriginalText(e.target.value)}
                  placeholder={t.placeholderOriginal}
                  className={styles.editorTextArea}
                />
              </div>
            </div>

            {/* 右側：Modified */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <label htmlFor={modifiedInputId} className="text-sm font-medium text-text-sub">
                  {t.modifiedDoc}
                </label>
                <span className="text-xs text-text-sub">{t.dropHint}</span>
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
                className={`${styles.editorBox} ${isRightDragOver ? styles.dropZoneDragover : ''}`}
              >
                <textarea
                  id={modifiedInputId}
                  value={modifiedText}
                  onChange={(e) => setModifiedText(e.target.value)}
                  placeholder={t.placeholderModified}
                  className={styles.editorTextArea}
                />
              </div>
            </div>
          </div>
        )}

        {/* 比對結果預覽面板 */}
        <div className={styles.panelCard}>
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-semibold text-text-sub">{t.analysisTitle}</h3>
            <span className="text-xs text-text-sub">
              {viewMode === 'split' ? t.splitSubtext : t.unifiedSubtext}
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
              <div ref={leftPaneRef} onScroll={handleLeftScroll} className={styles.diffPane}>
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
              <div ref={rightPaneRef} onScroll={handleRightScroll} className={styles.diffPane}>
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
            <div className="bg-select-bg border border-border-glass rounded-xl p-3 flex flex-col gap-1 overflow-x-auto">
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
                                  ? t.restoreOld
                                  : t.excludeLine
                                : t.revertDefault}
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
            <div className="flex flex-col gap-3 border-t border-border-glass pt-4 mt-2">
              <div className="flex justify-between items-center">
                <label htmlFor={mergeResultInputId} className="text-sm font-medium text-text-sub flex items-center gap-2 cursor-pointer">
                  <span>{t.finalMergeResult}</span>
                  <span className="text-xs text-text-sub font-normal">{t.canEditNotice}</span>
                </label>
                <button type="button" onClick={copyMergeResult} className={styles.copyResultBtn}>
                  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current">
                    <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z" />
                  </svg>
                  {t.copyResult}
                </button>
              </div>
              <textarea
                id={mergeResultInputId}
                ref={mergeTextareaRef}
                value={mergeResultText}
                onChange={(e) => {
                  setMergeResultText(e.target.value);
                  adjustMergeTextareaHeight();
                }}
                placeholder={t.unifiedPlaceholder}
                className={`${styles.editorTextArea} min-h-[80px] rounded-xl overflow-hidden transition-[height] duration-150`}
              />
            </div>
          )}
        </div>
      </div>

      {toast && <div className={styles.toast}>{toast}</div>}
    </ToolLayout>
  );
}
