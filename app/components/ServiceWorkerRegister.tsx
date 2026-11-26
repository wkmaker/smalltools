'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import styles from './ServiceWorkerRegister.module.css';

export default function ServiceWorkerRegister() {
  const [showUpdateToast, setShowUpdateToast] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const swRegistrationRef = useRef<ServiceWorkerRegistration | null>(null);
  const waitingWorkerRef = useRef<ServiceWorker | null>(null);
  const userTriggeredUpdateRef = useRef(false);
  const pathname = usePathname();

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

    // 僅在使用者主動確認更新後，才於 Controller 切換時重新整理頁面，避免中斷錄影/填表等操作
    const handleControllerChange = () => {
      if (userTriggeredUpdateRef.current && !refreshing) {
        refreshing = true;
        window.location.reload();
      }
    };

    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);

    const notifyWaitingWorker = (worker: ServiceWorker) => {
      waitingWorkerRef.current = worker;
      setShowUpdateToast(true);
    };

    const registerSw = () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          swRegistrationRef.current = registration;

          // 定期檢查 SW 更新
          registration.update().catch(() => {});

          // 若已有等待中的新 Service Worker，提示使用者手動更新
          if (registration.waiting) {
            notifyWaitingWorker(registration.waiting);
          }

          // 監聽是否有新的 Service Worker 正在下載與安裝
          registration.onupdatefound = () => {
            const newWorker = registration.installing;
            if (!newWorker) return;
            newWorker.onstatechange = () => {
              if (
                newWorker.state === 'installed' &&
                navigator.serviceWorker.controller
              ) {
                notifyWaitingWorker(newWorker);
              }
            };
          };
        })
        .catch((error) => {
          console.error('PWA ServiceWorker registration failed:', error);
        });
    };

    // 修復 Hydration 晚於 load 事件時的競態：頁面已載入完成就直接註冊
    if (document.readyState === 'complete') {
      registerSw();
    } else {
      window.addEventListener('load', registerSw, { once: true });
    }

    return () => {
      window.removeEventListener('load', registerSw);
      navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
    };
  }, []);

  // 當站內路由切換時，主動觸發 Service Worker 的更新檢查
  useEffect(() => {
    if (swRegistrationRef.current) {
      swRegistrationRef.current.update().catch(() => {});
    }
  }, [pathname]);

  const handleApplyUpdate = () => {
    const waiting = waitingWorkerRef.current || swRegistrationRef.current?.waiting;
    if (!waiting) {
      window.location.reload();
      return;
    }
    userTriggeredUpdateRef.current = true;
    setIsUpdating(true);
    waiting.postMessage({ type: 'SKIP_WAITING' });
  };

  if (!showUpdateToast) return null;

  const isEn = pathname?.includes('/en') ?? false;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`${styles.toastCard} fixed bottom-5 right-5 z-50 flex flex-wrap items-center gap-3 rounded-xl p-4 backdrop-blur-md text-sm max-w-[calc(100vw-2.5rem)]`}
    >
      <div className="flex h-3 w-3 relative shrink-0" aria-hidden="true">
        <span className={`${styles.statusDotPing} animate-ping absolute inline-flex h-full w-full rounded-full opacity-75`}></span>
        <span className={`${styles.statusDot} relative inline-flex rounded-full h-3 w-3`}></span>
      </div>
      <div className="min-w-0">
        <p className="font-semibold text-[var(--text-primary)]">
          {isEn ? 'New version available' : '已檢測到全新版本'}
        </p>
        <p className="text-xs text-[var(--text-secondary)]">
          {isUpdating
            ? isEn
              ? 'Updating to the latest version...'
              : '正在更新至最新版本...'
            : isEn
              ? 'Reload when ready to apply the update.'
              : '點擊更新即可套用最新功能，不會中斷目前作業。'}
        </p>
      </div>
      <div className="flex items-center gap-2 ml-auto">
        <button
          type="button"
          onClick={handleApplyUpdate}
          disabled={isUpdating}
          className={`${styles.updateBtn} px-3 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-60 cursor-pointer`}
        >
          {isUpdating ? (isEn ? 'Updating...' : '更新中...') : isEn ? 'Update Now' : '立即更新'}
        </button>
        <button
          type="button"
          onClick={() => setShowUpdateToast(false)}
          disabled={isUpdating}
          aria-label={isEn ? 'Dismiss update notification' : '稍後再更新'}
          className={`${styles.dismissBtn} px-2.5 py-1.5 rounded-lg text-xs font-medium disabled:opacity-50 cursor-pointer`}
        >
          {isEn ? 'Later' : '稍後'}
        </button>
      </div>
    </div>
  );
}
