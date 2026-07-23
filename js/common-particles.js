/**
 * Smalltools 全站共用背景微粒與氣泡爆炸反饋動效 (common-particles.js)
 * 遵循 toolbox-design-standards 規範
 * 動態讀取各工具 CSS 變數 `--theme-color`
 */

(function () {
    let canvas = document.getElementById('bgCanvas');
    if (!canvas) {
        canvas = document.createElement('canvas');
        canvas.id = 'bgCanvas';
        document.body.prepend(canvas);
    }

    const ctx = canvas.getContext('2d');
    let particles = [];
    let burstParticles = [];

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    // 取得當前工具設定的主題色 (預設 #00f0ff)
    function getActiveThemeColor() {
        const themeColor = getComputedStyle(document.documentElement)
                            .getPropertyValue('--theme-color').trim();
        return themeColor || '#00f0ff';
    }

    class Particle {
        constructor() {
            this.reset();
        }
        reset() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.size = Math.random() * 2 + 0.5;
            this.speedY = Math.random() * 0.4 + 0.1;
            this.opacity = Math.random() * 0.5 + 0.1;
            this.hue = Math.random() > 0.5 ? 270 : 190; // 紫色與青藍色交替
        }
        update() {
            this.y -= this.speedY;
            if (this.y < 0) {
                this.y = canvas.height;
                this.x = Math.random() * canvas.width;
            }
        }
        draw() {
            ctx.fillStyle = `hsla(${this.hue}, 100%, 70%, ${this.opacity})`;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    class BurstParticle {
        constructor(x, y, isCountUp = null) {
            this.x = x;
            this.y = y;
            this.size = Math.random() * 4 + 2;

            if (isCountUp === true) {
                // 往上噴發 (累計時間/向上計時)
                this.vx = (Math.random() - 0.5) * 3;
                this.vy = -(Math.random() * 2 + 1);
            } else if (isCountUp === false) {
                // 往下噴發 (倒數時間/向下計時)
                this.vx = (Math.random() - 0.5) * 3;
                this.vy = (Math.random() * 2 + 1);
            } else {
                // 預設全方位氣泡擴散 (點擊反饋)
                const angle = Math.random() * Math.PI * 2;
                const speed = Math.random() * 3 + 1;
                this.vx = Math.cos(angle) * speed;
                this.vy = Math.sin(angle) * speed;
            }

            this.alpha = 1;
            this.color = Math.random() > 0.5 ? getActiveThemeColor() : '#a855f7';
        }
        update() {
            this.x += this.vx;
            this.y += this.vy;
            this.alpha -= 0.03;
        }
        draw() {
            ctx.globalAlpha = Math.max(0, this.alpha);
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
        }
    }

    for (let i = 0; i < 40; i++) {
        particles.push(new Particle());
    }

    // 全域觸發氣泡爆炸微動效
    window.triggerParticleBurst = function (x, y) {
        for (let i = 0; i < 15; i++) {
            burstParticles.push(new BurstParticle(x, y));
        }
    };
    window.createBurst = window.triggerParticleBurst;

    // 方向性粒子噴發 (用於計時器向上/向下翻頁噴發粒子)
    window.triggerDirectionalBurst = function (x, y, isCountUp) {
        const offsetY = isCountUp ? y - 10 : y + 10;
        for (let i = 0; i < 12; i++) {
            burstParticles.push(new BurstParticle(x, offsetY, isCountUp));
        }
    };
    window.createDirectionalBurst = window.triggerDirectionalBurst;

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
