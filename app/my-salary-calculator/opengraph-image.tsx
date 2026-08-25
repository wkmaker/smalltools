import { createToolOgImage, ogImageExports } from '@/app/utils/og-generator';

export const { dynamic, size, contentType } = ogImageExports;
export const alt = '薪資、勞保、健保、預扣稅計算機 - SALARY & INSURANCES CALCULATOR';

export default async function Image() {
  return createToolOgImage('my-salary-calculator', 'zh');
}
