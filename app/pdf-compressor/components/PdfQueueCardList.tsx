'use client';

import { InspectResult } from '../../utils/pdfHelper';
import { formatBytes } from '../../utils/formatBytes';
import { downloadBlob } from '../../utils/downloadBlob';
import styles from '../pdf-compressor.module.css';
import { TRANSLATIONS } from '../translations';

export interface QueueItem {
  id: string;
  file: File;
  name: string;
  size: number;
  buffer: ArrayBuffer | null;
  inspectData: InspectResult | null;
  status: 'inspecting' | 'ready' | 'need_password' | 'compressing' | 'done' | 'error';
  password?: string;
  passwordError?: string;
  showPassword?: boolean;
  isUnlocking?: boolean;
  progressMsg?: string;
  progressPct?: number;
  compressedBlob: Blob | null;
  compressedSize: number;
  errorMsg?: string;
  showDetails?: boolean;
}

type Translations = (typeof TRANSLATIONS)[keyof typeof TRANSLATIONS];

interface PdfQueueCardListProps {
  fileQueue: QueueItem[];
  isCompressing: boolean;
  fileInputId: string;
  onToggleDetails: (id: string) => void;
  onRemoveItem: (id: string) => void;
  onPasswordChange: (id: string, value: string) => void;
  onToggleShowPassword: (id: string) => void;
  onUnlockItem: (id: string, pwd?: string) => void;
  t: Translations;
}

