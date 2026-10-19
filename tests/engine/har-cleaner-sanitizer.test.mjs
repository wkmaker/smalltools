import test from 'node:test';
import assert from 'node:assert/strict';
import { isMatchingKey, sanitizeHarAsync } from '../../app/har-cleaner/engine/sanitizer.ts';
import { DEFAULT_SENSITIVE_KEYS } from '../../app/har-cleaner/constants.ts';

const ALL_RULES = {
  authHeaders: true,
  cookies: true,
  queryParams: true,
  postData: true,
  creditCard: true,
  regexDeep: true,
  stripMedia: false,
  stripTrackers: false,
  customKeywords: '',
  redactionText: '[REDACTED]',
};

function buildHar(responseTextObj) {
  return {
    log: {
      version: '1.2',
      entries: [
        {
          startedDateTime: '2026-01-01T00:00:00.000Z',
          time: 1,
          request: {
            method: 'GET',
            url: 'https://api.example.com/v1/session',
            headers: [],
            cookies: [],
            queryString: [],
          },
          response: {
            status: 200,
            headers: [],
            cookies: [],
            content: {
              mimeType: 'application/json',
              text: JSON.stringify(responseTextObj),
            },
          },
        },
      ],
    },
  };
}

test('isMatchingKey：camelCase 複合鍵名應比對到底線分隔的敏感清單項目', () => {
  assert.equal(isMatchingKey('accessToken', DEFAULT_SENSITIVE_KEYS), true);
  assert.equal(isMatchingKey('authToken', DEFAULT_SENSITIVE_KEYS), true);
  assert.equal(isMatchingKey('refreshToken', DEFAULT_SENSITIVE_KEYS), true);
  assert.equal(isMatchingKey('clientSecret', DEFAULT_SENSITIVE_KEYS), true);
  assert.equal(isMatchingKey('privateKey', DEFAULT_SENSITIVE_KEYS), true);
  assert.equal(isMatchingKey('internalSecret', DEFAULT_SENSITIVE_KEYS), true);
});

test('isMatchingKey：一般業務鍵名不應被誤判為敏感欄位', () => {
  assert.equal(isMatchingKey('userName', DEFAULT_SENSITIVE_KEYS), false);
  assert.equal(isMatchingKey('createdAt', DEFAULT_SENSITIVE_KEYS), false);
  assert.equal(isMatchingKey('productId', DEFAULT_SENSITIVE_KEYS), false);
});

test('sanitizeHarAsync：回應 JSON 中的 camelCase accessToken 欄位應被脫敏（回歸測試，修復前會漏判）', async () => {
  const har = buildHar({
    status: 'success',
    accessToken: 'OPAQUE_SESSION_TOKEN_NOT_JWT_SHAPED_1234567890',
    user: { email: 'user@example.com' },
  });

  const result = await sanitizeHarAsync(har, 0, ALL_RULES, {}, 'zh-TW');
  const bodyText = result.cleanedHar.log.entries[0].response.content.text;
  const parsed = JSON.parse(bodyText);

  assert.equal(parsed.accessToken, '[REDACTED]');
  assert.equal(result.stats.redactedBodies > 0, true);
});

test('sanitizeHarAsync：深度正則掃描應涵蓋 GitHub / Slack / Google / OpenAI / Stripe 測試金鑰格式', async () => {
  // 欄位名故意用中性字詞（不含 token/key/secret），確保是「正則掃描」而非「鍵名比對」命中
  const har = buildHar({
    ghCred: 'ghp_' + 'a'.repeat(36),
    slackCred: 'xoxb-1234567890-abcdefghij',
    googleCred: 'AIza' + 'B'.repeat(35),
    openaiCred: 'sk-' + 'c'.repeat(40),
    stripeCred: 'sk_test_' + 'd'.repeat(24),
  });

  const result = await sanitizeHarAsync(har, 0, ALL_RULES, {}, 'zh-TW');
  const bodyText = result.cleanedHar.log.entries[0].response.content.text;

  assert.equal(bodyText.includes('ghp_'), false);
  assert.equal(bodyText.includes('xoxb-'), false);
  assert.equal(bodyText.includes('AIza'), false);
  assert.equal(bodyText.includes('sk-ccccccc'), false);
  assert.equal(bodyText.includes('sk_test_'), false);
  assert.equal(result.stats.redactedRegexItems >= 5, true);
});

test('cloneEntryForSanitize：脫敏不變異原始 entry，未改寫子樹沿用原參考', async () => {
  const timings = { send: 1, wait: 2, receive: 3 };
  const entry = {
    startedDateTime: '2026-01-01T00:00:00.000Z',
    time: 1,
    timings,
    request: {
      method: 'POST',
      url: 'https://api.example.com/login?token=abc123',
      headers: [{ name: 'Authorization', value: 'Bearer secret-token' }],
      cookies: [{ name: 'sid', value: 'session-1' }],
      queryString: [{ name: 'token', value: 'abc123' }],
      postData: { mimeType: 'application/x-www-form-urlencoded', params: [{ name: 'password', value: 'p@ss' }] },
    },
    response: {
      status: 200,
      headers: [{ name: 'Set-Cookie', value: 'sid=session-2' }],
      cookies: [{ name: 'sid', value: 'session-2' }],
      content: { mimeType: 'application/json', text: '{"access_token":"xyz"}' },
    },
  };
  const snapshot = JSON.stringify(entry);
  const result = await sanitizeHarAsync({ log: { version: '1.2', entries: [entry] } }, 0, ALL_RULES, {}, 'zh-TW');

  assert.equal(JSON.stringify(entry), snapshot, '原始 entry 不得被變異');
  const cleaned = result.cleanedHar.log.entries[0];
  assert.equal(cleaned.request.headers[0].value, '[REDACTED]');
  assert.equal(cleaned.request.cookies[0].value, '[REDACTED]');
  assert.equal(cleaned.request.queryString[0].value, '[REDACTED]');
  assert.equal(cleaned.request.postData.params[0].value, '[REDACTED]');
  assert.equal(cleaned.response.cookies[0].value, '[REDACTED]');
  assert.ok(!cleaned.response.content.text.includes('xyz'));
  assert.equal(cleaned.timings, timings, '未改寫子樹應沿用原參考');
});
