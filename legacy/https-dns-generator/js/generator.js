/**
 * HTTPS DNS Generator (Type 65) 核心邏輯檔 (generator.js)
 * 支援 RFC 9460 規範生成、網址狀態雙向同步、多語言 data- 屬性讀取
 */

// 全域狀態
let currentMode = 'service';
let currentProvider = 'cf';
let syncDebounceTimer = null;

// 代管商教學模版 (多語言備用標籤)
const providerGuides = {
    cf: {
        typeLabel: 'Type (類型)',
        nameLabel: 'Name (名稱)',
        priLabel: 'Priority (優先順序)',
        targetLabel: 'Target (目標)',
        valLabel: 'Value (值 / 服務內容)',
        desc: 'Cloudflare DNS 填寫方式：'
    },
    r53: {
        desc: 'AWS Route 53 填寫方式：',
        valueNote: 'Route 53 將 Priority, Target, Value 合併在一行中填寫：'
    },
    gcdns: {
        desc: 'Google Cloud DNS 填寫方式：',
        valueNote: 'Resource Record Data 完整數據格式 (SvcPriority Target SvcParams)：'
    },
    bind: {
        desc: 'BIND 9 / Zone File 填寫方式：',
        valueNote: '在 Zone 檔中直接寫入標準 RFC 9460 格式：',
        bindNote: '請確認 BIND 版本支援 SVCB/HTTPS 紀錄 (BIND 9.16.12+ 推薦)。'
    }
};

// 語言切換 (切換時保留目前的網址 query 參數)
function switchToLang(targetLang) {
    const currentSearchParams = window.location.search;
    if (targetLang === 'en') {
        window.location.href = `./en/index.html${currentSearchParams}`;
    } else if (targetLang === 'zh') {
        window.location.href = `../index.html${currentSearchParams}`;
    }
}

// 選擇模式 (Service Mode vs Alias Mode)
function selectMode(mode, event) {
    currentMode = mode;
    const tabService = document.getElementById('tabService');
    const tabAlias = document.getElementById('tabAlias');
    if (tabService) tabService.classList.toggle('active', mode === 'service');
    if (tabAlias) tabAlias.classList.toggle('active', mode === 'alias');

    const serviceSec = document.getElementById('serviceParamsSection');
    const priorityInput = document.getElementById('priorityInput');
    const priorityHint = document.getElementById('priorityHint');

    if (mode === 'alias') {
        if (serviceSec) serviceSec.style.display = 'none';
        if (priorityInput) {
            priorityInput.value = 0;
            priorityInput.disabled = true;
        }
        if (priorityHint) {
            priorityHint.innerText = priorityHint.dataset.textAlias || '別名模式固定為 0';
        }
    } else {
        if (serviceSec) serviceSec.style.display = 'block';
        if (priorityInput) {
            if (priorityInput.value === '0') priorityInput.value = 1;
            priorityInput.disabled = false;
        }
        if (priorityHint) {
            priorityHint.innerText = priorityHint.dataset.textService || '數字越小優先權越高';
        }
    }

    if (event && event.clientX && typeof window.triggerParticleBurst === 'function') {
        window.triggerParticleBurst(event.clientX, event.clientY);
    }

    updateGenerator();
}

