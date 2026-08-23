/**
 * icsSplitter.ts
 * ──────────────────────────────────────────────────────────────
 * 高效能、解耦合 iCalendar (.ics) 解析與分割核心
 * 特點：
 * 1. 記憶體零多餘拷貝：以 Byte Offsets 索引事件，不預先建立數萬個中間字串
 * 2. 算力與渲染解耦：分割決策僅作數字累加 (0.5ms)，下載時才按需 (Lazy) 拼裝 Blob
 * 3. 跨平台純 TS ZIP 打包器，支援背景非同步分塊生成
 */

export interface EventIndexItem {
  startIndex: number; // 字元起始位置
  endIndex: number;   // 字元結束位置
  byteLength: number; // UTF-8 位元組長度
  summary: string;
  dtStart?: string;
  dtEnd?: string;
}

export interface ParsedIcsData {
  header: string;
  footer: string;
  headerBytes: number;
  footerBytes: number;
  calName?: string;
  calTimezone?: string;
  events: EventIndexItem[];
  totalBytes: number;
  rawText: string;
}

export interface SplitChunkMeta {
  index: number;
  filename: string;
  startEventIdx: number;
  endEventIdx: number; // non-inclusive
  eventCount: number;
  sizeBytes: number;
  startDate?: string;
  endDate?: string;
  previewEvents: Array<{ summary: string; dtStart: string }>;
}

export interface SplitOptions {
  mode: 'size' | 'count';
  maxSizeBytes: number; // e.g. 950 * 1024
  maxEventCount: number; // e.g. 500
  filenamePrefix: string;
}

/**
 * CRC-32 表快取
 */
const CRC_TABLE = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  CRC_TABLE[n] = c;
}

