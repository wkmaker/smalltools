'use client';

import React from 'react';
import type { LogoShape } from '../types';
import { PRESET_ICONS } from '../constants';
import styles from '../og-generator.module.css';

interface MediaSettingsCardProps {
  t: any;
  lang: 'zh-TW' | 'en';
  enableLogo: boolean;
  setEnableLogo: (v: boolean) => void;
  logoImage: HTMLImageElement | null;
  setLogoImage: (img: HTMLImageElement | null) => void;
  selectedIconId: string;
  setSelectedIconId: (id: string) => void;
  logoShape: LogoShape;
  setLogoShape: (shape: LogoShape) => void;
  logoSize: number;
  setLogoSize: (size: number) => void;
  handleLogoUpload: (file: File) => void;

  enableBgImage: boolean;
  setEnableBgImage: (v: boolean) => void;
  bgImage: HTMLImageElement | null;
  setBgImage: (img: HTMLImageElement | null) => void;
  bgOpacity: number;
  setBgOpacity: (op: number) => void;
  bgBlur: number;
  setBgBlur: (blur: number) => void;
  handleBgUpload: (file: File) => void;

  // A11y IDs
  logoUploadId: string;
  bgUploadId: string;
  logoSizeId: string;
  bgOpacityId: string;
  bgBlurId: string;
}

