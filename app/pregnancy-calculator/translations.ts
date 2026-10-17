/**
 * 孕期計算器頁面中英文案（從 PregnancyCalculatorClient.tsx 抽離，避免單檔過長）。
 */
export const TRANSLATIONS = {
  'zh-TW': {
    backToHome: '返回首頁',
    langToggle: 'English',
    langToggleUrl: '/pregnancy-calculator/en/',
    title: '孕期與產檢假計算機',
    subtitle: 'PREGNANCY & MATERNITY LEAVE CALCULATOR',
    description: '依醫學標準公式精算預產期、當前懷孕週數、40 週產檢里程碑與胎兒成長尺寸。整合台灣勞基法與性別平等工作法，一鍵試算產檢假 (8天)、產假 (8週)、育嬰留停津貼 (8成薪) 與勞保生育給付，並提供專業請假範本與待產包清單。',

    // 計算模式切換
    calcModeLabel: '推算基準模式',
    modeLmp: '最後月經首日 (LMP)',
    modeEdd: '已知預產期 (EDD)',
    modeUltrasound: '超音波週數校正',
    modeIvf: '試管植入 / 人工受孕 (IVF)',

    // 表單標籤
    lmpDateLabel: '最後一次月經第一天 (LMP)',
    cycleDaysLabel: '平均月經週期天數 (天)',
    eddDateLabel: '醫師評估預產期 (EDD)',
    scanDateLabel: '超音波檢查當日日期',
    scanInputTypeLabel: '超音波數據輸入方式',
    scanInputWeeks: '直接輸入胎兒週數 (週 + 天)',
    scanInputCrl: '輸入超音波照片 CRL 頭臀長 (mm)',
    scanWeeksLabel: '檢查時胎兒週數',
    scanDaysLabel: '天數',
    crlInputLabel: '超音波單上的 CRL 胎兒頭臀長 (mm)',
    crlPlaceholder: '如 45 (代表 4.5 cm)',
    crlCalculatedAge: '換算胎兒週數約為：',
    crlFormulaHint: '（採用 Hadlock 醫學公式：CRL 適用於懷孕 6~14 週，數值約 5~84 mm）',
    ivfDateLabel: '植入 / 受精取卵日期',
    ivfTypeLabel: '受精 / 植入類型',
    ivfTypeD5: 'Day 5 囊胚植入 (Blastocyst)',
    ivfTypeD3: 'Day 3 胚胎植入 (Cleavage)',
    ivfTypeEgg: '取卵日 / 受精日 (Egg Retrieval / IUI)',

    // 薪資與假別設定
    leaveSettingsTitle: '產假與津貼設定 (選填)',
    monthlySalaryLabel: '前 6 個月平均月投保薪資 (TWD)',
    monthlySalaryHelper: '依分娩或留停前 6 個月平均投保薪資計算（最高級距 45,800 元）',
    monthlySalaryPlaceholder: '請輸入月薪，如 45800',
    salaryTooltipBtnAria: '投保薪資計算基準說明',
    salaryTooltipTitle: '投保薪資試算基準說明',
    salaryTooltipLabor: '勞保生育給付：按「分娩當月起前 6 個月」平均月投保薪資，一次給付 2 個月（雙胞胎 4 個月）。',
    salaryTooltipParental: '育嬰留職停薪津貼：按「育嬰留停當月起前 6 個月」平均月投保薪資，每月發給 80%（最長 6 個月）。',
    salaryTooltipCap: '投保級距上限：若實際薪資高於 45,800 元，勞保最高投保級距為 45,800 元（試算公部門津貼請以 45,800 為上限輸入）。',
    leaveStartWeeksLabel: '預計開始請產假時間點',
    leaveStartOpt2Weeks: '產前 2 週開始休產假 (預產期前 14 天)',
    leaveStartOpt3Weeks: '產前 3 週開始休產假 (預產期前 21 天)',
    leaveStartOpt4Weeks: '產前 4 週開始休產假 (預產期前 28 天)',
    leaveStartOptDue: '預產期當日開始休產假',

    // 核心指標看板
    metricsTitle: '孕期即時健康與進度看板',
    metricEdd: '預估預產期 (EDD)',
    metricCurrentWeek: '目前懷孕週數',
    metricDaysRemaining: '距離預產期倒數',
    metricTrimester: '目前所處孕期',
    metricConception: '預估受孕日',
    daysUnit: '天',
    weeksUnit: '週',
    trimester1: '第一孕期 (早期 1~12週)',
    trimester2: '第二孕期 (中期 13~27週)',
    trimester3: '第三孕期 (晚期 28~40週+)',

    // 胎兒成長卡片
    babySizeTitle: '胎兒生長尺寸生動比喻',
    babyLengthLabel: '預估身長',
    babyWeightLabel: '預估體重',
    progressLabel: '40 週孕期進度',

    // 產檢時間軸
    timelineTitle: '40 週關鍵產檢與里程碑時間軸',
    timelineSubtitle: '按個人預產期推算之 9 大階段公費與自費產檢黃金檢查期',
    timelineNote: '衛教小叮嚀：本時間軸整合《孕婦健康手冊》14 次公費產檢、3 次公費超音波與關鍵自費篩檢時程。標註「公費補助」為國健署常規給付項目，「自費選做」則可依個人年齡、體質與主治醫師評估決定。',
    tagPast: '已完成',
    tagCurrent: '當前階段',
    tagFuture: '預計時程',
    tagNextUpcoming: '即將到來',
    tagPublic: '公費補助',
    tagSelfPaid: '自費選做',
    checkpointListLabel: '重點檢查與評估項目',

    // 即時階段導引 Banner
    stageStatusActiveBadge: '黃金檢查窗口進行中',
    stageStatusGapBadge: '生理平穩過渡期',
    stageStatusPreBadge: '早期著床確認期',
    stageStatusPostBadge: '足月待產階段',

    stageNextCountdownText: '距離下一階段「{nextTitle}」約剩 {days} 天（約 {weeks} 週）',
    stageNextCountdownTextDaysOnly: '距離下一階段「{nextTitle}」約剩 {days} 天',

    gapPre5Title: '受精卵著床與胚胎早期發育中',
    gapPre5Desc: '胎兒神經管與重要器官正迅速分化，請持續補充葉酸 400~600 微克。滿 5~8 週即可前往婦產科照超音波確認著床位置、心跳並領取媽媽手冊。',
    gap15Title: '第 15 週：邁入舒適孕中期過渡階段',
    gap15Desc: '第一孕期初唐與染色體篩檢已告一段落，即將邁入食慾好轉、精神恢復的第二孕期。可開始規劃 16~20 週的例行產檢與唐氏症/羊膜穿刺評估。',
    gapPost40Title: '已滿 40 週足月，隨時準備生產',
    gapPost40Desc: '已達預估預產期，請密切注意產兆（規則陣痛、破水、落紅），並依照主治醫師指示進行每週 1~2 次胎兒監視器 (NST) 追蹤或催生評估。',

    // 法定假別與津貼
    benefitsTitle: '台灣法定產檢假、產假與生育給付試算',
    benefitsToggleDesc: '（點擊展開/收合 8天產檢假、8週產假、生育給付與育嬰津貼明細）',
    checkupLeaveLabel: '有薪產檢假',
    checkupLeaveDesc: '依法享有 8 天全薪產檢假（可拆分半天或小時計）',
    maternityLeaveLabel: '法定產假',
    maternityLeaveDesc: '分娩前後共 8 週 (56天) 有薪產假（含例假日）',
    maternityLeavePeriod: '建議產假休假區間',
    expectedReturnDate: '預計產後復職工作日',
    paternityLeaveLabel: '配偶陪產檢及陪產假',
    paternityLeaveDesc: '配偶享有 7 天全薪假（產檢或分娩前後請畢）',
    laborInsuranceTitle: '勞保生育給付估算',
    laborInsuranceDesc: '一次給與 2 個月（60日）投保薪資',
    parentalLeaveTitle: '育嬰留職停薪津貼 (前 6 個月)',
    parentalLeaveDesc: '按投保薪資 8 成發給（60% 勞保津貼 + 20% 政府補助，最長半年）',
    approxUnit: '約 TWD',

    // 一鍵範本
    templateTitle: '一鍵生成請產檢假 / 產假申請範本 (Email / Line)',
    templateToggleDesc: '（預設收合，點擊展開完整申請信與交接範本）',
    templateCopyBtn: '複製請假申請範本',
    copiedSuccess: '已成功複製請假範本至剪貼簿！',
    shareLinkBtn: '複製試算分享連結',
    shareLinkCopied: '已成功複製試算分享連結！可直接傳給伴侶或家人。',
    btnExpand: '展開',
    btnCollapse: '收合',

    // Checklist (扣除前 4 週未驗孕期，5~36 週每 8 週一階段 + 最後 4 週足月衝刺，純列自行準備物品與規劃)
    checklistTitle: '孕期各階段自我準備與待產包 Check List',
    checklistSubtitle: '不重複上方產檢排程，專注於準爸媽「各階段該看什麼、買什麼、打包什麼」的實戰準備清單（前 4 階段每 8 週一單位 + 最後 4 週待命）',
    checkStage1: '第一階段 (5 ~ 12 週)：初期營養、生活調整與月子規劃',
    checkStage2: '第二階段 (13 ~ 20 週)：媽咪舒適穿搭與托育初步規劃',
    checkStage3: '第三階段 (21 ~ 28 週)：大型育兒設備實地試推與挑選定案',
    checkStage4: '第四階段 (29 ~ 36 週)：待產包打包、新生兒衣物清洗與交接',
    checkStage5: '第五階段 (37 ~ 40 週)：最後一個月大型設備採購安裝與足月待命',
    
    // 免責聲明
    disclaimerTitle: '專業醫療、營養補充與法規免責聲明',
    disclaimerDesc: '本計算機預產期與胎兒成長數據係依醫學平均值（Naegele\'s Rule 等）推算，僅供衛教與行程規劃參考，實際週數與生產時程請以產檢婦產科醫師超音波診斷為準。孕期所有維生素、礦物質、葉酸、DHA 等營養補充品之種類、劑量與服用時機，請務必諮詢婦產科專科醫師，並以個人醫囑指示為主。勞基法與勞保津貼給付標準以主管機關最新法規與勞保局實際核定金額為主。',

    // FAQ
    faqTitle: '常見問題與專業產檢指南 (FAQ)',
    faqSubtitle: '深入了解預產期推算原理、產檢假請假規定、產假 56 天計算與育嬰留停津貼',
    faqItems: [
      {
        q: '預產期 (EDD) 是如何計算的？為什麼跟實際生產日會有落差？',
        a: '醫學上最常用的標準公式為「奈格爾法則 (Naegele\'s Rule)」：以最後一次月經的第一天為基準，月份減 3 (或加 9)，日期加 7，並以 28 天月經週期計算（共 280 天 / 40 週）。\n\n由於每位女性排卵時間、受精卵著床時間及月經週期長短不同，只有約 5% 的孕婦會在預產期當天生產。通常在「懷孕滿 37 週至 41 週+6 天」之間生產皆屬正常足月分娩。婦產科醫師會在第 8~12 週產檢時透過超音波胎兒頭臀長 (CRL) 進行週數校正。',
      },
      {
        q: '產檢的檢查項目這麼多，我真的每一個都要做嗎？',
        a: '面對琳瑯滿目的公費與自費產檢項目，建議準爸媽以兩個核心原則來評估：\n\n① 首要原則：尊重婦產科醫生的專業判斷\n每位孕媽咪的年齡、體質、家族病史與胎兒發育狀況皆不同，主治醫師的專業判斷是誰都不能不聽從的第一準則。建議產檢時直接與醫師討論哪些是您現階段必須做或優先建議做的檢查。\n\n② 務實考量：評估自身的財力是否可以負擔\n除了國健署補助的公費產檢外，許多進階自費篩檢（如 NIPT、高層次超音波、基因檢測等）費用確實不低，務必考量家庭與自身的經濟負擔能力來做思考與取捨。\n\n【經驗分享】\n以我自己走過孕期的經驗來看，當時做各項檢查的確花了不少錢，但也很慶幸因為有做這些檢查，提早發現了許多潛在問題，讓我們能在早期就及時處理與解決。當然，產檢就跟「買保險」一樣——檢查出來全都正常、平安沒事最好，但這同時也是能夠提早發現狀況、大幅減低後續許多未知風險與問題的重要方式之一。',
      },
      {
        q: '台灣勞基法與性別平等工作法規定的「產檢假」有幾天？薪資如何計算？',
        a: '依《性別平等工作法》第 15 條規定：\n\n① 天數：女性受僱者妊娠期間，雇主應給予「產檢假 8 日」。\n② 給薪方式：產檢假期間「薪資照給 (全薪)」，且雇主不得視為缺勤而影響全勤獎金、考績或為其他不利處分。\n③ 彈性請假：產檢假可依勞工需求選擇以「半日」或「小時」為請假單位。雇主得向勞動部勞工保險局申請後 2 日之薪資補助。',
      },
      {
        q: '法定「產假 8 週 (56天)」包含例假日嗎？最晚何時必須開始請？',
        a: '依勞動基準法第 50 條規定：\n\n① 連續曆天計算：產假 8 星期係以「連續日曆天（Calendar Days）」計算，期間包含例假日、國定假日與休息日，非僅算工作日（共計 56 天）。\n② 請假時機：產假得在分娩前開始請，但「產前休假最多不得超過 4 週（28天）」，保留至少 4 週於分娩後休養。\n③ 給薪標準：在職工作滿 6 個月以上者「工資照給 (全薪)」；未滿 6 個月者「減半發給 (半薪)」。',
      },
      {
        q: '配偶的「陪產檢及陪產假」有幾天？請假期間與薪資規定為何？',
        a: '依性別平等工作法第 15 條第 5 項規定：\n\n① 天數：配偶享有「陪產檢及陪產假共 7 日」。\n② 薪資：7 日請假期間雇主應「全額照給薪資」。\n③ 請假期間：受僱者得於配偶妊娠產檢時、分娩當日及其前後合計 15 日之期間內，擇其中 7 日請假。',
      },
      {
        q: '勞保「生育給付」申請條件為何？可以領多少錢？',
        a: '女性參加勞工保險期間懷孕分娩，可向勞保局申請生育給付：\n\n① 資格條件：參加保險滿 280 日後分娩，或滿 181 日後早產。\n② 給付金額：按分娩當月起前 6 個月之平均月投保薪資，一次發給「2 個月（60日）」生育給付。\n③ 雙胞胎以上加倍：生雙胞胎發給 4 個月，三胞胎發給 6 個月，依此類推。',
      },
      {
        q: '育嬰留職停薪津貼（育嬰假）的 8 成薪如何發放？父母可以同時請領嗎？',
        a: '依性別平等工作法與就業保險法規定：\n\n① 請領資格：任職滿 6 個月且子女未滿 3 歲前，得申請育嬰留職停薪（最長至子女滿 3 歲止，合計不超過 2 年）。\n② 津貼金額：就業保險發給「60% 育嬰津貼」+ 政府加發「20% 育嬰留職停薪薪資補助」，合計達平均月投保薪資之「80% (8成薪)」，每一子女最長補助 6 個月。\n③ 父母同時請領：現行法規已開放父母「可以同時申請」育嬰留職停薪並同時請領 8 成津貼，大幅減輕育兒經濟壓力。',
      },
      {
        q: '本計算機的產假與津貼是依據哪裡的法律？非台灣地區適用嗎？',
        a: '本工具中的各項法定假別天數（8天產檢假、8週產假、7天陪產檢假）、勞保生育給付（2個月）及育嬰留職停薪津貼（8成薪），均是依據「台灣（中華民國）」現行之《勞動基準法》、《性別平等工作法》與《就業保險法》等法規進行設計與試算。\n\n【醫學計算部分】預產期推算、胎兒各週生長尺寸與關鍵產檢時程屬於國際通用之醫學常規，全球各地準爸媽皆可通用參考；\n\n【假別與津貼部分】若您身處香港、新加坡、馬來西亞、中國大陸、美加或歐洲等其他國家或地區，由於各地區之法定產假天數、育嬰留停政策與公部門津貼制度各有不同，假別與津貼試算結果僅供架構參考，具體權益請務必以您所在當地的勞動法規與社會保險制度為準。',
      },
      {
        q: '為什麼會開發這個「孕期計算機」？作者想對準爸媽說的話 [愛心]',
        a: '其實在剛接觸孕產這個領域時，面對繁複的醫學週數、檢查項目與法規津貼，我也常常感到手足無措、不懂具體該做些什麼。建立這個工具，就是希望能夠整理出清晰的時程與權益，幫助大家在懷孕與待產的這條路上一起安心成長。\n\n我也會隨著未來的自身經驗與各界回饋不斷修正與完善這個計算機。預祝全天下的夫妻都可以順利、平安、快樂地迎接一個健康可愛的寶貝！',
      },
    ],
  },
  'en': {
    backToHome: 'Back to Home',
    langToggle: '繁體中文',
    langToggleUrl: '/pregnancy-calculator/',
    title: 'Pregnancy & Maternity Leave Calculator',
    subtitle: 'DUE DATE, MILESTONES & MATERNITY BENEFITS',
    description: 'Calculate your estimated due date (EDD), current gestational age, 40-week clinical milestones, and fetal growth benchmarks. Easily estimate maternity leave, prenatal checkup leave, parental leave subsidies, and download professional email application templates.',

    // Mode
    calcModeLabel: 'Calculation Method',
    modeLmp: 'Last Menstrual Period (LMP)',
    modeEdd: 'Known Due Date (EDD)',
    modeUltrasound: 'Ultrasound Scan Dating',
    modeIvf: 'IVF / Embryo Transfer',

    // Form
    lmpDateLabel: 'First Day of Last Period (LMP)',
    cycleDaysLabel: 'Average Cycle Length (Days)',
    eddDateLabel: 'Estimated Due Date (EDD)',
    scanDateLabel: 'Ultrasound Scan Date',
    scanInputTypeLabel: 'Ultrasound Data Input Type',
    scanInputWeeks: 'Enter Gestational Weeks (Weeks + Days)',
    scanInputCrl: 'Enter Crown-Rump Length CRL (mm)',
    scanWeeksLabel: 'Gestational Weeks at Scan',
    scanDaysLabel: 'Days',
    crlInputLabel: 'Crown-Rump Length (CRL in mm)',
    crlPlaceholder: 'e.g. 45 (for 4.5 cm)',
    crlCalculatedAge: 'Calculated Gestational Age:',
    crlFormulaHint: '(Using Hadlock formula: CRL is most accurate between weeks 6-14, approx 5-84 mm)',
    ivfDateLabel: 'Transfer / Egg Retrieval Date',
    ivfTypeLabel: 'Transfer Type',
    ivfTypeD5: 'Day 5 Blastocyst Transfer',
    ivfTypeD3: 'Day 3 Cleavage Embryo Transfer',
    ivfTypeEgg: 'Egg Retrieval / IUI Date',

    // Salary & Leave
    leaveSettingsTitle: 'Leave & Benefits Settings (Optional)',
    monthlySalaryLabel: 'Avg. Monthly Insured Salary (6-Mo) (TWD)',
    monthlySalaryHelper: 'Based on 6-month pre-leave avg. insured wage (Taiwan labor cap: TWD 45,800)',
    monthlySalaryPlaceholder: 'e.g. 45800',
    salaryTooltipBtnAria: 'Insured wage calculation guidelines',
    salaryTooltipTitle: 'Insured Wage & Subsidy Guidelines',
    salaryTooltipLabor: 'Maternity Cash Benefit: 2 months of pre-childbirth 6-month average insured salary (4 months for twins).',
    salaryTooltipParental: 'Parental Leave Allowance: 80% of pre-leave 6-month average insured salary (up to 6 months per child).',
    salaryTooltipCap: 'Insured Salary Cap: If actual salary exceeds TWD 45,800, the maximum insured cap is TWD 45,800 in Taiwan.',
    leaveStartWeeksLabel: 'Planned Maternity Leave Start',
    leaveStartOpt2Weeks: '2 Weeks Before Due Date',
    leaveStartOpt3Weeks: '3 Weeks Before Due Date',
    leaveStartOpt4Weeks: '4 Weeks Before Due Date',
    leaveStartOptDue: 'On Due Date',

    // Metrics
    metricsTitle: 'Real-time Pregnancy Dashboard',
    metricEdd: 'Estimated Due Date',
    metricCurrentWeek: 'Current Gestational Age',
    metricDaysRemaining: 'Days Until Due Date',
    metricTrimester: 'Current Trimester',
    metricConception: 'Estimated Conception',
    daysUnit: 'Days',
    weeksUnit: 'Weeks',
    trimester1: '1st Trimester (Weeks 1-12)',
    trimester2: '2nd Trimester (Weeks 13-27)',
    trimester3: '3rd Trimester (Weeks 28-40+)',

    // Baby Size
    babySizeTitle: 'Fetal Growth & Size Benchmark',
    babyLengthLabel: 'Estimated Length',
    babyWeightLabel: 'Estimated Weight',
    progressLabel: '40-Week Pregnancy Progress',

    // Timeline
    timelineTitle: '40-Week Clinical Milestones Timeline',
    timelineSubtitle: '9 key prenatal checkup stages and screening windows tailored to your due date',
    timelineNote: 'Clinical Note: This 9-stage timeline integrates statutory public prenatal checkups (including 3 public ultrasounds) and key optional screenings. Items marked "Public" are covered by routine prenatal care, while "Optional" tests can be discussed with your OB-GYN.',
    tagPast: 'Completed',
    tagCurrent: 'Current Stage',
    tagFuture: 'Upcoming',
    tagNextUpcoming: 'Next Upcoming',
    tagPublic: 'Public',
    tagSelfPaid: 'Optional',
    checkpointListLabel: 'Key Checkups & Evaluations',

    // Current Stage Banner
    stageStatusActiveBadge: 'Active Screening Window',
    stageStatusGapBadge: 'Stable Growth Interval',
    stageStatusPreBadge: 'Early Implantation Phase',
    stageStatusPostBadge: 'Full-Term Delivery Phase',

    stageNextCountdownText: 'Approx. {days} days ({weeks} weeks) until next stage: "{nextTitle}"',
    stageNextCountdownTextDaysOnly: 'Approx. {days} days until next stage: "{nextTitle}"',

    gapPre5Title: 'Early Blastocyst Implantation & Development',
    gapPre5Desc: 'Vital neural tube and organ development in progress. Maintain daily folic acid intake. Schedule your 1st ultrasound at weeks 5-8 to confirm implantation, heartbeat, and obtain your handbook.',
    gap15Title: 'Week 15: Entering the Comfortable 2nd Trimester',
    gap15Desc: '1st trimester screenings complete. Approaching the comfortable second trimester. Prepare for routine 2nd-trimester checkups and quad screen / amniocentesis evaluation at weeks 16-20.',
    gapPost40Title: 'Full Term (40+ Weeks): Ready for Labor',
    gapPost40Desc: 'Due date reached. Watch for labor symptoms (contractions, water breaking, bloody show) and follow your obstetrician\'s monitoring or induction schedule.',

    // Benefits
    benefitsTitle: 'Maternity Leave & Statutory Benefits Estimation',
    benefitsToggleDesc: '(Click to expand/collapse prenatal leave & benefits breakdown)',
    checkupLeaveLabel: 'Paid Prenatal Checkup Leave',
    checkupLeaveDesc: '8 days of fully paid prenatal checkup leave (hourly or half-day increments)',
    maternityLeaveLabel: 'Statutory Maternity Leave',
    maternityLeaveDesc: '8 consecutive weeks (56 calendar days) of paid maternity leave',
    maternityLeavePeriod: 'Estimated Maternity Leave Period',
    expectedReturnDate: 'Expected Return to Work Date',
    paternityLeaveLabel: 'Paternity / Partner Leave',
    paternityLeaveDesc: '7 days of fully paid partner leave around childbirth',
    laborInsuranceTitle: 'Maternity Cash Benefit',
    laborInsuranceDesc: 'Lump-sum grant equal to 2 months of insured salary',
    parentalLeaveTitle: 'Parental Leave Allowance (Up to 6 Months)',
    parentalLeaveDesc: '80% of insured salary subsidy for up to 6 months per parent',
    approxUnit: 'Approx.',

    // Template
    templateTitle: 'One-Click Leave Application Template (Email / Message)',
    templateToggleDesc: '(Collapsed by default, click to expand application email template)',
    templateCopyBtn: 'Copy Application Template',
    copiedSuccess: 'Leave template copied to clipboard successfully!',
    shareLinkBtn: 'Copy Shareable Link',
    shareLinkCopied: 'Shareable calculation link copied to clipboard!',
    btnExpand: 'Expand',
    btnCollapse: 'Collapse',

    // Checklist (Starting Week 5: four 8-week stages + final 4 weeks, focused on self-preparation & shopping)
    checklistTitle: 'Stage-by-Stage Self-Preparation & Hospital Bag Checklist',
    checklistSubtitle: 'Focused entirely on what parents need to test, shortlist, buy, and pack—4 evenly spaced 8-week stages (Weeks 5-36) plus the final 4-week purchase & standby (Weeks 37-40)',
    checkStage1: 'Stage 1 (Weeks 5 - 12): Nutrition, Lifestyle & Confinement Booking',
    checkStage2: 'Stage 2 (Weeks 13 - 20): Maternity Comfort & Childcare Planning',
    checkStage3: 'Stage 3 (Weeks 21 - 28): Showroom Testing & Shortlisting Baby Gear',
    checkStage4: 'Stage 4 (Weeks 29 - 36): Hospital Bag Packing, Laundry & Handover',
    checkStage5: 'Stage 5 (Weeks 37 - 40): Final-Month Gear Purchase, Setup & Standby',

    // Disclaimer
    disclaimerTitle: 'Medical, Nutritional Supplements & Legal Disclaimer',
    disclaimerDesc: 'Calculations are based on standard clinical algorithms (e.g. Naegele\'s Rule) for educational and planning purposes. Actual due date and fetal development should always be confirmed by your OB-GYN via ultrasound. All nutritional supplements (such as folic acid, calcium, DHA, and prenatal vitamins), choices, and dosages MUST strictly follow your physician\'s instructions and medical advice. Statutory benefits and labor subsidies are subject to the latest official government regulations.',

    // FAQ
    faqTitle: 'Frequently Asked Questions & Guidelines (FAQ)',
    faqSubtitle: 'Everything you need to know about due date calculation, prenatal leave, and maternity allowances',
    faqItems: [
      {
        q: 'How is the Estimated Due Date (EDD) calculated? Why do actual delivery dates vary?',
        a: 'The most common standard is Naegele\'s Rule: 280 days (40 weeks) from the first day of the last menstrual period (LMP), assuming a 28-day cycle.\n\nOnly about 5% of babies are born precisely on their due date. Delivery between 37 and 42 weeks is considered full term. Ultrasound measurements (crown-rump length) in the first trimester are often used to refine the due date.',
      },
      {
        q: 'There are so many prenatal checkup items—do I really need to do every single one?',
        a: 'When facing numerous public and optional self-paid prenatal tests, parents-to-be can evaluate their choices through two core principles:\n\n① First Priority: Respect Your Doctor\'s Professional Judgment\nEvery pregnancy differs by maternal age, medical history, and fetal condition. Your OB-GYN\'s clinical judgment is paramount and must always be respected first. Discuss directly with your doctor which tests are medically necessary for your stage.\n\n② Practical Consideration: Assess What You Can Financially Afford\nBeyond government-funded routine checkups, advanced optional screenings (such as NIPT, detailed Level II anatomy ultrasound, or genetic panels) can be expensive. Weigh these options thoughtfully based on what your household budget can comfortably afford.\n\n[Personal Experience]\nFrom my own experience, doing all these prenatal tests admittedly cost quite a lot of money—yet I am genuinely glad we did them, because they helped us catch several issues early on so we could resolve them in time. Ultimately, prenatal testing is just like buying insurance: the best outcome is that nothing is wrong, but it is also one of the best ways to detect and reduce potential problems early.',
      },
      {
        q: 'How many days of paid prenatal checkup leave are granted by law?',
        a: 'Under gender equality labor laws (such as Taiwan Act of Gender Equality in Employment Article 15):\n\n① Duration: Female employees are entitled to 8 days of paid prenatal checkup leave.\n② Wage: Full salary is paid during checkup leaves.\n③ Flexibility: Checkup leave can be taken in increments of full days, half days, or hours.',
      },
      {
        q: 'Does the 8-week (56-day) maternity leave include weekends and holidays?',
        a: 'Yes, statutory 8-week maternity leave is counted in consecutive calendar days (56 days), including weekends and national holidays.\n\nEmployees with more than 6 months of tenure receive 100% full regular wages, while those with less than 6 months receive 50% wages.',
      },
      {
        q: 'How many days of paid paternity / partner leave are available?',
        a: 'Partners and spouses are entitled to 7 days of fully paid paternity and pregnancy checkup companion leave to support prenatal care and childbirth recovery.',
      },
      {
        q: 'What is the maternity insurance cash benefit and who qualifies?',
        a: 'Insured working mothers who have maintained active labor insurance for at least 280 days prior to delivery receive a lump-sum grant equivalent to 2 full months (60 days) of average monthly insured salary.',
      },
      {
        q: 'How does the 80% parental leave allowance work?',
        a: 'Eligible parents taking leave of absence to care for children under 3 years old receive up to 6 months of allowance at 80% of average insured wages (60% employment insurance + 20% government subsidy). Both parents can now apply concurrently.',
      },
      {
        q: 'Are the statutory maternity leave and subsidy calculations applicable outside Taiwan?',
        a: 'The leave entitlements (8 days prenatal checkup leave, 8 weeks maternity leave, 7 days partner leave), maternity cash benefits (2 months), and parental leave allowance (80% wage subsidy) in this tool are based on the labor laws of Taiwan (R.O.C.), including the Labor Standards Act, Act of Gender Equality in Employment, and Employment Insurance Act.\n\n[Medical Timelines & Milestones] The due date estimation, fetal growth size comparisons, and 40-week clinical ultrasound milestones follow universal obstetric standards and are globally applicable.\n\n[Leaves & Government Benefits] If you reside in other countries or regions (such as Hong Kong, Singapore, Malaysia, North America, the UK, or the EU), statutory maternity leave durations, paid paternity leave, and government parental subsidies vary significantly by jurisdiction. Please refer to your local employment regulations and statutory benefit systems for official eligibility.',
      },
      {
        q: 'Why was this pregnancy calculator developed? A message from the developer to parents-to-be [Warm Wishes]',
        a: 'When first stepping into the journey of pregnancy and prenatal care, facing intricate clinical milestones and statutory leave policies can feel overwhelming, and it is completely normal to feel uncertain about what to do next. I built this tool hoping to organize clear timelines, fetal growth milestones, and maternity benefits so we can all navigate this journey with peace of mind and grow together.\n\nI will continue refining and expanding this tool based on ongoing experiences and community feedback. Wishing all couples and families a smooth, joyful journey and the safe arrival of a happy, healthy baby!',
      },
    ],
  },
};
