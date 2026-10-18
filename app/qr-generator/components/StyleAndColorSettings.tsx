'use client';

import type { ErrorCorrectionLevel, GradientType } from '../types';
import styles from '../qr-generator.module.css';

interface StyleAndColorSettingsProps {
  t: any;
  // 碼體
  dotsType: string;
  setDotsType: (v: string) => void;
  // 定位點
  cornersSquare: string;
  setCornersSquare: (v: string) => void;
  cornersDot: string;
  setCornersDot: (v: string) => void;
  // 背景
  bgColor: string;
  setBgColor: (v: string) => void;
  bgTransparent: boolean;
  setBgTransparent: (v: boolean) => void;
  bgColorId: string;
  // 容錯率
  errorCorrection: ErrorCorrectionLevel;
  setErrorCorrection: (v: ErrorCorrectionLevel) => void;
  errorCorrectionId: string;
  logoBase64: string;
  // 漸層與配色
  useGradient: boolean;
  setUseGradient: (v: boolean) => void;
  gradientType: GradientType;
  setGradientType: (v: GradientType) => void;
  gradientTypeId: string;
  color1: string;
  setColor1: (v: string) => void;
  color2: string;
  setColor2: (v: string) => void;
  gradientRotation: number;
  setGradientRotation: (v: number) => void;
  singleColor: string;
  setSingleColor: (v: string) => void;
}