// 預設情境帶入 (Preset Handler)
function applyPreset(type, event) {
    const btn = event ? event.currentTarget : null;
    const toastMsg = btn && btn.dataset.toastLoaded ? btn.dataset.toastLoaded : '已載入預設設定範例';

    if (type === 'standard') {
        selectMode('service');
        document.getElementById('hostInput').value = '@';
        document.getElementById('priorityInput').value = '1';
        document.getElementById('targetInput').value = '.';
        document.getElementById('alpnH3').checked = true;
        document.getElementById('alpnH2').checked = true;
        document.getElementById('alpnH1').checked = false;
        document.getElementById('portInput').value = '';
        document.getElementById('noDefaultAlpn').checked = false;
        document.getElementById('ipv4HintInput').value = '';
        document.getElementById('ipv6HintInput').value = '';
        document.getElementById('echInput').value = '';
    } else if (type === 'alias') {
        selectMode('alias');
        document.getElementById('hostInput').value = '@';
        document.getElementById('targetInput').value = 'example.net.';
    } else if (type === 'custom-port') {
        selectMode('service');
        document.getElementById('hostInput').value = 'api';
        document.getElementById('priorityInput').value = '1';
        document.getElementById('targetInput').value = '.';
        document.getElementById('alpnH3').checked = true;
        document.getElementById('alpnH2').checked = true;
        document.getElementById('portInput').value = '8443';
        document.getElementById('ipv4HintInput').value = '198.51.100.10';
        document.getElementById('ipv6HintInput').value = '2001:db8::10';
    } else if (type === 'clear') {
        selectMode('service');
        document.getElementById('hostInput').value = '@';
        document.getElementById('priorityInput').value = '1';
        document.getElementById('targetInput').value = '.';
        document.getElementById('alpnH3').checked = false;
        document.getElementById('alpnH2').checked = false;
        document.getElementById('alpnH1').checked = false;
        document.getElementById('portInput').value = '';
        document.getElementById('noDefaultAlpn').checked = false;
        document.getElementById('ipv4HintInput').value = '';
        document.getElementById('ipv6HintInput').value = '';
        document.getElementById('echInput').value = '';
    }

    if (typeof showToast === 'function') {
        showToast(toastMsg);
    }
    updateGenerator();
}

// 核心生成運算 Logic
function updateGenerator() {
    const hostEl = document.getElementById('hostInput');
    const ttlEl = document.getElementById('ttlInput');
    const priorityEl = document.getElementById('priorityInput');
    const targetEl = document.getElementById('targetInput');

    const host = (hostEl ? hostEl.value : '@') || '@';
    const ttl = (ttlEl ? ttlEl.value : '300') || '300';
    let priority = parseInt(priorityEl ? priorityEl.value : '1', 10);
    if (isNaN(priority)) priority = currentMode === 'alias' ? 0 : 1;

    let target = (targetEl ? targetEl.value : '.') || '.';

    let paramsArr = [];

    if (currentMode === 'service') {
        // ALPN
        let alpnList = [];
        const h3 = document.getElementById('alpnH3');
        const h2 = document.getElementById('alpnH2');
        const h1 = document.getElementById('alpnH1');

        if (h3 && h3.checked) alpnList.push('h3');
        if (h2 && h2.checked) alpnList.push('h2');
        if (h1 && h1.checked) alpnList.push('http/1.1');

        if (alpnList.length > 0) {
            paramsArr.push(`alpn="${alpnList.join(',')}"`);
        }

        // Port
        const portEl = document.getElementById('portInput');
        const portVal = portEl ? portEl.value.trim() : '';
        if (portVal && portVal !== '443') {
            paramsArr.push(`port=${portVal}`);
        }

        // no-default-alpn
        const noDefEl = document.getElementById('noDefaultAlpn');
        if (noDefEl && noDefEl.checked) {
            paramsArr.push('no-default-alpn');
        }

        // ipv4hint
        const v4El = document.getElementById('ipv4HintInput');
        const ipv4Val = v4El ? v4El.value.trim() : '';
        if (ipv4Val) {
            const cleanIpv4 = ipv4Val.split(/[\s,]+/).filter(Boolean).join(',');
            if (cleanIpv4) paramsArr.push(`ipv4hint="${cleanIpv4}"`);
        }

        // ipv6hint
        const v6El = document.getElementById('ipv6HintInput');
        const ipv6Val = v6El ? v6El.value.trim() : '';
        if (ipv6Val) {
            const cleanIpv6 = ipv6Val.split(/[\s,]+/).filter(Boolean).join(',');
            if (cleanIpv6) paramsArr.push(`ipv6hint="${cleanIpv6}"`);
        }

        // ech
        const echEl = document.getElementById('echInput');
        const echVal = echEl ? echEl.value.trim() : '';
        if (echVal) {
            paramsArr.push(`ech="${echVal}"`);
        }
    }

    const valueStr = paramsArr.join(' ');
    
    // 完整紀錄字串
    let fullRecord = `${host} ${ttl} IN HTTPS ${priority} ${target}`;
    if (valueStr) {
        fullRecord += ` ${valueStr}`;
    }

    // 更新右側結果面板
    const fullOut = document.getElementById('fullRecordOutput');
    const valHost = document.getElementById('valHost');
    const valPri = document.getElementById('valPriority');
    const valTgt = document.getElementById('valTarget');
    const valVal = document.getElementById('valValue');

    const emptyText = (valVal && valVal.dataset.textEmpty) || '(空)';

    if (fullOut) fullOut.innerText = fullRecord;
    if (valHost) valHost.innerText = host;
    if (valPri) valPri.innerText = priority;
    if (valTgt) valTgt.innerText = target;
    if (valVal) valVal.innerText = valueStr || emptyText;

    // 重新渲染 DNS 代管商教學
    renderProviderGuide();

    // 網址狀態連動
    syncUrlParams({
        mode: currentMode,
        host: host,
        ttl: ttl,
        priority: priority,
        target: target,
        alpnH3: document.getElementById('alpnH3')?.checked ? 1 : 0,
        alpnH2: document.getElementById('alpnH2')?.checked ? 1 : 0,
        alpnH1: document.getElementById('alpnH1')?.checked ? 1 : 0,
        port: document.getElementById('portInput')?.value || '',
        noDefault: document.getElementById('noDefaultAlpn')?.checked ? 1 : 0,
        v4: document.getElementById('ipv4HintInput')?.value || '',
        v6: document.getElementById('ipv6HintInput')?.value || '',
        ech: document.getElementById('echInput')?.value || ''
    });
}