export default function MediaSettingsCard({
  t,
  lang,
  enableLogo,
  setEnableLogo,
  logoImage,
  setLogoImage,
  selectedIconId,
  setSelectedIconId,
  logoShape,
  setLogoShape,
  logoSize,
  setLogoSize,
  handleLogoUpload,
  enableBgImage,
  setEnableBgImage,
  bgImage,
  setBgImage,
  bgOpacity,
  setBgOpacity,
  bgBlur,
  setBgBlur,
  handleBgUpload,
  logoUploadId,
  bgUploadId,
  logoSizeId,
  bgOpacityId,
  bgBlurId,
}: MediaSettingsCardProps) {
  return (
    <div className="p-6 rounded-2xl bg-surface-glass border border-border-glass space-y-6">
      <div className="flex items-center gap-2">
        <svg className="w-5 h-5 text-[#818cf8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <span className="text-sm font-semibold text-text-main">{t.mediaSettings}</span>
      </div>

      {/* Logo 區塊 */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="block text-sm font-medium text-text-sub">{t.logoSectionTitle}</span>
          <button
            type="button"
            onClick={() => setEnableLogo(!enableLogo)}
            className={`px-2.5 py-1 text-xs rounded-lg border transition-all cursor-pointer ${
              enableLogo
                ? 'border-[#6366f1] bg-[#6366f1]/20 text-text-main font-semibold'
                : 'border-border-glass bg-select-bg text-text-sub'
            }`}
          >
            {enableLogo ? t.logoEnabled : t.logoDisabled}
          </button>
        </div>

        {enableLogo ? (
          <>
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (e.dataTransfer.files?.[0]) handleLogoUpload(e.dataTransfer.files[0]);
              }}
              className={`p-4 rounded-xl text-center cursor-pointer ${styles.dropzone}`}
              onClick={() => document.getElementById(logoUploadId)?.click()}
            >
              <input
                id={logoUploadId}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.[0]) handleLogoUpload(e.target.files[0]);
                }}
              />
              <div className="text-sm font-medium text-text-main">
                {logoImage ? t.logoLoaded : t.logoUploadHint}
              </div>
            </div>

            {logoImage && (
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-text-sub">{t.logoShape}:</span>
                  {(['rounded', 'circle', 'square', 'none'] as const).map((shape) => (
                    <button
                      key={shape}
                      type="button"
                      onClick={() => setLogoShape(shape)}
                      className={`px-2.5 py-1 text-xs rounded-lg border cursor-pointer ${
                        logoShape === shape
                          ? 'border-[#6366f1] bg-[#6366f1]/20 text-text-main font-semibold'
                          : 'border-border-glass bg-select-bg text-text-sub'
                      }`}
                    >
                      {shape === 'circle' ? t.shapeCircle : shape === 'rounded' ? t.shapeRounded : shape === 'square' ? t.shapeSquare : t.shapeNone}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setLogoImage(null)}
                  className="text-xs text-[#f43f5e] hover:underline cursor-pointer"
                >
                  {t.clearImage}
                </button>
              </div>
            )}

            {/* 內建圖示選擇 */}
            {!logoImage && (
              <div className="space-y-2 pt-2">
                <span className="text-xs text-text-sub">{t.presetIconLabel}:</span>
                <div className="flex flex-wrap gap-2">
                  {PRESET_ICONS.map((icon) => (
                    <button
                      key={icon.id}
                      type="button"
                      onClick={() => setSelectedIconId(icon.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 border transition-all cursor-pointer ${
                        selectedIconId === icon.id
                          ? 'border-[#6366f1] bg-[#6366f1]/20 text-text-main font-bold'
                          : 'border-border-glass bg-select-bg text-text-sub hover:text-text-main'
                      }`}
                    >
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                        <path d={icon.path} />
                      </svg>
                      <span>{icon.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Logo 尺寸滑桿 */}
            <div className="pt-2">
              <div className="flex items-center justify-between text-xs text-text-sub mb-1">
                <label htmlFor={logoSizeId}>{t.logoSize}</label>
                <span>{logoSize}px</span>
              </div>
              <input
                id={logoSizeId}
                type="range"
                min="40"
                max="100"
                value={logoSize}
                onChange={(e) => setLogoSize(Number(e.target.value))}
                className="w-full accent-[#6366f1]"
              />
            </div>
          </>
        ) : (
          <div className="p-3 rounded-xl bg-select-bg/50 border border-border-glass text-xs text-text-sub text-center">
            {lang === 'zh-TW' ? '已關閉底部 Logo 與圖示顯示，點擊右上角「已關閉」可隨時重新開啟。' : 'Logo & Icon display is disabled. Click the button above to re-enable.'}
          </div>
        )}
      </div>

      {/* 特色/背景圖片區塊 */}
      <div className="space-y-3 pt-4 border-t border-border-glass">
        <div className="flex items-center justify-between">
          <span className="block text-sm font-medium text-text-sub">{t.bgSectionTitle}</span>
          <button
            type="button"
            onClick={() => setEnableBgImage(!enableBgImage)}
            className={`px-2.5 py-1 text-xs rounded-lg border transition-all cursor-pointer ${
              enableBgImage
                ? 'border-[#6366f1] bg-[#6366f1]/20 text-text-main font-semibold'
                : 'border-border-glass bg-select-bg text-text-sub'
            }`}
          >
            {enableBgImage ? t.bgEnabled : t.bgDisabled}
          </button>
        </div>

        <div className="text-[12px] text-text-sub leading-relaxed">
          {t.bgImageOptionalHint}
        </div>

        {enableBgImage ? (
          <>
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (e.dataTransfer.files?.[0]) handleBgUpload(e.dataTransfer.files[0]);
              }}
              className={`p-4 rounded-xl text-center cursor-pointer ${styles.dropzone}`}
              onClick={() => document.getElementById(bgUploadId)?.click()}
            >
              <input
                id={bgUploadId}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.[0]) handleBgUpload(e.target.files[0]);
                }}
              />
              <div className="text-sm font-medium text-text-main">
                {bgImage ? t.bgLoaded : t.bgImageHint}
              </div>
            </div>

            {bgImage && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <label htmlFor={bgOpacityId} className="text-xs text-text-sub">{t.bgOpacity}</label>
                  <button
                    type="button"
                    onClick={() => setBgImage(null)}
                    className="text-xs text-[#f43f5e] hover:underline cursor-pointer"
                  >
                    {t.clearImage}
                  </button>
                </div>
                <input
                  id={bgOpacityId}
                  type="range"
                  min="10"
                  max="100"
                  value={bgOpacity}
                  onChange={(e) => setBgOpacity(Number(e.target.value))}
                  className="w-full accent-[#6366f1]"
                />
                <div className="flex items-center justify-between text-xs text-text-sub">
                  <label htmlFor={bgBlurId}>{t.bgBlur}</label>
                  <span>{bgBlur}px</span>
                </div>
                <input
                  id={bgBlurId}
                  type="range"
                  min="0"
                  max="20"
                  value={bgBlur}
                  onChange={(e) => setBgBlur(Number(e.target.value))}
                  className="w-full accent-[#6366f1]"
                />
              </div>
            )}
          </>
        ) : (
          <div className="p-3 rounded-xl bg-select-bg/50 border border-border-glass text-xs text-text-sub text-center">
            {lang === 'zh-TW' ? '已關閉特色/背景圖片功能，頁面將維持純粹極簡幾何漸層。' : 'Background & feature image is disabled. Clean geometric gradients will be used.'}
          </div>
        )}
      </div>
    </div>
  );
}
