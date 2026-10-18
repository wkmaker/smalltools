'use client';

import React from 'react';
import type { ResultData, TabType } from '../types';
import { downloadBlob } from '../../utils/downloadBlob';
import styles from '../ssl-converter.module.css';

interface SslResultSectionProps {
  t: any;
  resultData: ResultData;
  activeTab: TabType;
  keyFormat: 'pkcs8' | 'pkcs1';
  setKeyFormat: (f: 'pkcs8' | 'pkcs1') => void;
  currentChainPems: string[];
  aiaFixUrl: string | null;
  aiaError: string | null;
  aiaFileInputId: string;
  handleAiaFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  sendCertToChainFix: (certContent: string) => void;
  showToast: (msg: string) => void;
  onCloseResult: () => void;
}

export default function SslResultSection({
  t,
  resultData,
  activeTab,
  keyFormat,
  setKeyFormat,
  currentChainPems,
  aiaFixUrl,
  aiaError,
  aiaFileInputId,
  handleAiaFileUpload,
  sendCertToChainFix,
  showToast,
  onCloseResult,
}: SslResultSectionProps) {
  return (
    <div className={styles.resultSection}>
      <div className="flex justify-between items-center border-b border-border-glass pb-3">
        <h3 className={`text-sm uppercase tracking-[1px] font-semibold ${styles.accentText}`}>
          {t.resultTitle}
        </h3>
        <button
          type="button"
          onClick={onCloseResult}
          className={`${styles.btnSecondary} cursor-pointer`}
        >
          {t.hideResult}
        </button>
      </div>

      {/* AIA 憑證鏈候補修復卡片 */}
      {aiaFixUrl && (
        <div className={styles.aiaNoticeCard}>
          <div className={styles.aiaNoticeHeader}>
            {currentChainPems.length === 1 ? (
              <svg viewBox="0 0 24 24" className={styles.aiaNoticeHeaderIcon}>
                <path d="M12 2L1 21h22L12 2zm0 3.5L20.5 19h-17L12 5.5zM11 10v4h2v-4h-2zm0 6v2h2v-2h-2z" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" className={`w-5 h-5 ${styles.accentText} shrink-0`}>
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
              </svg>
            )}
            <span>
              {currentChainPems.length === 1
                ? t.aiaIncompleteWarning
                : t.aiaNextFound(currentChainPems.length - 1)}
            </span>
          </div>

          <div className="text-sm text-text-sub flex flex-col gap-2 leading-relaxed">
            <p>{t.aiaHelpText}</p>
            <div className="flex flex-col gap-1 bg-surface-glass p-3 rounded-xl border border-border-glass">
              <a
                href={aiaFixUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`${styles.accentText} underline font-mono text-xs break-all hover:text-text-main transition-colors`}
              >
                {aiaFixUrl}
              </a>
              <div className="flex items-center gap-1.5 text-xs text-text-sub opacity-80 mt-1">
                <svg viewBox="0 0 24 24" className={`w-4 h-4 ${styles.accentText} shrink-0`}>
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
                </svg>
                <span>{t.aiaSaveAsTip}</span>
              </div>
            </div>
          </div>

          {aiaError && (
            <div className={styles.aiaErrorBox}>
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current shrink-0 mt-0.5">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
              </svg>
              <span>{aiaError}</span>
            </div>
          )}

          <div className={styles.aiaUploadZone}>
            <input
              id={aiaFileInputId}
              type="file"
              accept=".cer,.crt,.der,.pem"
              className={styles.fileInput}
              onChange={handleAiaFileUpload}
            />
            <svg viewBox="0 0 24 24" className={styles.aiaUploadIcon}>
              <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z" />
            </svg>
            <div className="flex flex-col gap-1">
              <span className={styles.aiaUploadPrompt}>
                {t.aiaUploadPrompt}
              </span>
              <span className={styles.aiaUploadSub}>
                {t.aiaUploadSub}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 憑證元資料列表 */}
      {resultData.meta && resultData.meta.length > 0 && (
        <div className={styles.metaGrid}>
          {resultData.meta.map((m, idx) => (
            <div key={idx} className={styles.metaCard}>
              <span className="text-xs text-text-sub uppercase tracking-[0.5px] font-semibold">{m.label}</span>
              <span className={`text-sm font-mono ${m.className || 'text-text-main font-semibold'}`}>{m.value}</span>
            </div>
          ))}
        </div>
      )}

      {/* 輸出憑證檔案列表 */}
      {resultData.outputs && resultData.outputs.length > 0 && (
        <div className="flex flex-col gap-4">
          {resultData.outputs.map((out, idx) => {
            const displayContent =
              out.isPrivateKey && keyFormat === 'pkcs1' && out.contentPkcs1
                ? out.contentPkcs1
                : out.content;

            const downloadFilename =
              out.isPrivateKey && keyFormat === 'pkcs1'
                ? out.filename.replace(/\.key$/, '_pkcs1.key')
                : out.filename;

            return (
              <div key={idx} className={styles.outputCard}>
                <div className="flex justify-between items-center border-b border-border-glass pb-2 max-sm:flex-col max-sm:items-start max-sm:gap-2">
                  <span className={`text-sm font-bold font-mono ${styles.accentText}`}>{out.label}</span>
                  <div className="flex items-center gap-2 flex-wrap">
                    {out.isPrivateKey && (
                      <div className={styles.formatToggleContainer}>
                        <button
                          type="button"
                          onClick={() => setKeyFormat('pkcs8')}
                          className={`${styles.formatBtn} ${keyFormat === 'pkcs8' ? styles.formatBtnActive : ''} cursor-pointer`}
                        >
                          PKCS#8
                        </button>
                        <button
                          type="button"
                          onClick={() => setKeyFormat('pkcs1')}
                          className={`${styles.formatBtn} ${keyFormat === 'pkcs1' ? styles.formatBtnActive : ''} cursor-pointer`}
                        >
                          PKCS#1
                        </button>
                      </div>
                    )}
                    {!out.isPrivateKey && activeTab !== 'cer-chain-fix' && (
                      <button
                        type="button"
                        onClick={() => sendCertToChainFix(displayContent)}
                        className={`${styles.btnSecondary} cursor-pointer`}
                      >
                        {t.openInChainFix}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(displayContent).then(() => showToast(t.toastCopiedFilename(downloadFilename)));
                      }}
                      className={`${styles.btnSecondary} cursor-pointer`}
                    >
                      {t.copyText}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const blob = new Blob([displayContent], { type: 'text/plain' });
                        downloadBlob(blob, downloadFilename);
                      }}
                      className={`${styles.btnPrimarySmall} cursor-pointer`}
                    >
                      {t.downloadFile} {downloadFilename}
                    </button>
                  </div>
                </div>

                <pre className={styles.certOutput}>{displayContent}</pre>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
