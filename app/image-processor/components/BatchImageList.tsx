'use client';

import { formatBytes } from '../../utils/formatBytes';
import styles from '../image-processor.module.css';
import { TRANSLATIONS } from '../translations';

export interface BatchItem {
  file: File;
  id: string;
  thumbUrl: string;
  estimatedSize: number | null;
  status: 'pending' | 'processing' | 'done' | 'error';
}

type Translations = (typeof TRANSLATIONS)[keyof typeof TRANSLATIONS];

interface BatchImageListProps {
  batchItems: BatchItem[];
  t: Translations;
}

export default function BatchImageList({ batchItems, t }: BatchImageListProps) {
  return (
    <div className="flex flex-col gap-4 text-left">
      <div className="flex justify-between items-center border-b border-border-glass pb-3">
        <h4 className="text-sm font-bold text-text-main flex items-center gap-2">
          <svg viewBox="0 0 24 24" width={16} height={16} fill="currentColor" className="text-[#d946ef] shrink-0">
            <path d="M20 6h-8l-2-2H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 12H4V8h16v10z" />
          </svg>
          {t.batchListTitle}
        </h4>
        <span className="text-xs text-text-sub">{t.totalImages(batchItems.length)}</span>
      </div>

      <div className="flex flex-col gap-3 max-h-[480px] overflow-y-auto pr-1">
        {batchItems.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between gap-3 bg-select-bg p-3 rounded-xl border border-border-glass"
          >
            <div className="flex items-center gap-3 min-w-0">
              <img
                src={item.thumbUrl}
                alt={item.file.name}
                className="w-12 h-12 rounded-lg object-cover bg-slate-900 border border-border-glass shrink-0"
              />
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-semibold text-text-main truncate">{item.file.name}</span>
                <span className="text-xs font-mono text-text-sub">
                  {formatBytes(item.file.size)}
                </span>
              </div>
            </div>

            <span
              className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${
                item.status === 'done'
                  ? styles.statusDoneBadge
                  : item.status === 'processing'
                  ? 'bg-[#d946ef]/10 text-[#d946ef] border-[#d946ef]/30 animate-pulse'
                  : 'bg-select-bg text-text-sub border-border-glass'
              }`}
            >
              {item.status === 'done' ? (
                <span className="flex items-center gap-1">
                  <svg viewBox="0 0 24 24" width={12} height={12} fill="currentColor">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                  </svg>
                  {t.statusDone}
                </span>
              ) : item.status === 'processing' ? (
                <span className="flex items-center gap-1">
                  <svg viewBox="0 0 24 24" width={12} height={12} fill="currentColor" className="animate-spin">
                    <path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46A7.93 7.93 0 0020 12c0-4.42-3.58-8-8-8z" />
                  </svg>
                  {t.statusProcessing}
                </span>
              ) : (
                t.statusPending
              )}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
