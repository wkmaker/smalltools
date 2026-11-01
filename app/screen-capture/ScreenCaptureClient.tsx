'use client';

import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import ToolLayout from '../components/ToolLayout';
import FaqSection from '../components/FaqSection';
import { formatBytes } from '../utils/formatBytes';
import { downloadBlob } from '../utils/downloadBlob';
import styles from './screen-capture.module.css';
import {
  BITRATE_PRESETS,
  DEFAULT_BITRATE_PRESET,
  DEFAULT_FPS,
  DEFAULT_RESOLUTION_PRESET,
  FPS_OPTIONS,
  RESOLUTION_PRESETS,
  bitrateOf,
  formatDuration,
  minutesPerGigabyte,
  sanitizeResolutionPreset,
  type BitratePresetId,
  type FpsOption,
  type ResolutionPresetId,
} from './engine';
import { useMicrophone } from './useMicrophone';
import { useScreenRecorder, type RecorderNotice } from './useScreenRecorder';
import { usePrv5Sender } from './usePrv5Sender';
import { TRANSLATIONS } from './translations';

interface Props {
  lang?: 'zh-TW' | 'en';
}

const ACCENT = '#ff3b30';
const ACCENT_GLOW = 'rgba(255, 59, 48, 0.5)';

export default function ScreenCaptureClient({ lang = 'zh-TW' }: Props) {
  const t = TRANSLATIONS[lang] || TRANSLATIONS['zh-TW'];

  const micSelectId = useId();
  const resolutionSelectId = useId();
  const fpsSelectId = useId();
  const bitrateSelectId = useId();

  const [micEnabled, setMicEnabled] = useState(false);
  const [countdownEnabled, setCountdownEnabled] = useState(true);
  const [resolutionPreset, setResolutionPreset] = useState<ResolutionPresetId>(DEFAULT_RESOLUTION_PRESET);
  const [fps, setFps] = useState<FpsOption>(DEFAULT_FPS);
  const [bitratePreset, setBitratePreset] = useState<BitratePresetId>(DEFAULT_BITRATE_PRESET);
  const [showDiscardModal, setShowDiscardModal] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [toast, setToast] = useState<{ msg: string; show: boolean }>({ msg: '', show: false });
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    document.documentElement.style.setProperty('--theme-color', ACCENT);
    document.documentElement.style.setProperty('--accent-glow', ACCENT_GLOW);
  }, []);

  const showToast = useCallback((msg: string) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ msg, show: true });
    toastTimerRef.current = setTimeout(() => setToast(s => ({ ...s, show: false })), 3000);
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  const handleNotice = useCallback(
    (notice: RecorderNotice) => {
      switch (notice) {
        case 'unsupported':
          showToast(t.noticeUnsupported);
          break;
        case 'select-cancelled':
          showToast(t.noticeSelectCancelled);
          break;
        case 'select-failed':
          showToast(t.noticeSelectFailed);
          break;
        case 'mic-failed':
          showToast(t.noticeMicFailed);
          break;
        case 'no-system-audio':
          showToast(t.noticeNoSystemAudio);
          break;
        case 'recorder-failed':
          showToast(t.noticeRecorderFailed);
          break;
        case 'no-data':
          showToast(t.noticeNoData);
          break;
      }
    },
    [showToast, t]
  );

  const {
    devices: micDevices,
    deviceId: micDeviceId,
    setDeviceId: setMicDeviceId,
    active: micActive,
    meterRef,
  } = useMicrophone(micEnabled);

  const {
    phase,
    countdown,
    elapsedMs,
    result,
    start,
    pause,
    resume,
    stop,
    discard,
  } = useScreenRecorder(handleNotice);

  const { status: prv5Status, send: sendToPrv5, focusPrv5 } = usePrv5Sender(result?.file ?? null);

  const handleStart = () => {
    start({
      fps,
      resolutionPreset,
      videoBitsPerSecond: bitrateOf(bitratePreset),
      countdownEnabled,
      micEnabled,
      micDeviceId,
    });
  };

  const handleDownload = () => {
    if (!result) return;
    downloadBlob(result.file, result.file.name);
    showToast(t.toastDownloaded);
  };

  const handleConfirmDiscard = () => {
    setShowDiscardModal(false);
    discard();
  };

  const estMinutes = useMemo(() => {
    return minutesPerGigabyte(bitrateOf(bitratePreset));
  }, [bitratePreset]);

  const isRecordingActive = phase === 'recording' || phase === 'paused';

  return (
    <>
      <ToolLayout
        title={t.title}
        subtitle={t.subtitle}
        description={t.description}
        accentColor={ACCENT}
        accentGlow={ACCENT_GLOW}
      >
        <div className={styles.container}>
          {/* 倒數計時全螢幕/遮罩浮層 */}
          {phase === 'countdown' && (
            <div className={styles.countdownOverlay}>
              <div className="flex items-center gap-3 text-text-sub text-base font-semibold">
                <svg viewBox="0 0 24 24" width={22} height={22} fill="currentColor">
                  <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.5-13H11v6l5.2 3.2.8-1.3-4.5-2.7V7z" />
                </svg>
                {t.statusCountdown}
              </div>
              <div className={styles.countdownNumber}>{countdown}</div>
              <button type="button" onClick={stop} className={styles.btnSecondary}>
                <svg viewBox="0 0 24 24" width={16} height={16} fill="currentColor">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                </svg>
                {t.cancelBtn}
              </button>
            </div>
          )}

          {/* 狀態與碼表頂欄 */}
          <div className={styles.statusBanner}>
            <div className="flex items-center gap-3">
              {phase === 'recording' && <span className={styles.recDot} />}
              {phase === 'paused' && (
                <span className="w-3 h-3 rounded-sm bg-amber-400 inline-block shadow-[0_0_8px_rgba(251,191,36,0.6)]" />
              )}
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-text-sub uppercase tracking-wider">
                  {phase === 'recording' && t.recordingBadge}
                  {phase === 'paused' && t.pausedBadge}
                  {phase === 'idle' && t.statusIdle}
                  {phase === 'selecting' && t.statusSelecting}
                  {phase === 'processing' && t.statusProcessing}
                  {phase === 'done' && t.statusDone}
                </span>
                <span className="text-sm font-semibold text-text-main">
                  {phase === 'recording'
                    ? t.statusRecording
                    : phase === 'paused'
                    ? t.statusPaused
                    : phase === 'done'
                    ? t.statusDone
                    : t.statusIdle}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <span className={styles.timerValue}>{formatDuration(elapsedMs)}</span>
            </div>
          </div>

          {/* 主要控制區塊 */}
          {phase === 'done' && result ? (
            /* 錄影完成預覽與分享面板 */
            <div className="grid grid-cols-[1.4fr_1fr] gap-6 max-lg:grid-cols-1 items-start">
              {/* 左側：預覽播放器 */}
              <div className={styles.panelCard}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-bold text-text-main flex items-center gap-2">
                    <svg viewBox="0 0 24 24" width={20} height={20} fill={ACCENT}>
                      <path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H8V4h12v12z" />
                    </svg>
                    {t.previewTitle}
                  </h3>
                  <span className="text-xs font-mono text-text-sub">{result.file.name}</span>
                </div>

                <div className={styles.videoWrapper}>
                  <video
                    src={result.url}
                    controls
                    playsInline
                    className={styles.videoElement}
                    aria-label={t.previewTitle}
                  />
                </div>

                <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-border-glass">
                  <div>
                    <span className="text-xs font-medium text-text-sub block">{t.durationLabel}</span>
                    <span className="text-sm font-semibold text-text-main font-mono">
                      {formatDuration(result.durationMs)}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs font-medium text-text-sub block">{t.fileSizeLabel}</span>
                    <span className="text-sm font-semibold text-text-main font-mono">
                      {formatBytes(result.file.size)}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs font-medium text-text-sub block">{t.formatLabel}</span>
                    <span className="text-sm font-semibold text-text-main font-mono uppercase">
                      {result.mimeType}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 mt-6 pt-4 border-t border-border-glass flex-wrap">
                  <button
                    type="button"
                    onClick={() => setShowDiscardModal(true)}
                    className={styles.btnDanger}
                  >
                    <svg viewBox="0 0 24 24" width={16} height={16} fill="currentColor">
                      <path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z" />
                    </svg>
                    {t.discardRecordBtn}
                  </button>

                  <button
                    type="button"
                    onClick={handleDownload}
                    className={styles.btnPrimary}
                  >
                    <svg viewBox="0 0 24 24" width={18} height={18} fill="currentColor">
                      <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
                    </svg>
                    {t.downloadVideoBtn}
                  </button>
                </div>
              </div>

              {/* 右側：PRV5 私密分享區塊 */}
              <div className={styles.panelCard}>
                <div className="flex items-center gap-2 mb-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8' }}
                  >
                    <svg viewBox="0 0 24 24" width={18} height={18} fill="currentColor">
                      <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-5.45 9-12V5l-9-4zm-1 6h2v2h-2V7zm0 4h2v6h-2v-6z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-text-main">{t.prv5Title}</h3>
                    <span className="text-xs text-text-sub">USSL End-to-End Handshake</span>
                  </div>
                </div>

                <p className="text-xs text-text-sub leading-relaxed mb-4">{t.prv5Desc}</p>

                <div className="flex flex-col gap-3">
                  <button
                    type="button"
                    onClick={sendToPrv5}
                    disabled={prv5Status === 'waiting'}
                    className={styles.btnPrv5}
                  >
                    <svg viewBox="0 0 24 24" width={18} height={18} fill="currentColor">
                      <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                    </svg>
                    {prv5Status === 'waiting' ? t.sendingToPrv5Btn : t.sendToPrv5Btn}
                  </button>

                  {prv5Status === 'waiting' && (
                    <div className={styles.infoBoxWaiting}>
                      {t.prv5StatusWaiting}
                    </div>
                  )}

                  {prv5Status === 'sent' && (
                    <div className={styles.infoBoxSuccess}>
                      {t.prv5StatusSent}
                    </div>
                  )}

                  {prv5Status === 'blocked' && (
                    <div className={`${styles.infoBoxWarning} flex flex-col gap-2`}>
                      <span>{t.prv5StatusBlocked}</span>
                      <button
                        type="button"
                        onClick={sendToPrv5}
                        className={styles.btnSecondary}
                      >
                        {t.reopenPrv5Btn}
                      </button>
                    </div>
                  )}

                  {prv5Status === 'timeout' && (
                    <div className={styles.infoBoxError}>
                      {t.prv5StatusTimeout}
                    </div>
                  )}

                  {prv5Status === 'closed' && (
                    <div className={styles.infoBoxWarning}>
                      {t.prv5StatusClosed}
                    </div>
                  )}

                  {prv5Status === 'failed' && (
                    <div className={styles.infoBoxError}>
                      {t.prv5StatusFailed}
                    </div>
                  )}

                  {prv5Status === 'sent' && (
                    <button
                      type="button"
                      onClick={focusPrv5}
                      className={styles.btnSecondary}
                    >
                      {t.reopenPrv5Btn}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* 錄製中或初始設定面板 */
            <div className="grid grid-cols-[1.3fr_1fr] gap-6 max-lg:grid-cols-1 items-start">
              {/* 左側：控制動作卡片 */}
              <div className={styles.panelCard}>
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  {!isRecordingActive ? (
                    <>
                      <div
                        className="w-20 h-20 rounded-full flex items-center justify-center mb-5 border shadow-xl cursor-pointer transition-transform hover:scale-105"
                        style={{
                          background: 'rgba(255, 59, 48, 0.12)',
                          borderColor: 'rgba(255, 59, 48, 0.4)',
                        }}
                        onClick={handleStart}
                      >
                        <svg viewBox="0 0 24 24" width={38} height={38} fill={ACCENT}>
                          <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z" />
                        </svg>
                      </div>
                      <button
                        type="button"
                        onClick={handleStart}
                        className={styles.btnPrimary}
                        style={{ minWidth: 200 }}
                      >
                        <svg viewBox="0 0 24 24" width={18} height={18} fill="currentColor">
                          <circle cx="12" cy="12" r="7" />
                        </svg>
                        {t.startRecordBtn}
                      </button>
                    </>
                  ) : (
                    <div className="flex flex-col items-center gap-6 w-full">
                      <div className="flex items-center gap-3">
                        <span className={styles.recDot} style={{ width: 16, height: 16 }} />
                        <span className="text-xl font-bold text-text-main font-mono">
                          {formatDuration(elapsedMs)}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 flex-wrap justify-center">
                        {phase === 'recording' ? (
                          <button
                            type="button"
                            onClick={pause}
                            className={styles.btnSecondary}
                            style={{ minWidth: 130 }}
                          >
                            <svg viewBox="0 0 24 24" width={18} height={18} fill="currentColor">
                              <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                            </svg>
                            {t.pauseRecordBtn}
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={resume}
                            className={styles.btnSecondary}
                            style={{ minWidth: 130 }}
                          >
                            <svg viewBox="0 0 24 24" width={18} height={18} fill="currentColor">
                              <path d="M8 5v14l11-7z" />
                            </svg>
                            {t.resumeRecordBtn}
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={stop}
                          className={styles.btnPrimary}
                          style={{ minWidth: 150 }}
                        >
                          <svg viewBox="0 0 24 24" width={18} height={18} fill="currentColor">
                            <rect x="6" y="6" width="12" height="12" rx="2" />
                          </svg>
                          {t.stopRecordBtn}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* 倒數開關 */}
                <div className="pt-4 border-t border-border-glass">
                  <label className={styles.customCheckbox}>
                    <input
                      type="checkbox"
                      checked={countdownEnabled}
                      disabled={isRecordingActive}
                      onChange={e => setCountdownEnabled(e.target.checked)}
                    />
                    <span className={styles.checkmark} />
                    <span className="text-sm font-medium text-text-main">{t.countdownToggleLabel}</span>
                  </label>
                </div>
              </div>

              {/* 右側：音訊與進階設定 */}
              <div className="flex flex-col gap-4">
                {/* 麥克風音訊設定卡片 */}
                <div className={styles.panelCard}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-text-main">{t.audioSettingsTitle}</h3>
                    <span className="text-xs text-text-sub font-mono">Web Audio API</span>
                  </div>

                  <div className="flex flex-col gap-3">
                    <label className={styles.customCheckbox}>
                      <input
                        type="checkbox"
                        checked={micEnabled}
                        disabled={isRecordingActive}
                        onChange={e => setMicEnabled(e.target.checked)}
                      />
                      <span className={styles.checkmark} />
                      <span className="text-sm font-medium text-text-main">{t.micToggleLabel}</span>
                    </label>

                    {micEnabled && (
                      <div className="flex flex-col gap-2.5 pt-2">
                        <label htmlFor={micSelectId} className="text-xs font-medium text-text-sub">
                          {t.micSelectLabel}
                        </label>
                        <select
                          id={micSelectId}
                          value={micDeviceId}
                          disabled={isRecordingActive || micDevices.length === 0}
                          onChange={e => setMicDeviceId(e.target.value)}
                          className={styles.customSelect}
                        >
                          {micDevices.length === 0 ? (
                            <option value="">{t.micSelectPlaceholder}</option>
                          ) : (
                            micDevices.map(d => (
                              <option key={d.deviceId} value={d.deviceId}>
                                {d.label || t.micSelectPlaceholder}
                              </option>
                            ))
                          )}
                        </select>

                        {/* VU Meter 音量條 */}
                        <div className="flex flex-col gap-1 pt-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-text-sub">{t.micLevelLabel}</span>
                            <span className="text-xs font-mono text-text-sub">
                              {micActive ? 'Active' : 'Muted'}
                            </span>
                          </div>
                          <div className={styles.meterTrack}>
                            <div ref={meterRef} className={styles.meterFill} />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* 進階畫質與容量折疊卡片 */}
                <div className={styles.panelCard}>
                  <button
                    type="button"
                    onClick={() => setShowAdvanced(s => !s)}
                    className="w-full flex items-center justify-between text-left"
                  >
                    <span className="text-sm font-bold text-text-main">{t.advancedSettingsTitle}</span>
                    <svg
                      viewBox="0 0 24 24"
                      width={18}
                      height={18}
                      fill="currentColor"
                      className={`text-text-sub transition-transform duration-200 ${
                        showAdvanced ? 'rotate-180' : ''
                      }`}
                    >
                      <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z" />
                    </svg>
                  </button>

                  {showAdvanced && (
                    <div className="flex flex-col gap-4 mt-4 pt-4 border-t border-border-glass">
                      <div>
                        <label htmlFor={resolutionSelectId} className="text-xs font-medium text-text-sub block mb-1.5">
                          {t.resolutionLabel}
                        </label>
                        <select
                          id={resolutionSelectId}
                          value={resolutionPreset}
                          disabled={isRecordingActive}
                          onChange={e => setResolutionPreset(sanitizeResolutionPreset(e.target.value))}
                          className={styles.customSelect}
                        >
                          {RESOLUTION_PRESETS.map(p => (
                            <option key={p.id} value={p.id}>
                              {p.id === '1080p'
                                ? t.resolutionPreset1080p
                                : p.id === 'original'
                                ? t.resolutionPresetOriginal
                                : t.resolutionPreset720p}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label htmlFor={fpsSelectId} className="text-xs font-medium text-text-sub block mb-1.5">
                          {t.fpsLabel}
                        </label>
                        <select
                          id={fpsSelectId}
                          value={fps}
                          disabled={isRecordingActive}
                          onChange={e => setFps(Number(e.target.value) as FpsOption)}
                          className={styles.customSelect}
                        >
                          {FPS_OPTIONS.map(opt => (
                            <option key={opt} value={opt}>
                              {opt} FPS
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label htmlFor={bitrateSelectId} className="text-xs font-medium text-text-sub block mb-1.5">
                          {t.bitrateLabel}
                        </label>
                        <select
                          id={bitrateSelectId}
                          value={bitratePreset}
                          disabled={isRecordingActive}
                          onChange={e => setBitratePreset(e.target.value as BitratePresetId)}
                          className={styles.customSelect}
                        >
                          {BITRATE_PRESETS.map(p => (
                            <option key={p.id} value={p.id}>
                              {p.id === 'high'
                                ? t.bitratePresetHigh
                                : p.id === 'standard'
                                ? t.bitratePresetStandard
                                : t.bitratePresetSaver}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="p-3 rounded-lg bg-surface-glass border border-border-glass">
                        <span className="text-xs font-semibold text-text-main block mb-1">
                          {t.storageEstimateTitle}
                        </span>
                        <p className="text-xs text-text-sub leading-relaxed">
                          {t.storageEstimateDesc(estMinutes)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 重新錄製防誤觸 Modal */}
        {showDiscardModal && (
          <div className={styles.modalBackdrop}>
            <div className={styles.modalContent}>
              <div className="flex items-center gap-3 mb-3 text-red-500">
                <svg viewBox="0 0 24 24" width={24} height={24} fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                </svg>
                <h4 className="text-base font-bold text-text-main">{t.discardModalTitle}</h4>
              </div>
              <p className="text-sm text-text-sub leading-relaxed mb-6">{t.discardModalDesc}</p>
              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowDiscardModal(false)}
                  className={styles.btnSecondary}
                >
                  {t.cancelBtn}
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDiscard}
                  className={styles.btnDanger}
                >
                  {t.confirmBtn}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 常見問題 FAQ 區塊 */}
        <div className="mt-8">
          <FaqSection
            title={t.faqTitle}
            subtitle={t.faqSubtitle}
            items={t.faqItems}
            accentColor={ACCENT}
          />
        </div>
      </ToolLayout>

      {/* Toast Notification */}
      <div
        className={`fixed bottom-8 right-8 flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-xl z-[100] pointer-events-none
          bg-surface-glass border border-border-glass backdrop-blur-[16px] text-text-main shadow-lg
          transition-all duration-300 ${toast.show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
      >
        <svg viewBox="0 0 24 24" width={16} height={16} fill={ACCENT}>
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
        </svg>
        {toast.msg}
      </div>
    </>
  );
}
