'use client';

import type { ContentType, WifiEncryption } from '../types';
import styles from '../qr-generator.module.css';

interface ContentFormsProps {
  contentType: ContentType;
  t: any;
  // Text
  text: string;
  setText: (v: string) => void;
  textInputId: string;
  // WiFi
  wifiSsid: string;
  setWifiSsid: (v: string) => void;
  wifiPass: string;
  setWifiPass: (v: string) => void;
  wifiEncryption: WifiEncryption;
  setWifiEncryption: (v: WifiEncryption) => void;
  wifiHidden: boolean;
  setWifiHidden: (v: boolean) => void;
  wifiSsidId: string;
  wifiPassId: string;
  wifiEncryptionId: string;
  // vCard
  vCardVersion: '4.0' | '3.0';
  setVCardVersion: (v: '4.0' | '3.0') => void;
  vCardLastName: string;
  setVCardLastName: (v: string) => void;
  vCardFirstName: string;
  setVCardFirstName: (v: string) => void;
  vCardNickname: string;
  setVCardNickname: (v: string) => void;
  vCardOrg: string;
  setVCardOrg: (v: string) => void;
  vCardDept: string;
  setVCardDept: (v: string) => void;
  vCardTitle: string;
  setVCardTitle: (v: string) => void;
  vCardPhone: string;
  setVCardPhone: (v: string) => void;
  vCardWorkPhone: string;
  setVCardWorkPhone: (v: string) => void;
  vCardEmail: string;
  setVCardEmail: (v: string) => void;
  vCardUrl: string;
  setVCardUrl: (v: string) => void;
  vCardAddress: string;
  setVCardAddress: (v: string) => void;
  vCardBday: string;
  setVCardBday: (v: string) => void;
  vCardLastNameId: string;
  vCardFirstNameId: string;
  vCardNicknameId: string;
  vCardOrgId: string;
  vCardDeptId: string;
  vCardTitleId: string;
  vCardPhoneId: string;
  vCardWorkPhoneId: string;
  vCardEmailId: string;
  vCardUrlId: string;
  vCardAddressId: string;
  vCardBdayId: string;
  // Event
  eventSummary: string;
  setEventSummary: (v: string) => void;
  eventStart: string;
  setEventStart: (v: string) => void;
  eventEnd: string;
  setEventEnd: (v: string) => void;
  eventTimezone: string;
  setEventTimezone: (v: string) => void;
  eventLocation: string;
  setEventLocation: (v: string) => void;
  eventDescription: string;
  setEventDescription: (v: string) => void;
  eventSummaryId: string;
  eventStartId: string;
  eventEndId: string;
  eventTimezoneId: string;
  eventLocationId: string;
  eventDescriptionId: string;
  // Email
  emailTo: string;
  setEmailTo: (v: string) => void;
  emailSubject: string;
  setEmailSubject: (v: string) => void;
  emailBody: string;
  setEmailBody: (v: string) => void;
  emailToId: string;
  emailSubjectId: string;
  emailBodyId: string;
  // SMS
  smsPhone: string;
  setSmsPhone: (v: string) => void;
  smsBody: string;
  setSmsBody: (v: string) => void;
  smsPhoneId: string;
  smsBodyId: string;
  // Tel
  telPhone: string;
  setTelPhone: (v: string) => void;
  telPhoneId: string;
}

