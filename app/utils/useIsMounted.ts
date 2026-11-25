'use client';

import { useSyncExternalStore } from 'react';

const emptySubscribe = () => () => {};

/**
 * Hydration-safe 掛載狀態 Hook（React 19 官方建議以 useSyncExternalStore 實作）。
 * 伺服器端與初次 Hydration 回傳 false，瀏覽器端掛載後回傳 true，
 * 避免使用 useEffect(() => setMounted(true), []) 造成額外二次渲染與 React Compiler 警告。
 */
export function useIsMounted(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}
