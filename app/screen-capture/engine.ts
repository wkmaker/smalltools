/**
 * screen-capture/engine.ts
 * ──────────────────────────────────────────────────────────────
 * 極簡螢幕錄影工具的純函數引擎，與 UI / 瀏覽器媒體 API 完全分離，可獨立單元測試。
 * - 編碼格式嗅探（VP9 → VP8 → WebM → MP4）、副檔名與下載檔名格式化。
 * - 畫質預設（FPS / 位元率）與外部輸入清洗。
 * - 錄影時長格式化、容量估算、VU 音量條 RMS 換算。
 * - WebM 時長補寫：Chrome / Edge 的 MediaRecorder 輸出之 WebM 缺少 Duration 欄位，
 *   導致播放器無法拖曳進度條。`patchWebmDuration` 只改寫檔頭的 Segment Info，
 *   其餘資料以 Blob.slice 零拷貝接回，記憶體用量與影片大小無關。
 * - PRV5 跨視窗握手協定：來源比對與傳送酬載格式。
 */

// ── 編碼格式 ─────────────────────────────────────────────

/** MediaRecorder 編碼格式優先順序（Chrome/Edge 走 VP9/Opus，Safari 走 MP4） */
export const MIME_CANDIDATES = [
  'video/webm;codecs=vp9,opus',
  'video/webm;codecs=vp8,opus',
  'video/webm',
  'video/mp4;codecs=avc1',
  'video/mp4',
] as const;

/**
 * 依瀏覽器支援度挑選第一個可用的 MIME Type。
 * @returns 可用的 MIME Type；全部不支援時回傳空字串（交由瀏覽器使用預設格式）。
 */
export function pickSupportedMimeType(isSupported: (mime: string) => boolean): string {
  for (const mime of MIME_CANDIDATES) {
    try {
      if (isSupported(mime)) return mime;
    } catch (err) {
      // 部分舊版瀏覽器對未知格式會直接丟例外，視同不支援並繼續嗅探
      console.warn('[screen-capture] MIME 嗅探失敗', { mime, err });
    }
  }
  return '';
}

/** 去除 codecs 參數，取得容器 MIME（如 `video/webm`） */
export function baseMimeType(mime: string): string {
  const base = (mime || '').split(';')[0].trim().toLowerCase();
  return base || 'video/webm';
}

/** 依 MIME 推導副檔名 */
export function mimeToExtension(mime: string): 'mp4' | 'webm' {
  return baseMimeType(mime) === 'video/mp4' ? 'mp4' : 'webm';
}

/** 依 MIME 判斷是否為 WebM 容器 */
export function isWebmMime(mime: string): boolean {
  return baseMimeType(mime) === 'video/webm';
}

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

/**
 * 產生下載檔名：`screen-recording-YYYYMMDD-HHmmss.webm`（使用者本地時區）。
 */
export function buildRecordingFileName(date: Date, ext: string): string {
  const safeDate = Number.isFinite(date.getTime()) ? date : new Date();
  const safeExt = /^[a-z0-9]{2,5}$/i.test(ext) ? ext.toLowerCase() : 'webm';
  const ymd = `${safeDate.getFullYear()}${pad2(safeDate.getMonth() + 1)}${pad2(safeDate.getDate())}`;
  const hms = `${pad2(safeDate.getHours())}${pad2(safeDate.getMinutes())}${pad2(safeDate.getSeconds())}`;
  return `screen-recording-${ymd}-${hms}.${safeExt}`;
}

// ── 畫質設定 ─────────────────────────────────────────────

export type BitratePresetId = 'high' | 'standard' | 'saver';

export interface BitratePreset {
  id: BitratePresetId;
  bps: number;
}

export const BITRATE_PRESETS: BitratePreset[] = [
  { id: 'high', bps: 5_000_000 },
  { id: 'standard', bps: 2_500_000 },
  { id: 'saver', bps: 1_000_000 },
];

export const DEFAULT_BITRATE_PRESET: BitratePresetId = 'standard';

