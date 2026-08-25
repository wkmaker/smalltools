import { createToolOgImage, ogImageExports } from '@/app/utils/og-generator';

export const { dynamic, size, contentType } = ogImageExports;
export const alt = 'Salary, Tax & Insurance Calculator - SALARY & INSURANCES CALCULATOR';

export default async function Image() {
  return createToolOgImage('my-salary-calculator', 'en');
}
