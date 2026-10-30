'use client';

/**
 * useScreenRecorder.ts
 * ──────────────────────────────────────────────────────────────
 * 螢幕錄影生命週期：選取畫面 → 倒數 → 錄影 / 暫停 → 封裝 → 完成。
 * - 畫面擷取：getDisplayMedia（依解析度預設限制寬高上限，預設 1080p 以避免高解析度即時編碼滿載）。
 * - 混音：以 AudioContext 將系統音訊與麥克風合成單一音軌。
 * - 錄影資料區塊存於 ref，不進 React State，避免大檔觸發重新渲染與複製。
 * - 單次聚焦：同時間只保留最新一筆錄影，丟棄時立即 revokeObjectURL 釋放記憶體。
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  AUDIO_BITRATE_BPS,
  COUNTDOWN_SECONDS,
  baseMimeType,
  buildDisplayVideoConstraints,
  buildRecordingFileName,
  fixWebmBlobDuration,
  isEbmlMime,
  mimeToExtension,
  pickSupportedMimeType,
  type ResolutionPresetId,
} from './engine';

export type RecorderPhase = 'idle' | 'selecting' | 'countdown' | 'recording' | 'paused' | 'processing' | 'done';

export type RecorderNotice =
  | 'unsupported'
  | 'select-cancelled'
  | 'select-failed'
  | 'mic-failed'
  | 'no-system-audio'
  | 'recorder-failed'
  | 'no-data';

export interface RecordingResult {
  file: File;
  url: string;
  durationMs: number;
  mimeType: string;
}

export interface RecorderOptions {
  fps: number;
  resolutionPreset: ResolutionPresetId;
  videoBitsPerSecond: number;
  countdownEnabled: boolean;
  micEnabled: boolean;
  micDeviceId: string;
}

/** Chrome 專屬的 getDisplayMedia 擴充選項（標準型別尚未收錄） */
type ExtendedDisplayMediaOptions = DisplayMediaStreamOptions & {
  systemAudio?: 'include' | 'exclude';
  selfBrowserSurface?: 'include' | 'exclude';
  surfaceSwitching?: 'include' | 'exclude';
};

