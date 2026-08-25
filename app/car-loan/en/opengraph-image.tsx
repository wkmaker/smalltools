import { createToolOgImage, ogImageExports } from '@/app/utils/og-generator';

export const { dynamic, size, contentType } = ogImageExports;
export const alt = 'Car Loan Calculator - Auto Loan Monthly Payment & Interest Rate';

export default async function Image() {
  return createToolOgImage('car-loan', 'en', {
    description:
      'Free online auto loan calculator supporting standard & equal principal amortization.\nAccurately calculate monthly payments, total interest, APR, and amortization schedules.',
    badgeList: ['100% Free & Online', 'Amortization Schedule', 'Instant APR Solver'],
  });
}
