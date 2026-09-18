/**
 * 離職計算器頁面中英文案（從 ResignationCalculatorClient.tsx 抽離，避免單檔過長）。
 */
export const TRANSLATIONS = {
  'zh-TW': {
    backToHome: '返回首頁',
    langToggle: 'English',
    title: '離職時間與預告期計算機',
    subtitle: 'RESIGNATION & NOTICE PERIOD CALCULATOR',
    description: '依台灣勞基法第 16 條精準計算法定預告天數、離職生效日、最後在職日與特休排休/折現試算。支援「正向提出日推算」與「目標離職日反向推算」，並附帶過期與預告期天數充足度檢核。',
    
    // 計算方向模式 (簡潔專業無 Emoji / 無 redundant 贅字)
    calcDirectionLabel: '試算目標',
    dirNoticeToLast: '「哪一天能離職」（由提出離職日算起）',
    dirLastToNotice: '「哪一天最晚要提出」（由目標離職日倒推）',

    // 表單標籤
    onboardingDateLabel: '到職日期',
    noticeDateLabel: '預計提出離職日',
    targetLastWorkingDateLabel: '目標最後在職日',
    noticeOptionLabel: '預告天數計算方式',
    autoLaborLaw: '依勞基法第 16 條自動計算',
    customNotice: '自訂預告天數',
    customDaysLabel: '自訂預告天數 (天)',
    resignationTypeLabel: '離職類型',
    typeVoluntary: '自願離職 (一般離職)',
    typeInvoluntary: '非自願離職 (被資遣 - 享有謀職假)',
    
    annualLeaveLabel: '剩餘未休特休假 (天)',
    leaveHandlingLabel: '特休假處理方式',
    leaveTakeAll: '離職前全部排休完畢 (推算最後出勤日)',
    leavePayout: '不排休，全數折算現金 (不休假工資)',
    
    officeDayModeLabel: '最後到辦公室出勤日推算',
    officeDayAutoLeaveEnd: '離職前集中排休 (預設：由最後在職日倒推)',
    officeDayLastWorking: '最後在職日當天出勤 (特休分散排休/不集中離職前)',
    officeDayCustom: '自訂最後到辦公室日期',
    customOfficeDateLabel: '自訂最後到辦公室日期',
    
    monthlySalaryLabel: '月薪 (TWD) [選填: 試算特休代金]',
    monthlySalaryPlaceholder: '請輸入月薪，如 50000',

    // 合規檢查告警
    insufficientNoticeWarningTitle: '預告天數不足告警！',
    pastNoticeOverdueTitle: '最晚提出預告日已過期！(天數不足)',
    insufficientNoticeDesc1: '您目前設定的預告期間僅給予',
    insufficientNoticeDesc2: '天，不足法定/要求之',
    insufficientNoticeDesc3: '天預告期（尚缺',
    insufficientNoticeDesc4: '天）。',
    
    pastNoticeOverdueDesc1: '依目標最後在職日推算，最晚應於',
    pastNoticeOverdueDesc2: '提出預告（已為過去日期）。若您【今天】才要提出離職，距離目標離職日僅剩',
    pastNoticeOverdueDesc3: '天，不足要求的',
    pastNoticeOverdueDesc4: '天預告期（尚缺',
    pastNoticeOverdueDesc5: '天）。',

    earliestNoticeRecommend: '最晚建議提出預告日：',
    recommendPostponeDate: '若今天才提出離職，建議最後在職日順延至：',
    lawAgreementNote: '注意：預告期不足若未經雇主同意，可能產生勞動契約違約或爭議問題。',
    sufficientNoticeSuccess: '預告天數充足，完全符合勞基法定/要求之預告期規範！',
    pastNoticeSuccessNote: '（提示：設定之提出日為過去日期，代表您已於該日正式向雇主遞交預告）',

    // 數據卡片
    legalNoticeDays: '要求預告期',
    noticeStart: '預告期起算日',
    lastWorkingDay: '最後在職日',
    actualOfficeDay: '實際最後出勤日',
    effectiveDate: '離職生效日 (退保日)',
    tenure: '服務總年資',
    
    // 時間軸與明細
    timelineTitle: '關鍵離職時程時間軸',
    noticeGivenNode: '提出離職通知',
    noticeStartNode: '預告期開始起算',
    jobSeekingLeavePeriodNode: '資遣謀職假得請假期間',
    jobSeekingLeaveTimelineDesc: '勞基法第 16 條第 2 項規定：預告期間每星期得請假最多 2 日外出謀職，請假期間工資照給',
    leavePeriodNode: '特休排休期間',
    actualOfficeNode: '最後一天到辦公室出勤',
    lastWorkingNode: '契約最後在職日',
    effectiveNode: '離職正式生效 (退保日)',
    nodePastTag: '(已為過去時間點)',
    
    // 特休與謀職假分析
    leaveAnalysisTitle: '特休假與權益估算',
    leaveDaysCount: '特休排休天數',
    leaveDaysCountUnit: '個工作天',
    leavePayoutEstimate: '特休不休假代金估算',
    dailyAvgSalary: '預估一日平均工資',
    jobSeekingLeaveTitle: '資遣謀職假權益',
    jobSeekingLeaveDesc: '每星期得請假 2 日外出謀職，請假期間工資照給（共約可請',
    
    // 預告範本
    emailTemplateTitle: '一鍵生成離職預告範本 (Email / Line)',
    copyTemplateBtn: '複製離職預告範本',
    copiedSuccess: '已成功複製離職預告範本至剪貼簿！',
    
    // Checklist
    checklistTitle: '離職手續與權益 Check List',
    item1: '索取【服務證明書 / 離職證明書】（非自願離職需註明明細與勞基法條文）',
    item2: '索取【全民健康保險轉出申報表】影本（以利順利銜接下一家公司健保或公所投保）',
    item3: '確認【勞工退休金自提%數】調整（若有自提，離職後新公司將預設不扣自提）',
    item4: '完成公物與權限交接（公司電腦、公務卡、門禁卡、雲端帳號及實體文件移交）',
    item5: '確認最後一個月薪資與特休不休假代金匯款日期',

    // 勞基法條文說明
    laborLawRefTitle: '台灣勞基法第 16 條預告期規範',
    lawRule1: '工作 3 個月以上未滿 1 年者：於 10 日前預告之。',
    lawRule2: '工作 1 年以上未滿 3 年者：於 20 日前預告之。',
    lawRule3: '工作 3 年以上者：於 30 日前預告之。',
    lawNote: '註：未滿 3 個月試用期法令無強制預告期；預告天數包含例假日與國定假日（曆天），非僅工作天。依法院判例，起算日為「告知之次日」。',
    
    statutoryLeaveHint: '依年資法定特休：',
    fillStatutoryBtn: '一鍵帶入',
    leaveToTakeLabel: '離職前預計排休天數 (天)',
    btnTakeZero: '0 天 (全數換錢)',
    btnTakeMax: '全數排休',
    btnStrategicSeverance: '優先請謀職假，特休設 0 天換錢',
    severanceStrategyTitle: '被資遣最佳換錢策略建議',
    severanceStrategyDesc1: '依勞基法規定，資遣謀職假（每週 2 天有薪假）未請「無法折算現金」；而特別休假未休完依法必須「100% 發給工資代金」。',
    severanceStrategyDesc2: '極力建議：優先請滿資遣謀職假外出面試，並將特休假全數保留至離職退保日換錢！預估可額外多領約',

    faqTitle: '常問問題與專業指南 (FAQ)',
    faqSubtitle: '深入了解勞基法預告期、離職生效退保日、特休代金結算與謀職假權益',
    faqItems: [
      {
        q: '離職預告天數包含假日嗎？還是只算工作天？',
        a: '依勞動部函釋與法院判決，離職預告天數計算包含例假日、國定假日與休息日（以曆天 Calendar Days 計算，非僅工作天）。例如法定預告期為 10 天，從告知的「次日」開始連數 10 個日曆天即可。',
      },
      {
        q: '離職預告的「起算日」、「最後在職日」與「離職生效日」該如何計算？',
        a: `依勞基法規定與司法判例：

① 告知日：您正式向雇主（主管或 HR）提出離職預告當天。
② 預告起算日：依民法第 120 條「始日不算入」，從告知日的「次日」開始起算第一天。
③ 最後在職日：勞動契約關係存續的最後一天。算滿預告天數的當天即為最後在職日。
④ 離職生效日（退保日）：最後在職日的「次日」。公司應於此日正式退保勞健保。`,
      },
      {
        q: '離職日（最後在職日）可以是週末或國定假日嗎？與「最後出勤日」有何不同？',
        a: `離職日（勞動契約最後在職日）完全可以是週末或國定假日！預告期與離職日皆依「日曆天」計算，包含例假日與休息日。

關鍵概念區別如下：
① 實際最後出勤日 (Last Office Day)：您最後一天進辦公室實體上班、提供勞務的日子（例如週五）。
② 最後在職日 (Last Working Day)：勞動契約關係存續的最後一天（可押在週日），薪資與勞健保算至當天深夜 24:00。
③ 離職生效日 (Effective Date)：契約正式終止、公司為您辦理退保的日子（最後在職日的隔天週一）。`,
      },
      {
        q: '離職如果有特休，最後一天一定要進公司上班嗎？',
        a: `完全不需要！只要完成工作交接，最後一天亦可依法排休特休。

特休與最後一天的處理方式兩種選擇：
① 選擇請特休：在預告期內（包含最後一天）您隨時可以依法排休特休。請假當天不用進公司，但最後在職日的薪資與勞健保狀態仍持續算到當天。
② 選擇換現金：若您選擇將特休留著不請，依勞基法第 38 條規定，契約終止時公司必須將未休完的特休天數 100% 結算折換發給工資代金。`,
      },
      {
        q: '未滿 3 個月的試用期員工離職需要預告嗎？離職需要公司批准才能走嗎？',
        a: `試用期與離職生效規範如下：

① 試用期預告：勞基法第 16 條規定工作未滿 3 個月者，法令無強制規定預告期。
② 離職是否需公司批准：離職屬於勞工的「形成權（單方意思表示）」。只要您已依法定預告期正式通知雇主（不論 Oral、Email 或 Line 訊息留存憑證），時間一到離職即自動生效，完全不需要公司或主管點頭批准！`,
      },
      {
        q: '預告期間可以請「資遣謀職假」嗎？謀職假給薪嗎？',
        a: '依勞基法第 16 條第 2 項規定，僅有在「公司資遣員工（非自願離職）」時，員工於預告期間每星期得請假最多 2 日外出謀職，且謀職假期間「工資照給（給全薪）」。若是員工「自願離職」，則不適用謀職假規定。',
      },
      {
        q: '如果離職預告天數不足（提前離職），會有法律責任或賠償問題嗎？',
        a: '若勞工未符合法定預告天數逕行離職，勞動契約仍會在離職日終止；但若因突襲式離職導致公司遭受具體經濟損失（如業務中斷、緊急交接成本），雇主得依民法損害賠償相關規定向勞工民事求償（前提是雇主需負舉證責任證明具體損失金額）。因此建議盡量符合法定預告期，或與公司協商取得雙方同意提前解約。',
      },
      {
        q: '離職時可以向公司索取哪些證明文件？',
        a: `離職前建議確認向 HR 索取以下文件：

① 服務證明書（離職證明）：依勞基法第 19 條，雇主不得拒絕發給。非自願離職者應載明資遣事由與勞基法條款（以利申請失業給付）。
② 健保轉出申報表影本：以利順利銜接下一家公司投保或至區公所加保。
③ 勞退自提與所得扣繳憑單：確認勞退自提%數與當年度扣繳稅額。`,
      },
      {
        q: '預告期提早結束（提前離職）的破月薪資怎麼算？公司要求我提早走要給預告工資嗎？離職當天一定要結清薪水嗎？',
        a: `提前離職薪資計算與權益重點如下：

① 破月薪資比例計算：月薪制勞工未做滿整個月時，薪水應按當月實際在職天數（包括工作日、休息日與例假日）占全月總天數的比例計算，不可擅自扣除例假日與休息日的薪資。
② 離職日判定：離職日（勞動契約終止日）為最後實際在職日。若雙方合意提前結束，薪資與勞健保退保日皆應計算至該實際最後一天。
③ 公司要求提早離開：如果是雇主因故主動要求員工在預告期滿前提早離開，雇主必須依法給付該提早天數的「預告期工資」。
④ 發薪日規定：離職當月的薪資不一定要在離職當天拿現金結清，公司得於原約定的發薪日如期全額匯款給付，不得故意扣發或拖延。`,
      },
    ],
    laborLawArt38Title: '台灣勞基法第 38 條特別休假天數規範',
    art38Rule1: '工作 6 個月以上未滿 1 年者：3 日。',
    art38Rule2: '工作 1 年以上未滿 2 年者：7 日；2 年以上未滿 3 年者：10 日。',
    art38Rule3: '工作 3 年以上未滿 5 年者：每年 14 日；5 年以上未滿 10 年者：每年 15 日。',
    art38Rule4: '工作 10 年以上者：每 1 年加給 1 日，加至 30 日為止。',
  },
  en: {
    backToHome: 'Back to Home',
    langToggle: '繁體中文',
    title: 'Resignation & Notice Period Calculator',
    subtitle: 'RESIGNATION & NOTICE PERIOD CALCULATOR',
    description: 'Calculate official notice periods, last working days, effective dates, and annual leave payouts according to Taiwan Labor Standards Act with intuitive bidirectional calculation & visual timeline highlights.',
    
    // Calc Direction
    calcDirectionLabel: 'Calculation Goal',
    dirNoticeToLast: 'Calculate departure date (from notice date)',
    dirLastToNotice: 'Calculate latest notice date (from target departure)',

    // Labels
    onboardingDateLabel: 'Onboarding Date',
    noticeDateLabel: 'Notice Submission Date',
    targetLastWorkingDateLabel: 'Target Departure Date',
    noticeOptionLabel: 'Notice Calculation Mode',
    autoLaborLaw: 'Auto (Taiwan Labor Standards Act Art. 16)',
    customNotice: 'Custom Notice Days',
    customDaysLabel: 'Custom Notice Days',
    resignationTypeLabel: 'Resignation Type',
    typeVoluntary: 'Voluntary Resignation',
    typeInvoluntary: 'Involuntary (Severance - Job Seeking Leave)',
    
    annualLeaveLabel: 'Remaining Annual Leave (Days)',
    leaveHandlingLabel: 'Annual Leave Handling',
    leaveTakeAll: 'Take all leave before departure (Calculate last office day)',
    leavePayout: 'Payout cash for unused leave',
    
    officeDayModeLabel: 'Last Office Attendance Calculation',
    officeDayAutoLeaveEnd: 'Consecutive leave before departure (Default)',
    officeDayLastWorking: 'On last working day (Leave spread out / Not consecutive)',
    officeDayCustom: 'Custom last office date',
    customOfficeDateLabel: 'Custom Last Office Date',
    
    monthlySalaryLabel: 'Monthly Salary (TWD) [Optional for Leave Payout]',
    monthlySalaryPlaceholder: 'e.g. 50000',

    // Warnings
    insufficientNoticeWarningTitle: 'Insufficient Notice Period Warning!',
    pastNoticeOverdueTitle: 'Latest Notice Date Has Passed! (Insufficient Notice)',
    insufficientNoticeDesc1: 'Your given notice period is only ',
    insufficientNoticeDesc2: ' days, which is less than required ',
    insufficientNoticeDesc3: ' days (Short by ',
    insufficientNoticeDesc4: ' days).',
    
    pastNoticeOverdueDesc1: 'Based on target departure date, notice should have been submitted by ',
    pastNoticeOverdueDesc2: ' (past date). Submitting TODAY leaves only ',
    pastNoticeOverdueDesc3: ' days, short of required ',
    pastNoticeOverdueDesc4: ' days (Short by ',
    pastNoticeOverdueDesc5: ' days).',

    earliestNoticeRecommend: 'Latest recommended notice date: ',
    recommendPostponeDate: 'If submitting today, suggested last working day: ',
    lawAgreementNote: 'Note: Submitting insufficient notice without employer consent may lead to contractual disputes.',
    sufficientNoticeSuccess: 'Notice period is sufficient and fully complies with legal requirements!',
    pastNoticeSuccessNote: '(Note: Notice date is in the past, assuming notice was submitted on that day)',

    // Stat Cards
    legalNoticeDays: 'Notice Days Required',
    noticeStart: 'Notice Period Start',
    lastWorkingDay: 'Last Working Day',
    actualOfficeDay: 'Actual Last Office Day',
    effectiveDate: 'Effective Resignation Date',
    tenure: 'Total Tenure',
    
    // Timeline
    timelineTitle: 'Key Resignation Timeline',
    noticeGivenNode: 'Submit Resignation Notice',
    noticeStartNode: 'Notice Period Begins',
    jobSeekingLeavePeriodNode: 'Job-Seeking Leave Period',
    jobSeekingLeaveTimelineDesc: 'Labor Standards Act Art. 16: Entitled to up to 2 paid days off per week during notice period for job hunting',
    leavePeriodNode: 'Annual Leave Period',
    actualOfficeNode: 'Last Day at Office',
    lastWorkingNode: 'Last Contractual Working Day',
    effectiveNode: 'Resignation Effective Date',
    nodePastTag: '(Past Date)',
    
    // Breakdown
    leaveAnalysisTitle: 'Leave & Benefits Breakdown',
    leaveDaysCount: 'Leave Taken Days',
    leaveDaysCountUnit: ' working days',
    leavePayoutEstimate: 'Estimated Leave Payout',
    dailyAvgSalary: 'Estimated Daily Salary',
    jobSeekingLeaveTitle: 'Job-Seeking Leave Benefit',
    jobSeekingLeaveDesc: 'Entitled to 2 paid days off per week during notice period for job hunting (Approx.',
    
    // Email Template
    emailTemplateTitle: 'Resignation Notice Email Generator',
    copyTemplateBtn: 'Copy Resignation Email',
    copiedSuccess: 'Copied resignation notice email to clipboard!',
    
    // Checklist
    checklistTitle: 'Offboarding Checklist',
    item1: 'Request Certificate of Service / Employment Certificate',
    item2: 'Request Health Insurance Cancellation / Transfer Form',
    item3: 'Check Voluntary Pension Contribution status',
    item4: 'Complete handovers of assets, access cards, and credentials',
    item5: 'Confirm final salary and leave payout transfer date',

    // Labor Law Reference
    laborLawRefTitle: 'Taiwan Labor Standards Act (Article 16)',
    lawRule1: 'Tenure 3 months to < 1 year: 10 days notice required.',
    lawRule2: 'Tenure 1 year to < 3 years: 20 days notice required.',
    lawRule3: 'Tenure 3+ years: 30 days notice required.',
    lawNote: 'Note: Notice period begins the day after notice is submitted and includes calendar weekends/holidays.',

    statutoryLeaveHint: 'Statutory quota by tenure: ',
    fillStatutoryBtn: 'Fill',
    leaveToTakeLabel: 'Intended Leave Days to Take Off (Days)',
    btnTakeZero: '0 days (All Cash)',
    btnTakeMax: 'Take All',
    btnStrategicSeverance: 'Use Job-Seeking Leave & Preserve Leave for Cash',
    severanceStrategyTitle: 'Optimal Severance Strategy Advice',
    severanceStrategyDesc1: 'Job-seeking leave cannot be cashed out if unused, whereas unused annual leave MUST be paid out 100% in cash by law.',
    severanceStrategyDesc2: 'Recommendation: Maximize paid job-seeking leave for interviews, and preserve all annual leave for cash payout! Est. extra cash:',
    laborLawArt38Title: 'Taiwan Labor Standards Act Art. 38 (Annual Leave)',
    art38Rule1: 'Tenure 6 mos to < 1 yr: 3 days.',
    art38Rule2: 'Tenure 1 yr to < 2 yrs: 7 days; 2 yrs to < 3 yrs: 10 days.',
    art38Rule3: 'Tenure 3 yrs to < 5 yrs: 14 days/yr; 5 yrs to < 10 yrs: 15 days/yr.',
    art38Rule4: 'Tenure 10+ yrs: +1 day per year up to 30 days max.',

    faqTitle: 'Frequently Asked Questions & Guide',
    faqSubtitle: 'Learn more about Taiwan Labor Law notice periods, effective dates, annual leave payouts, and job-seeking leave.',
    faqItems: [
      {
        q: 'Does the Taiwan resignation notice period include weekends and public holidays?',
        a: 'Yes. According to Ministry of Labor rulings and Taiwan judicial precedents, notice periods are calculated in calendar days (including weekends, National Holidays, and rest days). For example, a 10-day notice period consists of 10 consecutive calendar days starting from the day AFTER notice is given.',
      },
      {
        q: 'How are the notice start date, last working day, and effective resignation date calculated?',
        a: `Based on Taiwan Labor Standards Act (LSA) Article 16:

① Notice Date: The day you officially notify your employer (manager/HR).
② Notice Start Date: LSA uses Civil Code Art. 120 (first day excluded). Notice begins on the day AFTER notification.
③ Last Working Day: The final contractual employment date when the required notice days are fully satisfied.
④ Effective Resignation Date: The day AFTER the last working day, on which labor and health insurance policies are officially canceled/transferred.`,
      },
      {
        q: 'Can the official last working day be a weekend or national holiday? How does it differ from the last office day?',
        a: `Yes! The contractual last working day can fall on a weekend or public holiday.

Distinctions between key date concepts:
① Actual Last Office Day: The last day you physically attend the office and provide labor (e.g. Friday).
② Contractual Last Working Day: The last official day your employment contract remains active (can be set to Sunday), with salary and insurance calculated until 24:00 that day.
③ Effective Resignation Date: The date employment is officially terminated and insurance is canceled (the day after the last working day, e.g. Monday).`,
      },
      {
        q: 'If I have unused annual leave, do I have to work on my last day?',
        a: `No! As long as handovers are complete, you can take statutory annual leave on your final working day.

Options for handling annual leave:
① Taking Leave: You may take annual leave during the notice period (including the last day). You do not need to attend office on leave days, while salary and insurance remain valid through the last working day.
② Cashing Out: If you choose not to take leave, LSA Art. 38(4) mandates that employers must cash out 100% of unused annual leave days upon contract termination.`,
      },
      {
        q: 'Do employees with less than 3 months of tenure need to give notice? Does resignation require employer approval?',
        a: `Probation and resignation approval rules:

① Tenure < 3 Months: Under LSA Article 16, no statutory notice period is required for employment under 3 months.
② Employer Approval: Resignation is a unilateral right under Taiwan law. Once you give proper notice (via email or message), resignation takes effect automatically upon the end date without requiring approval.`,
      },
      {
        q: 'Who is entitled to paid Job-Seeking Leave during the notice period?',
        a: 'Under LSA Article 16(2), paid job-seeking leave (up to 2 days per week with full salary) applies ONLY when the employer terminates the employee (involuntary severance). Voluntary resignations do not qualify for paid job-seeking leave.',
      },
      {
        q: 'What happens if an employee fails to provide sufficient notice?',
        a: 'The employment contract still terminates on the announced date. However, if early departure causes direct, proven financial damages to the business (e.g. operational shutdown), the employer may seek civil compensation under Taiwan Civil Code. It is highly recommended to satisfy notice requirements or negotiate a mutual release.',
      },
      {
        q: 'What documents should I request from HR upon leaving?',
        a: `Ensure you request:

① Certificate of Service / Employment Certificate (LSA Art. 19 mandates employers cannot refuse issuing this).
② Health Insurance Cancellation/Transfer Form.
③ Voluntary Pension Contribution confirmation & Tax Withholding Statements.`,
      },
      {
        q: 'How is prorated salary calculated if resignation takes effect early? What if the employer asks me to leave earlier than the notice period ends? Must salary be paid on the final day?',
        a: `Salary calculations and worker rights for early departure:

① Prorated Salary Calculation: For monthly-salaried employees who work a partial month, salary must be calculated based on actual calendar days employed in that month (including working days, rest days, and statutory holidays). Employers CANNOT deduct pay for rest days and weekends.
② Effective Departure Date: The resignation date is the actual final date of employment. If both parties agree to end early, salary and labor/health insurance cancellation apply to that actual final day.
③ Employer Demanding Early Departure: If the employer requests the employee to leave earlier than the full notice period, the employer MUST pay notice compensation ("notice pay") for the remaining notice days under LSA Art. 16.
④ Salary Payday Regulations: Final month salary does not have to be paid in cash on the last day. The employer may disburse it on the scheduled regular payday. Employers CANNOT withhold pay under the pretext of incomplete handovers.`,
      },
    ],
  },
};
