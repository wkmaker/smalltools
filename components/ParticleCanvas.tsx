'use client';

import { useEffect } from 'react';

/**
 * ParticleCanvas - 全站共用背景微粒與氣泡爆炸反饋動效
 * 移植自 js/common-particles.js，改為 React Client Component
 * 遵循 toolbox-design-standards 規範
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
    let animationId: number;

    function getActiveThemeColor(): string {
      const docEl = document.documentElement;
      let color =
        docEl.style.getPropertyValue('--theme-color').trim() ||
        getComputedStyle(docEl).getPropertyValue('--theme-color').trim() ||
        docEl.style.getPropertyValue('--accent-glow').trim() ||
        getComputedStyle(docEl).getPropertyValue('--accent-glow').trim() ||
        getComputedStyle(docEl).getPropertyValue('--accent-color').trim();
      if (color) {
        const rgbaMatch = color.match(/rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
        if (rgbaMatch) return `rgb(${rgbaMatch[1]}, ${rgbaMatch[2]}, ${rgbaMatch[3]})`;
        return color;
      }
      return '#00f0ff';
    }

    class Particle {
      x = 0; y = 0; size = 0; speedY = 0; speedX = 0; opacity = 0; density = 0;
      constructor() { this.reset('random'); }
      reset(fromPos = 'random') {
        this.x = Math.random() * canvas!.width;
        if (fromPos === 'top') this.y = -10 - Math.random() * 20;
        else if (fromPos === 'bottom') this.y = canvas!.height + Math.random() * 20;
        else this.y = Math.random() * canvas!.height;
        this.size = Math.random() * 1.8 + 0.6;
        this.speedY = Math.random() * 0.45 + 0.15;
        this.speedX = (Math.random() - 0.5) * 0.25;
        this.opacity = Math.random() * 0.55 + 0.15;
        this.density = Math.random() * 25 + 5;
      }
      update() {
        if (flowDirection === 'down') {
          this.y += this.speedY; this.x += this.speedX;
          if (this.y > canvas!.height + 10) this.reset('top');
        } else {
          this.y -= this.speedY; this.x += this.speedX;
          if (this.y < -10) this.reset('bottom');
        }
        if (this.x < -10 || this.x > canvas!.width + 10) this.x = Math.random() * canvas!.width;
        if (mouse.x !== null && mouse.y !== null) {
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
        ctx.globalAlpha = this.opacity;
        ctx.fillStyle = getActiveThemeColor();
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    class BurstParticle {
      x: number; y: number; size: number; vx: number; vy: number; alpha: number; color: string;
      constructor(x: number, y: number, isCountUp: boolean | null = null) {
        this.x = x; this.y = y; this.size = Math.random() * 4 + 2;
        if (isCountUp === true) { this.vx = (Math.random() - 0.5) * 3.5; this.vy = -(Math.random() * 2.5 + 1); }
        else if (isCountUp === false) { this.vx = (Math.random() - 0.5) * 3.5; this.vy = (Math.random() * 2.5 + 1); }
        else { const angle = Math.random() * Math.PI * 2, speed = Math.random() * 3.5 + 1; this.vx = Math.cos(angle) * speed; this.vy = Math.sin(angle) * speed; }
        this.alpha = 1;
        this.color = Math.random() > 0.4 ? getActiveThemeColor() : '#ffffff';
      }
      update() { this.x += this.vx; this.y += this.vy; this.alpha -= 0.028; }
      draw() {
        ctx.save(); ctx.globalAlpha = Math.max(0, this.alpha);
        ctx.fillStyle = this.color; ctx.shadowBlur = 6; ctx.shadowColor = this.color;
        ctx.beginPath(); ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      }
    }

    function adjustParticles() {
      const targetCount = Math.min(200, Math.max(60, Math.floor((canvas!.width * canvas!.height) / 10000)));
      if (particles.length < targetCount) {
        for (let i = 0; i < targetCount - particles.length; i++) particles.push(new Particle());
      } else particles.length = targetCount;
    }

    function resizeCanvas() {
      canvas!.width = window.innerWidth;
      canvas!.height = window.innerHeight;
      adjustParticles();
    }

    function animate() {
      ctx.clearRect(0, 0, canvas!.width, canvas!.height);
      particles.forEach(p => { p.update(); p.draw(); });
      for (let i = burstParticles.length - 1; i >= 0; i--) {
        const p = burstParticles[i]; p.update(); p.draw();
        if (p.alpha <= 0) burstParticles.splice(i, 1);
      }
      animationId = requestAnimationFrame(animate);
    }

    // 掛載全域 API（與原始 common-particles.js 相容）
    (window as any).triggerParticleBurst = (x: number, y: number) => {
      for (let i = 0; i < 20; i++) burstParticles.push(new BurstParticle(x, y));
    };
    (window as any).createBurst = (window as any).triggerParticleBurst;
    (window as any).triggerDirectionalBurst = (x: number, y: number, isCountUp: boolean) => {
      const offsetY = isCountUp ? y - 10 : y + 10;
      for (let i = 0; i < 15; i++) burstParticles.push(new BurstParticle(x, offsetY, isCountUp));
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
    resizeCanvas();
    animate();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseout', onMouseOut);
    };
  }, []);

  return null;
}