export const FPS_OPTIONS = [30, 60] as const;
export type FpsOption = (typeof FPS_OPTIONS)[number];
export const DEFAULT_FPS: FpsOption = 30;

/** 音訊位元率（Opus / AAC 128 kbps 已足以清楚收錄旁白與系統音） */
export const AUDIO_BITRATE_BPS = 128_000;

/** 倒數秒數 */
export const COUNTDOWN_SECONDS = 3;

/** 清洗 FPS 輸入，非法值回退預設 30 */
export function sanitizeFps(value: unknown): FpsOption {
  const n = typeof value === 'string' ? Number(value.trim()) : value;
  return FPS_OPTIONS.find(opt => opt === n) ?? DEFAULT_FPS;
}

/** 清洗位元率預設 ID，非法值回退「標準」 */
export function sanitizeBitratePreset(value: unknown): BitratePresetId {
  const id = typeof value === 'string' ? value.trim().toLowerCase() : '';
  return BITRATE_PRESETS.some(p => p.id === id) ? (id as BitratePresetId) : DEFAULT_BITRATE_PRESET;
}

export function bitrateOf(id: BitratePresetId): number {
  return (BITRATE_PRESETS.find(p => p.id === id) ?? BITRATE_PRESETS[1]).bps;
}

/**
 * 以名目位元率（影像 + 音訊）估算每 1 GB 約可錄製的分鐘數（無條件捨去）。
 * 實際檔案大小會依畫面動態程度浮動：靜態畫面通常遠低於名目值。
 */
export function minutesPerGigabyte(videoBps: number, audioBps: number = AUDIO_BITRATE_BPS): number {
  const total = videoBps + audioBps;
  if (!Number.isFinite(total) || total <= 0) return 0;
  return Math.floor((1024 ** 3 * 8) / total / 60);
}

// ── 時間與音量 ───────────────────────────────────────────

/** 毫秒轉 `HH:MM:SS`；負值或非有限值視為 0 */
export function formatDuration(ms: number): string {
  const totalSec = Number.isFinite(ms) && ms > 0 ? Math.floor(ms / 1000) : 0;
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return `${pad2(h)}:${pad2(m)}:${pad2(s)}`;
}

/**
 * 將時域取樣換算為 0~1 的音量條比例：先算 RMS，再以 -60 dB ~ 0 dB 線性映射，
 * 讓一般說話音量能明顯跳動，而非擠在條狀圖最左側。
 */
export function computeLevelFromSamples(samples: ArrayLike<number>): number {
  const len = samples.length;
  if (len === 0) return 0;
  let sumSq = 0;
  for (let i = 0; i < len; i++) {
    const v = samples[i];
    if (Number.isFinite(v)) sumSq += v * v;
  }
  const rms = Math.sqrt(sumSq / len);
  if (rms <= 0) return 0;
  const db = 20 * Math.log10(rms);
  return Math.min(1, Math.max(0, (db + 60) / 60));
}

// ── WebM 時長補寫（EBML） ────────────────────────────────

const EBML_ID_HEADER = 0x1a45dfa3;
const EBML_ID_SEGMENT = 0x18538067;
const EBML_ID_SEEK_HEAD = 0x114d9b74;
const EBML_ID_INFO = 0x1549a966;
const EBML_ID_TIMECODE_SCALE = 0x2ad7b1;
const EBML_ID_DURATION = 0x4489;
const EBML_ID_CLUSTER = 0x1f43b675;
const EBML_ID_TRACKS = 0x1654ae6b;

/** 讀取檔頭的位元組數上限：Segment Info 一律位於檔案開頭數百位元組內 */
export const WEBM_HEAD_READ_BYTES = 256 * 1024;

interface Vint {
  /** 解碼後數值（Element ID 保留標記位元；Size 去除標記位元） */
  value: number;
  length: number;
  /** Size 是否為「未知長度」（全部資料位元為 1） */
  unknown: boolean;
}

