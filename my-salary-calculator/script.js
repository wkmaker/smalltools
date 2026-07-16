// ==========================================
// 1. 初始化與全域變數
// ==========================================
const SUPPORTED_YEARS = [2026, 2025, 2024];
let currentConfig = null;
let urlDebounceTimer = null;

// DOM 元素
const yearSelect = document.getElementById('yearSelect');
const salaryInput = document.getElementById('salaryInput');
const dependentSelect = document.getElementById('dependentSelect');
const pensionSelfRateSelect = document.getElementById('pensionSelfRateSelect');
const taxRateSelect = document.getElementById('taxRateSelect');
const calculateBtn = document.getElementById('calculateBtn');
const copyToast = document.getElementById('copy-toast');
const toastText = document.getElementById('toast-text');

// 輸出欄位 DOM 元素
const valEmpTotal = document.getElementById('val-emp-total');
const valEmpLabor = document.getElementById('val-emp-labor');
const valEmpHealth = document.getElementById('val-emp-health');
const valEmpPension = document.getElementById('val-emp-pension');
const valEmpTax = document.getElementById('val-emp-tax');
const valEmpNet = document.getElementById('val-emp-net');

const matrixParamsGroup = document.getElementById('matrixParamsGroup');
const taxSalaryInput = document.getElementById('taxSalaryInput');
const taxDependentsSelect = document.getElementById('taxDependentsSelect');

const valEmprLabor = document.getElementById('val-empr-labor');
const valEmprHealth = document.getElementById('val-empr-health');
const valEmprPension = document.getElementById('val-empr-pension');
const valEmprTotal = document.getElementById('val-empr-total');

// ==========================================
// 2. 年份法規 Fetch 載入與暫存
// ==========================================
async function loadYearConfig(year) {
    try {
        const response = await fetch(`./config/${year}.json`);
        if (!response.ok) throw new Error(`無法載入 ${year} 年的設定檔`);
        currentConfig = await response.json();
        calculate();
    } catch (error) {
        console.error(error);
        showToast("法規資料載入失敗，將採用預設值。");
    }
}

// 渲染年份下拉選單
function initYearOptions() {
    yearSelect.innerHTML = '';
    SUPPORTED_YEARS.forEach(y => {
        const opt = document.createElement('option');
        opt.value = y;
        opt.textContent = `${y} 年${y === 2026 ? ' (最新)' : ' (歷史)'}`;
        yearSelect.appendChild(opt);
    });
    
    // 預設選擇最新年份
    yearSelect.value = SUPPORTED_YEARS[0];
}

// ==========================================
// 3. 核心計算邏輯
// ==========================================
function findInsuredAmount(salary, brackets) {
    if (!brackets || brackets.length === 0) return 0;
    // 防呆處理
    const val = Math.max(0, parseFloat(salary) || 0);
    const match = brackets.find(b => val >= b.min && val <= b.max);
    if (match) return match.insured;
    return brackets[brackets.length - 1].insured;
}

// 薪資所得稅矩陣查表估算函數 (對照財政部薪資所得扣繳稅額表)
function lookupMatrixTax(salary, dependents, year) {
    let base = 90501;
    if (year === 2024) base = 86001;
    else if (year === 2025) base = 88501;
    
    // 扣除扶養親屬額度，扶養親屬免稅額每人每月約 8,400 元
    const shift = dependents * 8400;
    const S = salary - shift;
    
    if (S < base) return 0;
    
    const diff = S - base;
    
    // 依據級距年份進行分段速算
    if (diff <= 10500) {
        const k = Math.floor(diff / 500);
        return 2020 + Math.floor(k / 2) * 50 + (k % 2 === 1 ? 30 : 0);
    } else if (diff <= 75000) {
        const k = Math.floor((diff - 10500) / 500);
        let startTax = 2560;
        if (year === 2024) startTax = 2460;
        else if (year === 2025) startTax = 2510;
        return startTax + k * 60;
    } else if (diff <= 190000) {
        const k = Math.floor((diff - 75000) / 500);
        let startTax = 10340;
        if (year === 2024) startTax = 10140;
        else if (year === 2025) startTax = 10240;
        return startTax + k * 100;
    } else {
        const k = Math.floor((diff - 190000) / 500);
        let startTax = 33340;
        if (year === 2024) startTax = 32840;
        else if (year === 2025) startTax = 33090;
        return startTax + k * 150;
    }
}

