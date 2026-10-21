'use client';

import { useEffect } from 'react';

/**
 * ParticleCanvas - 全站共用背景微粒與氣泡爆炸反饋動效
 * 移植自 js/common-particles.js，改為 React Client Component
 * 遵循 toolbox-design-standards 規範與介面流暢性準則：
 * 1. 樣式與主題色全快取（MutationObserver），徹底消滅每幀逐粒子調用 getComputedStyle 造成的 Layout Thrashing。
 * 2. 整合 Page Visibility API，分頁處於背景時智慧暫停動畫，節省 GPU 與 CPU 資源。
 * 3. 支援 prefers-reduced-motion 與行動端自適應微粒密度，防止過度耗電與動態暈眩。
 */
export default function ParticleCanvas() {
  useEffect(() => {
    let canvas = document.getElementById('particle-canvas') as HTMLCanvasElement | null;
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.id = 'particle-canvas';
      canvas.style.cssText =
        'position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; pointer-events: none; z-index: -1;';
      document.body.prepend(canvas);
    }

    const ctx = canvas.getContext('2d')!;
    let particles: Particle[] = [];
    let burstParticles: BurstParticle[] = [];
    const mouse = { x: null as number | null, y: null as number | null, radius: 160 };
    let flowDirection: 'up' | 'down' = 'up';
    let animationId: number = 0;
    let isRunning = false;

    // 主題狀態與色彩快取（徹底消滅逐幀 getComputedStyle）
    let cachedIsLight = false;
    let cachedThemeColor = '#00f0ff';
    let cachedThemeRgb = '0, 240, 255';
    let prefersReducedMotion = false;

    function updateThemeCache() {
      const docEl = document.documentElement;
      cachedIsLight = docEl.getAttribute('data-theme') === 'light';
      const rawColor =
        docEl.style.getPropertyValue('--theme-color').trim() ||
        getComputedStyle(docEl).getPropertyValue('--theme-color').trim() ||
        docEl.style.getPropertyValue('--accent-glow').trim() ||
        getComputedStyle(docEl).getPropertyValue('--accent-glow').trim() ||
        getComputedStyle(docEl).getPropertyValue('--accent-color').trim();

      if (rawColor) {
        const rgbaMatch = rawColor.match(/rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
        if (rgbaMatch) {
          const r = parseInt(rgbaMatch[1], 10);
          const g = parseInt(rgbaMatch[2], 10);
          const b = parseInt(rgbaMatch[3], 10);
          if (cachedIsLight) {
            const lr = Math.max(0, r - 20);
            const lg = Math.max(0, g - 20);
            const lb = Math.min(255, b + 20);
            cachedThemeColor = `rgb(${lr}, ${lg}, ${lb})`;
            cachedThemeRgb = `${lr}, ${lg}, ${lb}`;
          } else {
            cachedThemeColor = `rgb(${r}, ${g}, ${b})`;
            cachedThemeRgb = `${r}, ${g}, ${b}`;
          }
        } else {
          cachedThemeColor = rawColor;
          cachedThemeRgb = cachedIsLight ? '2, 132, 199' : '0, 240, 255';
        }
      } else {
        cachedThemeColor = cachedIsLight ? '#0284c7' : '#00f0ff';
        cachedThemeRgb = cachedIsLight ? '2, 132, 199' : '0, 240, 255';
      }
    }

    // 監聽使用者偏好減少動效
    const motionQuery = typeof window !== 'undefined' && window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
    if (motionQuery) {
      prefersReducedMotion = motionQuery.matches;
      const onMotionChange = (e: MediaQueryListEvent) => {
        prefersReducedMotion = e.matches;
      };
      if (motionQuery.addEventListener) {
        motionQuery.addEventListener('change', onMotionChange);
      }
    }

    // 初始化快取
    updateThemeCache();

    // 監聽 HTML 屬性與樣式變化以動態更新色彩快取
    const themeObserver = new MutationObserver(() => {
      updateThemeCache();
    });
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme', 'style', 'class'],
    });

    function connectParticles() {
      const maxDistance = 125;

      for (let a = 0; a < particles.length; a++) {
        for (let b = a + 1; b < particles.length; b++) {
          const dx = particles[a].x - particles[b].x;
          const dy = particles[a].y - particles[b].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < maxDistance) {
            const opacityFactor = (1 - dist / maxDistance);
            ctx.beginPath();
            ctx.moveTo(particles[a].x, particles[a].y);
            ctx.lineTo(particles[b].x, particles[b].y);

            if (cachedIsLight) {
              ctx.strokeStyle = `rgba(2, 132, 199, ${opacityFactor * 0.28})`;
              ctx.lineWidth = 1.2;
            } else {
              // 暗色模式：動態連動主題色彩快取
              ctx.strokeStyle = `rgba(${cachedThemeRgb}, ${opacityFactor * 0.20})`;
              ctx.lineWidth = 0.9;
            }
            ctx.stroke();
          }
        }
      }
    }

    class Particle {
      x = 0; y = 0; size = 0; speedY = 0; speedX = 0; opacity = 0; density = 0;
      constructor() { this.reset('random'); }
      reset(fromPos = 'random') {
        this.x = Math.random() * canvas!.width;
        if (fromPos === 'top') this.y = -10 - Math.random() * 20;
        else if (fromPos === 'bottom') this.y = canvas!.height + Math.random() * 20;
        else this.y = Math.random() * canvas!.height;
        this.size = Math.random() * 1.8 + 1.2;
        this.speedY = Math.random() * 0.35 + 0.12;
        this.speedX = (Math.random() - 0.5) * 0.2;
        this.opacity = Math.random() * 0.45 + 0.35;
        this.density = Math.random() * 25 + 5;
      }
      update() {
        const speedMultiplier = prefersReducedMotion ? 0.2 : 1;
        if (flowDirection === 'down') {
          this.y += this.speedY * speedMultiplier; this.x += this.speedX * speedMultiplier;
          if (this.y > canvas!.height + 10) this.reset('top');
        } else {
          this.y -= this.speedY * speedMultiplier; this.x += this.speedX * speedMultiplier;
          if (this.y < -10) this.reset('bottom');
        }
        if (this.x < -10 || this.x > canvas!.width + 10) this.x = Math.random() * canvas!.width;
        if (mouse.x !== null && mouse.y !== null && !prefersReducedMotion) {
          const dx = mouse.x - this.x, dy = mouse.y - this.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          if (distance < mouse.radius) {
            const force = (mouse.radius - distance) / mouse.radius;
            this.x -= (dx / distance) * force * (this.density * 0.4);
            this.y -= (dy / distance) * force * (this.density * 0.4);
          }
        }
      }
      draw() {
        ctx.save();
        if (cachedIsLight) {
          // 亮色模式：清晰立體 2px 晶體星芒點
          ctx.globalAlpha = Math.min(0.85, this.opacity * 1.3);
          ctx.fillStyle = '#0284c7';
          ctx.beginPath();
          ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // 暗色模式：經典賽博霓虹發光點與連線星網（直接讀取快取色彩）
          ctx.globalAlpha = Math.min(0.9, this.opacity * 1.25);
          ctx.fillStyle = cachedThemeColor;
          ctx.shadowColor = cachedThemeColor;
          ctx.shadowBlur = 8;
          ctx.beginPath();
          ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }
    }

    class BurstParticle {
      x: number; y: number; size: number; vx: number; vy: number; alpha: number; color: string;
      constructor(x: number, y: number, isCountUp: boolean | null = null) {
        this.x = x; this.y = y; this.size = Math.random() * 3.5 + 1.5;
        if (isCountUp === true) { this.vx = (Math.random() - 0.5) * 3.5; this.vy = -(Math.random() * 2.5 + 1); }
        else if (isCountUp === false) { this.vx = (Math.random() - 0.5) * 3.5; this.vy = (Math.random() * 2.5 + 1); }
        else { const angle = Math.random() * Math.PI * 2, speed = Math.random() * 3.5 + 1; this.vx = Math.cos(angle) * speed; this.vy = Math.sin(angle) * speed; }
        this.alpha = 1;
        this.color = cachedIsLight ? '#0284c7' : (Math.random() > 0.4 ? cachedThemeColor : '#ffffff');
      }
      update() { this.x += this.vx; this.y += this.vy; this.alpha -= 0.028; }
      draw() {
        ctx.save(); ctx.globalAlpha = Math.max(0, this.alpha);
        ctx.fillStyle = this.color;
        if (!cachedIsLight) { ctx.shadowBlur = 6; ctx.shadowColor = this.color; }
        ctx.beginPath(); ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      }
    }

    function adjustParticles() {
      // 根據裝置寬度自適應微粒數量：手機 (<768px) 減低至 25~45 顆以節省運算資源
      const isMobile = window.innerWidth < 768;
      const targetCount = isMobile
        ? Math.min(45, Math.max(25, Math.floor((canvas!.width * canvas!.height) / 22000)))
        : Math.min(180, Math.max(50, Math.floor((canvas!.width * canvas!.height) / 11000)));

      if (particles.length < targetCount) {
        for (let i = 0; i < targetCount - particles.length; i++) particles.push(new Particle());
      } else if (particles.length > targetCount) {
        particles.length = targetCount;
      }
    }

    function resizeCanvas() {
      canvas!.width = window.innerWidth;
      canvas!.height = window.innerHeight;
      updateThemeCache();
      adjustParticles();
    }

    function animate() {
      if (!isRunning) return;
      ctx.clearRect(0, 0, canvas!.width, canvas!.height);
      connectParticles();
      particles.forEach(p => { p.update(); p.draw(); });
      for (let i = burstParticles.length - 1; i >= 0; i--) {
        const p = burstParticles[i]; p.update(); p.draw();
        if (p.alpha <= 0) burstParticles.splice(i, 1);
      }
      animationId = requestAnimationFrame(animate);
    }

    function startAnimation() {
      if (!isRunning && !document.hidden) {
        isRunning = true;
        animationId = requestAnimationFrame(animate);
      }
    }

    function stopAnimation() {
      if (isRunning) {
        isRunning = false;
        if (animationId) {
          cancelAnimationFrame(animationId);
          animationId = 0;
        }
      }
    }

    const onVisibilityChange = () => {
      if (document.hidden) {
        stopAnimation();
      } else {
        startAnimation();
      }
    };

    // 掛載全域 API（與原始 common-particles.js 相容）
    (window as any).triggerParticleBurst = (x: number, y: number) => {
      for (let i = 0; i < 20; i++) burstParticles.push(new BurstParticle(x, y));
      if (!isRunning) startAnimation();
    };
    (window as any).createBurst = (window as any).triggerParticleBurst;
    (window as any).triggerDirectionalBurst = (x: number, y: number, isCountUp: boolean) => {
      const offsetY = isCountUp ? y - 10 : y + 10;
      for (let i = 0; i < 15; i++) burstParticles.push(new BurstParticle(x, offsetY, isCountUp));
      if (!isRunning) startAnimation();
    };
    (window as any).createDirectionalBurst = (window as any).triggerDirectionalBurst;
    (window as any).setParticleFlowDirection = (dir: 'up' | 'down') => {
      if (dir === 'up' || dir === 'down') flowDirection = dir;
    };

    const onMouseMove = (e: MouseEvent) => { mouse.x = e.clientX; mouse.y = e.clientY; };
    const onMouseOut = () => { mouse.x = null; mouse.y = null; };

    window.addEventListener('resize', resizeCanvas);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseout', onMouseOut);
    document.addEventListener('visibilitychange', onVisibilityChange);

    resizeCanvas();
    startAnimation();

    return () => {
      stopAnimation();
      themeObserver.disconnect();
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseout', onMouseOut);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, []);

  return null;
}
