'use client';

import React from 'react';
import styles from '../pac-generator.module.css';
import { ProxyNode, ProxyType } from '../types';
import { formatProxyString } from '../engine';
import { TRANSLATIONS } from '../translations';

type PacTranslations = (typeof TRANSLATIONS)[keyof typeof TRANSLATIONS];

interface ProxyPoolPanelProps {
  t: PacTranslations;
  proxies: ProxyNode[];
  onClearProxies: () => void;
  onAddProxy: () => void;
  onAddChain: () => void;
  onUpdateProxy: (id: string, updates: Partial<ProxyNode>) => void;
  onDeleteProxy: (id: string) => void;
}

export default function ProxyPoolPanel({
  t,
  proxies,
  onClearProxies,
  onAddProxy,
  onAddChain,
  onUpdateProxy,
  onDeleteProxy,
}: ProxyPoolPanelProps) {
  return (
    <div className={styles.panel}>
      <div className={styles.sectionHeader}>
        <div className={styles.sectionTitle}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M4 1h16a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1zm0 8h16a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-4a1 1 0 0 1 1-1zm0 8h16a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-4a1 1 0 0 1 1-1z" />
          </svg>
          <span>{t.proxyPoolTitle}</span>
        </div>

        <div className="flex items-center gap-2 flex-wrap justify-end">
          {proxies.length > 0 && (
            <button
              type="button"
              onClick={onClearProxies}
              className={styles.ghostButton}
              title={t.clearProxiesBtn}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
              </svg>
              <span>{t.clearProxiesBtn}</span>
            </button>
          )}
          <button
            type="button"
            onClick={onAddProxy}
            className={`${styles.actionButton} ${styles.secondaryButton}`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
            </svg>
            <span>{t.addProxyBtn}</span>
          </button>
          <button
            type="button"
            onClick={onAddChain}
            className={`${styles.actionButton} ${styles.secondaryButton}`}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z" />
            </svg>
            <span>{t.addChainBtn}</span>
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {proxies.map((proxy) => (
          <div
            key={proxy.id}
            className={`${styles.ruleCard} ${proxy.type === 'CHAIN' ? styles.chainCard : ''}`}
          >
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 items-center">
              <input
                type="text"
                value={proxy.name}
                onChange={(e) => onUpdateProxy(proxy.id, { name: e.target.value })}
                placeholder={t.proxyName}
                aria-label={t.proxyName}
                className={`text-sm rounded-lg px-3 py-2 text-text-main focus:outline-none ${styles.fieldInput}`}
              />
              <select
                value={proxy.type}
                aria-label={t.proxyType || 'Proxy Type'}
                onChange={(e) => {
                  const newType = e.target.value as ProxyType;
                  const updates: Partial<ProxyNode> = { type: newType };
                  if (newType === 'CHAIN' && (!proxy.chainHops || proxy.chainHops.length === 0)) {
                    const others = proxies.filter((p) => p.id !== proxy.id && p.type !== 'CHAIN');
                    updates.chainHops = others.length > 0 ? [others[0].id, 'DIRECT'] : ['DIRECT'];
                    updates.isConcatFormat = true;
                  }
                  onUpdateProxy(proxy.id, updates);
                }}
                className="text-sm bg-select-bg border border-white/10 rounded-lg px-3 py-2 text-text-main focus:outline-none focus:border-[var(--theme-color)]"
              >
                <option value="PROXY">PROXY (HTTP)</option>
                <option value="HTTPS">HTTPS</option>
                <option value="SOCKS5">SOCKS5</option>
                <option value="SOCKS">SOCKS</option>
                <option value="DIRECT">DIRECT</option>
                <option value="CHAIN">{t.chainTypeLabel}</option>
              </select>
              {proxy.type === 'CHAIN' ? (
                <div className="sm:col-span-2 flex items-center justify-between gap-2">
                  <span className="text-xs text-text-sub font-mono truncate">
                    {formatProxyString(proxy, proxies)}
                  </span>
                  <button
                    type="button"
                    onClick={() => onDeleteProxy(proxy.id)}
                    aria-label={`${t.delete} ${proxy.name}`}
                    className="p-2 text-text-sub hover:text-red-400 transition-colors shrink-0"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                    </svg>
                  </button>
                </div>
              ) : proxy.type !== 'DIRECT' ? (
                <>
                  <input
                    type="text"
                    value={proxy.host}
                    onChange={(e) => onUpdateProxy(proxy.id, { host: e.target.value })}
                    placeholder={t.proxyHost}
                    className={`text-sm rounded-lg px-3 py-2 text-text-main focus:outline-none ${styles.fieldInput}`}
                  />
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={proxy.port}
                      onChange={(e) =>
                        onUpdateProxy(proxy.id, {
                          port: e.target.value === '' ? '' : parseInt(e.target.value, 10),
                        })
                      }
                      placeholder={t.proxyPort}
                      className={`w-full text-sm rounded-lg px-3 py-2 text-text-main focus:outline-none ${styles.fieldInput}`}
                    />
                    <button
                      type="button"
                      onClick={() => onDeleteProxy(proxy.id)}
                      aria-label={`${t.delete} ${proxy.name}`}
                      className="p-2 text-text-sub hover:text-red-400 transition-colors"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                      </svg>
                    </button>
                  </div>
                </>
              ) : (
                <div className="sm:col-span-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => onDeleteProxy(proxy.id)}
                    aria-label={`${t.delete} ${proxy.name}`}
                    className="p-2 text-text-sub hover:text-red-400 transition-colors"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                    </svg>
                  </button>
                </div>
              )}
            </div>

            {/* 備援代理鏈展開建構器 */}
            {proxy.type === 'CHAIN' && (
              <div className={`mt-3 ${styles.chainBuilder}`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-text-sub">
                    {t.chainBuilderTitle}
                  </span>
                  <label className={styles.chainToggle}>
                    <input
                      type="checkbox"
                      checked={proxy.isConcatFormat !== false}
                      onChange={(e) =>
                        onUpdateProxy(proxy.id, { isConcatFormat: e.target.checked })
                      }
                    />
                    <span>{t.chainConcatToggle}</span>
                  </label>
                </div>

                {/* 順位標籤列表 */}
                <div className={styles.chainHopsList}>
                  {(proxy.chainHops || ['DIRECT']).map((hopId, hopIdx) => {
                    const matched = proxies.find((p) => p.id === hopId);
                    const hopName =
                      hopId === 'DIRECT'
                        ? 'DIRECT'
                        : matched
                        ? `${matched.name} (${formatProxyString(matched, proxies)})`
                        : hopId;

                    return (
                      <React.Fragment key={hopIdx}>
                        <span className={styles.chainBadge}>
                          <span className="opacity-70 font-mono">#{hopIdx + 1}</span>
                          <span>{hopName}</span>
                          {(proxy.chainHops || []).length > 1 && (
                            <button
                              type="button"
                              onClick={() => {
                                const updated = (proxy.chainHops || []).filter((_, i) => i !== hopIdx);
                                onUpdateProxy(proxy.id, { chainHops: updated });
                              }}
                              className={styles.chainBadgeRemove}
                              title={t.delete}
                              aria-label={`${t.delete} ${hopName}`}
                            >
                              ✕
                            </button>
                          )}
                        </span>
                        {hopIdx < (proxy.chainHops || []).length - 1 && (
                          <span className={styles.chainArrow}>➔</span>
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>

                {/* 追加順位控制區 */}
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/5">
                  <select
                    id={`select_hop_${proxy.id}`}
                    aria-label={t.chainAddHop}
                    className="text-sm bg-select-bg border border-white/10 rounded-lg px-2.5 py-1.5 text-text-main focus:outline-none"
                    defaultValue="DIRECT"
                  >
                    {proxies
                      .filter((p) => p.id !== proxy.id)
                      .map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({formatProxyString(p, proxies)})
                        </option>
                      ))}
                    <option value="DIRECT">{t.chainDirectOption}</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => {
                      const selectEl = document.getElementById(
                        `select_hop_${proxy.id}`
                      ) as HTMLSelectElement | null;
                      const val = selectEl?.value || 'DIRECT';
                      const currentHops = proxy.chainHops || [];
                      onUpdateProxy(proxy.id, { chainHops: [...currentHops, val] });
                    }}
                    className="text-xs px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-text-main transition-colors font-medium flex items-center gap-1 border border-white/10"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                    </svg>
                    <span>{t.chainAddHop}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