function calculate() {
    const rawSalaryStr = salaryInput.value.trim();
    if (!rawSalaryStr || isNaN(parseFloat(rawSalaryStr))) {
        resetOutputs();
        return;
    }

    const salary = parseFloat(rawSalaryStr);
    if (salary < 0) {
        resetOutputs();
        return;
    }

    if (!currentConfig) return;

    const dependents = parseInt(dependentSelect.value, 10);
    const selfPensionRate = parseFloat(pensionSelfRateSelect.value);
    const taxMethod = taxRateSelect.value;
    const year = parseInt(yearSelect.value, 10);

    // 控制大表參數面板之顯示
    if (taxMethod === 'matrix') {
        matrixParamsGroup.style.display = 'block';
    } else {
        matrixParamsGroup.style.display = 'none';
    }

    // 1. 查投保級距金額
    const insuredLabor = findInsuredAmount(salary, currentConfig.labor_insurance.brackets);
    const insuredHealth = findInsuredAmount(salary, currentConfig.health_insurance.brackets);
    const insuredPension = findInsuredAmount(salary, currentConfig.labor_pension.brackets);

    // 2. 員工端計算 (四捨五入)
    // 勞保自付額 = 投保金額 * 費率 * 員工自付比例
    const empLabor = Math.round(insuredLabor * currentConfig.labor_insurance.rate * currentConfig.labor_insurance.employee_ratio + 1e-9);
    // 健保自付額 = 投保金額 * 費率 * 員工自付比例 * (1 + 眷屬人數)
    const empHealth = Math.round(insuredHealth * currentConfig.labor_insurance.rate * currentConfig.labor_insurance.employee_ratio * (1 + dependents) + 1e-9);
    // 勞退個人自提 = 提繳金額 * 自提比例
    const empPension = Math.round(insuredPension * selfPensionRate + 1e-9);
    
    // 所得稅預扣額計算
    let empTax = 0;
    if (taxMethod === 'rate_5') {
        const calculatedTax = salary * 0.05;
        if (calculatedTax >= 2000) {
            empTax = Math.round(calculatedTax + 1e-9);
        }
    } else if (taxMethod === 'matrix') {
        const taxSalaryStr = taxSalaryInput.value.trim();
        const taxSalary = (taxSalaryStr !== '' && !isNaN(parseFloat(taxSalaryStr))) ? parseFloat(taxSalaryStr) : salary;
        const taxDependents = parseInt(taxDependentsSelect.value, 10);

        if (currentConfig.withholding_tax_table) {
            const match = currentConfig.withholding_tax_table.find(row => taxSalary >= row[0] && taxSalary <= row[1]);
            if (match) {
                const depIndex = Math.min(11, taxDependents);
                empTax = match[2 + depIndex];
            } else if (taxSalary < 80001) {
                empTax = 0;
            } else {
                empTax = lookupMatrixTax(taxSalary, taxDependents, year);
            }
        } else {
            empTax = lookupMatrixTax(taxSalary, taxDependents, year);
        }
    }
    // 實領薪水 = 月薪總額 - 勞保自付 - 健保自付 - 勞退自提 - 所得稅預扣
    const empNet = Math.round(salary - empLabor - empHealth - empPension - empTax);

    // 3. 雇主端計算 (四捨五入)
    // 勞保雇主負擔 = 投保金額 * 費率 * 雇主負擔比例
    const emprLabor = Math.round(insuredLabor * currentConfig.labor_insurance.rate * currentConfig.labor_insurance.employer_ratio + 1e-9);
    // 健保雇主負擔 = 投保金額 * 費率 * 雇主負擔比例 * (1 + 平均眷口數)
    const emprHealth = Math.round(insuredHealth * currentConfig.health_insurance.rate * currentConfig.health_insurance.employer_ratio * (1 + currentConfig.health_insurance.employer_average_dependents) + 1e-9);
    // 勞退雇主提繳 = 提繳金額 * 雇主提繳率 (6%)
    const emprPension = Math.round(insuredPension * currentConfig.labor_pension.employer_rate + 1e-9);
    // 雇主總勞務成本 = 薪資總額 + 雇主勞保 + 雇主健保 + 雇主勞退
    const emprTotal = Math.round(salary + emprLabor + emprHealth + emprPension);

    // 4. 渲染至 UI
    valEmpTotal.textContent = Math.round(salary).toLocaleString('zh-TW');
    valEmpLabor.textContent = empLabor.toLocaleString('zh-TW');
    valEmpHealth.textContent = empHealth.toLocaleString('zh-TW');
    valEmpPension.textContent = empPension.toLocaleString('zh-TW');
    
    valEmpTax.textContent = empTax.toLocaleString('zh-TW');
    valEmpNet.textContent = empNet.toLocaleString('zh-TW');

    valEmprLabor.textContent = emprLabor.toLocaleString('zh-TW');
    valEmprHealth.textContent = emprHealth.toLocaleString('zh-TW');
    valEmprPension.textContent = emprPension.toLocaleString('zh-TW');
    valEmprTotal.textContent = emprTotal.toLocaleString('zh-TW');
}