export default function PdfQueueCardList({
  fileQueue,
  isCompressing,
  fileInputId,
  onToggleDetails,
  onRemoveItem,
  onPasswordChange,
  onToggleShowPassword,
  onUnlockItem,
  t,
}: PdfQueueCardListProps) {
  return (
    <div className="flex flex-col gap-4">
      {fileQueue.map((item) => {
        const savedBytes = item.size - item.compressedSize;
        const ratio =
          item.size > 0 && item.compressedSize > 0
            ? Math.max(0, (savedBytes / item.size) * 100).toFixed(1)
            : 0;

        return (
          <div key={item.id} className={`${styles.cardContainer} p-5 flex flex-col gap-3`}>
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${styles.accentTag}`}>
                  <svg viewBox="0 0 24 24" width={20} height={20} fill="currentColor">
                    <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
                  </svg>
                </div>

                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-semibold text-text-main truncate" title={item.name}>
                    {item.name}
                  </span>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-mono text-text-sub">
                      {formatBytes(item.size)}
                    </span>
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${styles.encryptedTag} inline-flex items-center gap-1`}>
                      <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
                        <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
                      </svg>
                      {t.passwordProtectedTag}
                    </span>
                    {item.inspectData && (
                      <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${styles.accentTag}`}>
                        {t.inspectTag(item.inspectData.totalImages, item.inspectData.estRatio)}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {item.inspectData && item.inspectData.images.length > 0 && (
                  <button
                    type="button"
                    onClick={() => onToggleDetails(item.id)}
                    className={styles.secondaryBtn}
                  >
                    <svg viewBox="0 0 24 24" width={13} height={13} fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
                    </svg>
                    {t.details} {item.showDetails ? '▲' : '▼'}
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => onRemoveItem(item.id)}
                  disabled={isCompressing}
                  className="p-1.5 text-xs text-red-500 bg-red-500/10 border border-red-500/20 rounded-xl hover:bg-red-500/20 transition-all cursor-pointer disabled:opacity-30"
                  title={t.removeFile}
                >
                  ✕
                </button>
              </div>
            </div>

            {/* 受密碼保護提示與解鎖 UI Block */}
            {item.status === 'need_password' && (
              <div className={`mt-1 ${styles.passwordBlock} flex flex-col gap-3`}>
                <div className="flex items-start gap-2.5">
                  <div className="p-1.5 rounded-lg bg-red-500/20 text-red-500 shrink-0 mt-0.5">
                    <svg viewBox="0 0 24 24" width={18} height={18} fill="currentColor">
                      <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
                    </svg>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-bold text-text-main">
                      {t.needPasswordTitle}
                    </span>
                    <span className="text-xs text-text-sub">
                      {t.needPasswordSub}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <div className="relative flex-1 min-w-[200px]">
                    <input
                      type={item.showPassword ? 'text' : 'password'}
                      value={item.password || ''}
                      onChange={(e) => onPasswordChange(item.id, e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          onUnlockItem(item.id, item.password);
                        }
                      }}
                      placeholder={t.passwordPlaceholder}
                      className={`w-full pr-10 ${styles.passwordInput}`}
                    />
                    <button
                      type="button"
                      onClick={() => onToggleShowPassword(item.id)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-sub hover:text-text-main p-1 cursor-pointer"
                      title={item.showPassword ? t.hidePassword : t.showPassword}
                    >
                      {item.showPassword ? (
                        <svg viewBox="0 0 24 24" width={16} height={16} fill="currentColor">
                          <path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.44-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.17c0-1.66-1.34-3-3-3l-.17.02z" />
                        </svg>
                      ) : (
                        <svg viewBox="0 0 24 24" width={16} height={16} fill="currentColor">
                          <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
                        </svg>
                      )}
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => onUnlockItem(item.id, item.password)}
                    disabled={item.isUnlocking || !item.password}
                    className={`disabled:opacity-40 flex items-center gap-1.5 ${styles.unlockBtn}`}
                  >
                    {item.isUnlocking ? (
                      <>
                        <svg className="animate-spin" viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor">
                          <circle cx="12" cy="12" r="10" strokeWidth="4" className="opacity-25" />
                          <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" className="opacity-75" />
                        </svg>
                        {t.unlocking}
                      </>
                    ) : (
                      <>
                        <svg viewBox="0 0 24 24" width={14} height={14} fill="currentColor">
                          <path d="M12 17c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm6-9h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
                        </svg>
                        {t.unlockBtn}
                      </>
                    )}
                  </button>
                </div>

                {item.passwordError && (
                  <span className="text-xs text-red-500 font-medium">
                    {item.passwordError}
                  </span>
                )}
              </div>
            )}

            {/* 進度條 */}
            {item.status === 'compressing' && (
              <div className="flex flex-col gap-1.5 pt-2 border-t border-border-glass">
                <div className="flex justify-between text-xs text-text-sub">
                  <span>{item.progressMsg || t.processing}</span>
                  <span className={`font-mono ${styles.accentText}`}>{item.progressPct || 0}%</span>
                </div>
                <div className="w-full h-2 bg-select-bg rounded-full overflow-hidden border border-border-glass">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 transition-all duration-300"
                    style={{ width: `${item.progressPct || 0}%` }}
                  />
                </div>
              </div>
            )}

            {/* 完成與下載列 */}
            {item.status === 'done' && item.compressedBlob && (
              <div className="flex items-center justify-between p-3 bg-surface-glass border border-border-glass rounded-xl text-xs flex-wrap gap-2">
                <div className={`flex items-center gap-2 font-medium ${styles.doneBadge}`}>
                  <span>{t.original} {formatBytes(item.size)}</span>
                  <span>➔</span>
                  <strong className="font-mono text-text-main font-bold">
                    {t.compressed} {formatBytes(item.compressedSize)}
                  </strong>
                  <span className={`font-bold px-2 py-0.5 rounded ${styles.savedTag}`}>
                    {t.saved(ratio.toString())}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    item.compressedBlob &&
                    downloadBlob(
                      item.compressedBlob,
                      `${item.name.replace(/\.pdf$/i, '')}_compressed.pdf`,
                      5000
                    )
                  }
                  className={`${styles.actionBtn} text-xs flex items-center gap-1.5 cursor-pointer`}
                >
                  <svg viewBox="0 0 24 24" width={14} height={14} fill="currentColor">
                    <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
                  </svg>
                  {t.downloadPdf}
                </button>
              </div>
            )}

            {/* 錯誤資訊 */}
            {item.status === 'error' && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-500">
                {t.errorPrefix}{item.errorMsg || 'Error'}
              </div>
            )}

            {/* 明細 Drawer */}
            {item.showDetails && item.inspectData && item.inspectData.images.length > 0 && (
              <div className={`mt-2 p-3 ${styles.innerBlock} overflow-x-auto`}>
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="border-b border-border-glass text-text-sub font-semibold">
                      <th className="p-2">{t.tableHeaderIdx}</th>
                      <th className="p-2">{t.tableHeaderDim}</th>
                      <th className="p-2">{t.tableHeaderFormat}</th>
                      <th className="p-2">{t.tableHeaderDecision}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {item.inspectData.images.map((img, idx) => (
                      <tr key={idx} className="border-b border-border-glass text-text-main">
                        <td className="p-2 font-mono">#{idx + 1}</td>
                        <td className="p-2 font-mono">{img.width} × {img.height}</td>
                        <td className="p-2">{img.filter || 'Raw'} ({img.colorSpace})</td>
                        <td className="p-2">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                              img.status === 'compressible'
                                ? styles.statusCompressible
                                : styles.statusProtected
                            }`}
                          >
                            {img.statusReason}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })}

      {/* 下方輕量新增卡片 Dropzone */}
      <div
        onClick={() => document.getElementById(fileInputId)?.click()}
        className={`p-6 rounded-2xl border border-dashed text-text-sub hover:text-text-main flex items-center justify-center gap-3 cursor-pointer ${styles.dropzone}`}
      >
        <svg viewBox="0 0 24 24" width={20} height={20} fill="currentColor" className={styles.accentText}>
          <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
        </svg>
        <span className="text-sm font-semibold">{t.addMoreBottom}</span>
      </div>
    </div>
  );
}
