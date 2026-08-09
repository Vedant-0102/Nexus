import React, { useState, useEffect, useSyncExternalStore } from 'react';
import { useWindows } from '../../context/WindowsContext';
import { processSimulator, SimProcess } from './ProcessSimulator';
import { Cpu, MemoryStick, X, Activity, ListTree } from 'lucide-react';

const fmtMem = (mb: number): string =>
  mb >= 1024 ? `${(mb / 1024).toFixed(1)} GB` : `${Math.round(mb)} MB`;

const fmtUptime = (sec: number): string => {
  const d = Math.floor(sec / 86400);
  const h = Math.floor((sec % 86400) / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return `${d}:${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

/** Win11-style heat shading: stronger usage = warmer cell background. */
const heat = (percent: number): React.CSSProperties => ({
  backgroundColor: `rgba(255, 170, 40, ${Math.min(percent / 100, 1) * 0.45})`,
});

/** Green pulsing dot marking a value backed by a real browser measurement. */
const LiveDot: React.FC<{ title: string }> = ({ title }) => (
  <span
    title={title}
    className="inline-block w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse align-middle"
  />
);

const Sparkline: React.FC<{ data: number[]; color: string; max?: number }> = ({ data, color, max = 100 }) => {
  const W = 100;
  const H = 32;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * W},${H - (Math.min(v, max) / max) * H}`);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="w-full h-full">
      <polygon points={`0,${H} ${pts.join(' ')} ${W},${H}`} fill={color} opacity={0.18} />
      <polyline points={pts.join(' ')} fill="none" stroke={color} strokeWidth={1.2} vectorEffect="non-scaling-stroke" />
    </svg>
  );
};

