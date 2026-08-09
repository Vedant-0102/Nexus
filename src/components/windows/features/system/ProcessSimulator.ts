/**
 * ProcessSimulator - system resources (CPU / RAM / processes), grounded in
 * real browser signals where the sandbox allows:
 *
 *   - cores        -> navigator.hardwareConcurrency        (real)
 *   - total RAM    -> navigator.deviceMemory               (real, browser caps at 8 GB)
 *   - Nexus Runtime process -> performance.memory JS heap  (real, this tab)
 *   - CPU load     -> Compute Pressure API when available,
 *                     else event-loop lag                  (reacts to real load)
 *
 * Per-process CPU/memory for everything else is simulated - the browser cannot
 * see other processes. Exposes a useSyncExternalStore-compatible
 * subscribe/getSnapshot pair, ticking once a second while anyone is subscribed.
 */

export interface SimProcess {
  pid: number;
  name: string;
  type: 'system' | 'app';
  windowId?: string;
  status: 'Running' | 'Suspended';
  cpu: number;        // percent
  memoryMB: number;
  baseMemMB: number;
  phase: number;      // per-process drift phase
  live?: boolean;     // backed by a real measurement
}

export interface RealSignals {
  cores: boolean;
  deviceMemory: boolean;
  heap: boolean;
  pressure: boolean;
}

export interface SystemSnapshot {
  processes: SimProcess[];
  totalMemMB: number;
  usedMemMB: number;
  jsHeapMB: number | null; // real JS heap of this tab, when readable
  cpuPercent: number;
  cpuSpeedGHz: number;
  cores: number;
  uptimeSec: number;
  cpuHistory: number[];
  memHistory: number[]; // percent used
  real: RealSignals;
}

const HISTORY_LEN = 60;
const KERNEL_RESERVED_MB = 1650; // hardware-reserved + paged pool, not shown as a process

const SYSTEM_PROCESSES: Array<{ name: string; baseMemMB: number; cpuMax: number }> = [
  { name: 'System', baseMemMB: 140, cpuMax: 1.5 },
  { name: 'Registry', baseMemMB: 38, cpuMax: 0.3 },
  { name: 'Nexus Shell', baseMemMB: 235, cpuMax: 3 },
  { name: 'Desktop Window Manager', baseMemMB: 96, cpuMax: 4 },
  { name: 'Memory Compression', baseMemMB: 310, cpuMax: 0.8 },
  { name: 'Service Host: Network', baseMemMB: 52, cpuMax: 1 },
  { name: 'Service Host: Local System', baseMemMB: 78, cpuMax: 1.2 },
  { name: 'Service Host: Audio', baseMemMB: 28, cpuMax: 0.8 },
  { name: 'Security Health Service', baseMemMB: 64, cpuMax: 1 },
  { name: 'Search Indexer', baseMemMB: 112, cpuMax: 2 },
  { name: 'Runtime Broker', baseMemMB: 68, cpuMax: 1.5 },
  { name: 'Nexus Update Service', baseMemMB: 46, cpuMax: 0.6 },
];

// Deterministic-ish memory footprint from an app title so the same app always
// "costs" the same RAM.
const hashTitle = (s: string): number => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
};

const appBaseMem = (title: string): number => {
  const t = title.toLowerCase();
  if (t.includes('browser') || t.includes('edge') || t.includes('chrome')) return 860;
  if (t.includes('code') || t.includes('editor')) return 420;
  if (t.includes('terminal')) return 95;
  return 110 + (hashTitle(title) % 320);
};

const rand = (min: number, max: number) => min + Math.random() * (max - min);
const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

/** Read this tab's real JS heap usage in MB (Chromium only). */
const readJsHeapMB = (): number | null => {
  const mem = (performance as unknown as { memory?: { usedJSHeapSize: number } }).memory;
  return mem ? mem.usedJSHeapSize / (1024 * 1024) : null;
};

// Compute Pressure states -> target CPU utilization ranges
const PRESSURE_CPU: Record<string, [number, number]> = {
  nominal: [3, 14],
  fair: [22, 42],
  serious: [50, 75],
  critical: [80, 97],
};

class ProcessSimulator {
  readonly totalMemMB: number;
  readonly cores: number;
  private startTime = Date.now();
  private nextPid = 4128;
  private procs: SimProcess[] = [];
  private listeners = new Set<() => void>();
  private timer: ReturnType<typeof setInterval> | null = null;
  private cpuHistory: number[] = [];
  private memHistory: number[] = [];
  private snapshot: SystemSnapshot;
  private real: RealSignals;
  private jsHeapMB: number | null = null;
  private pressureState: string | null = null;
  private lastTickAt = 0; // for event-loop lag measurement
  private memScale: number;

