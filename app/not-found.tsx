import Link from 'next/link';
import ToolLayout from './components/ToolLayout';

export default function NotFound() {
  const popularTools = [
    { name: '房屋貸款試算器', path: '/mortgage-loan/', color: '#00f5a0', icon: '🏠' },
    { name: '薪資勞健保計算機', path: '/my-salary-calculator/', color: '#00f5a0', icon: '💰' },
    { name: 'IP 檢測助手', path: '/ip-detector/', color: '#00f0ff', icon: '🌐' },
    { name: 'JSON 格式化驗證', path: '/json/', color: '#ff00aa', icon: '⚡' },
    { name: 'QR Code 產生器', path: '/qr-generator/', color: '#00ff66', icon: '📱' },
    { name: 'PDF 頁面組合器', path: '/pdf-processor/', color: '#ef4444', icon: '📑' },
  ];

  return (
    <ToolLayout
      title="404 - 找不到頁面"
      subtitle="404 PAGE NOT FOUND"
      description="抱歉！您存取的頁面不存在、已被移動或網址輸入錯誤。請選取下方常用工具或點擊返回首頁。"
      accentColor="#ff0055"
      accentGlow="rgba(255, 0, 85, 0.6)"
    >
      <div className="flex flex-col items-center gap-10 py-6 text-center">
        {/* 霓虹發光 404 大字區塊 */}
        <div className="relative flex items-center justify-center">
          <div className="text-8xl font-extrabold font-mono text-[#ff0055] tracking-wider drop-shadow-[0_0_35px_rgba(255,0,85,0.6)]">
            404
          </div>
        </div>

        <div className="flex flex-col gap-2 max-w-[500px]">
          <h2 className="text-xl font-bold text-white flex items-center justify-center gap-2">
            您尋找的網頁似乎飛走了
            <svg viewBox="0 0 24 24" width={22} height={22} fill="currentColor" className="text-[#ff0055]">
              <path d="M12 2.5s4.5 3.5 4.5 8.5c0 2.5-1 4.5-2.5 6l2.5 4.5-3.5-1.5-3.5 1.5 2.5-4.5c-1.5-1.5-2.5-3.5-2.5-6 0-5 4.5-8.5 4.5-8.5z" />
            </svg>
          </h2>
          <p className="text-sm text-text-sub leading-relaxed">
            別擔心！SmallTools 工具庫的所有工具均運作正常。您可以透過以下按鈕返回首頁或探索熱門工具：
          </p>
        </div>

        {/* 主行動按鈕 */}
        <Link
          href="/"
          className="px-8 py-3.5 bg-[#ff0055] text-white font-bold text-sm rounded-xl hover:shadow-[0_0_25px_rgba(255,0,85,0.6)] transition-all cursor-pointer border border-[#ff0055]"
        >
          返回工具庫首頁
        </Link>

        {/* 推薦熱門工具快速捷徑 */}
        <div className="w-full max-w-[800px] border-t border-white/[.08] pt-8 flex flex-col gap-4">
          <span className="text-sm text-[#ff0055] font-semibold uppercase tracking-[1px]">
            熱門線上工具推薦
          </span>

          <div className="grid grid-cols-3 gap-4 max-md:grid-cols-2 max-sm:grid-cols-1">
            {[
              {
                name: '房屋貸款試算器',
                path: '/mortgage-loan/',
                svg: (
                  <svg viewBox="0 0 24 24" width={22} height={22} fill="currentColor" className="text-[#00f5a0]">
                    <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
                  </svg>
                ),
              },
              {
                name: '薪資勞健保計算機',
                path: '/my-salary-calculator/',
                svg: (
                  <svg viewBox="0 0 24 24" width={22} height={22} fill="currentColor" className="text-[#00f5a0]">
                    <path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z" />
                  </svg>
                ),
              },
              {
                name: 'IP 檢測助手',
                path: '/ip-detector/',
                svg: (
                  <svg viewBox="0 0 24 24" width={22} height={22} fill="currentColor" className="text-[#00f0ff]">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
                  </svg>
                ),
              },
              {
                name: 'JSON 格式化驗證',
                path: '/json/',
                svg: (
                  <svg viewBox="0 0 24 24" width={22} height={22} fill="currentColor" className="text-[#ff00aa]">
                    <path d="M7 2v11h3v9l7-12h-4l4-8z" />
                  </svg>
                ),
              },
              {
                name: 'QR Code 產生器',
                path: '/qr-generator/',
                svg: (
                  <svg viewBox="0 0 24 24" width={22} height={22} fill="currentColor" className="text-[#00ff66]">
                    <path d="M3 11h8V3H3v8zm2-6h4v4H5V5zm8-2v8h8V3h-8zm6 6h-4V5h4v4zM3 21h8v-8H3v8zm2-6h4v4H5v-4zm13-2h-2v2h2v-2zm1 2h2v2h-2v-2zm-3 2h2v2h-2v-2zm3 2h2v2h-2v-2z" />
                  </svg>
                ),
              },
              {
                name: 'PDF 頁面組合器',
                path: '/pdf-processor/',
                svg: (
                  <svg viewBox="0 0 24 24" width={22} height={22} fill="currentColor" className="text-[#ef4444]">
                    <path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H8V4h12v12z" />
                  </svg>
                ),
              },
            ].map(t => (
              <Link
                key={t.path}
                href={t.path}
                className="bg-black/30 border border-white/[.08] hover:border-white/[.2] p-4 rounded-xl flex items-center gap-3 transition-all group hover:scale-[1.02]"
              >
                <div className="group-hover:scale-110 transition-transform shrink-0">
                  {t.svg}
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-sm font-semibold text-white group-hover:text-[#ff0055] transition-colors">
                    {t.name}
                  </span>
                  <span className="text-xs font-mono text-text-sub">{t.path}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </ToolLayout>
  );
}