export default function StyleAndColorSettings(props: StyleAndColorSettingsProps) {
  const { t } = props;

  return (
    <>
      {/* 碼體樣式 (網格) */}
      <div className="flex flex-col gap-3">
        <span className="text-sm font-medium text-text-sub">{t.dotsStyle}</span>
        <div className="grid grid-cols-6 gap-2.5 max-md:grid-cols-3 max-sm:grid-cols-2">
          {[
            {
              id: 'square',
              name: t.square,
              icon: (
                <svg viewBox="0 0 24 24" className="w-5 h-5">
                  <rect x="4" y="4" width="16" height="16" fill="currentColor" />
                </svg>
              ),
            },
            {
              id: 'dots',
              name: t.dots,
              icon: (
                <svg viewBox="0 0 24 24" className="w-5 h-5">
                  <circle cx="12" cy="12" r="8" fill="currentColor" />
                </svg>
              ),
            },
            {
              id: 'rounded',
              name: t.rounded,
              icon: (
                <svg viewBox="0 0 24 24" className="w-5 h-5">
                  <rect x="4" y="4" width="16" height="16" rx="5" fill="currentColor" />
                </svg>
              ),
            },
            {
              id: 'classy',
              name: t.classy,
              icon: (
                <svg viewBox="0 0 24 24" className="w-5 h-5">
                  <path d="M4 12C4 7.58 7.58 4 12 4H20V12C20 16.42 16.42 20 12 20H4V12Z" fill="currentColor" />
                </svg>
              ),
            },
            {
              id: 'classy-rounded',
              name: t.classyRounded,
              icon: (
                <svg viewBox="0 0 24 24" className="w-5 h-5">
                  <path d="M4 12C4 7.58 7.58 4 12 4H20L20 12C20 16.42 16.42 20 12 20L4 12Z" fill="currentColor" />
                </svg>
              ),
            },
            {
              id: 'extra-rounded',
              name: t.extraRounded,
              icon: (
                <svg viewBox="0 0 24 24" className="w-5 h-5">
                  <rect x="4" y="4" width="16" height="16" rx="8" fill="currentColor" />
                </svg>
              ),
            },
          ].map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => props.setDotsType(opt.id)}
              className={`${styles.styleOptionBtn} ${props.dotsType === opt.id ? styles.styleOptionBtnActive : ''}`}
            >
              {opt.icon}
              <span className="text-xs font-medium">{opt.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6 max-sm:grid-cols-1">
        {/* 定位點外框 */}
        <div className="flex flex-col gap-3">
          <span className="text-sm font-medium text-text-sub">{t.cornersSquareStyle}</span>
          <div className="grid grid-cols-3 gap-2">
            {[
              {
                id: 'extra-rounded',
                name: t.shieldRounded,
                icon: (
                  <svg viewBox="0 0 24 24" className="w-5 h-5">
                    <rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" strokeWidth="3" />
                  </svg>
                ),
              },
              {
                id: 'square',
                name: t.square,
                icon: (
                  <svg viewBox="0 0 24 24" className="w-5 h-5">
                    <rect x="3" y="3" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="3" />
                  </svg>
                ),
              },
              {
                id: 'dot',
                name: t.ring,
                icon: (
                  <svg viewBox="0 0 24 24" className="w-5 h-5">
                    <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="3" />
                  </svg>
                ),
              },
            ].map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => props.setCornersSquare(opt.id)}
                className={`${styles.styleOptionBtn} ${
                  props.cornersSquare === opt.id ? styles.styleOptionBtnActive : ''
                }`}
              >
                {opt.icon}
                <span className="text-xs font-medium">{opt.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 定位點內核 */}
        <div className="flex flex-col gap-3">
          <span className="text-sm font-medium text-text-sub">{t.cornersDotStyle}</span>
          <div className="grid grid-cols-3 gap-2">
            {[
              {
                id: 'dot',
                name: t.dots,
                icon: (
                  <svg viewBox="0 0 24 24" className="w-5 h-5">
                    <circle cx="12" cy="12" r="6" fill="currentColor" />
                  </svg>
                ),
              },
              {
                id: 'square',
                name: t.square,
                icon: (
                  <svg viewBox="0 0 24 24" className="w-5 h-5">
                    <rect x="6" y="6" width="12" height="12" fill="currentColor" />
                  </svg>
                ),
              },
              {
                id: 'rounded',
                name: t.rounded,
                icon: (
                  <svg viewBox="0 0 24 24" className="w-5 h-5">
                    <rect x="6" y="6" width="12" height="12" rx="3" fill="currentColor" />
                  </svg>
                ),
              },
            ].map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => props.setCornersDot(opt.id)}
                className={`${styles.styleOptionBtn} ${props.cornersDot === opt.id ? styles.styleOptionBtnActive : ''}`}
              >
                {opt.icon}
                <span className="text-xs font-medium">{opt.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6 max-sm:grid-cols-1">
        {/* 背景色與透明設定 */}
        <div className="flex flex-col gap-3">
          <label htmlFor={props.bgColorId} className="text-sm font-medium text-text-sub">
            {t.bgSettings}
          </label>
          <div className="flex gap-4 items-center">
            <div className="flex items-center gap-2.5 bg-select-bg border border-border-glass px-3 py-2 rounded-xl">
              <input
                id={props.bgColorId}
                type="color"
                value={props.bgColor}
                onChange={(e) => props.setBgColor(e.target.value)}
                disabled={props.bgTransparent}
                className="w-8 h-8 bg-transparent border-none outline-none cursor-pointer disabled:opacity-30"
              />
              <span className="font-mono text-sm text-text-main font-medium">
                {props.bgTransparent ? 'TRANSPARENT' : props.bgColor.toUpperCase()}
              </span>
            </div>
            <label className="flex items-center gap-2 cursor-pointer select-none text-text-sub text-sm font-medium">
              <input
                type="checkbox"
                checked={props.bgTransparent}
                onChange={(e) => props.setBgTransparent(e.target.checked)}
                className="accent-[#00ff66] w-4.5 h-4.5 rounded"
              />
              {t.transparentBg}
            </label>
          </div>
        </div>

        {/* 容錯率設定 */}
        <div className="flex flex-col gap-3">
          <label htmlFor={props.errorCorrectionId} className="text-sm font-medium text-text-sub">
            {t.errorCorrection}
          </label>
          <select
            id={props.errorCorrectionId}
            value={props.logoBase64 ? 'H' : props.errorCorrection}
            onChange={(e) => props.setErrorCorrection(e.target.value as ErrorCorrectionLevel)}
            disabled={!!props.logoBase64}
            className="w-full bg-select-bg text-text-main border border-border-glass rounded-xl px-4 py-3 outline-none focus:border-[#00ff66]/40 text-base font-medium cursor-pointer disabled:opacity-50"
          >
            <option value="L">{t.errorCorrectionL}</option>
            <option value="M">{t.errorCorrectionM}</option>
            <option value="Q">{t.errorCorrectionQ}</option>
            <option value="H">{t.errorCorrectionH}</option>
          </select>
        </div>
      </div>

      {/* 啟用漸層與配色 */}
      <div className="flex flex-col gap-4 border-t border-border-glass pt-6">
        <div className="flex items-center">
          <label className="flex items-center gap-3 cursor-pointer select-none text-text-sub text-base font-medium">
            <input
              type="checkbox"
              checked={props.useGradient}
              onChange={(e) => props.setUseGradient(e.target.checked)}
              className="accent-[#00ff66] w-5 h-5 rounded"
            />
            {t.enableGradient}
          </label>
        </div>

        {props.useGradient ? (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
              <div className="flex flex-col gap-3">
                <label htmlFor={props.gradientTypeId} className="text-sm font-medium text-text-sub">
                  {t.gradientType}
                </label>
                <select
                  id={props.gradientTypeId}
                  value={props.gradientType}
                  onChange={(e) => props.setGradientType(e.target.value as GradientType)}
                  className="w-full bg-select-bg text-text-main border border-border-glass rounded-xl px-4 py-3 outline-none focus:border-[#00ff66]/40 text-base font-medium cursor-pointer"
                >
                  <option value="linear">{t.linearGradient}</option>
                  <option value="radial">{t.radialGradient}</option>
                </select>
              </div>

              <div className="flex flex-col gap-3">
                <span className="text-sm font-medium text-text-sub">{t.colorPair}</span>
                <div className="flex gap-3">
                  <div className="flex items-center gap-2 bg-select-bg border border-border-glass px-3 py-2 rounded-xl flex-1">
                    <input
                      type="color"
                      value={props.color1}
                      onChange={(e) => props.setColor1(e.target.value)}
                      className="w-8 h-8 bg-transparent border-none outline-none cursor-pointer"
                    />
                    <span className="font-mono text-xs text-text-main font-medium">{props.color1.toUpperCase()}</span>
                  </div>
                  <div className="flex items-center gap-2 bg-select-bg border border-border-glass px-3 py-2 rounded-xl flex-1">
                    <input
                      type="color"
                      value={props.color2}
                      onChange={(e) => props.setColor2(e.target.value)}
                      className="w-8 h-8 bg-transparent border-none outline-none cursor-pointer"
                    />
                    <span className="font-mono text-xs text-text-main font-medium">{props.color2.toUpperCase()}</span>
                  </div>
                </div>
              </div>
            </div>

            {props.gradientType === 'linear' && (
              <div className="flex flex-col gap-3">
                <div className="flex justify-between text-sm text-text-sub font-medium">
                  <span>{t.gradientAngle}</span>
                  <span className={styles.greenText}>{props.gradientRotation}°</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="360"
                  value={props.gradientRotation}
                  onChange={(e) => props.setGradientRotation(parseInt(e.target.value))}
                  className="w-full accent-[#00ff66] h-1.5 rounded-lg bg-white/10 cursor-pointer"
                />
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <span className="text-sm font-medium text-text-sub">{t.singleColor}</span>
            <div className="flex items-center gap-2.5 bg-select-bg border border-border-glass px-3 py-2 rounded-xl w-fit">
              <input
                type="color"
                value={props.singleColor}
                onChange={(e) => props.setSingleColor(e.target.value)}
                className="w-8 h-8 bg-transparent border-none outline-none cursor-pointer"
              />
              <span className="font-mono text-sm text-text-main font-medium">{props.singleColor.toUpperCase()}</span>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
