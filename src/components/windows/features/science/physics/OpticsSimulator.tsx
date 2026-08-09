import React, { useRef, useEffect, useState } from 'react';
import { Info } from 'lucide-react';

type Element = 'convex-lens' | 'concave-lens' | 'concave-mirror' | 'convex-mirror';

const PX_PER_CM = 4;

const elementInfo: Record<Element, { name: string; note: string }> = {
  'convex-lens': {
    name: 'Convex Lens',
    note: 'Converging. Camera lenses, magnifying glasses, your eye. Object outside F → real inverted image; inside F → virtual upright magnified image (that is how a magnifier works).',
  },
  'concave-lens': {
    name: 'Concave Lens',
    note: 'Diverging. Always makes a virtual, upright, smaller image on the same side as the object. Used to correct near-sightedness.',
  },
  'concave-mirror': {
    name: 'Concave Mirror',
    note: 'Converging. Telescopes, shaving mirrors, headlights. Object outside F → real inverted image in front; inside F → virtual magnified image behind the mirror.',
  },
  'convex-mirror': {
    name: 'Convex Mirror',
    note: 'Diverging. Always a virtual, upright, smaller image behind the mirror — giving a wide view. "Objects in mirror are closer than they appear."',
  },
};

export const OpticsSimulator = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const draggingRef = useRef(false);
  const [element, setElement] = useState<Element>('convex-lens');
  const [focalCm, setFocalCm] = useState(15);
  const [objDistCm, setObjDistCm] = useState(40);
  const [objHeightCm, setObjHeightCm] = useState(6);

  const isConverging = element === 'convex-lens' || element === 'concave-mirror';
  // Sign convention: converging f > 0, diverging f < 0; real image di > 0
  const f = isConverging ? focalCm : -focalCm;
  const dO = objDistCm;
  const atInfinity = Math.abs(1 / f - 1 / dO) < 1e-4;
  const dI = atInfinity ? Infinity : 1 / (1 / f - 1 / dO);
  const mag = atInfinity ? Infinity : -dI / dO;
  const isReal = !atInfinity && dI > 0;
  const isVirtual = !atInfinity && dI < 0;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;

    const getPos = (e: MouseEvent) => {
      const r = canvas.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top, w: r.width, h: r.height };
    };
    const applyDrag = (p: { x: number; y: number; w: number; h: number }) => {
      const cx = p.w / 2, axisY = p.h / 2;
      setObjDistCm(Math.max(4, Math.min(80, (cx - p.x) / PX_PER_CM)));
      setObjHeightCm(Math.max(1, Math.min(12, (axisY - p.y) / PX_PER_CM)));
    };
    const onDown = (e: MouseEvent) => {
      const p = getPos(e);
      const cx = p.w / 2, axisY = p.h / 2;
      const tipX = cx - objDistCm * PX_PER_CM, tipY = axisY - objHeightCm * PX_PER_CM;
      if (Math.hypot(p.x - tipX, p.y - tipY) < 25) { draggingRef.current = true; applyDrag(p); }
    };
    const onMove = (e: MouseEvent) => { if (draggingRef.current) applyDrag(getPos(e)); };
    const onUp = () => { draggingRef.current = false; };
    canvas.addEventListener('mousedown', onDown);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);

    const draw = () => {
      const r = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = r.width * dpr;
      canvas.height = r.height * dpr;
      ctx.scale(dpr, dpr);
      const w = r.width, h = r.height;

      const isDark = document.documentElement.classList.contains('dark');
      ctx.fillStyle = isDark ? '#0a0e1a' : '#f8f9fc';
      ctx.fillRect(0, 0, w, h);
      const textCol = isDark ? 'rgba(200,200,255,0.6)' : 'rgba(30,40,80,0.6)';

      const cx = w / 2, axisY = h / 2;
      const fPx = focalCm * PX_PER_CM;
      const doPx = dO * PX_PER_CM;
      const hoPx = objHeightCm * PX_PER_CM;
      const isMirror = element.includes('mirror');
      // Image position in px relative to element; lens: +di to the right; mirror: +di to the left
      const diPx = atInfinity ? 0 : dI * PX_PER_CM;
      const imgX = isMirror ? cx - diPx : cx + diPx;
      const imgTipY = atInfinity ? axisY : axisY - (mag as number) * hoPx;

      // Principal axis
      ctx.strokeStyle = isDark ? 'rgba(150,150,200,0.4)' : 'rgba(80,90,130,0.4)';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(0, axisY); ctx.lineTo(w, axisY); ctx.stroke();

      // Optical element
      const elemH = h * 0.36;
      ctx.strokeStyle = '#60a5fa'; ctx.lineWidth = 3; ctx.lineCap = 'round';
      if (!isMirror) {
        ctx.beginPath(); ctx.moveTo(cx, axisY - elemH); ctx.lineTo(cx, axisY + elemH); ctx.stroke();
        // Arrowheads showing converging (outward) vs diverging (inward)
        const dir = element === 'convex-lens' ? 1 : -1;
        ctx.lineWidth = 2;
        [[axisY - elemH, -1], [axisY + elemH, 1]].forEach(([ey, s]) => {
          ctx.beginPath();
          ctx.moveTo(cx - 8, ey + s * dir * 10);
          ctx.lineTo(cx, ey);
          ctx.lineTo(cx + 8, ey + s * dir * 10);
          ctx.stroke();
        });
      } else {
        // Curved mirror arc; reflective side faces the object (left)
        const bend = (element === 'concave-mirror' ? -1 : 1) * 26;
        ctx.beginPath();
        ctx.moveTo(cx, axisY - elemH);
        ctx.quadraticCurveTo(cx + bend, axisY, cx, axisY + elemH);
        ctx.stroke();
        // Hatching on the back (non-reflective) side
        ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(96,165,250,0.5)';
        for (let y = -elemH; y < elemH; y += 14) {
          const t = (y + elemH) / (2 * elemH);
          const arcX = cx + bend * 4 * t * (1 - t) * 0.5;
          ctx.beginPath(); ctx.moveTo(arcX, axisY + y); ctx.lineTo(arcX + 8, axisY + y - 8); ctx.stroke();
        }
      }

      // Focal points (F on each side) and 2F marks
      ctx.fillStyle = '#fbbf24'; ctx.font = 'bold 10px monospace'; ctx.textAlign = 'center';
      const focalXs = isMirror ? [cx - fPx, cx - 2 * fPx] : [cx - fPx, cx + fPx, cx - 2 * fPx, cx + 2 * fPx];
      focalXs.forEach((fx, i) => {
        ctx.beginPath(); ctx.arc(fx, axisY, 3, 0, Math.PI * 2); ctx.fill();
        ctx.fillText(i < (isMirror ? 1 : 2) ? 'F' : '2F', fx, axisY + 16);
      });
      if (isMirror && !isConverging) {
        // Virtual focus behind a convex mirror
        ctx.fillStyle = 'rgba(251,191,36,0.5)';
        ctx.beginPath(); ctx.arc(cx + fPx, axisY, 3, 0, Math.PI * 2); ctx.fill();
        ctx.fillText('F (virtual)', cx + fPx, axisY + 16);
      }

      // Object arrow (draggable)
      const objX = cx - doPx, tipY = axisY - hoPx;
      ctx.strokeStyle = '#34d399'; ctx.fillStyle = '#34d399'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(objX, axisY); ctx.lineTo(objX, tipY + 8); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(objX, tipY); ctx.lineTo(objX - 6, tipY + 11); ctx.lineTo(objX + 6, tipY + 11); ctx.closePath(); ctx.fill();
      ctx.font = '10px sans-serif';
      ctx.fillText('Object (drag me)', objX, tipY - 8);

      // ---- Principal rays ----
      // Each outgoing ray passes through the image tip (real) or extends back to it (virtual)
      const drawRay = (x1: number, y1: number, x2: number, y2: number, color: string, dashed = false) => {
        ctx.strokeStyle = color; ctx.lineWidth = 1.5;
        ctx.setLineDash(dashed ? [5, 4] : []);
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
        ctx.setLineDash([]);
      };
      const extendFrom = (x0: number, y0: number, dx: number, dy: number, color: string) => {
        const len = w + h;
        const n = Math.hypot(dx, dy) || 1;
        drawRay(x0, y0, x0 + (dx / n) * len, y0 + (dy / n) * len, color);
      };

      const rayCols = ['#f87171', '#fb923c'];

      // Incoming ray 1: parallel to the axis; incoming ray 2: aimed at the center/vertex
      drawRay(objX, tipY, cx, tipY, rayCols[0]);
      drawRay(objX, tipY, cx, axisY, rayCols[1]);

      // Ray 2 always continues straight (lens) or reflects symmetrically about the axis (mirror)
      const ray2dx = isMirror ? -(cx - objX) : cx - objX;
      const ray2dy = axisY - tipY;

      if (atInfinity) {
        // Object at F — rays exit parallel to each other, image at infinity
        extendFrom(cx, tipY, ray2dx, ray2dy, rayCols[0]);
        extendFrom(cx, axisY, ray2dx, ray2dy, rayCols[1]);
        ctx.fillStyle = textCol; ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText('Object at F — rays exit parallel, image forms at infinity', w / 2, h - 20);
      } else {
        // Outgoing ray 1 lies on the line through the image tip. Real images: rays travel
        // toward the tip. Virtual: rays travel away from it (its backward extension hits the tip).
        let r1dx = imgX - cx, r1dy = imgTipY - tipY;
        if (isVirtual) { r1dx = -r1dx; r1dy = -r1dy; }
        extendFrom(cx, tipY, r1dx, r1dy, rayCols[0]);
        extendFrom(cx, axisY, ray2dx, ray2dy, rayCols[1]);

        // Virtual: dashed extensions back to the image tip
        if (isVirtual) {
          drawRay(cx, tipY, imgX, imgTipY, rayCols[0], true);
          drawRay(cx, axisY, imgX, imgTipY, rayCols[1], true);
        }

        // Image arrow
        const imgCol = isReal ? '#f472b6' : '#a78bfa';
        ctx.strokeStyle = imgCol; ctx.fillStyle = imgCol; ctx.lineWidth = 3;
        ctx.setLineDash(isVirtual ? [6, 4] : []);
        ctx.beginPath(); ctx.moveTo(imgX, axisY); ctx.lineTo(imgX, imgTipY + (imgTipY < axisY ? 8 : -8)); ctx.stroke();
        ctx.setLineDash([]);
        const s = imgTipY < axisY ? 1 : -1;
        ctx.beginPath();
        ctx.moveTo(imgX, imgTipY);
        ctx.lineTo(imgX - 6, imgTipY + s * 11);
        ctx.lineTo(imgX + 6, imgTipY + s * 11);
        ctx.closePath(); ctx.fill();
        ctx.font = 'bold 10px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText(isReal ? 'Real image' : 'Virtual image', imgX, imgTipY + s * -14);
      }

      // Readout
      ctx.fillStyle = isDark ? 'rgba(20,25,50,0.75)' : 'rgba(255,255,255,0.85)';
      ctx.beginPath(); ctx.roundRect(10, 10, 250, 66, 6); ctx.fill();
      ctx.font = '10px monospace'; ctx.textAlign = 'left';
      ctx.fillStyle = textCol;
      ctx.fillText(`object distance  dₒ = ${dO.toFixed(1)} cm`, 18, 26);
      if (atInfinity) {
        ctx.fillText('image distance   dᵢ = ∞', 18, 40);
        ctx.fillText('magnification    m = ∞', 18, 54);
      } else {
        ctx.fillText(`image distance   dᵢ = ${Math.abs(dI).toFixed(1)} cm ${isVirtual ? '(virtual)' : '(real)'}`, 18, 40);
        ctx.fillText(`magnification    m = ${(mag as number).toFixed(2)}× ${(mag as number) > 0 ? 'upright' : 'inverted'}`, 18, 54);
        ctx.fillStyle = (mag as number) > 0 ? '#a78bfa' : '#f472b6';
        ctx.fillText(Math.abs(mag as number) >= 1 ? 'enlarged' : 'diminished', 18, 68);
      }
    };

    draw();
    const obs = new ResizeObserver(draw);
    obs.observe(canvas);
    return () => {
      obs.disconnect();
      canvas.removeEventListener('mousedown', onDown);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [element, focalCm, objDistCm, objHeightCm, atInfinity, dI, mag, isReal, isVirtual, f, dO, isConverging]);

  const info = elementInfo[element];

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-gray-100 to-sky-100 dark:from-gray-950 dark:to-sky-950 p-3 overflow-hidden">
      <div className="mb-2">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">🔍 Lens & Mirror Lab</h2>
        <p className="text-[11px] text-gray-500 dark:text-gray-400">Ray diagrams and image formation — drag the green object arrow around</p>
      </div>
      <div className="flex-1 flex gap-3 min-h-0">
        <div className="flex-1 min-w-0 min-h-0 rounded-lg border border-gray-300 dark:border-gray-800 overflow-hidden">
          <canvas ref={canvasRef} className="w-full h-full cursor-grab" />
        </div>
        <div className="w-[210px] flex flex-col gap-2 flex-shrink-0 overflow-y-auto">
          <div className="bg-white/80 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-3 space-y-1">
            <h4 className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Optical Element</h4>
            {(Object.keys(elementInfo) as Element[]).map(el => (
              <button key={el} onClick={() => setElement(el)} className={`block w-full text-left px-2 py-1 rounded text-[10px] ${element === el ? 'bg-sky-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>
                {elementInfo[el].name}
              </button>
            ))}
          </div>

          <div className="bg-white/80 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-3 space-y-2">
            <label className="text-[9px] text-gray-500 dark:text-gray-400 flex justify-between"><span>Focal length</span><span>{focalCm} cm</span></label>
            <input type="range" min={5} max={30} step={1} value={focalCm} onChange={e => setFocalCm(+e.target.value)} className="w-full h-1 accent-amber-500" />
            <label className="text-[9px] text-gray-500 dark:text-gray-400 flex justify-between"><span>Object distance</span><span>{objDistCm.toFixed(0)} cm</span></label>
            <input type="range" min={4} max={80} step={1} value={objDistCm} onChange={e => setObjDistCm(+e.target.value)} className="w-full h-1 accent-green-500" />
            <label className="text-[9px] text-gray-500 dark:text-gray-400 flex justify-between"><span>Object height</span><span>{objHeightCm.toFixed(0)} cm</span></label>
            <input type="range" min={1} max={12} step={1} value={objHeightCm} onChange={e => setObjHeightCm(+e.target.value)} className="w-full h-1 accent-green-500" />
          </div>

          <div className="bg-white/80 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-2.5">
            <h4 className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Try This</h4>
            <p className="text-[9px] text-gray-600 dark:text-gray-400">
              {isConverging
                ? 'Slide the object inside F and watch the image flip to virtual, upright, and magnified. Put it exactly at F — where does the image go?'
                : 'Diverging elements always make small virtual images — no matter where you put the object. Verify it!'}
            </p>
          </div>

          <div className="bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800/40 rounded-lg p-2.5">
            <h4 className="text-[10px] font-semibold text-sky-700 dark:text-sky-300 flex items-center gap-1 mb-1"><Info className="h-3 w-3" />{info.name}</h4>
            <p className="text-[9px] font-mono bg-white/60 dark:bg-gray-800/60 rounded px-1.5 py-1 text-gray-700 dark:text-gray-300 mb-1.5">1/dₒ + 1/dᵢ = 1/f · m = −dᵢ/dₒ</p>
            <p className="text-[9px] text-gray-600 dark:text-gray-400">{info.note}</p>
            <p className="text-[9px] text-gray-600 dark:text-gray-400 mt-1"><strong>Real image</strong>: rays actually meet — you can project it on a screen. <strong>Virtual image</strong> (dashed): rays only <em>appear</em> to come from it.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
