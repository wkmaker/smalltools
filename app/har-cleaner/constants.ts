// 預設敏感與機密關鍵字
export const DEFAULT_SENSITIVE_KEYS = [
  'password', 'passwd', 'pwd', 'secret', 'token', 'access_token', 'refresh_token',
  'api_key', 'apikey', 'auth', 'authorization', 'signature', 'sig', 'ssn',
  'client_secret', 'private_key',
];

// 信用卡與 PCI-DSS 支付關鍵字
export const PAYMENT_KEYS = [
  'card_number', 'cardnumber', 'card_no', 'cardno', 'credit_card', 'creditcard',
  'cc_num', 'cc_number', 'pan', 'account_no', 'account_number', 'cvv', 'cvc',
  'cvv2', 'cvc2', 'security_code', 'csc', 'exp_month', 'exp_year', 'expiry',
  'expiration_date', 'card_exp', 'cardholder_name', 'billing_address',
];

// 第三方追蹤分析網域
export const TRACKER_DOMAINS = [
  'google-analytics.com', 'analytics.google.com', 'googletagmanager.com',
  'connect.facebook.net', 'facebook.net/tr', 'hotjar.com', 'sentry.io',
  'browser-intake-datadoghq.com', 'datadoghq.com', 'mixpanel.com',
  'segment.io', 'analytics.tiktok.com', 'clarity.ms',
];

// 示範用 Sample HAR 資料產生器
export function generateSampleHar(): any {
  return {
    log: {
      version: '1.2',
      creator: { name: 'Smalltools HAR Generator', version: '1.0' },
      entries: [
        {
          startedDateTime: '2026-08-22T10:00:00.123Z',
          time: 85,
          request: {
            method: 'POST',
            url: 'https://api.example.com/v1/auth/login?client_id=demo_app&redirect_token=MOCK_sec_tok_987654321',
            httpVersion: 'HTTP/2.0',
            cookies: [
              { name: 'session_id', value: 'MOCK_sess_live_98a76b54c3210' },
              { name: 'user_pref', value: 'dark_mode' },
            ],
            headers: [
              { name: 'Host', value: 'api.example.com' },
              { name: 'User-Agent', value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
              { name: 'Authorization', value: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJtb2NrIjp0cnVlLCJub3RlIjoiZml4dHVyZS1kYXRhLW9ubHkifQ.MOCK_SIGNATURE_DO_NOT_USE' },
              { name: 'X-Api-Key', value: 'MOCK_test_apikey_9876543210abcdef' },
              { name: 'Cookie', value: 'session_id=MOCK_sess_live_98a76b54c3210; token=MOCK_secret_cookie_token_999; theme=dark' },
              { name: 'Content-Type', value: 'application/json' },
            ],
            queryString: [
              { name: 'client_id', value: 'demo_app' },
              { name: 'redirect_token', value: 'MOCK_sec_tok_987654321' },
            ],
            postData: {
              mimeType: 'application/json',
              text: JSON.stringify({
                username: 'admin@example.com',
                password: 'MOCK_SuperSecretP@ssw0rd_2026',
                credit_card: '4532-1234-5678-9012',
                aws_access_key: 'AKIAIOSFODNN7EXAMPLE',
              }, null, 2),
            },
          },
          response: {
            status: 200,
            statusText: 'OK',
            httpVersion: 'HTTP/2.0',
            cookies: [
              { name: 'session_id', value: 'MOCK_sess_live_new_updated_token_999' },
            ],
            headers: [
              { name: 'Content-Type', value: 'application/json; charset=utf-8' },
              { name: 'Set-Cookie', value: 'session_id=MOCK_sess_live_new_updated_token_999; Path=/; HttpOnly; Secure' },
            ],
            content: {
              size: 256,
              mimeType: 'application/json',
              text: JSON.stringify({
                status: 'success',
                accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJtb2NrIjp0cnVlLCJub3RlIjoiZml4dHVyZS1kYXRhLW9ubHkifQ.MOCK_SIGNATURE_DO_NOT_USE',
                user: {
                  email: 'admin@example.com',
                  name: 'System Administrator',
                  internal_secret: 'MOCK_confidential_server_key_888',
                },
              }, null, 2),
            },
          },
        },
        {
          startedDateTime: '2026-08-22T10:00:01.000Z',
          time: 145,
          request: {
            method: 'GET',
            url: 'https://cdn.example.com/assets/hero-banner.png?auth_token=MOCK_tok_image_secret_123',
            httpVersion: 'HTTP/2.0',
            cookies: [],
            headers: [
              { name: 'Host', value: 'cdn.example.com' },
              { name: 'Accept', value: 'image/png' },
            ],
            queryString: [
              { name: 'auth_token', value: 'MOCK_tok_image_secret_123' },
            ],
          },
          response: {
            status: 200,
            statusText: 'OK',
            httpVersion: 'HTTP/2.0',
            cookies: [],
            headers: [
              { name: 'Content-Type', value: 'image/png' },
              { name: 'Content-Length', value: '450000' },
            ],
            content: {
              size: 450000,
              mimeType: 'image/png',
              encoding: 'base64',
              text: 'iVBORw0KGgoAAAANSUhEUgAABAAAAAMACAYAAACW0wt...[Extremely Large Base64 Image Payload 450KB]...AAAABJRU5ErkJggg==',
            },
          },
        },
        {
          startedDateTime: '2026-08-22T10:00:02.500Z',
          time: 42,
          request: {
            method: 'POST',
            url: 'https://www.google-analytics.com/g/collect?v=2&tid=G-XXXXX&cid=12345.67890',
            httpVersion: 'HTTP/2.0',
            cookies: [],
            headers: [
              { name: 'Host', value: 'www.google-analytics.com' },
            ],
            queryString: [
              { name: 'v', value: '2' },
              { name: 'tid', value: 'G-XXXXX' },
            ],
          },
          response: {
            status: 204,
            statusText: 'No Content',
            httpVersion: 'HTTP/2.0',
            cookies: [],
            headers: [],
            content: { size: 0, mimeType: 'text/plain' },
          },
        },
      ],
    },
  };
}
