import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

// 從 template.yml 取出 CloudFront viewer-request Function 原始碼，代入 !Sub 參數後於 Node 執行
const TEMPLATE = fs.readFileSync(new URL('../../template.yml', import.meta.url), 'utf8').replace(/\r\n/g, '\n'); // Windows autocrlf 簽出時統一換行
const match = TEMPLATE.match(/ViewerRequestFunction:[\s\S]*?FunctionCode: !Sub \|\n([\s\S]*?)\n\n {2}\S/);
assert.ok(match, 'template.yml 找不到 ViewerRequestFunction 的 FunctionCode');
const FUNCTION_SOURCE = match[1].replace(/^ {8}/gm, '');

function loadHandler(enableBasicAuth, basicAuthBase64 = '') {
  const code = FUNCTION_SOURCE
    .replace('${EnableBasicAuth}', enableBasicAuth)
    .replace('${BasicAuthBase64}', basicAuthBase64);
  return new Function(`${code}\nreturn handler;`)();
}

const viewerEvent = (uri, querystring = {}, headers = {}) => ({ request: { uri, querystring, headers } });
const prodHandler = loadHandler('false');
const devHandler = loadHandler('true', 'YWRtaW46c2VjcmV0');

test('以 / 結尾的路徑補上 index.html（S3 REST 端點不解析目錄索引）', () => {
  assert.equal(prodHandler(viewerEvent('/')).uri, '/index.html');
  assert.equal(prodHandler(viewerEvent('/password/')).uri, '/password/index.html');
  assert.equal(prodHandler(viewerEvent('/password/en/')).uri, '/password/en/index.html');
});

test('有副檔名的資產與無副檔名的 opengraph-image 原樣放行', () => {
  assert.equal(prodHandler(viewerEvent('/password/opengraph-image')).uri, '/password/opengraph-image');
  assert.equal(prodHandler(viewerEvent('/password/en/opengraph-image')).uri, '/password/en/opengraph-image');
  assert.equal(prodHandler(viewerEvent('/_next/static/chunks/main.js')).uri, '/_next/static/chunks/main.js');
  assert.equal(prodHandler(viewerEvent('/password/__next._full.txt')).uri, '/password/__next._full.txt');
});

test('無副檔名路徑 301 補斜線並保留查詢參數（含多值與無值參數）', () => {
  const plain = prodHandler(viewerEvent('/password'));
  assert.equal(plain.statusCode, 301);
  assert.equal(plain.headers.location.value, '/password/');

  const withQuery = prodHandler(viewerEvent('/password', {
    q: { value: '%E4%B8%AD%E6%96%87' },
    flag: { value: '' },
    tag: { value: '1', multiValue: [{ value: '1' }, { value: '2' }] },
  }));
  assert.equal(withQuery.headers.location.value, '/password/?q=%E4%B8%AD%E6%96%87&flag&tag=1&tag=2');
});

test('正式環境不啟用 Basic Auth', () => {
  assert.equal(prodHandler(viewerEvent('/password/')).uri, '/password/index.html');
});

test('測試環境 Basic Auth：未帶或帶錯帳密回 401，正確帳密才改寫路徑', () => {
  assert.equal(devHandler(viewerEvent('/password/')).statusCode, 401);
  assert.equal(devHandler(viewerEvent('/password/', {}, { authorization: { value: 'Basic d3Jvbmc=' } })).statusCode, 401);
  assert.equal(
    devHandler(viewerEvent('/password/', {}, { authorization: { value: 'Basic YWRtaW46c2VjcmV0' } })).uri,
    '/password/index.html',
  );
});

test('測試環境 Basic Auth 豁免 PWA 與 OG 圖片路徑', () => {
  for (const uri of ['/manifest.webmanifest', '/sw.js', '/favicon.ico', '/password/opengraph-image']) {
    assert.equal(devHandler(viewerEvent(uri)).uri, uri);
  }
});