function resetOutputs() {
    valEmpTotal.textContent = '-';
    valEmpLabor.textContent = '-';
    valEmpHealth.textContent = '-';
    valEmpPension.textContent = '-';
    valEmpTax.textContent = '-';
    valEmpNet.textContent = '-';

    valEmprLabor.textContent = '-';
    valEmprHealth.textContent = '-';
    valEmprPension.textContent = '-';
    valEmprTotal.textContent = '-';
}

// ==========================================
// 4. 網址參數雙向連動與防呆
// ==========================================
function syncToURL() {
    const params = new URLSearchParams();
    params.set('y', yearSelect.value);
    if (salaryInput.value.trim() !== '') {
        params.set('s', salaryInput.value.trim());
    }
    params.set('d', dependentSelect.value);
    params.set('p', pensionSelfRateSelect.value);
    params.set('t', taxRateSelect.value);
    
    if (taxRateSelect.value === 'matrix') {
        if (taxSalaryInput.value.trim() !== '') {
            params.set('ts', taxSalaryInput.value.trim());
        }
        params.set('td', taxDependentsSelect.value);
    }
    
    const newUrl = params.toString() ? '?' + params.toString() : window.location.pathname;
    history.replaceState(null, '', newUrl);
}

function syncToURLDebounced() {
    clearTimeout(urlDebounceTimer);
    urlDebounceTimer = setTimeout(syncToURL, 300);
}

function initFromURL() {
    const params = new URLSearchParams(window.location.search);
    if (!params.toString()) return false;

    // 解析年份
    const yVal = parseInt(params.get('y'), 10);
    if (SUPPORTED_YEARS.includes(yVal)) {
        yearSelect.value = yVal;
    }

    // 解析薪水 (安全防呆過濾)
    const sVal = parseFloat(params.get('s'));
    if (!isNaN(sVal) && isFinite(sVal) && sVal >= 0) {
        salaryInput.value = sVal;
    } else {
        salaryInput.value = '';
    }

    // 解析眷屬
    const dVal = params.get('d');
    if (['0', '1', '2', '3'].includes(dVal)) {
        dependentSelect.value = dVal;
    }

    // 解析勞退自提
    const pVal = params.get('p');
    if (['0', '0.01', '0.02', '0.03', '0.04', '0.05', '0.06'].includes(pVal)) {
        pensionSelfRateSelect.value = pVal;
    }

    // 解析所得稅預扣
    const tVal = params.get('t');
    if (['rate_5', 'matrix'].includes(tVal)) {
        taxRateSelect.value = tVal;
    } else {
        taxRateSelect.value = 'rate_5';
    }

    if (taxRateSelect.value === 'matrix') {
        const tsVal = parseFloat(params.get('ts'));
        if (!isNaN(tsVal) && isFinite(tsVal) && tsVal >= 0) {
            taxSalaryInput.value = tsVal;
        }
        const tdVal = params.get('td');
        if (['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11'].includes(tdVal)) {
            taxDependentsSelect.value = tdVal;
        }
    }

    return true;
}

