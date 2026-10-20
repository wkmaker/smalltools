import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

// #77 回歸：正式環境曾因 ResponseHeadersPolicyId 落到 AWS::NoValue 而完全沒有安全標頭
const TEMPLATE = fs.readFileSync(new URL('../../template.yml', import.meta.url), 'utf8').replace(/\r\n/g, '\n'); // Windows autocrlf 簽出時統一換行
const MANAGED_SECURITY_HEADERS_POLICY_ID = '67f7725c-6f97-4210-82d7-5512b31e9d03';

const policyLine = TEMPLATE.match(/^\s*ResponseHeadersPolicyId:\s*(.+)$/m);
assert.ok(policyLine, 'template.yml 找不到 ResponseHeadersPolicyId');

test('ResponseHeadersPolicyId 任何條件下都不可為 AWS::NoValue', () => {
  assert.doesNotMatch(policyLine[1], /AWS::NoValue/);
});

test('非 NoIndex 環境（正式站）套用 AWS 託管 Managed-SecurityHeadersPolicy', () => {
  assert.match(policyLine[1], /^!If \[IsNoIndexEnabled, !Ref NoIndexResponseHeadersPolicy, (\S+)\]$/);
  assert.equal(policyLine[1].match(/, (\S+)\]$/)[1], MANAGED_SECURITY_HEADERS_POLICY_ID);
});

test('NoIndex 環境的自訂 policy 仍保有完整安全標頭', () => {
  const block = TEMPLATE.match(/NoIndexResponseHeadersPolicy:\n[\s\S]*?\n\n/);
  assert.ok(block, 'template.yml 找不到 NoIndexResponseHeadersPolicy');
  for (const key of ['StrictTransportSecurity', 'ContentTypeOptions', 'FrameOptions', 'ReferrerPolicy']) {
    assert.match(block[0], new RegExp(`${key}:`), `NoIndexResponseHeadersPolicy 缺少 ${key}`);
  }
});
