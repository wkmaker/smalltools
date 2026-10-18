import test from 'node:test';
import assert from 'node:assert/strict';
import {
  escapeWifiString,
  toUtf8ByteString,
  formatICalDate,
  buildWifiPayload,
  buildVCardPayload,
  buildEventPayload,
  buildEmailPayload,
  buildSmsPayload,
  buildTelPayload,
} from '../../app/qr-generator/engine.ts';

test('QR Generator Engine', async (t) => {
  await t.test('Wi-Fi 特殊字元跳脫與 Payload 組裝', () => {
    assert.equal(escapeWifiString('My;WiFi:Network,2.4G\\Home'), 'My\\;WiFi\\:Network\\,2.4G\\\\Home');

    const wifi = buildWifiPayload({
      ssid: 'Office_Guest',
      pass: 'P@ss;w:ord,123',
      encryption: 'WPA',
      hidden: true,
    });
    assert.equal(wifi, 'WIFI:S:Office_Guest;T:WPA;P:P@ss\\;w\\:ord\\,123;H:true;;');

    const noPassWifi = buildWifiPayload({
      ssid: 'Public',
      pass: '',
      encryption: 'nopass',
      hidden: false,
    });
    assert.equal(noPassWifi, 'WIFI:S:Public;T:nopass;;;');
  });

  await t.test('vCard 3.0 / 4.0 名片組裝', () => {
    const vcard = buildVCardPayload({
      version: '4.0',
      lastName: '王',
      firstName: '大明',
      nickname: 'Ming',
      org: '科技公司',
      dept: '工程部',
      title: '架構師',
      address: '台北市信義區',
      bday: '1990-01-01',
      phone: '0912345678',
      workPhone: '0287654321',
      email: 'ming@example.com',
      url: 'https://example.com',
    });

    assert.ok(vcard.includes('BEGIN:VCARD'));
    assert.ok(vcard.includes('VERSION:4.0'));
    assert.ok(vcard.includes('FN:王大明'));
    assert.ok(vcard.includes('N:王;大明;;;'));
    assert.ok(vcard.includes('TEL;TYPE=cell:0912345678'));
    assert.ok(vcard.includes('EMAIL;TYPE=work:ming@example.com'));
    assert.ok(vcard.includes('END:VCARD'));
  });

  await t.test('行事曆活動 iCalendar 組裝', () => {
    const event = buildEventPayload({
      summary: '產品發表會',
      start: '2026-12-01T14:00',
      end: '2026-12-01T16:00',
      timezone: 'Asia/Taipei',
      location: '台北國際會議中心',
      description: '年度新品發表',
    });

    assert.ok(event.includes('BEGIN:VCALENDAR'));
    assert.ok(event.includes('SUMMARY:產品發表會'));
    assert.ok(event.includes('DTSTART;TZID=Asia/Taipei:20261201T140000'));
    assert.ok(event.includes('DTEND;TZID=Asia/Taipei:20261201T160000'));
    assert.ok(event.includes('LOCATION:台北國際會議中心'));
  });

  await t.test('Email, SMS, Tel URL 格式', () => {
    const email = buildEmailPayload({
      to: 'contact@example.com',
      subject: '合作洽詢',
      body: '您好，想諮詢產品！',
    });
    assert.ok(email.startsWith('mailto:contact@example.com?'));
    assert.ok(email.includes('subject=%E5%90%88%E4%BD%9C%E6%B4%BD%E8%A9%A2'));

    const sms = buildSmsPayload({ phone: '0912345678', body: '請回電' });
    assert.equal(sms, 'sms:0912345678?body=%E8%AB%8B%E5%9B%9E%E9%9B%BB');

    const tel = buildTelPayload({ phone: '+886212345678' });
    assert.equal(tel, 'tel:+886212345678');
  });
});
