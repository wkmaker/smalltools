'use client';

import type { RefObject } from 'react';
import type { ContentType, DownloadFormat } from '../types';
import styles from '../qr-generator.module.css';

interface QrPreviewCardProps {
  t: any;
  containerRef: RefObject<HTMLDivElement | null>;
  bgTransparent: boolean;
  bgColor: string;
  downloadFormat: DownloadFormat;
  setDownloadFormat: (fmt: DownloadFormat) => void;
  downloadSize: number;
  setDownloadSize: (sz: number) => void;
  onDownloadQr: () => void;
  contentType: ContentType;
  computedData: string;
  onDownloadVcf: () => void;
  onDownloadIcs: () => void;
  onCopyRawContent: () => void;
}

export default function QrPreviewCard({
  t,
  containerRef,
  bgTransparent,
  bgColor,
  downloadFormat,
  setDownloadFormat,
  downloadSize,
  setDownloadSize,
  onDownloadQr,
  contentType,
  computedData,
  onDownloadVcf,
  onDownloadIcs,
  onCopyRawContent,
}: QrPreviewCardProps) {
  return (
    <div className="flex flex-col gap-6 max-[1024px]:static max-[1024px]:top-auto sticky top-6 w-full max-w-full">
      {/* 上卡片：QR Code 畫布與圖片下載 */}
      <div className={`${styles.panelCard} items-center`}>
        <div
          className={`${styles.qrPreview} ${bgTransparent ? styles.checkerboardBg : ''}`}
          style={{ backgroundColor: bgTransparent ? undefined : bgColor }}
        >
          {/* 動態渲染掛載容器 */}
          <div ref={containerRef} className="w-[280px] h-[280px] max-w-full max-h-full flex items-center justify-center" />
        </div>

        {/* 下載設定 */}
        <div className="flex flex-col gap-4 w-full max-w-full">
          {/* 下載格式膠囊按鈕 */}
          <div className="flex flex-col gap-2 w-full">
            <span className="text-sm font-medium text-text-sub">{t.downloadFormat}</span>
            <div className="grid grid-cols-4 gap-1 p-1 bg-select-bg border border-border-glass rounded-xl">
              {(['png', 'svg', 'jpeg', 'webp'] as const).map((fmt) => (
                <button
                  key={fmt}
                  type="button"
                  onClick={() => setDownloadFormat(fmt)}
                  className={`${styles.segmentedBtn} ${downloadFormat === fmt ? styles.segmentedBtnActive : ''} uppercase`}
                >
                  {fmt}
                </button>
              ))}
            </div>
          </div>

          {/* 下載尺寸膠囊按鈕 */}
          <div className="flex flex-col gap-2 w-full">
            <span className="text-sm font-medium text-text-sub">{t.downloadSize}</span>
            <div className="grid grid-cols-4 gap-1 p-1 bg-select-bg border border-border-glass rounded-xl">
              {[
                { val: 300, label: '300' },
                { val: 600, label: '600' },
                { val: 1200, label: '1200' },
                { val: 2000, label: '2000' },
              ].map((sz) => (
                <button
                  key={sz.val}
                  type="button"
                  onClick={() => setDownloadSize(sz.val)}
                  className={`${styles.segmentedBtn} ${downloadSize === sz.val ? styles.segmentedBtnActive : ''}`}
                >
                  {sz.label}
                </button>
              ))}
            </div>
          </div>

          <button type="button" onClick={onDownloadQr} className={styles.downloadBtn}>
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
              <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM17 13l-5 5-5-5h3V9h4v4h3z" />
            </svg>
            {t.downloadBtn}
          </button>
        </div>
      </div>

      {/* 下卡片：特殊格式 (.vcf / .ics) 獨立資訊與檔案卡片 */}
      {contentType === 'vcard' && (
        <div className={styles.panelCard}>
          <div className="flex flex-col gap-3.5 w-full">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-text-sub uppercase tracking-wider">
                {t.vcfPreviewTitle}
              </span>
            </div>

            <div className="flex gap-2 w-full">
              <button
                type="button"
                onClick={onDownloadVcf}
                className={styles.vcfDownloadBtn}
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current shrink-0">
                  <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
                </svg>
                <span>{t.downloadVcfBtn}</span>
              </button>

              <button type="button" onClick={onCopyRawContent} title={t.copyVcfBtn} aria-label={t.copyVcfBtn}
                className={styles.vcfCopyBtn}
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                  <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z" />
                </svg>
              </button>
            </div>

            {/* 即時 .vcf 文字預覽 */}
            <div className={styles.vcfCodeBox}>
              {computedData}
            </div>
          </div>
        </div>
      )}

      {contentType === 'event' && (
        <div className={styles.panelCard}>
          <div className="flex flex-col gap-3.5 w-full">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-text-sub uppercase tracking-wider">
                {t.icsPreviewTitle}
              </span>
            </div>

            <div className="flex gap-2 w-full">
              <button
                type="button"
                onClick={onDownloadIcs}
                className={styles.vcfDownloadBtn}
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current shrink-0">
                  <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
                </svg>
                <span>{t.downloadIcsBtn}</span>
              </button>

              <button type="button" onClick={onCopyRawContent} title={t.copyIcsBtn} aria-label={t.copyIcsBtn}
                className={styles.vcfCopyBtn}
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                  <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z" />
                </svg>
              </button>
            </div>

            {/* 即時 .ics 文字預覽 */}
            <div className={styles.vcfCodeBox}>
              {computedData}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
