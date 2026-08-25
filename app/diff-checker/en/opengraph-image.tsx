import { createToolOgImage, ogImageExports } from '@/app/utils/og-generator';

export const { dynamic, size, contentType } = ogImageExports;
export const alt = 'Document Diff Checker - DOCUMENT DIFF CHECKER';

export default async function Image() {
  return createToolOgImage('diff-checker', 'en');
}
