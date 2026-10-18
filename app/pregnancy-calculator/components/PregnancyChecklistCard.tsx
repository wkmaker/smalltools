'use client';

import React from 'react';
import styles from '../pregnancy-calculator.module.css';

interface PregnancyChecklistCardProps {
  t: any;
  lang: 'zh-TW' | 'en';
  currentWeeks: number;
  checkedItems: Record<string, boolean>;
  onToggleCheck: (key: string) => void;
}

export default function PregnancyChecklistCard({
  t,
  lang,
  currentWeeks,
  checkedItems,
  onToggleCheck,
}: PregnancyChecklistCardProps) {
  const checklistGroups = [
    {
      key: 'stage1',
      title: t.checkStage1,
      weekBadgeZh: '5 ~ 12 週',
      weekBadgeEn: 'Weeks 5 - 12',
      isCurrentStage: currentWeeks <= 12,
      spanFullOnMd: false,
      items: [
        { id: 'folicAcid', labelZh: '備妥葉酸與孕初期營養補充品（劑量請依醫囑為主）', labelEn: 'Prepare folic acid & early prenatal vitamins (Consult doctor for dosage)' },
        { id: 'dietHabits', labelZh: '調整日常飲食與作息（戒菸酒、減少咖啡因、避免生食與未全熟肉蛋）', labelEn: 'Adjust daily diet & routine (avoid alcohol, tobacco & raw/undercooked foods)' },
        { id: 'confinementCenter', labelZh: '參觀與下訂月子中心（產後護理之家）或預約到府月嫂、月子餐', labelEn: 'Tour & book postpartum confinement center, postpartum nanny, or meal delivery' },
        { id: 'maternityBook', labelZh: '準備止吐舒緩小點心（蘇打餅、氣泡水）與防滑舒適平底鞋', labelEn: 'Prepare anti-nausea snacks (crackers, sparkling water) & non-slip flat shoes' },
        { id: 'skincareSwitch', labelZh: '檢視日常保養品與用藥成分（停用含 A 酸、高濃度水楊酸保養品與不明成藥）', labelEn: 'Review daily skincare & medications (avoid retinoids/vitamin A derivatives)' },
      ],
    },
    {
      key: 'stage2',
      title: t.checkStage2,
      weekBadgeZh: '13 ~ 20 週',
      weekBadgeEn: 'Weeks 13 - 20',
      isCurrentStage: currentWeeks >= 13 && currentWeeks <= 20,
      spanFullOnMd: false,
      items: [
        { id: 'nutrition', labelZh: '備妥孕中期營養品：鈣質、鐵質、維生素 D 與藻油/魚油 DHA（依醫囑為主）', labelEn: 'Prepare 2nd-trimester supplements: Calcium, Iron, Vit D & DHA (per doctor)' },
        { id: 'stretchMark', labelZh: '採購孕婦妊娠霜與撫紋油，養成每日早晚塗抹肚皮與大腿保養習慣', labelEn: 'Buy belly stretch-mark cream & oil for daily morning/night care' },
        { id: 'chromosomalScreen', labelZh: '添購無鋼圈孕哺內衣、托腹帶、孕婦褲與側睡月亮枕（減緩腰背壓力）', labelEn: 'Buy wireless maternity bras, belly support band, pants & pregnancy pillow' },
        { id: 'dentalScaling', labelZh: '預約孕婦健保洗牙與口腔檢查（健保補助每 90 天一次，孕中期躺診療椅最舒適）', labelEn: 'Schedule prenatal dental scaling & checkup (best done comfortably in 2nd trimester)' },
        { id: 'anatomyScan', labelZh: '討論產後育兒分工，提前參觀住家周邊托嬰中心（公托/準公共）或諮詢保母', labelEn: 'Discuss childcare division & tour local daycare centers or inquire nannies early' },
      ],
    },
    {
      key: 'stage3',
      title: t.checkStage3,
      weekBadgeZh: '21 ~ 28 週',
      weekBadgeEn: 'Weeks 21 - 28',
      isCurrentStage: currentWeeks >= 21 && currentWeeks <= 28,
      spanFullOnMd: false,
      items: [
        { id: 'babyStroller', labelZh: '實地試推與挑選嬰兒推車、揹帶（趁體力佳逛門市/婦幼展，實測收折、重量與車廂空間並定案型號）', labelEn: 'Test & shortlist baby strollers and carriers in-store (test folding, weight & trunk space)' },
        { id: 'babyCarSeat', labelZh: '選定新生兒汽車安全座椅 / 提籃，並一併評估「汽車隔熱紙 / 後座遮陽簾與後座寶寶觀察鏡」（列入清單最後買）', labelEn: 'Shortlist infant car seat / carrier, plus evaluate car window tint / sunshade & rear-facing baby mirror' },
        { id: 'babyCrib', labelZh: '丈量房間尺寸並挑選定案嬰兒床、透氣床墊與尿布台（預先規劃嬰兒睡眠安全動線）', labelEn: 'Measure room space & shortlist baby crib, breathable mattress & changing table' },
        { id: 'daycareSurvey', labelZh: '比較並選定奶瓶消毒烘乾鍋、調乳器 / 溫奶器與嬰兒澡盆（先定案清單，避免太早買佔空間與起算保固）', labelEn: 'Compare & shortlist bottle sterilizer, warmer & bathtub (finalize list first to save space & warranty)' },
        { id: 'babyNaming', labelZh: '預先構思寶寶名字 / 小名，並可預約「孕婦寫真留念」（建議 28~32 週肚型最圓潤且未水腫時拍攝）', labelEn: 'Brainstorm baby names / nicknames early & book maternity photoshoot (best shot at weeks 28-32)' },
      ],
    },
    {
      key: 'stage4',
      title: t.checkStage4,
      weekBadgeZh: '29 ~ 36 週',
      weekBadgeEn: 'Weeks 29 - 36',
      isCurrentStage: currentWeeks >= 29 && currentWeeks <= 36,
      spanFullOnMd: false,
      items: [
        { id: 'deliveryKit', labelZh: '打包待產包【媽媽衛生】：產褥墊、看護墊、免洗內褲、會陰沖洗瓶、衛生紙與拖鞋', labelEn: 'Pack Hospital Bag [Mom Hygiene]: maternity pads, underpads, disposable underwear, peri bottle & slippers' },
        { id: 'breastfeedingKit', labelZh: '打包待產包【哺育日用】：哺乳內衣、溢乳墊、羊脂膏、保溫杯、長充電線', labelEn: 'Pack Hospital Bag [Nursing & Daily]: nursing bras, pads, lanolin cream, thermos & long charger' },
        { id: 'gearSetup', labelZh: '採買新生兒耗材（奶瓶奶嘴、NB 尿布、洗沐乳、屁屁膏）並預先清洗紗布衣與包巾', labelEn: 'Buy newborn consumables (bottles, NB diapers, wash, diaper cream) & pre-wash gauze clothes/swaddles' },
        { id: 'newbornInsurance', labelZh: '拍攝孕婦寫真留念、申請彌月蛋糕 / 油飯試吃，並預先規劃「新生兒醫療保險」方案', labelEn: 'Take maternity photos, sample full-month gift cakes/meals & pre-plan newborn health insurance' },
        { id: 'leaveHandover', labelZh: '整理職場產假工作交接清單，並確認生產醫院待產流程與月子中心入住通知方式', labelEn: 'Prepare work maternity leave handover list & confirm hospital/confinement center check-in process' },
      ],
    },
    {
      key: 'stage5',
      title: t.checkStage5,
      weekBadgeZh: '37 ~ 40 週',
      weekBadgeEn: 'Weeks 37 - 40',
      isCurrentStage: currentWeeks >= 37,
      spanFullOnMd: true,
      items: [
        { id: 'babyClothes', labelZh: '最後一個月正式採購 / 安排到貨前期選定的「嬰兒推車、汽座提籃、遮陽簾與後視觀察鏡、嬰兒床、消毒鍋與溫奶器」', labelEn: 'Purchase / receive pre-selected stroller, car seat, sunshade/mirror, crib & sterilizer in the final month' },
        { id: 'carSeatInstall', labelZh: '完成嬰兒床組裝，並施工/安裝汽車隔熱紙或後座遮陽簾、將「安全座椅與後座寶寶觀察鏡」穩固鎖定於車內待命', labelEn: 'Assemble baby crib & install car window tint/sunshade, infant car seat, and rear baby mirror on standby' },
        { id: 'hospitalDocuments', labelZh: '備妥【入院隨身證件袋】（夫妻身分證、健保卡、媽媽手冊）與待產包，設定產房電話與叫車路線', labelEn: 'Prepare [Hospital Document Pouch] (both IDs, health cards, handbook) & hospital bag; save transport route' },
        { id: 'laborSignsCheck', labelZh: '隨時留意足月產兆（規則陣痛、破水、落紅），並確認住院期間家中大寶或寵物照顧後援', labelEn: 'Watch closely for labor signs (contractions, water breaking, bloody show) & confirm home/pet care backup' },
        { id: 'postpartumBenefits', labelZh: '備妥戶口名簿、印章與存摺影本（供產後報戶口、新生兒投保及申請生育給付/育嬰津貼）', labelEn: 'Prepare household registry, seals & bankbook copy for birth registration, baby insurance & benefit claims' },
      ],
    },
  ];

  return (
    <div className={styles.glassCard}>
      <div className="flex flex-col gap-1 mb-4">
        <h2 className={styles.cardTitle} style={{ marginBottom: 0 }}>
          <svg viewBox="0 0 24 24" width={20} height={20} fill="currentColor" className={styles.accentText}>
            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-9 14l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
          </svg>
          {t.checklistTitle}
        </h2>
        <p className="text-xs text-text-sub">{t.checklistSubtitle}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {checklistGroups.map((group) => {
          const doneCount = group.items.filter((i) => !!checkedItems[i.id]).length;
          return (
            <div
              key={group.key}
              className={`${styles.checklistGroupCard} ${
                group.isCurrentStage ? styles.checklistGroupCardActive : ''
              } ${group.spanFullOnMd ? 'md:col-span-2' : ''}`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-border-glass">
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`${styles.weekPill} ${group.isCurrentStage ? styles.weekPillActive : ''}`}>
                    {lang === 'zh-TW' ? group.weekBadgeZh : group.weekBadgeEn}
                  </span>
                  {group.isCurrentStage && (
                    <span className={styles.badge}>{t.tagCurrent}</span>
                  )}
                </div>
                <span className="text-xs font-mono text-text-sub">
                  {doneCount} / {group.items.length}
                </span>
              </div>

              <h3 className="text-sm font-bold text-text-main leading-snug">
                {group.title}
              </h3>

              <div className={group.spanFullOnMd ? 'grid grid-cols-1 md:grid-cols-2 gap-2.5' : 'flex flex-col gap-2.5'}>
                {group.items.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => onToggleCheck(item.id)}
                    className={`${styles.checklistItem} ${checkedItems[item.id] ? styles.checklistItemDone : ''} cursor-pointer`}
                  >
                    <input
                      type="checkbox"
                      checked={!!checkedItems[item.id]}
                      onChange={() => {}}
                      className="mt-0.5 accent-[#ff4081] shrink-0 pointer-events-none"
                    />
                    <span className={`${styles.checklistText} text-xs leading-relaxed text-text-main`}>
                      {lang === 'zh-TW' ? item.labelZh : item.labelEn}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