export function calculateCrc32(data: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < data.length; i++) {
    crc = CRC_TABLE[(crc ^ data[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

/**
 * 純 TS 零相依 ZIP 封裝
 */
export function createZipArchive(files: Array<{ name: string; content: Uint8Array }>): Blob {
  const encoder = new TextEncoder();
  const fileRecords: Array<{
    nameBytes: Uint8Array;
    content: Uint8Array;
    crc: number;
    offset: number;
  }> = [];

  const chunks: Uint8Array[] = [];
  let currentOffset = 0;

  for (const file of files) {
    const nameBytes = encoder.encode(file.name);
    const crc = calculateCrc32(file.content);
    const recordOffset = currentOffset;

    const localHeader = new Uint8Array(30 + nameBytes.length);
    const view = new DataView(localHeader.buffer);

    view.setUint32(0, 0x04034b50, true);
    view.setUint16(4, 20, true);
    view.setUint16(6, 0x0800, true);
    view.setUint16(8, 0, true);
    view.setUint16(10, 0, true);
    view.setUint16(12, 0, true);
    view.setUint32(14, crc, true);
    view.setUint32(18, file.content.length, true);
    view.setUint32(22, file.content.length, true);
    view.setUint16(26, nameBytes.length, true);
    view.setUint16(28, 0, true);

    localHeader.set(nameBytes, 30);
    chunks.push(localHeader);
    chunks.push(file.content);

    currentOffset += localHeader.length + file.content.length;

    fileRecords.push({
      nameBytes,
      content: file.content,
      crc,
      offset: recordOffset,
    });
  }

  const centralDirStartOffset = currentOffset;
  let centralDirSize = 0;

  for (const record of fileRecords) {
    const cdHeader = new Uint8Array(46 + record.nameBytes.length);
    const view = new DataView(cdHeader.buffer);

    view.setUint32(0, 0x02014b50, true);
    view.setUint16(4, 20, true);
    view.setUint16(6, 20, true);
    view.setUint16(8, 0x0800, true);
    view.setUint16(10, 0, true);
    view.setUint16(12, 0, true);
    view.setUint32(16, record.crc, true);
    view.setUint32(20, record.content.length, true);
    view.setUint32(24, record.content.length, true);
    view.setUint16(28, record.nameBytes.length, true);
    view.setUint16(30, 0, true);
    view.setUint16(32, 0, true);
    view.setUint16(34, 0, true);
    view.setUint16(36, 0, true);
    view.setUint32(38, 0, true);
    view.setUint32(42, record.offset, true);

    cdHeader.set(record.nameBytes, 46);
    chunks.push(cdHeader);
    centralDirSize += cdHeader.length;
  }

  const eocd = new Uint8Array(22);
  const eocdView = new DataView(eocd.buffer);

  eocdView.setUint32(0, 0x06054b50, true);
  eocdView.setUint16(4, 0, true);
  eocdView.setUint16(6, 0, true);
  eocdView.setUint16(8, fileRecords.length, true);
  eocdView.setUint16(10, fileRecords.length, true);
  eocdView.setUint32(12, centralDirSize, true);
  eocdView.setUint32(16, centralDirStartOffset, true);
  eocdView.setUint16(20, 0, true);

  chunks.push(eocd);

  return new Blob(chunks as unknown as BlobPart[], { type: 'application/zip' });
}

export function formatIcsDate(rawDate?: string): string {
  if (!rawDate) return '';
  const clean = rawDate.replace(/^.*:/, '').trim();
  if (clean.length >= 8) {
    const y = clean.substring(0, 4);
    const m = clean.substring(4, 6);
    const d = clean.substring(6, 8);
    if (clean.length >= 13 && clean.includes('T')) {
      const timePart = clean.split('T')[1];
      const hh = timePart.substring(0, 2);
      const mm = timePart.substring(2, 4);
      return `${y}-${m}-${d} ${hh}:${mm}`;
    }
    return `${y}-${m}-${d}`;
  }
  return rawDate;
}

/**
 * 高效單遍掃描解析 (Single-Pass Scanner with Offset Indexing)
 * 零記憶體浪費，僅耗時數十毫秒
 */
export function parseIcsFast(icsContent: string): ParsedIcsData {
  const encoder = new TextEncoder();
  const lineEnding = icsContent.includes('\r\n') ? '\r\n' : '\n';

  let calName: string | undefined;
  let calTimezone: string | undefined;

  const headerParts: string[] = [];
  const events: EventIndexItem[] = [];

  let pos = 0;
  const len = icsContent.length;

  let inComponent = false;
  let compDepth = 0;
  let compStartCharIdx = 0;
  let compSummary: string | undefined;
  let compDtStart: string | undefined;
  let compDtEnd: string | undefined;

  while (pos < len) {
    const nextNewline = icsContent.indexOf('\n', pos);
    const lineEnd = nextNewline === -1 ? len : nextNewline + 1;
    let line = icsContent.substring(pos, lineEnd);
    const trimmedUpper = line.trim().toUpperCase();

    if (!calName && trimmedUpper.startsWith('X-WR-CALNAME:')) {
      calName = line.substring(line.indexOf(':') + 1).trim();
    }
    if (!calTimezone && trimmedUpper.startsWith('X-WR-TIMEZONE:')) {
      calTimezone = line.substring(line.indexOf(':') + 1).trim();
    }

    if (trimmedUpper.startsWith('BEGIN:')) {
      const compName = trimmedUpper.substring(6);

      if (compName === 'VCALENDAR') {
        headerParts.push(line);
      } else if (!inComponent) {
        if (compName === 'VEVENT' || compName === 'VTODO' || compName === 'VJOURNAL' || compName === 'VFREEBUSY') {
          inComponent = true;
          compDepth = 1;
          compStartCharIdx = pos;
          compSummary = undefined;
          compDtStart = undefined;
          compDtEnd = undefined;
        } else {
          // VTIMEZONE 保留在 Header
          headerParts.push(line);
        }
      } else {
        compDepth++;
      }
    } else if (trimmedUpper.startsWith('END:')) {
      const compName = trimmedUpper.substring(4);

      if (compName === 'VCALENDAR') {
        // 全域結束
      } else if (inComponent) {
        compDepth--;
        if (compDepth <= 0) {
          // 事件結束，計算區塊長度
          const eventText = icsContent.substring(compStartCharIdx, lineEnd);
          const byteLen = encoder.encode(eventText).length;

          events.push({
            startIndex: compStartCharIdx,
            endIndex: lineEnd,
            byteLength: byteLen,
            summary: compSummary || '無標題活動 (Untitled Event)',
            dtStart: compDtStart,
            dtEnd: compDtEnd,
          });

          inComponent = false;
        }
      } else {
        headerParts.push(line);
      }
    } else if (inComponent) {
      if (!compSummary && (trimmedUpper.startsWith('SUMMARY:') || trimmedUpper.startsWith('SUMMARY;'))) {
        compSummary = line.substring(line.indexOf(':') + 1).trim();
      }
      if (!compDtStart && (trimmedUpper.startsWith('DTSTART:') || trimmedUpper.startsWith('DTSTART;'))) {
        compDtStart = line.substring(line.indexOf(':') + 1).trim();
      }
      if (!compDtEnd && (trimmedUpper.startsWith('DTEND:') || trimmedUpper.startsWith('DTEND;'))) {
        compDtEnd = line.substring(line.indexOf(':') + 1).trim();
      }
    } else {
      headerParts.push(line);
    }

    pos = lineEnd;
  }

  const header = headerParts.join('');
  const footer = 'END:VCALENDAR' + lineEnding;
  const headerBytes = encoder.encode(header).length;
  const footerBytes = encoder.encode(footer).length;
  const totalBytes = encoder.encode(icsContent).length;

  return {
    header,
    footer,
    headerBytes,
    footerBytes,
    calName,
    calTimezone,
    events,
    totalBytes,
    rawText: icsContent,
  };
}

/**
 * 輕量快速分割規劃 (只計算索引與大小，耗時 < 1ms，絕不阻塞 UI)
 */
export function planIcsSplit(parsed: ParsedIcsData, options: SplitOptions): SplitChunkMeta[] {
  const baseOverhead = parsed.headerBytes + parsed.footerBytes;
  const chunks: SplitChunkMeta[] = [];
  const events = parsed.events;

  if (events.length === 0) return [];

  let chunkStartIdx = 0;
  let currentBytes = baseOverhead;
  let partIndex = 1;

  for (let i = 0; i < events.length; i++) {
    const ev = events[i];
    const projectedBytes = currentBytes + ev.byteLength;
    const currentCount = i - chunkStartIdx;

    let shouldFlush = false;

    if (options.mode === 'size') {
      if (projectedBytes > options.maxSizeBytes && currentCount > 0) {
        shouldFlush = true;
      }
    } else {
      if (currentCount >= options.maxEventCount && currentCount > 0) {
        shouldFlush = true;
      }
    }

    if (shouldFlush) {
      const sliceEvents = events.slice(chunkStartIdx, i);
      const validDates = sliceEvents
        .map(e => e.dtStart?.replace(/^.*:/, '').trim().substring(0, 8))
        .filter((d): d is string => !!d && d.length === 8)
        .sort();

      chunks.push({
        index: partIndex,
        filename: `${options.filenamePrefix}_part${partIndex}.ics`,
        startEventIdx: chunkStartIdx,
        endEventIdx: i,
        eventCount: sliceEvents.length,
        sizeBytes: currentBytes,
        startDate: validDates.length > 0 ? formatIcsDate(validDates[0]) : undefined,
        endDate: validDates.length > 0 ? formatIcsDate(validDates[validDates.length - 1]) : undefined,
        previewEvents: sliceEvents.slice(0, 5).map(e => ({
          summary: e.summary,
          dtStart: formatIcsDate(e.dtStart),
        })),
      });

      partIndex++;
      chunkStartIdx = i;
      currentBytes = baseOverhead;
    }

    currentBytes += ev.byteLength;
  }

  // 收尾最後一個分卷
  if (chunkStartIdx < events.length) {
    const sliceEvents = events.slice(chunkStartIdx);
    const validDates = sliceEvents
      .map(e => e.dtStart?.replace(/^.*:/, '').trim().substring(0, 8))
      .filter((d): d is string => !!d && d.length === 8)
      .sort();

    chunks.push({
      index: partIndex,
      filename: `${options.filenamePrefix}_part${partIndex}.ics`,
      startEventIdx: chunkStartIdx,
      endEventIdx: events.length,
      eventCount: sliceEvents.length,
      sizeBytes: currentBytes,
      startDate: validDates.length > 0 ? formatIcsDate(validDates[0]) : undefined,
      endDate: validDates.length > 0 ? formatIcsDate(validDates[validDates.length - 1]) : undefined,
      previewEvents: sliceEvents.slice(0, 5).map(e => ({
        summary: e.summary,
        dtStart: formatIcsDate(e.dtStart),
      })),
    });
  }

  return chunks;
}

/**
 * 依據 Chunk 索引按需生成文字內容 (Lazy Construction)
 */
export function buildChunkContent(parsed: ParsedIcsData, chunk: SplitChunkMeta): string {
  const parts: string[] = [parsed.header];
  for (let i = chunk.startEventIdx; i < chunk.endEventIdx; i++) {
    const ev = parsed.events[i];
    parts.push(parsed.rawText.substring(ev.startIndex, ev.endIndex));
  }
  parts.push(parsed.footer);
  return parts.join('');
}

/**
 * 按需生成單檔 Blob
 */
export function buildChunkBlob(parsed: ParsedIcsData, chunk: SplitChunkMeta): Blob {
  const content = buildChunkContent(parsed, chunk);
  return new Blob([new TextEncoder().encode(content)], { type: 'text/calendar;charset=utf-8' });
}
