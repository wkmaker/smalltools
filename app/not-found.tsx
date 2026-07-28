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
          <h2 className="text-xl font-bold text-white">您尋找的網頁似乎飛走了 🚀</h2>
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
            {popularTools.map(t => (
              <Link
                key={t.path}
                href={t.path}
                className="bg-black/30 border border-white/[.08] hover:border-white/[.2] p-4 rounded-xl flex items-center gap-3 transition-all group hover:scale-[1.02]"
              >
                <span className="text-2xl group-hover:scale-110 transition-transform">{t.icon}</span>
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
