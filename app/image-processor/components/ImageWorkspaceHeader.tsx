'use client';

import { TRANSLATIONS } from '../translations';

type Translations = (typeof TRANSLATIONS)[keyof typeof TRANSLATIONS];

interface ImageWorkspaceHeaderProps {
  filesCount: number;
  firstFileName: string;
  isBatchMode: boolean;
  origWidth: number;
  origHeight: number;
  onCopyConfigLink: () => void;
  onResetWorkspace: () => void;
  t: Translations;
}

export default function ImageWorkspaceHeader({
  filesCount,
  firstFileName,
  isBatchMode,
  origWidth,
  origHeight,
  onCopyConfigLink,
  onResetWorkspace,
  t,
}: ImageWorkspaceHeaderProps) {
  return (
    <div className="bg-surface-glass border border-border-glass rounded-2xl p-3.5 sm:px-6 sm:py-3 text-text-main flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-4 shadow-[var(--glass-shadow)] min-w-0">
      <div className="flex items-center gap-2.5 min-w-0 max-w-full overflow-hidden">
        <span className="bg-[#d946ef]/15 text-[#d946ef] border border-[#d946ef]/30 px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wide shrink-0">
          {t.tagline}
        </span>
        <span className="text-xs sm:text-sm font-medium text-text-main min-w-0 truncate">
          {filesCount === 0
            ? t.uploadPrompt
            : isBatchMode
            ? t.selectedMulti(filesCount)
            : t.editingSingle(firstFileName, origWidth, origHeight)}
        </span>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 justify-end min-w-0">
        <button
          type="button"
          onClick={onCopyConfigLink}
          className="px-3 py-1.5 text-xs font-medium bg-select-bg border border-border-glass text-text-sub hover:text-text-main rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
        >
          <svg viewBox="0 0 24 24" width={14} height={14} fill="currentColor" className="shrink-0">
            <path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z" />
          </svg>
          {t.copyConfig}
        </button>

        {filesCount > 0 && (
          <button
            type="button"
            onClick={onResetWorkspace}
            className="px-3 py-1.5 text-xs font-bold bg-[#d946ef]/10 text-[#d946ef] border border-[#d946ef]/30 rounded-xl hover:bg-[#d946ef]/20 transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
          >
            <svg viewBox="0 0 24 24" width={14} height={14} fill="currentColor" className="shrink-0">
              <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
            </svg>
            {t.reupload}
          </button>
        )}
      </div>
    </div>
  );
}
