'use client';

import { useState, useEffect, useCallback } from 'react';
import type { PrizeItem, AwardTier, HistoryRecord, SaveSlot } from '../types';
import { PRESET_COLORS, PRIZE_TEMPLATES, DEFAULT_AWARD_TIERS, type PrizeTemplateKey } from '../constants';
import {
  parseBatchText,
  encodeWheelShareState,
  decodeWheelShareState,
  formatHistoryCsv,
  secureRandomFloat,
  generateId,
  revertWinnerRecords,
} from '../engine';
import { downloadBlob } from '../../utils/downloadBlob';
import { getLocalDateString } from '../../utils/dateUtils';
import { safeIdb } from '../../utils/idb';
import type { LuckyWheelTranslations } from '../translations';

const LW_IDB_NAMESPACE = 'lucky-wheel';
const LW_SLOTS_IDB_KEY = 'save_slots_v1';

interface UseWheelPersistenceParams {
  lang: 'zh-TW' | 'en';
  t: LuckyWheelTranslations;
  showToast: (msg: string) => void;
  onAfterRevert?: () => void;
}

export function useWheelPersistence({ lang, t, showToast, onAfterRevert }: UseWheelPersistenceParams) {
  const [isMounted, setIsMounted] = useState<boolean>(false);
  const [enableQuantityLimit, setEnableQuantityLimit] = useState<boolean>(true);
  const [enableAwardMode, setEnableAwardMode] = useState<boolean>(false);
  const [prizes, setPrizes] = useState<PrizeItem[]>([]);
  const [awardTiers, setAwardTiers] = useState<AwardTier[]>([]);
  const [selectedAwardId, setSelectedAwardId] = useState<string>('');
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [saveSlots, setSaveSlots] = useState<SaveSlot[]>([]);

  // 讀取 LocalStorage、IndexedDB 與 URL 分享參數
  useEffect(() => {
    setIsMounted(true);
    try {
      const params = new URLSearchParams(window.location.search);
      const sharedWheel = params.get('wheel');
      if (sharedWheel) {
        const decoded = decodeWheelShareState(sharedWheel);
        if (decoded) {
          setPrizes(decoded.prizes);
          setEnableQuantityLimit(decoded.enableQuantityLimit);
          setEnableAwardMode(decoded.enableAwardMode);
          if (decoded.awardTiers.length > 0) {
            setAwardTiers(decoded.awardTiers);
            setSelectedAwardId(decoded.awardTiers[0].id);
          } else {
            const defAwards = (DEFAULT_AWARD_TIERS[lang] || DEFAULT_AWARD_TIERS['zh-TW']).map((a) => ({
              ...a,
              id: generateId(),
            }));
            setAwardTiers(defAwards);
            setSelectedAwardId(defAwards[0].id);
          }
          return;
        }
      }

      const defaultTemplate = PRIZE_TEMPLATES.annual[lang] || PRIZE_TEMPLATES.annual['zh-TW'];
      const cachedPrizes = localStorage.getItem('lw_prizes');
      if (cachedPrizes) {
        const parsed = JSON.parse(cachedPrizes);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setPrizes(parsed);
        } else {
          setPrizes(defaultTemplate.map((p) => ({ ...p, id: generateId() })));
        }
      } else {
        setPrizes(defaultTemplate.map((p) => ({ ...p, id: generateId() })));
      }

      const cachedHistory = localStorage.getItem('lw_history');
      if (cachedHistory) {
        const parsed = JSON.parse(cachedHistory);
        if (Array.isArray(parsed)) setHistory(parsed);
      }

      const cachedAwards = localStorage.getItem('lw_awards');
      if (cachedAwards) {
        const parsed = JSON.parse(cachedAwards);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setAwardTiers(parsed);
          setSelectedAwardId(parsed[0].id);
        } else {
          const defAwards = (DEFAULT_AWARD_TIERS[lang] || DEFAULT_AWARD_TIERS['zh-TW']).map((a) => ({
            ...a,
            id: generateId(),
          }));
          setAwardTiers(defAwards);
          setSelectedAwardId(defAwards[0].id);
        }
      } else {
        const defAwards = (DEFAULT_AWARD_TIERS[lang] || DEFAULT_AWARD_TIERS['zh-TW']).map((a) => ({
          ...a,
          id: generateId(),
        }));
        setAwardTiers(defAwards);
        setSelectedAwardId(defAwards[0].id);
      }

      const cachedAwardMode = localStorage.getItem('lw_enable_award_mode');
      if (cachedAwardMode !== null) setEnableAwardMode(cachedAwardMode === 'true');

      const cachedQtyLimit = localStorage.getItem('lw_enable_qty_limit');
      if (cachedQtyLimit !== null) setEnableQuantityLimit(cachedQtyLimit === 'true');

      const cachedSlots = localStorage.getItem('lw_save_slots');
      if (cachedSlots) {
        const parsed = JSON.parse(cachedSlots);
        if (Array.isArray(parsed)) setSaveSlots(parsed);
      }
      void safeIdb.get<SaveSlot[]>(LW_IDB_NAMESPACE, LW_SLOTS_IDB_KEY).then((idbSlots) => {
        if (Array.isArray(idbSlots) && idbSlots.length > 0) {
          setSaveSlots(idbSlots);
        } else if (cachedSlots) {
          try {
            const parsed = JSON.parse(cachedSlots);
            if (Array.isArray(parsed) && parsed.length > 0) {
              void safeIdb.set(LW_IDB_NAMESPACE, LW_SLOTS_IDB_KEY, parsed);
            }
          } catch (err) {
            console.warn('[lucky-wheel] 遷移存檔槽至 IndexedDB 失敗', err);
          }
        }
      });
    } catch (err) {
      console.warn('[lucky-wheel] 初始化讀取本地狀態失敗', err);
    }
  }, [lang]);

  // 同步保存最新狀態至 LocalStorage
  const saveState = useCallback(
    (
      newPrizes?: PrizeItem[],
      newHistory?: HistoryRecord[],
      newAwards?: AwardTier[],
      newAwardMode?: boolean,
      newQtyLimit?: boolean
    ) => {
      try {
        if (newPrizes) localStorage.setItem('lw_prizes', JSON.stringify(newPrizes));
        if (newHistory) localStorage.setItem('lw_history', JSON.stringify(newHistory));
        if (newAwards) localStorage.setItem('lw_awards', JSON.stringify(newAwards));
        if (newAwardMode !== undefined) localStorage.setItem('lw_enable_award_mode', String(newAwardMode));
        if (newQtyLimit !== undefined) localStorage.setItem('lw_enable_qty_limit', String(newQtyLimit));
      } catch {
        // ignore
      }
    },
    []
  );

  // 不在場放棄重抽 / 撤銷單筆或整批紀錄
  const handleRevertRecords = (recordIds: string[]) => {
    const { updatedPrizes, updatedAwardTiers, updatedHistory } = revertWinnerRecords(
      prizes,
      awardTiers,
      history,
      recordIds,
      enableQuantityLimit
    );
    setPrizes(updatedPrizes);
    setAwardTiers(updatedAwardTiers);
    setHistory(updatedHistory);
    saveState(updatedPrizes, updatedHistory, updatedAwardTiers);
    onAfterRevert?.();
    showToast(t.toastRevertedWinner);
  };

  // 載入快速模板
  const loadTemplate = (templateKey: string) => {
    if (templateKey in PRIZE_TEMPLATES) {
      const validKey = templateKey as PrizeTemplateKey;
      const templateData = PRIZE_TEMPLATES[validKey][lang] || PRIZE_TEMPLATES[validKey]['zh-TW'];
      const newItems = templateData.map((p) => ({ ...p, id: generateId() }));
      setPrizes(newItems);
      setEnableAwardMode(false);
      saveState(newItems, undefined, undefined, false);
      showToast(t.toastLoadedTemplate);
    } else if (templateKey === 'empty') {
      setPrizes([]);
      setEnableAwardMode(false);
      saveState([], undefined, undefined, false);
    }
  };

  // 批次文字套用
  const handleApplyBatchText = (rawText: string) => {
    const { items, isParticipantList } = parseBatchText(rawText, PRESET_COLORS);
    if (items.length > 0) {
      setPrizes(items);
      saveState(items);
      showToast(
        (isParticipantList ? t.toastImportPeople : t.toastImportPrizes).replace('{n}', String(items.length))
      );
    } else {
      showToast(t.toastInvalidFile);
    }
  };

  // 檔案上傳匯入
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) handleApplyBatchText(text);
    };
    reader.readAsText(file, 'UTF-8');
    e.target.value = '';
  };

  // 隨機打亂與去重
  const handleShufflePrizes = () => {
    const copy = [...prizes];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(secureRandomFloat() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    setPrizes(copy);
    saveState(copy);
    showToast(t.toastShuffled);
  };

  const handleDeduplicatePrizes = () => {
    const seen = new Set<string>();
    const deduped = prizes.filter((p) => {
      const key = p.title.trim().toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    setPrizes(deduped);
    saveState(deduped);
    showToast(t.toastDeduped.replace('{n}', String(deduped.length)));
  };

  // 分享連結與匯出
  const handleShareUrl = async () => {
    const encoded = encodeWheelShareState({
      prizes,
      enableQuantityLimit,
      enableAwardMode,
      awardTiers,
    });
    const url = `${window.location.origin}${window.location.pathname}?wheel=${encoded}`;
    try {
      await navigator.clipboard.writeText(url);
      showToast(t.toastCopiedShareLink);
    } catch {
      window.history.replaceState(null, '', `?wheel=${encoded}`);
      showToast(t.toastCopiedShareLink);
    }
  };

  const exportTxt = () => {
    const textContent = prizes.map((p) => `${p.title}\t${p.weight}\t${p.quantity}\t${p.color}`).join('\n');
    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    downloadBlob(blob, `LuckyWheel_Prizes_${getLocalDateString()}.txt`);
  };

  const exportHistoryCsv = () => {
    const csv = formatHistoryCsv(history, lang);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    downloadBlob(blob, `LuckyWheel_Winners_${getLocalDateString()}.csv`);
  };

  const copyWinnersText = async () => {
    const lines = history.map((rec, idx) =>
      rec.awardName ? `${idx + 1}. ${rec.prizeTitle} — ${rec.awardName}` : `${idx + 1}. ${rec.prizeTitle}`
    );
    try {
      await navigator.clipboard.writeText(lines.join('\n'));
      showToast(t.toastCopiedWinners);
    } catch {
      // ignore
    }
  };

  // 本地存檔槽操作
  const handleSaveSlot = (slotName: string) => {
    const cleanName = slotName.trim() || `${t.title} #${saveSlots.length + 1}`;
    const newSlot: SaveSlot = {
      id: generateId(),
      name: cleanName,
      updatedAt: Date.now(),
      prizes,
      enableQuantityLimit,
      enableAwardMode,
      awardTiers,
    };
    const nextSlots = [newSlot, ...saveSlots].slice(0, 30);
    setSaveSlots(nextSlots);
    void safeIdb.set(LW_IDB_NAMESPACE, LW_SLOTS_IDB_KEY, nextSlots);
    try {
      localStorage.setItem('lw_save_slots', JSON.stringify(nextSlots.slice(0, 12)));
    } catch {
      // ignore
    }
    showToast(t.toastSavedSlot.replace('{name}', cleanName));
  };

  const handleLoadSlot = (slot: SaveSlot) => {
    setPrizes(slot.prizes);
    setEnableQuantityLimit(slot.enableQuantityLimit);
    setEnableAwardMode(Boolean(slot.enableAwardMode));
    if (slot.awardTiers && slot.awardTiers.length > 0) {
      setAwardTiers(slot.awardTiers);
      setSelectedAwardId(slot.awardTiers[0].id);
    }
    saveState(slot.prizes, undefined, slot.awardTiers, Boolean(slot.enableAwardMode), slot.enableQuantityLimit);
    showToast(t.toastLoadedSlot.replace('{name}', slot.name));
  };

  const handleDeleteSlot = (slotId: string) => {
    const nextSlots = saveSlots.filter((s) => s.id !== slotId);
    setSaveSlots(nextSlots);
    void safeIdb.set(LW_IDB_NAMESPACE, LW_SLOTS_IDB_KEY, nextSlots);
    try {
      localStorage.setItem('lw_save_slots', JSON.stringify(nextSlots.slice(0, 12)));
    } catch {
      // ignore
    }
  };

  return {
    isMounted,
    enableQuantityLimit,
    setEnableQuantityLimit,
    enableAwardMode,
    setEnableAwardMode,
    prizes,
    setPrizes,
    awardTiers,
    setAwardTiers,
    selectedAwardId,
    setSelectedAwardId,
    history,
    setHistory,
    saveSlots,
    saveState,
    handleRevertRecords,
    loadTemplate,
    handleApplyBatchText,
    handleFileUpload,
    handleShufflePrizes,
    handleDeduplicatePrizes,
    handleShareUrl,
    exportTxt,
    exportHistoryCsv,
    copyWinnersText,
    handleSaveSlot,
    handleLoadSlot,
    handleDeleteSlot,
  };
}
