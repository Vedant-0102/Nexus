import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Info } from 'lucide-react';

type MachineType = 'lever' | 'pulley' | 'inclined-plane' | 'wedge' | 'screw' | 'wheel-axle';

export const SimpleMachines: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const [machine, setMachine] = useState<MachineType>('lever');
  const [running, setRunning] = useState(true);
  const [effort, setEffort] = useState(50);
  const [param, setParam] = useState(0.5);
  const [leverClass, setLeverClass] = useState<1 | 2 | 3>(1);
  const [showTab, setShowTab] = useState<'sim' | 'learn'>('sim');
  const phaseRef = useRef(0);

  const leverClassInfo = {
    1: {
      name: 'Class 1 — Fulcrum Between',
      arrangement: 'Effort ← [Fulcrum] → Load',
      examples: 'Seesaw, Scissors, Crowbar, Pliers',
      desc: 'The fulcrum is between the effort and load. MA can be > 1, = 1, or < 1 depending on fulcrum position.',
      maNote: 'MA > 1 when fulcrum is closer to load. MA < 1 when closer to effort.',
      color: '#60a5fa',
    },
    2: {
      name: 'Class 2 — Load Between',
      arrangement: 'Fulcrum ← [Load] → Effort',
      examples: 'Wheelbarrow, Nutcracker, Bottle opener, Door',
      desc: 'The load is between the fulcrum and effort. MA is always > 1 (force multiplier).',
      maNote: 'Effort arm is always longer than load arm, so MA > 1 always.',
      color: '#f59e0b',
    },
    3: {
      name: 'Class 3 — Effort Between',
      arrangement: 'Fulcrum ← [Effort] → Load',
      examples: 'Tweezers, Fishing rod, Broom, Human forearm',
      desc: 'The effort is between the fulcrum and load. MA is always < 1 (speed/distance multiplier).',
      maNote: 'Effort arm is always shorter than load arm, so MA < 1. Trades force for speed & range.',
      color: '#34d399',
    },
  };

  const machineLearnContent: Record<MachineType, { title: string; points: string[]; formula: string; principle: string }> = {
    lever: {
      title: 'Lever',
      formula: 'MA = Effort Arm / Load Arm = d₁ / d₂',
      principle: "Law of the Lever (Archimedes): F₁ × d₁ = F₂ × d₂. The lever is in equilibrium when the moments (torques) about the fulcrum are equal.",
      points: [
        '3 components: Fulcrum (pivot), Effort (input force), Load (output force)',
        'Class 1: Fulcrum between E & L (seesaw) — MA can be >, =, or < 1',
        'Class 2: Load between F & E (wheelbarrow) — MA always > 1',
        'Class 3: Effort between F & L (tweezers) — MA always < 1',
        'Velocity Ratio = distance moved by effort / distance moved by load',
        'Efficiency = (MA / VR) × 100%. Ideal lever has 100% efficiency',
      ],
    },
    pulley: {
      title: 'Pulley System',
      formula: 'MA = Number of supporting ropes (n)',
      principle: 'A pulley redirects force. Multiple pulleys share the load across ropes, reducing effort needed.',
      points: [
        'Fixed pulley: Changes direction only, MA = 1',
        'Movable pulley: Halves the effort, MA = 2',
        'Block & tackle: MA = number of rope segments supporting the load',
        'Trade-off: More pulleys = less effort but more rope to pull',
        'VR = number of rope segments. Distance pulled = n × distance lifted',
        'Real efficiency < 100% due to friction in pulley axles',
      ],
    },
    'inclined-plane': {
      title: 'Inclined Plane (Ramp)',
      formula: 'MA = Length / Height = 1 / sin(θ)',
      principle: 'Spreads the work over a longer distance, reducing the force needed to raise an object.',
      points: [
        'Shallower angle = greater MA but longer distance to travel',
        'Steeper angle = less MA but shorter path',
        'At θ = 90°, MA = 1 (lifting straight up)',
        'At θ = 30°, MA = 2 (half the force, double the distance)',
        'Real-world: Ramps, roads up hills, wheelchair ramps, loading docks',
        'Friction opposes motion along the plane, reducing efficiency',
      ],
    },
    wedge: {
      title: 'Wedge',
      formula: 'MA = Length / Width (thickness)',
      principle: 'A moving inclined plane that converts a force along its length into splitting forces perpendicular to it.',
      points: [
        'Thinner wedge = greater MA but more fragile',
        'Two inclined planes back-to-back',
        'Input force applied to the blunt end',
        'Output: two forces pushing outward (splitting)',
        'Examples: Axe, knife, nail, chisel, doorstop, zipper',
        'A single-edge wedge pushes object in one direction',
      ],
    },
    screw: {
      title: 'Screw',
      formula: 'MA = 2πr / pitch (thread spacing)',
      principle: 'An inclined plane wrapped around a cylinder. Each full rotation advances by one pitch distance.',
      points: [
        'Pitch = distance between adjacent threads',
        'Finer thread (smaller pitch) = greater MA but slower advance',
        'One rotation moves the screw forward by one pitch',
        'Circumference of rotation (2πr) vs pitch gives the MA',
        'Examples: Bolt, jar lid, drill bit, Archimedes screw, car jack',
        'Self-locking: high friction prevents the screw from backing out',
      ],
    },
    'wheel-axle': {
      title: 'Wheel & Axle',
      formula: 'MA = Wheel Radius / Axle Radius = R / r',
      principle: 'A lever that rotates continuously. The wheel and axle turn together — a small force on the large wheel creates a large force on the axle.',
      points: [
        'Larger wheel relative to axle = greater MA',
        'Effort applied to wheel edge, load on axle (force multiplier)',
        'Reverse: effort on axle, load on wheel (speed multiplier)',
        'Examples: Steering wheel, doorknob, screwdriver, bicycle gears',
        'Gear ratio in bicycles: front gear / rear gear = MA',
        'Wheel radius × wheel force = Axle radius × axle force',
      ],
    },
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const resize = () => {
      const r = canvas.getBoundingClientRect();
      const d = window.devicePixelRatio || 1;
      canvas.width = r.width * d; canvas.height = r.height * d; ctx.scale(d, d);
    };
    resize();
    const obs = new ResizeObserver(resize); obs.observe(canvas);
    let lastTime = performance.now();

    const draw = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;
      const r = canvas.getBoundingClientRect();
      const w = r.width, h = r.height;
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = '#080c18'; ctx.fillRect(0, 0, w, h);
      if (running) phaseRef.current += dt;
      const phase = phaseRef.current;
      const cx = w / 2, cy = h * 0.45;

      let ma = 1;
      let effortArm = 0, loadArm = 0;

      // Helper to draw labeled arrow
      const drawArrow = (x1: number, y1: number, x2: number, y2: number, color: string, label: string, labelOffset: 'left' | 'right' | 'top' | 'bottom' = 'top') => {
        const dx = x2 - x1, dy = y2 - y1;
        const len = Math.sqrt(dx * dx + dy * dy);
        if (len < 2) return;
        const nx = dx / len, ny = dy / len;
        ctx.strokeStyle = color; ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
        // Arrowhead
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(x2, y2);
        ctx.lineTo(x2 - nx * 8 - ny * 4, y2 - ny * 8 + nx * 4);
        ctx.lineTo(x2 - nx * 8 + ny * 4, y2 - ny * 8 - nx * 4);
        ctx.closePath(); ctx.fill();
        // Label
        ctx.font = 'bold 9px sans-serif'; ctx.textAlign = 'center';
        const lx = (x1 + x2) / 2, ly = (y1 + y2) / 2;
        if (labelOffset === 'top') ctx.fillText(label, lx, ly - 8);
        else if (labelOffset === 'bottom') ctx.fillText(label, lx, ly + 14);
        else if (labelOffset === 'left') { ctx.textAlign = 'right'; ctx.fillText(label, lx - 8, ly + 3); }
        else { ctx.textAlign = 'left'; ctx.fillText(label, lx + 8, ly + 3); }
      };

      // Helper: draw fulcrum triangle
      const drawFulcrum = (fx: number, fy: number, size = 16) => {
        ctx.fillStyle = 'rgba(200,200,220,0.5)';
        ctx.beginPath(); ctx.moveTo(fx, fy); ctx.lineTo(fx - size, fy + size * 1.2); ctx.lineTo(fx + size, fy + size * 1.2); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = 'rgba(200,200,220,0.6)'; ctx.lineWidth = 1.5; ctx.stroke();
        // Hatch lines under fulcrum
        ctx.strokeStyle = 'rgba(100,100,120,0.3)'; ctx.lineWidth = 1;
        for (let i = -2; i <= 2; i++) {
          ctx.beginPath(); ctx.moveTo(fx - size + i * 7, fy + size * 1.2); ctx.lineTo(fx - size + i * 7 - 5, fy + size * 1.2 + 7); ctx.stroke();
        }
        // F label
        ctx.fillStyle = 'rgba(200,200,220,0.8)'; ctx.font = 'bold 10px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText('F', fx, fy + size * 1.2 + 16);
      };

      if (machine === 'lever') {
        const beamLen = w * 0.65;
        const baseY = cy + 15;
        const tilt = Math.sin(phase * 1.5) * 0.04;

        // Positions depend on class
        let fulcX: number, effortX: number, loadX: number;
        const beamStart = cx - beamLen / 2;

        if (leverClass === 1) {
          // Fulcrum in middle, effort left, load right
          const fulcRatio = 0.3 + param * 0.4; // param controls fulcrum position
          fulcX = beamStart + fulcRatio * beamLen;
          effortX = -fulcRatio * beamLen;  // relative to fulcrum
          loadX = (1 - fulcRatio) * beamLen;
          effortArm = fulcRatio * beamLen;
          loadArm = (1 - fulcRatio) * beamLen;
        } else if (leverClass === 2) {
          // Fulcrum at left end, load in middle zone, effort at right end
          fulcX = beamStart;
          const loadRatio = 0.2 + param * 0.3; // load somewhere in left half
          loadX = loadRatio * beamLen;
          effortX = beamLen;
          effortArm = beamLen;
          loadArm = loadRatio * beamLen;
        } else {
          // Class 3: Fulcrum at left, effort in middle, load at right end
          fulcX = beamStart;
          const effortRatio = 0.2 + param * 0.3;
          effortX = effortRatio * beamLen;
          loadX = beamLen;
          effortArm = effortRatio * beamLen;
          loadArm = beamLen;
        }

        ma = effortArm / loadArm;
        const loadForce = effort * ma;

        // Draw fulcrum
        drawFulcrum(fulcX, baseY);

        // Beam
        ctx.save(); ctx.translate(fulcX, baseY); ctx.rotate(tilt);
        ctx.strokeStyle = 'rgba(200,170,100,0.8)'; ctx.lineWidth = 5;
        ctx.lineCap = 'round';
        const leftEnd = leverClass === 1 ? -effortArm : 0;
        const rightEnd = leverClass === 1 ? loadArm : beamLen;
        ctx.beginPath(); ctx.moveTo(leftEnd, 0); ctx.lineTo(rightEnd, 0); ctx.stroke();

        // Tick marks on beam edges
        ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(leftEnd, -6); ctx.lineTo(leftEnd, 6); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(rightEnd, -6); ctx.lineTo(rightEnd, 6); ctx.stroke();

        // Effort arrow (blue, pointing down onto beam)
        const eColor = 'rgba(80,180,255,0.9)';
        if (leverClass === 1) {
          drawArrow(-effortArm, -55, -effortArm, -8, eColor, `Effort: ${effort}N`, 'top');
        } else {
          drawArrow(effortX, -55, effortX, -8, eColor, `Effort: ${(loadForce > 0 ? effort : 0).toFixed(1)}N`, 'top');
        }

        // Load arrow (red, pointing down from beam — weight)
        const lColor = 'rgba(255,100,80,0.9)';
        if (leverClass === 1) {
          drawArrow(loadArm, 8, loadArm, 55, lColor, `Load: ${loadForce.toFixed(1)}N`, 'bottom');
          // Load box
          ctx.fillStyle = 'rgba(255,100,80,0.2)'; ctx.strokeStyle = 'rgba(255,100,80,0.5)'; ctx.lineWidth = 1;
          ctx.fillRect(loadArm - 18, 55, 36, 22); ctx.strokeRect(loadArm - 18, 55, 36, 22);
          ctx.fillStyle = 'rgba(255,100,80,0.7)'; ctx.font = '8px sans-serif'; ctx.textAlign = 'center';
          ctx.fillText('LOAD', loadArm, 69);
        } else {
          drawArrow(loadX, 8, loadX, 55, lColor, `Load: ${loadForce.toFixed(1)}N`, 'bottom');
          ctx.fillStyle = 'rgba(255,100,80,0.2)'; ctx.strokeStyle = 'rgba(255,100,80,0.5)'; ctx.lineWidth = 1;
          ctx.fillRect(loadX - 18, 55, 36, 22); ctx.strokeRect(loadX - 18, 55, 36, 22);
          ctx.fillStyle = 'rgba(255,100,80,0.7)'; ctx.font = '8px sans-serif'; ctx.textAlign = 'center';
          ctx.fillText('LOAD', loadX, 69);
        }

        // Arm dimension lines
        ctx.setLineDash([3, 3]);
        ctx.strokeStyle = 'rgba(80,180,255,0.3)'; ctx.lineWidth = 1;
        const dimY = leverClass === 1 ? -65 : -65;
        // Effort arm
        if (leverClass === 1) {
          ctx.beginPath(); ctx.moveTo(0, dimY); ctx.lineTo(-effortArm, dimY); ctx.stroke();
          ctx.fillStyle = 'rgba(80,180,255,0.6)'; ctx.font = '8px monospace'; ctx.textAlign = 'center';
          ctx.fillText(`Effort arm: ${effortArm.toFixed(0)}px`, -effortArm / 2, dimY - 4);
        } else {
          ctx.beginPath(); ctx.moveTo(0, dimY); ctx.lineTo(effortX, dimY); ctx.stroke();
          ctx.fillStyle = 'rgba(80,180,255,0.6)'; ctx.font = '8px monospace'; ctx.textAlign = 'center';
          ctx.fillText(`Effort arm: ${effortArm.toFixed(0)}px`, effortX / 2, dimY - 4);
        }
        // Load arm
        ctx.strokeStyle = 'rgba(255,100,80,0.3)';
        if (leverClass === 1) {
          ctx.beginPath(); ctx.moveTo(0, dimY + 12); ctx.lineTo(loadArm, dimY + 12); ctx.stroke();
          ctx.fillStyle = 'rgba(255,100,80,0.6)'; ctx.font = '8px monospace'; ctx.textAlign = 'center';
          ctx.fillText(`Load arm: ${loadArm.toFixed(0)}px`, loadArm / 2, dimY + 8);
        } else {
          ctx.beginPath(); ctx.moveTo(0, dimY + 12); ctx.lineTo(loadX, dimY + 12); ctx.stroke();
          ctx.fillStyle = 'rgba(255,100,80,0.6)'; ctx.font = '8px monospace'; ctx.textAlign = 'center';
          ctx.fillText(`Load arm: ${loadArm.toFixed(0)}px`, loadX / 2, dimY + 8);
        }
        ctx.setLineDash([]);

        // Marker dots for E, F, L on beam
        const markers = leverClass === 1
          ? [{ x: -effortArm, label: 'E', col: eColor }, { x: 0, label: 'F', col: 'rgba(200,200,220,0.8)' }, { x: loadArm, label: 'L', col: lColor }]
          : leverClass === 2
            ? [{ x: 0, label: 'F', col: 'rgba(200,200,220,0.8)' }, { x: loadX, label: 'L', col: lColor }, { x: effortX, label: 'E', col: eColor }]
            : [{ x: 0, label: 'F', col: 'rgba(200,200,220,0.8)' }, { x: effortX, label: 'E', col: eColor }, { x: loadX, label: 'L', col: lColor }];
        markers.forEach(m => {
          ctx.fillStyle = m.col; ctx.beginPath(); ctx.arc(m.x, 0, 5, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = m.col; ctx.font = 'bold 10px sans-serif'; ctx.textAlign = 'center';
        });

        ctx.restore();

        // Class label and arrangement
        const info = leverClassInfo[leverClass];
        ctx.fillStyle = 'rgba(20,25,50,0.6)'; ctx.fillRect(10, 8, w - 20, 38);
        ctx.fillStyle = info.color; ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText(info.name, w / 2, 22);
        ctx.fillStyle = 'rgba(200,200,255,0.5)'; ctx.font = '9px monospace';
        ctx.fillText(`[ ${info.arrangement} ]  —  Examples: ${info.examples}`, w / 2, 38);

        // Bottom info bar
        ctx.fillStyle = 'rgba(20,25,50,0.5)'; ctx.fillRect(10, h - 55, w - 20, 48);
        ctx.fillStyle = 'rgba(200,200,255,0.7)'; ctx.font = '10px monospace'; ctx.textAlign = 'left';
        ctx.fillText(`Effort × Effort Arm = Load × Load Arm  (Principle of Moments)`, 20, h - 38);
        ctx.fillText(`${effort}N × ${effortArm.toFixed(0)} = ${loadForce.toFixed(1)}N × ${loadArm.toFixed(0)}`, 20, h - 24);
        ctx.fillStyle = ma >= 1 ? 'rgba(100,255,150,0.7)' : 'rgba(255,200,80,0.7)';
        ctx.font = 'bold 10px monospace';
        ctx.fillText(`MA = ${effortArm.toFixed(0)} / ${loadArm.toFixed(0)} = ${ma.toFixed(2)}x  ${ma >= 1 ? '(Force multiplier ↑)' : '(Speed/Distance multiplier ↑)'}`, 20, h - 12);

      } else if (machine === 'pulley') {
        const nPulleys = Math.max(1, Math.round(param * 4 + 1));
        ma = nPulleys;
        const topY = cy - h * 0.22;
        const botY = cy + h * 0.18;
        const stride = Math.min(45, (w * 0.6) / nPulleys);
        const startX = cx - (nPulleys - 1) * stride / 2;
        const ropeDisp = Math.sin(phase * 2) * 12;

        // Ceiling
        ctx.fillStyle = 'rgba(60,65,80,0.4)'; ctx.fillRect(0, topY - 25, w, 12);
        ctx.strokeStyle = 'rgba(100,105,120,0.5)'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(0, topY - 13); ctx.lineTo(w, topY - 13); ctx.stroke();

        for (let i = 0; i < nPulleys; i++) {
          const px = startX + i * stride;
          const isFixed = i % 2 === 0;
          const py = isFixed ? topY : topY + 35;

          // Mounting
          if (isFixed) {
            ctx.strokeStyle = 'rgba(100,100,120,0.5)'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(px, topY - 13); ctx.lineTo(px, py); ctx.stroke();
          }

          // Pulley
          ctx.beginPath(); ctx.arc(px, py, 14, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(70,80,110,0.3)'; ctx.fill();
          ctx.strokeStyle = 'rgba(140,150,180,0.7)'; ctx.lineWidth = 2.5; ctx.stroke();
          ctx.beginPath(); ctx.arc(px, py, 4, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(120,120,140,0.6)'; ctx.fill();

          // Label
          ctx.fillStyle = 'rgba(200,200,255,0.4)'; ctx.font = '7px sans-serif'; ctx.textAlign = 'center';
          ctx.fillText(isFixed ? 'Fixed' : 'Movable', px, py - 18);
        }

        // Rope
        ctx.strokeStyle = 'rgba(220,200,120,0.6)'; ctx.lineWidth = 1.5;
        ctx.beginPath();
        for (let i = 0; i < nPulleys; i++) {
          const px = startX + i * stride;
          const py = i % 2 === 0 ? topY : topY + 35;
          if (i === 0) ctx.moveTo(px, py + 14);
          else ctx.lineTo(px, py + (i % 2 === 0 ? -14 : 14));
        }
        const lastPX = startX + (nPulleys - 1) * stride;
        ctx.lineTo(lastPX, botY + ropeDisp);
        ctx.stroke();

        // Load
        ctx.fillStyle = 'rgba(255,100,80,0.2)'; ctx.strokeStyle = 'rgba(255,100,80,0.5)'; ctx.lineWidth = 1.5;
        ctx.fillRect(lastPX - 20, botY + ropeDisp, 40, 30); ctx.strokeRect(lastPX - 20, botY + ropeDisp, 40, 30);
        ctx.fillStyle = 'rgba(255,100,80,0.7)'; ctx.font = 'bold 9px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText(`${effort}N`, lastPX, botY + ropeDisp + 18);
        ctx.fillText('LOAD', lastPX, botY + ropeDisp + 28);

        // Effort
        const effortX = startX - 30;
        drawArrow(effortX, topY + 15, effortX, topY + 55 + ropeDisp / nPulleys, 'rgba(80,180,255,0.8)', `${(effort / ma).toFixed(1)}N`, 'right');
        ctx.fillStyle = 'rgba(80,180,255,0.5)'; ctx.font = '8px sans-serif';
        ctx.fillText('EFFORT', effortX, topY + 65 + ropeDisp / nPulleys);

        // Info
        ctx.fillStyle = 'rgba(20,25,50,0.5)'; ctx.fillRect(10, h - 42, w - 20, 35);
        ctx.fillStyle = 'rgba(200,200,255,0.6)'; ctx.font = '9px monospace'; ctx.textAlign = 'left';
        ctx.fillText(`Pulleys: ${nPulleys} | MA = ${nPulleys} | Effort = Load / ${nPulleys} = ${(effort / nPulleys).toFixed(1)}N`, 20, h - 24);
        ctx.fillText(`Rope pulled: ${nPulleys}× the distance load moves   (Trade-off: distance for force)`, 20, h - 12);

      } else if (machine === 'inclined-plane') {
        const angle = 10 + param * 60;
        const angleRad = (angle * Math.PI) / 180;
        ma = 1 / Math.sin(angleRad);
        const baseW = w * 0.55;
        const rampH = Math.min(h * 0.45, baseW * Math.tan(angleRad));
        const baseY = cy + h * 0.2;
        const rampStartX = cx - baseW / 2;

        // Ramp body
        ctx.fillStyle = 'rgba(100,80,60,0.2)';
        ctx.beginPath(); ctx.moveTo(rampStartX, baseY); ctx.lineTo(rampStartX + baseW, baseY); ctx.lineTo(rampStartX, baseY - rampH); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = 'rgba(160,130,90,0.6)'; ctx.lineWidth = 2; ctx.stroke();

        // Right angle marker
        ctx.strokeStyle = 'rgba(160,130,90,0.3)'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(rampStartX + baseW - 12, baseY); ctx.lineTo(rampStartX + baseW - 12, baseY - 12); ctx.lineTo(rampStartX + baseW, baseY - 12); ctx.stroke();

        // Angle arc
        ctx.strokeStyle = 'rgba(200,200,255,0.4)'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(rampStartX + baseW, baseY, 25, Math.PI, Math.PI + angleRad); ctx.stroke();

        // Object sliding
        const objT = (Math.sin(phase * 0.8) + 1) / 2;
        const objAlongRamp = 0.1 + objT * 0.75;
        const objX = rampStartX + baseW - objAlongRamp * baseW;
        const objY = baseY - objAlongRamp * rampH;

        ctx.save(); ctx.translate(objX, objY);
        const realAngle = Math.atan2(rampH, baseW);
        ctx.rotate(-realAngle);
        ctx.fillStyle = 'rgba(255,100,80,0.4)'; ctx.strokeStyle = 'rgba(255,100,80,0.6)'; ctx.lineWidth = 1;
        ctx.fillRect(-14, -22, 28, 22); ctx.strokeRect(-14, -22, 28, 22);
        ctx.fillStyle = 'rgba(255,100,80,0.6)'; ctx.font = '7px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText('LOAD', 0, -8);
        ctx.restore();

        // Weight arrow (straight down)
        drawArrow(objX, objY + 5, objX, objY + 40, 'rgba(255,100,80,0.7)', `W = ${effort}N`, 'right');

        // Effort arrow (along ramp surface)
        const eLen = 35;
        const ex2 = objX - eLen * Math.cos(realAngle);
        const ey2 = objY + eLen * Math.sin(realAngle);
        drawArrow(objX - 3 * Math.cos(realAngle), objY + 3 * Math.sin(realAngle), ex2, ey2, 'rgba(80,180,255,0.8)', `E = ${(effort / ma).toFixed(1)}N`, 'top');

        // Dimension labels
        ctx.fillStyle = 'rgba(200,200,255,0.5)'; ctx.font = '9px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText(`θ = ${angle.toFixed(0)}°`, rampStartX + baseW - 15, baseY + 18);
        ctx.fillText(`Length (L) = ${baseW.toFixed(0)}`, cx, baseY + 30);
        ctx.textAlign = 'right';
        ctx.fillText(`Height (h) = ${rampH.toFixed(0)}`, rampStartX - 5, baseY - rampH / 2);

        // Info bar
        ctx.fillStyle = 'rgba(20,25,50,0.5)'; ctx.fillRect(10, h - 42, w - 20, 35);
        ctx.fillStyle = 'rgba(200,200,255,0.6)'; ctx.font = '9px monospace'; ctx.textAlign = 'left';
        ctx.fillText(`MA = L/h = 1/sin(${angle.toFixed(0)}°) = ${ma.toFixed(2)}x | Effort = Weight / MA = ${(effort / ma).toFixed(1)}N`, 20, h - 24);
        ctx.fillText(`Push ${ma.toFixed(1)}× farther up the ramp, but with ${(100 / ma).toFixed(0)}% of the force`, 20, h - 12);

      } else if (machine === 'wedge') {
        const wedgeAngle = 10 + param * 40;
        const wedgeH = h * 0.35;
        const wedgeW = wedgeH * Math.tan((wedgeAngle * Math.PI) / 180);
        ma = wedgeH / (wedgeW * 2);

        const tipY = cy - wedgeH / 2;
        const disp = Math.sin(phase * 2) * 8;
        const tip = { x: cx, y: tipY + disp };

        // Wedge shape
        ctx.fillStyle = 'rgba(160,160,180,0.15)';
        ctx.beginPath(); ctx.moveTo(tip.x, tip.y); ctx.lineTo(cx - wedgeW, tip.y + wedgeH); ctx.lineTo(cx + wedgeW, tip.y + wedgeH); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = 'rgba(180,180,200,0.6)'; ctx.lineWidth = 1.5; ctx.stroke();

        // Dimension labels on wedge
        ctx.setLineDash([3, 3]);
        ctx.strokeStyle = 'rgba(200,200,255,0.3)'; ctx.lineWidth = 1;
        // Height
        ctx.beginPath(); ctx.moveTo(cx + wedgeW + 15, tip.y); ctx.lineTo(cx + wedgeW + 15, tip.y + wedgeH); ctx.stroke();
        ctx.fillStyle = 'rgba(200,200,255,0.4)'; ctx.font = '8px sans-serif'; ctx.textAlign = 'left';
        ctx.fillText(`L = ${wedgeH.toFixed(0)}`, cx + wedgeW + 18, tip.y + wedgeH / 2);
        // Width
        ctx.beginPath(); ctx.moveTo(cx - wedgeW, tip.y + wedgeH + 12); ctx.lineTo(cx + wedgeW, tip.y + wedgeH + 12); ctx.stroke();
        ctx.fillStyle = 'rgba(200,200,255,0.4)'; ctx.textAlign = 'center';
        ctx.fillText(`w = ${(wedgeW * 2).toFixed(0)}`, cx, tip.y + wedgeH + 24);
        ctx.setLineDash([]);

        // Input force arrow (driving wedge down)
        drawArrow(cx, tip.y + wedgeH + 30, cx, tip.y + wedgeH + 5, 'rgba(80,180,255,0.8)', `Input: ${effort}N`, 'bottom');

        // Splitting force arrows (pushing outward)
        const splitForce = effort * ma / 2;
        drawArrow(cx - wedgeW / 2, tip.y + wedgeH / 2, cx - wedgeW / 2 - 35, tip.y + wedgeH / 2, 'rgba(255,150,80,0.8)', `${splitForce.toFixed(0)}N`, 'top');
        drawArrow(cx + wedgeW / 2, tip.y + wedgeH / 2, cx + wedgeW / 2 + 35, tip.y + wedgeH / 2, 'rgba(255,150,80,0.8)', `${splitForce.toFixed(0)}N`, 'top');

        // Material being split
        ctx.fillStyle = 'rgba(100,80,60,0.15)';
        ctx.fillRect(cx - wedgeW - 30, tip.y, -25, wedgeH); ctx.fillRect(cx + wedgeW, tip.y, 55, wedgeH);

        // Info
        ctx.fillStyle = 'rgba(20,25,50,0.5)'; ctx.fillRect(10, h - 42, w - 20, 35);
        ctx.fillStyle = 'rgba(200,200,255,0.6)'; ctx.font = '9px monospace'; ctx.textAlign = 'left';
        ctx.fillText(`MA = Length / Width = ${wedgeH.toFixed(0)} / ${(wedgeW * 2).toFixed(0)} = ${ma.toFixed(2)}x`, 20, h - 24);
        ctx.fillText(`Thinner wedge → more splitting force. Examples: axe, knife, nail, chisel`, 20, h - 12);

      } else if (machine === 'screw') {
        const pitch = 2 + param * 12;
        const screwR = 28;
        ma = (2 * Math.PI * screwR) / pitch;
        const screwX = cx, screwTop = cy - 70, screwBot = cy + 70;

        // Screw body
        ctx.fillStyle = 'rgba(120,120,150,0.15)'; ctx.fillRect(screwX - screwR, screwTop, screwR * 2, screwBot - screwTop);
        ctx.strokeStyle = 'rgba(160,160,180,0.4)'; ctx.lineWidth = 1;
        ctx.strokeRect(screwX - screwR, screwTop, screwR * 2, screwBot - screwTop);

        // Thread lines
        ctx.strokeStyle = 'rgba(100,160,255,0.5)'; ctx.lineWidth = 1.5;
        const threadCount = Math.floor(140 / pitch);
        for (let i = 0; i < threadCount; i++) {
          const ty = screwTop + i * pitch + ((phase * 5) % pitch);
          if (ty < screwTop || ty > screwBot) continue;
          ctx.beginPath(); ctx.moveTo(screwX - screwR - 6, ty); ctx.lineTo(screwX + screwR + 6, ty); ctx.stroke();
        }

        // Pitch dimension
        const pitchY1 = screwTop + 20;
        const pitchY2 = pitchY1 + pitch;
        ctx.setLineDash([3, 3]);
        ctx.strokeStyle = 'rgba(255,200,80,0.5)'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(screwX + screwR + 15, pitchY1); ctx.lineTo(screwX + screwR + 15, pitchY2); ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = 'rgba(255,200,80,0.6)'; ctx.font = '8px sans-serif'; ctx.textAlign = 'left';
        ctx.fillText(`pitch`, screwX + screwR + 18, (pitchY1 + pitchY2) / 2 + 3);
        ctx.fillText(`= ${pitch.toFixed(1)}mm`, screwX + screwR + 18, (pitchY1 + pitchY2) / 2 + 13);

        // Rotation arrow at top
        ctx.strokeStyle = 'rgba(80,180,255,0.6)'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(screwX, screwTop - 20, 20, 0.3, Math.PI * 1.7); ctx.stroke();
        // Arrowhead on arc
        const aEnd = Math.PI * 1.7;
        ctx.fillStyle = 'rgba(80,180,255,0.7)';
        ctx.beginPath();
        ctx.moveTo(screwX + 20 * Math.cos(aEnd), screwTop - 20 + 20 * Math.sin(aEnd));
        ctx.lineTo(screwX + 20 * Math.cos(aEnd) + 5, screwTop - 20 + 20 * Math.sin(aEnd) - 5);
        ctx.lineTo(screwX + 20 * Math.cos(aEnd) - 5, screwTop - 20 + 20 * Math.sin(aEnd) - 3);
        ctx.closePath(); ctx.fill();

        // Circumference label
        ctx.fillStyle = 'rgba(80,180,255,0.5)'; ctx.font = '8px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText(`Circumference = 2πr`, screwX, screwTop - 45);
        ctx.fillText(`= 2π × ${screwR} = ${(2 * Math.PI * screwR).toFixed(1)}mm`, screwX, screwTop - 35);

        // Downward motion arrow
        drawArrow(screwX - screwR - 25, screwTop + 20, screwX - screwR - 25, screwTop + 20 + pitch, 'rgba(255,150,80,0.7)', `${pitch.toFixed(1)}mm/turn`, 'left');

        // Info
        ctx.fillStyle = 'rgba(20,25,50,0.5)'; ctx.fillRect(10, h - 42, w - 20, 35);
        ctx.fillStyle = 'rgba(200,200,255,0.6)'; ctx.font = '9px monospace'; ctx.textAlign = 'left';
        ctx.fillText(`MA = 2πr / pitch = ${(2 * Math.PI * screwR).toFixed(1)} / ${pitch.toFixed(1)} = ${ma.toFixed(2)}x`, 20, h - 24);
        ctx.fillText(`One full rotation → screw advances ${pitch.toFixed(1)}mm. Finer thread = more MA`, 20, h - 12);

      } else if (machine === 'wheel-axle') {
        const wheelR = 45 + param * 35;
        const axleR = 12;
        ma = wheelR / axleR;

        // Wheel
        ctx.beginPath(); ctx.arc(cx, cy, wheelR, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(80,90,120,0.1)'; ctx.fill();
        ctx.strokeStyle = 'rgba(140,150,180,0.6)'; ctx.lineWidth = 2.5; ctx.stroke();

        // Spokes
        const spokeAngle = phase * 2;
        for (let i = 0; i < 8; i++) {
          const a = spokeAngle + (i / 8) * Math.PI * 2;
          ctx.strokeStyle = 'rgba(100,110,140,0.2)'; ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * axleR, cy + Math.sin(a) * axleR); ctx.lineTo(cx + Math.cos(a) * wheelR, cy + Math.sin(a) * wheelR); ctx.stroke();
        }

        // Axle
        ctx.beginPath(); ctx.arc(cx, cy, axleR, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(140,140,160,0.3)'; ctx.fill();
        ctx.strokeStyle = 'rgba(180,180,200,0.6)'; ctx.lineWidth = 2; ctx.stroke();

        // Radius labels
        ctx.setLineDash([3, 3]);
        ctx.strokeStyle = 'rgba(80,180,255,0.3)'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + wheelR, cy); ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = 'rgba(80,180,255,0.5)'; ctx.font = '8px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText(`R = ${wheelR.toFixed(0)}`, cx + wheelR / 2, cy - 6);

        ctx.setLineDash([3, 3]);
        ctx.strokeStyle = 'rgba(255,150,80,0.3)';
        ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx, cy - axleR); ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = 'rgba(255,150,80,0.5)';
        ctx.fillText(`r = ${axleR}`, cx + 12, cy - axleR / 2);

        // Effort on wheel rim
        drawArrow(cx - wheelR - 40, cy, cx - wheelR - 5, cy, 'rgba(80,180,255,0.8)', `Effort: ${(effort / ma).toFixed(1)}N`, 'top');

        // Load on axle
        drawArrow(cx, cy + axleR + 5, cx, cy + axleR + 45, 'rgba(255,100,80,0.8)', `Load: ${effort}N`, 'right');

        // Info
        ctx.fillStyle = 'rgba(20,25,50,0.5)'; ctx.fillRect(10, h - 42, w - 20, 35);
        ctx.fillStyle = 'rgba(200,200,255,0.6)'; ctx.font = '9px monospace'; ctx.textAlign = 'left';
        ctx.fillText(`MA = R / r = ${wheelR.toFixed(0)} / ${axleR} = ${ma.toFixed(2)}x | Effort = ${(effort / ma).toFixed(1)}N`, 20, h - 24);
        ctx.fillText(`Examples: Steering wheel, doorknob, screwdriver, gear systems`, 20, h - 12);
      }

      animRef.current = requestAnimationFrame(draw);
    };
    animRef.current = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(animRef.current); obs.disconnect(); };
  }, [running, machine, effort, param, leverClass]);

  const info = machineLearnContent[machine];

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-gray-950 to-emerald-950 p-3 overflow-hidden">
      <div className="mb-2 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white">🔩 Simple Machines</h2>
          <p className="text-[11px] text-gray-400">Mechanical advantage, levers, pulleys & more</p>
        </div>
        <div className="flex gap-1">
          <button onClick={() => setShowTab('sim')} className={`px-3 py-1 rounded text-[10px] font-medium ${showTab === 'sim' ? 'bg-emerald-700 text-white' : 'bg-gray-800 text-gray-400'}`}>Simulation</button>
          <button onClick={() => setShowTab('learn')} className={`px-3 py-1 rounded text-[10px] font-medium ${showTab === 'learn' ? 'bg-emerald-700 text-white' : 'bg-gray-800 text-gray-400'}`}>Learn</button>
        </div>
      </div>
      <div className="flex-1 flex gap-3 min-h-0">
        {showTab === 'sim' ? (
          <div className="flex-1 min-w-0 min-h-0 rounded-lg border border-gray-800 overflow-hidden">
            <canvas ref={canvasRef} className="w-full h-full" />
          </div>
        ) : (
          <div className="flex-1 min-w-0 min-h-0 rounded-lg border border-gray-800 overflow-y-auto bg-gray-900/50 p-4 space-y-4">
            <h3 className="text-sm font-bold text-white">{info.title}</h3>
            <div className="bg-emerald-950/40 border border-emerald-800/30 rounded p-3">
              <p className="text-[10px] font-semibold text-emerald-300 mb-1">Formula</p>
              <p className="text-xs text-white font-mono">{info.formula}</p>
            </div>
            <div className="bg-blue-950/30 border border-blue-800/30 rounded p-3">
              <p className="text-[10px] font-semibold text-blue-300 mb-1">Principle</p>
              <p className="text-[11px] text-gray-300">{info.principle}</p>
            </div>
            <div className="space-y-1.5">
              <p className="text-[10px] font-semibold text-gray-400 uppercase">Key Points</p>
              {info.points.map((pt, i) => (
                <div key={i} className="flex gap-2 items-start">
                  <span className="text-emerald-400 text-[9px] mt-0.5">●</span>
                  <p className="text-[10px] text-gray-300 leading-relaxed">{pt}</p>
                </div>
              ))}
            </div>
            {machine === 'lever' && (
              <div className="space-y-2 mt-3">
                <p className="text-[10px] font-semibold text-gray-400 uppercase">Lever Classes Comparison</p>
                {([1, 2, 3] as const).map(cls => (
                  <div key={cls} className="rounded p-2.5 border" style={{ borderColor: leverClassInfo[cls].color + '40', backgroundColor: leverClassInfo[cls].color + '10' }}>
                    <p className="text-[10px] font-bold" style={{ color: leverClassInfo[cls].color }}>{leverClassInfo[cls].name}</p>
                    <p className="text-[9px] text-gray-400 font-mono mt-0.5">{leverClassInfo[cls].arrangement}</p>
                    <p className="text-[9px] text-gray-400 mt-0.5">{leverClassInfo[cls].desc}</p>
                    <p className="text-[9px] text-gray-500 mt-0.5">📌 {leverClassInfo[cls].examples}</p>
                    <p className="text-[9px] text-gray-500">📐 {leverClassInfo[cls].maNote}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        <div className="w-[195px] flex flex-col gap-2 flex-shrink-0 overflow-y-auto">
          <div className="flex gap-1">
            <button onClick={() => setRunning(!running)} className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded text-[10px] font-medium ${running ? 'bg-amber-600 text-white' : 'bg-green-600 text-white'}`}>
              {running ? <><Pause className="h-3 w-3" />Pause</> : <><Play className="h-3 w-3" />Run</>}
            </button>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-3 space-y-1">
            <h4 className="text-[11px] font-semibold text-gray-400 uppercase mb-1">Machine Type</h4>
            {(['lever', 'pulley', 'inclined-plane', 'wedge', 'screw', 'wheel-axle'] as MachineType[]).map(m => (
              <button key={m} onClick={() => { setMachine(m); setParam(0.5); }} className={`block w-full text-left px-2 py-1 rounded text-[10px] ${machine === m ? 'bg-emerald-700 text-white' : 'bg-gray-800 text-gray-400'}`}>
                {m === 'lever' ? '🔧 Lever' : m === 'pulley' ? '🏗️ Pulley' : m === 'inclined-plane' ? '📐 Inclined Plane' : m === 'wedge' ? '🪓 Wedge' : m === 'screw' ? '🔩 Screw' : '☸️ Wheel & Axle'}
              </button>
            ))}
          </div>
          {machine === 'lever' && (
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-3 space-y-1">
              <h4 className="text-[11px] font-semibold text-gray-400 uppercase mb-1">Lever Class</h4>
              {([1, 2, 3] as const).map(cls => (
                <button key={cls} onClick={() => { setLeverClass(cls); setParam(0.5); }} className={`block w-full text-left px-2 py-1.5 rounded text-[10px] ${leverClass === cls ? 'text-white' : 'bg-gray-800 text-gray-400'}`} style={leverClass === cls ? { backgroundColor: leverClassInfo[cls].color + 'cc' } : {}}>
                  <span className="font-bold">Class {cls}</span>
                  <span className="ml-1 text-[9px] opacity-80">
                    {cls === 1 ? '(F between E & L)' : cls === 2 ? '(L between F & E)' : '(E between F & L)'}
                  </span>
                </button>
              ))}
            </div>
          )}
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-3 space-y-2">
            <label className="text-[9px] text-gray-400 flex justify-between"><span>Load Force (N)</span><span className="font-mono">{effort}N</span></label>
            <input type="range" min={10} max={200} step={5} value={effort} onChange={e => setEffort(+e.target.value)} className="w-full h-1 accent-emerald-500" />
            <label className="text-[9px] text-gray-400 flex justify-between">
              <span>{machine === 'lever' ? (leverClass === 1 ? 'Fulcrum Position' : leverClass === 2 ? 'Load Position' : 'Effort Position') : machine === 'pulley' ? 'Pulleys' : machine === 'inclined-plane' ? 'Ramp Angle' : machine === 'wedge' ? 'Wedge Angle' : machine === 'screw' ? 'Thread Pitch' : 'Wheel Size'}</span>
              <span className="font-mono">{param.toFixed(2)}</span>
            </label>
            <input type="range" min={0.1} max={0.9} step={0.01} value={param} onChange={e => setParam(+e.target.value)} className="w-full h-1 accent-emerald-500" />
          </div>
          <div className="bg-emerald-950/30 border border-emerald-800/40 rounded-lg p-2.5">
            <h4 className="text-[10px] font-semibold text-emerald-300 flex items-center gap-1 mb-1"><Info className="h-3 w-3" />Key Concept</h4>
            <p className="text-[9px] text-gray-400">
              {machine === 'lever'
                ? leverClassInfo[leverClass].desc
                : machine === 'pulley'
                  ? 'Each supporting rope segment shares the load equally. More pulleys = less effort but more rope to pull.'
                  : machine === 'inclined-plane'
                    ? 'A ramp trades distance for force. Shallower angle = less effort needed, but a longer path to travel.'
                    : machine === 'wedge'
                      ? 'Converts downward force into two outward splitting forces. Thinner = more splitting power.'
                      : machine === 'screw'
                        ? 'An inclined plane wrapped in a helix. Each turn advances by one pitch. Finer threads = more force.'
                        : 'Force at the wheel edge is amplified at the axle. Bigger wheel = bigger advantage.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
