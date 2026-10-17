'use client';

import { useState, useId } from 'react';
import type { PrizeItem, AwardTier, SaveSlot } from '../types';
import type { LuckyWheelTranslations } from '../translations';
import { serializePrizesToText } from '../engine';
import styles from '../lucky-wheel.module.css';

interface PrizeEditorPanelProps {
  t: LuckyWheelTranslations;
  prizes: PrizeItem[];
  unfinishedPrizes: PrizeItem[];
  totalWeight: number;
  enableQuantityLimit: boolean;
  enableAwardMode: boolean;
  awardTiers: AwardTier[];
  selectedAwardId: string;
  saveSlots: SaveSlot[];
  onLoadTemplate: (templateKey: string) => void;
  onExportTxt: () => void;
  onTriggerFileUpload: () => void;
  onResetCounts: () => void;
  onAddPrize: () => void;
  onUpdatePrize: (id: string, field: keyof PrizeItem, value: unknown) => void;
  onRemovePrize: (id: string) => void;
  onApplyBatchText: (rawText: string) => void;
  onShufflePrizes: () => void;
  onDeduplicatePrizes: () => void;
  onAddAwardTier: () => void;
  onUpdateAwardTier: (id: string, field: keyof AwardTier, value: unknown) => void;
  onRemoveAwardTier: (id: string) => void;
  onSelectAwardId: (id: string) => void;
  onCloseAwardMode: () => void;
  onSaveSlot: (slotName: string) => void;
  onLoadSlot: (slot: SaveSlot) => void;
  onDeleteSlot: (slotId: string) => void;
}

