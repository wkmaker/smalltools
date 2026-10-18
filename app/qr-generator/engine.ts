export type ContentType = 'text' | 'wifi' | 'vcard' | 'event' | 'email' | 'sms' | 'tel';

export interface WifiConfig {
  ssid: string;
  pass: string;
  encryption: 'WPA' | 'WPA3' | 'WPA-EAP' | 'WEP' | 'nopass';
  hidden: boolean;
}

export interface VCardConfig {
  version: '3.0' | '4.0';
  lastName: string;
  firstName: string;
  nickname: string;
  org: string;
  dept: string;
  title: string;
  address: string;
  bday: string;
  phone: string;
  workPhone: string;
  email: string;
  url: string;
}

export interface EventConfig {
  summary: string;
  start: string;
  end: string;
  timezone: string;
  location: string;
  description: string;
}

export interface EmailConfig {
  to: string;
  subject: string;
  body: string;
}

export interface SmsConfig {
  phone: string;
  body: string;
}

export interface TelConfig {
  phone: string;
}

export function parseHexColor(val: string, fallback: string): string {
  const clean = val.replace('#', '');
  if (/^[0-9A-Fa-f]{3,6}$/.test(clean)) {
    return '#' + clean;
  }
  return fallback;
}

export function escapeWifiString(val: string): string {
  if (!val) return '';
  return val
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/:/g, '\\:')
    .replace(/,/g, '\\,');
}

export function toUtf8ByteString(str: string): string {
  try {
    return unescape(encodeURIComponent(str));
  } catch {
    return str;
  }
}

export function formatICalDate(dtStr: string, tz: string): string {
  if (!dtStr) return '';
  const clean = dtStr.replace(/[-:]/g, '');
  if (clean.includes('T')) {
    const [d, t] = clean.split('T');
    const timePadded = (t + '0000').slice(0, 6);
    const formatted = `${d}T${timePadded}`;
    if (tz === 'UTC') {
      return `${formatted}Z`;
    }
    return formatted;
  }
  return clean;
}

export function encodeQuotedPrintable(str: string): string {
  if (!str) return '';
  const encoder = new TextEncoder();
  const bytes = encoder.encode(str);
  let encoded = '';
  for (let i = 0; i < bytes.length; i++) {
    const b = bytes[i];
    if (
      (b >= 48 && b <= 57) ||
      (b >= 65 && b <= 90) ||
      (b >= 97 && b <= 122) ||
      b === 32 ||
      b === 45 ||
      b === 95
    ) {
      encoded += String.fromCharCode(b);
    } else {
      const hex = b.toString(16).toUpperCase();
      encoded += '=' + (hex.length === 1 ? '0' + hex : hex);
    }
  }
  return encoded;
}

export function buildWifiPayload(config: WifiConfig): string {
  const ssid = escapeWifiString(config.ssid.trim());
  const pass = escapeWifiString(config.pass.trim());
  const enc = config.encryption;
  const isHidden = config.hidden;

  if (!ssid) {
    return 'WIFI:S:WiFi_SSID;;';
  }
  let dataVal = `WIFI:S:${ssid};`;
  if (enc !== 'nopass') {
    dataVal += `T:${enc};P:${pass};`;
  } else {
    dataVal += `T:nopass;;`;
  }
  if (isHidden) {
    dataVal += `H:true;`;
  }
  dataVal += ';';
  return dataVal;
}

