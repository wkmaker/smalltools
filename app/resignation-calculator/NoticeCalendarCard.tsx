'use client';

import React from 'react';
import styles from './resignation-calculator.module.css';
import type { NoticeCalendarDay } from './engine';
import type { ResignationTranslations } from './translations';

interface Props {
  lang: 'zh-TW' | 'en';
  t: ResignationTranslations;
  calendarDays: NoticeCalendarDay[];
  hasCustomLeaveSelection: boolean;
  onToggleDate: (dateStr: string) => void;
  onResetCustomLeave: () => void;
}

export default function NoticeCalendarCard({
  lang,
  t,
  calendarDays,
  hasCustomLeaveSelection,
  onToggleDate,
  onResetCustomLeave,
}: Props) {
  const firstDayDow = calendarDays.length > 0 ? calendarDays[0].dayOfWeek : 0;
  const leadingBlanks = Array.from({ length: firstDayDow }, (_, idx) => idx);

  if (calendarDays.length === 0) return null;

  return (
    <div className={`${styles.glassCard} flex flex-col justify-between`}>
      <div>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
          <h3 className="text-base font-bold text-text-main flex items-center gap-2">
            <svg
              viewBox="0 0 24 24"
              width={20}
              height={20}
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              className={styles.accentText}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <span>{t.calendarTitle}</span>
          </h3>

          {hasCustomLeaveSelection && (
            <div className="flex items-center gap-2">
              <span className={`text-xs font-semibold ${styles.accentText}`}>
                {t.calendarCustomActiveHint}
              </span>
              <button
                type="button"
                onClick={onResetCustomLeave}
                className={styles.secondaryBtn}
              >
                {t.calendarResetBtn}
              </button>
            </div>
          )}
        </div>

        <p className="text-xs text-text-sub mb-3 leading-relaxed">
          {t.calendarSubtitle}
        </p>

        {/* 圖例 Legend */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-text-sub mb-3">
          <span className="inline-flex items-center gap-1.5">
            <span className={`w-3 h-3 rounded ${styles.cellNotice} inline-block`} />
            {t.legendNotice}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-select-bg border border-border-glass inline-block" />
            {t.legendWork}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className={`w-3 h-3 rounded ${styles.cellLeave} inline-block`} />
            {t.legendAnnualLeave}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className={`w-3 h-3 rounded ${styles.cellHoliday} inline-block`} />
            {t.legendHoliday}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className={`w-3 h-3 rounded ${styles.cellWeekend} inline-block`} />
            {t.legendWeekend}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span
              className={`w-3 h-3 rounded bg-select-bg ${styles.cellLastOfficeRing} inline-block`}
            />
            {t.legendLastOffice}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className={`w-3 h-3 rounded ${styles.cellEffective} inline-block`} />
            {t.legendEffective}
          </span>
        </div>

        {/* 星期標頭 */}
        <div className={`${styles.calendarGrid} mb-1`}>
          {t.weekdaysShort.map((wd) => (
            <div
              key={wd}
              className="text-center text-xs font-semibold text-text-sub py-1"
            >
              {wd}
            </div>
          ))}
        </div>

        {/* 月曆格 */}
        <div className={styles.calendarGrid}>
          {leadingBlanks.map((idx) => (
            <div key={`blank-${idx}`} className="min-h-[3.5rem]" />
          ))}

          {calendarDays.map((day) => {
            const mmdd = day.dateStr.slice(5).replace('-', '/');
            const holidayTitle =
              lang === 'zh-TW' ? day.holidayNameZh : day.holidayNameEn;

            let statusClass = '';
            if (day.status === 'notice') statusClass = styles.cellNotice;
            else if (day.status === 'annualLeave') statusClass = styles.cellLeave;
            else if (day.status === 'holiday') statusClass = styles.cellHoliday;
            else if (day.status === 'weekend') statusClass = styles.cellWeekend;
            else if (day.status === 'effective') statusClass = styles.cellEffective;

            const ringClass = day.isActualOfficeDate ? styles.cellLastOfficeRing : '';

            let tagLabel = '';
            if (day.isEffectiveDate) {
              tagLabel = t.legendEffective;
            } else if (day.isNoticeDate && day.status === 'notice') {
              tagLabel = t.legendNotice;
            } else if (day.status === 'annualLeave') {
              tagLabel = day.isLastWorkingDate
                ? `${t.legendAnnualLeave}/${t.lastWorkingDay}`
                : t.legendAnnualLeave;
            } else if (day.isLastWorkingDate && day.isActualOfficeDate) {
              tagLabel = `${t.legendLastOffice}/${t.lastWorkingDay}`;
            } else if (day.isActualOfficeDate) {
              tagLabel = t.legendLastOffice;
            } else if (day.isLastWorkingDate) {
              tagLabel = holidayTitle
                ? `${holidayTitle}/${t.lastWorkingDay}`
                : t.lastWorkingDay;
            } else if (holidayTitle) {
              tagLabel = holidayTitle;
            }

            if (day.canToggleLeave) {
              return (
                <button
                  key={day.dateStr}
                  type="button"
                  onClick={() => onToggleDate(day.dateStr)}
                  aria-label={`${day.dateStr} ${tagLabel || t.legendWork}`}
                  className={`${styles.calendarCell} ${styles.calendarCellClickable} ${statusClass} ${ringClass}`}
                >
                  <span className="text-xs font-mono font-bold truncate w-full">
                    {mmdd}
                  </span>
                  <span className="text-xs truncate w-full opacity-90">
                    {tagLabel || t.legendWork}
                  </span>
                </button>
              );
            }

            return (
              <div
                key={day.dateStr}
                className={`${styles.calendarCell} ${statusClass} ${ringClass}`}
              >
                <span className="text-xs font-mono font-bold truncate w-full">
                  {mmdd}
                </span>
                <span className="text-xs truncate w-full opacity-85">
                  {tagLabel || (day.isWeekend ? t.legendWeekend : t.legendWork)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
