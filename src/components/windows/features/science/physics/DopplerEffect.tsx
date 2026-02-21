import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Waves, Play, Pause, Info, ChevronRight, Ambulance, Telescope, Radar, HeartPulse, CloudRain, Calculator } from 'lucide-react';

// ── Types ───────────────────────────────────────────────────────────────────────
type TabId = 'visualizer' | 'ambulance' | 'astronomy' | 'radar' | 'ultrasound' | 'weather';

interface WaveCircle {
  x: number;
  y: number;
  radius: number;
  birthTime: number;
}

// ── Constants ───────────────────────────────────────────────────────────────────
const SPEED_OF_SOUND = 343; // m/s
const SPEED_OF_LIGHT = 3e8; // m/s

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: 'visualizer', label: 'Visualizer', icon: <Waves className="h-4 w-4" /> },
  { id: 'ambulance', label: 'Ambulance', icon: <Ambulance className="h-4 w-4" /> },
  { id: 'astronomy', label: 'Astronomy', icon: <Telescope className="h-4 w-4" /> },
  { id: 'radar', label: 'Speed Radar', icon: <Radar className="h-4 w-4" /> },
  { id: 'ultrasound', label: 'Ultrasound', icon: <HeartPulse className="h-4 w-4" /> },
  { id: 'weather', label: 'Weather Radar', icon: <CloudRain className="h-4 w-4" /> },
];

// ── Helper: detect dark mode from canvas parent ─────────────────────────────────
function isDarkBackground(canvas: HTMLCanvasElement): boolean {
  try {
    const bg = getComputedStyle(canvas.parentElement ?? canvas).backgroundColor;
    const match = bg.match(/\d+/g);
    if (match) {
      const [r, g, b] = match.map(Number);
      return (r * 299 + g * 587 + b * 114) / 1000 < 128;
    }
  } catch { /* fallback */ }
  return false;
}

// ── Sub-component: Real-life example card ───────────────────────────────────────
const ExampleCard: React.FC<{
  title: string;
  description: string;
  formula: string;
  formulaLabel: string;
  example: { setup: string; steps: string[]; result: string };
}> = ({ title, description, formula, formulaLabel, example }) => (
  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-5 space-y-4 border border-gray-100 dark:border-gray-700">
    <h3 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h3>

    <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{description}</p>

    {/* Formula */}
    <div className="bg-indigo-50 dark:bg-indigo-900/30 rounded-lg p-4 border border-indigo-100 dark:border-indigo-800">
      <p className="text-xs font-semibold text-indigo-700 dark:text-indigo-300 mb-1 uppercase tracking-wide">{formulaLabel}</p>
      <p className="font-mono text-sm text-indigo-900 dark:text-indigo-200 whitespace-pre-wrap">{formula}</p>
    </div>

    {/* Worked example */}
    <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-4 border border-emerald-100 dark:border-emerald-800">
      <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 mb-2 uppercase tracking-wide flex items-center gap-1">
        <Calculator className="h-3.5 w-3.5" /> Worked Example
      </p>
      <p className="text-sm text-emerald-900 dark:text-emerald-200 font-medium mb-2">{example.setup}</p>
      <ul className="space-y-1">
        {example.steps.map((s, i) => (
          <li key={i} className="text-xs text-emerald-800 dark:text-emerald-300 font-mono flex items-start gap-1">
            <ChevronRight className="h-3.5 w-3.5 mt-0.5 shrink-0" />{s}
          </li>
        ))}
      </ul>
      <p className="mt-2 text-sm font-semibold text-emerald-900 dark:text-emerald-100">{example.result}</p>
    </div>
  </div>
);

