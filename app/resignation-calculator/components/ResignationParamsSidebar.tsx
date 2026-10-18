import React, { useId } from 'react';
import styles from '../resignation-calculator.module.css';
import { formatDateStr } from '../engine';

interface ResignationParamsSidebarProps {
  t: any;
  lang: 'zh-TW' | 'en';
  calcDirection: 'noticeToLast' | 'lastToNotice';
  onChangeCalcDirection: (dir: 'noticeToLast' | 'lastToNotice') => void;
  onboardingDate: string;
  onChangeOnboardingDate: (date: string) => void;
  noticeDate: string;
  onChangeNoticeDate: (date: string) => void;
  targetLastWorkingDate: string;
  onChangeTargetLastWorkingDate: (date: string) => void;
  noticeMode: 'auto' | 'custom';
  onChangeNoticeMode: (mode: 'auto' | 'custom') => void;
  customDays: number | '';
  onChangeCustomDays: (days: number | '') => void;
  resignationType: 'voluntary' | 'involuntary';
  onChangeResignationType: (type: 'voluntary' | 'involuntary') => void;
  statutoryAnnualLeave: number;
  annualLeaveDays: number | '';
  onChangeAnnualLeaveDays: (days: number | '') => void;
  leaveDaysToTake: number | '';
  onChangeLeaveDaysToTake: (days: number | '') => void;
  useTaiwanHolidays: boolean;
  onChangeUseTaiwanHolidays: (use: boolean) => void;
  holidaysInPeriod: Array<{ date: string; nameZh: string; nameEn: string }>;
  officeDayMode: 'autoLeaveEnd' | 'lastWorkingDay' | 'custom';
  onChangeOfficeDayMode: (mode: 'autoLeaveEnd' | 'lastWorkingDay' | 'custom') => void;
  actualOfficeDate: Date;
  calculatedNoticeD: Date;
  calculatedLastWorkingD: Date;
  onChangeCustomOfficeDate: (date: string) => void;
  monthlySalary: number | '';
  onChangeMonthlySalary: (salary: number | '') => void;
  employerShortNoticeDays: number | '';
  onChangeEmployerShortNoticeDays: (days: number | '') => void;
}

