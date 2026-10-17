/**
 * 離職預告期關鍵時程 `.ics` 行事曆產生器與多情境離職信範本引擎（無副作用純函數）。
 */

import { formatDateStr, formatDateFriendly } from './engine.ts';

export type EmailTemplateVariant = 'standard' | 'warm' | 'involuntary';

export interface EmailTemplateOptions {
  lang: 'zh-TW' | 'en';
  variant: EmailTemplateVariant;
  senderName?: string;
  handoverPerson?: string;
  tenureYears: number;
  tenureMonths: number;
  requiredNoticeDays: number;
  calculatedNoticeDate: Date;
  noticeStartDate: Date;
  calculatedLastWorkingDate: Date;
  actualOfficeDate: Date;
  effectiveDate: Date;
  actualTakeLeaveDays: number;
  payoutDaysTotal: number;
  estimatedLeavePayout: number;
  estimatedSeverancePay: number;
  maxJobSeekingLeaveDays: number;
}

export function generateResignationEmail(opts: EmailTemplateOptions): string {
  const {
    lang,
    variant,
    senderName,
    handoverPerson,
    tenureYears,
    tenureMonths,
    requiredNoticeDays,
    calculatedNoticeDate,
    noticeStartDate,
    calculatedLastWorkingDate,
    actualOfficeDate,
    effectiveDate,
    actualTakeLeaveDays,
    payoutDaysTotal,
    estimatedLeavePayout,
    estimatedSeverancePay,
    maxJobSeekingLeaveDays,
  } = opts;

  const cleanSender = senderName?.trim() || (lang === 'zh-TW' ? '同仁' : '[Your Name]');
  const cleanHandover = handoverPerson?.trim();

  if (lang === 'zh-TW') {
    const leaveLine =
      actualTakeLeaveDays > 0
        ? `\n- 特休排休天數：${actualTakeLeaveDays} 個工作天（實際最後到辦公室出勤日為 ${formatDateFriendly(actualOfficeDate, 'zh-TW')}）`
        : '';
    const handoverLine = cleanHandover
      ? `相關負責業務預計移交予 ${cleanHandover} 協助銜接。`
      : '本人將全力協助完成各項職務與專案文件之移交交接。';

    if (variant === 'warm') {
      return `主旨：【離職預告通知】感謝栽培與後續工作交接安排 - ${cleanSender}

主管 / HR 您好：

很感謝這段期間在團隊中的指導與支持，讓我在任職期間獲益良多。因個人生涯與職涯階段規劃考量，謹以此信於 ${formatDateStr(calculatedNoticeDate)} 正式提出離職預告。

依據勞動基準法規範（年資約 ${tenureYears} 年 ${tenureMonths} 個月，法定預告期 ${requiredNoticeDays} 天），相關時程規劃如下：

- 預告通知提出日：${formatDateFriendly(calculatedNoticeDate, 'zh-TW')}
- 預告期起算日：${formatDateFriendly(noticeStartDate, 'zh-TW')}
- 契約最後在職日：${formatDateFriendly(calculatedLastWorkingDate, 'zh-TW')}${leaveLine}
- 離職正式生效日（退保日）：${formatDateFriendly(effectiveDate, 'zh-TW')}

在離開團隊前，${handoverLine}
再次由衷感謝公司與各位夥伴這段日子的照顧，祝福團隊未來發展一切順遂！

祝 順心如意

${cleanSender} 敬上`;
    }

    if (variant === 'involuntary') {
      return `主旨：【資遣交接與法定權益確認】離職時程、特休結算與非自願離職證明事宜 - ${cleanSender}

主管 / HR 您好：

配合公司方於 ${formatDateStr(calculatedNoticeDate)} 通知之資遣預告（年資約 ${tenureYears} 年 ${tenureMonths} 個月，法定預告期 ${requiredNoticeDays} 天），謹與公司確認後續交接時程與相關法定結算事項：

- 資遣預告通知日：${formatDateFriendly(calculatedNoticeDate, 'zh-TW')}
- 預告期起算日：${formatDateFriendly(noticeStartDate, 'zh-TW')}
- 契約最後在職日：${formatDateFriendly(calculatedLastWorkingDate, 'zh-TW')}${leaveLine}
- 離職正式生效日（退保日）：${formatDateFriendly(effectiveDate, 'zh-TW')}
- 資遣謀職假：依勞基法第 16 條第 2 項，預告期間每週得請假最多 2 日外出謀職（共約 ${maxJobSeekingLeaveDays} 日有薪謀職假）
- 結算款項確認：未休畢特休 ${payoutDaysTotal} 天之不休假工資及勞退新制資遣費

在最後出勤日前，${handoverLine}
同時煩請協助於離職時開立載明資遣事由之「非自願離職證明書」及「健保轉出申報表」影本。感謝協助！

${cleanSender} 敬上`;
    }

    // standard
    return `主旨：【離職預告通知】離職預告與交接通知 - ${cleanSender}

主管 / HR 您好：

本人謹以此信於 ${formatDateStr(calculatedNoticeDate)} 正式向公司提出離職預告。
依據勞動基準法規範（年資約 ${tenureYears} 年 ${tenureMonths} 個月，法定預告期 ${requiredNoticeDays} 天）：

- 預告通知提出日：${formatDateFriendly(calculatedNoticeDate, 'zh-TW')}
- 預告期起算日：${formatDateFriendly(noticeStartDate, 'zh-TW')}
- 契約最後在職日：${formatDateFriendly(calculatedLastWorkingDate, 'zh-TW')}${leaveLine}
- 離職正式生效日 (退保日)：${formatDateFriendly(effectiveDate, 'zh-TW')}

在離職生效日前，${handoverLine}
感謝公司與主管這段時間的照顧與指導！

祝 順心

${cleanSender} 敬上`;
  }

  // English variants
  const leaveLineEn =
    actualTakeLeaveDays > 0
      ? `\n- Annual Leave Taken: ${actualTakeLeaveDays} working days (Actual Last Office Day: ${formatDateFriendly(actualOfficeDate, 'en')})`
      : '';
  const handoverLineEn = cleanHandover
    ? `I will coordinate closely with ${cleanHandover} to ensure a seamless handover of all my responsibilities.`
    : 'I will ensure a smooth handover of all my duties and projects prior to my departure date.';

  if (variant === 'warm') {
    return `Subject: Resignation Notice & Gratitude - ${cleanSender}

Dear Manager / HR Team,

Thank you very much for the mentorship and opportunities I have received during my time with the team. After careful consideration of my personal career goals, I am writing to formally submit my resignation notice on ${formatDateStr(calculatedNoticeDate)}.

In accordance with the Taiwan Labor Standards Act (Tenure: ${tenureYears} yrs ${tenureMonths} mos, Required Notice: ${requiredNoticeDays} days):

- Notice Submission Date: ${formatDateFriendly(calculatedNoticeDate, 'en')}
- Notice Period Start Date: ${formatDateFriendly(noticeStartDate, 'en')}
- Last Working Day: ${formatDateFriendly(calculatedLastWorkingDate, 'en')}${leaveLineEn}
- Resignation Effective Date: ${formatDateFriendly(effectiveDate, 'en')}

${handoverLineEn}
Thank you once again for all your support, and I wish the team continued success!

Warm regards,
${cleanSender}`;
  }

  if (variant === 'involuntary') {
    return `Subject: Severance Handover & Statutory Settlement Confirmation - ${cleanSender}

Dear Manager / HR Team,

Following the company's severance notice on ${formatDateStr(calculatedNoticeDate)} (Tenure: ${tenureYears} yrs ${tenureMonths} mos, Notice Period: ${requiredNoticeDays} days), I would like to confirm the offboarding schedule and statutory entitlements:

- Severance Notice Date: ${formatDateFriendly(calculatedNoticeDate, 'en')}
- Notice Period Start Date: ${formatDateFriendly(noticeStartDate, 'en')}
- Contractual Last Working Day: ${formatDateFriendly(calculatedLastWorkingDate, 'en')}${leaveLineEn}
- Effective Date (Insurance End): ${formatDateFriendly(effectiveDate, 'en')}
- Paid Job-Seeking Leave: Up to 2 days per week under LSA Art. 16(2) (Total up to ${maxJobSeekingLeaveDays} paid days)
- Statutory Settlement: Unused annual leave payout (${payoutDaysTotal} days) & Severance Pay under Labor Pension Act Art. 12

${handoverLineEn}
Please also kindly prepare the Involuntary Separation Certificate and Health Insurance Transfer Form upon my departure.

Sincerely,
${cleanSender}`;
  }

  return `Subject: Resignation Notice - ${cleanSender}

Dear Manager / HR Team,

I am writing to formally submit my resignation notice on ${formatDateStr(calculatedNoticeDate)}.
Based on the Taiwan Labor Standards Act (Total tenure: ${tenureYears} yrs ${tenureMonths} mos, Notice period required: ${requiredNoticeDays} days):

- Notice Submission Date: ${formatDateFriendly(calculatedNoticeDate, 'en')}
- Notice Period Start Date: ${formatDateFriendly(noticeStartDate, 'en')}
- Last Working Day: ${formatDateFriendly(calculatedLastWorkingDate, 'en')}${leaveLineEn}
- Resignation Effective Date: ${formatDateFriendly(effectiveDate, 'en')}

${handoverLineEn}
Thank you for the support and guidance during my time at the company.

Sincerely,
${cleanSender}`;
}