// 切換 DNS 代管商頁籤
function switchProvider(prov, event) {
    currentProvider = prov;
    const tabs = document.querySelectorAll('.provider-tab');
    tabs.forEach(t => t.classList.remove('active'));
    if (event && event.target) {
        event.target.classList.add('active');
    }
    renderProviderGuide();
}

function renderProviderGuide() {
    const container = document.getElementById('providerContent');
    if (!container) return;

    const isEnglish = document.documentElement.lang === 'en';

    const pri = document.getElementById('valPriority')?.innerText || '1';
    const tgt = document.getElementById('valTarget')?.innerText || '.';
    const val = document.getElementById('valValue')?.innerText || '';
    const host = document.getElementById('valHost')?.innerText || '@';
    const cleanVal = (val === '(空)' || val === '(Empty)') ? '' : val;

    if (isEnglish) {
        if (currentProvider === 'cf') {
            container.innerHTML = `
                <strong>Cloudflare DNS Setup Guide:</strong>
                <ul>
                    <li><strong>Type</strong>: Select <span class="highlight-badge">HTTPS</span></li>
                    <li><strong>Name</strong>: Enter <span class="highlight-badge">@</span> (root domain) or subdomain (e.g. <span class="highlight-badge">www</span>)</li>
                    <li><strong>Priority</strong>: <span class="highlight-badge">${pri}</span></li>
                    <li><strong>Target</strong>: <span class="highlight-badge">${tgt}</span></li>
                    <li><strong>Value</strong>: Copy the value from the Breakdown panel:<br><span class="highlight-badge">${cleanVal || '(Empty)'}</span></li>
                </ul>
            `;
        } else if (currentProvider === 'r53') {
            container.innerHTML = `
                <strong>AWS Route 53 Setup Guide:</strong>
                <ul>
                    <li><strong>Record type</strong>: Select <span class="highlight-badge">HTTPS</span></li>
                    <li><strong>Record name</strong>: Enter hostname or leave blank for root</li>
                    <li><strong>Value</strong>: Route 53 combines Priority, Target, and Value into one line:<br>
                    <span class="highlight-badge">${pri} ${tgt} ${cleanVal}`.trim() + `</span></li>
                </ul>
            `;
        } else if (currentProvider === 'gcdns') {
            container.innerHTML = `
                <strong>Google Cloud DNS Setup Guide:</strong>
                <ul>
                    <li><strong>Resource Record Type</strong>: Select <span class="highlight-badge">HTTPS</span></li>
                    <li><strong>DNS Name</strong>: e.g. <span class="highlight-badge">example.com.</span></li>
                    <li><strong>Resource Record Data</strong>: Full format (SvcPriority Target SvcParams):<br>
                    <span class="highlight-badge">${pri} ${tgt} ${cleanVal}`.trim() + `</span></li>
                </ul>
            `;
        } else if (currentProvider === 'bind') {
            container.innerHTML = `
                <strong>BIND 9 / Zone File Setup Guide:</strong>
                <ul>
                    <li>In your Zone file, write standard RFC 9460 syntax:<br>
                    <span class="highlight-badge">${host} 300 IN HTTPS ${pri} ${tgt} ${cleanVal}`.trim() + `</span></li>
                    <li>Ensure your BIND version supports SVCB/HTTPS (BIND 9.16.12+ recommended).</li>
                </ul>
            `;
        }
    } else {
        if (currentProvider === 'cf') {
            container.innerHTML = `
                <strong>Cloudflare DNS 填寫方式：</strong>
                <ul>
                    <li><strong>Type (類型)</strong>：選擇 <span class="highlight-badge">HTTPS</span></li>
                    <li><strong>Name (名稱)</strong>：填寫 <span class="highlight-badge">@</span> (代表根網域) 或子網域 (如 <span class="highlight-badge">www</span>)</li>
                    <li><strong>Priority (優先順序)</strong>：填寫 <span class="highlight-badge">${pri}</span></li>
                    <li><strong>Target (目標)</strong>：填寫 <span class="highlight-badge">${tgt}</span></li>
                    <li><strong>Value (值 / 服務內容)</strong>：直接複製右上方【值】欄位內容：<br><span class="highlight-badge">${cleanVal || '(空)'}</span></li>
                </ul>
            `;
        } else if (currentProvider === 'r53') {
            container.innerHTML = `
                <strong>AWS Route 53 填寫方式：</strong>
                <ul>
                    <li><strong>Record type</strong>：選擇 <span class="highlight-badge">HTTPS</span></li>
                    <li><strong>Record name</strong>：輸入主機名稱或留空代表根網域</li>
                    <li><strong>Value (值)</strong>：Route 53 將 Priority, Target, Value 合併在一行中填寫，例如：<br>
                    <span class="highlight-badge">${pri} ${tgt} ${cleanVal}`.trim() + `</span></li>
                </ul>
            `;
        } else if (currentProvider === 'gcdns') {
            container.innerHTML = `
                <strong>Google Cloud DNS 填寫方式：</strong>
                <ul>
                    <li><strong>Resource Record Type</strong>：選擇 <span class="highlight-badge">HTTPS</span></li>
                    <li><strong>DNS Name</strong>：例如 <span class="highlight-badge">example.com.</span></li>
                    <li><strong>Resource Record Data</strong>：輸入完整數據格式 (SvcPriority Target SvcParams)：<br>
                    <span class="highlight-badge">${pri} ${tgt} ${cleanVal}`.trim() + `</span></li>
                </ul>
            `;
        } else if (currentProvider === 'bind') {
            container.innerHTML = `
                <strong>BIND 9 / Zone File 填寫方式：</strong>
                <ul>
                    <li>在 Zone 檔中直接寫入標準 RFC 9460 格式：<br>
                    <span class="highlight-badge">${host} 300 IN HTTPS ${pri} ${tgt} ${cleanVal}`.trim() + `</span></li>
                    <li>請確認 BIND 版本支援 SVCB/HTTPS 紀錄 (BIND 9.16.12+ 推薦)。</li>
                </ul>
            `;
        }
    }
}

