/**
 * 全站贊助與芳名錄核心設定
 * 
 * 遵照規範：
 * 1. 嚴禁任何原生 Unicode Emoji（一律透過前端 SVG 向量圖示渲染）
 * 2. 100% 雙語對稱
 * 3. 靜態可配置，支援無伺服器架構
 */

export const STRIPE_DONATION_URL =
  'https://donate.stripe.com/fZufZh4sI3xf4KheFc3ZK00?client_reference_id=smalltools';

export interface SponsorItem {
  id: string;
  name: string;
  amount?: string;
  message?: string;
  date: string; // YYYY-MM
  tool?: string;
}

/**
 * 贊助者芳名錄資料清單
 * 收到新贊助時，直接於此處追加記錄即可隨靜態建置更新
 */
export const SPONSORS: SponsorItem[] = [
  // 收到贊助時隨手追加格式範例：
  // {
  //   id: 'sp-001',
  //   name: '匿名工程師',
  //   amount: 'NT$ 100',
  //   message: '離職計算機幫了大忙，感謝作者！',
  //   date: '2026-10',
  //   tool: '離職預告期計算機'
  // }
];

export const SPONSOR_CONFIG = {
  'zh-TW': {
    wallTitle: '贊助芳名錄',
    wallSubtitle: '感謝每一位溫暖相挺的好友，陪伴 Smalltools 獨立開源成長',
    emptyTitle: '目前累積贊助：0 筆',
    emptyDesc:
      '第一位贊助者虛位以待！本站所有工具堅持無廣告干擾、純靜態且終身免費維護。歡迎成為解鎖本站第一筆贊助的創始大神！',
    emptyBtn: '成為第一位創始贊助者',
    ctaBtn: '請作者喝杯咖啡',
    anonymous: '匿名好友',
    countBadge: (count: number) => `已累積 ${count} 位支持者`,
  },
  en: {
    wallTitle: 'Sponsor Wall',
    wallSubtitle: 'Heartfelt thanks to every supporter empowering Smalltools open-source journey',
    emptyTitle: 'Total Contributions: 0',
    emptyDesc:
      'The founding spot awaits! All tools here are ad-free, 100% static, and maintained for free. Be the pioneer who unlocks the very first sponsorship!',
    emptyBtn: 'Become the Founding Supporter',
    ctaBtn: 'Buy Author a Coffee',
    anonymous: 'Anonymous Friend',
    countBadge: (count: number) => `${count} Supporter${count === 1 ? '' : 's'} so far`,
  },
};
