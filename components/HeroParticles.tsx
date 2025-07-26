'use client';
import React, { useEffect, useRef } from 'react';
import { useAnimConfig } from '@/context/AnimationConfig';

export const HeroParticles: React.FC<{className?:string}> = ({ className }) => {
  const cfg = useAnimConfig();
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext('2d', { alpha: true })!;

    let w = canvas.clientWidth, h = canvas.clientHeight;
    const dpr = Math.min(devicePixelRatio||1, 2);
    const resize = () => {
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = Math.floor(w*dpr);
      canvas.height = Math.floor(h*dpr);
      ctx.setTransform(dpr,0,0,dpr,0,0);
    };
    const ro = new ResizeObserver(resize); ro.observe(canvas); resize();

    // particles
    const P = cfg.particles.count;
    const pts = new Array(P).fill(0).map(()=>({
      x: Math.random()*w, y: Math.random()*h,
      vx: (Math.random()-0.5)*40, vy:(Math.random()-0.5)*40,
      r: 1 + Math.random()*2
    }));

    ctx.globalCompositeOperation = 'lighter';
    let run = true, last = performance.now();

    function frame(now:number){
      if (!run) return;
      const dt = (now - last)/1000; last = now;

      // красивый шлейф (на medium/low делаем чуть плотнее, чтобы «дорисовывало»)
      const alpha = cfg.particles.trail ? 0.10 : 0.18;
      ctx.fillStyle = `rgba(7,15,31,${alpha})`;
      ctx.fillRect(0,0,w,h);

      for (const p of pts) {
        p.x += p.vx*dt; p.y += p.vy*dt;
        if (p.x<0||p.x>w) p.vx*=-1;
        if (p.y<0||p.y>h) p.vy*=-1;

        const g = ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,10);
        g.addColorStop(0, `rgba(0,210,255,${cfg.particles.glow})`);
        g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2); ctx.fill();
      }
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);

    return ()=>{ run=false; ro.disconnect(); };
  }, [cfg]);

  return <canvas ref={ref} className={className} style={{willChange:'transform'}}/>;
};