function vintLength(firstByte: number): number {
  for (let len = 1; len <= 8; len++) {
    if (firstByte & (0x80 >> (len - 1))) return len;
  }
  return 0;
}

function readElementId(buf: Uint8Array, pos: number): Vint | null {
  if (pos >= buf.length) return null;
  const len = vintLength(buf[pos]);
  if (len === 0 || len > 4 || pos + len > buf.length) return null;
  let value = 0;
  for (let i = 0; i < len; i++) value = value * 256 + buf[pos + i];
  return { value, length: len, unknown: false };
}

function readElementSize(buf: Uint8Array, pos: number): Vint | null {
  if (pos >= buf.length) return null;
  const len = vintLength(buf[pos]);
  if (len === 0 || pos + len > buf.length) return null;
  const mask = 0xff >> len;
  let value = buf[pos] & mask;
  let allOnes = value === mask;
  for (let i = 1; i < len; i++) {
    const b = buf[pos + i];
    if (b !== 0xff) allOnes = false;
    value = value * 256 + b;
  }
  return { value, length: len, unknown: allOnes };
}

/** 將數值編碼為指定長度的 EBML Size；超出該長度可表示範圍時回傳 null */
function encodeElementSize(value: number, length: number): Uint8Array | null {
  if (!Number.isSafeInteger(value) || value < 0 || length < 1 || length > 8) return null;
  // 該長度可表示的最大值（全 1 保留給「未知長度」）
  const max = 2 ** (7 * length) - 2;
  if (value > max) return null;
  const out = new Uint8Array(length);
  let rest = value;
  for (let i = length - 1; i >= 0; i--) {
    out[i] = rest % 256;
    rest = Math.floor(rest / 256);
  }
  out[0] |= 0x80 >> (length - 1);
  return out;
}

function encodeMinimalElementSize(value: number): Uint8Array | null {
  for (let len = 1; len <= 8; len++) {
    const encoded = encodeElementSize(value, len);
    if (encoded) return encoded;
  }
  return null;
}

function readUnsigned(buf: Uint8Array, pos: number, len: number): number {
  let value = 0;
  for (let i = 0; i < len; i++) value = value * 256 + buf[pos + i];
  return value;
}

function concatBytes(parts: Uint8Array[]): Uint8Array {
  const total = parts.reduce((sum, p) => sum + p.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const p of parts) {
    out.set(p, offset);
    offset += p.length;
  }
  return out;
}

export interface WebmDurationPatch {
  /** 取代原檔頭 `[0, consumed)` 的新位元組 */
  bytes: Uint8Array;
  /** 原檔頭被取代的位元組數；其後資料原封不動接回 */
  consumed: number;
}

/**
 * 在 WebM 檔頭的 Segment Info 補上 Duration 欄位。
 *
 * 安全守則（任何一項不符即回傳 null，維持原檔不動）：
 * - 檔頭結構必須是 EBML Header → Segment → … → Info。
 * - Info 之前若出現 SeekHead（內含絕對位移，插入位元組會讓位移失效）、Tracks 或 Cluster，放棄補寫。
 * - Info 已有 Duration 時不覆寫。
 * - Info 必須完整落在傳入的檔頭範圍內。
 *
 * @param head 檔案開頭的位元組（建議讀取 `WEBM_HEAD_READ_BYTES`）
 * @param durationMs 錄影實際時長（毫秒，不含暫停時間）
 */
