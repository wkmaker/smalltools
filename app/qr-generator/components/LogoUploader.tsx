'use client';

import { useRef, useState } from 'react';
import styles from '../qr-generator.module.css';

interface LogoUploaderProps {
  t: any;
  logoBase64: string;
  logoName: string;
  logoSize: number;
  setLogoSize: (v: number) => void;
  logoSizeId: string;
  onLogoSelected: (file: File) => void;
  onRemoveLogo: () => void;
}

export default function LogoUploader({
  t,
  logoBase64,
  logoName,
  logoSize,
  setLogoSize,
  logoSizeId,
  onLogoSelected,
  onRemoveLogo,
}: LogoUploaderProps) {
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex flex-col gap-3 border-t border-border-glass pt-6">
      <span className="text-sm font-medium text-text-sub">{t.centerLogo}</span>

      {!logoBase64 ? (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragOver(false);
            if (e.dataTransfer.files.length > 0) {
              onLogoSelected(e.dataTransfer.files[0]);
            }
          }}
          onClick={() => fileInputRef.current?.click()}
          className={`${styles.dropzoneContainer} ${isDragOver ? styles.dropzoneContainerDragover : ''}`}
        >
          <svg viewBox="0 0 24 24" className="w-8 h-8 fill-text-sub transition-colors">
            <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z" />
          </svg>
          <div className="text-xs text-text-sub font-medium leading-normal">{t.dropzoneText}</div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                onLogoSelected(e.target.files[0]);
              }
            }}
            className="hidden"
          />
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between bg-select-bg border border-border-glass rounded-xl px-4 py-3 w-full">
            <div className="flex items-center gap-3">
              <img
                src={logoBase64}
                alt="Logo Preview"
                className="w-8 h-8 object-contain bg-white rounded border border-black/10"
              />
              <span className="text-sm font-medium text-text-main max-w-[200px] truncate">{logoName}</span>
            </div>
            <button type="button" onClick={onRemoveLogo} title={t.removeLogo} aria-label={t.removeLogo}
              className="bg-transparent border-none text-text-sub hover:text-red-500 hover:scale-115 transition-all cursor-pointer p-1"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
              </svg>
            </button>
          </div>

          {/* 調整 Logo 大小 */}
          <div className="flex flex-col gap-3">
            <div className="flex justify-between text-sm text-text-sub font-medium">
              <label htmlFor={logoSizeId}>{t.logoSize}</label>
              <span className={styles.greenText}>{logoSize}%</span>
            </div>
            <input
              id={logoSizeId}
              type="range"
              min="10"
              max="35"
              value={logoSize}
              onChange={(e) => setLogoSize(parseInt(e.target.value))}
              className="w-full accent-[#00ff66] h-1.5 rounded-lg bg-white/10 cursor-pointer"
            />
          </div>

          {/* 安全防禦提示 */}
          <div className={styles.alertBox}>
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current shrink-0 mt-0.5">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
            </svg>
            <div>
              <strong>{t.autoSafetyTitle}</strong>
              {t.autoSafetyDesc}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
