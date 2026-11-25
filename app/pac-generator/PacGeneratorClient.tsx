'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import ToolLayout from '@/app/components/ToolLayout';
import { safeSessionStorage } from '@/app/utils/storage';
import FaqSection from '@/app/components/FaqSection';
import { downloadBlob } from '@/app/utils/downloadBlob';
import styles from './pac-generator.module.css';
import {
  ProxyNode,
  RoutingRule,
  RuleCondition,
} from './types';
import {
  generatePacDataUrl,
  generatePacScript,
  parsePacScript,
  PRESET_TEMPLATES,
} from './engine';
import { TRANSLATIONS } from './translations';
import ProxyPoolPanel from './components/ProxyPoolPanel';
import PacRulesPanel from './components/PacRulesPanel';
import PacOutputPanel from './components/PacOutputPanel';
import PacImportModal from './components/PacImportModal';

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
      const transferred = safeSessionStorage.getItem('pac_tester_export_code');
      if (transferred && transferred.trim().length > 0) {
        setImportContent(transferred);
        setIsImportModalOpen(true);
        safeSessionStorage.removeItem('pac_tester_export_code');
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
      title: t.customPacTitle,
    });
  }, [proxies, rules, defaultAction, enableIpv6, resolveIpFirst, t.customPacTitle]);

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
    showToast(t.toastConfigExported);
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
    reader.onerror = () => {
      showToast(isEn ? 'Failed to read file' : '讀取檔案失敗');
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // 跨工具連動：傳送到 PAC 測試器
  const handleGoToTester = () => {
    if (typeof window !== 'undefined') {
      safeSessionStorage.setItem('pac_transfer_code', generatedScript);
      const targetUrl = isEn ? '/pac-tester/en/' : '/pac-tester/';
      window.location.href = targetUrl;
    }
  };

  // Proxy 節點增刪改
  const handleClearProxies = () => {
    if (typeof window !== 'undefined' && window.confirm(t.clearProxiesConfirm)) {
      setProxies([]);
    }
  };

  const handleAddProxy = () => {
    const newId = `p_${Date.now()}`;
    setProxies((prev) => [
      ...prev,
      { id: newId, name: t.newProxyName, type: 'PROXY', host: '127.0.0.1', port: 8080 },
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
        name: t.failoverChainName(prev.length + 1),
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
  const handleClearRules = () => {
    if (typeof window !== 'undefined' && window.confirm(t.clearRulesConfirm)) {
      setRules([]);
      setImportWarnings(null);
    }
  };

  const handleAddRule = () => {
    const newId = `r_${Date.now()}`;
    setRules((prev) => [
      ...prev,
      {
        id: newId,
        name: t.newRuleName,
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
            <ProxyPoolPanel
              t={t}
              proxies={proxies}
              onClearProxies={handleClearProxies}
              onAddProxy={handleAddProxy}
              onAddChain={handleAddChain}
              onUpdateProxy={handleUpdateProxy}
              onDeleteProxy={handleDeleteProxy}
            />

            <PacRulesPanel
              t={t}
              isEn={isEn}
              proxies={proxies}
              rules={rules}
              defaultAction={defaultAction}
              enableIpv6={enableIpv6}
              resolveIpFirst={resolveIpFirst}
              importWarnings={importWarnings}
              draggedRuleIndex={draggedRuleIndex}
              dropTargetIndex={dropTargetIndex}
              setDraggedRuleIndex={setDraggedRuleIndex}
              setDropTargetIndex={setDropTargetIndex}
              onClearRules={handleClearRules}
              onAddRule={handleAddRule}
              onDismissWarnings={() => setImportWarnings(null)}
              onReorderRule={handleReorderRule}
              onDropAtIndex={handleDropAtIndex}
              onUpdateRule={handleUpdateRule}
              onDeleteRule={handleDeleteRule}
              onAddAndCondition={handleAddAndCondition}
              onUpdateAndCondition={handleUpdateAndCondition}
              onRemoveAndCondition={handleRemoveAndCondition}
              onDefaultActionChange={setDefaultAction}
              onEnableIpv6Change={setEnableIpv6}
              onResolveIpFirstChange={setResolveIpFirst}
            />
          </div>

          {/* 右欄：產出預覽與設定指引 */}
          <div className="flex flex-col gap-6 min-w-0">
            <PacOutputPanel
              t={t}
              generatedScript={generatedScript}
              toastMessage={toastMessage}
              onCopyScript={handleCopyScript}
              onDownloadPac={handleDownloadPac}
              onCopyDataUrl={handleCopyDataUrl}
              onExportConfig={handleExportConfig}
              onGoToTester={handleGoToTester}
            />
          </div>
        </div>

        {/* 匯入 PAC 腳本或專案設定彈窗 Modal */}
        <PacImportModal
          t={t}
          isOpen={isImportModalOpen}
          importContent={importContent}
          importMode={importMode}
          importError={importError}
          onClose={() => setIsImportModalOpen(false)}
          onContentChange={(content) => {
            setImportContent(content);
            if (importError) setImportError(null);
          }}
          onModeChange={setImportMode}
          onFileUpload={handleImportFileUpload}
          onDoImport={handleDoImport}
        />

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