export default function ContentForms(props: ContentFormsProps) {
  const { contentType, t } = props;

  return (
    <>
      {/* 內容輸入：文字/網址 */}
      {contentType === 'text' && (
        <div className="flex flex-col gap-3">
          <label htmlFor={props.textInputId} className="text-sm font-medium text-text-sub">
            {t.qrContentLabel}
          </label>
          <div className={styles.inputContainer}>
            <input
              id={props.textInputId}
              type="text"
              value={props.text}
              onChange={(e) => props.setText(e.target.value)}
              placeholder={t.textPlaceholder}
              autoComplete="off"
              className={styles.inputField}
            />
          </div>
        </div>
      )}

      {/* 內容輸入：vCard 數位名片 */}
      {contentType === 'vcard' && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-text-sub">{t.vCardVersion}</span>
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-select-bg border border-border-glass rounded-xl">
              <button
                type="button"
                onClick={() => props.setVCardVersion('3.0')}
                className={`${styles.segmentedBtn} ${props.vCardVersion === '3.0' ? styles.segmentedBtnActive : ''}`}
              >
                {t.vCardVer3}
              </button>
              <button
                type="button"
                onClick={() => props.setVCardVersion('4.0')}
                className={`${styles.segmentedBtn} ${props.vCardVersion === '4.0' ? styles.segmentedBtnActive : ''}`}
              >
                {t.vCardVer4}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
            <div className="flex flex-col gap-2">
              <label htmlFor={props.vCardLastNameId} className="text-sm font-medium text-text-sub">
                {t.vCardLastName}
              </label>
              <div className={styles.inputContainer}>
                <input
                  id={props.vCardLastNameId}
                  type="text"
                  value={props.vCardLastName}
                  onChange={(e) => props.setVCardLastName(e.target.value)}
                  placeholder={t.vCardLastNamePlaceholder}
                  autoComplete="off"
                  className={styles.inputField}
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor={props.vCardFirstNameId} className="text-sm font-medium text-text-sub">
                {t.vCardFirstName}
              </label>
              <div className={styles.inputContainer}>
                <input
                  id={props.vCardFirstNameId}
                  type="text"
                  value={props.vCardFirstName}
                  onChange={(e) => props.setVCardFirstName(e.target.value)}
                  placeholder={t.vCardFirstNamePlaceholder}
                  autoComplete="off"
                  className={styles.inputField}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
            <div className="flex flex-col gap-2">
              <label htmlFor={props.vCardNicknameId} className="text-sm font-medium text-text-sub">
                {t.vCardNickname}
              </label>
              <div className={styles.inputContainer}>
                <input
                  id={props.vCardNicknameId}
                  type="text"
                  value={props.vCardNickname}
                  onChange={(e) => props.setVCardNickname(e.target.value)}
                  placeholder={t.vCardNicknamePlaceholder}
                  autoComplete="off"
                  className={styles.inputField}
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor={props.vCardBdayId} className="text-sm font-medium text-text-sub">
                {t.vCardBday}
              </label>
              <div className={styles.inputContainer}>
                <input
                  id={props.vCardBdayId}
                  type="date"
                  value={props.vCardBday}
                  onChange={(e) => props.setVCardBday(e.target.value)}
                  placeholder={t.vCardBdayPlaceholder}
                  className={styles.inputField}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
            <div className="flex flex-col gap-2">
              <label htmlFor={props.vCardOrgId} className="text-sm font-medium text-text-sub">
                {t.vCardOrg}
              </label>
              <div className={styles.inputContainer}>
                <input
                  id={props.vCardOrgId}
                  type="text"
                  value={props.vCardOrg}
                  onChange={(e) => props.setVCardOrg(e.target.value)}
                  placeholder={t.vCardOrgPlaceholder}
                  autoComplete="off"
                  className={styles.inputField}
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor={props.vCardDeptId} className="text-sm font-medium text-text-sub">
                {t.vCardDept}
              </label>
              <div className={styles.inputContainer}>
                <input
                  id={props.vCardDeptId}
                  type="text"
                  value={props.vCardDept}
                  onChange={(e) => props.setVCardDept(e.target.value)}
                  placeholder={t.vCardDeptPlaceholder}
                  autoComplete="off"
                  className={styles.inputField}
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor={props.vCardTitleId} className="text-sm font-medium text-text-sub">
              {t.vCardTitle}
            </label>
            <div className={styles.inputContainer}>
              <input
                id={props.vCardTitleId}
                type="text"
                value={props.vCardTitle}
                onChange={(e) => props.setVCardTitle(e.target.value)}
                placeholder={t.vCardTitlePlaceholder}
                autoComplete="off"
                className={styles.inputField}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
            <div className="flex flex-col gap-2">
              <label htmlFor={props.vCardPhoneId} className="text-sm font-medium text-text-sub">
                {t.vCardPhone}
              </label>
              <div className={styles.inputContainer}>
                <input
                  id={props.vCardPhoneId}
                  type="tel"
                  value={props.vCardPhone}
                  onChange={(e) => props.setVCardPhone(e.target.value)}
                  placeholder={t.vCardPhonePlaceholder}
                  autoComplete="off"
                  className={styles.inputField}
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor={props.vCardWorkPhoneId} className="text-sm font-medium text-text-sub">
                {t.vCardWorkPhone}
              </label>
              <div className={styles.inputContainer}>
                <input
                  id={props.vCardWorkPhoneId}
                  type="tel"
                  value={props.vCardWorkPhone}
                  onChange={(e) => props.setVCardWorkPhone(e.target.value)}
                  placeholder={t.vCardWorkPhonePlaceholder}
                  autoComplete="off"
                  className={styles.inputField}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
            <div className="flex flex-col gap-2">
              <label htmlFor={props.vCardEmailId} className="text-sm font-medium text-text-sub">
                {t.vCardEmail}
              </label>
              <div className={styles.inputContainer}>
                <input
                  id={props.vCardEmailId}
                  type="email"
                  value={props.vCardEmail}
                  onChange={(e) => props.setVCardEmail(e.target.value)}
                  placeholder={t.vCardEmailPlaceholder}
                  autoComplete="off"
                  className={styles.inputField}
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor={props.vCardUrlId} className="text-sm font-medium text-text-sub">
                {t.vCardUrl}
              </label>
              <div className={styles.inputContainer}>
                <input
                  id={props.vCardUrlId}
                  type="url"
                  value={props.vCardUrl}
                  onChange={(e) => props.setVCardUrl(e.target.value)}
                  placeholder={t.vCardUrlPlaceholder}
                  autoComplete="off"
                  className={styles.inputField}
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor={props.vCardAddressId} className="text-sm font-medium text-text-sub">
              {t.vCardAddress}
            </label>
            <div className={styles.inputContainer}>
              <input
                id={props.vCardAddressId}
                type="text"
                value={props.vCardAddress}
                onChange={(e) => props.setVCardAddress(e.target.value)}
                placeholder={t.vCardAddressPlaceholder}
                autoComplete="off"
                className={styles.inputField}
              />
            </div>
          </div>
        </div>
      )}

      {/* 內容輸入：iCalendar 行事曆行程 */}
      {contentType === 'event' && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label htmlFor={props.eventSummaryId} className="text-sm font-medium text-text-sub">
              {t.eventSummary}
            </label>
            <div className={styles.inputContainer}>
              <input
                id={props.eventSummaryId}
                type="text"
                value={props.eventSummary}
                onChange={(e) => props.setEventSummary(e.target.value)}
                placeholder={t.eventSummaryPlaceholder}
                autoComplete="off"
                className={styles.inputField}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 max-sm:grid-cols-1">
            <div className="flex flex-col gap-2">
              <label htmlFor={props.eventStartId} className="text-sm font-medium text-text-sub">
                {t.eventStart}
              </label>
              <div className={styles.inputContainer}>
                <input
                  id={props.eventStartId}
                  type="datetime-local"
                  value={props.eventStart}
                  onChange={(e) => props.setEventStart(e.target.value)}
                  className="w-full bg-transparent border-none outline-none text-text-main font-medium cursor-pointer [color-scheme:dark]"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor={props.eventEndId} className="text-sm font-medium text-text-sub">
                {t.eventEnd}
              </label>
              <div className={styles.inputContainer}>
                <input
                  id={props.eventEndId}
                  type="datetime-local"
                  value={props.eventEnd}
                  onChange={(e) => props.setEventEnd(e.target.value)}
                  className="w-full bg-transparent border-none outline-none text-text-main font-medium cursor-pointer [color-scheme:dark]"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor={props.eventTimezoneId} className="text-sm font-medium text-text-sub">
                {t.eventTimezone}
              </label>
              <select
                id={props.eventTimezoneId}
                value={props.eventTimezone}
                onChange={(e) => props.setEventTimezone(e.target.value)}
                className="w-full bg-select-bg text-text-main border border-border-glass rounded-xl px-3 py-3 outline-none focus:border-[#00ff66]/40 text-sm font-medium cursor-pointer"
              >
                <option value="Asia/Taipei">Asia/Taipei (UTC+8)</option>
                <option value="Asia/Tokyo">Asia/Tokyo (UTC+9)</option>
                <option value="Asia/Shanghai">Asia/Shanghai (UTC+8)</option>
                <option value="Asia/Hong_Kong">Asia/Hong_Kong (UTC+8)</option>
                <option value="Asia/Singapore">Asia/Singapore (UTC+8)</option>
                <option value="Europe/London">Europe/London (UTC+0)</option>
                <option value="America/New_York">America/New_York (UTC-5)</option>
                <option value="America/Los_Angeles">America/Los_Angeles (UTC-8)</option>
                <option value="UTC">UTC (Universal Time)</option>
                <option value="LOCAL">{t.timezoneLocal}</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor={props.eventLocationId} className="text-sm font-medium text-text-sub">
              {t.eventLocation}
            </label>
            <div className={styles.inputContainer}>
              <input
                id={props.eventLocationId}
                type="text"
                value={props.eventLocation}
                onChange={(e) => props.setEventLocation(e.target.value)}
                placeholder={t.eventLocationPlaceholder}
                autoComplete="off"
                className={styles.inputField}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor={props.eventDescriptionId} className="text-sm font-medium text-text-sub">
              {t.eventDescription}
            </label>
            <div className={styles.inputContainer}>
              <input
                id={props.eventDescriptionId}
                type="text"
                value={props.eventDescription}
                onChange={(e) => props.setEventDescription(e.target.value)}
                placeholder={t.eventDescriptionPlaceholder}
                autoComplete="off"
                className={styles.inputField}
              />
            </div>
          </div>
        </div>
      )}

      {/* 內容輸入：WiFi 網路 */}
      {contentType === 'wifi' && (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
            <div className="flex flex-col gap-3">
              <label htmlFor={props.wifiSsidId} className="text-sm font-medium text-text-sub">
                {t.wifiSsid}
              </label>
              <div className={styles.inputContainer}>
                <input
                  id={props.wifiSsidId}
                  type="text"
                  value={props.wifiSsid}
                  onChange={(e) => props.setWifiSsid(e.target.value)}
                  placeholder={t.wifiSsidPlaceholder}
                  autoComplete="off"
                  className={styles.inputField}
                />
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <label htmlFor={props.wifiPassId} className="text-sm font-medium text-text-sub">
                {t.wifiPass}
              </label>
              <div className={styles.inputContainer}>
                <input
                  id={props.wifiPassId}
                  type="text"
                  value={props.wifiPass}
                  onChange={(e) => props.setWifiPass(e.target.value)}
                  placeholder={t.wifiPassPlaceholder}
                  autoComplete="off"
                  className={styles.inputField}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
            <div className="flex flex-col gap-3">
              <label htmlFor={props.wifiEncryptionId} className="text-sm font-medium text-text-sub">
                {t.securityType}
              </label>
              <select
                id={props.wifiEncryptionId}
                value={props.wifiEncryption}
                onChange={(e) => props.setWifiEncryption(e.target.value as WifiEncryption)}
                className="w-full bg-select-bg text-text-main border border-border-glass rounded-xl px-4 py-3 outline-none focus:border-[#00ff66]/40 text-sm font-medium cursor-pointer"
              >
                <option value="WPA">{t.wpaOption}</option>
                <option value="WPA3">{t.wpa3Option}</option>
                <option value="WPA-EAP">{t.wpaEapOption}</option>
                <option value="WEP">{t.wepOption}</option>
                <option value="nopass">{t.nopassOption}</option>
              </select>
            </div>

            <div className="flex items-center h-full pt-6 max-sm:pt-2">
              <label className="flex items-center gap-3 cursor-pointer select-none text-text-sub text-sm font-medium">
                <input
                  type="checkbox"
                  checked={props.wifiHidden}
                  onChange={(e) => props.setWifiHidden(e.target.checked)}
                  className="accent-[#00ff66] w-4.5 h-4.5 rounded"
                />
                {t.hiddenSsid}
              </label>
            </div>
          </div>
        </div>
      )}

      {/* 內容輸入：E-mail 郵件 */}
      {contentType === 'email' && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label htmlFor={props.emailToId} className="text-sm font-medium text-text-sub">
              {t.emailTo}
            </label>
            <div className={styles.inputContainer}>
              <input
                id={props.emailToId}
                type="email"
                value={props.emailTo}
                onChange={(e) => props.setEmailTo(e.target.value)}
                placeholder={t.emailToPlaceholder}
                autoComplete="off"
                className={styles.inputField}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor={props.emailSubjectId} className="text-sm font-medium text-text-sub">
              {t.emailSubject}
            </label>
            <div className={styles.inputContainer}>
              <input
                id={props.emailSubjectId}
                type="text"
                value={props.emailSubject}
                onChange={(e) => props.setEmailSubject(e.target.value)}
                placeholder={t.emailSubjectPlaceholder}
                autoComplete="off"
                className={styles.inputField}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor={props.emailBodyId} className="text-sm font-medium text-text-sub">
              {t.emailBody}
            </label>
            <div className={styles.inputContainer}>
              <input
                id={props.emailBodyId}
                type="text"
                value={props.emailBody}
                onChange={(e) => props.setEmailBody(e.target.value)}
                placeholder={t.emailBodyPlaceholder}
                autoComplete="off"
                className={styles.inputField}
              />
            </div>
          </div>
        </div>
      )}

      {/* 內容輸入：SMS 簡訊 */}
      {contentType === 'sms' && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label htmlFor={props.smsPhoneId} className="text-sm font-medium text-text-sub">
              {t.smsPhone}
            </label>
            <div className={styles.inputContainer}>
              <input
                id={props.smsPhoneId}
                type="tel"
                value={props.smsPhone}
                onChange={(e) => props.setSmsPhone(e.target.value)}
                placeholder={t.smsPhonePlaceholder}
                autoComplete="off"
                className={styles.inputField}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor={props.smsBodyId} className="text-sm font-medium text-text-sub">
              {t.smsBody}
            </label>
            <div className={styles.inputContainer}>
              <input
                id={props.smsBodyId}
                type="text"
                value={props.smsBody}
                onChange={(e) => props.setSmsBody(e.target.value)}
                placeholder={t.smsBodyPlaceholder}
                autoComplete="off"
                className={styles.inputField}
              />
            </div>
          </div>
        </div>
      )}

      {/* 內容輸入：電話撥號 */}
      {contentType === 'tel' && (
        <div className="flex flex-col gap-3">
          <label htmlFor={props.telPhoneId} className="text-sm font-medium text-text-sub">
            {t.telPhone}
          </label>
          <div className={styles.inputContainer}>
            <input
              id={props.telPhoneId}
              type="tel"
              value={props.telPhone}
              onChange={(e) => props.setTelPhone(e.target.value)}
              placeholder={t.telPhonePlaceholder}
              autoComplete="off"
              className={styles.inputField}
            />
          </div>
        </div>
      )}
    </>
  );
}
