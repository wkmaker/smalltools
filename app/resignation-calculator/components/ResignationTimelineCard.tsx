import React from 'react';
import styles from '../resignation-calculator.module.css';
import { formatDateFriendly, isWeekend } from '../engine';

interface ResignationTimelineCardProps {
  t: any;
  lang: 'zh-TW' | 'en';
  calculatedNoticeD: Date;
  noticeStartDate: Date;
  calculatedLastWorkingD: Date;
  actualOfficeDate: Date;
  effectiveDate: Date;
  leaveStartDate: Date | null;
  leaveEndDate: Date | null;
  actualTakeLeaveDays: number;
  annualLeaveDays: number | '';
  excessPayoutLeaveDays: number;
  calcDirection: 'noticeToLast' | 'lastToNotice';
  resignationType: 'voluntary' | 'involuntary';
  requiredNoticeDays: number;
  maxTakeableLeaveDays: number;
  maxJobSeekingLeaveDays: number;
  officeDayMode: 'autoLeaveEnd' | 'lastWorkingDay' | 'custom';
  isDateInPast: (d: Date) => boolean;
}

export default function ResignationTimelineCard({
  t,
  lang,
  calculatedNoticeD,
  noticeStartDate,
  calculatedLastWorkingD,
  actualOfficeDate,
  effectiveDate,
  leaveStartDate,
  leaveEndDate,
  actualTakeLeaveDays,
  annualLeaveDays,
  excessPayoutLeaveDays,
  calcDirection,
  resignationType,
  requiredNoticeDays,
  maxTakeableLeaveDays,
  maxJobSeekingLeaveDays,
  officeDayMode,
  isDateInPast,
}: ResignationTimelineCardProps) {
  return (
    <div className={styles.glassCard}>
      <h3 className={styles.cardTitle}>
        <svg viewBox="0 0 24 24" width={20} height={20} fill="none" stroke="currentColor" strokeWidth={2} className={styles.accentText}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>{t.timelineTitle}</span>
      </h3>

      <div className={styles.timeline}>
        {/* 1. 提出離職 */}
        {(() => {
          const isPast = isDateInPast(calculatedNoticeD);
          return (
            <div className={styles.timelineItem}>
              <div className={`${styles.timelineNode} ${isPast ? styles.timelineNodeRed : styles.timelineNodeActive}`}>
                {isPast ? '!' : '✓'}
              </div>
              <div className={styles.timelineLabel}>{t.noticeGivenNode}</div>
              <div className={`${styles.timelineDate} ${isPast ? styles.timelineDateRed : styles.accentText}`}>
                {formatDateFriendly(calculatedNoticeD, lang)} {isPast ? t.nodePastTag : ''}
              </div>
              <div className={styles.timelineDesc}>
                {calcDirection === 'noticeToLast'
                  ? t.noticeGivenDescForward
                  : t.noticeGivenDescBackward}
              </div>
            </div>
          );
        })()}

        {/* 2. 預告期開始 */}
        {(() => {
          const isPast = isDateInPast(noticeStartDate);
          return (
            <div className={styles.timelineItem}>
              <div className={`${styles.timelineNode} ${isPast ? styles.timelineNodeRed : ''}`}>
                {isPast ? '!' : '1'}
              </div>
              <div className={styles.timelineLabel}>{t.noticeStartNode}</div>
              <div className={`${styles.timelineDate} ${isPast ? styles.timelineDateRed : ''}`}>
                {formatDateFriendly(noticeStartDate, lang)} {isPast ? t.nodePastTag : ''}
              </div>
              <div className={styles.timelineDesc}>{t.noticeStartDesc}</div>
            </div>
          );
        })()}

        {/* 2.5 資遣謀職假得請假期間 */}
        {resignationType === 'involuntary' && requiredNoticeDays > 0 && (() => {
          const isPast = isDateInPast(calculatedLastWorkingD);
          const isFullLeaveTaken = actualTakeLeaveDays >= maxTakeableLeaveDays && maxTakeableLeaveDays > 0;
          return (
            <div className={styles.timelineItem}>
              <div className={`${styles.timelineNode} ${isPast ? styles.timelineNodeRed : styles.timelineNodeActive}`}>
                {isPast ? '!' : '✓'}
              </div>
              <div className={styles.timelineLabel}>
                {t.jobSeekingLeavePeriodNode} ({maxJobSeekingLeaveDays} {t.paidDaysUnit})
              </div>
              <div className={`${styles.timelineDate} ${isPast ? styles.timelineDateRed : styles.accentText}`}>
                {formatDateFriendly(noticeStartDate, lang)} ~ {formatDateFriendly(calculatedLastWorkingD, lang)}
              </div>
              <div className={styles.timelineDesc}>
                <div>{t.jobSeekingLeaveTimelineDesc}</div>
                {isFullLeaveTaken && (
                  <div className={`mt-1 text-xs ${styles.accentText} font-medium`}>
                    {t.jobSeekingFullLeaveNote}
                  </div>
                )}
              </div>
            </div>
          );
        })()}

        {/* 3 & 4. 依實際發生時間順序排列「特休排休期間」與「最後一天到辦公室出勤」 */}
        {(() => {
          const hasLeaveNode =
            annualLeaveDays !== '' &&
            actualTakeLeaveDays > 0 &&
            leaveStartDate !== null &&
            leaveEndDate !== null;

          const leaveNodeEl = hasLeaveNode ? (() => {
            const isPast = isDateInPast(leaveEndDate);
            return (
              <div key="leave-node" className={styles.timelineItem}>
                <div className={`${styles.timelineNode} ${isPast ? styles.timelineNodeRed : styles.timelineNodeActive}`}>
                  {isPast ? '!' : '✓'}
                </div>
                <div className={styles.timelineLabel}>
                  {t.leavePeriodNode} ({actualTakeLeaveDays} {t.leaveDaysCountUnit})
                </div>
                <div className={`${styles.timelineDate} ${isPast ? styles.timelineDateRed : ''}`}>
                  {formatDateFriendly(leaveStartDate, lang)} ~ {formatDateFriendly(leaveEndDate, lang)}
                </div>
                <div className={styles.timelineDesc}>
                  {`${t.leavePayoutEstimate}: ${excessPayoutLeaveDays} ${t.payoutDaysSuffix}`}
                </div>
              </div>
            );
          })() : null;

          const officeNodeEl = (() => {
            const isPast = isDateInPast(actualOfficeDate);
            const isWeekendOffice = isWeekend(actualOfficeDate);
            return (
              <div key="office-node" className={styles.timelineItem}>
                <div className={`${styles.timelineNode} ${isPast ? styles.timelineNodeRed : styles.timelineNodeActive}`}>
                  {isPast ? '!' : '✓'}
                </div>
                <div className={styles.timelineLabel}>
                  {t.actualOfficeNode}
                  {isWeekendOffice && (
                    <span className="text-xs text-amber-500 ml-1.5 font-normal">
                      ({t.weekendTag})
                    </span>
                  )}
                </div>
                <div className={`${styles.timelineDate} ${isPast ? styles.timelineDateRed : styles.accentText}`}>
                  {formatDateFriendly(actualOfficeDate, lang)} {isPast ? t.nodePastTag : ''}
                </div>
                <div className={styles.timelineDesc}>
                  {officeDayMode === 'autoLeaveEnd'
                    ? t.actualOfficeDescAuto
                    : officeDayMode === 'lastWorkingDay'
                    ? t.actualOfficeDescSpread
                    : t.actualOfficeDescCustom}
                </div>
              </div>
            );
          })();

          if (!leaveNodeEl || !leaveStartDate) return officeNodeEl;
          const leaveBeforeOffice =
            leaveStartDate.getTime() < actualOfficeDate.getTime();
          return leaveBeforeOffice
            ? [leaveNodeEl, officeNodeEl]
            : [officeNodeEl, leaveNodeEl];
        })()}

        {/* 5. 契約最後在職日 */}
        {(() => {
          const isPast = isDateInPast(calculatedLastWorkingD);
          return (
            <div className={styles.timelineItem}>
              <div className={`${styles.timelineNode} ${isPast ? styles.timelineNodeRed : ''}`}>
                {isPast ? '!' : '2'}
              </div>
              <div className={styles.timelineLabel}>{t.lastWorkingNode}</div>
              <div className={`${styles.timelineDate} ${isPast ? styles.timelineDateRed : ''}`}>
                {formatDateFriendly(calculatedLastWorkingD, lang)} {isPast ? t.nodePastTag : ''}
              </div>
              <div className={styles.timelineDesc}>{t.lastWorkingDesc}</div>
            </div>
          );
        })()}

        {/* 6. 離職生效 */}
        {(() => {
          const isPast = isDateInPast(effectiveDate);
          return (
            <div className={styles.timelineItem}>
              <div className={`${styles.timelineNode} ${isPast ? styles.timelineNodeRed : ''}`}>
                {isPast ? '!' : '3'}
              </div>
              <div className={styles.timelineLabel}>{t.effectiveNode}</div>
              <div className={`${styles.timelineDate} ${isPast ? styles.timelineDateRed : ''}`}>
                {formatDateFriendly(effectiveDate, lang)} {isPast ? t.nodePastTag : ''}
              </div>
              <div className={styles.timelineDesc}>{t.effectiveDesc}</div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