export default function PrizeEditorPanel({
  t,
  prizes,
  unfinishedPrizes,
  totalWeight,
  enableQuantityLimit,
  enableAwardMode,
  awardTiers,
  selectedAwardId,
  saveSlots,
  onLoadTemplate,
  onExportTxt,
  onTriggerFileUpload,
  onResetCounts,
  onAddPrize,
  onUpdatePrize,
  onRemovePrize,
  onApplyBatchText,
  onShufflePrizes,
  onDeduplicatePrizes,
  onAddAwardTier,
  onUpdateAwardTier,
  onRemoveAwardTier,
  onSelectAwardId,
  onCloseAwardMode,
  onSaveSlot,
  onLoadSlot,
  onDeleteSlot,
}: PrizeEditorPanelProps) {
  const [editorTab, setEditorTab] = useState<'list' | 'batch'>('list');
  const [batchText, setBatchText] = useState<string>('');
  const [slotNameInput, setSlotNameInput] = useState<string>('');

  const templateSelectId = useId();
  const batchTextareaId = useId();
  const slotNameInputId = useId();

  const handleSwitchToBatch = () => {
    setBatchText(serializePrizesToText(prizes));
    setEditorTab('batch');
  };

  return (
    <div className="bg-surface-glass border border-border-glass rounded-2xl p-5 sm:p-7 flex flex-col gap-5 shadow-lg backdrop-blur-md min-w-0">
      {/* 尾牙雙抽模式：獎項池管理區 */}
      {enableAwardMode && (
        <div className="bg-select-bg border border-border-glass rounded-xl p-4 flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border-glass pb-2.5">
            <span className={`text-sm font-bold flex items-center gap-1.5 ${styles.accentText}`}>
              <svg viewBox="0 0 24 24" width={16} height={16} fill="currentColor" aria-hidden="true">
                <path d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94A5.01 5.01 0 0011 15.9V19H7v2h10v-2h-4v-3.1c2.2-.4 3.9-2.18 4.39-4.5A5.01 5.01 0 0021 8V7c0-1.1-.9-2-2-2zM5 8V7h2v3.82C5.84 10.4 5 9.3 5 8zm14 0c0 1.3-.84 2.4-2 2.82V7h2v1z" />
              </svg>
              {t.manageAwardsBtn} ({awardTiers.length})
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onAddAwardTier}
                className={`px-3 py-1 text-xs sm:text-sm font-bold rounded-lg cursor-pointer transition-all ${styles.primaryConfirmBtn}`}
              >
                {t.addAwardBtn}
              </button>
              <button
                type="button"
                onClick={onCloseAwardMode}
                className={`px-2.5 py-1 text-xs sm:text-sm font-semibold rounded-lg cursor-pointer transition-all ${styles.redTag}`}
              >
                ✕ {t.closeAwardModeBtn}
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-2 max-h-[210px] overflow-y-auto pr-1">
            {awardTiers.map((tier) => {
              const remain = Math.max(0, tier.quantity - tier.drawnCount);
              const isSelected = tier.id === selectedAwardId;
              const awardNameId = `award_name_${tier.id}`;
              const awardQtyId = `award_qty_${tier.id}`;
              return (
                <div
                  key={tier.id}
                  onClick={() => onSelectAwardId(tier.id)}
                  className={`flex flex-wrap items-center gap-2 p-2.5 rounded-xl border transition-all cursor-pointer min-w-0 ${
                    isSelected
                      ? 'border-[var(--theme-color)] bg-surface-glass shadow-sm'
                      : 'border-border-glass bg-surface-glass/40'
                  }`}
                >
                  <label htmlFor={awardNameId} className="sr-only">
                    {t.awardNamePlaceholder}
                  </label>
                  <input
                    id={awardNameId}
                    type="text"
                    value={tier.name}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => onUpdateAwardTier(tier.id, 'name', e.target.value)}
                    placeholder={t.awardNamePlaceholder}
                    className={`flex-1 min-w-[140px] px-3 py-1.5 rounded-lg text-sm outline-none ${styles.prizeInput}`}
                  />
                  <div className="flex items-center gap-1.5 text-sm font-medium text-text-sub" onClick={(e) => e.stopPropagation()}>
                    <label htmlFor={awardQtyId} className="text-xs sm:text-sm">
                      {t.awardQtyLabel}
                    </label>
                    <input
                      id={awardQtyId}
                      type="number"
                      min="1"
                      value={tier.quantity === 0 ? '' : tier.quantity}
                      onChange={(e) =>
                        onUpdateAwardTier(
                          tier.id,
                          'quantity',
                          e.target.value === '' ? 1 : Math.max(1, parseInt(e.target.value, 10) || 1)
                        )
                      }
                      className={`w-16 px-2 py-1 rounded-lg text-sm outline-none font-mono text-center ${styles.prizeInput}`}
                    />
                    <span
                      className={`text-xs font-mono font-bold px-2 py-0.5 rounded border ${
                        remain === 0 ? styles.redTag : styles.emeraldTag
                      }`}
                    >
                      {t.remainLabel} {remain}
                    </span>
                    <button
                      type="button"
                      aria-label={t.deleteLabel}
                      onClick={() => onRemoveAwardTier(tier.id)}
                      className={`text-xs px-2 py-1 rounded-lg transition-colors cursor-pointer ${styles.redTag}`}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 頂部標題與編輯模式切換 */}
      <div className="flex justify-between items-center flex-wrap gap-3 border-b border-border-glass pb-3.5">
        <div className="flex items-center gap-3 flex-wrap">
          <h3 className="text-sm font-semibold text-text-main flex items-center gap-2">
            <svg viewBox="0 0 24 24" width={16} height={16} fill="currentColor" className={styles.accentText}>
              <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />
            </svg>
            {t.prizesSettingsTitle} ({prizes.length})
          </h3>

          {/* 逐項設定 vs 快速貼上名單 */}
          <div className="flex bg-select-bg p-1 rounded-xl border border-border-glass">
            <button
              type="button"
              onClick={() => setEditorTab('list')}
              className={`px-3 py-1 text-xs sm:text-sm rounded-lg cursor-pointer transition-all font-semibold ${
                editorTab === 'list' ? styles.activeSegmentBtn : 'text-text-sub hover:text-text-main'
              }`}
            >
              {t.viewModeList}
            </button>
            <button
              type="button"
              onClick={handleSwitchToBatch}
              className={`px-3 py-1 text-xs sm:text-sm rounded-lg cursor-pointer transition-all font-semibold ${
                editorTab === 'batch' ? styles.activeSegmentBtn : 'text-text-sub hover:text-text-main'
              }`}
            >
              {t.viewModeBatch}
            </button>
          </div>
        </div>

        {/* 範例模板與檔案操作列 */}
        <div className="flex items-center gap-2 flex-wrap">
          <label htmlFor={templateSelectId} className="sr-only">
            {t.presetSelectDefault}
          </label>
          <select
            id={templateSelectId}
            defaultValue=""
            onChange={(e) => {
              onLoadTemplate(e.target.value);
              if (editorTab === 'batch') {
                setTimeout(() => setEditorTab('list'), 20);
              }
              e.target.selectedIndex = 0;
            }}
            className={`rounded-xl px-2.5 py-1.5 text-sm font-medium outline-none cursor-pointer ${styles.selectInput}`}
          >
            <option value="" disabled>
              {t.presetSelectDefault}
            </option>
            <option value="annual">{t.presetAnnual}</option>
            <option value="staff">{t.presetStaff}</option>
            <option value="lucky">{t.presetLucky}</option>
            <option value="punish">{t.presetPunish}</option>
            <option value="dinner">{t.presetDinner}</option>
            <option value="empty">{t.presetEmpty}</option>
          </select>

          <button
            type="button"
            onClick={onExportTxt}
            className="px-3 py-1.5 text-sm font-medium text-text-main bg-select-bg border border-border-glass rounded-xl hover:border-slate-400 transition-all cursor-pointer flex items-center gap-1 shadow-sm"
          >
            <svg viewBox="0 0 24 24" width={14} height={14} fill="currentColor" aria-hidden="true">
              <path d="M9 16h6v-6h4l-7-7-7 7h4v6zm-4 2h14v2H5v-2z" />
            </svg>
            {t.exportTxt}
          </button>
          <button
            type="button"
            onClick={onTriggerFileUpload}
            className="px-3 py-1.5 text-sm font-medium text-text-main bg-select-bg border border-border-glass rounded-xl hover:border-slate-400 transition-all cursor-pointer flex items-center gap-1 shadow-sm"
          >
            <svg viewBox="0 0 24 24" width={14} height={14} fill="currentColor" aria-hidden="true">
              <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
            </svg>
            {t.importTxt}
          </button>
          <button
            type="button"
            onClick={onResetCounts}
            className={`px-3 py-1.5 text-sm font-medium rounded-xl transition-all cursor-pointer flex items-center gap-1 ${styles.spinBtn}`}
          >
            <svg viewBox="0 0 24 24" width={14} height={14} fill="currentColor" aria-hidden="true">
              <path d="M17.65 6.35A7.958 7.958 0 0012 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" />
            </svg>
            {t.resetCount}
          </button>
          <button
            type="button"
            onClick={onAddPrize}
            className={`px-3 py-1.5 text-sm font-bold rounded-xl transition-all cursor-pointer shadow-sm ${styles.primaryConfirmBtn}`}
          >
            {t.addPrize}
          </button>
        </div>
      </div>

      {/* 快速整理工具列（隨機打亂 / 去除重複） */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={onShufflePrizes}
            className="px-3 py-1.5 text-xs sm:text-sm font-medium text-text-sub hover:text-text-main bg-select-bg border border-border-glass rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
          >
            <svg viewBox="0 0 24 24" width={14} height={14} fill="currentColor" aria-hidden="true">
              <path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z" />
            </svg>
            {t.shuffleListBtn}
          </button>
          <button
            type="button"
            onClick={onDeduplicatePrizes}
            className="px-3 py-1.5 text-xs sm:text-sm font-medium text-text-sub hover:text-text-main bg-select-bg border border-border-glass rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
          >
            <svg viewBox="0 0 24 24" width={14} height={14} fill="currentColor" aria-hidden="true">
              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
            </svg>
            {t.dedupListBtn}
          </button>
        </div>
      </div>

      {/* 主編輯區：快速批次貼上 vs 逐項卡片清單 */}
      {editorTab === 'batch' ? (
        <div className="flex flex-col gap-3">
          <label htmlFor={batchTextareaId} className="text-sm font-medium text-text-sub">
            {t.batchTextareaLabel}
          </label>
          <textarea
            id={batchTextareaId}
            rows={10}
            value={batchText}
            onChange={(e) => setBatchText(e.target.value)}
            placeholder={t.batchTextareaPlaceholder}
            className={`w-full p-3.5 rounded-xl text-sm font-mono outline-none resize-y ${styles.prizeInput}`}
          />
          <button
            type="button"
            onClick={() => {
              onApplyBatchText(batchText);
              setEditorTab('list');
            }}
            className={`w-full py-2.5 text-sm font-bold rounded-xl cursor-pointer transition-all shadow-md ${styles.primaryConfirmBtn}`}
          >
            {t.applyBatchBtn}
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5 max-h-[480px] overflow-y-auto pr-1">
          {prizes.map((p) => {
            const isUnfinished = unfinishedPrizes.some((item) => item.id === p.id);
            const ratioStr =
              isUnfinished && totalWeight > 0 ? ((p.weight / totalWeight) * 100).toFixed(1) + '%' : '0.0%';
            const remain = Math.max(0, p.quantity - p.drawnCount);
            const isZero = remain === 0;

            const colorInputId = `p_color_${p.id}`;
            const titleInputId = `p_title_${p.id}`;
            const weightInputId = `p_weight_${p.id}`;
            const qtyInputId = `p_qty_${p.id}`;
            const finishCheckId = `p_finish_${p.id}`;

            return (
              <div
                key={p.id}
                className={`flex items-center gap-2.5 bg-select-bg p-3 rounded-xl border border-border-glass flex-wrap shadow-sm min-w-0 ${
                  p.isFinished ? styles.prizeFinished : ''
                }`}
              >
                {/* 顏色選擇 */}
                <label htmlFor={colorInputId} className="sr-only">
                  {t.prizesSettingsTitle}
                </label>
                <input
                  id={colorInputId}
                  type="color"
                  value={p.color}
                  onChange={(e) => onUpdatePrize(p.id, 'color', e.target.value)}
                  className="w-7 h-7 rounded border-none cursor-pointer bg-transparent shrink-0"
                />

                {/* 獎項名稱 (14px text-sm 防 iOS 放大) */}
                <label htmlFor={titleInputId} className="sr-only">
                  {t.prizeTitlePlaceholder}
                </label>
                <input
                  id={titleInputId}
                  type="text"
                  value={p.title}
                  onChange={(e) => onUpdatePrize(p.id, 'title', e.target.value)}
                  placeholder={t.prizeTitlePlaceholder}
                  className={`flex-1 min-w-[140px] px-3 py-1.5 rounded-lg text-sm outline-none ${styles.prizeInput}`}
                />

                {/* 權重與機率 */}
                <div className="flex items-center gap-1.5 text-sm font-medium text-text-sub">
                  <label htmlFor={weightInputId} className="text-xs sm:text-sm">
                    {t.weightLabel}
                  </label>
                  <input
                    id={weightInputId}
                    type="number"
                    min="0"
                    value={p.weight === 0 ? '' : p.weight}
                    onChange={(e) =>
                      onUpdatePrize(
                        p.id,
                        'weight',
                        e.target.value === '' ? 0 : Math.max(0, parseInt(e.target.value, 10) || 0)
                      )
                    }
                    className={`w-14 px-2 py-1 rounded-lg text-sm outline-none font-mono text-center ${styles.prizeInput}`}
                  />
                  <span className={`font-mono text-xs px-1.5 py-0.5 rounded font-bold ${styles.skyTag}`}>
                    {ratioStr}
                  </span>
                </div>

                {/* 數量上限 */}
                {enableQuantityLimit ? (
                  <div className="flex items-center gap-1.5 text-sm font-medium text-text-sub">
                    <label htmlFor={qtyInputId} className="text-xs sm:text-sm">
                      {t.qtyLabel}
                    </label>
                    <input
                      id={qtyInputId}
                      type="number"
                      min="1"
                      value={p.quantity === 0 ? '' : p.quantity}
                      onChange={(e) =>
                        onUpdatePrize(
                          p.id,
                          'quantity',
                          e.target.value === '' ? 1 : Math.max(1, parseInt(e.target.value, 10) || 1)
                        )
                      }
                      className={`w-14 px-2 py-1 rounded-lg text-sm outline-none font-mono text-center ${styles.prizeInput}`}
                    />
                    <span
                      className={`text-xs font-mono font-bold px-1.5 py-0.5 rounded border ${
                        isZero ? styles.redTag : styles.emeraldTag
                      }`}
                    >
                      {remain > 0 ? `${t.remainLabel} ${remain}` : t.drawnDoneLabel}
                    </span>
                  </div>
                ) : (
                  <span className={`text-xs font-bold px-2 py-0.5 rounded ${styles.skyTag}`} title={t.unlimitedLabel}>
                    ∞
                  </span>
                )}

                <div className="flex items-center gap-2 ml-auto">
                  <label
                    htmlFor={finishCheckId}
                    className="flex items-center gap-1 text-xs sm:text-sm font-medium text-text-sub cursor-pointer"
                  >
                    <input
                      id={finishCheckId}
                      type="checkbox"
                      checked={Boolean(p.isFinished)}
                      onChange={(e) => onUpdatePrize(p.id, 'isFinished', e.target.checked)}
                      className="w-3.5 h-3.5 rounded cursor-pointer accent-amber-500"
                    />
                    {t.isFinishedLabel}
                  </label>
                  <button
                    type="button"
                    aria-label={t.deleteLabel}
                    onClick={() => onRemovePrize(p.id)}
                    className={`text-xs px-2 py-1 rounded-lg transition-colors cursor-pointer ${styles.redTag}`}
                    title={t.deleteLabel}
                  >
                    ✕
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 底部：多組本地存檔槽 (Save Slots) */}
      <div className="border-t border-border-glass pt-4 flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <label htmlFor={slotNameInputId} className="text-xs sm:text-sm font-semibold text-text-sub shrink-0">
            {t.saveSlotsTitle}
          </label>
          <input
            id={slotNameInputId}
            type="text"
            value={slotNameInput}
            onChange={(e) => setSlotNameInput(e.target.value)}
            placeholder={t.saveSlotPlaceholder}
            className={`flex-1 min-w-[160px] px-3 py-1.5 rounded-xl text-sm outline-none ${styles.prizeInput}`}
          />
          <button
            type="button"
            onClick={() => {
              onSaveSlot(slotNameInput);
              setSlotNameInput('');
            }}
            className={`px-3.5 py-1.5 text-xs sm:text-sm font-bold rounded-xl cursor-pointer transition-all ${styles.spinBtn}`}
          >
            {t.saveCurrentSlotBtn}
          </button>
        </div>

        {saveSlots.length === 0 ? (
          <span className="text-xs text-text-sub">{t.noSavedSlots}</span>
        ) : (
          <div className="flex flex-wrap gap-2">
            {saveSlots.map((slot) => (
              <div
                key={slot.id}
                className="flex items-center gap-1.5 bg-select-bg border border-border-glass rounded-xl px-3 py-1.5 text-xs sm:text-sm"
              >
                <span className="font-semibold text-text-main truncate max-w-[140px]">{slot.name}</span>
                <span className="text-xs text-text-sub font-mono">({slot.prizes.length})</span>
                <button
                  type="button"
                  onClick={() => onLoadSlot(slot)}
                  className={`px-2 py-0.5 text-xs font-bold rounded-lg cursor-pointer ${styles.skyTag}`}
                >
                  {t.loadSlotBtn}
                </button>
                <button
                  type="button"
                  aria-label={t.deleteSlotBtn}
                  onClick={() => onDeleteSlot(slot.id)}
                  className={`px-1.5 py-0.5 text-xs font-bold rounded-lg cursor-pointer ${styles.redTag}`}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
