import test from 'node:test';
import assert from 'node:assert/strict';
import { createSimpleZip } from '../../app/image-processor/utils/zipBuilder.ts';

test('createSimpleZip: 建立單檔與多檔 ZIP 並驗證標準 PKZIP 結構標頭', async () => {
  const textEncoder = new TextEncoder();
  const file1Data = textEncoder.encode('Hello World from Smalltools!');
  const file2Data = textEncoder.encode('Testing image batch zip builder.');

  const files = [
    { name: 'test1.txt', data: file1Data },
    { name: 'folder/test2.txt', data: file2Data },
  ];

  const blob = createSimpleZip(files);
  assert.ok(blob instanceof Blob);
  assert.equal(blob.type, 'application/zip');
  assert.ok(blob.size > file1Data.length + file2Data.length);

  const arrayBuffer = await blob.arrayBuffer();
  const view = new DataView(arrayBuffer);

  // 1. 驗證第一個 Local File Header 標頭 (0x04034b50)
  assert.equal(view.getUint32(0, true), 0x04034b50, '第一個檔案應有合法的 Local File Header 簽章');

  // 2. 驗證 End of Central Directory 結尾標頭 (0x06054b50)
  // EOCD 固定長度 22 bytes，位在末尾
  const eocdOffset = arrayBuffer.byteLength - 22;
  assert.equal(view.getUint32(eocdOffset, true), 0x06054b50, 'ZIP 末尾應有合法的 EOCD 簽章');

  // 3. 驗證 EOCD 記錄的檔案總數為 2
  assert.equal(view.getUint16(eocdOffset + 8, true), 2, 'Central Directory 總檔案數應為 2');
  assert.equal(view.getUint16(eocdOffset + 10, true), 2, 'Central Directory 記錄數應為 2');
});

test('createSimpleZip: Zip Slip 路徑穿越防護清洗測試', async () => {
  const data = new Uint8Array([1, 2, 3]);
  const maliciousFiles = [
    { name: '../../etc/passwd', data },
    { name: '..\\..\\windows\\system32\\cmd.exe', data },
  ];

  const blob = createSimpleZip(maliciousFiles);
  const buffer = await blob.arrayBuffer();
  const text = new TextDecoder().decode(buffer);

  assert.ok(!text.includes('../'), '檔名中不應殘留相對路徑穿越 ../');
  assert.ok(!text.includes('..\\'), '檔名中不應殘留相對路徑穿越 ..\\');
});
