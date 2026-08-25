import { createToolOgImage, ogImageExports } from '@/app/utils/og-generator';

export const { dynamic, size, contentType } = ogImageExports;
export const alt = '車貸試算器 - 免費線上汽車貸款月付金與利息計算機';

export default async function Image() {
  return createToolOgImage('car-loan', 'zh', {
    description:
      '專業免費的線上車貸試算器！支援本息均勻攤還與本金均勻攤還，\n精算每月月付金、利息支出總額、寬限期與完整還款明細表。',
    badgeList: ['免費即時試算', '完整攤還明細表', '實質年利率 APR 精算'],
  });
}