export default function ResignationParamsSidebar({
  t,
  lang,
  calcDirection,
  onChangeCalcDirection,
  onboardingDate,
  onChangeOnboardingDate,
  noticeDate,
  onChangeNoticeDate,
  targetLastWorkingDate,
  onChangeTargetLastWorkingDate,
  noticeMode,
  onChangeNoticeMode,
  customDays,
  onChangeCustomDays,
  resignationType,
  onChangeResignationType,
  statutoryAnnualLeave,
  annualLeaveDays,
  onChangeAnnualLeaveDays,
  leaveDaysToTake,
  onChangeLeaveDaysToTake,
  useTaiwanHolidays,
  onChangeUseTaiwanHolidays,
  holidaysInPeriod,
  officeDayMode,
  onChangeOfficeDayMode,
  actualOfficeDate,
  calculatedNoticeD,
  calculatedLastWorkingD,
  onChangeCustomOfficeDate,
  monthlySalary,
  onChangeMonthlySalary,
  employerShortNoticeDays,
  onChangeEmployerShortNoticeDays,
}: ResignationParamsSidebarProps) {
  const calcDirSelectId = useId();
  const onboardingInputId = useId();
  const noticeInputId = useId();
  const targetLastWorkingInputId = useId();
  const noticeModeSelectId = useId();
  const customDaysInputId = useId();
  const typeSelectId = useId();
  const holidaysCheckboxId = useId();
  const leaveDaysInputId = useId();
  const leaveHandlingSelectId = useId();
  const officeDayModeSelectId = useId();
  const customOfficeInputId = useId();
  const salaryInputId = useId();
  const shortNoticeDaysInputId = useId();

  return (
    <div className={`${styles.glassCard} ${styles.stickySidebar}`}>
      <h2 className={styles.cardTitle}>
        <svg viewBox="0 0 24 24" width={20} height={20} fill="none" stroke="currentColor" strokeWidth={2} className={styles.accentText}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <span>{t.paramsSectionTitle}</span>
      </h2>

      <div className="flex flex-col gap-3.5">
        {/* 試算方向選擇 */}
        <div>
          <label htmlFor={calcDirSelectId} className="block text-sm font-semibold text-text-main mb-1">
            {t.calcDirectionLabel}
          </label>
          <select
            id={calcDirSelectId}
            value={calcDirection}
            onChange={(e) => onChangeCalcDirection(e.target.value as 'noticeToLast' | 'lastToNotice')}
            className="w-full px-3 py-2 rounded-xl bg-select-bg border border-border-glass text-text-main font-semibold focus:border-[var(--theme-color)] outline-none text-sm leading-snug"
          >
            <option value="noticeToLast">{t.dirNoticeToLast}</option>
            <option value="lastToNotice">{t.dirLastToNotice}</option>
          </select>
        </div>

        {/* 到職日 + 提出離職日 / 目標最後在職日 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
          <div>
            <label htmlFor={onboardingInputId} className="block text-sm font-medium text-text-sub mb-1">
              {t.onboardingDateLabel}
            </label>
            <input
              id={onboardingInputId}
              type="date"
              value={onboardingDate}
              onChange={(e) => onChangeOnboardingDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-select-bg border border-border-glass text-text-main focus:border-[var(--theme-color)] outline-none text-sm [color-scheme:dark]"
            />
          </div>

          {calcDirection === 'noticeToLast' ? (
            <div>
              <label htmlFor={noticeInputId} className="block text-sm font-medium text-text-sub mb-1">
                {t.noticeDateLabel}
              </label>
              <input
                id={noticeInputId}
                type="date"
                value={noticeDate}
                onChange={(e) => onChangeNoticeDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-select-bg border border-border-glass text-text-main focus:border-[var(--theme-color)] outline-none text-sm [color-scheme:dark]"
              />
            </div>
          ) : (
            <div>
              <label htmlFor={targetLastWorkingInputId} className="block text-sm font-medium text-text-sub mb-1">
                {t.targetLastWorkingDateLabel}
              </label>
              <input
                id={targetLastWorkingInputId}
                type="date"
                value={targetLastWorkingDate}
                onChange={(e) => onChangeTargetLastWorkingDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-select-bg border border-border-glass text-text-main focus:border-[var(--theme-color)] outline-none text-sm [color-scheme:dark]"
              />
            </div>
          )}
        </div>

        {/* 預告天數計算模式 */}
        <div>
          <label htmlFor={noticeModeSelectId} className="block text-sm font-medium text-text-sub mb-1">
            {t.noticeOptionLabel}
          </label>
          <select
            id={noticeModeSelectId}
            value={noticeMode}
            onChange={(e) => onChangeNoticeMode(e.target.value as 'auto' | 'custom')}
            className="w-full px-3 py-2 rounded-xl bg-select-bg border border-border-glass text-text-main focus:border-[var(--theme-color)] outline-none text-sm"
          >
            <option value="auto">{t.autoLaborLaw}</option>
            <option value="custom">{t.customNotice}</option>
          </select>
        </div>

        {noticeMode === 'custom' && (
          <div>
            <label htmlFor={customDaysInputId} className="block text-sm font-medium text-text-sub mb-1">
              {t.customDaysLabel}
            </label>
            <input
              id={customDaysInputId}
              type="number"
              min={0}
              max={365}
              value={customDays}
              onChange={(e) => onChangeCustomDays(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
              className="w-full px-3 py-2 rounded-xl bg-select-bg border border-border-glass text-text-main focus:border-[var(--theme-color)] outline-none text-sm"
            />
          </div>
        )}

        {/* 離職類型 */}
        <div>
          <label htmlFor={typeSelectId} className="block text-sm font-medium text-text-sub mb-1">
            {t.resignationTypeLabel}
          </label>
          <select
            id={typeSelectId}
            value={resignationType}
            onChange={(e) => onChangeResignationType(e.target.value as 'voluntary' | 'involuntary')}
            className="w-full px-3 py-2 rounded-xl bg-select-bg border border-border-glass text-text-main focus:border-[var(--theme-color)] outline-none text-sm"
          >
            <option value="voluntary">{t.typeVoluntary}</option>
            <option value="involuntary">{t.typeInvoluntary}</option>
          </select>
        </div>

        <hr className="border-border-glass my-0.5" />

        {/* 剩餘特休假 */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label htmlFor={leaveDaysInputId} className="block text-sm font-medium text-text-sub">
              {t.annualLeaveLabel}
            </label>
            <button
              type="button"
              onClick={() => onChangeAnnualLeaveDays(statutoryAnnualLeave)}
              className={`text-xs ${styles.accentText} hover:underline flex items-center gap-1 font-medium cursor-pointer`}
            >
              <svg viewBox="0 0 24 24" width={13} height={13} fill="none" stroke="currentColor" strokeWidth={2} className="flex-shrink-0">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 01-2 2h-0a2 2 0 01-2-2v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              <span>
                {t.statutoryLeaveHint}
                <strong>
                  {statutoryAnnualLeave} {t.daysUnit}
                </strong>{' '}
                ({t.fillStatutoryBtn})
              </span>
            </button>
          </div>
          <input
            id={leaveDaysInputId}
            type="number"
            step="0.5"
            min={0}
            max={99}
            value={annualLeaveDays}
            onChange={(e) => onChangeAnnualLeaveDays(e.target.value === '' ? '' : parseFloat(e.target.value))}
            className="w-full px-3 py-2 rounded-xl bg-select-bg border border-border-glass text-text-main focus:border-[var(--theme-color)] outline-none text-sm"
          />
        </div>

        {/* 離職前預計排休天數 */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label htmlFor={leaveHandlingSelectId} className="block text-sm font-medium text-text-sub">
              {t.leaveToTakeLabel}
            </label>
            <div className="flex items-center gap-1.5 text-xs">
              <button
                type="button"
                onClick={() => onChangeLeaveDaysToTake(0)}
                className="px-2 py-0.5 rounded bg-select-bg border border-border-glass text-text-sub hover:text-text-main transition-colors cursor-pointer"
              >
                {t.btnTakeZero}
              </button>
              <button
                type="button"
                onClick={() => onChangeLeaveDaysToTake(annualLeaveDays === '' ? 0 : annualLeaveDays)}
                className="px-2 py-0.5 rounded bg-select-bg border border-border-glass text-text-sub hover:text-text-main transition-colors cursor-pointer"
              >
                {t.btnTakeMax}
              </button>
            </div>
          </div>
          <input
            id={leaveHandlingSelectId}
            type="number"
            step="0.5"
            min={0}
            max={annualLeaveDays === '' ? 99 : annualLeaveDays}
            value={leaveDaysToTake}
            onChange={(e) => onChangeLeaveDaysToTake(e.target.value === '' ? '' : parseFloat(e.target.value))}
            className="w-full px-3 py-2 rounded-xl bg-select-bg border border-border-glass text-text-main focus:border-[var(--theme-color)] outline-none text-sm"
          />
        </div>

        {/* 台灣國定假日自動扣除開關 */}
        <div className="p-2.5 rounded-xl bg-select-bg border border-border-glass">
          <div className="flex items-center gap-2">
            <input
              id={holidaysCheckboxId}
              type="checkbox"
              checked={useTaiwanHolidays}
              onChange={(e) => onChangeUseTaiwanHolidays(e.target.checked)}
              className="w-4 h-4 accent-[#00f5a0] cursor-pointer"
            />
            <label
              htmlFor={holidaysCheckboxId}
              className="text-sm font-medium text-text-main cursor-pointer"
            >
              {t.useTaiwanHolidaysLabel}
            </label>
          </div>
          {useTaiwanHolidays && holidaysInPeriod.length > 0 && (
            <div className={`text-xs mt-1.5 pl-6 font-medium ${styles.accentText}`}>
              <div className="flex flex-wrap gap-1 mt-0.5">
                {holidaysInPeriod.map((h) => (
                  <span
                    key={h.date}
                    className="px-1.5 py-0.5 rounded bg-surface-glass border border-border-glass font-mono text-xs"
                  >
                    {h.date.slice(5)} {lang === 'zh-TW' ? h.nameZh : h.nameEn}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 最後到辦公室出勤日推算模式 */}
        <div>
          <label htmlFor={officeDayModeSelectId} className="block text-sm font-medium text-text-sub mb-1">
            {t.officeDayModeLabel}
          </label>
          <select
            id={officeDayModeSelectId}
            value={officeDayMode}
            onChange={(e) => onChangeOfficeDayMode(e.target.value as 'autoLeaveEnd' | 'lastWorkingDay' | 'custom')}
            className="w-full px-3 py-2 rounded-xl bg-select-bg border border-border-glass text-text-main focus:border-[var(--theme-color)] outline-none text-sm"
          >
            <option value="autoLeaveEnd">{t.officeDayAutoLeaveEnd}</option>
            <option value="lastWorkingDay">{t.officeDayLastWorking}</option>
            <option value="custom">{t.officeDayCustom}</option>
          </select>
        </div>

        {officeDayMode === 'custom' && (
          <div>
            <label htmlFor={customOfficeInputId} className="block text-sm font-medium text-text-sub mb-1">
              {t.customOfficeDateLabel}
            </label>
            <input
              id={customOfficeInputId}
              type="date"
              min={formatDateStr(calculatedNoticeD)}
              max={formatDateStr(calculatedLastWorkingD)}
              value={formatDateStr(actualOfficeDate)}
              onChange={(e) => {
                if (e.target.value) {
                  onChangeCustomOfficeDate(e.target.value);
                }
              }}
              className="w-full px-3 py-2 rounded-xl bg-select-bg border border-border-glass text-text-main focus:border-[var(--theme-color)] outline-none text-sm [color-scheme:dark]"
            />
            <p className="text-xs text-text-sub mt-1 leading-relaxed">
              {t.customOfficeDateHint}（{formatDateStr(calculatedNoticeD)} ~ {formatDateStr(calculatedLastWorkingD)}）
            </p>
          </div>
        )}

        {/* 月薪輸入 */}
        <div>
          <label htmlFor={salaryInputId} className="block text-sm font-medium text-text-sub mb-1">
            {t.monthlySalaryLabel}
          </label>
          <input
            id={salaryInputId}
            type="text"
            inputMode="numeric"
            placeholder={t.monthlySalaryPlaceholder}
            value={monthlySalary === '' ? '' : monthlySalary.toLocaleString('zh-TW')}
            onChange={(e) => {
              const raw = e.target.value.replace(/[^\d]/g, '');
              onChangeMonthlySalary(raw === '' ? '' : parseInt(raw, 10));
            }}
            className="w-full px-3 py-2 rounded-xl bg-select-bg border border-border-glass text-text-main focus:border-[var(--theme-color)] outline-none text-sm"
          />
        </div>

        {/* 非自願離職：雇主未足額預告天數 */}
        {resignationType === 'involuntary' && (
          <div>
            <label htmlFor={shortNoticeDaysInputId} className="block text-sm font-medium text-text-sub mb-1">
              {t.employerShortNoticeDaysLabel}
            </label>
            <input
              id={shortNoticeDaysInputId}
              type="number"
              min={0}
              max={60}
              value={employerShortNoticeDays}
              onChange={(e) =>
                onChangeEmployerShortNoticeDays(e.target.value === '' ? '' : parseInt(e.target.value, 10))
              }
              className="w-full px-3 py-2 rounded-xl bg-select-bg border border-border-glass text-text-main focus:border-[var(--theme-color)] outline-none text-sm"
            />
            <p className="text-xs text-text-sub mt-1">{t.employerShortNoticeHint}</p>
          </div>
        )}
      </div>
    </div>
  );
}