export const TaskManager: React.FC = () => {
  const { windows, closeWindow } = useWindows();
  const [tab, setTab] = useState<'processes' | 'performance'>('processes');

  const stats = useSyncExternalStore(processSimulator.subscribe, processSimulator.getSnapshot);

  // Keep the simulator's app process list in sync with open windows
  useEffect(() => {
    processSimulator.syncApps(
      windows
        .filter(w => w.isOpen)
        .map(w => ({ windowId: w.id, title: w.title, minimized: !!w.isMinimized }))
    );
  }, [windows]);

  const apps = stats.processes.filter(p => p.type === 'app');
  const background = stats.processes.filter(p => p.type === 'system');
  const memPercent = (stats.usedMemMB / stats.totalMemMB) * 100;

  const endTask = (p: SimProcess) => {
    if (p.windowId) closeWindow(p.windowId);
  };

  const row = (p: SimProcess) => (
    <tr key={p.pid} className="hover:bg-gray-100/70 dark:hover:bg-gray-800/70 group">
      <td className="px-3 py-1.5 whitespace-nowrap max-w-[220px] overflow-hidden text-ellipsis">
        {p.name}
        {p.live && (
          <span className="ml-2">
            <LiveDot title="Real measurement: this tab's actual JS heap" />
          </span>
        )}
        {p.status === 'Suspended' && (
          <span className="ml-2 text-xs text-green-600 dark:text-green-400">(suspended)</span>
        )}
      </td>
      <td className="px-3 py-1.5 text-right tabular-nums text-gray-500 dark:text-gray-400">{p.pid}</td>
      <td className="px-3 py-1.5 text-right tabular-nums" style={heat(p.cpu * 4)}>
        {p.cpu.toFixed(1)}%
      </td>
      <td className="px-3 py-1.5 text-right tabular-nums" style={heat((p.memoryMB / stats.totalMemMB) * 400)}>
        {fmtMem(p.memoryMB)}
      </td>
      <td className="px-2 py-1.5 text-right w-24">
        {p.type === 'app' ? (
          <button
            onClick={() => endTask(p)}
            className="invisible group-hover:visible inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs bg-red-500 text-white hover:bg-red-600"
          >
            <X size={11} /> End task
          </button>
        ) : (
          <span className="text-xs text-gray-400 dark:text-gray-600 invisible group-hover:visible">protected</span>
        )}
      </td>
    </tr>
  );

  return (
    <div className="h-full flex flex-col text-sm text-gray-900 dark:text-gray-100">
      {/* Header stats */}
      <div className="flex items-center gap-4 px-4 pt-3 pb-2 shrink-0">
        <h2 className="text-lg font-semibold mr-auto">Task Manager</h2>
        <div className="flex items-center gap-2" title="CPU utilization">
          <Cpu size={15} className="text-sky-500" />
          <span className="tabular-nums w-12 text-right">{stats.cpuPercent.toFixed(0)}%</span>
        </div>
        <div className="flex items-center gap-2" title="Memory in use">
          <MemoryStick size={15} className="text-violet-500" />
          <span className="tabular-nums">
            {fmtMem(stats.usedMemMB)} / {fmtMem(stats.totalMemMB)}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 px-4 pb-2 shrink-0">
        {([['processes', 'Processes', ListTree], ['performance', 'Performance', Activity]] as const).map(
          ([id, label, Icon]) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors ${
                tab === id
                  ? 'bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300 font-medium'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400'
              }`}
            >
              <Icon size={14} /> {label}
            </button>
          )
        )}
      </div>

      {tab === 'processes' && (
        <div className="flex-1 overflow-auto px-4 pb-4 min-h-0">
          <table className="min-w-full text-sm">
            <thead className="sticky top-0 bg-white dark:bg-gray-900 z-10">
              <tr className="text-xs text-gray-500 dark:text-gray-400 border-b dark:border-gray-700">
                <th className="px-3 py-2 text-left font-medium">Name</th>
                <th className="px-3 py-2 text-right font-medium">PID</th>
                <th className="px-3 py-2 text-right font-medium">CPU</th>
                <th className="px-3 py-2 text-right font-medium">Memory</th>
                <th className="px-2 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              <tr>
                <td colSpan={5} className="px-3 pt-3 pb-1 text-xs font-semibold text-gray-500 dark:text-gray-400">
                  Apps ({apps.length})
                </td>
              </tr>
              {apps.length > 0 ? (
                apps.map(row)
              ) : (
                <tr>
                  <td colSpan={5} className="px-3 py-2 text-gray-400 dark:text-gray-500">
                    No apps running
                  </td>
                </tr>
              )}
              <tr>
                <td colSpan={5} className="px-3 pt-4 pb-1 text-xs font-semibold text-gray-500 dark:text-gray-400">
                  Background processes ({background.length})
                </td>
              </tr>
              {background.map(row)}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'performance' && (
        <div className="flex-1 overflow-auto px-4 pb-4 min-h-0 space-y-4">
          {/* CPU panel */}
          <div className="rounded-lg border dark:border-gray-700 p-4 bg-white/60 dark:bg-gray-800/60">
            <div className="flex items-baseline justify-between mb-2">
              <h3 className="font-semibold flex items-center gap-2">
                <Cpu size={16} className="text-sky-500" /> CPU
                {stats.real.pressure && (
                  <LiveDot title="Backed by the real Compute Pressure API — reflects your actual CPU load" />
                )}
              </h3>
              <span className="text-2xl font-semibold tabular-nums text-sky-600 dark:text-sky-400">
                {stats.cpuPercent.toFixed(0)}%
              </span>
            </div>
            <div className="h-24 rounded border border-sky-200 dark:border-sky-900 bg-sky-50/50 dark:bg-sky-950/30">
              <Sparkline data={stats.cpuHistory} color="#0ea5e9" />
            </div>
            <div className="grid grid-cols-3 gap-2 mt-3 text-xs text-gray-600 dark:text-gray-400">
              <div>
                <div className="text-gray-400 dark:text-gray-500">Speed</div>
                <div className="text-sm text-gray-900 dark:text-gray-100 tabular-nums">
                  {stats.cpuSpeedGHz.toFixed(2)} GHz
                </div>
              </div>
              <div>
                <div className="text-gray-400 dark:text-gray-500 flex items-center gap-1">
                  Cores {stats.real.cores && <LiveDot title="Your machine's real logical core count" />}
                </div>
                <div className="text-sm text-gray-900 dark:text-gray-100">{stats.cores}</div>
              </div>
              <div>
                <div className="text-gray-400 dark:text-gray-500">Uptime</div>
                <div className="text-sm text-gray-900 dark:text-gray-100 tabular-nums">
                  {fmtUptime(stats.uptimeSec)}
                </div>
              </div>
            </div>
          </div>

          {/* Memory panel */}
          <div className="rounded-lg border dark:border-gray-700 p-4 bg-white/60 dark:bg-gray-800/60">
            <div className="flex items-baseline justify-between mb-2">
              <h3 className="font-semibold flex items-center gap-2">
                <MemoryStick size={16} className="text-violet-500" /> Memory
                {stats.real.deviceMemory && (
                  <LiveDot title="Total RAM from navigator.deviceMemory (browsers cap the reported value at 8 GB)" />
                )}
              </h3>
              <span className="text-2xl font-semibold tabular-nums text-violet-600 dark:text-violet-400">
                {fmtMem(stats.usedMemMB)}
              </span>
            </div>
            <div className="h-24 rounded border border-violet-200 dark:border-violet-900 bg-violet-50/50 dark:bg-violet-950/30">
              <Sparkline data={stats.memHistory} color="#8b5cf6" />
            </div>
            <div className="mt-3">
              <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                <span>In use ({memPercent.toFixed(0)}%)</span>
                <span>Available {fmtMem(stats.totalMemMB - stats.usedMemMB)}</span>
              </div>
              <div className="h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${
                    memPercent > 85 ? 'bg-red-500' : memPercent > 65 ? 'bg-amber-500' : 'bg-violet-500'
                  }`}
                  style={{ width: `${memPercent}%` }}
                />
              </div>
              {memPercent > 85 && (
                <p className="text-xs text-red-500 mt-1.5">
                  Memory pressure high — close some apps to free RAM
                </p>
              )}
              {stats.jsHeapMB !== null && (
                <p className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 mt-2">
                  <LiveDot title="Real measurement from performance.memory" />
                  JS heap of this tab (real): {fmtMem(stats.jsHeapMB)}
                </p>
              )}
            </div>
          </div>

          <p className="text-xs text-gray-400 dark:text-gray-500 px-1">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500 align-middle mr-1.5" />
            marks values measured from your real machine; everything else is simulated —
            browsers can't see other processes.
          </p>
        </div>
      )}
    </div>
  );
};
