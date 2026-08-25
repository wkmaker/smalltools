import { createToolOgImage, ogImageExports } from '@/app/utils/og-generator';

export const { dynamic, size, contentType } = ogImageExports;
export const alt = 'Lucky Wheel Spinner - LUCKY WHEEL SPINNER';

export default async function Image() {
  return createToolOgImage('lucky-wheel', 'en');
}
