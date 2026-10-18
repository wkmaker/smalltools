import React from 'react';
import styles from '../resignation-calculator.module.css';
import { formatDateFriendly } from '../engine';

interface ResignationMilestonesCardsProps {
  t: any;
  lang: 'zh-TW' | 'en';
  requiredNoticeDays: number;
  tenureText: string;
  actualOfficeDate: Date;
  actualTakeLeaveDays: number;
  calculatedLastWorkingD: Date;
  effectiveDate: Date;
  calcDirection: 'noticeToLast' | 'lastToNotice';
  isDateInPast: (d: Date) => boolean;
}

export default function ResignationMilestonesCards({
  t,
  lang,
  requiredNoticeDays,
  tenureText,
  actualOfficeDate,
  actualTakeLeaveDays,
  calculatedLastWorkingD,
  effectiveDate,
  calcDirection,
  isDateInPast,
}: ResignationMilestonesCardsProps) {
  return (
    <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
      {/* 1. 法定預告期 & 年資 */}
      <div className={styles.statCard}>
        <div>
          <div className="text-sm font-semibold text-text-sub mb-1">{t.legalNoticeDays}</div>
          <div className={`text-2xl font-extrabold ${styles.accentText}`}>
            {requiredNoticeDays}{' '}
            <span className="text-sm font-normal text-text-sub">{t.daysUnit}</span>
          </div>
        </div>
        <div className="text-xs text-text-sub mt-2 truncate" title={tenureText}>
          {t.tenure}: {tenureText}
        </div>
      </div>

      {/* 2. 實際最後出勤日（高亮主卡） */}
      <div className={`${styles.statCard} ${styles.statCardHighlight}`}>
        <div>
          <div className="text-sm font-semibold text-text-sub mb-1">{t.actualOfficeDay}</div>
          <div className={`text-base sm:text-lg font-bold font-mono truncate ${isDateInPast(actualOfficeDate) ? 'text-red-500' : styles.accentText}`}>
            {formatDateFriendly(actualOfficeDate, lang)}
          </div>
        </div>
        <div className="text-xs text-text-sub mt-2 truncate">
          {actualTakeLeaveDays > 0
            ? `${t.leaveDaysCount}: ${actualTakeLeaveDays} ${t.leaveDaysCountUnit}`
            : t.lastWorkingDay}
        </div>
      </div>

      {/* 3. 契約最後在職日 */}
      <div className={styles.statCard}>
        <div>
          <div className="text-sm font-semibold text-text-sub mb-1">{t.lastWorkingDay}</div>
          <div className={`text-base sm:text-lg font-bold truncate font-mono ${isDateInPast(calculatedLastWorkingD) ? 'text-red-500' : 'text-text-main'}`}>
            {formatDateFriendly(calculatedLastWorkingD, lang)}
          </div>
        </div>
        <div className="text-xs text-text-sub mt-2 truncate">
          {calcDirection === 'noticeToLast'
            ? t.calcLastWorkingDayNote
            : t.targetLastWorkingDayNote}
        </div>
      </div>

      {/* 4. 離職生效日（退保日） */}
      <div className={styles.statCard}>
        <div>
          <div className="text-sm font-semibold text-text-sub mb-1">{t.effectiveDate}</div>
          <div className={`text-base sm:text-lg font-bold truncate font-mono ${isDateInPast(effectiveDate) ? 'text-red-500' : 'text-text-main'}`}>
            {formatDateFriendly(effectiveDate, lang)}
          </div>
        </div>
        <div className="text-xs text-text-sub mt-2 truncate">{t.effectiveDateNote}</div>
      </div>
    </div>
  );
}