  constructor() {
    const nav = navigator as unknown as { hardwareConcurrency?: number; deviceMemory?: number };
    this.cores = nav.hardwareConcurrency ?? 8;
    // deviceMemory is in GB; browsers cap it at 8 for privacy
    this.totalMemMB = (nav.deviceMemory ?? 16) * 1024;
    this.jsHeapMB = readJsHeapMB();
    this.real = {
      cores: nav.hardwareConcurrency !== undefined,
      deviceMemory: nav.deviceMemory !== undefined,
      heap: this.jsHeapMB !== null,
      pressure: false,
    };

    // On low-RAM devices, shrink simulated footprints so idle usage stays plausible
    this.memScale = clamp(this.totalMemMB / 16384, 0.45, 1);

    this.procs = SYSTEM_PROCESSES.map(sp => ({
      pid: this.allocPid(sp.name === 'System' ? 4 : undefined),
      name: sp.name,
      type: 'system' as const,
      status: 'Running' as const,
      cpu: rand(0, sp.cpuMax * 0.5),
      memoryMB: sp.baseMemMB * this.memScale * rand(0.92, 1.08),
      baseMemMB: sp.baseMemMB * this.memScale,
      phase: rand(0, Math.PI * 2),
    }));

    // This tab's real runtime, measured from the JS heap when the browser exposes it
    this.procs.push({
      pid: this.allocPid(),
      name: 'Nexus Runtime (this tab)',
      type: 'system',
      status: 'Running',
      cpu: rand(0.5, 2),
      memoryMB: this.jsHeapMB ?? 180,
      baseMemMB: this.jsHeapMB ?? 180,
      phase: rand(0, Math.PI * 2),
      live: this.jsHeapMB !== null,
    });

    // Real CPU pressure (Chromium 125+, secure contexts)
    const PressureObserver = (globalThis as unknown as {
      PressureObserver?: new (cb: (records: Array<{ state: string }>) => void) => {
        observe: (source: string) => Promise<void>;
      };
    }).PressureObserver;
    if (PressureObserver) {
      try {
        const observer = new PressureObserver(records => {
          const last = records[records.length - 1];
          if (last) {
            this.pressureState = last.state;
            this.real.pressure = true;
          }
        });
        observer.observe('cpu').catch(() => {});
      } catch {
        // not available; event-loop lag fallback still applies
      }
    }

    // Prefill history with plausible idle values so graphs aren't empty
    for (let i = 0; i < HISTORY_LEN; i++) {
      this.cpuHistory.push(rand(2, 7));
      this.memHistory.push(this.currentMemPercent());
    }
    this.snapshot = this.buildSnapshot();
  }

  private allocPid(fixed?: number): number {
    if (fixed !== undefined) return fixed;
    this.nextPid += Math.floor(rand(4, 60));
    return this.nextPid;
  }

  /** Register/unregister app processes to match the currently open windows. */
  syncApps(apps: Array<{ windowId: string; title: string; minimized: boolean }>) {
    const seen = new Set<string>();
    let changed = false;

    for (const app of apps) {
      seen.add(app.windowId);
      const existing = this.procs.find(p => p.windowId === app.windowId);
      const status: SimProcess['status'] = app.minimized ? 'Suspended' : 'Running';
      if (existing) {
        if (existing.status !== status) {
          existing.status = status;
          changed = true;
        }
      } else {
        const base = appBaseMem(app.title) * this.memScale;
        this.procs.push({
          pid: this.allocPid(),
          name: app.title,
          type: 'app',
          windowId: app.windowId,
          status,
          cpu: rand(1, 6),
          memoryMB: base * rand(0.9, 1.05),
          baseMemMB: base,
          phase: rand(0, Math.PI * 2),
        });
        changed = true;
      }
    }

    const before = this.procs.length;
    this.procs = this.procs.filter(p => p.type === 'system' || seen.has(p.windowId!));
    if (this.procs.length !== before) changed = true;

    if (changed) {
      this.snapshot = this.buildSnapshot();
      this.emit();
    }
  }

  private currentMemPercent(): number {
    const used =
      this.procs.reduce((s, p) => s + p.memoryMB, 0) + KERNEL_RESERVED_MB * this.memScale;
    return (used / this.totalMemMB) * 100;
  }