export function buildVCardPayload(config: VCardConfig): string {
  const ln = config.lastName.trim();
  const fn = config.firstName.trim();
  const nick = config.nickname.trim();
  const org = config.org.trim();
  const dept = config.dept.trim();
  const title = config.title.trim();
  const address = config.address.trim();
  const bday = config.bday.trim();
  const cellPhone = config.phone.trim();
  const workPhone = config.workPhone.trim();
  const email = config.email.trim();
  const url = config.url.trim();

  const hasChinese = /[\u4e00-\u9fa5]/.test(ln + fn + nick + org + dept + title + address);

  const fullName = hasChinese
    ? `${ln}${fn}`.trim() || fn || ln || 'Contact'
    : `${fn} ${ln}`.trim() || fn || ln || 'Contact';

  const ver = config.version;

  const lines: string[] = [
    'BEGIN:VCARD',
    `VERSION:${ver}`,
    `FN:${fullName}`,
    `N:${ln};${fn};;;`,
    `SORT-STRING:${fullName}`,
  ];

  if (hasChinese) {
    if (ln) lines.push(`X-PHONETIC-LAST-NAME:${ln}`);
    if (fn) lines.push(`X-PHONETIC-FIRST-NAME:${fn}`);
  }

  if (nick) lines.push(`NICKNAME:${nick}`);

  if (org && dept) {
    lines.push(`ORG:${org} / ${dept}`);
  } else if (org) {
    lines.push(`ORG:${org}`);
  } else if (dept) {
    lines.push(`ORG:${dept}`);
  }

  if (title) lines.push(`TITLE:${title}`);

  if (cellPhone) {
    lines.push(ver === '4.0' ? `TEL;TYPE=cell:${cellPhone}` : `TEL;TYPE=CELL:${cellPhone}`);
  }
  if (workPhone) {
    lines.push(ver === '4.0' ? `TEL;TYPE="work,voice":${workPhone}` : `TEL;TYPE=WORK,VOICE:${workPhone}`);
  }

  if (email) {
    lines.push(ver === '4.0' ? `EMAIL;TYPE=work:${email}` : `EMAIL;TYPE=INTERNET,WORK:${email}`);
  }
  if (url) lines.push(`URL:${url}`);
  if (address) {
    lines.push(ver === '4.0' ? `ADR;TYPE=work:;;${address};;;;` : `ADR;TYPE=WORK:;;${address};;;;`);
  }
  if (bday) lines.push(`BDAY:${bday}`);

  lines.push('END:VCARD');
  return lines.join('\r\n');
}

export function buildEventPayload(config: EventConfig): string {
  const lines: string[] = ['BEGIN:VCALENDAR', 'VERSION:2.0'];
  if (config.timezone && config.timezone !== 'LOCAL' && config.timezone !== 'UTC') {
    lines.push(`X-WR-TIMEZONE:${config.timezone}`);
  }
  lines.push('BEGIN:VEVENT');
  lines.push(`SUMMARY:${config.summary.trim() || 'Event'}`);

  if (config.start) {
    if (config.timezone && config.timezone !== 'LOCAL' && config.timezone !== 'UTC') {
      lines.push(`DTSTART;TZID=${config.timezone}:${formatICalDate(config.start, config.timezone)}`);
    } else {
      lines.push(`DTSTART:${formatICalDate(config.start, config.timezone)}`);
    }
  }

  if (config.end) {
    if (config.timezone && config.timezone !== 'LOCAL' && config.timezone !== 'UTC') {
      lines.push(`DTEND;TZID=${config.timezone}:${formatICalDate(config.end, config.timezone)}`);
    } else {
      lines.push(`DTEND:${formatICalDate(config.end, config.timezone)}`);
    }
  }

  if (config.location.trim()) lines.push(`LOCATION:${config.location.trim()}`);
  if (config.description.trim()) lines.push(`DESCRIPTION:${config.description.trim()}`);

  lines.push('END:VEVENT');
  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

export function buildEmailPayload(config: EmailConfig): string {
  const to = config.to.trim();
  const sub = config.subject.trim();
  const body = config.body.trim();
  let mailto = `mailto:${to}`;
  const params: string[] = [];
  if (sub) params.push(`subject=${encodeURIComponent(sub)}`);
  if (body) params.push(`body=${encodeURIComponent(body)}`);
  if (params.length > 0) {
    mailto += `?${params.join('&')}`;
  }
  return mailto || 'mailto:service@example.com';
}

export function buildSmsPayload(config: SmsConfig): string {
  const phone = config.phone.trim();
  const body = config.body.trim();
  let smsStr = `sms:${phone}`;
  if (body) {
    smsStr += `?body=${encodeURIComponent(body)}`;
  }
  return smsStr || 'sms:+886912345678';
}

export function buildTelPayload(config: TelConfig): string {
  const phone = config.phone.trim();
  return `tel:${phone}` || 'tel:+886212345678';
}
