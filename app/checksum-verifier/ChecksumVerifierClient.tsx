'use client';

import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import ToolLayout from '../components/ToolLayout';
import FaqSection from '../components/FaqSection';
import { formatBytes } from '../utils/formatBytes';
import { downloadBlob } from '../utils/downloadBlob';
import styles from './checksum-verifier.module.css';
import {
  HASH_ALGORITHMS,
  type HashAlgorithm,
  type ChecksumEntry,
  type MatchStatus,
  computeAllHashes,
  parseChecksumText,
  matchEntryAgainstFile,
  entryAppliesToFileName,
  detectAlgorithmByLength,
  looksLikeChecksumManifestFilename,
  buildChecksumManifest,
  checksumManifestFileName,
} from './engine';
import { TRANSLATIONS } from './translations';

interface Props {
  lang?: 'zh-TW' | 'en';
}

interface HashedFile {
  id: string;
  file: File;
  status: 'hashing' | 'done' | 'error';
  hashes: Partial<Record<HashAlgorithm, string>>;
  progress: { algorithm: HashAlgorithm; percent: number } | null;
  errorMsg?: string;
}

type EntrySummaryKind = 'no-file' | 'pending' | 'match' | 'mismatch' | 'unsupported';

const ACCENT = '#10b981';
const ACCENT_GLOW = 'rgba(16, 185, 129, 0.5)';

function makeFileKey(file: File): string {
  return `${file.name}-${file.size}-${file.lastModified}-${Math.random().toString(36).slice(2, 8)}`;
}

function getFileMatchSummary(file: HashedFile, entries: ChecksumEntry[]): MatchStatus | null {
  const relevant = entries.filter(e => entryAppliesToFileName(e, file.file.name));
  if (relevant.length === 0 || file.status !== 'done') return null;
  const results = relevant.map(e => matchEntryAgainstFile(e, file.file.name, file.hashes)!.status);
  if (results.includes('match')) return 'match';
  if (results.includes('mismatch')) return 'mismatch';
  return 'unsupported';
}

function truncateHash(hash: string): string {
  return hash.length <= 24 ? hash : `${hash.slice(0, 12)}…${hash.slice(-8)}`;
}