export function patchWebmDuration(head: Uint8Array, durationMs: number): WebmDurationPatch | null {
  if (!Number.isFinite(durationMs) || durationMs <= 0) return null;

  // 1. EBML Header
  const headerId = readElementId(head, 0);
  if (!headerId || headerId.value !== EBML_ID_HEADER) return null;
  const headerSize = readElementSize(head, headerId.length);
  if (!headerSize || headerSize.unknown) return null;
  let pos = headerId.length + headerSize.length + headerSize.value;

  // 2. Segment
  const segmentId = readElementId(head, pos);
  if (!segmentId || segmentId.value !== EBML_ID_SEGMENT) return null;
  const segmentSizePos = pos + segmentId.length;
  const segmentSize = readElementSize(head, segmentSizePos);
  if (!segmentSize) return null;
  const segmentDataStart = segmentSizePos + segmentSize.length;
  pos = segmentDataStart;

  // 3. 尋找 Segment 內第一個 Info
  while (pos < head.length) {
    const id = readElementId(head, pos);
    if (!id) return null;
    const size = readElementSize(head, pos + id.length);
    if (!size || size.unknown) return null;
    const dataStart = pos + id.length + size.length;
    const end = dataStart + size.value;

    if (id.value === EBML_ID_SEEK_HEAD || id.value === EBML_ID_TRACKS || id.value === EBML_ID_CLUSTER) {
      return null;
    }

    if (id.value === EBML_ID_INFO) {
      if (end > head.length) return null;

      let timecodeScale = 1_000_000;
      let child = dataStart;
      while (child < end) {
        const cid = readElementId(head, child);
        if (!cid) return null;
        const csize = readElementSize(head, child + cid.length);
        if (!csize || csize.unknown) return null;
        const cdata = child + cid.length + csize.length;
        if (cdata + csize.value > end) return null;
        if (cid.value === EBML_ID_DURATION) return null; // 已有時長，不覆寫
        if (cid.value === EBML_ID_TIMECODE_SCALE && csize.value >= 1 && csize.value <= 8) {
          const scale = readUnsigned(head, cdata, csize.value);
          if (scale > 0) timecodeScale = scale;
        }
        child = cdata + csize.value;
      }

      // Duration 單位為 TimecodeScale（預設 1,000,000 ns = 1 ms）
      const durationEl = new Uint8Array(11);
      durationEl[0] = 0x44;
      durationEl[1] = 0x89;
      durationEl[2] = 0x88; // 8 bytes float
      new DataView(durationEl.buffer).setFloat64(3, (durationMs * 1_000_000) / timecodeScale, false);

      const newInfoSizeValue = size.value + durationEl.length;
      const newInfoSize =
        encodeElementSize(newInfoSizeValue, size.length) ?? encodeMinimalElementSize(newInfoSizeValue);
      if (!newInfoSize) return null;
      const delta = durationEl.length + (newInfoSize.length - size.length);

      // Segment 若為已知長度，需同步加上新增的位元組數
      let segmentSizeBytes: Uint8Array;
      if (segmentSize.unknown) {
        segmentSizeBytes = head.slice(segmentSizePos, segmentDataStart);
      } else {
        const encoded = encodeElementSize(segmentSize.value + delta, segmentSize.length);
        if (!encoded) return null;
        segmentSizeBytes = encoded;
      }

      const bytes = concatBytes([
        head.slice(0, segmentSizePos),
        segmentSizeBytes,
        head.slice(segmentDataStart, pos + id.length), // Segment 開頭至 Info ID
        newInfoSize,
        head.slice(dataStart, end),
        durationEl,
      ]);
      return { bytes, consumed: end };
    }

    pos = end;
  }
  return null;
}

/**
 * 讀取 WebM Blob 的 Duration（以毫秒表示），找不到時回傳 null。供測試與除錯驗證使用。
 */
