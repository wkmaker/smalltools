'use client';

import { useEffect, useRef } from 'react';
import type { ContentType } from '../types';
import styles from '../qr-generator.module.css';

interface ContentTypeTabsProps {
  contentType: ContentType;
  setContentType: (type: ContentType) => void;
  labels: {
    contentType: string;
    textOrUrl: string;
    vcardContact: string;
    calendarEvent: string;
    wifiNetwork: string;
    emailMsg: string;
    smsMsg: string;
    telCall: string;
  };
}

export default function ContentTypeTabs({
  contentType,
  setContentType,
  labels,
}: ContentTypeTabsProps) {
  const contentTypeTrackRef = useRef<HTMLDivElement>(null);
  const contentTypeBtnRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const isDraggingTrackRef = useRef<boolean>(false);
  const dragStartXRef = useRef<number>(0);
  const dragStartScrollLeftRef = useRef<number>(0);
  const hasDraggedRef = useRef<boolean>(false);

  useEffect(() => {
    const track = contentTypeTrackRef.current;
    const activeBtn = contentTypeBtnRefs.current[contentType];
    if (track && activeBtn) {
      const trackWidth = track.clientWidth;
      const btnLeft = activeBtn.offsetLeft;
      const btnWidth = activeBtn.clientWidth;
      const targetScrollLeft = btnLeft - trackWidth / 2 + btnWidth / 2;
      track.scrollTo({
        left: targetScrollLeft,
        behavior: 'smooth',
      });
    }
  }, [contentType]);

  const handleMouseDownTrack = (e: React.MouseEvent<HTMLDivElement>) => {
    const track = contentTypeTrackRef.current;
    if (!track) return;
    isDraggingTrackRef.current = true;
    dragStartXRef.current = e.pageX - track.offsetLeft;
    dragStartScrollLeftRef.current = track.scrollLeft;
    hasDraggedRef.current = false;
  };

  const handleMouseMoveTrack = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDraggingTrackRef.current) return;
    const track = contentTypeTrackRef.current;
    if (!track) return;
    e.preventDefault();
    const x = e.pageX - track.offsetLeft;
    const walk = (x - dragStartXRef.current) * 1.5;
    if (Math.abs(walk) > 5) {
      hasDraggedRef.current = true;
    }
    track.scrollLeft = dragStartScrollLeftRef.current - walk;
  };

  const handleMouseUpOrLeaveTrack = () => {
    isDraggingTrackRef.current = false;
  };

  const tabs: Array<{ id: ContentType; label: string; icon: React.ReactNode }> = [
    {
      id: 'text',
      label: labels.textOrUrl,
      icon: (
        <svg viewBox="0 0 24 24" className="w-4 h-4 fill-none stroke-current stroke-2 shrink-0">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
      ),
    },
    {
      id: 'vcard',
      label: labels.vcardContact,
      icon: (
        <svg viewBox="0 0 24 24" className="w-4 h-4 fill-none stroke-current stroke-2 shrink-0">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V4a2 2 0 012-2h2a2 2 0 012 2v2m-4 0h4m-6 7a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 3h2" />
        </svg>
      ),
    },
    {
      id: 'event',
      label: labels.calendarEvent,
      icon: (
        <svg viewBox="0 0 24 24" className="w-4 h-4 fill-none stroke-current stroke-2 shrink-0">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      ),
    },
    {
      id: 'wifi',
      label: labels.wifiNetwork,
      icon: (
        <svg viewBox="0 0 24 24" className="w-4 h-4 fill-none stroke-current stroke-2 shrink-0">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
        </svg>
      ),
    },
    {
      id: 'email',
      label: labels.emailMsg,
      icon: (
        <svg viewBox="0 0 24 24" className="w-4 h-4 fill-none stroke-current stroke-2 shrink-0">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      id: 'sms',
      label: labels.smsMsg,
      icon: (
        <svg viewBox="0 0 24 24" className="w-4 h-4 fill-none stroke-current stroke-2 shrink-0">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
    },
    {
      id: 'tel',
      label: labels.telCall,
      icon: (
        <svg viewBox="0 0 24 24" className="w-4 h-4 fill-none stroke-current stroke-2 shrink-0">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-3">
      <span className="text-sm font-medium text-text-sub">{labels.contentType}</span>
      <div
        ref={contentTypeTrackRef}
        className={styles.contentTypeTrack}
        onMouseDown={handleMouseDownTrack}
        onMouseMove={handleMouseMoveTrack}
        onMouseUp={handleMouseUpOrLeaveTrack}
        onMouseLeave={handleMouseUpOrLeaveTrack}
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            ref={(el) => {
              contentTypeBtnRefs.current[tab.id] = el;
            }}
            type="button"
            onClick={(e) => {
              if (hasDraggedRef.current) {
                e.preventDefault();
                return;
              }
              setContentType(tab.id);
            }}
            className={contentType === tab.id ? styles.tabBtnActive : styles.tabBtnInactive}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