function toIcsDateVal(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}${m}${d}`;
}

function addOneDay(date: Date): Date {
  const next = new Date(date.getTime());
  next.setDate(next.getDate() + 1);
  return next;
}

/**
 * 產生包含離職四大關鍵節點的 RFC 5545 `.ics` 全天事件檔案內容
 */
export function buildResignationIcsContent(params: {
  lang: 'zh-TW' | 'en';
  calculatedNoticeDate: Date;
  actualOfficeDate: Date;
  calculatedLastWorkingDate: Date;
  effectiveDate: Date;
  requiredNoticeDays: number;
  actualTakeLeaveDays: number;
}): string {
  const {
    lang,
    calculatedNoticeDate,
    actualOfficeDate,
    calculatedLastWorkingDate,
    effectiveDate,
    requiredNoticeDays,
    actualTakeLeaveDays,
  } = params;

  const events =
    lang === 'zh-TW'
      ? [
          {
            uid: `resign-notice-${toIcsDateVal(calculatedNoticeDate)}@tools.cjkuo.net`,
            date: calculatedNoticeDate,
            summary: '【離職時程】提出離職預告通知',
            desc: `正式向主管/HR 提出離職預告（法定要求預告期 ${requiredNoticeDays} 天）。`,
          },
          {
            uid: `resign-office-${toIcsDateVal(actualOfficeDate)}@tools.cjkuo.net`,
            date: actualOfficeDate,
            summary: '【離職時程】實際最後一天進辦公室交接',
            desc:
              actualTakeLeaveDays > 0
                ? `最後一天實體進辦公室辦理交接與歸還公物（後續排休 ${actualTakeLeaveDays} 個工作天特休）。`
                : '最後一天進辦公室辦理實體交接與歸還公物。',
          },
          {
            uid: `resign-lastwork-${toIcsDateVal(calculatedLastWorkingDate)}@tools.cjkuo.net`,
            date: calculatedLastWorkingDate,
            summary: '【離職時程】契約最後在職日',
            desc: '勞動契約存續最後一日，薪資與勞健保計算至今日 24:00。',
          },
          {
            uid: `resign-effective-${toIcsDateVal(effectiveDate)}@tools.cjkuo.net`,
            date: effectiveDate,
            summary: '【離職時程】離職正式生效日（退保日）',
            desc: '原公司勞健保退保生效日，新公司可於今日加保。',
          },
        ]
      : [
          {
            uid: `resign-notice-${toIcsDateVal(calculatedNoticeDate)}@tools.cjkuo.net`,
            date: calculatedNoticeDate,
            summary: '[Resignation] Submit Resignation Notice',
            desc: `Submit formal resignation notice (${requiredNoticeDays} calendar days notice period).`,
          },
          {
            uid: `resign-office-${toIcsDateVal(actualOfficeDate)}@tools.cjkuo.net`,
            date: actualOfficeDate,
            summary: '[Resignation] Actual Last Day in Office (Handover)',
            desc:
              actualTakeLeaveDays > 0
                ? `Final day in office for physical handover (${actualTakeLeaveDays} leave days scheduled afterwards).`
                : 'Final day in office for physical handover and returning equipment.',
          },
          {
            uid: `resign-lastwork-${toIcsDateVal(calculatedLastWorkingDate)}@tools.cjkuo.net`,
            date: calculatedLastWorkingDate,
            summary: '[Resignation] Contractual Last Working Day',
            desc: 'Final day of employment contract; salary and insurance covered through today.',
          },
          {
            uid: `resign-effective-${toIcsDateVal(effectiveDate)}@tools.cjkuo.net`,
            date: effectiveDate,
            summary: '[Resignation] Official Effective Date (Insurance End)',
            desc: 'Labor & health insurance cancellation date.',
          },
        ];

  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Smalltools//Resignation Calculator//TW',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
  ];

  for (const ev of events) {
    const dtStart = toIcsDateVal(ev.date);
    const dtEnd = toIcsDateVal(addOneDay(ev.date));
    lines.push(
      'BEGIN:VEVENT',
      `UID:${ev.uid}`,
      `DTSTAMP:${dtStart}T000000Z`,
      `DTSTART;VALUE=DATE:${dtStart}`,
      `DTEND;VALUE=DATE:${dtEnd}`,
      `SUMMARY:${ev.summary}`,
      `DESCRIPTION:${ev.desc}`,
      'END:VEVENT',
    );
  }

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}