// 防抖網址更新
function syncUrlParams(paramsObj) {
    clearTimeout(syncDebounceTimer);
    syncDebounceTimer = setTimeout(() => {
        const searchParams = new URLSearchParams();
        for (const key in paramsObj) {
            if (paramsObj[key] !== '' && paramsObj[key] !== null && paramsObj[key] !== undefined) {
                searchParams.set(key, paramsObj[key]);
            }
        }
        const newUrl = `${window.location.pathname}?${searchParams.toString()}`;
        window.history.replaceState(null, '', newUrl);
    }, 300);
}

// 安全讀取網址參數
function loadUrlParams() {
    try {
        const params = new URLSearchParams(window.location.search);
        if (!params.has('mode') && !params.has('host')) return;

        const mode = params.get('mode') === 'alias' ? 'alias' : 'service';
        selectMode(mode);

        if (params.has('host')) document.getElementById('hostInput').value = params.get('host');
        if (params.has('ttl')) document.getElementById('ttlInput').value = params.get('ttl');
        if (params.has('priority')) document.getElementById('priorityInput').value = params.get('priority');
        if (params.has('target')) document.getElementById('targetInput').value = params.get('target');

        if (mode === 'service') {
            if (params.has('alpnH3')) document.getElementById('alpnH3').checked = params.get('alpnH3') === '1';
            if (params.has('alpnH2')) document.getElementById('alpnH2').checked = params.get('alpnH2') === '1';
            if (params.has('alpnH1')) document.getElementById('alpnH1').checked = params.get('alpnH1') === '1';
            if (params.has('port')) document.getElementById('portInput').value = params.get('port');
            if (params.has('noDefault')) document.getElementById('noDefaultAlpn').checked = params.get('noDefault') === '1';
            if (params.has('v4')) document.getElementById('ipv4HintInput').value = params.get('v4');
            if (params.has('v6')) document.getElementById('ipv6HintInput').value = params.get('v6');
            if (params.has('ech')) document.getElementById('echInput').value = params.get('ech');
        }
    } catch (e) {
        console.error('URL parse fallback:', e);
    }
}

