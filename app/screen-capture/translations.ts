export interface FaqItem {
  q: string;
  a: string;
}

export interface TranslationDict {
  title: string;
  subtitle: string;
  description: string;
  // Controls & Options
  startRecordBtn: string;
  stopRecordBtn: string;
  pauseRecordBtn: string;
  resumeRecordBtn: string;
  discardRecordBtn: string;
  downloadVideoBtn: string;
  sendToPrv5Btn: string;
  sendingToPrv5Btn: string;
  reopenPrv5Btn: string;
  cancelBtn: string;
  confirmBtn: string;

  // Settings & Toggles
  audioSettingsTitle: string;
  micToggleLabel: string;
  micSelectLabel: string;
  micSelectPlaceholder: string;
  micLevelLabel: string;
  advancedSettingsTitle: string;
  fpsLabel: string;
  bitrateLabel: string;
  bitratePresetHigh: string;
  bitratePresetStandard: string;
  bitratePresetSaver: string;
  countdownToggleLabel: string;
  storageEstimateTitle: string;
  storageEstimateDesc: (mins: number) => string;

  // Status & Badges
  statusIdle: string;
  statusSelecting: string;
  statusCountdown: string;
  statusRecording: string;
  statusPaused: string;
  statusProcessing: string;
  statusDone: string;
  recordingBadge: string;
  pausedBadge: string;

  // Done panel
  previewTitle: string;
  durationLabel: string;
  fileSizeLabel: string;
  formatLabel: string;
  prv5Title: string;
  prv5Desc: string;
  prv5StatusWaiting: string;
  prv5StatusSent: string;
  prv5StatusBlocked: string;
  prv5StatusTimeout: string;
  prv5StatusClosed: string;
  prv5StatusFailed: string;

  // Confirm Modal
  discardModalTitle: string;
  discardModalDesc: string;

  // Notices & Toasts
  noticeUnsupported: string;
  noticeSelectCancelled: string;
  noticeSelectFailed: string;
  noticeMicFailed: string;
  noticeNoSystemAudio: string;
  noticeRecorderFailed: string;
  noticeNoData: string;
  toastDownloaded: string;

  // FAQ
  faqTitle: string;
  faqSubtitle: string;
  faqItems: FaqItem[];
}

