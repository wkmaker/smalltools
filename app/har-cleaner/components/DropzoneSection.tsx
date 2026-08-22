'use client';

import React, { useState } from 'react';
import {
  UploadIcon,
  PlayIcon,
  ShieldIcon,
  DownloadIcon,
  CopyIcon,
  CheckIcon,
  TrashIcon,
  SpinnerIcon,
} from './Icons';
import styles from '../har-cleaner.module.css';

interface DropzoneSectionProps {
  rawHarData: any | null;
  fileName: string;
  originalFileSize: number;
  totalRequests: number;
  isProcessing: boolean;
  copied: boolean;
  fileInputId: string;
  t: any;
  formatBytes: (bytes: number) => string;
  onFileLoaded: (file: File) => void;
  onLoadSample: () => void;
  onDownload: () => void;
  onCopyJson: () => void;
  onExportReport: () => void;
  onReset: () => void;
}

export default function DropzoneSection({
  rawHarData,
  fileName,
  originalFileSize,
  totalRequests,
  isProcessing,
  copied,
  fileInputId,
  t,
  formatBytes,
  onFileLoaded,
  onLoadSample,
  onDownload,
  onCopyJson,
  onExportReport,
  onReset,
}: DropzoneSectionProps) {
  const [isDragActive, setIsDragActive] = useState(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFileLoaded(e.dataTransfer.files[0]);
    }
  };

  if (!rawHarData) {
    return (
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragActive(true);
        }}
        onDragLeave={() => setIsDragActive(false)}
        onDrop={handleDrop}
        className={`w-full rounded-2xl p-10 text-center cursor-pointer transition-all ${
          styles.dropzone
        } ${isDragActive ? styles.dropzoneActive : ''}`}
        onClick={() => document.getElementById(fileInputId)?.click()}
      >
        <input
          id={fileInputId}
          type="file"
          accept=".har,.json"
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              onFileLoaded(e.target.files[0]);
            }
          }}
        />
        <div className={`flex justify-center mb-4 ${styles.dropzoneIcon}`}>
          <UploadIcon />
        </div>
        <h3 className="text-lg font-semibold text-text-main mb-2">{t.dropzoneTitle}</h3>
        <p className="text-sm text-text-sub mb-6 max-w-xl mx-auto">{t.dropzoneHint}</p>
        <div className="flex justify-center gap-4 flex-wrap" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={onLoadSample}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium ${styles.accentBtn}`}
          >
            <PlayIcon />
            <span>{t.loadSampleBtn}</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full rounded-2xl p-4 bg-surface-glass border border-border-glass flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-select-bg border border-border-glass text-text-main">
          {isProcessing ? <SpinnerIcon /> : <ShieldIcon />}
        </div>
        <div>
          <div className="text-sm font-semibold text-text-main flex items-center gap-2">
            <span>{fileName}</span>
            <span className="text-xs px-2 py-0.5 rounded-md bg-select-bg text-text-sub font-mono">
              {formatBytes(originalFileSize)}
            </span>
          </div>
          <div className="text-xs text-text-sub flex items-center gap-2">
            <span>{totalRequests} Requests Scanned</span>
            {isProcessing && (
              <span className={`${styles.themeAccentText} font-medium flex items-center gap-1`}>
                <span>{t.processingText}</span>
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <button
          type="button"
          onClick={onDownload}
          disabled={isProcessing}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium ${
            styles.accentBtn
          } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <DownloadIcon />
          <span>{t.downloadBtn}</span>
        </button>
        <button
          type="button"
          onClick={onCopyJson}
          disabled={isProcessing}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium ${
            styles.secondaryBtn
          } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {copied ? <CheckIcon /> : <CopyIcon />}
          <span>{copied ? t.copiedToast : t.copyJsonBtn}</span>
        </button>
        <button
          type="button"
          onClick={onExportReport}
          disabled={isProcessing}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium ${
            styles.secondaryBtn
          } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <span>{t.exportReportBtn}</span>
        </button>
        <button
          type="button"
          onClick={onReset}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium bg-select-bg border border-border-glass text-text-sub hover:text-text-main transition-colors"
        >
          <TrashIcon />
          <span>{t.clearBtn}</span>
        </button>
      </div>
    </div>
  );
}
