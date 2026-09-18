'use client';

import React, { useState, useEffect, useId, useMemo, useCallback } from 'react';
import ToolLayout from '@/app/components/ToolLayout';
import FaqSection from '@/app/components/FaqSection';
import { downloadBlob } from '@/app/utils/downloadBlob';
import styles from './pac-generator.module.css';
import {
  ProxyNode,
  ProxyType,
  RoutingRule,
  RuleCondition,
} from './types';
import {
  formatProxyString,
  generatePacDataUrl,
  generatePacScript,
  parsePacScript,
  PRESET_TEMPLATES,
} from './engine';
import { TRANSLATIONS } from './translations';
import RuleCard from './RuleCard';

interface PacGeneratorClientProps {
  lang?: 'zh-TW' | 'en';
}


export default function PacGeneratorClient({ lang = 'zh-TW' }: PacGeneratorClientProps) {
  const t = TRANSLATIONS[lang] || TRANSLATIONS['zh-TW'];
  const isEn = lang === 'en';

  // 主題色動態注入
  useEffect(() => {
    document.documentElement.style.setProperty('--theme-color', '#00f5a0');
    document.documentElement.style.setProperty('--accent-glow', 'rgba(0, 245, 160, 0.5)');
  }, []);

  // 狀態管理
  const [selectedPreset, setSelectedPreset] = useState<string>('corporate-bypass');
  const [proxies, setProxies] = useState<ProxyNode[]>(PRESET_TEMPLATES[0].proxies);
  const [rules, setRules] = useState<RoutingRule[]>(PRESET_TEMPLATES[0].rules);
  const [defaultAction, setDefaultAction] = useState<string>(PRESET_TEMPLATES[0].defaultAction);
  const [enableIpv6, setEnableIpv6] = useState<boolean>(true);
  const [resolveIpFirst, setResolveIpFirst] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // 匯入彈窗與狀態
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);
  const [importContent, setImportContent] = useState<string>('');
  const [importMode, setImportMode] = useState<'replace' | 'append'>('replace');
  const [importError, setImportError] = useState<string | null>(null);
  const [importWarnings, setImportWarnings] = useState<string[] | null>(null);

  // 檢查由 PAC 測試器帶來的腳本，自動帶入匯入視窗
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const transferred = sessionStorage.getItem('pac_tester_export_code');
      if (transferred && transferred.trim().length > 0) {
        setImportContent(transferred);
        setIsImportModalOpen(true);
        sessionStorage.removeItem('pac_tester_export_code');
      }
    }
  }, []);

  // 規則拖曳重排狀態與虛擬插入指示框位置
  const [draggedRuleIndex, setDraggedRuleIndex] = useState<number | null>(null);
  const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null);

  const handleReorderRule = useCallback((fromIdx: number, toIdx: number) => {
    if (fromIdx === toIdx) return;
    setRules((prev) => {
      const updated = [...prev];
      const [moved] = updated.splice(fromIdx, 1);
      updated.splice(toIdx, 0, moved);
      return updated;
    });
  }, []);

  const handleDropAtIndex = useCallback((targetIndex: number) => {
    setDraggedRuleIndex((current) => {
      if (current === null) return null;
      let finalIndex = targetIndex;
      if (current < targetIndex) {
        finalIndex = targetIndex - 1;
      }
      if (finalIndex !== current) {
        handleReorderRule(current, finalIndex);
      }
      return null;
    });
    setDropTargetIndex(null);
  }, [handleReorderRule]);

  // 套用範本
  const handleApplyPreset = (presetId: string) => {
    const found = PRESET_TEMPLATES.find((p) => p.id === presetId);
    if (!found) return;
    setSelectedPreset(presetId);
    setProxies(JSON.parse(JSON.stringify(found.proxies)));
    setRules(JSON.parse(JSON.stringify(found.rules)));
    setDefaultAction(found.defaultAction);
    setEnableIpv6(found.enableIpv6);
    setResolveIpFirst(found.resolveIpFirst);
    setImportWarnings(null);
  };

  // 產生 PAC 腳本
  const generatedScript = useMemo(() => {
    return generatePacScript({
      proxies,
      rules,
      defaultAction,
      enableIpv6,
      resolveIpFirst,
      title: isEn ? 'Custom Proxy Auto-Config' : '自訂代理自動配置腳本',
    });
  }, [proxies, rules, defaultAction, enableIpv6, resolveIpFirst, isEn]);

  // 複製回饋 Toast
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleCopyScript = () => {
    navigator.clipboard.writeText(generatedScript);
    showToast(t.copiedToast);
  };

  const handleCopyDataUrl = () => {
    const dataUrl = generatePacDataUrl(generatedScript);
    navigator.clipboard.writeText(dataUrl);
    showToast(t.copiedToast);
  };

  const handleDownloadPac = () => {
    const blob = new Blob([generatedScript], { type: 'application/x-ns-proxy-autoconfig;charset=utf-8' });
    downloadBlob(blob, 'proxy.pac');
  };

  // 匯出 JSON 備份設定檔
  const handleExportConfig = () => {
    const projectConfig = {
      version: 1,
      proxies,
      rules,
      defaultAction,
      enableIpv6,
      resolveIpFirst,
    };
    const jsonStr = JSON.stringify(projectConfig, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
    downloadBlob(blob, 'pac-config.json');
    showToast(isEn ? 'Config exported!' : '設定已成功匯出！');
  };

  // 執行智能匯入
  const handleDoImport = () => {
    setImportError(null);
    const res = parsePacScript(importContent);
    if (!res.success) {
      setImportError(isEn ? res.messageEn : res.messageZh);
      return;
    }
    setImportWarnings(res.warnings && res.warnings.length > 0 ? res.warnings : null);

    if (importMode === 'replace') {
      setProxies(res.proxies);
      setRules(res.rules);
      setDefaultAction(res.defaultAction);
      setEnableIpv6(res.enableIpv6);
      setResolveIpFirst(res.resolveIpFirst);
    } else {
      // 追加模式：合併節點並追加規則
      setProxies((prev) => {
        const existingKeys = new Set(prev.map((p) => `${p.type}_${p.host}_${p.port}_${p.customString || ''}`));
        const newNodes = res.proxies.filter(
          (p) => !existingKeys.has(`${p.type}_${p.host}_${p.port}_${p.customString || ''}`)
        );
        return [...prev, ...newNodes];
      });
      setRules((prev) => [...prev, ...res.rules]);
    }

    setIsImportModalOpen(false);
    setImportContent('');
    showToast(isEn ? res.messageEn : res.messageZh);
  };

  // 讀取上傳檔案
  const handleImportFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        setImportContent(text);
      }
    };
    reader.readAsText(file);
  };

  // 跨工具連動：傳送到 PAC 測試器
  const handleGoToTester = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('pac_transfer_code', generatedScript);
      const targetUrl = isEn ? '/pac-tester/en/' : '/pac-tester/';
      window.location.href = targetUrl;
    }
  };

  // Proxy 節點增刪改
  const handleAddProxy = () => {
    const newId = `p_${Date.now()}`;
    setProxies((prev) => [
      ...prev,
      { id: newId, name: isEn ? 'New Proxy' : '新代理節點', type: 'PROXY', host: '127.0.0.1', port: 8080 },
    ]);
  };

  const handleAddChain = () => {
    const newId = `p_${Date.now()}`;
    const nonChainProxies = proxies.filter((p) => p.type !== 'CHAIN');
    const initialHops = nonChainProxies.length > 0 ? [nonChainProxies[0].id, 'DIRECT'] : ['DIRECT'];
    setProxies((prev) => [
      ...prev,
      {
        id: newId,
        name: isEn ? `Failover Chain ${prev.length + 1}` : `備援代理鏈 ${prev.length + 1}`,
        type: 'CHAIN',
        host: 'cluster',
        port: 8080,
        chainHops: initialHops,
        isConcatFormat: true,
      },
    ]);
  };

  const handleUpdateProxy = (id: string, updates: Partial<ProxyNode>) => {
    setProxies((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
  };

  const handleDeleteProxy = (id: string) => {
    setProxies((prev) => prev.filter((p) => p.id !== id));
    if (defaultAction === id) {
      setDefaultAction('DIRECT');
    }
  };

  // 規則增刪改與排序
  const handleAddRule = () => {
    const newId = `r_${Date.now()}`;
    setRules((prev) => [
      ...prev,
      {
        id: newId,
        name: isEn ? 'New Rule' : '新分流規則',
        enabled: true,
        conditionType: 'domainSuffix',
        value: '.example.com',
        targetProxy: 'DIRECT',
      },
    ]);
  };

  const handleUpdateRule = useCallback((id: string, updates: Partial<RoutingRule>) => {
    setRules((prev) => prev.map((r) => (r.id === id ? { ...r, ...updates } : r)));
  }, []);

  // AND 疊加條件增刪改（例如「協定為 https」且「網域為 x」需同時成立才命中）
  const handleAddAndCondition = useCallback((ruleId: string) => {
    setRules((prev) =>
      prev.map((r) =>
        r.id === ruleId
          ? { ...r, andConditions: [...(r.andConditions ?? []), { conditionType: 'domainSuffix', value: '' }] }
          : r
      )
    );
  }, []);

  const handleUpdateAndCondition = useCallback((ruleId: string, index: number, updates: Partial<RuleCondition>) => {
    setRules((prev) =>
      prev.map((r) => {
        if (r.id !== ruleId || !r.andConditions) return r;
        const next = r.andConditions.map((c, i) => (i === index ? { ...c, ...updates } : c));
        return { ...r, andConditions: next };
      })
    );
  }, []);

  const handleRemoveAndCondition = useCallback((ruleId: string, index: number) => {
    setRules((prev) =>
      prev.map((r) => {
        if (r.id !== ruleId || !r.andConditions) return r;
        const next = r.andConditions.filter((_, i) => i !== index);
        return { ...r, andConditions: next.length > 0 ? next : undefined };
      })
    );
  }, []);

  const handleDeleteRule = useCallback((id: string) => {
    setRules((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const presetId = useId();

  return (
    <ToolLayout
      title={t.title}
      subtitle={t.subtitle}
      description={t.description}
      accentColor="#00f5a0"
      accentGlow="rgba(0, 245, 160, 0.6)"
    >
      <div className={styles.container}>
        {/* 頂部操作列：常用範本選擇與匯入 */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3" role="region" aria-label={t.presetLabel}>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-text-sub mr-2">{t.presetLabel}：</span>
            {PRESET_TEMPLATES.map((preset) => {
              const isActive = selectedPreset === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleApplyPreset(preset.id)}
                  className={`${styles.presetChip} ${isActive ? styles.presetChipActive : ''}`}
                >
                  <span>{isEn ? preset.nameEn : preset.nameZh}</span>
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => {
              setImportError(null);
              setIsImportModalOpen(true);
            }}
            className={`${styles.actionButton} ${styles.primaryButton}`}
            style={{ padding: '0.4rem 0.85rem', fontSize: '0.8125rem' }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z" />
            </svg>
            <span>{t.importBtn}</span>
          </button>
        </div>

        {/* 左右雙欄 Grid */}
        <div className={styles.layoutGrid}>
          {/* 左欄：代理池與規則排程 */}
          <div className="flex flex-col gap-6 min-w-0">
            {/* 代理節點池 */}
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
                      onClick={() => {
                        if (typeof window !== 'undefined' && window.confirm(t.clearProxiesConfirm)) {
                          setProxies([]);
                        }
                      }}
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
                    onClick={handleAddProxy}
                    className={`${styles.actionButton} ${styles.secondaryButton}`}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                    </svg>
                    <span>{t.addProxyBtn}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleAddChain}
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
                        onChange={(e) => handleUpdateProxy(proxy.id, { name: e.target.value })}
                        placeholder={t.proxyName}
                        className={`text-sm rounded-lg px-3 py-2 text-text-main focus:outline-none ${styles.fieldInput}`}
                      />
                      <select
                        value={proxy.type}
                        onChange={(e) => {
                          const newType = e.target.value as ProxyType;
                          const updates: Partial<ProxyNode> = { type: newType };
                          if (newType === 'CHAIN' && (!proxy.chainHops || proxy.chainHops.length === 0)) {
                            const others = proxies.filter((p) => p.id !== proxy.id && p.type !== 'CHAIN');
                            updates.chainHops = others.length > 0 ? [others[0].id, 'DIRECT'] : ['DIRECT'];
                            updates.isConcatFormat = true;
                          }
                          handleUpdateProxy(proxy.id, updates);
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
                            onClick={() => handleDeleteProxy(proxy.id)}
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
                            onChange={(e) => handleUpdateProxy(proxy.id, { host: e.target.value })}
                            placeholder={t.proxyHost}
                            className={`text-sm rounded-lg px-3 py-2 text-text-main focus:outline-none ${styles.fieldInput}`}
                          />
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              value={proxy.port}
                              onChange={(e) =>
                                handleUpdateProxy(proxy.id, {
                                  port: e.target.value === '' ? '' : parseInt(e.target.value, 10),
                                })
                              }
                              placeholder={t.proxyPort}
                              className={`w-full text-sm rounded-lg px-3 py-2 text-text-main focus:outline-none ${styles.fieldInput}`}
                            />
                            <button
                              type="button"
                              onClick={() => handleDeleteProxy(proxy.id)}
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
                            onClick={() => handleDeleteProxy(proxy.id)}
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
                                handleUpdateProxy(proxy.id, { isConcatFormat: e.target.checked })
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
                                        handleUpdateProxy(proxy.id, { chainHops: updated });
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
                            className="text-xs bg-select-bg border border-white/10 rounded-lg px-2.5 py-1.5 text-text-main focus:outline-none"
                            defaultValue="DIRECT"
                          >
                            {proxies
                              .filter((p) => p.id !== proxy.id)
                              .map((p) => (
                                <option key={p.id} value={p.id}>
                                  {p.name} ({formatProxyString(p, proxies)})
                                </option>
                              ))}
                            <option value="DIRECT">DIRECT (直連保底)</option>
                          </select>
                          <button
                            type="button"
                            onClick={() => {
                              const selectEl = document.getElementById(
                                `select_hop_${proxy.id}`
                              ) as HTMLSelectElement | null;
                              const val = selectEl?.value || 'DIRECT';
                              const currentHops = proxy.chainHops || [];
                              handleUpdateProxy(proxy.id, { chainHops: [...currentHops, val] });
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

            {/* 規則清單 */}
            <div className={styles.panel}>
              <div className={styles.sectionHeader}>
                <div className={styles.sectionTitle}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
                  </svg>
                  <span>{t.rulesTitle} ({rules.length})</span>
                </div>
                <div className="flex items-center gap-2 flex-wrap justify-end">
                  {rules.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        if (typeof window !== 'undefined' && window.confirm(t.clearRulesConfirm)) {
                          setRules([]);
                          setImportWarnings(null);
                        }
                      }}
                      className={styles.ghostButton}
                      title={t.clearRulesBtn}
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                      </svg>
                      <span>{t.clearRulesBtn}</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleAddRule}
                    className={`${styles.actionButton} ${styles.secondaryButton}`}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                    </svg>
                    <span>{t.addRuleBtn}</span>
                  </button>
                </div>
              </div>

              {importWarnings && importWarnings.length > 0 && (
                <div className={styles.ruleWarningBar} role="alert" style={{ marginBottom: '0.75rem', alignItems: 'flex-start' }}>
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className={styles.ruleWarningIcon}
                    aria-hidden="true"
                    style={{ marginTop: '0.15rem', flexShrink: 0 }}
                  >
                    <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" />
                  </svg>
                  <div className="flex-1 min-w-0">
                    <p className={styles.ruleWarningText}>{t.importWarningsTitle}</p>
                    <ul className="mt-1 list-disc list-inside space-y-0.5">
                      {importWarnings.map((w, i) => (
                        <li key={i} className={styles.ruleWarningText} style={{ fontWeight: 400 }}>{w}</li>
                      ))}
                    </ul>
                  </div>
                  <button
                    type="button"
                    onClick={() => setImportWarnings(null)}
                    aria-label={t.dismissBtn}
                    className="shrink-0 text-text-sub hover:text-text-main transition-colors"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                    </svg>
                  </button>
                </div>
              )}

              <div
                className="flex flex-col gap-3"
                onDragLeave={(e) => {
                  if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                    setDropTargetIndex(null);
                  }
                }}
              >
                {rules.map((rule, idx) => (
                  <RuleCard
                    key={rule.id}
                    rule={rule}
                    idx={idx}
                    rulesLength={rules.length}
                    t={t}
                    isEn={isEn}
                    proxies={proxies}
                    draggedRuleIndex={draggedRuleIndex}
                    dropTargetIndex={dropTargetIndex}
                    setDraggedRuleIndex={setDraggedRuleIndex}
                    setDropTargetIndex={setDropTargetIndex}
                    onReorder={handleReorderRule}
                    onDropAtIndex={handleDropAtIndex}
                    onUpdateRule={handleUpdateRule}
                    onDeleteRule={handleDeleteRule}
                    onAddAndCondition={handleAddAndCondition}
                    onUpdateAndCondition={handleUpdateAndCondition}
                    onRemoveAndCondition={handleRemoveAndCondition}
                  />
                ))}
              </div>

              {/* 預設行為 */}
              <div className="mt-4 pt-4 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <span className="text-sm font-semibold text-text-main">{t.defaultActionTitle}：</span>
                <select
                  value={defaultAction}
                  onChange={(e) => setDefaultAction(e.target.value)}
                  className="text-sm bg-select-bg border border-white/10 rounded-lg px-3 py-2 text-text-main focus:outline-none focus:border-[var(--theme-color)] sm:max-w-xs"
                >
                  <option value="DIRECT">{t.directOption}</option>
                  {proxies.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({formatProxyString(p, proxies)})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 進階選項 */}
            <div className={styles.panel}>
              <div className={styles.sectionTitle}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />
                </svg>
                <span>{t.optionsTitle}</span>
              </div>
              <div className="flex flex-col gap-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enableIpv6}
                    onChange={(e) => setEnableIpv6(e.target.checked)}
                    className="w-4 h-4 rounded border-white/20 accent-[var(--theme-color)]"
                  />
                  <span className="text-sm text-text-sub">{t.enableIpv6Label}</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={resolveIpFirst}
                    onChange={(e) => setResolveIpFirst(e.target.checked)}
                    className="w-4 h-4 rounded border-white/20 accent-[var(--theme-color)]"
                  />
                  <span className="text-sm text-text-sub">{t.resolveIpFirstLabel}</span>
                </label>
              </div>
            </div>
          </div>

          {/* 右欄：產出預覽與設定指引 */}
          <div className="flex flex-col gap-6 min-w-0">
            {/* 預覽與下載面板 */}
            <div className={styles.panel}>
              <div className={styles.sectionHeader}>
                <div className={styles.sectionTitle}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z" />
                  </svg>
                  <span>{t.previewTitle}</span>
                </div>
              </div>

              {/* 代碼預覽區 */}
              <div className={styles.codeBox}>{generatedScript}</div>

              {/* 核心操作按鈕群 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleCopyScript}
                  className={`${styles.actionButton} ${styles.primaryButton}`}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z" />
                  </svg>
                  <span>{t.copyScript}</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadPac}
                  className={`${styles.actionButton} ${styles.secondaryButton}`}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
                  </svg>
                  <span>{t.downloadPac}</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyDataUrl}
                  className={`${styles.actionButton} ${styles.secondaryButton}`}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z" />
                  </svg>
                  <span>{t.copyDataUrl}</span>
                </button>

                <button
                  type="button"
                  onClick={handleExportConfig}
                  className={`${styles.actionButton} ${styles.secondaryButton}`}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM17 13l-5 5-5-5h3V9h4v4h3z" />
                  </svg>
                  <span>{t.exportConfigBtn}</span>
                </button>

                <button
                  type="button"
                  onClick={handleGoToTester}
                  className={`${styles.actionButton} ${styles.secondaryButton} ${styles.testerLinkButton}`}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                  </svg>
                  <span>{t.testInTester}</span>
                </button>
              </div>

              {/* 複製成功提示 */}
              {toastMessage && (
                <div className={`text-center text-xs font-semibold py-2 px-3 rounded-lg ${styles.toastSuccess} animate-fade-in`}>
                  {toastMessage}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 匯入 PAC 腳本或專案設定彈窗 Modal */}
        {isImportModalOpen && (
          <div
            className={styles.modalOverlay}
            role="dialog"
            aria-modal="true"
            aria-labelledby="import-modal-title"
          >
            <div className={styles.modalCard}>
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className={styles.themeAccentText}>
                    <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z" />
                  </svg>
                  <h2 id="import-modal-title" className="text-base font-bold text-text-main">
                    {t.importModalTitle}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(false)}
                  className="p-1 rounded-lg text-text-sub hover:text-text-main hover:bg-white/10 transition-colors"
                  aria-label={t.cancelBtn}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                  </svg>
                </button>
              </div>

              <p className="text-xs text-text-sub leading-relaxed">
                {t.importModalDesc}
              </p>

              {/* 檔案上傳列 */}
              <div className="flex items-center gap-3">
                <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-white/5 border border-white/10 hover:bg-white/10 text-text-main cursor-pointer transition-colors">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9 16h6v-6h4l-7-7-7 7h4zm-4 2h14v2H5z" />
                  </svg>
                  <span>{t.uploadFileBtn}</span>
                  <input
                    type="file"
                    accept=".pac,.js,.txt,.json"
                    onChange={handleImportFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {/* 代碼貼入文字框 */}
              <textarea
                value={importContent}
                onChange={(e) => {
                  setImportContent(e.target.value);
                  if (importError) setImportError(null);
                }}
                placeholder={t.importPlaceholder}
                className={styles.modalTextarea}
              />

              {/* 錯誤提示 */}
              {importError && (
                <div className={styles.ruleWarningBar} role="alert">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className={styles.ruleWarningIcon}>
                    <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" />
                  </svg>
                  <span className={styles.ruleWarningText}>{importError}</span>
                </div>
              )}

              {/* 匯入模式選擇與送出按鈕 */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <div className="flex items-center gap-4 text-xs text-text-sub">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="importMode"
                      value="replace"
                      checked={importMode === 'replace'}
                      onChange={() => setImportMode('replace')}
                      className="accent-[var(--theme-color)]"
                    />
                    <span>{t.importModeReplace}</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="importMode"
                      value="append"
                      checked={importMode === 'append'}
                      onChange={() => setImportMode('append')}
                      className="accent-[var(--theme-color)]"
                    />
                    <span>{t.importModeAppend}</span>
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsImportModalOpen(false)}
                    className={`${styles.actionButton} ${styles.secondaryButton}`}
                  >
                    {t.cancelBtn}
                  </button>
                  <button
                    type="button"
                    onClick={handleDoImport}
                    disabled={!importContent.trim()}
                    className={`${styles.actionButton} ${styles.primaryButton} disabled:opacity-40 disabled:cursor-not-allowed`}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z" />
                    </svg>
                    <span>{t.parseAndApplyBtn}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* FAQ 常見問題 */}
        <FaqSection
          title={t.faqTitle}
          subtitle={t.faqSubtitle}
          items={t.faqItems}
          accentColor="#00f5a0"
        />
      </div>
    </ToolLayout>
  );
}
