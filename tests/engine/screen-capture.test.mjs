import test from 'node:test';
import assert from 'node:assert/strict';
import {
  MIME_CANDIDATES,
  pickSupportedMimeType,
  baseMimeType,
  mimeToExtension,
  isWebmMime,
  buildRecordingFileName,
  sanitizeFps,
  sanitizeBitratePreset,
  bitrateOf,
  minutesPerGigabyte,
  formatDuration,
  computeLevelFromSamples,
  patchWebmDuration,
  readWebmDurationMs,
  fixWebmBlobDuration,
  isTrustedPrv5Ready,
  buildPrv5FilePayload,
  PRV5_ORIGIN,
  PRV5_OPEN_URL,
  PRV5_FILE_MESSAGE_TYPE,
} from '../../app/screen-capture/engine.ts';

// ── 測試用 EBML 組裝工具 ────────────────────────────────

function bytes(...arr) {
  return Uint8Array.from(arr);
}

function concat(...parts) {
  const total = parts.reduce((s, p) => s + p.length, 0);
  const out = new Uint8Array(total);
  let o = 0;
  for (const p of parts) {
    out.set(p, o);
    o += p.length;
  }
  return out;
}

/** 以 1 byte size 組出 EBML 元素（測試資料皆 < 127 bytes） */
function el(idBytes, payload) {
  assert.ok(payload.length < 127);
  return concat(Uint8Array.from(idBytes), bytes(0x80 | payload.length), payload);
}

const EBML_HEADER = el([0x1a, 0x45, 0xdf, 0xa3], el([0x42, 0x82], new TextEncoder().encode('webm')));
const TIMECODE_SCALE_1MS = el([0x2a, 0xd7, 0xb1], bytes(0x0f, 0x42, 0x40)); // 1,000,000
const MUXING_APP = el([0x4d, 0x80], new TextEncoder().encode('Chrome'));
const TRACKS = el([0x16, 0x54, 0xae, 0x6b], bytes(0xae, 0x80));
const CLUSTER_HEAD = bytes(0x1f, 0x43, 0xb6, 0x75, 0x01, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff);
const UNKNOWN_SEGMENT = concat(bytes(0x18, 0x53, 0x80, 0x67), bytes(0x01, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff));

function chromeLikeWebm(infoPayload = concat(TIMECODE_SCALE_1MS, MUXING_APP)) {
  return concat(EBML_HEADER, UNKNOWN_SEGMENT, el([0x15, 0x49, 0xa9, 0x66], infoPayload), TRACKS, CLUSTER_HEAD);
}

// ── 編碼格式 ────────────────────────────────────────────

