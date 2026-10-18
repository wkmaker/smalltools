import styles from './ssl-converter.module.css';
import { TRANSLATIONS } from './translations';
import { buildUnifiedCertAnalysis } from './engine';

export type TabType = 'cer-chain-fix' | 'pfx-to-pem' | 'pem-to-pfx' | 'der-to-pem' | 'pem-to-der';

export interface OutputItem {
  filename: string;
  content: string;
  label: string;
  isPrivateKey?: boolean;
  contentPkcs1?: string;
  contentPkcs8?: string;
}

export interface MetaItem {
  label: string;
  value: string;
  className?: string;
}

export interface ResultData {
  meta: MetaItem[];
  outputs: OutputItem[];
  cnName?: string;
}

export function buildStandardMetaGrid(
  analysis: ReturnType<typeof buildUnifiedCertAnalysis>,
  t: typeof TRANSLATIONS['zh-TW'],
  extra?: { privateKeyStatus?: string }
): MetaItem[] {
  const meta: MetaItem[] = [
    { label: t.metaDomainCN, value: analysis.cn },
    { label: t.metaKeyAlgo, value: analysis.certAlgo, className: styles.statusSuccess },
    { label: t.metaIssuer, value: analysis.issuer },
    { label: t.metaNotBefore, value: analysis.notBeforeStr },
    {
      label: t.metaNotAfter,
      value: analysis.notAfterStr,
      className: analysis.isExpired ? styles.statusDanger : analysis.isNotYetValid ? styles.statusWarning : styles.statusSuccess,
    },
    {
      label: t.metaChainStatus,
      value: analysis.isComplete
        ? t.chainStatusComplete
        : analysis.nextAiaUrl
        ? t.chainStatusAiaUrl
        : analysis.chainPems.length > 1
        ? t.chainStatusPartial
        : t.chainStatusIncomplete,
      className: analysis.isComplete ? styles.statusSuccess : styles.statusWarning,
    },
  ];

  if (extra?.privateKeyStatus) {
    meta.push({
      label: t.metaPrivateKeyStatus,
      value: extra.privateKeyStatus,
      className: styles.statusSuccess,
    });
  }

  return meta;
}
