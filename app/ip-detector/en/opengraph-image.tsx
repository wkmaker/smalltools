import { createToolOgImage, ogImageExports } from '@/app/utils/og-generator';

export const { dynamic, size, contentType } = ogImageExports;
export const alt = 'IP & Connection Diagnostic Tool - IP DIAGNOSTIC TOOL';

export default async function Image() {
  return createToolOgImage('ip-detector', 'en');
}
