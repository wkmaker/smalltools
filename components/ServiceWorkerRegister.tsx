'use client';

import { useEffect, useState } from 'react';

export default function ServiceWorkerRegister() {
  const [showUpdateToast, setShowUpdateToast] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

    // 在本地開發環境 (npm run dev) 下停用 Service Worker，並自動卸載舊的 SW 避免干擾 HMR 與開發
    if (process.env.NODE_ENV === 'development') {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const registration of registrations) {
          registration.unregister();
        }
      });
      return;
    }

    let refreshing = false;

    // 當 Controller 控制權轉移（新版 SW 激活）時，自動重新整理頁面顯示最新內容
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    });

    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          // 定期檢查 SW 更新
          registration.update();

          // 如果已經有在新等待的 Service Worker
          if (registration.waiting) {
            registration.waiting.postMessage({ type: 'SKIP_WAITING' });
            setShowUpdateToast(true);
          }

          // 監聽是否有新的 Service Worker 正在下載與安裝
          registration.onupdatefound = () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.onstatechange = () => {
                if (
                  newWorker.state === 'installed' &&
                  navigator.serviceWorker.controller
                ) {
                  // 發送訊息要求新 Service Worker 立即跳過等待並接管
                  newWorker.postMessage({ type: 'SKIP_WAITING' });
                  setShowUpdateToast(true);
                }
              };
            }
          };
        })
        .catch((error) => {
          console.error('PWA ServiceWorker registration failed:', error);
        });
    });
  }, []);

  if (!showUpdateToast) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex items-center gap-3 rounded-xl border border-cyan-500/30 bg-slate-900/90 p-4 shadow-2xl backdrop-blur-md animate-fade-in text-white text-sm">
      <div className="flex h-3 w-3 relative">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
      </div>
      <div>
        <p className="font-semibold text-cyan-300">🎉 已檢測到全新內容</p>
        <p className="text-xs text-slate-300">正為您自動同步至最新工具版本...</p>
      </div>
    </div>
  );
}
