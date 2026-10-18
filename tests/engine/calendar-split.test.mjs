import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatIcsDate,
  parseIcsFast,
  planIcsSplit,
  buildChunkBlob,
} from '../../app/calendar-split/icsSplitter.ts';

const SAMPLE_ICS = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Smalltools//Calendar Splitter//EN
X-WR-CALNAME:公司專案行事曆
X-WR-TIMEZONE:Asia/Taipei
BEGIN:VEVENT
UID:evt-001@cjkuo.net
DTSTAMP:20261018T000000Z
DTSTART;TZID=Asia/Taipei:20261018T090000
DTEND;TZID=Asia/Taipei:20261018T100000
SUMMARY:團隊晨會
DESCRIPTION:每週專案進度同步會議
END:VEVENT
BEGIN:VEVENT
UID:evt-002@cjkuo.net
DTSTAMP:20261018T000000Z
DTSTART:20261019T143000Z
DTEND:20261019T153000Z
SUMMARY:架構審查會
DESCRIPTION:討論前後端解耦與 BigNumber 精度
END:VEVENT
BEGIN:VEVENT
UID:evt-003@cjkuo.net
DTSTAMP:20261018T000000Z
DTSTART:20261020
SUMMARY:全天專案交付日
END:VEVENT
END:VCALENDAR`;

test('formatIcsDate: 正確解析與格式化不同型態的 iCalendar 日期字串', () => {
  assert.equal(formatIcsDate('20261018T090000'), '2026-10-18 09:00');
  assert.equal(formatIcsDate('TZID=Asia/Taipei:20261018T143000'), '2026-10-18 14:30');
  assert.equal(formatIcsDate('20261020'), '2026-10-20');
  assert.equal(formatIcsDate('VALUE=DATE:20261025'), '2026-10-25');
  assert.equal(formatIcsDate(''), '');
});

test('parseIcsFast: 高效解析行事曆頭尾與事件位元組索引', () => {
  const parsed = parseIcsFast(SAMPLE_ICS);

  assert.equal(parsed.calName, '公司專案行事曆');
  assert.equal(parsed.calTimezone, 'Asia/Taipei');
  assert.equal(parsed.events.length, 3);

  // 驗證第一個事件
  assert.equal(parsed.events[0].summary, '團隊晨會');
  assert.equal(parsed.events[0].dtStart, '20261018T090000');
  assert.ok(parsed.events[0].byteLength > 0);

  // 驗證第二個事件
  assert.equal(parsed.events[1].summary, '架構審查會');
  assert.equal(parsed.events[1].dtStart, '20261019T143000Z');

  // 驗證第三個事件（全天事件無時間）
  assert.equal(parsed.events[2].summary, '全天專案交付日');
  assert.equal(parsed.events[2].dtStart, '20261020');

  // 驗證標頭與結尾
  assert.ok(parsed.header.includes('BEGIN:VCALENDAR'));
  assert.ok(parsed.header.includes('X-WR-CALNAME:公司專案行事曆'));
  assert.ok(parsed.footer.includes('END:VCALENDAR'));
});

test('planIcsSplit: 筆數模式 (count) 正確切分區塊', () => {
  const parsed = parseIcsFast(SAMPLE_ICS);
  const chunks = planIcsSplit(parsed, {
    mode: 'count',
    maxEventCount: 2,
    maxSizeBytes: 1024 * 1024,
    filenamePrefix: 'test_cal',
  });

  // 3 個事件以每組 2 筆切分，應產生 2 個區塊
  assert.equal(chunks.length, 2);
  assert.equal(chunks[0].eventCount, 2);
  assert.equal(chunks[0].filename, 'test_cal_part1.ics');
  assert.equal(chunks[1].eventCount, 1);
  assert.equal(chunks[1].filename, 'test_cal_part2.ics');
});

test('planIcsSplit: 檔案大小模式 (size) 邊界測試', () => {
  const parsed = parseIcsFast(SAMPLE_ICS);
  // 設定較小的 maxSizeBytes，迫使每筆事件獨立成一個 chunk
  const chunks = planIcsSplit(parsed, {
    mode: 'size',
    maxSizeBytes: parsed.headerBytes + parsed.footerBytes + parsed.events[0].byteLength + 10,
    maxEventCount: 100,
    filenamePrefix: 'split',
  });

  assert.ok(chunks.length >= 2, '應依大小限制切出至少 2 個區塊');
  assert.equal(chunks[0].filename, 'split_part1.ics');
});

test('buildChunkBlob: 按需重新組裝完整且合規的 iCalendar 分割檔案', async () => {
  const parsed = parseIcsFast(SAMPLE_ICS);
  const chunks = planIcsSplit(parsed, {
    mode: 'count',
    maxEventCount: 1,
    maxSizeBytes: 1024 * 1024,
    filenamePrefix: 'single',
  });

  const blob = buildChunkBlob(parsed, chunks[0]);
  const text = await blob.text();

  assert.ok(text.startsWith('BEGIN:VCALENDAR'));
  assert.ok(text.includes('SUMMARY:團隊晨會'));
  assert.ok(!text.includes('SUMMARY:架構審查會'), '第一分塊不應包含第二個事件');
  assert.ok(text.endsWith('END:VCALENDAR\n') || text.endsWith('END:VCALENDAR\r\n'));
});
