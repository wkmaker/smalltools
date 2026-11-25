'use client';

import { useState, useEffect, useRef, useCallback, useId } from 'react';
import ToolLayout from '../components/ToolLayout';
import FaqSection from '../components/FaqSection';
import PrizeEditorPanel from './components/PrizeEditorPanel';
import FullscreenStageModal from './components/FullscreenStageModal';
import { WinnerModal, HistoryModal } from './components/Modals';
import TopBannerControls from './components/TopBannerControls';
import WheelControlsBar from './components/WheelControlsBar';
import StageView from './components/StageView';
import styles from './lucky-wheel.module.css';
import type { PrizeItem, AwardTier, SpinSpeed } from './types';
import { PRESET_COLORS } from './constants';
import { generateId } from './engine';
import { useWheelAudio } from './hooks/useWheelAudio';
import { useWheelPersistence } from './hooks/useWheelPersistence';
import { useWheelSpin, type WinnerModalData } from './hooks/useWheelSpin';
import { TRANSLATIONS } from './translations';

interface LuckyWheelClientProps {
  lang?: 'zh-TW' | 'en';
}

export default function LuckyWheelClient({ lang = 'zh-TW' }: LuckyWheelClientProps) {
  const t = TRANSLATIONS[lang] || TRANSLATIONS['zh-TW'];
  const [displayMode, setDisplayMode] = useState<'wheel' | 'slot'>('wheel');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [spinSpeed, setSpinSpeed] = useState<SpinSpeed>('normal');
  const [drawCount, setDrawCount] = useState<number>(1);

  // 彈窗與舞台狀態
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showHistoryModal, setShowHistoryModal] = useState<boolean>(false);
  const [winnerModalData, setWinnerModalData] = useState<WinnerModalData | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const qtyLimitToggleId = useId();
  const awardModeToggleId = useId();
  const speedSelectId = useId();
  const drawCountSelectId = useId();
  const activeAwardSelectId = useId();

  // 音效 Engine Hook
  const { playTickSound, playSubWinDing, playWinFanfare } = useWheelAudio(soundEnabled);

  useEffect(() => {
    document.documentElement.style.setProperty('--theme-color', '#f59e0b');
    document.documentElement.style.setProperty('--accent-glow', 'rgba(245, 158, 11, 0.6)');
  }, []);

  const showToast = useCallback((msg: string) => {
    const isLight = typeof document !== 'undefined' && document.documentElement.getAttribute('data-theme') === 'light';
    const toastEl = document.createElement('div');
    toastEl.className = isLight
      ? 'fixed bottom-8 right-8 px-6 py-3 text-sm font-bold text-[#d97706] bg-white/95 border border-[#d97706]/40 rounded-xl shadow-2xl z-[30000] animate-bounce flex items-center gap-2 backdrop-blur-md'
      : 'fixed bottom-8 right-8 px-6 py-3 text-sm font-bold text-white bg-amber-500/20 border border-amber-500/40 rounded-xl shadow-2xl z-[30000] animate-bounce flex items-center gap-2 backdrop-blur-md';
    toastEl.insertAdjacentHTML(
      'afterbegin',
      '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" class="shrink-0"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>'
    );
    const msgEl = document.createElement('span');
    msgEl.textContent = msg;
    toastEl.appendChild(msgEl);
    document.body.appendChild(toastEl);
    setTimeout(() => {
      if (document.body.contains(toastEl)) document.body.removeChild(toastEl);
    }, 2200);
  }, []);

  // 狀態持久化、存檔槽與匯入／匯出 Hook
  const {
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
  } = useWheelPersistence({
    lang,
    t,
    showToast,
    onAfterRevert: () => setWinnerModalData(null),
  });

  // 轉盤 / 拉霸機動畫與抽獎結算 Hook
  const {
    isSpinning,
    multiSpinProgress,
    slotStripItems,
    slotTranslateY,
    previewCanvasRef,
    fullscreenCanvasRef,
    confettiCanvasRef,
    getUnfinishedPrizes,
    handleStartSpin,
  } = useWheelSpin({
    prizes,
    setPrizes,
    awardTiers,
    setAwardTiers,
    selectedAwardId,
    setSelectedAwardId,
    history,
    setHistory,
    displayMode,
    enableQuantityLimit,
    enableAwardMode,
    spinSpeed,
    drawCount,
    isFullscreen,
    allDrawnLabel: t.allDrawn,
    playTickSound,
    playSubWinDing,
    playWinFanfare,
    saveState,
    onShowWinners: setWinnerModalData,
  });

  // 鍵盤快捷鍵：空白鍵啟動抽獎或關閉得獎彈窗、Esc 退出全螢幕舞台
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      if (e.code === 'Space') {
        if (winnerModalData) {
          e.preventDefault();
          setWinnerModalData(null);
        } else if (!showHistoryModal && !isSpinning) {
          e.preventDefault();
          handleStartSpin();
        }
      } else if (e.code === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [winnerModalData, showHistoryModal, isSpinning, isFullscreen, handleStartSpin]);

  const toggleBrowserFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  };

  const unfinishedPrizes = getUnfinishedPrizes();
  const totalWeight = unfinishedPrizes.reduce((sum, p) => sum + p.weight, 0);
  const selectedAward = awardTiers.find((a) => a.id === selectedAwardId);
  const selectedAwardRemain = selectedAward ? Math.max(0, selectedAward.quantity - selectedAward.drawnCount) : 0;
  const isAwardExhausted = enableAwardMode && selectedAward && selectedAwardRemain === 0;

  const latestBatchId = history[0]?.batchId;
  const latestBatchRecords = latestBatchId
    ? history.filter((r) => r.batchId === latestBatchId)
    : history.slice(0, 1);

  if (!isMounted) return null;

  return (
    <ToolLayout
      title={t.title}
      subtitle={t.subtitle}
      description={t.description}
      accentColor="#f59e0b"
      accentGlow="rgba(245, 158, 11, 0.6)"
    >
      <div className="flex flex-col gap-6 text-left w-full px-4 max-sm:px-0">
        {/* 頂部最新中獎動態與快捷列 */}
        <TopBannerControls
          t={t}
          history={history}
          soundEnabled={soundEnabled}
          onToggleSound={() => setSoundEnabled(!soundEnabled)}
          onOpenHistory={() => setShowHistoryModal(true)}
          onShareUrl={handleShareUrl}
          onOpenFullscreen={() => setIsFullscreen(true)}
        />

        {/* 模式切換、連抽人數、轉速與尾牙雙抽開關列 */}
        <WheelControlsBar
          t={t}
          displayMode={displayMode}
          setDisplayMode={setDisplayMode}
          drawCount={drawCount}
          setDrawCount={setDrawCount}
          spinSpeed={spinSpeed}
          setSpinSpeed={setSpinSpeed}
          enableAwardMode={enableAwardMode}
          onToggleAwardMode={(enabled) => {
            setEnableAwardMode(enabled);
            saveState(undefined, undefined, undefined, enabled);
          }}
          enableQuantityLimit={enableQuantityLimit}
          onToggleQuantityLimit={(enabled) => {
            setEnableQuantityLimit(enabled);
            saveState(undefined, undefined, undefined, undefined, enabled);
          }}
          drawCountSelectId={drawCountSelectId}
          speedSelectId={speedSelectId}
          awardModeToggleId={awardModeToggleId}
          qtyLimitToggleId={qtyLimitToggleId}
        />

        {/* 主 Layout (兩欄式) */}
        <div className="grid grid-cols-2 gap-8 max-lg:grid-cols-1 items-start">
          {/* 左欄：轉盤 / 拉霸機 舞台區 */}
          <StageView
            t={t}
            displayMode={displayMode}
            enableAwardMode={enableAwardMode}
            awardTiers={awardTiers}
            selectedAwardId={selectedAwardId}
            onSelectAwardId={setSelectedAwardId}
            onCloseAwardMode={() => {
              setEnableAwardMode(false);
              saveState(undefined, undefined, undefined, false);
            }}
            activeAwardSelectId={activeAwardSelectId}
            previewCanvasRef={previewCanvasRef}
            slotStripItems={slotStripItems}
            slotTranslateY={slotTranslateY}
            isSpinning={isSpinning}
            unfinishedPrizes={unfinishedPrizes}
            isAwardExhausted={isAwardExhausted}
            drawCount={drawCount}
            multiSpinProgress={multiSpinProgress}
            latestBatchRecords={latestBatchRecords}
            onStartSpin={handleStartSpin}
          />

          {/* 右欄：獎項與人員名單編輯面板 */}
          <PrizeEditorPanel
            t={t}
            prizes={prizes}
            unfinishedPrizes={unfinishedPrizes}
            totalWeight={totalWeight}
            enableQuantityLimit={enableQuantityLimit}
            enableAwardMode={enableAwardMode}
            awardTiers={awardTiers}
            selectedAwardId={selectedAwardId}
            saveSlots={saveSlots}
            onLoadTemplate={loadTemplate}
            onExportTxt={exportTxt}
            onTriggerFileUpload={() => fileInputRef.current?.click()}
            onResetCounts={() => {
              const resetP = prizes.map((p) => ({ ...p, drawnCount: 0, isFinished: false }));
              const resetA = awardTiers.map((a) => ({ ...a, drawnCount: 0 }));
              setPrizes(resetP);
              setAwardTiers(resetA);
              saveState(resetP, undefined, resetA);
              showToast(t.toastResetCount);
            }}
            onAddPrize={() => {
              const newItem: PrizeItem = {
                id: generateId(),
                title: `${t.newPrizeDefault} ${prizes.length + 1}`,
                weight: 1,
                quantity: 1,
                drawnCount: 0,
                color: PRESET_COLORS[prizes.length % PRESET_COLORS.length],
                isFinished: false,
              };
              const updated = [...prizes, newItem];
              setPrizes(updated);
              saveState(updated);
            }}
            onUpdatePrize={(id, field, value) => {
              const updated = prizes.map((p) => (p.id === id ? { ...p, [field]: value } : p));
              setPrizes(updated);
              saveState(updated);
            }}
            onRemovePrize={(id) => {
              const updated = prizes.filter((p) => p.id !== id);
              setPrizes(updated);
              saveState(updated);
            }}
            onApplyBatchText={handleApplyBatchText}
            onShufflePrizes={handleShufflePrizes}
            onDeduplicatePrizes={handleDeduplicatePrizes}
            onAddAwardTier={() => {
              const newTier: AwardTier = {
                id: generateId(),
                name: `${t.newPrizeDefault} ${awardTiers.length + 1}`,
                quantity: 1,
                drawnCount: 0,
              };
              const next = [...awardTiers, newTier];
              setAwardTiers(next);
              if (!selectedAwardId) setSelectedAwardId(newTier.id);
              saveState(undefined, undefined, next);
            }}
            onUpdateAwardTier={(id, field, value) => {
              const next = awardTiers.map((a) => (a.id === id ? { ...a, [field]: value } : a));
              setAwardTiers(next);
              saveState(undefined, undefined, next);
            }}
            onRemoveAwardTier={(id) => {
              const next = awardTiers.filter((a) => a.id !== id);
              setAwardTiers(next);
              if (selectedAwardId === id) setSelectedAwardId(next[0]?.id || '');
              saveState(undefined, undefined, next);
            }}
            onSelectAwardId={setSelectedAwardId}
            onCloseAwardMode={() => {
              setEnableAwardMode(false);
              saveState(undefined, undefined, undefined, false);
            }}
            onSaveSlot={handleSaveSlot}
            onLoadSlot={handleLoadSlot}
            onDeleteSlot={handleDeleteSlot}
          />
          <input
            type="file"
            ref={fileInputRef}
            accept=".txt,.csv"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>
      </div>

      {/* 通用 FAQ 常見問題區塊 */}
      <FaqSection items={t.faqItems} title={t.faqTitle} subtitle={t.faqSubtitle} accentColor="#f59e0b" />

      {/* 全螢幕抽獎舞台 */}
      {isFullscreen && (
        <FullscreenStageModal
          t={t}
          displayMode={displayMode}
          isSpinning={isSpinning}
          unfinishedPrizes={unfinishedPrizes}
          enableQuantityLimit={enableQuantityLimit}
          enableAwardMode={enableAwardMode}
          awardTiers={awardTiers}
          selectedAwardId={selectedAwardId}
          spinSpeed={spinSpeed}
          drawCount={drawCount}
          multiSpinProgress={multiSpinProgress}
          history={history}
          slotStripItems={slotStripItems}
          slotTranslateY={slotTranslateY}
          fullscreenCanvasRef={fullscreenCanvasRef}
          onSelectAwardId={setSelectedAwardId}
          onChangeSpinSpeed={setSpinSpeed}
          onChangeDrawCount={setDrawCount}
          onStartSpin={handleStartSpin}
          onToggleBrowserFullscreen={toggleBrowserFullscreen}
          onExitStage={() => setIsFullscreen(false)}
        />
      )}

      {/* 歷史紀錄與 CSV 匯出 Modal */}
      {showHistoryModal && (
        <HistoryModal
          t={t}
          lang={lang}
          history={history}
          onClose={() => setShowHistoryModal(false)}
          onClearAll={() => {
            setHistory([]);
            saveState(undefined, []);
            showToast(t.toastClearedHistory);
          }}
          onRevertRecord={(recId) => handleRevertRecords([recId])}
          onExportCsv={exportHistoryCsv}
          onCopyWinners={copyWinnersText}
        />
      )}

      {/* 中獎歡呼與「不在場放棄重抽」Modal */}
      {winnerModalData && (
        <WinnerModal
          t={t}
          lang={lang}
          winners={winnerModalData.winners}
          awardName={winnerModalData.awardName}
          timestamp={winnerModalData.timestamp}
          onConfirm={() => setWinnerModalData(null)}
          onAbandonRedraw={() => handleRevertRecords(winnerModalData.recordIds)}
        />
      )}

      {/* 彩帶 Canvas */}
      <canvas ref={confettiCanvasRef} className={styles.confettiCanvas} />
    </ToolLayout>
  );
}
