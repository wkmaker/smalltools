'use client';

/**
 * useMicrophone.ts
 * ──────────────────────────────────────────────────────────────
 * 麥克風裝置清單與即時 VU 音量條。
 * - 只有在 `enabled` 為 true 時才請求麥克風權限（未勾選旁白不打擾使用者）。
 * - 音量條以 requestAnimationFrame 直接寫入 DOM 的 transform，不經過 React State，
 *   避免每秒 60 次重新渲染。
 * - 每次重新取得串流都帶世代編號，避免快速切換裝置時舊的非同步結果覆蓋新串流。
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { computeLevelFromSamples } from './engine';

export interface MicDevice {
  deviceId: string;
  label: string;
}

export type MicError = 'denied' | 'unavailable' | null;

export function useMicrophone(enabled: boolean) {
  const [devices, setDevices] = useState<MicDevice[]>([]);
  const [deviceId, setDeviceId] = useState('');
  const [error, setError] = useState<MicError>(null);
  const [active, setActive] = useState(false);

  const meterRef = useRef<HTMLDivElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const rafRef = useRef<number | null>(null);
  const generationRef = useRef(0);
  /** 目前預覽串流實際使用的裝置 ID */
  const activeDeviceIdRef = useRef('');

  const refreshDevices = useCallback(async () => {
    if (!navigator.mediaDevices?.enumerateDevices) return;
    try {
      const list = await navigator.mediaDevices.enumerateDevices();
      const inputs = list
        .filter(d => d.kind === 'audioinput' && d.deviceId)
        .map(d => ({ deviceId: d.deviceId, label: d.label }));
      setDevices(inputs);
      setDeviceId(prev => {
        if (prev && inputs.some(d => d.deviceId === prev)) return prev;
        // 優先對齊目前正在使用的裝置，避免因 ID 由空字串變為實際值而重啟串流
        const current = activeDeviceIdRef.current;
        if (current && inputs.some(d => d.deviceId === current)) return current;
        return inputs[0]?.deviceId ?? '';
      });
    } catch (err) {
      console.error('[screen-capture] 列舉麥克風裝置失敗', err);
    }
  }, []);

  const stopPreview = useCallback(() => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    if (ctxRef.current) {
      ctxRef.current.close().catch(err => console.warn('[screen-capture] 關閉音量偵測 AudioContext 失敗', err));
      ctxRef.current = null;
    }
    if (meterRef.current) meterRef.current.style.transform = 'scaleX(0)';
    activeDeviceIdRef.current = '';
    setActive(false);
  }, []);

  useEffect(() => {
    if (!enabled) {
      generationRef.current += 1;
      stopPreview();
      setError(null);
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setError('unavailable');
      return;
    }
    // 已在使用同一支麥克風（例如授權後清單補上實際 ID），不需重新取得
    if (streamRef.current && deviceId && activeDeviceIdRef.current === deviceId) return;

    const generation = ++generationRef.current;
    let cancelled = false;

    (async () => {
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: deviceId ? { deviceId: { exact: deviceId } } : true,
        });
      } catch (err) {
        if (cancelled || generation !== generationRef.current) return;
        console.error('[screen-capture] 取得麥克風失敗', { deviceId, err });
        const name = err instanceof DOMException ? err.name : '';
        setError(name === 'NotAllowedError' || name === 'SecurityError' ? 'denied' : 'unavailable');
        return;
      }
      if (cancelled || generation !== generationRef.current) {
        stream.getTracks().forEach(t => t.stop());
        return;
      }

      stopPreview();
      streamRef.current = stream;
      activeDeviceIdRef.current = stream.getAudioTracks()[0]?.getSettings().deviceId ?? deviceId;
      setError(null);
      setActive(true);
      // 授權後裝置名稱才會出現，重新列舉一次
      void refreshDevices();

      try {
        const ctx = new AudioContext();
        ctxRef.current = ctx;
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 1024;
        ctx.createMediaStreamSource(stream).connect(analyser);
        const samples = new Float32Array(analyser.fftSize);
        const tick = () => {
          analyser.getFloatTimeDomainData(samples);
          const level = computeLevelFromSamples(samples);
          if (meterRef.current) meterRef.current.style.transform = `scaleX(${level.toFixed(3)})`;
          rafRef.current = requestAnimationFrame(tick);
        };
        rafRef.current = requestAnimationFrame(tick);
      } catch (err) {
        // 音量條失效不影響錄音本身，僅記錄
        console.warn('[screen-capture] 建立音量偵測失敗', err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [enabled, deviceId, refreshDevices, stopPreview]);

  // 插拔裝置時更新清單
  useEffect(() => {
    const md = navigator.mediaDevices;
    if (!md?.addEventListener) return;
    const handler = () => void refreshDevices();
    md.addEventListener('devicechange', handler);
    return () => md.removeEventListener('devicechange', handler);
  }, [refreshDevices]);

  // 卸載時釋放麥克風
  useEffect(() => () => stopPreview(), [stopPreview]);

  return { devices, deviceId, setDeviceId, error, active, meterRef };
}