export const TRANSLATIONS: Record<'zh-TW' | 'en', TranslationDict> = {
  'zh-TW': {
    title: '極簡線上螢幕錄影工具',
    subtitle: 'MINIMALIST ONLINE SCREEN & AUDIO RECORDER',
    description:
      '免安裝、無浮水印且 100% 於瀏覽器本地執行的極簡螢幕錄影工具。支援系統音訊與麥克風旁白即時混音，錄製完成後可直接本地下載，或透過安全握手通道快捷傳送至 PRV5 私密分享。',

    startRecordBtn: '開始錄影',
    stopRecordBtn: '結束錄影',
    pauseRecordBtn: '暫停錄影',
    resumeRecordBtn: '繼續錄影',
    discardRecordBtn: '重新錄製',
    downloadVideoBtn: '下載影片',
    sendToPrv5Btn: '前往 PRV5 私密分享',
    sendingToPrv5Btn: '等待 PRV5 連線中...',
    reopenPrv5Btn: '重新開啟 PRV5 分頁',
    cancelBtn: '取消',
    confirmBtn: '確認重新錄製',

    audioSettingsTitle: '音訊收音設定',
    micToggleLabel: '收錄麥克風旁白解說',
    micSelectLabel: '選擇麥克風裝置',
    micSelectPlaceholder: '預設麥克風',
    micLevelLabel: '音量檢測條 (VU Meter)',
    advancedSettingsTitle: '進階錄影參數設定',
    fpsLabel: '幀率 (FPS)',
    bitrateLabel: '影像畫質位元率',
    bitratePresetHigh: '高畫質 (5.0 Mbps)',
    bitratePresetStandard: '標準平衡 (2.5 Mbps)',
    bitratePresetSaver: '容量節省 (1.0 Mbps)',
    countdownToggleLabel: '選取畫面後倒數 3 秒（提供緩衝切換目標視窗）',
    storageEstimateTitle: '錄影容量與時長預估',
    storageEstimateDesc: (mins: number) =>
      `依當前設定，每 1 GB 儲存空間約可錄製 ${mins} 分鐘的高清畫面（實際大小隨畫面變動複雜度浮動，靜態操作可錄更久）。`,

    statusIdle: '準備就緒',
    statusSelecting: '正在選取錄製視窗或螢幕...',
    statusCountdown: '即將開始錄製',
    statusRecording: '正在錄影中',
    statusPaused: '錄影已暫停',
    statusProcessing: '正在封裝影片與補全時長...',
    statusDone: '錄影完成',
    recordingBadge: 'REC 錄製中',
    pausedBadge: 'PAUSED 暫停',

    previewTitle: '錄製影片預覽',
    durationLabel: '影片總時長',
    fileSizeLabel: '檔案大小',
    formatLabel: '編碼格式',
    prv5Title: '快捷安全私密傳送',
    prv5Desc:
      '可將錄製檔案直接透過瀏覽器記憶體通道傳送至 PRV5 免費免註冊私密分享，端到端握手，Smalltools 本地不設檔案大小上限。',
    prv5StatusWaiting: '已開新視窗！等待 PRV5 回報就緒並安全傳遞檔案中...',
    prv5StatusSent: '檔案已成功傳送至 PRV5！請切換至該分頁取得私密下載連結。',
    prv5StatusBlocked: '瀏覽器阻擋了彈出式分頁，請允許彈出視窗或點擊下方按鈕手動開啟。',
    prv5StatusTimeout: '等待 PRV5 連線超時，請檢查網路連線或重新嘗試。',
    prv5StatusClosed: 'PRV5 分頁在傳送完成前已被關閉。',
    prv5StatusFailed: '跨視窗檔案傳送失敗，請直接使用本地下載按鈕後再手動分享。',

    discardModalTitle: '確認放棄本次錄影並重新錄製？',
    discardModalDesc: '重新錄製將會徹底釋放目前錄影內容的暫存記憶體，請確認是否已下載保存。',

    noticeUnsupported: '您的瀏覽器不支援螢幕擷取 (Screen Capture API) 或 MediaRecorder 編碼。',
    noticeSelectCancelled: '已取消螢幕畫面選取。',
    noticeSelectFailed: '畫面擷取失敗，請確認已授予螢幕錄製權限。',
    noticeMicFailed: '麥克風存取失敗，已切換為純畫面與系統音訊錄製。',
    noticeNoSystemAudio: '未偵測到系統音訊。若欲收錄電腦聲音，請在分享畫面時勾選「同時共用音訊」。',
    noticeRecorderFailed: '錄影引擎異常中斷，請重試。',
    noticeNoData: '未錄製到任何畫面資料。',
    toastDownloaded: '已觸發瀏覽器下載。',

    faqTitle: '常見問題與技術指南',
    faqSubtitle: '了解瀏覽器螢幕錄影原理、音訊混音限制、畫質位元率與 PRV5 跨視窗私密分享傳輸機制',
    faqItems: [
      {
        q: '在線上錄製螢幕畫面安全嗎？錄影內容會被上傳到伺服器嗎？',
        a: '完全安全且 100% 本地處理！\n\n① 純前端架構：\n本工具採用瀏覽器原生 Screen Capture API 與 MediaRecorder API 運作，所有畫面擷取、音訊合軌混音與影像編碼皆在您的裝置本機記憶體中完成。\n\n② 零雲端傳輸：\n未經您的明確點擊指示，檔案絕不會上傳至任何伺服器。即使選擇傳送至 PRV5，也是透過本機跨分頁 postMessage 記憶體通道直接傳遞，不經由第三方中轉伺服器。',
      },
      {
        q: '如何同時收錄「電腦播放的聲音」與「我的麥克風解說」？',
        a: '本工具內建 Web Audio API 即時合軌混音功能：\n\n① 系統聲音：\n點擊「開始錄影」彈出瀏覽器權限視窗時，若選擇「整個螢幕」或「Chrome 分頁」，請務必勾選左下角的「共用音訊 / 共用分頁音訊」核取方塊。\n\n② 麥克風旁白：\n在介面中勾選「收錄麥克風旁白解說」，並於下拉選單指定使用的麥克風硬體。錄影開始後系統會自動建立雙音軌混音器，將兩者同步無失真合軌輸出。',
      },
      {
        q: '錄影支援哪些螢幕解析度？支援 4K、雙螢幕或超寬螢幕 (21:9) 嗎？',
        a: '支援所有原生螢幕尺寸與長寬比：\n\n① 原始解析度捕捉：\n我們不強制限制或壓縮畫面的 width 與 height，完全依照您螢幕或視窗的真實像素點對點擷取，無論是 1080p、2K、4K、32:9 超寬螢幕或直立式副螢幕皆能原汁原味呈現。\n\n② 響應式自適應容器：\n預覽播放器採用等比縮放容器，可自動適配任意長寬比畫面，不會產生黑邊硬裁切或形狀拉伸失真。',
      },
      {
        q: '錄出來的影片是什麼格式？為什麼優先採用 WebM (VP9/Opus)？',
        a: '依瀏覽器環境自動採用最佳現代編碼：\n\n① 現代開源標準：\n在 Chrome、Edge 與 Firefox 下，優先採用 Google VP9 視訊編碼搭配 Opus 高音質音訊編碼封裝為 WebM。在同等畫質下，VP9 的壓縮效率遠優於舊款 H.264，能大幅縮減檔案體積並保留字型邊緣銳利度。\n\n② Safari 與 Apple 裝置相容：\n若在 macOS/iOS Safari 上執行，系統會自動切換為 Safari 支援之 MP4/H.264 編碼，確保錄影檔案具備跨平台通用相容性。',
      },
      {
        q: '為什麼有些線上錄製的 WebM 影片無法拖曳時間軸進度條？本工具如何解決？',
        a: '這是 Chromium 瀏覽器長期存在的 MediaRecorder 已知缺陷：\n\n① 缺陷成因：\n瀏覽器在即時串流錄影時，因無法事先得知總錄製時長，輸出之 WebM EBML 檔頭中的 Segment Duration 會被標記為未知長度，導致播放器無法計算時間長度與進行拖曳跳轉。\n\n② 本工具無損補寫技術：\n錄製結束後，本引擎會以位元組級解析檔頭 EBML 結構，將精確錄製毫秒數直接補寫入 Segment Info 中，其餘影片本體透過 Blob.slice 零拷貝無損銜接，使下載之影片在任何播放器中皆能流暢拖曳進度。',
      },
      {
        q: '透過「前往 PRV5 私密分享」傳送檔案有大小限制嗎？原理是什麼？',
        a: 'Smalltools 發送端無任何檔案大小硬上限：\n\n① 跨視窗安全握手：\n點擊分享後，工具會開啟 PRV5 專屬安全接收端。雙方透過 postMessage 通訊協定驗證來源網域（Strict Origin Validation），確認就緒後直接將記憶體中的 File 物件傳遞至 PRV5 分頁。\n\n② 容量上限由 PRV5 管理：\nSmalltools 本端不會對檔案大小做額外攔截，傳送大小完全遵循 PRV5 平台的規格（訪客單檔 2.5 GB / 會員 5 GB），讓您錄完即傳、免重複上傳。',
      },
      {
        q: '錄製長時間的高動態影片會耗盡電腦記憶體嗎？',
        a: '請留意瀏覽器分頁記憶體上限：\n\n① 記憶體配置機制：\n純前端錄影必須將影像片段暫存在瀏覽器內部記憶體中。標準 2.5 Mbps 畫質下，錄製 1 小時約產生 1.1 GB 資料量，絕大多數現代電腦皆能游刃有餘。\n\n② 單次聚焦保護：\n為了防止 RAM 暴增引發分頁崩潰，本工具採取單次聚焦設計。點擊「重新錄製」時會立即釋放前次錄影的 Blob URL，避免記憶體洩漏。若需錄製數小時以上的超長影片，建議分段錄製或選擇「容量節省」模式。',
      },
    ],
  },
  en: {
    title: 'Online Screen Recorder',
    subtitle: 'MINIMALIST ONLINE SCREEN & AUDIO RECORDER',
    description:
      'Free, minimalist, zero-install, and watermark-free online screen recorder running 100% locally in your browser. Features real-time audio mixing for system sound and microphone voiceover, with direct local download or secure handshake transfer to PRV5 private sharing.',

    startRecordBtn: 'Start Recording',
    stopRecordBtn: 'Stop Recording',
    pauseRecordBtn: 'Pause',
    resumeRecordBtn: 'Resume',
    discardRecordBtn: 'Record Again',
    downloadVideoBtn: 'Download Video',
    sendToPrv5Btn: 'Send to PRV5 Private Share',
    sendingToPrv5Btn: 'Connecting to PRV5...',
    reopenPrv5Btn: 'Reopen PRV5 Tab',
    cancelBtn: 'Cancel',
    confirmBtn: 'Confirm & Re-record',

    audioSettingsTitle: 'Audio Input & Voiceover Settings',
    micToggleLabel: 'Record Microphone Voiceover',
    micSelectLabel: 'Microphone Device',
    micSelectPlaceholder: 'Default Microphone',
    micLevelLabel: 'Input Level Meter (VU Meter)',
    advancedSettingsTitle: 'Advanced Recording Parameters',
    fpsLabel: 'Frame Rate (FPS)',
    bitrateLabel: 'Video Bitrate',
    bitratePresetHigh: 'High Quality (5.0 Mbps)',
    bitratePresetStandard: 'Standard Balanced (2.5 Mbps)',
    bitratePresetSaver: 'Storage Saver (1.0 Mbps)',
    countdownToggleLabel: '3-second countdown before recording (buffer time to switch windows)',
    storageEstimateTitle: 'Estimated Duration & Storage',
    storageEstimateDesc: (mins: number) =>
      `Based on current settings, approximately ${mins} minutes of HD video can be stored per 1 GB (actual file size varies with visual motion complexity).`,

    statusIdle: 'Ready',
    statusSelecting: 'Selecting screen, window, or tab...',
    statusCountdown: 'Starting soon',
    statusRecording: 'Recording',
    statusPaused: 'Paused',
    statusProcessing: 'Packaging video & patching duration metadata...',
    statusDone: 'Recording Completed',
    recordingBadge: 'REC',
    pausedBadge: 'PAUSED',

    previewTitle: 'Recorded Video Preview',
    durationLabel: 'Duration',
    fileSizeLabel: 'File Size',
    formatLabel: 'Format',
    prv5Title: 'Fast & Secure Private Sharing',
    prv5Desc:
      'Transfer the recorded video directly to PRV5 private sharing via zero-server in-browser memory channel with end-to-end handshake. Smalltools enforces no file size hard limits.',
    prv5StatusWaiting: 'New tab opened! Waiting for PRV5 to report ready for secure handshake...',
    prv5StatusSent: 'File transferred to PRV5 successfully! Please switch to that tab to finalize your share link.',
    prv5StatusBlocked: 'Pop-up window was blocked by your browser. Please allow pop-ups or click below to reopen.',
    prv5StatusTimeout: 'PRV5 handshake connection timed out. Please check your network and try again.',
    prv5StatusClosed: 'The PRV5 tab was closed before the file transfer could complete.',
    prv5StatusFailed: 'Cross-window file transfer failed. Please download the file locally and share manually.',

    discardModalTitle: 'Discard current recording and record again?',
    discardModalDesc: 'Re-recording will release the current video from memory. Please make sure you have saved or downloaded it if needed.',

    noticeUnsupported: 'Your browser does not support Screen Capture API or MediaRecorder encoding.',
    noticeSelectCancelled: 'Screen selection was cancelled.',
    noticeSelectFailed: 'Screen capture failed. Please ensure screen recording permissions are granted.',
    noticeMicFailed: 'Microphone access failed. Proceeding with screen and system audio only.',
    noticeNoSystemAudio: 'No system audio detected. To record computer audio, check "Also share audio" in the browser prompt.',
    noticeRecorderFailed: 'Recording engine encountered an unexpected error. Please try again.',
    noticeNoData: 'No video data was recorded.',
    toastDownloaded: 'Download initiated.',

    faqTitle: 'Frequently Asked Questions & Guide',
    faqSubtitle: 'Learn how in-browser screen recording works, audio mixing details, bitrate tuning, and PRV5 cross-window private sharing',
    faqItems: [
      {
        q: 'Is recording my screen online safe? Will my video be uploaded to any server?',
        a: '100% safe and processed entirely on your local machine!\n\n① Client-Side Architecture:\nThis tool utilizes the browser-native Screen Capture API and MediaRecorder API. All video capture, audio track mixing, and encoding occur within your local device memory.\n\n② Zero Cloud Uploads:\nWithout your explicit action, no data is ever transmitted to a server. Even when using PRV5 private share, the file is handed over directly between browser tabs via postMessage memory transfer without touching intermediary proxy servers.',
      },
      {
        q: 'How do I capture both system audio and my microphone commentary simultaneously?',
        a: 'This tool incorporates real-time Web Audio API track mixing:\n\n① System Sound:\nWhen the browser prompt appears after clicking "Start Recording", choose "Entire Screen" or "Chrome Tab" and ensure the "Also share system audio / tab audio" checkbox is enabled.\n\n② Microphone Voiceover:\nEnable "Record Microphone Voiceover" in the settings and select your desired microphone hardware. The tool combines both inputs into a unified stereo stream seamlessly.',
      },
      {
        q: 'What screen resolutions are supported? Does it work with 4K or ultra-wide (21:9) monitors?',
        a: 'All native display resolutions and aspect ratios are fully supported:\n\n① Native Pixel Capture:\nWe do not hardcode or downscale width and height constraints. Capture runs at full native resolution, including 1080p, 2K, 4K, 32:9 ultra-wide displays, and vertical secondary monitors.\n\n② Responsive Viewport:\nThe preview player utilizes an adaptive aspect container that naturally scales to any aspect ratio without black-bar cropping or stretch distortion.',
      },
      {
        q: 'What video format is produced? Why is WebM (VP9/Opus) preferred?',
        a: 'Modern video codecs are selected dynamically based on browser capabilities:\n\n① Modern Open Standard:\nOn Chrome, Edge, and Firefox, Google VP9 video with Opus high-fidelity audio packaged in WebM is selected by default. VP9 provides superior compression compared to legacy H.264, preserving sharp text edges at smaller file sizes.\n\n② Safari & Apple Ecosystem Compatibility:\nOn macOS and iOS Safari, the recorder automatically switches to MP4 (H.264/AAC), ensuring broad cross-device playback compatibility.',
      },
      {
        q: 'Why do some online WebM recordings lack a seekable timeline, and how is it fixed here?',
        a: 'This addresses a known long-standing Chromium MediaRecorder quirk:\n\n① The Root Cause:\nBecause real-time recording duration is unknown in advance, Chromium outputs WebM files with an unknown Segment Duration in the EBML header, causing media players to disable scrubbing and timeline jumping.\n\n② In-Memory Header Patching:\nUpon completion, our engine inspects the EBML structure at the byte level and injects the exact duration in milliseconds into the Segment Info block. The body data is rejoined zero-copy via Blob.slice, ensuring instant seekability in VLC, QuickTime, and web players.',
      },
      {
        q: 'Are there file size limits when using "Send to PRV5 Private Share"? How does it work?',
        a: 'Smalltools enforces no file size hard cap on the sending side:\n\n① Cross-Window Handshake:\nClicking share opens the dedicated PRV5 receiver tab. The two windows verify identity using strict origin matching before transferring the in-memory File object via postMessage.\n\n② Quotas Enforced by PRV5:\nSmalltools does not artificially limit your video size. All transfer limits conform to PRV5 policies (2.5 GB for guest uploads, 5 GB for registered accounts), providing seamless recording and sharing.',
      },
      {
        q: 'Will recording long sessions consume all my computer memory?',
        a: 'Keep browser tab memory limits in mind for very long sessions:\n\n① In-Memory Buffer Model:\nPure client-side recording stores encoded chunks in browser memory. At 2.5 Mbps, one hour of video produces approximately 1.1 GB of data, which modern computers handle with ease.\n\n② Single-Session Memory Hygiene:\nTo prevent tab crashes from runaway memory consumption, this tool maintains a single active recording. Clicking "Record Again" promptly revokes the previous Blob URL to prevent leaks. For multi-hour marathons, consider recording in chapters or using "Storage Saver" mode.',
      },
    ],
  },
};