export function useScreenRecorder(onNotice: (notice: RecorderNotice) => void) {
  const [phase, setPhase] = useState<RecorderPhase>('idle');
  const [countdown, setCountdown] = useState(0);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [result, setResult] = useState<RecordingResult | null>(null);
  const [previewStream, setPreviewStream] = useState<MediaStream | null>(null);

  const phaseRef = useRef<RecorderPhase>('idle');
  const displayStreamRef = useRef<MediaStream | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const mixedStreamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const accumulatedMsRef = useRef(0);
  const segmentStartRef = useRef<number | null>(null);
  const tickTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const resultRef = useRef<RecordingResult | null>(null);
  const isMountedRef = useRef(true);
  const onNoticeRef = useRef(onNotice);

  useEffect(() => {
    onNoticeRef.current = onNotice;
  }, [onNotice]);

  const updatePhase = useCallback((next: RecorderPhase) => {
    phaseRef.current = next;
    if (isMountedRef.current) setPhase(next);
  }, []);

  const clearTimers = useCallback(() => {
    if (tickTimerRef.current) clearInterval(tickTimerRef.current);
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    tickTimerRef.current = null;
    countdownTimerRef.current = null;
  }, []);

  /** 停止所有擷取中的軌道並關閉混音 AudioContext */
  const releaseStreams = useCallback(() => {
    [displayStreamRef, micStreamRef, mixedStreamRef].forEach(ref => {
      ref.current?.getTracks().forEach(t => t.stop());
      ref.current = null;
    });
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(err => console.warn('[screen-capture] 關閉混音 AudioContext 失敗', err));
      audioCtxRef.current = null;
    }
    if (isMountedRef.current) setPreviewStream(null);
  }, []);

  const currentElapsed = () =>
    accumulatedMsRef.current + (segmentStartRef.current !== null ? performance.now() - segmentStartRef.current : 0);

  const revokeResult = useCallback(() => {
    if (resultRef.current) URL.revokeObjectURL(resultRef.current.url);
    resultRef.current = null;
  }, []);

  /** 錄影停止後封裝成 File，WebM / Matroska 會補寫時長讓播放器可拖曳進度 */
  const finalize = useCallback(
    async (mimeType: string) => {
      clearTimers();
      releaseStreams();
      const durationMs = Math.round(accumulatedMsRef.current);
      const containerMime = baseMimeType(mimeType);
      let blob = new Blob(chunksRef.current, { type: containerMime });
      chunksRef.current = [];
      recorderRef.current = null;

      if (blob.size === 0) {
        onNoticeRef.current('no-data');
        updatePhase('idle');
        return;
      }
      if (isEbmlMime(containerMime)) {
        try {
          blob = await fixWebmBlobDuration(blob, durationMs);
        } catch (err) {
          // 補寫失敗仍保留原始影片，僅影響部分播放器的進度條
          console.warn('[screen-capture] 影片時長補寫失敗，保留原始檔案', { containerMime, err });
        }
      }
      if (!isMountedRef.current) return;

      const now = new Date();
      const file = new File([blob], buildRecordingFileName(now, mimeToExtension(containerMime)), {
        type: containerMime,
        lastModified: now.getTime(),
      });
      const next: RecordingResult = { file, url: URL.createObjectURL(file), durationMs, mimeType: containerMime };
      revokeResult();
      resultRef.current = next;
      setResult(next);
      setElapsedMs(durationMs);
      updatePhase('done');
    },
    [clearTimers, releaseStreams, revokeResult, updatePhase]
  );

  const beginRecording = useCallback(
    (stream: MediaStream, videoBitsPerSecond: number) => {
      const mimeType = pickSupportedMimeType(m => MediaRecorder.isTypeSupported(m));
      let recorder: MediaRecorder;
      try {
        recorder = new MediaRecorder(stream, {
          ...(mimeType ? { mimeType } : {}),
          videoBitsPerSecond,
          audioBitsPerSecond: AUDIO_BITRATE_BPS,
        });
      } catch (err) {
        console.error('[screen-capture] 建立 MediaRecorder 失敗', { mimeType, err });
        onNoticeRef.current('recorder-failed');
        releaseStreams();
        updatePhase('idle');
        return;
      }

      chunksRef.current = [];
      recorder.ondataavailable = e => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        void finalize(recorder.mimeType || mimeType);
      };
      recorder.onerror = e => {
        console.error('[screen-capture] 錄影過程發生錯誤', e);
        onNoticeRef.current('recorder-failed');
      };

      recorderRef.current = recorder;
      accumulatedMsRef.current = 0;
      segmentStartRef.current = performance.now();
      setElapsedMs(0);
      // 每秒切出一個資料區塊，中途異常時已錄內容不會全部遺失
      recorder.start(1000);
      tickTimerRef.current = setInterval(() => {
        if (isMountedRef.current) setElapsedMs(currentElapsed());
      }, 250);
      updatePhase('recording');
    },
    [finalize, releaseStreams, updatePhase]
  );

  const stop = useCallback(() => {
    const current = phaseRef.current;
    if (current === 'countdown' || current === 'selecting') {
      clearTimers();
      releaseStreams();
      updatePhase('idle');
      return;
    }
    const recorder = recorderRef.current;
    if (!recorder || recorder.state === 'inactive') return;
    if (segmentStartRef.current !== null) {
      accumulatedMsRef.current += performance.now() - segmentStartRef.current;
      segmentStartRef.current = null;
    }
    if (tickTimerRef.current) clearInterval(tickTimerRef.current);
    tickTimerRef.current = null;
    setElapsedMs(accumulatedMsRef.current);
    updatePhase('processing');
    recorder.stop();
  }, [clearTimers, releaseStreams, updatePhase]);

  const pause = useCallback(() => {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state !== 'recording') return;
    recorder.pause();
    if (segmentStartRef.current !== null) {
      accumulatedMsRef.current += performance.now() - segmentStartRef.current;
      segmentStartRef.current = null;
    }
    setElapsedMs(accumulatedMsRef.current);
    updatePhase('paused');
  }, [updatePhase]);

  const resume = useCallback(() => {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state !== 'paused') return;
    recorder.resume();
    segmentStartRef.current = performance.now();
    updatePhase('recording');
  }, [updatePhase]);

  const start = useCallback(
    async (options: RecorderOptions) => {
      if (phaseRef.current !== 'idle' && phaseRef.current !== 'done') return;
      if (!navigator.mediaDevices?.getDisplayMedia || typeof MediaRecorder === 'undefined') {
        onNoticeRef.current('unsupported');
        return;
      }

      updatePhase('selecting');
      let display: MediaStream;
      try {
        const displayOptions: ExtendedDisplayMediaOptions = {
          video: buildDisplayVideoConstraints(options.fps, options.resolutionPreset),
          audio: true,
          systemAudio: 'include',
          selfBrowserSurface: 'exclude',
          surfaceSwitching: 'include',
        };
        display = await navigator.mediaDevices.getDisplayMedia(displayOptions);
      } catch (err) {
        const name = err instanceof DOMException ? err.name : '';
        if (name === 'NotAllowedError' || name === 'AbortError') {
          onNoticeRef.current('select-cancelled');
        } else {
          console.error('[screen-capture] 螢幕擷取失敗', err);
          onNoticeRef.current('select-failed');
        }
        // 取消選取時若仍保有上一支影片，回到完成畫面而非清空
        updatePhase(resultRef.current ? 'done' : 'idle');
        return;
      }
      if (!isMountedRef.current || (phaseRef.current as RecorderPhase) !== 'selecting') {
        display.getTracks().forEach(t => t.stop());
        return;
      }

      // 新錄影開始前才釋放上一筆，避免使用者取消選取時遺失前一支影片
      if (resultRef.current) {
        revokeResult();
        setResult(null);
      }
      displayStreamRef.current = display;

      let mic: MediaStream | null = null;
      if (options.micEnabled) {
        try {
          mic = await navigator.mediaDevices.getUserMedia({
            audio: {
              ...(options.micDeviceId ? { deviceId: { exact: options.micDeviceId } } : {}),
              echoCancellation: true,
              noiseSuppression: true,
            },
          });
          micStreamRef.current = mic;
        } catch (err) {
          // 麥克風失敗不中斷錄影，改以無旁白方式繼續並提示
          console.error('[screen-capture] 錄影時取得麥克風失敗', { deviceId: options.micDeviceId, err });
          onNoticeRef.current('mic-failed');
        }
      }
      if (!isMountedRef.current || (phaseRef.current as RecorderPhase) !== 'selecting') {
        releaseStreams();
        return;
      }

      const videoTracks = display.getVideoTracks();
      const systemTracks = display.getAudioTracks();
      const micTracks = mic?.getAudioTracks() ?? [];
      if (systemTracks.length === 0) onNoticeRef.current('no-system-audio');

      let recordStream: MediaStream;
      if (systemTracks.length === 0 && micTracks.length === 0) {
        recordStream = new MediaStream(videoTracks);
      } else {
        const ctx = new AudioContext();
        audioCtxRef.current = ctx;
        const destination = ctx.createMediaStreamDestination();
        if (systemTracks.length > 0) ctx.createMediaStreamSource(new MediaStream(systemTracks)).connect(destination);
        if (micTracks.length > 0) ctx.createMediaStreamSource(new MediaStream(micTracks)).connect(destination);
        ctx.resume().catch(err => console.warn('[screen-capture] 混音 AudioContext 啟動失敗', err));
        recordStream = new MediaStream([...videoTracks, ...destination.stream.getAudioTracks()]);
      }
      mixedStreamRef.current = recordStream;
      setPreviewStream(new MediaStream(videoTracks));

      // 使用者從瀏覽器原生懸浮列按「停止共用」時，優雅收尾
      videoTracks[0]?.addEventListener('ended', () => {
        const p = phaseRef.current;
        if (p === 'recording' || p === 'paused' || p === 'countdown') stop();
      });

      if (!options.countdownEnabled) {
        beginRecording(recordStream, options.videoBitsPerSecond);
        return;
      }

      let remaining = COUNTDOWN_SECONDS;
      setCountdown(remaining);
      updatePhase('countdown');
      countdownTimerRef.current = setInterval(() => {
        remaining -= 1;
        if (remaining > 0) {
          if (isMountedRef.current) setCountdown(remaining);
          return;
        }
        if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
        countdownTimerRef.current = null;
        if (phaseRef.current === 'countdown') beginRecording(recordStream, options.videoBitsPerSecond);
      }, 1000);
    },
    [beginRecording, releaseStreams, revokeResult, stop, updatePhase]
  );

  /** 丟棄目前錄影並釋放記憶體（重新錄製前呼叫） */
  const discard = useCallback(() => {
    revokeResult();
    setResult(null);
    setElapsedMs(0);
    updatePhase('idle');
  }, [revokeResult, updatePhase]);

  // 卸載時中止錄影、釋放所有軌道與 Object URL
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      const recorder = recorderRef.current;
      if (recorder) {
        recorder.ondataavailable = null;
        recorder.onstop = null;
        if (recorder.state !== 'inactive') recorder.stop();
      }
      recorderRef.current = null;
      chunksRef.current = [];
      clearTimers();
      releaseStreams();
      revokeResult();
    };
  }, [clearTimers, releaseStreams, revokeResult]);

  return { phase, countdown, elapsedMs, result, previewStream, start, pause, resume, stop, discard };
}
