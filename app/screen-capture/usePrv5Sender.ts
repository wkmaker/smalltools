'use client';

/**
 * usePrv5Sender.ts
 * ──────────────────────────────────────────────────────────────
 * 將錄影檔透過 postMessage 跨視窗握手送往 PRV5 私密分享。
 *
 * 協定：
 * 1. 本頁以 `window.open(PRV5_OPEN_URL, '_blank')` 開啟 PRV5（需保留 opener，PRV5 才能回訊）。
 * 2. PRV5 載入後對 `window.opener` 送出 `'PRV5_READY'` 或 `{ type: 'PRV5_READY' }`。
 * 3. 本頁確認「來源網域 === https://www.prv5.com」且「來源視窗 === 剛開啟的分頁」後，
 *    以鎖死的 targetOrigin 送出 `{ type: 'SMALLTOOLS_FILE', file, name, mimeType, size, ... }`。
 * 檔案大小不在此攔截，由 PRV5 依其規範（訪客 / 會員配額）自行檢查與提示。
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  PRV5_HANDSHAKE_TIMEOUT_MS,
  PRV5_OPEN_URL,
  PRV5_ORIGIN,
  buildPrv5FilePayload,
  isTrustedPrv5Ready,
} from './engine';

export type Prv5Status = 'idle' | 'waiting' | 'sent' | 'blocked' | 'timeout' | 'closed' | 'failed';

export function usePrv5Sender(file: File | null) {
  const [status, setStatus] = useState<Prv5Status>('idle');
  const winRef = useRef<Window | null>(null);
  const fileRef = useRef<File | null>(file);
  const sentRef = useRef(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closedPollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const listenerRef = useRef<((e: MessageEvent) => void) | null>(null);

  const teardown = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (closedPollRef.current) clearInterval(closedPollRef.current);
    timeoutRef.current = null;
    closedPollRef.current = null;
    if (listenerRef.current) window.removeEventListener('message', listenerRef.current);
    listenerRef.current = null;
  }, []);

  // 換成新錄影（或丟棄）時重置狀態，避免把舊檔送出
  useEffect(() => {
    fileRef.current = file;
    teardown();
    sentRef.current = false;
    winRef.current = null;
    setStatus('idle');
  }, [file, teardown]);

  useEffect(() => teardown, [teardown]);

  const send = useCallback(() => {
    if (!fileRef.current) return;
    teardown();
    sentRef.current = false;

    const win = window.open(PRV5_OPEN_URL, '_blank');
    if (!win) {
      winRef.current = null;
      setStatus('blocked');
      return;
    }
    winRef.current = win;
    setStatus('waiting');

    const onMessage = (event: MessageEvent) => {
      if (sentRef.current) return;
      if (!isTrustedPrv5Ready(event, winRef.current)) return;
      const current = fileRef.current;
      if (!current || !winRef.current) return;
      try {
        winRef.current.postMessage(buildPrv5FilePayload(current), event.origin);
        sentRef.current = true;
        setStatus('sent');
      } catch (err) {
        console.error('[screen-capture] 傳送檔案至 PRV5 失敗', { size: current.size, err });
        setStatus('failed');
      }
      teardown();
    };
    listenerRef.current = onMessage;
    window.addEventListener('message', onMessage);

    timeoutRef.current = setTimeout(() => {
      if (sentRef.current) return;
      teardown();
      setStatus('timeout');
    }, PRV5_HANDSHAKE_TIMEOUT_MS);

    closedPollRef.current = setInterval(() => {
      if (!sentRef.current && winRef.current?.closed) {
        teardown();
        setStatus('closed');
      }
    }, 1000);
  }, [teardown]);

  /** 切回已開啟的 PRV5 分頁 */
  const focusPrv5 = useCallback(() => {
    if (winRef.current && !winRef.current.closed) winRef.current.focus();
  }, []);

  return { status, send, focusPrv5 };
}
