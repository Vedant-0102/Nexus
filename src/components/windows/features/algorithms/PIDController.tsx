import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Play, Pause, RotateCcw, Info, Settings } from 'lucide-react';

/* ───────────────── types ───────────────── */
type PlantType = 'first-order' | 'second-order' | 'integrator' | 'dead-time';
type DisturbanceType = 'step' | 'impulse' | 'sinusoidal';

interface HistoryPoint {
  t: number;
  pv: number;
  sp: number;
  output: number;
  error: number;
  p: number;
  i: number;
  d: number;
}

interface Metrics {
  riseTime: number | null;
  settlingTime: number | null;
  overshoot: number | null;
  steadyStateError: number | null;
}

interface Preset {
  label: string;
  kp: number;
  ki: number;
  kd: number;
}

const PRESETS: Preset[] = [
  { label: 'Underdamped', kp: 4.0, ki: 1.0, kd: 0.3 },
  { label: 'Critically Damped', kp: 2.5, ki: 0.8, kd: 1.5 },
  { label: 'Overdamped', kp: 1.0, ki: 0.2, kd: 2.5 },
  { label: 'Aggressive', kp: 8.0, ki: 3.0, kd: 0.5 },
  { label: 'Conservative', kp: 0.8, ki: 0.1, kd: 0.4 },
];

const MAX_HISTORY = 800;
const SIM_DT = 0.02;
const OUTPUT_MAX = 100;
const DEAD_TIME_BUFFER_LEN = 15; // 15 * 0.02 = 0.3s of delay