// ==========================================
// 5. 事件監聽設定與即時計算
// ==========================================
function bindEvents() {
    yearSelect.addEventListener('change', () => {
        loadYearConfig(yearSelect.value);
        syncToURL();
    });

    // 薪資打字時即時無感計算，並防抖同步 URL
    salaryInput.addEventListener('input', () => {
        calculate();
        syncToURLDebounced();
    });
    salaryInput.addEventListener('blur', syncToURL);

    dependentSelect.addEventListener('change', () => {
        calculate();
        syncToURL();
    });

    pensionSelfRateSelect.addEventListener('change', () => {
        calculate();
        syncToURL();
    });

    taxRateSelect.addEventListener('change', () => {
        if (taxRateSelect.value === 'matrix') {
            if (!taxSalaryInput.value.trim()) {
                taxSalaryInput.value = salaryInput.value;
            }
            taxDependentsSelect.value = Math.min(11, parseInt(dependentSelect.value, 10)).toString();
        }
        calculate();
        syncToURL();
    });

    taxSalaryInput.addEventListener('input', () => {
        calculate();
        syncToURLDebounced();
    });
    taxSalaryInput.addEventListener('blur', syncToURL);

    taxDependentsSelect.addEventListener('change', () => {
        calculate();
        syncToURL();
    });

    calculateBtn.addEventListener('click', (e) => {
        calculate();
        syncToURL();
        if (typeof createBurst === 'function') {
            createBurst(e.clientX, e.clientY);
        }
        showToast("計算完成！已套用最新參數");
    });
}

// ==========================================
// 6. 點擊複製與 Toast 特效
// ==========================================
let toastTimeout = null;
function showToast(text) {
    toastText.textContent = text;
    copyToast.classList.add('show');
    
    if (toastTimeout) clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
        copyToast.classList.remove('show');
    }, 2500);
}

function initCopyEvents() {
    document.querySelectorAll('.result-item').forEach(item => {
        item.setAttribute('title', '點擊即可複製金額');
        item.addEventListener('click', () => {
            const valEl = item.querySelector('.result-value');
            if (valEl && valEl.textContent !== '-') {
                const cleanVal = valEl.textContent.replace(/,/g, '').trim();
                navigator.clipboard.writeText(cleanVal).then(() => {
                    const label = item.querySelector('.result-label').textContent;
                    showToast(`已複製 ${label}: ${valEl.textContent} 元`);
                }).catch(err => {
                    console.error("複製失敗:", err);
                });
            }
        });
    });
}

// ==========================================
// 7. 薄荷綠粒子背景與氣泡爆炸特效 (Canvas)
// ==========================================
const canvas = document.getElementById('particle-canvas');
const ctx = canvas.getContext('2d');
let particles = [];
let mouse = { x: null, y: null, radius: 150 };

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    adjustParticles();
}

class Particle {
    constructor(x = null, y = null, isBurst = false) {
        this.x = x !== null ? x : Math.random() * canvas.width;
        this.y = y !== null ? y : Math.random() * canvas.height;
        this.size = Math.random() * 1.5 + 0.5;
        this.density = (Math.random() * 30) + 1;
        
        this.isBurst = isBurst;
        this.life = isBurst ? 1.0 : -1;
        
        if (isBurst) {
            this.velocityX = (Math.random() - 0.5) * 4;
            this.velocityY = (Math.random() - 0.5) * 4;
        } else {
            this.velocityY = -((Math.random() * 0.4) + 0.1); // 緩慢向上漂浮
            this.velocityX = (Math.random() - 0.5) * 0.2;     // 輕微左右微擺
        }
    }
    
    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.closePath();
        
