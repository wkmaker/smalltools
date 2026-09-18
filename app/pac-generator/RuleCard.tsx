'use client';

import React from 'react';
import styles from './pac-generator.module.css';
import { ConditionType, ProxyNode, RoutingRule, RuleCondition } from './types';
import { formatProxyString, validateRuleValue } from './engine';
import type { PacGeneratorTranslation } from './translations';

// 比對條件類型下拉選單共用選項（主要條件與 AND 疊加條件皆使用同一份清單）
const CONDITION_TYPE_OPTIONS: ConditionType[] = [
  'domainSuffix',
  'plainHost',
  'domainExact',
  'wildcardHost',
  'wildcardUrl',
  'ipv4Cidr',
  'ipv6Cidr',
  'clientIpv4',
  'clientIpv6',
  'protocol',
  'port',
  'weekday',
  'timeRange',
  'regex',
];

interface RuleCardProps {
  rule: RoutingRule;
  idx: number;
  rulesLength: number;
  t: PacGeneratorTranslation;
  isEn: boolean;
  proxies: ProxyNode[];
  draggedRuleIndex: number | null;
  dropTargetIndex: number | null;
  setDraggedRuleIndex: (v: number | null) => void;
  setDropTargetIndex: (v: number | null) => void;
  onReorder: (fromIdx: number, toIdx: number) => void;
  onDropAtIndex: (targetIndex: number) => void;
  onUpdateRule: (id: string, updates: Partial<RoutingRule>) => void;
  onDeleteRule: (id: string) => void;
  onAddAndCondition: (ruleId: string) => void;
  onUpdateAndCondition: (ruleId: string, index: number, updates: Partial<RuleCondition>) => void;
  onRemoveAndCondition: (ruleId: string, index: number) => void;
}

/**
 * 單一分流規則卡片（含拖曳排序、AND 疊加條件）。抽成獨立 React.memo 元件，
 * 讓編輯某一條規則時只重新渲染該卡片本身，不會連帶重新渲染並重跑其餘所有
 * 規則卡片的 validateRuleValue 語法檢查（原本整份規則清單塞在單一元件內，
 * 任何一個欄位打字都會讓全部規則卡片一起重算、重繪）。
 */