/* ─────────── component ─────────── */
export const PIDController: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  /* ── ui state ── */
  const [running, setRunning] = useState(false);
  const [kp, setKp] = useState(2.0);
  const [ki, setKi] = useState(0.5);
  const [kd, setKd] = useState(0.8);
  const [setpoint, setSetpoint] = useState(50);
  const [disturbance, setDisturbance] = useState(0);
  const [disturbanceType, setDisturbanceType] = useState<DisturbanceType>('step');
  const [plant, setPlant] = useState<PlantType>('first-order');
  const [noiseEnabled, setNoiseEnabled] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [hoveredComponent, setHoveredComponent] = useState<'P' | 'I' | 'D' | null>(null);

  /* ── simulation refs (mutable, no re-render) ── */
  const timeRef = useRef(0);
  const pvRef = useRef(0);
  const velRef = useRef(0);
  const integralRef = useRef(0);
  const prevPvRef = useRef(0);
  const dFilteredRef = useRef(0);
  const impulseActiveRef = useRef(false);
  const impulseDecayRef = useRef(0);
  const deadTimeBuffer = useRef<number[]>(new Array(DEAD_TIME_BUFFER_LEN).fill(0));
  const historyRef = useRef<HistoryPoint[]>([]);
  const metricsRef = useRef<Metrics>({ riseTime: null, settlingTime: null, overshoot: null, steadyStateError: null });

  /* ── stable refs for values used inside rAF ── */
  const runningRef = useRef(running);
  const kpRef = useRef(kp);
  const kiRef = useRef(ki);
  const kdRef = useRef(kd);
  const spRef = useRef(setpoint);
  const distRef = useRef(disturbance);
  const distTypeRef = useRef(disturbanceType);
  const plantRef = useRef(plant);
  const noiseRef = useRef(noiseEnabled);
  const hoveredRef = useRef(hoveredComponent);

  useEffect(() => { runningRef.current = running; }, [running]);
  useEffect(() => { kpRef.current = kp; }, [kp]);
  useEffect(() => { kiRef.current = ki; }, [ki]);
  useEffect(() => { kdRef.current = kd; }, [kd]);
  useEffect(() => { spRef.current = setpoint; }, [setpoint]);
  useEffect(() => { distRef.current = disturbance; }, [disturbance]);
  useEffect(() => { distTypeRef.current = disturbanceType; }, [disturbanceType]);
  useEffect(() => { plantRef.current = plant; }, [plant]);
  useEffect(() => { noiseRef.current = noiseEnabled; }, [noiseEnabled]);
  useEffect(() => { hoveredRef.current = hoveredComponent; }, [hoveredComponent]);

  /* ── reset ── */
  const reset = useCallback(() => {
    timeRef.current = 0;
    pvRef.current = 0;
    velRef.current = 0;
    integralRef.current = 0;
    prevPvRef.current = 0;
    dFilteredRef.current = 0;
    impulseActiveRef.current = false;
    impulseDecayRef.current = 0;
    deadTimeBuffer.current = new Array(DEAD_TIME_BUFFER_LEN).fill(0);
    historyRef.current = [];
    metricsRef.current = { riseTime: null, settlingTime: null, overshoot: null, steadyStateError: null };
    setRunning(false);
  }, []);

  /* ── apply preset ── */
  const applyPreset = useCallback((p: Preset) => {
    setKp(p.kp);
    setKi(p.ki);
    setKd(p.kd);
  }, []);

  /* ── compute performance metrics from history ── */
  const computeMetrics = useCallback((hist: HistoryPoint[]): Metrics => {
    if (hist.length < 10) return { riseTime: null, settlingTime: null, overshoot: null, steadyStateError: null };

    const sp = hist[hist.length - 1].sp;
    if (sp === 0) return { riseTime: null, settlingTime: null, overshoot: null, steadyStateError: null };

    const lo = sp * 0.1;
    const hi = sp * 0.9;
    const band = Math.abs(sp) * 0.02;

    let riseStart: number | null = null;
    let riseEnd: number | null = null;
    let maxPv = -Infinity;
    let settlingTime: number | null = null;

    for (let i = 0; i < hist.length; i++) {
      const p = hist[i];
      if (p.pv > maxPv) maxPv = p.pv;
      if (riseStart === null && p.pv >= lo) riseStart = p.t;
      if (riseEnd === null && p.pv >= hi) riseEnd = p.t;
    }

    // settling: last time the PV left the 2% band
    for (let i = hist.length - 1; i >= 0; i--) {
      if (Math.abs(hist[i].pv - sp) > band) {
        settlingTime = i < hist.length - 1 ? hist[i + 1].t : null;
        break;
      }
    }

    const riseTime = riseStart !== null && riseEnd !== null ? riseEnd - riseStart : null;
    const overshoot = sp > 0 ? Math.max(0, ((maxPv - sp) / sp) * 100) : null;
    const steadyStateError = Math.abs(hist[hist.length - 1].pv - sp);

    return { riseTime, settlingTime, overshoot, steadyStateError };
  }, []);

  /* ───────────────── main animation loop ───────────────── */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;

    const resize = () => {
      const r = canvas.getBoundingClientRect();
      const d = window.devicePixelRatio || 1;
      canvas.width = r.width * d;
      canvas.height = r.height * d;
      ctx.setTransform(d, 0, 0, d, 0, 0);
    };
    resize();
    const obs = new ResizeObserver(resize);
    obs.observe(canvas);

    const draw = () => {
      const r = canvas.getBoundingClientRect();
      const w = r.width;
      const h = r.height;

      /* ── theme detection ── */
      const isDark = document.documentElement.classList.contains('dark');
      const bg = isDark ? '#080c18' : '#ffffff';
      const textPrimary = isDark ? 'rgba(220,225,255,0.85)' : 'rgba(30,30,50,0.85)';
      const textSecondary = isDark ? 'rgba(150,155,200,0.6)' : 'rgba(80,80,120,0.6)';
      const gridColor = isDark ? 'rgba(60,70,110,0.25)' : 'rgba(160,170,200,0.3)';
      const chartBg = isDark ? 'rgba(20,25,50,0.45)' : 'rgba(230,235,250,0.5)';
      const overlayBg = isDark ? 'rgba(15,20,40,0.7)' : 'rgba(240,242,255,0.8)';
      const overlayBorder = isDark ? 'rgba(80,90,140,0.4)' : 'rgba(160,170,210,0.5)';
      const zeroLine = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)';
      const pvColor = isDark ? 'rgba(80,210,255,0.9)' : 'rgba(0,150,200,0.9)';
      const spColor = isDark ? 'rgba(255,200,50,0.7)' : 'rgba(200,150,0,0.7)';
      const errorFill = isDark ? 'rgba(255,100,100,0.06)' : 'rgba(255,80,80,0.08)';
      const pColor = isDark ? 'rgba(255,110,110,0.8)' : 'rgba(220,50,50,0.8)';
      const iColor = isDark ? 'rgba(100,255,130,0.8)' : 'rgba(30,160,60,0.8)';
      const dColor = isDark ? 'rgba(110,130,255,0.8)' : 'rgba(50,60,220,0.8)';
      const markerColor = isDark ? 'rgba(255,180,50,0.5)' : 'rgba(200,140,0,0.5)';
      const overshootColor = isDark ? 'rgba(255,80,80,0.45)' : 'rgba(220,40,40,0.45)';

      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      /* ──────────── simulation step ──────────── */
      if (runningRef.current) {
        const _kp = kpRef.current;
        const _ki = kiRef.current;
        const _kd = kdRef.current;
        const _sp = spRef.current;
        const _dist = distRef.current;
        const _distType = distTypeRef.current;
        const _plant = plantRef.current;
        const _noise = noiseRef.current;
        const dt = SIM_DT;

        /* disturbance signal */
        let distSignal = 0;
        if (_distType === 'step') {
          distSignal = _dist;
        } else if (_distType === 'impulse') {
          if (Math.abs(_dist) > 0.01 && !impulseActiveRef.current) {
            impulseActiveRef.current = true;
            impulseDecayRef.current = _dist;
          }
          if (impulseActiveRef.current) {
            distSignal = impulseDecayRef.current;
            impulseDecayRef.current *= 0.95; // decay
            if (Math.abs(impulseDecayRef.current) < 0.01) {
              impulseActiveRef.current = false;
              impulseDecayRef.current = 0;
            }
          }
        } else {
          distSignal = _dist * Math.sin(timeRef.current * 2);
        }

        /* PID computation */
        const error = _sp - pvRef.current;

        // P
        const pTerm = _kp * error;

        // D (derivative of PV, not error -- prevents derivative kick)
        const rawD = -(pvRef.current - prevPvRef.current) / dt;
        const alpha = 0.1;
        dFilteredRef.current = alpha * rawD + (1 - alpha) * dFilteredRef.current;
        const dTerm = _kd * dFilteredRef.current;

        // Compute raw output before clamping to check saturation
        const rawOutput = pTerm + _ki * integralRef.current + dTerm;
        const isSaturated = rawOutput > OUTPUT_MAX || rawOutput < -OUTPUT_MAX;

        // I (anti-windup: don't integrate when saturated and error would make it worse)
        const windupBlocked = isSaturated && ((error > 0 && rawOutput > OUTPUT_MAX) || (error < 0 && rawOutput < -OUTPUT_MAX));
        if (!windupBlocked) {
          integralRef.current += error * dt;
          // Clamp integral itself
          integralRef.current = Math.max(-OUTPUT_MAX, Math.min(OUTPUT_MAX, integralRef.current));
        }
        const iTerm = _ki * integralRef.current;

        // Clamp output
        const output = Math.max(-OUTPUT_MAX, Math.min(OUTPUT_MAX, pTerm + iTerm + dTerm));

        /* Plant model */
        prevPvRef.current = pvRef.current;
        const u = output + distSignal;

        if (_plant === 'first-order') {
          const tau = 0.5;
          const K = 1;
          // dy/dt = (-y + K*u) / tau
          pvRef.current += ((-pvRef.current + K * u) / tau) * dt;
        } else if (_plant === 'second-order') {
          const wn = 3;
          const zeta = 0.3;
          const accel = wn * wn * (u - pvRef.current) - 2 * zeta * wn * velRef.current;
          velRef.current += accel * dt;
          pvRef.current += velRef.current * dt;
        } else if (_plant === 'integrator') {
          const K = 0.5;
          pvRef.current += K * u * dt;
        } else {
          // dead-time: first-order with delay
          const tau = 0.5;
          const K = 1;
          const buf = deadTimeBuffer.current;
          buf.push(u);
          const delayedU = buf.length > DEAD_TIME_BUFFER_LEN ? buf.shift()! : 0;
          pvRef.current += ((-pvRef.current + K * delayedU) / tau) * dt;
        }

        // Add noise
        if (_noise) {
          pvRef.current += (Math.random() - 0.5) * 0.5;
        }

        timeRef.current += dt;
        historyRef.current.push({
          t: timeRef.current,
          pv: pvRef.current,
          sp: _sp,
          output,
          error,
          p: pTerm,
          i: iTerm,
          d: dTerm,
        });
        if (historyRef.current.length > MAX_HISTORY) historyRef.current.shift();

        metricsRef.current = computeMetrics(historyRef.current);
      }

      /* ──────────── draw charts ──────────── */
      const hist = historyRef.current;
      const margin = { top: 36, right: 14, bottom: 14, left: 48 };
      const gw = w - margin.left - margin.right;
      const usableH = h - margin.top - margin.bottom - 28;
      const gh1 = usableH * 0.6;
      const gh2 = usableH * 0.3;
      const gap = usableH * 0.1;

      /* ─── top chart: PV vs SP ─── */
      const chart1Y = margin.top;
      ctx.save();
      ctx.translate(margin.left, chart1Y);

      // background
      ctx.fillStyle = chartBg;
      ctx.fillRect(0, 0, gw, gh1);

      // grid
      ctx.strokeStyle = gridColor;
      ctx.lineWidth = 0.5;
      for (let i = 0; i <= 5; i++) {
        const y = (i / 5) * gh1;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(gw, y);
        ctx.stroke();
      }
      for (let i = 0; i <= 8; i++) {
        const x = (i / 8) * gw;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, gh1);
        ctx.stroke();
      }

      // Y axis labels
      ctx.fillStyle = textSecondary;
      ctx.font = '9px sans-serif';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      for (let i = 0; i <= 5; i++) {
        const val = 120 - i * 24; // -0 to 120 range for overshoot visibility
        const y = (i / 5) * gh1;
        ctx.fillText(val.toFixed(0), -6, y);
      }

      // Title
      ctx.fillStyle = textPrimary;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.font = 'bold 10px sans-serif';
      ctx.fillText('Process Value vs Setpoint', gw / 2, -6);

      if (hist.length > 1) {
        const tMax = hist[hist.length - 1].t;
        const tMin = hist[0].t;
        const tRange = Math.max(tMax - tMin, 1);
        const yMin = 0;
        const yMax = 120;
        const mapY = (v: number) => ((yMax - v) / (yMax - yMin)) * gh1;
        const mapX = (t: number) => ((t - tMin) / tRange) * gw;

        // Time labels on X
        ctx.fillStyle = textSecondary;
        ctx.font = '8px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        for (let i = 0; i <= 8; i++) {
          const t = tMin + (i / 8) * tRange;
          ctx.fillText(t.toFixed(1) + 's', (i / 8) * gw, gh1 + 2);
        }

        // Error shading
        ctx.fillStyle = errorFill;
        ctx.beginPath();
        for (let i = 0; i < hist.length; i++) {
          const x = mapX(hist[i].t);
          const yPV = Math.max(0, Math.min(gh1, mapY(hist[i].pv)));
          if (i === 0) ctx.moveTo(x, yPV);
          else ctx.lineTo(x, yPV);
        }
        for (let i = hist.length - 1; i >= 0; i--) {
          const x = mapX(hist[i].t);
          const ySP = Math.max(0, Math.min(gh1, mapY(hist[i].sp)));
          ctx.lineTo(x, ySP);
        }
        ctx.closePath();
        ctx.fill();

        // SP dashed line
        ctx.setLineDash([5, 3]);
        ctx.strokeStyle = spColor;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        for (let i = 0; i < hist.length; i++) {
          const x = mapX(hist[i].t);
          const y = Math.max(0, Math.min(gh1, mapY(hist[i].sp)));
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.setLineDash([]);

        // PV solid line
        ctx.strokeStyle = pvColor;
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let i = 0; i < hist.length; i++) {
          const x = mapX(hist[i].t);
          const y = Math.max(0, Math.min(gh1, mapY(hist[i].pv)));
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();

        /* ── performance markers ── */
        const m = metricsRef.current;
        const sp = hist[hist.length - 1].sp;

        // Rise time marker
        if (m.riseTime !== null) {
          const lo = sp * 0.1;
          const hi = sp * 0.9;
          let tLo: number | null = null;
          let tHi: number | null = null;
          for (const p of hist) {
            if (tLo === null && p.pv >= lo) tLo = p.t;
            if (tHi === null && p.pv >= hi) tHi = p.t;
          }
          if (tLo !== null && tHi !== null && tLo >= tMin && tHi >= tMin) {
            ctx.setLineDash([3, 3]);
            ctx.strokeStyle = markerColor;
            ctx.lineWidth = 1;
            const xLo = mapX(tLo);
            const xHi = mapX(tHi);
            ctx.beginPath(); ctx.moveTo(xLo, 0); ctx.lineTo(xLo, gh1); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(xHi, 0); ctx.lineTo(xHi, gh1); ctx.stroke();
            ctx.setLineDash([]);
            ctx.fillStyle = markerColor;
            ctx.font = '8px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            ctx.fillText('Tr', (xLo + xHi) / 2, 4);
          }
        }

        // Settling time marker
        if (m.settlingTime !== null && m.settlingTime >= tMin) {
          ctx.setLineDash([2, 4]);
          ctx.strokeStyle = isDark ? 'rgba(100,255,150,0.4)' : 'rgba(30,160,60,0.4)';
          ctx.lineWidth = 1;
          const xS = mapX(m.settlingTime);
          ctx.beginPath(); ctx.moveTo(xS, 0); ctx.lineTo(xS, gh1); ctx.stroke();
          ctx.setLineDash([]);
          ctx.fillStyle = isDark ? 'rgba(100,255,150,0.6)' : 'rgba(30,160,60,0.6)';
          ctx.font = '8px sans-serif';
          ctx.textAlign = 'left';
          ctx.textBaseline = 'top';
          ctx.fillText('Ts', xS + 3, 4);
        }

        // Overshoot marker
        if (m.overshoot !== null && m.overshoot > 0.5) {
          const maxPv = Math.max(...hist.map(p => p.pv));
          const yOver = mapY(maxPv);
          if (yOver >= 0 && yOver <= gh1) {
            ctx.setLineDash([3, 3]);
            ctx.strokeStyle = overshootColor;
            ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(0, yOver); ctx.lineTo(gw, yOver); ctx.stroke();
            ctx.setLineDash([]);
            ctx.fillStyle = overshootColor;
            ctx.font = '8px sans-serif';
            ctx.textAlign = 'right';
            ctx.textBaseline = 'bottom';
            ctx.fillText(`OS: ${m.overshoot.toFixed(1)}%`, gw - 4, yOver - 2);
          }
        }

        // Legend
        const legendX = gw - 100;
        const legendY = 8;
        ctx.fillStyle = overlayBg;
        ctx.strokeStyle = overlayBorder;
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.roundRect(legendX, legendY, 92, 28, 4);
        ctx.fill();
        ctx.stroke();

        // PV
        ctx.strokeStyle = pvColor;
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(legendX + 6, legendY + 9); ctx.lineTo(legendX + 20, legendY + 9); ctx.stroke();
        ctx.fillStyle = textPrimary;
        ctx.font = '9px sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText('PV', legendX + 23, legendY + 9);

        // SP
        ctx.setLineDash([4, 2]);
        ctx.strokeStyle = spColor;
        ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(legendX + 48, legendY + 9); ctx.lineTo(legendX + 62, legendY + 9); ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = textPrimary;
        ctx.fillText('SP', legendX + 65, legendY + 9);

        ctx.fillStyle = textSecondary;
        ctx.font = '7px sans-serif';
        ctx.fillText('shaded = error', legendX + 6, legendY + 22);
      }

      ctx.restore();

      /* ─── bottom chart: PID components ─── */
      const chart2Y = chart1Y + gh1 + gap;
      ctx.save();
      ctx.translate(margin.left, chart2Y);

      ctx.fillStyle = chartBg;
      ctx.fillRect(0, 0, gw, gh2);

      ctx.fillStyle = textPrimary;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.font = 'bold 10px sans-serif';
      ctx.fillText('PID Components', gw / 2, -4);

      // zero line
      ctx.strokeStyle = zeroLine;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, gh2 / 2);
      ctx.lineTo(gw, gh2 / 2);
      ctx.stroke();

      // grid
      ctx.strokeStyle = gridColor;
      ctx.lineWidth = 0.5;
      for (let i = 0; i <= 4; i++) {
        const y = (i / 4) * gh2;
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(gw, y); ctx.stroke();
      }

      if (hist.length > 1) {
        const tMax = hist[hist.length - 1].t;
        const tMin = hist[0].t;
        const tRange = Math.max(tMax - tMin, 1);
        const maxComp = Math.max(
          10,
          ...hist.map(p => Math.max(Math.abs(p.p), Math.abs(p.i), Math.abs(p.d)))
        );

        const mapCX = (t: number) => ((t - tMin) / tRange) * gw;
        const mapCY = (v: number) => gh2 / 2 - (v / maxComp) * (gh2 / 2) * 0.9;

        const hovered = hoveredRef.current;
        const series: { key: 'P' | 'I' | 'D'; accessor: (p: HistoryPoint) => number; color: string }[] = [
          { key: 'P', accessor: p => p.p, color: pColor },
          { key: 'I', accessor: p => p.i, color: iColor },
          { key: 'D', accessor: p => p.d, color: dColor },
        ];

        for (const s of series) {
          const dimmed = hovered !== null && hovered !== s.key;
          ctx.globalAlpha = dimmed ? 0.15 : 1;
          ctx.strokeStyle = s.color;
          ctx.lineWidth = dimmed ? 0.8 : 1.5;
          ctx.beginPath();
          for (let i = 0; i < hist.length; i++) {
            const x = mapCX(hist[i].t);
            const y = mapCY(s.accessor(hist[i]));
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.stroke();
        }
        ctx.globalAlpha = 1;

        // Y axis range labels
        ctx.fillStyle = textSecondary;
        ctx.font = '8px sans-serif';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillText(`+${maxComp.toFixed(0)}`, -6, 4);
        ctx.fillText(`-${maxComp.toFixed(0)}`, -6, gh2 - 4);
        ctx.fillText('0', -6, gh2 / 2);

        // Legend
        const lx = gw - 90;
        const ly = gh2 - 18;
        ctx.fillStyle = overlayBg;
        ctx.strokeStyle = overlayBorder;
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.roundRect(lx, ly, 82, 14, 3);
        ctx.fill();
        ctx.stroke();

        let lOff = 6;
        for (const s of series) {
          ctx.strokeStyle = s.color;
          ctx.lineWidth = 2;
          ctx.beginPath(); ctx.moveTo(lx + lOff, ly + 7); ctx.lineTo(lx + lOff + 10, ly + 7); ctx.stroke();
          ctx.fillStyle = textPrimary;
          ctx.font = '8px sans-serif';
          ctx.textAlign = 'left';
          ctx.textBaseline = 'middle';
          ctx.fillText(s.key, lx + lOff + 12, ly + 7);
          lOff += 26;
        }
      }

      ctx.restore();

      /* ─── metrics overlay (top-left of chart) ─── */
      if (hist.length > 10) {
        const m = metricsRef.current;
        const last = hist[hist.length - 1];
        const ox = margin.left + 6;
        const oy = chart1Y + gh1 + gap + gh2 + 10;

        ctx.fillStyle = overlayBg;
        ctx.strokeStyle = overlayBorder;
        ctx.lineWidth = 0.5;
        const bw = gw;
        const bh = 36;
        ctx.beginPath();
        ctx.roundRect(margin.left, oy, bw, bh, 4);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = textPrimary;
        ctx.font = '9px monospace';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';

        const col1 = ox;
        const col2 = ox + gw * 0.25;
        const col3 = ox + gw * 0.5;
        const col4 = ox + gw * 0.75;

        const row1 = oy + 4;
        const row2 = oy + 18;

        ctx.fillText(`PV: ${last.pv.toFixed(1)}`, col1, row1);
        ctx.fillText(`SP: ${last.sp.toFixed(0)}`, col2, row1);
        ctx.fillText(`Err: ${last.error.toFixed(2)}`, col3, row1);
        ctx.fillText(`Out: ${last.output.toFixed(1)}`, col4, row1);

        ctx.fillStyle = textSecondary;
        ctx.fillText(`Rise: ${m.riseTime !== null ? m.riseTime.toFixed(2) + 's' : '--'}`, col1, row2);
        ctx.fillText(`Settle: ${m.settlingTime !== null ? m.settlingTime.toFixed(2) + 's' : '--'}`, col2, row2);
        ctx.fillText(`OS: ${m.overshoot !== null ? m.overshoot.toFixed(1) + '%' : '--'}`, col3, row2);
        ctx.fillText(`SSE: ${m.steadyStateError !== null ? m.steadyStateError.toFixed(2) : '--'}`, col4, row2);
      }

      animRef.current = requestAnimationFrame(draw);
    };

    animRef.current = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(animRef.current);
      obs.disconnect();
    };
  }, [computeMetrics]);

  /* ───────────────── render ───────────────── */
  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-gray-100 to-teal-100 dark:from-gray-950 dark:to-teal-950 p-3 overflow-hidden">
      {/* header */}
      <div className="mb-2 flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
            <Settings className="h-4 w-4 text-teal-600 dark:text-teal-400" />
            PID Controller Simulator
          </h2>
          <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
            Proportional-Integral-Derivative feedback control
          </p>
        </div>
        <button
          onClick={() => setShowInfo(!showInfo)}
          className={`p-1.5 rounded-md transition-colors ${
            showInfo
              ? 'bg-teal-600 text-white'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
          }`}
          title="Toggle info panel"
        >
          <Info className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* info panel */}
      {showInfo && (
        <div className="mb-2 bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800/50 rounded-lg p-3 text-[10px] text-gray-700 dark:text-gray-300 space-y-1.5">
          <p className="font-semibold text-[11px] text-teal-800 dark:text-teal-200">
            Control Equation: u(t) = Kp*e(t) + Ki*&#8747;e(t)dt + Kd*de(t)/dt
          </p>
          <div className="grid grid-cols-3 gap-2">
            <div
              className="p-1.5 rounded bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/30 cursor-default"
              onMouseEnter={() => setHoveredComponent('P')}
              onMouseLeave={() => setHoveredComponent(null)}
            >
              <span className="font-bold text-red-700 dark:text-red-400">P (Proportional):</span>{' '}
              Reacts to the current error. Larger Kp means faster response but more overshoot. Cannot eliminate steady-state error alone.
            </div>
            <div
              className="p-1.5 rounded bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800/30 cursor-default"
              onMouseEnter={() => setHoveredComponent('I')}
              onMouseLeave={() => setHoveredComponent(null)}
            >
              <span className="font-bold text-green-700 dark:text-green-400">I (Integral):</span>{' '}
              Accumulates past error over time. Eliminates steady-state error but can cause windup and oscillation if too high.
            </div>
            <div
              className="p-1.5 rounded bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/30 cursor-default"
              onMouseEnter={() => setHoveredComponent('D')}
              onMouseLeave={() => setHoveredComponent(null)}
            >
              <span className="font-bold text-blue-700 dark:text-blue-400">D (Derivative):</span>{' '}
              Predicts future error from rate of change. Dampens overshoot and oscillation. Uses PV derivative to avoid derivative kick.
            </div>
          </div>
        </div>
      )}

      {/* main area */}
      <div className="flex-1 flex gap-3 min-h-0">
        {/* canvas */}
        <div className="flex-1 min-w-0 min-h-0 rounded-lg border border-gray-300 dark:border-gray-800 overflow-hidden">
          <canvas ref={canvasRef} className="w-full h-full" />
        </div>

        {/* controls panel */}
        <div className="w-[200px] flex flex-col gap-2 flex-shrink-0 overflow-y-auto pr-0.5">
          {/* run / reset */}
          <div className="flex gap-1.5">
            <button
              onClick={() => setRunning(!running)}
              className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-md text-[10px] font-semibold transition-colors ${
                running
                  ? 'bg-amber-600 hover:bg-amber-700 text-white'
                  : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
            >
              {running ? (
                <>
                  <Pause className="h-3 w-3" /> Pause
                </>
              ) : (
                <>
                  <Play className="h-3 w-3" /> Run
                </>
              )}
            </button>
            <button
              onClick={reset}
              className="px-2.5 py-1.5 rounded-md bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-white text-[10px] transition-colors"
              title="Reset"
            >
              <RotateCcw className="h-3 w-3" />
            </button>
          </div>

          {/* PID Gains */}
          <div className="bg-white/80 dark:bg-gray-900/80 border border-gray-200 dark:border-gray-800 rounded-lg p-2.5 space-y-2">
            <h4 className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              PID Gains
            </h4>
            {/* Kp */}
            <div>
              <label className="text-[9px] text-gray-500 dark:text-gray-400 flex justify-between">
                <span
                  className="cursor-default hover:text-red-500 dark:hover:text-red-400 transition-colors"
                  onMouseEnter={() => setHoveredComponent('P')}
                  onMouseLeave={() => setHoveredComponent(null)}
                >
                  Kp (Proportional)
                </span>
                <span className="font-mono font-medium text-gray-700 dark:text-gray-200">{kp.toFixed(2)}</span>
              </label>
              <input
                type="range"
                min={0}
                max={10}
                step={0.1}
                value={kp}
                onChange={e => setKp(+e.target.value)}
                className="w-full h-1 accent-red-500 cursor-pointer"
              />
            </div>
            {/* Ki */}
            <div>
              <label className="text-[9px] text-gray-500 dark:text-gray-400 flex justify-between">
                <span
                  className="cursor-default hover:text-green-500 dark:hover:text-green-400 transition-colors"
                  onMouseEnter={() => setHoveredComponent('I')}
                  onMouseLeave={() => setHoveredComponent(null)}
                >
                  Ki (Integral)
                </span>
                <span className="font-mono font-medium text-gray-700 dark:text-gray-200">{ki.toFixed(2)}</span>
              </label>
              <input
                type="range"
                min={0}
                max={5}
                step={0.05}
                value={ki}
                onChange={e => setKi(+e.target.value)}
                className="w-full h-1 accent-green-500 cursor-pointer"
              />
            </div>
            {/* Kd */}
            <div>
              <label className="text-[9px] text-gray-500 dark:text-gray-400 flex justify-between">
                <span
                  className="cursor-default hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
                  onMouseEnter={() => setHoveredComponent('D')}
                  onMouseLeave={() => setHoveredComponent(null)}
                >
                  Kd (Derivative)
                </span>
                <span className="font-mono font-medium text-gray-700 dark:text-gray-200">{kd.toFixed(2)}</span>
              </label>
              <input
                type="range"
                min={0}
                max={5}
                step={0.05}
                value={kd}
                onChange={e => setKd(+e.target.value)}
                className="w-full h-1 accent-blue-500 cursor-pointer"
              />
            </div>
          </div>

          {/* Setpoint & Disturbance */}
          <div className="bg-white/80 dark:bg-gray-900/80 border border-gray-200 dark:border-gray-800 rounded-lg p-2.5 space-y-2">
            <div>
              <label className="text-[9px] text-gray-500 dark:text-gray-400 flex justify-between">
                <span>Setpoint</span>
                <span className="font-mono font-medium text-gray-700 dark:text-gray-200">{setpoint}</span>
              </label>
              <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={setpoint}
                onChange={e => setSetpoint(+e.target.value)}
                className="w-full h-1 accent-yellow-500 cursor-pointer"
              />
            </div>
            <div>
              <label className="text-[9px] text-gray-500 dark:text-gray-400 flex justify-between">
                <span>Disturbance</span>
                <span className="font-mono font-medium text-gray-700 dark:text-gray-200">{disturbance}</span>
              </label>
              <input
                type="range"
                min={-50}
                max={50}
                step={1}
                value={disturbance}
                onChange={e => setDisturbance(+e.target.value)}
                className="w-full h-1 accent-orange-500 cursor-pointer"
              />
            </div>
            <div>
              <label className="text-[9px] text-gray-500 dark:text-gray-400 mb-0.5 block">Disturbance Type</label>
              <select
                value={disturbanceType}
                onChange={e => {
                  setDisturbanceType(e.target.value as DisturbanceType);
                  impulseActiveRef.current = false;
                  impulseDecayRef.current = 0;
                }}
                className="w-full text-[10px] px-2 py-1 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-teal-500"
              >
                <option value="step">Step (constant)</option>
                <option value="impulse">Impulse (decaying)</option>
                <option value="sinusoidal">Sinusoidal</option>
              </select>
            </div>
          </div>

          {/* Plant */}
          <div className="bg-white/80 dark:bg-gray-900/80 border border-gray-200 dark:border-gray-800 rounded-lg p-2.5 space-y-1.5">
            <h4 className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Plant Model
            </h4>
            <select
              value={plant}
              onChange={e => {
                setPlant(e.target.value as PlantType);
                reset();
              }}
              className="w-full text-[10px] px-2 py-1 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-teal-500"
            >
              <option value="first-order">First Order (tau=0.5)</option>
              <option value="second-order">Second Order (underdamped)</option>
              <option value="integrator">Integrator (K=0.5)</option>
              <option value="dead-time">Dead-Time (0.3s delay)</option>
            </select>
          </div>

          {/* Presets */}
          <div className="bg-white/80 dark:bg-gray-900/80 border border-gray-200 dark:border-gray-800 rounded-lg p-2.5 space-y-1.5">
            <h4 className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Presets
            </h4>
            <div className="grid grid-cols-1 gap-1">
              {PRESETS.map(p => (
                <button
                  key={p.label}
                  onClick={() => applyPreset(p)}
                  className="w-full text-left px-2 py-1 rounded-md text-[10px] bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-teal-100 dark:hover:bg-teal-900/40 hover:text-teal-700 dark:hover:text-teal-300 transition-colors"
                >
                  {p.label}
                  <span className="text-[8px] text-gray-400 dark:text-gray-500 ml-1">
                    ({p.kp}/{p.ki}/{p.kd})
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Noise toggle */}
          <div className="bg-white/80 dark:bg-gray-900/80 border border-gray-200 dark:border-gray-800 rounded-lg p-2.5">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-[10px] text-gray-600 dark:text-gray-300 font-medium">Sensor Noise</span>
              <div className="relative">
                <input
                  type="checkbox"
                  checked={noiseEnabled}
                  onChange={e => setNoiseEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-8 h-4 bg-gray-300 dark:bg-gray-600 peer-checked:bg-teal-600 rounded-full transition-colors" />
                <div className="absolute left-0.5 top-0.5 w-3 h-3 bg-white dark:bg-white rounded-full transition-transform peer-checked:translate-x-4 shadow-sm" />
              </div>
            </label>
          </div>

          {/* Live values */}
          {historyRef.current.length > 0 && (
            <div className="bg-white/80 dark:bg-gray-900/80 border border-gray-200 dark:border-gray-800 rounded-lg p-2.5">
              <h4 className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                Live Values
              </h4>
              {(() => {
                const last = historyRef.current[historyRef.current.length - 1];
                if (!last) return null;
                return (
                  <div className="text-[9px] font-mono text-gray-600 dark:text-gray-300 space-y-0.5">
                    <div className="flex justify-between">
                      <span>PV:</span>
                      <span className="text-cyan-600 dark:text-cyan-400">{last.pv.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>SP:</span>
                      <span className="text-yellow-600 dark:text-yellow-400">{last.sp.toFixed(0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Error:</span>
                      <span>{last.error.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Output:</span>
                      <span>{last.output.toFixed(2)}</span>
                    </div>
                    <hr className="border-gray-200 dark:border-gray-700" />
                    <div className="flex justify-between">
                      <span className="text-red-500">P:</span>
                      <span>{last.p.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-green-500">I:</span>
                      <span>{last.i.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-500">D:</span>
                      <span>{last.d.toFixed(2)}</span>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