        let alpha = this.isBurst ? this.life : this.size / 3.5;
        // 薄荷綠霓虹配色 (0, 245, 160)
        ctx.fillStyle = this.isBurst 
            ? `rgba(0, 245, 160, ${alpha})`
            : `rgba(0, 245, 160, ${alpha * 0.8})`;
        ctx.fill();
    }
    
    update() {
        if (this.isBurst) {
            this.x += this.velocityX;
            this.y += this.velocityY;
            this.life -= 0.025;
            this.velocityX *= 0.95;
            this.velocityY *= 0.95;
        } else {
            this.y += this.velocityY;
            this.x += this.velocityX;
            
            // 邊界重設
            if (this.y < 0) {
                this.y = canvas.height;
                this.x = Math.random() * canvas.width;
            }
            if (this.x < 0 || this.x > canvas.width) {
                this.x = Math.random() * canvas.width;
            }
        }

        // 滑鼠排斥效果
        let dx = mouse.x - this.x;
        let dy = mouse.y - this.y;
        let distance = Math.sqrt(dx * dx + dy * dy);
        if (mouse.x !== null && distance < mouse.radius) {
            let force = (mouse.radius - distance) / mouse.radius;
            this.x -= (dx / distance) * force * this.density * 0.6;
            this.y -= (dy / distance) * force * this.density * 0.6;
        }
    }
}

function adjustParticles() {
    const targetCount = Math.floor((canvas.width * canvas.height) / 10000);
    let bgParticles = particles.filter(p => !p.isBurst);
    const burstParticles = particles.filter(p => p.isBurst);

    bgParticles.forEach(p => {
        if (p.x > canvas.width) p.x = Math.random() * canvas.width;
        if (p.y > canvas.height) p.y = Math.random() * canvas.height;
    });

    if (bgParticles.length < targetCount) {
        const toAdd = targetCount - bgParticles.length;
        for (let i = 0; i < toAdd; i++) {
            bgParticles.push(new Particle());
        }
    } else if (bgParticles.length > targetCount) {
        bgParticles = bgParticles.slice(0, targetCount);
    }

    particles = [...bgParticles, ...burstParticles];
}

function createBurst(x, y) {
    for (let i = 0; i < 15; i++) {
        particles.push(new Particle(x, y, true));
    }
}

function animateParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    for (let i = particles.length - 1; i >= 0; i--) {
        let p = particles[i];
        p.update();
        p.draw();
        
        if (p.isBurst && p.life <= 0) {
            particles.splice(i, 1);
        }
    }
    requestAnimationFrame(animateParticles);
}

// 綁定 Canvas 滑鼠與視窗事件
function initCanvasEffects() {
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    
    window.addEventListener('mousemove', (e) => {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
    });
    
    window.addEventListener('mousedown', (e) => {
        mouse.radius = 280;
        createBurst(e.clientX, e.clientY);
    });
    
    window.addEventListener('mouseup', () => { mouse.radius = 150; });
    window.addEventListener('mouseout', () => { mouse.x = null; mouse.y = null; });

    animateParticles();
}

// ==========================================
// 8. 入口初始化
// ==========================================
async function init() {
    initYearOptions();
    bindEvents();
    initCopyEvents();
    initCanvasEffects();
    
    const loadedFromURL = initFromURL();
    
    // 讀取對應法規檔並計算
    await loadYearConfig(yearSelect.value);
    
    // 若沒有網址參數，則預設空白 (已經在 resetOutputs 處理為 '-')
    if (!loadedFromURL) {
        resetOutputs();
    }
}

document.addEventListener('DOMContentLoaded', init);