test('pickSupportedMimeType：依優先順序挑選第一個支援格式', () => {
  assert.equal(pickSupportedMimeType(() => true), 'video/webm;codecs=vp9,opus');
  assert.equal(pickSupportedMimeType(m => m.startsWith('video/mp4')), 'video/mp4;codecs=avc1');
  assert.equal(pickSupportedMimeType(m => m === 'video/webm'), 'video/webm');
  assert.equal(pickSupportedMimeType(() => false), '');
  assert.deepEqual([...MIME_CANDIDATES].slice(0, 2), ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus']);
});

test('pickSupportedMimeType：嗅探函式丟例外時視為不支援並繼續', () => {
  const origWarn = console.warn;
  console.warn = () => {};
  try {
    const result = pickSupportedMimeType(m => {
      if (m.includes('vp9')) throw new Error('boom');
      return m.includes('vp8');
    });
    assert.equal(result, 'video/webm;codecs=vp8,opus');
  } finally {
    console.warn = origWarn;
  }
});

test('baseMimeType / mimeToExtension / isWebmMime', () => {
  assert.equal(baseMimeType('video/webm;codecs=vp9,opus'), 'video/webm');
  assert.equal(baseMimeType('VIDEO/MP4; codecs=avc1'), 'video/mp4');
  assert.equal(baseMimeType(''), 'video/webm');
  assert.equal(mimeToExtension('video/mp4;codecs=avc1'), 'mp4');
  assert.equal(mimeToExtension('video/webm'), 'webm');
  assert.equal(mimeToExtension(''), 'webm');
  assert.equal(isWebmMime('video/webm;codecs=vp8'), true);
  assert.equal(isWebmMime('video/mp4'), false);
});

test('buildRecordingFileName：本地時間 YYYYMMDD-HHmmss 格式', () => {
  const d = new Date(2026, 9, 30, 19, 30, 5);
  assert.equal(buildRecordingFileName(d, 'webm'), 'screen-recording-20261030-193005.webm');
  assert.equal(buildRecordingFileName(d, 'MP4'), 'screen-recording-20261030-193005.mp4');
  // 非法副檔名回退 webm，避免路徑字元注入
  assert.equal(buildRecordingFileName(d, '../evil'), 'screen-recording-20261030-193005.webm');
  assert.match(buildRecordingFileName(new Date('invalid'), 'webm'), /^screen-recording-\d{8}-\d{6}\.webm$/);
});

// ── 畫質設定 ────────────────────────────────────────────

test('sanitizeFps / sanitizeBitratePreset：非法值回退預設', () => {
  assert.equal(sanitizeFps(60), 60);
  assert.equal(sanitizeFps('30'), 30);
  assert.equal(sanitizeFps(' 60 '), 60);
  assert.equal(sanitizeFps(120), 30);
  assert.equal(sanitizeFps('Infinity'), 30);
  assert.equal(sanitizeFps(null), 30);
  assert.equal(sanitizeBitratePreset('high'), 'high');
  assert.equal(sanitizeBitratePreset(' SAVER '), 'saver');
  assert.equal(sanitizeBitratePreset('ultra'), 'standard');
  assert.equal(sanitizeBitratePreset(undefined), 'standard');
});

test('bitrateOf：對應 5 / 2.5 / 1 Mbps', () => {
  assert.equal(bitrateOf('high'), 5_000_000);
  assert.equal(bitrateOf('standard'), 2_500_000);
  assert.equal(bitrateOf('saver'), 1_000_000);
});

test('minutesPerGigabyte：名目位元率換算每 GB 分鐘數', () => {
  // (1024^3 * 8) / (2,500,000 + 128,000) / 60 ≈ 54.47
  assert.equal(minutesPerGigabyte(2_500_000), 54);
  assert.equal(minutesPerGigabyte(1_000_000, 0), 143);
  assert.equal(minutesPerGigabyte(0, 0), 0);
  assert.equal(minutesPerGigabyte(Number.NaN), 0);
});

// ── 時間與音量 ──────────────────────────────────────────

test('formatDuration：HH:MM:SS 並防護負值與非有限值', () => {
  assert.equal(formatDuration(0), '00:00:00');
  assert.equal(formatDuration(999), '00:00:00');
  assert.equal(formatDuration(61_000), '00:01:01');
  assert.equal(formatDuration(3_723_000), '01:02:03');
  assert.equal(formatDuration(-5), '00:00:00');
  assert.equal(formatDuration(Number.POSITIVE_INFINITY), '00:00:00');
  assert.equal(formatDuration(Number.NaN), '00:00:00');
});

test('computeLevelFromSamples：靜音為 0、滿幅為 1、中間值落在區間內', () => {
  assert.equal(computeLevelFromSamples(new Float32Array(128)), 0);
  assert.equal(computeLevelFromSamples([]), 0);
  assert.equal(computeLevelFromSamples(new Float32Array(128).fill(1)), 1);
  // RMS 0.1 => -20 dB => (60-20)/60
  const level = computeLevelFromSamples(new Float32Array(128).fill(0.1));
  assert.ok(Math.abs(level - 40 / 60) < 1e-6);
  // 非有限值不應造成 NaN
  assert.equal(Number.isNaN(computeLevelFromSamples([Number.NaN, 0.5])), false);
});

// ── WebM 時長補寫 ──────────────────────────────────────

test('patchWebmDuration：Chrome 型檔頭（未知長度 Segment）成功補上 Duration', () => {
  const head = chromeLikeWebm();
  assert.equal(readWebmDurationMs(head), null);

  const patch = patchWebmDuration(head, 12_345);
  assert.ok(patch);
  // consumed 應剛好停在 Info 結尾（Tracks 開始處）
  const infoEnd = EBML_HEADER.length + UNKNOWN_SEGMENT.length + 4 + 1 + TIMECODE_SCALE_1MS.length + MUXING_APP.length;
  assert.equal(patch.consumed, infoEnd);
  assert.equal(patch.bytes.length, infoEnd + 11);

  const rebuilt = concat(patch.bytes, head.slice(patch.consumed));
  assert.equal(readWebmDurationMs(rebuilt), 12_345);
  // Tracks 與 Cluster 原封不動接在後面
  assert.deepEqual(rebuilt.slice(rebuilt.length - TRACKS.length - CLUSTER_HEAD.length), concat(TRACKS, CLUSTER_HEAD));
});

test('patchWebmDuration：依 TimecodeScale 換算 Duration 單位', () => {
  const scale10ms = el([0x2a, 0xd7, 0xb1], bytes(0x98, 0x96, 0x80)); // 10,000,000 ns
  const head = chromeLikeWebm(concat(scale10ms, MUXING_APP));
  const patch = patchWebmDuration(head, 5_000);
  assert.ok(patch);
  const rebuilt = concat(patch.bytes, head.slice(patch.consumed));
  assert.equal(readWebmDurationMs(rebuilt), 5_000);
  // 原始 float 值應為 500（單位 10ms）
  const durationPos = patch.bytes.length - 8;
  assert.equal(new DataView(patch.bytes.buffer, patch.bytes.byteOffset + durationPos, 8).getFloat64(0, false), 500);
});

test('patchWebmDuration：已知長度 Segment 會同步加上新增位元組', () => {
  const info = el([0x15, 0x49, 0xa9, 0x66], concat(TIMECODE_SCALE_1MS, MUXING_APP));
  const body = concat(info, TRACKS);
  const segment = concat(bytes(0x18, 0x53, 0x80, 0x67), bytes(0x40, body.length), body); // 2-byte size
  const head = concat(EBML_HEADER, segment);
  const patch = patchWebmDuration(head, 1_000);
  assert.ok(patch);
  const rebuilt = concat(patch.bytes, head.slice(patch.consumed));
  const sizePos = EBML_HEADER.length + 4;
  const newSegSize = ((rebuilt[sizePos] & 0x3f) << 8) | rebuilt[sizePos + 1];
  assert.equal(newSegSize, body.length + 11);
  assert.equal(readWebmDurationMs(rebuilt), 1_000);
});

test('patchWebmDuration：不安全或不需要時回傳 null', () => {
  // 已有 Duration
  const withDuration = el([0x44, 0x89], bytes(0x40, 0x8f, 0x40, 0, 0, 0, 0, 0)); // 1000.0
  assert.equal(patchWebmDuration(chromeLikeWebm(concat(TIMECODE_SCALE_1MS, withDuration)), 5_000), null);
  // Info 之前有 SeekHead（含絕對位移）
  const seekHead = el([0x11, 0x4d, 0x9b, 0x74], bytes(0x4d, 0xbb, 0x80));
  const withSeek = concat(
    EBML_HEADER,
    UNKNOWN_SEGMENT,
    seekHead,
    el([0x15, 0x49, 0xa9, 0x66], TIMECODE_SCALE_1MS),
    TRACKS
  );
  assert.equal(patchWebmDuration(withSeek, 5_000), null);
  // 非 WebM / 截斷 / 非法時長
  assert.equal(patchWebmDuration(new TextEncoder().encode('ftypmp42'), 5_000), null);
  assert.equal(patchWebmDuration(chromeLikeWebm().slice(0, 30), 5_000), null);
  assert.equal(patchWebmDuration(new Uint8Array(0), 5_000), null);
  assert.equal(patchWebmDuration(chromeLikeWebm(), 0), null);
  assert.equal(patchWebmDuration(chromeLikeWebm(), Number.NaN), null);
});

test('fixWebmBlobDuration：Blob 補寫後保留 MIME 與尾端資料；無法補寫時原樣回傳', async () => {
  const tail = new Uint8Array(4096).fill(7);
  const blob = new Blob([chromeLikeWebm(), tail], { type: 'video/webm' });
  const fixed = await fixWebmBlobDuration(blob, 2_500);
  assert.equal(fixed.type, 'video/webm');
  assert.equal(fixed.size, blob.size + 11);
  const buf = new Uint8Array(await fixed.arrayBuffer());
  assert.equal(readWebmDurationMs(buf), 2_500);
  assert.deepEqual(buf.slice(buf.length - tail.length), tail);

  const mp4 = new Blob([new TextEncoder().encode('....ftypisom')], { type: 'video/mp4' });
  assert.equal(await fixWebmBlobDuration(mp4, 2_500), mp4);
  const empty = new Blob([], { type: 'video/webm' });
  assert.equal(await fixWebmBlobDuration(empty, 2_500), empty);
});

// ── PRV5 握手 ──────────────────────────────────────────

test('PRV5 常數：開啟網址與鎖定網域', () => {
  assert.equal(PRV5_ORIGIN, 'https://www.prv5.com');
  assert.equal(PRV5_OPEN_URL, 'https://www.prv5.com/?source=smalltools');
});

test('isTrustedPrv5Ready：嚴格比對網域、來源視窗與訊息類型', () => {
  const win = {};
  assert.equal(isTrustedPrv5Ready({ origin: PRV5_ORIGIN, data: 'PRV5_READY', source: win }, win), true);
  assert.equal(isTrustedPrv5Ready({ origin: PRV5_ORIGIN, data: { type: 'PRV5_READY' }, source: win }, win), true);
  // 支援 prv5.com 與 www.prv5.com 及 localhost
  assert.equal(isTrustedPrv5Ready({ origin: 'https://prv5.com', data: 'PRV5_READY', source: win }, win), true);
  assert.equal(isTrustedPrv5Ready({ origin: 'http://localhost:5173', data: 'PRV5_READY', source: win }, win), true);
  // 網域偽冒：未知子網域、未經許可之外部網域、未授權 http
  for (const origin of ['https://evil.prv5.com', 'http://prv5.com', 'http://www.prv5.com', 'https://www.prv5.com.evil.io', 'https://attacker.com']) {
    assert.equal(isTrustedPrv5Ready({ origin, data: 'PRV5_READY', source: win }, win), false, origin);
  }
  // 來源視窗不是我們開啟的那個
  assert.equal(isTrustedPrv5Ready({ origin: PRV5_ORIGIN, data: 'PRV5_READY', source: {} }, win), false);
  assert.equal(isTrustedPrv5Ready({ origin: PRV5_ORIGIN, data: 'PRV5_READY', source: null }, null), false);
  // 訊息類型不符
  assert.equal(isTrustedPrv5Ready({ origin: PRV5_ORIGIN, data: 'HELLO', source: win }, win), false);
  assert.equal(isTrustedPrv5Ready({ origin: PRV5_ORIGIN, data: null, source: win }, win), false);
  assert.equal(isTrustedPrv5Ready({ origin: PRV5_ORIGIN, data: { type: 'prv5_ready' }, source: win }, win), false);
});

test('buildPrv5FilePayload：包含檔案本體與名稱、類型、大小，且不攔截大小', () => {
  const file = new File([new Uint8Array(10)], 'screen-recording-20261030-193000.webm', { type: 'video/webm' });
  const payload = buildPrv5FilePayload(file);
  assert.equal(payload.type, PRV5_FILE_MESSAGE_TYPE);
  assert.equal(payload.source, 'smalltools');
  assert.equal(payload.tool, 'screen-capture');
  assert.equal(payload.file, file);
  assert.equal(payload.name, file.name);
  assert.equal(payload.mimeType, 'video/webm');
  assert.equal(payload.size, 10);

  const untyped = new File([new Uint8Array(1)], 'a.webm');
  assert.equal(buildPrv5FilePayload(untyped).mimeType, 'video/webm');
});
