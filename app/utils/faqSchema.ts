/**
 * faqSchema.ts
 * ──────────────────────────────────────────────────────────────
 * 伺服器端 (SSR) 與 Client 端通用 FAQPage JSON-LD 結構化資料產生器
 */

export interface FaqItem {
  q: string;
  a: string;
}

export function generateFaqSchema(items: FaqItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.a,
      },
    })),
  };
}
