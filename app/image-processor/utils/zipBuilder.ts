// 預先建立 256 項 CRC32 Lookup Table (比逐 bit 運算快 8-10 倍)
const CRC_TABLE = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let j = 0; j < 8; j++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  CRC_TABLE[i] = c;
}

function calculateCRC32(data: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < data.length; i++) {
    crc = (crc >>> 8) ^ CRC_TABLE[(crc ^ data[i]) & 0xff];
  }
  return (crc ^ 0xffffffff) >>> 0;
}

// 防範 Zip Slip (路徑穿越) 的檔名清理
function sanitizeFilename(filename: string): string {
  const sanitized = filename.replace(/\\/g, '/').replace(/\.\.\//g, '').replace(/^[/\\]+/, '');
  return sanitized || 'file';
}

export function createSimpleZip(files: { name: string; data: Uint8Array }[]): Blob {
  const parts: Uint8Array[] = [];
  const cdEntries: Uint8Array[] = [];
  let offset = 0;

  files.forEach((f) => {
    const safeName = sanitizeFilename(f.name);
    const nameBytes = new TextEncoder().encode(safeName);
    const date = new Date();
    const dosTime =
      (date.getHours() << 11) | (date.getMinutes() << 5) | (date.getSeconds() >> 1);
    const dosDate =
      ((date.getFullYear() - 1980) << 9) |
      ((date.getMonth() + 1) << 5) |
      date.getDate();

    const crc = calculateCRC32(f.data);

    // 30 bytes Local File Header
    const localHeader = new Uint8Array(30 + nameBytes.length);
    const view = new DataView(localHeader.buffer);
    view.setUint32(0, 0x04034b50, true);
    view.setUint16(4, 20, true);
    view.setUint16(6, 0x0800, true); // Bit 11: UTF-8 filename encoding flag
    view.setUint16(8, 0, true);
    view.setUint16(10, dosTime, true);
    view.setUint16(12, dosDate, true);
    view.setUint32(14, crc, true);
    view.setUint32(18, f.data.length, true);
    view.setUint32(22, f.data.length, true);
    view.setUint16(26, nameBytes.length, true);
    view.setUint16(28, 0, true);
    localHeader.set(nameBytes, 30);

    parts.push(localHeader);
    parts.push(f.data);

    // 46 bytes Central Directory File Header
    const cdEntry = new Uint8Array(46 + nameBytes.length);
    const cdView = new DataView(cdEntry.buffer);
    cdView.setUint32(0, 0x02014b50, true);
    cdView.setUint16(4, 20, true);
    cdView.setUint16(6, 20, true);
    cdView.setUint16(8, 0x0800, true); // Bit 11: UTF-8 encoding
    cdView.setUint16(10, 0, true);
    cdView.setUint16(12, dosTime, true);
    cdView.setUint16(14, dosDate, true);
    cdView.setUint32(16, crc, true);
    cdView.setUint32(20, f.data.length, true);
    cdView.setUint32(24, f.data.length, true);
    cdView.setUint16(28, nameBytes.length, true);
    cdView.setUint16(30, 0, true);
    cdView.setUint16(32, 0, true);
    cdView.setUint16(34, 0, true);
    cdView.setUint16(36, 0, true);
    cdView.setUint32(38, 0, true);
    cdView.setUint32(42, offset, true);
    cdEntry.set(nameBytes, 46);

    cdEntries.push(cdEntry);
    offset += localHeader.length + f.data.length;
  });

  const cdOffset = offset;
  let cdSize = 0;
  cdEntries.forEach((e) => {
    parts.push(e);
    cdSize += e.length;
  });

  // 22 bytes End of Central Directory Record
  const eocd = new Uint8Array(22);
  const eocdView = new DataView(eocd.buffer);
  eocdView.setUint32(0, 0x06054b50, true);
  eocdView.setUint16(4, 0, true);
  eocdView.setUint16(6, 0, true);
  eocdView.setUint16(8, files.length, true);
  eocdView.setUint16(10, files.length, true);
  eocdView.setUint32(12, cdSize, true);
  eocdView.setUint32(16, cdOffset, true);
  eocdView.setUint16(20, 0, true);

  parts.push(eocd);

  return new Blob(parts as BlobPart[], { type: 'application/zip' });
}