// ═════════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═════════════════════════════════════════════════════════════════════════════════
export const DopplerEffect: React.FC = () => {
  // ── State ──────────────────────────────────────────────────────────────────
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const wavesRef = useRef<WaveCircle[]>([]);
  const lastEmitRef = useRef(0);
  const timeRef = useRef(0);

  const [isPlaying, setIsPlaying] = useState(true);
  const [sourceVelocity, setSourceVelocity] = useState(100); // m/s
  const [observerVelocity, setObserverVelocity] = useState(0); // m/s
  const [baseFrequency, setBaseFrequency] = useState(440); // Hz
  const [activeTab, setActiveTab] = useState<TabId>('visualizer');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const resize = () => {
      const r = canvas.getBoundingClientRect();
      const d = window.devicePixelRatio || 1;
      canvas.width = r.width * d;
      canvas.height = r.height * d;
      ctx.scale(d, d);
    };
    resize();
    const obs = new ResizeObserver(resize);
    obs.observe(canvas);
    return () => obs.disconnect();
  }, []);

  // ── Derived values ────────────────────────────────────────────────────────
  const approachFreq = baseFrequency * ((SPEED_OF_SOUND + observerVelocity) / (SPEED_OF_SOUND - sourceVelocity));
  const recedeFreq = baseFrequency * ((SPEED_OF_SOUND - observerVelocity) / (SPEED_OF_SOUND + sourceVelocity));
  const approachWavelength = SPEED_OF_SOUND / approachFreq;
  const recedeWavelength = SPEED_OF_SOUND / recedeFreq;
  const baseWavelength = SPEED_OF_SOUND / baseFrequency;

  // ── Canvas draw loop ──────────────────────────────────────────────────────
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.getBoundingClientRect().width;
    const H = canvas.getBoundingClientRect().height;
    const dark = isDarkBackground(canvas);
    const dt = 0.016; // ~60 fps frame time

    timeRef.current += dt;
    const t = timeRef.current;

    // Emit a new wave every 1/frequency seconds (scaled for visual)
    const emitInterval = 0.12;
    if (t - lastEmitRef.current >= emitInterval) {
      const sourceXNorm = 0.3 + 0.15 * Math.sin(t * 0.5); // source oscillates
      wavesRef.current.push({
        x: W * sourceXNorm,
        y: H / 2,
        radius: 0,
        birthTime: t,
      });
      lastEmitRef.current = t;
      // Keep only recent waves
      if (wavesRef.current.length > 40) wavesRef.current.shift();
    }

    // ── Clear ──
    if (dark) {
      const gBg = ctx.createLinearGradient(0, 0, W, H);
      gBg.addColorStop(0, '#1a1a2e');
      gBg.addColorStop(1, '#16213e');
      ctx.fillStyle = gBg;
    } else {
      const gBg = ctx.createLinearGradient(0, 0, W, H);
      gBg.addColorStop(0, '#f0f9ff');
      gBg.addColorStop(1, '#e0f2fe');
      ctx.fillStyle = gBg;
    }
    ctx.fillRect(0, 0, W, H);

    // ── Grid lines ──
    ctx.strokeStyle = dark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)';
    ctx.lineWidth = 1;
    for (let gx = 0; gx < W; gx += 40) {
      ctx.beginPath();
      ctx.moveTo(gx, 0);
      ctx.lineTo(gx, H);
      ctx.stroke();
    }
    for (let gy = 0; gy < H; gy += 40) {
      ctx.beginPath();
      ctx.moveTo(0, gy);
      ctx.lineTo(W, gy);
      ctx.stroke();
    }

    // ── Draw wave circles ──
    const vRatio = sourceVelocity / SPEED_OF_SOUND;
    wavesRef.current.forEach((w) => {
      const age = t - w.birthTime;
      const r = age * 180; // expansion speed (visual)
      w.radius = r;
      // Source motion shifts circle centres
      const shiftX = vRatio * age * 180;
      const cx = w.x + shiftX;
      const alpha = Math.max(0, 1 - age / 3);
      if (alpha <= 0) return;

      // Color waves: blue (compressed in front) / red (stretched behind)
      const gRad = ctx.createRadialGradient(cx, w.y, 0, cx, w.y, r);
      if (dark) {
        gRad.addColorStop(0, `rgba(96,165,250,${alpha * 0.05})`);
        gRad.addColorStop(1, `rgba(96,165,250,0)`);
      } else {
        gRad.addColorStop(0, `rgba(59,130,246,${alpha * 0.05})`);
        gRad.addColorStop(1, `rgba(59,130,246,0)`);
      }
      ctx.fillStyle = gRad;
      ctx.beginPath();
      ctx.arc(cx, w.y, r, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = dark
        ? `rgba(96,165,250,${alpha * 0.6})`
        : `rgba(37,99,235,${alpha * 0.5})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(cx, w.y, r, 0, Math.PI * 2);
      ctx.stroke();
    });

    // ── Source position (oscillating for visual clarity) ──
    const sourceX = W * (0.3 + 0.15 * Math.sin(t * 0.5));
    const centerY = H / 2;

    // ── Direction of motion arrow ──
    const arrowLen = 60 + vRatio * 40;
    const arrowY = centerY - 45;
    ctx.save();
    ctx.strokeStyle = dark ? '#f87171' : '#dc2626';
    ctx.fillStyle = dark ? '#f87171' : '#dc2626';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(sourceX, arrowY);
    ctx.lineTo(sourceX + arrowLen, arrowY);
    ctx.stroke();
    // arrowhead
    ctx.beginPath();
    ctx.moveTo(sourceX + arrowLen, arrowY);
    ctx.lineTo(sourceX + arrowLen - 10, arrowY - 6);
    ctx.lineTo(sourceX + arrowLen - 10, arrowY + 6);
    ctx.closePath();
    ctx.fill();
    // label
    ctx.font = 'bold 11px Inter, system-ui, sans-serif';
    ctx.fillStyle = dark ? '#fca5a5' : '#b91c1c';
    ctx.textAlign = 'center';
    ctx.fillText(`v = ${sourceVelocity} m/s`, sourceX + arrowLen / 2, arrowY - 10);
    ctx.restore();

    // ── Draw source ──
    ctx.save();
    const srcGrad = ctx.createRadialGradient(sourceX, centerY, 0, sourceX, centerY, 18);
    srcGrad.addColorStop(0, '#f87171');
    srcGrad.addColorStop(1, '#dc2626');
    ctx.fillStyle = srcGrad;
    ctx.shadowColor = 'rgba(239,68,68,0.5)';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(sourceX, centerY, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 9px Inter, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('S', sourceX, centerY);
    ctx.restore();

    // ── Draw observer ──
    const obsX = W * 0.78 + observerVelocity * 0.15 * Math.sin(t * 0.3);
    ctx.save();
    const obsGrad = ctx.createRadialGradient(obsX, centerY, 0, obsX, centerY, 18);
    obsGrad.addColorStop(0, '#34d399');
    obsGrad.addColorStop(1, '#059669');
    ctx.fillStyle = obsGrad;
    ctx.shadowColor = 'rgba(16,185,129,0.5)';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(obsX, centerY, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 9px Inter, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('O', obsX, centerY);
    ctx.restore();

    // ── Observer labels ──
    ctx.font = '11px Inter, system-ui, sans-serif';
    ctx.fillStyle = dark ? '#d1d5db' : '#374151';
    ctx.textAlign = 'center';
    ctx.fillText('Source', sourceX, centerY + 28);
    ctx.fillText('Observer', obsX, centerY + 28);

    // Observer velocity arrow (if moving)
    if (observerVelocity !== 0) {
      const oArrowDir = observerVelocity > 0 ? 1 : -1;
      const oArrowLen = Math.abs(observerVelocity) * 0.4 + 20;
      ctx.save();
      ctx.strokeStyle = dark ? '#34d399' : '#059669';
      ctx.fillStyle = dark ? '#34d399' : '#059669';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(obsX, arrowY);
      ctx.lineTo(obsX + oArrowLen * oArrowDir, arrowY);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(obsX + oArrowLen * oArrowDir, arrowY);
      ctx.lineTo(obsX + oArrowLen * oArrowDir - 8 * oArrowDir, arrowY - 5);
      ctx.lineTo(obsX + oArrowLen * oArrowDir - 8 * oArrowDir, arrowY + 5);
      ctx.closePath();
      ctx.fill();
      ctx.font = 'bold 10px Inter, system-ui, sans-serif';
      ctx.fillStyle = dark ? '#6ee7b7' : '#047857';
      ctx.textAlign = 'center';
      ctx.fillText(`v = ${observerVelocity} m/s`, obsX + (oArrowLen * oArrowDir) / 2, arrowY - 10);
      ctx.restore();
    }

    // ── Compressed / Stretched labels ──
    ctx.save();
    ctx.font = 'bold 12px Inter, system-ui, sans-serif';
    // Compressed (in front of source)
    ctx.fillStyle = dark ? '#93c5fd' : '#1d4ed8';
    ctx.textAlign = 'center';
    ctx.fillText('Compressed (higher f)', sourceX + (obsX - sourceX) / 2, H - 28);
    ctx.fillText(`f = ${approachFreq.toFixed(1)} Hz`, sourceX + (obsX - sourceX) / 2, H - 12);
    // Stretched (behind source)
    ctx.fillStyle = dark ? '#fca5a5' : '#b91c1c';
    ctx.fillText('Stretched (lower f)', sourceX / 2, H - 28);
    ctx.fillText(`f = ${recedeFreq.toFixed(1)} Hz`, sourceX / 2, H - 12);
    ctx.restore();

    // ── Continue loop ──
    if (isPlaying) {
      animFrameRef.current = requestAnimationFrame(draw);
    }
  }, [isPlaying, sourceVelocity, observerVelocity, baseFrequency, approachFreq, recedeFreq]);

  useEffect(() => {
    if (isPlaying) {
      animFrameRef.current = requestAnimationFrame(draw);
    }
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isPlaying, draw]);

  // Reset animation
  const handleReset = () => {
    timeRef.current = 0;
    lastEmitRef.current = 0;
    wavesRef.current = [];
  };

  // ── Real-life example tab renderers ───────────────────────────────────────
  const renderAmbulance = () => (
    <ExampleCard
      title="Ambulance Siren - Classic Doppler Example"
      description={
        "When an ambulance approaches you, the sound waves in front of it are compressed together " +
        "because the ambulance is 'chasing' its own sound waves. This means the wavelength shortens " +
        "and the frequency rises, producing a higher-pitched siren. As the ambulance passes and " +
        "moves away, the waves behind it are stretched apart. The wavelength increases, the frequency " +
        "drops, and you hear the characteristic drop in pitch. This is why a siren seems to suddenly " +
        "change its tone right as the ambulance passes you."
      }
      formulaLabel="Doppler formula for sound"
      formula={
        "f_observed = f_source x (v_sound +/- v_observer) / (v_sound -/+ v_source)\n\n" +
        "Approaching:  f_obs = f_s x (v + v_o) / (v - v_s)\n" +
        "Receding:     f_obs = f_s x (v - v_o) / (v + v_s)"
      }
      example={{
        setup: "An ambulance siren emits at 700 Hz and travels at 30 m/s toward a stationary observer. Speed of sound = 343 m/s.",
        steps: [
          "f_approach = 700 x (343 + 0) / (343 - 30)",
          "f_approach = 700 x 343 / 313",
          "f_approach = 700 x 1.0959",
          "f_approach = 767.1 Hz",
          "",
          "f_recede = 700 x (343 + 0) / (343 + 30)",
          "f_recede = 700 x 343 / 373",
          "f_recede = 700 x 0.9195",
          "f_recede = 643.7 Hz",
        ],
        result: "The observer hears 767 Hz (approaching) dropping to 644 Hz (receding) -- a shift of 123 Hz.",
      }}
    />
  );

  const renderAstronomy = () => (
    <ExampleCard
      title="Redshift and Blueshift in Astronomy"
      description={
        "In astronomy, light from distant galaxies is shifted toward the red end of the spectrum (redshift) " +
        "if the galaxy is moving away from us, and toward the blue end (blueshift) if it is approaching. " +
        "Edwin Hubble discovered that virtually all distant galaxies show redshift, which led to the " +
        "conclusion that the universe is expanding. The amount of redshift directly tells astronomers " +
        "how fast a galaxy is receding. This is the same Doppler principle, but applied to electromagnetic " +
        "waves instead of sound waves. For very high velocities, the relativistic Doppler formula is used."
      }
      formulaLabel="Relativistic Doppler (light)"
      formula={
        "z = (lambda_obs - lambda_emit) / lambda_emit\n\n" +
        "For non-relativistic speeds:\n" +
        "z ~ v / c\n\n" +
        "Relativistic:\n" +
        "f_obs = f_s x sqrt( (1 - v/c) / (1 + v/c) )  [receding]\n" +
        "f_obs = f_s x sqrt( (1 + v/c) / (1 - v/c) )  [approaching]"
      }
      example={{
        setup: "A galaxy has a hydrogen-alpha line observed at 665.2 nm instead of the emitted 656.3 nm. Find its recession velocity.",
        steps: [
          "z = (665.2 - 656.3) / 656.3 = 8.9 / 656.3",
          "z = 0.01356",
          "v = z x c = 0.01356 x 3 x 10^8 m/s",
          "v = 4.07 x 10^6 m/s",
          "v ~ 4,070 km/s",
        ],
        result: "The galaxy is receding at approximately 4,070 km/s (~1.36% the speed of light).",
      }}
    />
  );

  const renderRadar = () => (
    <ExampleCard
      title="Police Radar / Speed Guns"
      description={
        "Police radar guns emit a microwave beam at a known frequency toward a moving vehicle. The beam " +
        "reflects off the vehicle and returns to the gun. Because the vehicle is moving, the reflected " +
        "signal has a slightly different frequency. The radar gun measures this frequency difference " +
        "(the Doppler shift) and calculates the speed of the vehicle. Since the wave travels to the car " +
        "AND back, the effective Doppler shift is doubled. Radar guns typically operate at 24.150 GHz " +
        "(K-band) or 34.700 GHz (Ka-band)."
      }
      formulaLabel="Radar Doppler formula (round-trip)"
      formula={
        "delta_f = 2 x f_transmitted x v_target / c\n\n" +
        "v_target = (delta_f x c) / (2 x f_transmitted)\n\n" +
        "where c = speed of light = 3 x 10^8 m/s"
      }
      example={{
        setup: "A K-band radar gun (24.150 GHz) measures a frequency shift of 3,614 Hz from an approaching car.",
        steps: [
          "v = (delta_f x c) / (2 x f)",
          "v = (3614 x 3 x 10^8) / (2 x 24.150 x 10^9)",
          "v = 1.0842 x 10^12 / 4.83 x 10^10",
          "v = 22.45 m/s",
          "v = 22.45 x 3.6 = 80.8 km/h",
        ],
        result: "The car is traveling at approximately 80.8 km/h (50.2 mph).",
      }}
    />
  );

  const renderUltrasound = () => (
    <ExampleCard
      title="Medical Doppler Ultrasound"
      description={
        "In medicine, Doppler ultrasound is used to measure blood flow velocity and direction. A transducer " +
        "emits ultrasound waves (2-10 MHz) into the body. When these waves encounter moving red blood cells, " +
        "they are reflected back with a frequency shift proportional to the blood flow speed. If blood flows " +
        "toward the transducer, the reflected frequency increases (displayed as red on color Doppler). If blood " +
        "flows away, the frequency decreases (displayed as blue). This is crucial for detecting arterial " +
        "blockages, heart valve problems, deep vein thrombosis, and monitoring fetal blood circulation."
      }
      formulaLabel="Doppler ultrasound formula"
      formula={
        "delta_f = (2 x f_0 x v_blood x cos(theta)) / c_tissue\n\n" +
        "v_blood = (delta_f x c_tissue) / (2 x f_0 x cos(theta))\n\n" +
        "c_tissue ~ 1,540 m/s (speed of sound in soft tissue)\n" +
        "theta = angle between beam and flow direction"
      }
      example={{
        setup: "A 5 MHz transducer detects a 2,500 Hz frequency shift. The beam angle to the blood vessel is 60 degrees.",
        steps: [
          "v = (delta_f x c) / (2 x f_0 x cos(theta))",
          "v = (2500 x 1540) / (2 x 5 x 10^6 x cos(60 deg))",
          "cos(60 deg) = 0.5",
          "v = 3,850,000 / (2 x 5,000,000 x 0.5)",
          "v = 3,850,000 / 5,000,000",
          "v = 0.77 m/s = 77 cm/s",
        ],
        result: "Blood velocity is approximately 77 cm/s, consistent with normal peak systolic flow in a large artery.",
      }}
    />
  );

  const renderWeather = () => (
    <ExampleCard
      title="Doppler Weather Radar"
      description={
        "Doppler weather radar works by sending out pulses of microwave energy and measuring the frequency " +
        "shift of the returned signal reflected by raindrops, hail, and other precipitation. By measuring " +
        "the Doppler shift, meteorologists can determine whether precipitation is moving toward or away from " +
        "the radar station and at what speed. This is essential for detecting rotation in thunderstorms " +
        "(mesocyclones that spawn tornadoes), wind shear near airports, tracking hurricane structure, and " +
        "estimating rainfall rates. The WSR-88D (NEXRAD) systems used in the US operate at S-band (~2.7 GHz)."
      }
      formulaLabel="Weather radar Doppler formula"
      formula={
        "v_radial = (delta_f x lambda) / 2\n\n" +
        "lambda = c / f_radar\n\n" +
        "Maximum unambiguous velocity:\n" +
        "v_max = lambda / (4 x PRT)\n" +
        "where PRT = pulse repetition time"
      }
      example={{
        setup: "A NEXRAD radar (2.7 GHz, wavelength ~11.1 cm) detects a frequency shift of 540 Hz from storm precipitation.",
        steps: [
          "lambda = c / f = 3 x 10^8 / 2.7 x 10^9 = 0.111 m",
          "v_radial = (delta_f x lambda) / 2",
          "v_radial = (540 x 0.111) / 2",
          "v_radial = 59.94 / 2",
          "v_radial = 29.97 m/s",
          "v_radial ~ 30 m/s = 108 km/h",
        ],
        result: "The precipitation (and wind driving it) is moving at ~108 km/h toward or away from the radar, indicating severe wind speeds.",
      }}
    />
  );

  // ── Formulas panel (live values) ──────────────────────────────────────────
  const renderFormulasPanel = () => (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-5 space-y-4 border border-gray-100 dark:border-gray-700">
      <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
        <Calculator className="h-5 w-5 text-purple-500" />
        Live Doppler Calculation
      </h3>

      {/* General formula */}
      <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border border-purple-100 dark:border-purple-800">
        <p className="text-xs font-semibold text-purple-700 dark:text-purple-300 mb-1 uppercase tracking-wide">General Formula</p>
        <p className="font-mono text-sm text-purple-900 dark:text-purple-200">
          f_obs = f_s x (v + v_o) / (v - v_s)
        </p>
      </div>

      {/* Approaching */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-100 dark:border-blue-800">
        <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 mb-2">Approaching (source toward observer)</p>
        <p className="font-mono text-xs text-blue-800 dark:text-blue-200 leading-relaxed">
          f = {baseFrequency} x ({SPEED_OF_SOUND} + {observerVelocity}) / ({SPEED_OF_SOUND} - {sourceVelocity})
        </p>
        <p className="font-mono text-xs text-blue-800 dark:text-blue-200">
          f = {baseFrequency} x {(SPEED_OF_SOUND + observerVelocity).toFixed(0)} / {(SPEED_OF_SOUND - sourceVelocity).toFixed(0)}
        </p>
        <p className="font-mono text-sm font-bold text-blue-900 dark:text-blue-100 mt-1">
          f = {approachFreq.toFixed(2)} Hz
        </p>
        <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
          Wavelength: {approachWavelength.toFixed(4)} m (vs {baseWavelength.toFixed(4)} m at rest)
        </p>
      </div>

      {/* Receding */}
      <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3 border border-red-100 dark:border-red-800">
        <p className="text-xs font-semibold text-red-700 dark:text-red-300 mb-2">Receding (source away from observer)</p>
        <p className="font-mono text-xs text-red-800 dark:text-red-200 leading-relaxed">
          f = {baseFrequency} x ({SPEED_OF_SOUND} - {observerVelocity}) / ({SPEED_OF_SOUND} + {sourceVelocity})
        </p>
        <p className="font-mono text-xs text-red-800 dark:text-red-200">
          f = {baseFrequency} x {(SPEED_OF_SOUND - observerVelocity).toFixed(0)} / {(SPEED_OF_SOUND + sourceVelocity).toFixed(0)}
        </p>
        <p className="font-mono text-sm font-bold text-red-900 dark:text-red-100 mt-1">
          f = {recedeFreq.toFixed(2)} Hz
        </p>
        <p className="text-xs text-red-600 dark:text-red-400 mt-1">
          Wavelength: {recedeWavelength.toFixed(4)} m (vs {baseWavelength.toFixed(4)} m at rest)
        </p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3 text-center">
        <div className="bg-blue-100 dark:bg-blue-900/30 rounded-lg p-3">
          <p className="text-xs text-blue-600 dark:text-blue-400">Approach Shift</p>
          <p className="text-lg font-bold text-blue-800 dark:text-blue-200">
            +{((approachFreq - baseFrequency) / baseFrequency * 100).toFixed(1)}%
          </p>
        </div>
        <div className="bg-red-100 dark:bg-red-900/30 rounded-lg p-3">
          <p className="text-xs text-red-600 dark:text-red-400">Recede Shift</p>
          <p className="text-lg font-bold text-red-800 dark:text-red-200">
            {((recedeFreq - baseFrequency) / baseFrequency * 100).toFixed(1)}%
          </p>
        </div>
      </div>
    </div>
  );

  // ── Controls panel ────────────────────────────────────────────────────────
  const renderControls = () => (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-5 space-y-5 border border-gray-100 dark:border-gray-700">
      <h3 className="font-bold text-gray-900 dark:text-white">Controls</h3>

      {/* Base frequency */}
      <div>
        <div className="flex justify-between items-center mb-1">
          <label className="text-sm text-gray-600 dark:text-gray-300">Base Frequency</label>
          <span className="text-sm font-mono font-semibold text-gray-800 dark:text-gray-200">{baseFrequency} Hz</span>
        </div>
        <input
          type="range" min="100" max="1000" step="10"
          value={baseFrequency}
          onChange={e => setBaseFrequency(Number(e.target.value))}
          className="w-full accent-blue-600"
        />
        <div className="flex justify-between text-xs text-gray-400 dark:text-gray-500">
          <span>100 Hz</span><span>1000 Hz</span>
        </div>
      </div>

      {/* Source velocity */}
      <div>
        <div className="flex justify-between items-center mb-1">
          <label className="text-sm text-gray-600 dark:text-gray-300">Source Velocity</label>
          <span className="text-sm font-mono font-semibold text-red-600 dark:text-red-400">{sourceVelocity} m/s</span>
        </div>
        <input
          type="range" min="0" max="330" step="5"
          value={sourceVelocity}
          onChange={e => setSourceVelocity(Number(e.target.value))}
          className="w-full accent-red-500"
        />
        <div className="flex justify-between text-xs text-gray-400 dark:text-gray-500">
          <span>0 m/s</span><span>Mach ~1</span>
        </div>
        {sourceVelocity >= SPEED_OF_SOUND && (
          <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 font-medium">
            Warning: Source at or above the speed of sound produces a sonic boom (Mach {(sourceVelocity / SPEED_OF_SOUND).toFixed(2)}).
          </p>
        )}
      </div>

      {/* Observer velocity */}
      <div>
        <div className="flex justify-between items-center mb-1">
          <label className="text-sm text-gray-600 dark:text-gray-300">Observer Velocity</label>
          <span className="text-sm font-mono font-semibold text-emerald-600 dark:text-emerald-400">{observerVelocity} m/s</span>
        </div>
        <input
          type="range" min="-100" max="100" step="5"
          value={observerVelocity}
          onChange={e => setObserverVelocity(Number(e.target.value))}
          className="w-full accent-emerald-500"
        />
        <div className="flex justify-between text-xs text-gray-400 dark:text-gray-500">
          <span>-100 (away)</span><span>+100 (toward)</span>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 italic">
          Positive = moving toward source, Negative = moving away
        </p>
      </div>

      {/* Playback buttons */}
      <div className="flex gap-3">
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center justify-center gap-2 transition-colors font-medium text-sm"
        >
          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          {isPlaying ? 'Pause' : 'Play'}
        </button>
        <button
          onClick={handleReset}
          className="px-4 py-2.5 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg transition-colors font-medium text-sm"
        >
          Reset
        </button>
      </div>
    </div>
  );

  // ── Educational panel ─────────────────────────────────────────────────────
  const renderEducation = () => (
    <div className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 rounded-xl p-5 border border-indigo-100 dark:border-indigo-800">
      <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-3">
        <Info className="h-5 w-5 text-indigo-500" />
        Understanding the Doppler Effect
      </h3>
      <div className="space-y-3 text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
        <p>
          The <strong className="text-gray-900 dark:text-white">Doppler Effect</strong> is the change in frequency
          (or wavelength) of a wave as perceived by an observer moving relative to the wave source. Named after
          Austrian physicist <strong className="text-gray-900 dark:text-white">Christian Doppler</strong> (1842).
        </p>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-blue-100/60 dark:bg-blue-800/30 rounded-lg p-3">
            <p className="font-semibold text-blue-800 dark:text-blue-300 text-xs mb-1">Approaching Source</p>
            <p className="text-xs text-blue-700 dark:text-blue-400">
              Wavelength shortens, frequency increases. Sound gets higher-pitched. Light shifts to blue end.
            </p>
          </div>
          <div className="bg-red-100/60 dark:bg-red-800/30 rounded-lg p-3">
            <p className="font-semibold text-red-800 dark:text-red-300 text-xs mb-1">Receding Source</p>
            <p className="text-xs text-red-700 dark:text-red-400">
              Wavelength lengthens, frequency decreases. Sound gets lower-pitched. Light shifts to red end.
            </p>
          </div>
        </div>
        <div className="bg-white/60 dark:bg-gray-800/60 rounded-lg p-3">
          <p className="font-semibold text-gray-800 dark:text-gray-200 text-xs mb-2">Key Points</p>
          <ul className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
            <li className="flex items-start gap-1.5"><span className="text-indigo-500 font-bold mt-0.5">1.</span> The effect applies to all types of waves: sound, light, water, and radio.</li>
            <li className="flex items-start gap-1.5"><span className="text-indigo-500 font-bold mt-0.5">2.</span> Only the relative velocity between source and observer matters.</li>
            <li className="flex items-start gap-1.5"><span className="text-indigo-500 font-bold mt-0.5">3.</span> At the speed of sound, the source catches up to its own waves, creating a sonic boom.</li>
            <li className="flex items-start gap-1.5"><span className="text-indigo-500 font-bold mt-0.5">4.</span> For light, the relativistic Doppler formula must be used at high speeds.</li>
            <li className="flex items-start gap-1.5"><span className="text-indigo-500 font-bold mt-0.5">5.</span> It is the basis for technologies like radar, medical ultrasound, and astronomical spectroscopy.</li>
          </ul>
        </div>
      </div>
    </div>
  );

  // ═════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═════════════════════════════════════════════════════════════════════════
  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-gray-900 dark:to-gray-800 overflow-hidden">
      {/* Header */}
      <div className="px-6 pt-5 pb-3 flex items-center gap-3 shrink-0">
        <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-lg">
          <Waves className="h-6 w-6 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Doppler Effect Visualizer</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Explore frequency shifts with interactive controls and real-world examples</p>
        </div>
      </div>

      {/* Tab bar */}
      <div className="px-6 shrink-0">
        <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25'
                  : 'bg-white/60 dark:bg-gray-800/60 text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {activeTab === 'visualizer' ? (
          <div className="flex flex-col lg:flex-row gap-5">
            {/* Left column: canvas + education */}
            <div className="flex-1 space-y-5 min-w-0">
              {/* Canvas */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
                <canvas
                  ref={canvasRef}
                  width={800}
                  height={340}
                  className="w-full"
                  style={{ display: 'block' }}
                />
              </div>

              {/* Formulas (live) */}
              {renderFormulasPanel()}

              {/* Educational content */}
              {renderEducation()}
            </div>

            {/* Right column: controls */}
            <div className="w-full lg:w-80 shrink-0 space-y-5">
              {renderControls()}

              {/* Quick frequency readout */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-5 border border-gray-100 dark:border-gray-700">
                <h3 className="font-bold text-gray-900 dark:text-white mb-3">Frequency Summary</h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Emitted</span>
                    <span className="font-mono font-semibold text-gray-800 dark:text-gray-200">{baseFrequency} Hz</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-blue-600 dark:text-blue-400">Approaching</span>
                    <span className="font-mono font-semibold text-blue-700 dark:text-blue-300">
                      {sourceVelocity < SPEED_OF_SOUND ? `${approachFreq.toFixed(1)} Hz` : 'Undefined (sonic boom)'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-red-600 dark:text-red-400">Receding</span>
                    <span className="font-mono font-semibold text-red-700 dark:text-red-300">{recedeFreq.toFixed(1)} Hz</span>
                  </div>
                  <hr className="border-gray-200 dark:border-gray-700" />
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Total Shift Range</span>
                    <span className="font-mono font-semibold text-gray-800 dark:text-gray-200">
                      {sourceVelocity < SPEED_OF_SOUND
                        ? `${(approachFreq - recedeFreq).toFixed(1)} Hz`
                        : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Mach Number</span>
                    <span className="font-mono font-semibold text-gray-800 dark:text-gray-200">
                      {(sourceVelocity / SPEED_OF_SOUND).toFixed(3)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Real-life example tabs */
          <div className="max-w-3xl mx-auto space-y-5">
            {activeTab === 'ambulance' && renderAmbulance()}
            {activeTab === 'astronomy' && renderAstronomy()}
            {activeTab === 'radar' && renderRadar()}
            {activeTab === 'ultrasound' && renderUltrasound()}
            {activeTab === 'weather' && renderWeather()}

            {/* Back to visualizer prompt */}
            <button
              onClick={() => setActiveTab('visualizer')}
              className="w-full py-3 rounded-xl text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors border border-blue-200 dark:border-blue-800 flex items-center justify-center gap-2"
            >
              <Waves className="h-4 w-4" />
              Open Interactive Visualizer
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