export function readWebmDurationMs(head: Uint8Array): number | null {
  const headerId = readElementId(head, 0);
  if (!headerId || headerId.value !== EBML_ID_HEADER) return null;
  const headerSize = readElementSize(head, headerId.length);
  if (!headerSize) return null;
  let pos = headerId.length + headerSize.length + headerSize.value;
  const segmentId = readElementId(head, pos);
  if (!segmentId || segmentId.value !== EBML_ID_SEGMENT) return null;
  const segmentSize = readElementSize(head, pos + segmentId.length);
  if (!segmentSize) return null;
  pos += segmentId.length + segmentSize.length;

  while (pos < head.length) {
    const id = readElementId(head, pos);
    if (!id) return null;
    const size = readElementSize(head, pos + id.length);
    if (!size || size.unknown) return null;
    const dataStart = pos + id.length + size.length;
    const end = dataStart + size.value;
    if (id.value === EBML_ID_INFO) {
      let timecodeScale = 1_000_000;
      let duration: number | null = null;
      let child = dataStart;
      while (child < end && child < head.length) {
        const cid = readElementId(head, child);
        if (!cid) return null;
        const csize = readElementSize(head, child + cid.length);
        if (!csize) return null;
        const cdata = child + cid.length + csize.length;
        if (cid.value === EBML_ID_TIMECODE_SCALE) timecodeScale = readUnsigned(head, cdata, csize.value);
        if (cid.value === EBML_ID_DURATION) {
          const view = new DataView(head.buffer, head.byteOffset + cdata, csize.value);
          duration = csize.value === 4 ? view.getFloat32(0, false) : view.getFloat64(0, false);
        }
        child = cdata + csize.value;
      }
      return duration === null ? null : (duration * timecodeScale) / 1_000_000;
    }
    pos = end;
  }
  return null;
}

/**
 * 為 WebM Blob 補寫 Duration：只讀取檔頭，其餘以 `Blob.slice` 零拷貝接回。
 * 無法安全補寫時原樣回傳。
 */
export async function fixWebmBlobDuration(blob: Blob, durationMs: number): Promise<Blob> {
  const headLen = Math.min(blob.size, WEBM_HEAD_READ_BYTES);
  if (headLen === 0) return blob;
  const head = new Uint8Array(await blob.slice(0, headLen).arrayBuffer());
  const patch = patchWebmDuration(head, durationMs);
  if (!patch) return blob;
  return new Blob([patch.bytes as BlobPart, blob.slice(patch.consumed)], { type: blob.type });
}

// ── PRV5 跨視窗握手協定 ──────────────────────────────────

export const PRV5_ORIGIN = 'https://www.prv5.com';
export const PRV5_ALLOWED_ORIGINS = [
  'https://www.prv5.com',
  'https://prv5.com',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
] as const;
export const PRV5_OPEN_URL = `${PRV5_ORIGIN}/?source=smalltools`;
export const PRV5_READY_TYPE = 'PRV5_READY';
export const PRV5_FILE_MESSAGE_TYPE = 'SMALLTOOLS_FILE';
/** 等待 PRV5 回報就緒的逾時（毫秒） */
export const PRV5_HANDSHAKE_TIMEOUT_MS = 90_000;

export interface MessageLike {
  origin: string;
  data: unknown;
  source: unknown;
}

/**
 * 判斷訊息是否為「由本工具開啟之 PRV5 分頁」送出的就緒訊號。
 * 必須同時符合：來源網域完全相等、來源視窗為我們開啟的那一個、訊息類型為 `PRV5_READY`。
 */
export function isTrustedPrv5Ready(event: MessageLike, expectedSource: unknown): boolean {
  if (!(PRV5_ALLOWED_ORIGINS as readonly string[]).includes(event.origin)) return false;
  if (!expectedSource || event.source !== expectedSource) return false;
  const { data } = event;
  if (data === PRV5_READY_TYPE) return true;
  return (
    typeof data === 'object' &&
    data !== null &&
    (data as { type?: unknown }).type === PRV5_READY_TYPE
  );
}

export interface Prv5FilePayload {
  type: typeof PRV5_FILE_MESSAGE_TYPE;
  source: 'smalltools';
  tool: 'screen-capture';
  file: File;
  name: string;
  mimeType: string;
  size: number;
}

/**
 * 建立傳送給 PRV5 的酬載。檔案大小不做任何攔截，由 PRV5 依其規範（訪客 / 會員配額）自行檢查。
 */
export function buildPrv5FilePayload(file: File): Prv5FilePayload {
  return {
    type: PRV5_FILE_MESSAGE_TYPE,
    source: 'smalltools',
    tool: 'screen-capture',
    file,
    name: file.name,
    mimeType: file.type || 'video/webm',
    size: file.size,
  };
}
