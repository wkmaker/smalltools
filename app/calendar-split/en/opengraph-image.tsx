import { createToolOgImage, ogImageExports } from '@/app/utils/og-generator';

export const { dynamic, size, contentType } = ogImageExports;
export const alt = 'Calendar ICS Splitter - GOOGLE CALENDAR ICS SPLITTER';

export default async function Image() {
  return createToolOgImage('calendar-split', 'en');
}
