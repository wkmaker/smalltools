/**
 * 懷孕計算機常數與胎兒成長尺寸對照表
 */

export interface BabySizeInfo {
  fruit: string;
  fruitEn: string;
  lengthCm: number;
  weightG: number;
  descZh: string;
  descEn: string;
}

export const FETAL_GROWTH_DATA: Record<number, BabySizeInfo> = {
  4: {
    fruit: '罌粟籽 (Poppy Seed)',
    fruitEn: 'Poppy Seed',
    lengthCm: 0.1,
    weightG: 0.1,
    descZh: '受精卵已成功著床，開始分化為胚胎與胎盤',
    descEn: 'Blastocyst implanting in the uterine lining',
  },
  8: {
    fruit: '覆盆莓 (Raspberry)',
    fruitEn: 'Raspberry',
    lengthCm: 1.6,
    weightG: 1,
    descZh: '心臟規律跳動，微小手腳指頭正在成形',
    descEn: 'Heart is beating steadily, tiny fingers and toes forming',
  },
  12: {
    fruit: '李子 (Plum)',
    fruitEn: 'Plum',
    lengthCm: 5.4,
    weightG: 14,
    descZh: '器官系統基本成形，反射神經開始運作',
    descEn: 'All vital organs formed, reflexes developing',
  },
  16: {
    fruit: '酪梨 (Avocado)',
    fruitEn: 'Avocado',
    lengthCm: 11.6,
    weightG: 100,
    descZh: '指紋已經形成，開始有微弱抓握反射',
    descEn: 'Fingerprints developed, begins sucking and grasping',
  },
  20: {
    fruit: '香蕉 (Banana)',
    fruitEn: 'Banana',
    lengthCm: 25.6,
    weightG: 300,
    descZh: '孕期過半！開始能清晰感覺到胎動',
    descEn: 'Halfway mark! Baby movements easily felt',
  },
  24: {
    fruit: '木瓜 (Papaya)',
    fruitEn: 'Papaya',
    lengthCm: 30.0,
    weightG: 600,
    descZh: '聽力發育完善，對外界聲音有反應',
    descEn: 'Inner ear fully developed, responds to sounds',
  },
  28: {
    fruit: '茄子 (Eggplant)',
    fruitEn: 'Eggplant',
    lengthCm: 37.6,
    weightG: 1000,
    descZh: '進入第三孕期，眼睛可以睜開眨眼',
    descEn: 'Enters 3rd trimester, can open and blink eyes',
  },
  32: {
    fruit: '鳳梨 (Pineapple)',
    fruitEn: 'Pineapple',
    lengthCm: 42.4,
    weightG: 1700,
    descZh: '骨骼逐漸變硬，皮下脂肪持續增厚',
    descEn: 'Bones hardening, accumulating body fat',
  },
  36: {
    fruit: '哈密瓜 (Cantaloupe)',
    fruitEn: 'Cantaloupe',
    lengthCm: 47.4,
    weightG: 2600,
    descZh: '肺部發育近乎成熟，胎位多已轉為頭位朝下',
    descEn: 'Lungs almost fully mature, mostly head-down position',
  },
  40: {
    fruit: '大西瓜 (Watermelon)',
    fruitEn: 'Watermelon',
    lengthCm: 51.2,
    weightG: 3400,
    descZh: '發育完全成熟的足月寶寶，準備誕生！',
    descEn: 'Full-term baby ready to meet the world!',
  },
};

export function getBabySizeInfo(gestationalWeeks: number): BabySizeInfo {
  const weeks = Math.max(4, Math.min(40, Math.round(gestationalWeeks)));
  const milestones = [4, 8, 12, 16, 20, 24, 28, 32, 36, 40];
  let closestWeek = 4;
  for (const m of milestones) {
    if (weeks >= m) closestWeek = m;
  }
  return FETAL_GROWTH_DATA[closestWeek] || FETAL_GROWTH_DATA[40];
}