export default function ChecksumVerifierClient({ lang = 'zh-TW' }: Props) {
  const t = TRANSLATIONS[lang];

  const fileInputId = useId();
  const appendFileInputId = useId();
  const manifestInputId = useId();
  const checksumTextareaId = useId();
  const downloadAlgoId = useId();

  const [files, setFiles] = useState<HashedFile[]>([]);
  const [checksumText, setChecksumText] = useState('');
  const [downloadAlgo, setDownloadAlgo] = useState<HashAlgorithm>('SHA-256');
  const [isDragOver, setIsDragOver] = useState(false);
  const [isAppendDragOver, setIsAppendDragOver] = useState(false);
  const [isDraggingGlobal, setIsDraggingGlobal] = useState(false);
  const [toast, setToast] = useState<{ msg: string; show: boolean }>({ msg: '', show: false });

  const dragCounterRef = useRef(0);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    document.documentElement.style.setProperty('--theme-color', ACCENT);
    document.documentElement.style.setProperty('--accent-glow', ACCENT_GLOW);
  }, []);

  const showToast = useCallback((msg: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ msg, show: true });
    toastTimer.current = setTimeout(() => setToast(s => ({ ...s, show: false })), 2500);
  }, []);

  const processTargetFile = useCallback(async (id: string, file: File) => {
    try {
      const buffer = await file.arrayBuffer();
      const hashes = await computeAllHashes(buffer, HASH_ALGORITHMS, (algorithm, percent) => {
        setFiles(prev => prev.map(f => (f.id === id ? { ...f, progress: { algorithm, percent } } : f)));
      });
      setFiles(prev => prev.map(f => (f.id === id ? { ...f, status: 'done', hashes, progress: null } : f)));
    } catch (err) {
      setFiles(prev =>
        prev.map(f => (f.id === id ? { ...f, status: 'error', errorMsg: String(err), progress: null } : f))
      );
    }
  }, []);

  const loadManifestFiles = useCallback(
    (manifestFiles: File[]) => {
      Promise.all(manifestFiles.map(f => f.text().then(text => `# ${f.name}\n${text.trim()}`)))
        .then(chunks => {
          setChecksumText(prev => (prev.trim() ? prev.trim() + '\n\n' : '') + chunks.join('\n\n'));
          showToast(t.toastManifestLoaded(manifestFiles.length));
        })
        .catch(() => showToast(t.toastReadError));
    },
    [showToast, t]
  );

  const addFiles = useCallback(
    (fileList: FileList | File[]) => {
      const incoming = Array.from(fileList);
      if (incoming.length === 0) return;

      const manifestFiles = incoming.filter(f => looksLikeChecksumManifestFilename(f.name));
      const targetFiles = incoming.filter(f => !looksLikeChecksumManifestFilename(f.name));

      if (manifestFiles.length > 0) loadManifestFiles(manifestFiles);

      if (targetFiles.length > 0) {
        const newEntries: HashedFile[] = targetFiles.map(file => ({
          id: makeFileKey(file),
          file,
          status: 'hashing',
          hashes: {},
          progress: null,
        }));
        setFiles(prev => [...prev, ...newEntries]);
        newEntries.forEach(entry => processTargetFile(entry.id, entry.file));
      }
    },
    [loadManifestFiles, processTargetFile]
  );

  // 全域 Drag & Drop 監聽（持續性拖曳上傳 UX）
  useEffect(() => {
    const handleDragEnter = (e: DragEvent) => {
      e.preventDefault();
      dragCounterRef.current += 1;
      if (e.dataTransfer?.types?.includes('Files')) setIsDraggingGlobal(true);
    };
    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      dragCounterRef.current -= 1;
      if (dragCounterRef.current <= 0) {
        dragCounterRef.current = 0;
        setIsDraggingGlobal(false);
      }
    };
    const handleDragOver = (e: DragEvent) => e.preventDefault();
    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      dragCounterRef.current = 0;
      setIsDraggingGlobal(false);
      if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) addFiles(e.dataTransfer.files);
    };

    window.addEventListener('dragenter', handleDragEnter);
    window.addEventListener('dragleave', handleDragLeave);
    window.addEventListener('dragover', handleDragOver);
    window.addEventListener('drop', handleDrop);
    return () => {
      window.removeEventListener('dragenter', handleDragEnter);
      window.removeEventListener('dragleave', handleDragLeave);
      window.removeEventListener('dragover', handleDragOver);
      window.removeEventListener('drop', handleDrop);
    };
  }, [addFiles]);

  const removeFile = (id: string) => setFiles(prev => prev.filter(f => f.id !== id));
  const clearAll = () => {
    setFiles([]);
    setChecksumText('');
  };

  const copyValue = (val: string) => {
    navigator.clipboard
      .writeText(val)
      .then(() => showToast(t.toastCopied))
      .catch(() => showToast(t.toastCopyFailed));
  };

  const doneFiles = useMemo(() => files.filter(f => f.status === 'done'), [files]);

  const handleDownloadManifest = () => {
    if (doneFiles.length === 0) {
      showToast(t.toastNoDoneFiles);
      return;
    }
    const manifest = buildChecksumManifest(
      doneFiles.map(f => ({ fileName: f.file.name, hash: f.hashes[downloadAlgo]! })),
      downloadAlgo
    );
    downloadBlob(new Blob([manifest], { type: 'text/plain;charset=utf-8' }), checksumManifestFileName(downloadAlgo));
    showToast(t.toastManifestDownloaded);
  };

  const parsedEntries = useMemo(() => parseChecksumText(checksumText), [checksumText]);

  const entrySummaries = useMemo(() => {
    return parsedEntries.map(entry => {
      const relevantFiles = files.filter(f => entryAppliesToFileName(entry, f.file.name));
      if (relevantFiles.length === 0) {
        return { entry, kind: 'no-file' as EntrySummaryKind, fileName: undefined as string | undefined };
      }

      const doneResults = relevantFiles
        .filter(f => f.status === 'done')
        .map(f => ({ fileName: f.file.name, status: matchEntryAgainstFile(entry, f.file.name, f.hashes)!.status }));

      const matched = doneResults.find(r => r.status === 'match');
      if (matched) return { entry, kind: 'match' as EntrySummaryKind, fileName: matched.fileName };
      if (relevantFiles.some(f => f.status !== 'done')) {
        return { entry, kind: 'pending' as EntrySummaryKind, fileName: undefined };
      }
      if (doneResults.some(r => r.status === 'mismatch')) {
        return { entry, kind: 'mismatch' as EntrySummaryKind, fileName: undefined };
      }
      return { entry, kind: 'unsupported' as EntrySummaryKind, fileName: undefined };
    });
  }, [parsedEntries, files]);

  const algoLabel = (algo: HashAlgorithm) => algo;

  return (
    <>
      <ToolLayout
        title={t.title}
        subtitle={t.subtitle}
        description={t.description}
        accentColor={ACCENT}
        accentGlow={ACCENT_GLOW}
      >
        {isDraggingGlobal && (
          <div className={styles.dragOverlay}>
            <div
              className="w-20 h-20 rounded-3xl flex items-center justify-center border shadow-2xl"
              style={{ background: 'rgba(16,185,129,0.2)', color: ACCENT, borderColor: 'rgba(16,185,129,0.4)' }}
            >
              <svg viewBox="0 0 24 24" width={40} height={40} fill="currentColor">
                <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z" />
              </svg>
            </div>
            <span className="text-xl font-bold text-text-main">{t.globalDragOverlay}</span>
          </div>
        )}

        <div className={styles.container}>
          {files.length === 0 ? (
            <div
              onClick={() => document.getElementById(fileInputId)?.click()}
              onDragEnter={e => {
                e.preventDefault();
                setIsDragOver(true);
              }}
              onDragOver={e => {
                e.preventDefault();
                setIsDragOver(true);
              }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={e => {
                e.preventDefault();
                setIsDragOver(false);
                if (e.dataTransfer.files.length > 0) addFiles(e.dataTransfer.files);
              }}
              className={`${styles.dropzone} ${isDragOver ? styles.dropzoneActive : ''}`}
            >
              <label htmlFor={fileInputId} className="sr-only">
                {t.dropzoneText}
              </label>
              <input
                id={fileInputId}
                type="file"
                multiple
                className="hidden"
                onChange={e => {
                  if (e.target.files) addFiles(e.target.files);
                  e.target.value = '';
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
              <span className="text-xs text-text-sub opacity-80 text-center max-w-md">{t.dropzoneSub}</span>
            </div>
          ) : (
            <div className="grid grid-cols-[1.15fr_1fr] gap-6 max-lg:grid-cols-1 items-start">
              {/* 左欄：目標檔案清單 */}
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between px-1 flex-wrap gap-2">
                  <span className="text-sm font-semibold text-text-main">{t.fileCountLabel(files.length)}</span>
                  <button type="button" onClick={clearAll} className={styles.btnDanger}>
                    <svg viewBox="0 0 24 24" width={14} height={14} fill="currentColor">
                      <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                    </svg>
                    {t.clearAllBtn}
                  </button>
                </div>

                {/* 持續性拖曳追加入口：固定在清單最上方，檔案一多也不必捲動尋找 */}
                <div
                  onClick={() => document.getElementById(appendFileInputId)?.click()}
                  onDragEnter={e => {
                    e.preventDefault();
                    setIsAppendDragOver(true);
                  }}
                  onDragOver={e => {
                    e.preventDefault();
                    setIsAppendDragOver(true);
                  }}
                  onDragLeave={() => setIsAppendDragOver(false)}
                  onDrop={e => {
                    e.preventDefault();
                    setIsAppendDragOver(false);
                    if (e.dataTransfer.files.length > 0) addFiles(e.dataTransfer.files);
                  }}
                  className={`${styles.appendDropzone} ${isAppendDragOver ? styles.appendDropzoneActive : ''}`}
                >
                  <label htmlFor={appendFileInputId} className="sr-only">
                    {t.appendDropzoneText}
                  </label>
                  <input
                    id={appendFileInputId}
                    type="file"
                    multiple
                    className="hidden"
                    onChange={e => {
                      if (e.target.files) addFiles(e.target.files);
                      e.target.value = '';
                    }}
                  />
                  <svg viewBox="0 0 24 24" width={16} height={16} fill="currentColor">
                    <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                  </svg>
                  {t.appendDropzoneText}
                </div>

                {doneFiles.length > 0 && (
                  <div className="flex items-center gap-2 flex-wrap px-1">
                    <label htmlFor={downloadAlgoId} className="text-xs font-medium text-text-sub">
                      {t.downloadManifestLabel}
                    </label>
                    <select
                      id={downloadAlgoId}
                      className={styles.algoSelect}
                      value={downloadAlgo}
                      onChange={e => setDownloadAlgo(e.target.value as HashAlgorithm)}
                    >
                      {HASH_ALGORITHMS.map(algo => (
                        <option key={algo} value={algo}>
                          {algo}
                        </option>
                      ))}
                    </select>
                    <button type="button" onClick={handleDownloadManifest} className={styles.btnPrimary}>
                      {t.downloadManifestBtn}
                    </button>
                  </div>
                )}

                {files.map(f => {
                  const summary = getFileMatchSummary(f, parsedEntries);
                  return (
                    <div key={f.id} className={styles.fileCard}>
                      <div className="flex items-center gap-3">
                        <div
                          className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                          style={{ background: 'rgba(16,185,129,0.12)' }}
                        >
                          <svg viewBox="0 0 24 24" width={20} height={20} fill={ACCENT}>
                            <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
                          </svg>
                        </div>
                        <div className="flex flex-col flex-1 min-w-0">
                          <span className="text-sm font-semibold text-text-main truncate">{f.file.name}</span>
                          <span className="text-xs text-text-sub">{formatBytes(f.file.size)}</span>
                        </div>
                        {summary === 'match' && (
                          <span className={`${styles.badge} ${styles.badgeMatch}`}>{t.badgeMatch}</span>
                        )}
                        {summary === 'mismatch' && (
                          <span className={`${styles.badge} ${styles.badgeMismatch}`}>{t.badgeMismatch}</span>
                        )}
                        {summary === 'unsupported' && (
                          <span className={`${styles.badge} ${styles.badgeUnsupported}`}>{t.badgeUnsupported}</span>
                        )}
                        <button
                          type="button"
                          onClick={() => removeFile(f.id)}
                          className={styles.iconBtn}
                          aria-label={t.removeFileBtn}
                        >
                          <svg viewBox="0 0 24 24" width={16} height={16} fill="currentColor">
                            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                          </svg>
                        </button>
                      </div>

                      {f.status === 'hashing' && (
                        <div className="flex items-center gap-2 text-xs text-text-sub">
                          <div className={styles.spinner} />
                          {f.progress ? t.hashingLabel(algoLabel(f.progress.algorithm), f.progress.percent) : t.hashingLabelGeneric}
                        </div>
                      )}

                      {f.status === 'error' && (
                        <div className="text-xs text-red-500">
                          {t.errorLabel}: {f.errorMsg}
                        </div>
                      )}

                      {f.status === 'done' && (
                        <div className="flex flex-col gap-1.5">
                          {HASH_ALGORITHMS.map(algo => (
                            <div key={algo} className={styles.hashRow}>
                              <span className={styles.hashAlgoLabel}>{algo}</span>
                              <span className={styles.hashValue}>{f.hashes[algo]}</span>
                              <button
                                type="button"
                                onClick={() => copyValue(f.hashes[algo] || '')}
                                className={styles.iconBtn}
                                aria-label={t.copyBtn}
                              >
                                <svg viewBox="0 0 24 24" width={15} height={15} fill="currentColor">
                                  <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z" />
                                </svg>
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* 右欄：驗證面板 */}
              <div className="flex flex-col gap-4">
                <div className={styles.panelCard}>
                  <div className="px-4 pt-4">
                    <h3 className="text-sm font-bold text-text-main mb-1">{t.verifyPanelTitle}</h3>
                    <p className="text-xs text-text-sub mb-3 leading-relaxed">{t.verifyPanelDesc}</p>
                  </div>
                  <label htmlFor={checksumTextareaId} className="sr-only">
                    {t.verifyPanelTitle}
                  </label>
                  <textarea
                    id={checksumTextareaId}
                    className={styles.customTextarea}
                    placeholder={t.checksumTextareaPlaceholder}
                    value={checksumText}
                    onChange={e => setChecksumText(e.target.value)}
                  />
                  <div className="flex items-center justify-between px-4 py-3 border-t border-border-glass flex-wrap gap-2">
                    <label htmlFor={manifestInputId} className={styles.btnSecondary} style={{ cursor: 'pointer' }}>
                      {t.uploadManifestBtn}
                      <input
                        id={manifestInputId}
                        type="file"
                        className="hidden"
                        onChange={e => {
                          if (e.target.files?.[0]) loadManifestFiles([e.target.files[0]]);
                          e.target.value = '';
                        }}
                      />
                    </label>
                    <button type="button" onClick={() => setChecksumText('')} className={styles.btnSecondary}>
                      {t.clearChecksumBtn}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between px-1">
                  <span className="text-sm font-semibold text-text-main">{t.parsedEntriesTitle}</span>
                  {parsedEntries.length > 0 && (
                    <span className="text-xs text-text-sub">{t.parsedEntriesCount(parsedEntries.length)}</span>
                  )}
                </div>

                {parsedEntries.length === 0 ? (
                  <p className="text-xs text-text-sub px-1">{t.noEntriesHint}</p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {entrySummaries.map(({ entry, kind, fileName }, idx) => {
                      const algo = entry.algorithm ?? detectAlgorithmByLength(entry.hash.length);
                      return (
                        <div key={idx} className={styles.entryRow}>
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm font-semibold text-text-main truncate min-w-0">
                              {entry.filename ?? t.entryWildcardLabel}
                            </span>
                            <div className="shrink-0">
                              {kind === 'no-file' && (
                                <span className={`${styles.badge} ${styles.badgeNeutral}`}>{t.entryNoFileFound}</span>
                              )}
                              {kind === 'pending' && (
                                <span className={`${styles.badge} ${styles.badgeNeutral}`}>{t.entryPending}</span>
                              )}
                              {kind === 'match' && (
                                <span className={`${styles.badge} ${styles.badgeMatch}`}>{t.badgeMatch}</span>
                              )}
                              {kind === 'mismatch' && (
                                <span className={`${styles.badge} ${styles.badgeMismatch}`}>{t.badgeMismatch}</span>
                              )}
                              {kind === 'unsupported' && (
                                <span className={`${styles.badge} ${styles.badgeUnsupported}`}>
                                  {t.badgeUnsupported}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 min-w-0">
                            {algo && <span className={styles.hashAlgoLabel} style={{ width: 'auto' }}>{algo}</span>}
                            <span className={`${styles.hashValueCompact} truncate`}>{truncateHash(entry.hash)}</span>
                          </div>
                          {kind === 'match' && entry.filename === null && fileName && (
                            <span className="text-xs text-text-sub truncate">{t.entryMatchedFile(fileName)}</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 常見問題 FAQ 區塊 */}
        <div className="mt-8">
          <FaqSection title={t.faqTitle} subtitle={t.faqSubtitle} items={t.faqItems} accentColor={ACCENT} />
        </div>
      </ToolLayout>

      {/* Toast Notification */}
      <div
        className={`fixed bottom-8 right-8 flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-xl z-[100] pointer-events-none
          bg-surface-glass border border-border-glass backdrop-blur-[16px] text-text-main shadow-lg
          transition-all duration-300 ${toast.show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
      >
        <svg viewBox="0 0 24 24" width={16} height={16} fill={ACCENT}>
          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
        </svg>
        {toast.msg}
      </div>
    </>
  );
}
