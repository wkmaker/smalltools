'use client';

import { useId } from 'react';
import styles from '../image-processor.module.css';
import { TRANSLATIONS } from '../translations';

type Translations = (typeof TRANSLATIONS)[keyof typeof TRANSLATIONS];

interface ImageDropzoneProps {
  onFilesLoad: (fileList: FileList) => void;
  t: Translations;
}

export default function ImageDropzone({ onFilesLoad, t }: ImageDropzoneProps) {
  const fileInputId = useId();

  return (
    <div
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        if (e.dataTransfer.files.length > 0) onFilesLoad(e.dataTransfer.files);
      }}
      onClick={() => document.getElementById(fileInputId)?.click()}
      className={`p-14 rounded-3xl flex flex-col items-center justify-center gap-4 cursor-pointer text-center ${styles.dropzone}`}
    >
      <input
        id={fileInputId}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files) onFilesLoad(e.target.files);
          e.target.value = '';
        }}
      />
      <div className="w-20 h-20 rounded-3xl bg-[#d946ef]/15 text-[#d946ef] flex items-center justify-center border border-[#d946ef]/30 shadow-[0_0_30px_rgba(217,70,239,0.2)]">
        <svg viewBox="0 0 24 24" width={36} height={36} fill="currentColor" className="text-[#d946ef]">
          <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
        </svg>
      </div>
      <div className="flex flex-col gap-1.5">
        <span className="text-lg font-bold text-text-main">{t.dropzoneTitle}</span>
        <span className="text-xs text-text-sub">{t.dropzoneSub}</span>
      </div>
    </div>
  );
}