// 複製剪貼簿（透過 data- 屬性讀取多語言提示）
function copyText(elementId, event) {
    const el = document.getElementById(elementId);
    if (!el) return;
    let textToCopy = el.innerText.trim();
    if (textToCopy === '(空)' || textToCopy === '(Empty)') textToCopy = '';

    const btn = event ? event.currentTarget : null;
    const successMsg = btn && btn.dataset.toastCopied ? btn.dataset.toastCopied : '已複製到剪貼簿！';
    const failMsg = btn && btn.dataset.toastFailed ? btn.dataset.toastFailed : '複製失敗';

    navigator.clipboard.writeText(textToCopy).then(() => {
        if (typeof showToast === 'function') showToast(successMsg);
    }).catch(err => {
        if (typeof showToast === 'function') showToast(failMsg);
    });
}

function copyShareUrl(event) {
    const btn = event ? event.currentTarget : null;
    const msg = btn && btn.dataset.toastCopied ? btn.dataset.toastCopied : '已複製帶參數之分享連結！';
    navigator.clipboard.writeText(window.location.href).then(() => {
        if (typeof showToast === 'function') showToast(msg);
    });
}

// DOM 載入後初始化
window.addEventListener('DOMContentLoaded', () => {
    loadUrlParams();
    updateGenerator();
});
