/**
 * Smalltools 全站共用背景微粒與氣泡爆炸反饋動效 (common-particles.js)
 * 遵循 toolbox-design-standards 規範
 * 動態讀取各工具 CSS 變數 `--theme-color`
 */

(function () {
    let canvas = document.getElementById('particle-canvas') || 
                 document.getElementById('particleCanvas') || 
                 document.getElementById('bgCanvas');
    if (!canvas) {
        canvas = document.createElement('canvas');
        canvas.id = 'particle-canvas';
        canvas.style.cssText = 'position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; pointer-events: none; z-index: -1;';
        document.body.prepend(canvas);
    } else {
        canvas.style.position = 'fixed';
        canvas.style.pointerEvents = 'none';
    }

    const ctx = canvas.getContext('2d');
    let particles = [];
    let burstParticles = [];
    let mouse = { x: null, y: null, radius: 160 };
    let flowDirection = 'up'; // 'up' or 'down'

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        adjustParticles();
    }

    // 取得當前工具設定的主題色 (優先讀取 inline 與 computed 的 --theme-color、--accent-glow、--accent-color)
    function getActiveThemeColor() {
        const docEl = document.documentElement;
        let color = docEl.style.getPropertyValue('--theme-color').trim() || 
                    getComputedStyle(docEl).getPropertyValue('--theme-color').trim() ||
                    docEl.style.getPropertyValue('--accent-glow').trim() || 
                    getComputedStyle(docEl).getPropertyValue('--accent-glow').trim() ||
                    getComputedStyle(docEl).getPropertyValue('--accent-color').trim();
        
        if (color) {
            // 如果是 rgba(r, g, b, a)，抽取出純 rgb(r, g, b) 以避免與 globalAlpha 二次乘積導致過暗
            const rgbaMatch = color.match(/rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
            if (rgbaMatch) {
                return `rgb(${rgbaMatch[1]}, ${rgbaMatch[2]}, ${rgbaMatch[3]})`;
            }
            return color;
        }
        return '#00f0ff';
    }

    class Particle {
        constructor() {
            this.reset('random');
        }
        reset(fromPos = 'random') {
            this.x = Math.random() * canvas.width;
            if (fromPos === 'top') {
                this.y = -10 - Math.random() * 20;
            } else if (fromPos === 'bottom') {
                this.y = canvas.height + Math.random() * 20;
            } else {
                this.y = Math.random() * canvas.height;
            }
            this.size = Math.random() * 1.8 + 0.6;
            this.speedY = Math.random() * 0.45 + 0.15;
            this.speedX = (Math.random() - 0.5) * 0.25;
            this.opacity = Math.random() * 0.55 + 0.15;
            this.density = Math.random() * 25 + 5;
        }
        update() {
            if (flowDirection === 'down') {
                // 倒數中：背景粒子向下飄
                this.y += this.speedY;
                this.x += this.speedX;
                if (this.y > canvas.height + 10) {
                    this.reset('top');
                }
            } else {
                // 累計中/預設：背景粒子向上飄
                this.y -= this.speedY;
                this.x += this.speedX;
                if (this.y < -10) {
                    this.reset('bottom');
                }
            }

            if (this.x < -10 || this.x > canvas.width + 10) {
                this.x = Math.random() * canvas.width;
            }

            // 滑鼠排斥效果
            if (mouse.x !== null) {
                let dx = mouse.x - this.x;
                let dy = mouse.y - this.y;
                let distance = Math.sqrt(dx * dx + dy * dy);
                if (distance < mouse.radius) {
                    let force = (mouse.radius - distance) / mouse.radius;
                    this.x -= (dx / distance) * force * (this.density * 0.4);
                    this.y -= (dy / distance) * force * (this.density * 0.4);
                }
            }
        }
        draw() {
            ctx.save();
            ctx.globalAlpha = this.opacity;
            ctx.fillStyle = getActiveThemeColor();
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }

    class BurstParticle {
        constructor(x, y, isCountUp = null) {
            this.x = x;
            this.y = y;
            this.size = Math.random() * 4 + 2;

            if (isCountUp === true) {
                // 往上噴發 (累計時間/向上計時)
                this.vx = (Math.random() - 0.5) * 3.5;
                this.vy = -(Math.random() * 2.5 + 1);
            } else if (isCountUp === false) {
                // 往下噴發 (倒數時間/向下計時)
                this.vx = (Math.random() - 0.5) * 3.5;
                this.vy = (Math.random() * 2.5 + 1);
            } else {
                // 預設全方位氣泡擴散 (點擊反饋)
                const angle = Math.random() * Math.PI * 2;
                const speed = Math.random() * 3.5 + 1;
                this.vx = Math.cos(angle) * speed;
                this.vy = Math.sin(angle) * speed;
            }

            this.alpha = 1;
            this.color = Math.random() > 0.4 ? getActiveThemeColor() : '#ffffff';
        }
        update() {
            this.x += this.vx;
            this.y += this.vy;
            this.alpha -= 0.028;
        }
        draw() {
            ctx.save();
            ctx.globalAlpha = Math.max(0, this.alpha);
            ctx.fillStyle = this.color;
            ctx.shadowBlur = 6;
            ctx.shadowColor = this.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }

    function adjustParticles() {
        // 依視窗面積動態計算目標粒子數量 (每 10,000 px² 1 顆，60 ~ 200 顆)
        const targetCount = Math.min(200, Math.max(60, Math.floor((canvas.width * canvas.height) / 10000)));
        if (particles.length < targetCount) {
            const toAdd = targetCount - particles.length;
            for (let i = 0; i < toAdd; i++) {
                particles.push(new Particle());
            }
        } else if (particles.length > targetCount) {
            particles.length = targetCount;
        }
    }

    window.addEventListener('resize', resizeCanvas);
    window.addEventListener('mousemove', (e) => {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
    });
    window.addEventListener('mouseout', () => {
        mouse.x = null;
        mouse.y = null;
    });

    resizeCanvas();

    // 全域觸發氣泡爆炸微動效
    window.triggerParticleBurst = function (x, y) {
        for (let i = 0; i < 20; i++) {
            burstParticles.push(new BurstParticle(x, y));
        }
    };
    window.createBurst = window.triggerParticleBurst;

    // 方向性粒子噴發 (用於計時器向上/向下翻頁噴發粒子)
    window.triggerDirectionalBurst = function (x, y, isCountUp) {
        const offsetY = isCountUp ? y - 10 : y + 10;
        for (let i = 0; i < 15; i++) {
            burstParticles.push(new BurstParticle(x, offsetY, isCountUp));
        }
    };
    window.createDirectionalBurst = window.triggerDirectionalBurst;

    // 動態切換背景粒子飄浮方向 ('up' 或 'down')
    window.setParticleFlowDirection = function (dir) {
        if (dir === 'up' || dir === 'down') {
            flowDirection = dir;
        }
    };

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        particles.forEach(p => {
            p.update();
            p.draw();
        });

        for (let i = burstParticles.length - 1; i >= 0; i--) {
            const p = burstParticles[i];
            p.update();
            p.draw();
            if (p.alpha <= 0) {
                burstParticles.splice(i, 1);
            }
        }

        requestAnimationFrame(animate);
    }
    animate();
})();

/**
 * 通用 Toast 訊息彈窗提示
 */
function showToast(msg) {
    let t = document.getElementById('toast');
    if (!t) {
        t = document.createElement('div');
        t.id = 'toast';
        t.className = 'toast';
        document.body.appendChild(t);
    }
    t.innerText = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 2500);
}