function RuleCard({
  rule,
  idx,
  rulesLength,
  t,
  isEn,
  proxies,
  draggedRuleIndex,
  dropTargetIndex,
  setDraggedRuleIndex,
  setDropTargetIndex,
  onReorder,
  onDropAtIndex,
  onUpdateRule,
  onDeleteRule,
  onAddAndCondition,
  onUpdateAndCondition,
  onRemoveAndCondition,
}: RuleCardProps) {
  const validation = validateRuleValue(rule.conditionType, rule.value);
  const validationMsg = isEn ? validation.messageEn : validation.messageZh;

  const showDropAbove =
    draggedRuleIndex !== null &&
    dropTargetIndex === idx &&
    draggedRuleIndex !== idx &&
    draggedRuleIndex !== idx - 1;

  const showDropBelow =
    idx === rulesLength - 1 &&
    draggedRuleIndex !== null &&
    dropTargetIndex === rulesLength &&
    draggedRuleIndex !== rulesLength - 1;

  return (
    <React.Fragment>
      {showDropAbove && (
        <div className={styles.dropIndicator} aria-hidden="true">
          <div className={styles.dropIndicatorBadge}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
            </svg>
            <span>{isEn ? `Drop to insert at #${idx + 1}` : `放開以移至第 ${idx + 1} 位`}</span>
          </div>
        </div>
      )}

      <div
        draggable={true}
        onDragStart={(e) => {
          setDraggedRuleIndex(idx);
          setDropTargetIndex(null);
          e.dataTransfer.effectAllowed = 'move';
        }}
        onDragOver={(e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = 'move';
          const rect = e.currentTarget.getBoundingClientRect();
          const midY = rect.top + rect.height / 2;
          const targetPos = e.clientY < midY ? idx : idx + 1;
          if (dropTargetIndex !== targetPos) {
            setDropTargetIndex(targetPos);
          }
        }}
        onDrop={(e) => {
          e.preventDefault();
          if (dropTargetIndex !== null) {
            onDropAtIndex(dropTargetIndex);
          } else if (draggedRuleIndex !== null && draggedRuleIndex !== idx) {
            onReorder(draggedRuleIndex, idx);
            setDraggedRuleIndex(null);
            setDropTargetIndex(null);
          }
        }}
        onDragEnd={() => {
          setDraggedRuleIndex(null);
          setDropTargetIndex(null);
        }}
        className={`${styles.ruleCard} ${!rule.enabled ? styles.ruleCardDisabled : ''} ${
          draggedRuleIndex === idx ? styles.ruleCardDragging : ''
        }`}
      >
        {/* 上排：拖曳手柄、規則編號、名稱、開關與刪除 */}
        <div className="flex items-center justify-between gap-3 min-w-0">
          <div className="flex-1 flex items-center gap-2 min-w-0">
            <div
              className={styles.dragHandle}
              title={isEn ? 'Drag to reorder' : '按住拖曳以調整順序'}
              aria-label={isEn ? 'Drag to reorder' : '按住拖曳以調整順序'}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M9 3H7v2h2V3zm4 0h-2v2h2V3zm4 0h-2v2h2V3zM9 7H7v2h2V7zm4 0h-2v2h2V7zm4 0h-2v2h2V7zm-8 4H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2zm-8 4H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2zm-8 4H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2z" />
              </svg>
            </div>
            <span className="shrink-0 text-xs font-mono font-semibold text-text-sub px-2 py-0.5 rounded bg-white/5 border border-white/10">
              #{idx + 1}
            </span>
            <input
              type="text"
              value={rule.name}
              onChange={(e) => onUpdateRule(rule.id, { name: e.target.value })}
              placeholder={t.ruleName}
              className="flex-1 min-w-0 text-sm font-medium bg-transparent border-b border-white/10 px-2 py-1 text-text-main focus:outline-none focus:border-[var(--theme-color)] transition-colors"
            />
          </div>

          <div className="shrink-0 flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => onUpdateRule(rule.id, { enabled: !rule.enabled })}
              className={`text-xs px-2.5 py-1 rounded border transition-colors ${
                rule.enabled ? styles.ruleToggleActive : styles.ruleToggleInactive
              }`}
            >
              {rule.enabled ? t.enable : t.disable}
            </button>
            <button
              type="button"
              onClick={() => onDeleteRule(rule.id)}
              aria-label={`${t.delete} ${rule.name}`}
              className="p-1 text-text-sub hover:text-red-400 transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
              </svg>
            </button>
          </div>
        </div>

        {/* 中排：條件型態、值、目標動作 */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <div>
            <label className="sr-only">{t.conditionType}</label>
            <select
              value={rule.conditionType}
              onChange={(e) =>
                onUpdateRule(rule.id, { conditionType: e.target.value as ConditionType })
              }
              className="w-full text-sm bg-select-bg border border-white/10 rounded-lg px-3 py-2 text-text-main focus:outline-none focus:border-[var(--theme-color)]"
            >
              {CONDITION_TYPE_OPTIONS.map((ct) => (
                <option key={ct} value={ct}>{t.conditionTypes[ct]}</option>
              ))}
            </select>
          </div>

          <div>
            {rule.conditionType !== 'plainHost' ? (
              <textarea
                rows={rule.value.includes('\n') ? Math.min(Math.max(rule.value.split('\n').length, 2), 6) : 1}
                value={rule.value}
                onChange={(e) => onUpdateRule(rule.id, { value: e.target.value })}
                placeholder={t.conditionPlaceholders[rule.conditionType] || t.matchValue}
                className={`w-full text-sm rounded-lg px-3 py-2 text-text-main focus:outline-none transition-colors font-mono resize-y placeholder:text-text-sub/50 ${
                  !validation.isValid ? styles.inputWarning : styles.fieldInput
                }`}
              />
            ) : (
              <div className="text-xs text-text-sub px-3 py-2.5 italic border border-dashed border-white/10 rounded-lg truncate" title={t.conditionPlaceholders.plainHost}>
                {t.conditionPlaceholders.plainHost}
              </div>
            )}
          </div>

          <div>
            <label className="sr-only">{t.targetAction}</label>
            <select
              value={rule.targetProxy}
              onChange={(e) => onUpdateRule(rule.id, { targetProxy: e.target.value })}
              className="w-full text-sm bg-select-bg border border-white/10 rounded-lg px-3 py-2 text-text-main focus:outline-none focus:border-[var(--theme-color)]"
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

        {/* AND 疊加條件：需與主要條件同時成立才命中（如「協定為 https」且「網域為 x」） */}
        {((rule.andConditions?.length ?? 0) > 0) && (
          <div className={styles.andConditionsBlock}>
            {rule.andConditions!.map((cond, condIdx) => {
              const condValidation = validateRuleValue(cond.conditionType, cond.value);
              const condMsg = isEn ? condValidation.messageEn : condValidation.messageZh;
              return (
                <div key={condIdx} className={styles.andConditionRow}>
                  <span className={styles.andConditionBadge}>{t.andConditionBadge}</span>
                  <select
                    value={cond.conditionType}
                    onChange={(e) =>
                      onUpdateAndCondition(rule.id, condIdx, { conditionType: e.target.value as ConditionType })
                    }
                    className="text-sm bg-select-bg border border-white/10 rounded-lg px-3 py-2 text-text-main focus:outline-none focus:border-[var(--theme-color)]"
                  >
                    {CONDITION_TYPE_OPTIONS.map((ct) => (
                      <option key={ct} value={ct}>{t.conditionTypes[ct]}</option>
                    ))}
                  </select>
                  {cond.conditionType !== 'plainHost' ? (
                    <input
                      type="text"
                      value={cond.value}
                      onChange={(e) => onUpdateAndCondition(rule.id, condIdx, { value: e.target.value })}
                      placeholder={t.conditionPlaceholders[cond.conditionType] || t.matchValue}
                      className={`flex-1 min-w-0 text-sm rounded-lg px-3 py-2 text-text-main focus:outline-none transition-colors font-mono placeholder:text-text-sub/50 ${
                        !condValidation.isValid ? styles.inputWarning : styles.fieldInput
                      }`}
                    />
                  ) : (
                    <div className="flex-1 min-w-0 text-xs text-text-sub px-3 py-2.5 italic truncate">
                      {t.conditionPlaceholders.plainHost}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => onRemoveAndCondition(rule.id, condIdx)}
                    aria-label={`${t.delete} AND #${condIdx + 1}`}
                    className="p-1 text-text-sub hover:text-red-400 transition-colors"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                    </svg>
                  </button>
                  {!condValidation.isValid && condMsg && (
                    <span className={styles.ruleWarningText}>{condMsg}</span>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => onAddAndCondition(rule.id)}
            className={styles.addAndConditionBtn}
          >
            {t.addAndConditionBtn}
          </button>
          {(rule.andConditions?.length ?? 0) > 0 && (
            <span className="text-xs text-text-sub">{t.andConditionHint}</span>
          )}
        </div>

        {/* 卡片底端通欄：即時語法告警 或 溫和輔助提示 */}
        {!validation.isValid && validationMsg ? (
          <div className={styles.ruleWarningBar} role="alert">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="currentColor"
              className={styles.ruleWarningIcon}
              aria-hidden="true"
            >
              <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" />
            </svg>
            <span className={styles.ruleWarningText}>{validationMsg}</span>
          </div>
        ) : rule.conditionType !== 'plainHost' ? (
          <div className={styles.ruleInfoBar}>
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="currentColor"
              className={styles.ruleInfoIcon}
              aria-hidden="true"
            >
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
            </svg>
            <span className={styles.ruleInfoText}>{t.multiValueHint}</span>
          </div>
        ) : null}
      </div>

      {showDropBelow && (
        <div className={styles.dropIndicator} aria-hidden="true">
          <div className={styles.dropIndicatorBadge}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
            </svg>
            <span>{isEn ? `Drop to insert at #${rulesLength}` : `放開以移至第 ${rulesLength} 位`}</span>
          </div>
        </div>
      )}
    </React.Fragment>
  );
}

export default React.memo(RuleCard);