  private tick = () => {
    const now = Date.now();
    const t = now / 1000;

    // Event-loop lag: a busy main thread delays this 1s interval. Real signal,
    // works in every browser. 0ms lag = idle; 500ms+ = heavily loaded.
    const lagMs = this.lastTickAt ? Math.max(0, now - this.lastTickAt - 1000) : 0;
    this.lastTickAt = now;
    const lagLoad = clamp((lagMs / 400) * 100, 0, 100);

    // Real JS heap for this tab
    this.jsHeapMB = readJsHeapMB();
    if (this.jsHeapMB !== null) this.real.heap = true;

    for (const p of this.procs) {
      if (p.name === 'Nexus Runtime (this tab)') {
        if (this.jsHeapMB !== null) {
          p.memoryMB = this.jsHeapMB;
          p.live = true;
        }
        // Its CPU tracks real main-thread business
        p.cpu = clamp(p.cpu * 0.5 + (lagLoad * 0.15 + rand(0.3, 1.5)) * 0.5, 0.1, 25);
        continue;
      }
      const suspended = p.status === 'Suspended';
      const cpuMax =
        p.type === 'system'
          ? SYSTEM_PROCESSES.find(sp => sp.name === p.name)?.cpuMax ?? 1.5
          : suspended ? 0.4 : 9;

      // CPU: random walk with occasional spikes for running apps
      const spike = !suspended && p.type === 'app' && Math.random() < 0.04 ? rand(6, 14) : 0;
      p.cpu = clamp(p.cpu + rand(-1.2, 1.2) + spike * 0.3, 0, cpuMax + spike);

      // Memory: slow sinusoidal drift around base, suspended apps get trimmed
      const drift = 1 + Math.sin(t * 0.05 + p.phase) * 0.07 + rand(-0.01, 0.01);
      const target = p.baseMemMB * drift * (suspended ? 0.62 : 1);
      p.memoryMB += (target - p.memoryMB) * 0.15;
    }

    this.cpuHistory.push(this.snapshotCpu(lagLoad));
    this.memHistory.push(this.currentMemPercent());
    if (this.cpuHistory.length > HISTORY_LEN) this.cpuHistory.shift();
    if (this.memHistory.length > HISTORY_LEN) this.memHistory.shift();

    this.snapshot = this.buildSnapshot();
    this.emit();
  };

  private snapshotCpu(lagLoad: number): number {
    const sim = this.procs.reduce((s, p) => s + p.cpu, 0) * 0.55 + rand(0.5, 2);

    // Prefer the real Compute Pressure signal; steer utilization into its range
    const range = this.pressureState ? PRESSURE_CPU[this.pressureState] : undefined;
    if (range) {
      const target = rand(range[0], range[1]);
      return clamp(target * 0.75 + sim * 0.25, 0.5, 100);
    }

    // Otherwise real event-loop lag sets a floor: heavy tabs push the graph up
    return clamp(Math.max(sim, lagLoad * 0.85 + rand(0, 3)), 0.5, 100);
  }

  private buildSnapshot(): SystemSnapshot {
    const cpuPercent = this.cpuHistory[this.cpuHistory.length - 1] ?? 3;
    return {
      processes: [...this.procs].sort((a, b) => b.memoryMB - a.memoryMB),
      totalMemMB: this.totalMemMB,
      usedMemMB:
        this.procs.reduce((s, p) => s + p.memoryMB, 0) + KERNEL_RESERVED_MB * this.memScale,
      jsHeapMB: this.jsHeapMB,
      cpuPercent,
      cpuSpeedGHz: 3.19 + (cpuPercent / 100) * 1.21 + rand(-0.03, 0.03),
      cores: this.cores,
      uptimeSec: Math.floor((Date.now() - this.startTime) / 1000),
      cpuHistory: [...this.cpuHistory],
      memHistory: [...this.memHistory],
      real: { ...this.real },
    };
  }

  private emit() {
    this.listeners.forEach(l => l());
  }

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    if (!this.timer) this.timer = setInterval(this.tick, 1000);
    return () => {
      this.listeners.delete(listener);
      if (this.listeners.size === 0 && this.timer) {
        clearInterval(this.timer);
        this.timer = null;
      }
    };
  };

  getSnapshot = (): SystemSnapshot => this.snapshot;

  /** Called on shutdown/restart so uptime resets with the session. */
  resetUptime() {
    this.startTime = Date.now();
  }
}

export const processSimulator = new ProcessSimulator();
