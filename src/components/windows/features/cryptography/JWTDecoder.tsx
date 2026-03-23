import React, { useState, useMemo } from 'react';
import { Copy, Check, AlertTriangle, CheckCircle, Clock, Shield, ShieldAlert } from 'lucide-react';

function base64urlDecode(str: string): string {
  try {
    const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - base64.length % 4) % 4);
    return atob(padded);
  } catch { return ''; }
}

interface DecodedJWT {
  header: Record<string, unknown>;
  payload: Record<string, unknown>;
  signature: string;
  rawParts: [string, string, string];
}

function decodeJWT(token: string): DecodedJWT | null {
  const parts = token.trim().split('.');
  if (parts.length !== 3) return null;
  try {
    const header = JSON.parse(base64urlDecode(parts[0]));
    const payload = JSON.parse(base64urlDecode(parts[1]));
    return { header, payload, signature: parts[2], rawParts: [parts[0], parts[1], parts[2]] };
  } catch { return null; }
}

const SAMPLE_JWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE5MTYyMzkwMjIsImlzcyI6InNlY3VyZS1uZXh1cyIsImF1ZCI6ImRlbW8tYXBwIiwianRpIjoiYWJjMTIzIn0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';

const CLAIM_LABELS: Record<string, string> = {
  iss: 'Issuer', sub: 'Subject', aud: 'Audience', exp: 'Expires', iat: 'Issued At',
  nbf: 'Not Before', jti: 'JWT ID', name: 'Name', email: 'Email', role: 'Role',
};

interface AlgoInfo { strength: 'strong' | 'weak' | 'note'; note: string }
const ALGO_INFO: Record<string, AlgoInfo> = {
  'HS256': { strength: 'strong', note: 'HMAC-SHA256. Symmetric — same key signs and verifies. Secret must stay private.' },
  'HS384': { strength: 'strong', note: 'HMAC-SHA384. Stronger digest than HS256.' },
  'HS512': { strength: 'strong', note: 'HMAC-SHA512. Strongest HMAC variant.' },
  'RS256': { strength: 'strong', note: 'RSA-PKCS1v15 + SHA-256. Asymmetric. Public key verifies, private key signs.' },
  'RS384': { strength: 'strong', note: 'RSA-PKCS1v15 + SHA-384.' },
  'RS512': { strength: 'strong', note: 'RSA-PKCS1v15 + SHA-512.' },
  'ES256': { strength: 'strong', note: 'ECDSA + SHA-256 (P-256). Shorter signatures than RSA.' },
  'ES384': { strength: 'strong', note: 'ECDSA + SHA-384 (P-384).' },
  'ES512': { strength: 'strong', note: 'ECDSA + SHA-512 (P-521).' },
  'PS256': { strength: 'strong', note: 'RSA-PSS + SHA-256. More secure padding than RS256.' },
  'none':  { strength: 'weak', note: 'No signature! Any payload accepted. Never use in production.' },
};

function formatTimestamp(ts: number): string {
  try { return new Date(ts * 1000).toLocaleString(); } catch { return String(ts); }
}

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
      className="flex items-center gap-1 px-1.5 py-0.5 bg-blue-600 text-white rounded text-[10px]">
      {copied ? <Check size={9} /> : <Copy size={9} />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
}

function TimelineBar({ iat, nbf, exp }: { iat?: number; nbf?: number; exp?: number }) {
  const now = Math.floor(Date.now() / 1000);
  const start = Math.min(iat ?? now, nbf ?? now, now) - 3600;
  const end = Math.max(exp ?? now, now) + 3600;
  const range = end - start;
  const pct = (t: number) => Math.max(0, Math.min(100, ((t - start) / range) * 100));
  const nowPct = pct(now);

  const isValid = (nbf === undefined || now >= nbf) && (exp === undefined || now < exp) && (iat === undefined || now >= iat);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1"><Clock size={10} /> Token Timeline</span>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${isValid ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300' : 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300'}`}>
          {isValid ? 'ACTIVE' : 'EXPIRED / NOT YET VALID'}
        </span>
      </div>
      <div className="relative h-6 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
        {/* Valid window */}
        {(iat !== undefined || nbf !== undefined) && exp !== undefined && (
          <div className="absolute top-0 h-full bg-green-400/30 dark:bg-green-500/20 rounded-full"
            style={{ left: `${pct(nbf ?? iat ?? start)}%`, width: `${pct(exp) - pct(nbf ?? iat ?? start)}%` }} />
        )}
        {/* Now marker */}
        <div className="absolute top-0 h-full w-0.5 bg-blue-500" style={{ left: `${nowPct}%` }} />
        {iat !== undefined && <div className="absolute top-1 w-2 h-4 rounded bg-indigo-400" style={{ left: `${pct(iat)}%`, transform: 'translateX(-50%)' }} title={`iat: ${formatTimestamp(iat)}`} />}
        {nbf !== undefined && <div className="absolute top-1 w-2 h-4 rounded bg-orange-400" style={{ left: `${pct(nbf)}%`, transform: 'translateX(-50%)' }} title={`nbf: ${formatTimestamp(nbf)}`} />}
        {exp !== undefined && <div className="absolute top-1 w-2 h-4 rounded bg-red-400" style={{ left: `${pct(exp)}%`, transform: 'translateX(-50%)' }} title={`exp: ${formatTimestamp(exp)}`} />}
      </div>
      <div className="flex items-center gap-3 mt-1 text-[9px] text-gray-500">
        <span className="flex items-center gap-0.5"><span className="w-2 h-2 rounded bg-indigo-400 inline-block" /> iat</span>
        {nbf !== undefined && <span className="flex items-center gap-0.5"><span className="w-2 h-2 rounded bg-orange-400 inline-block" /> nbf</span>}
        {exp !== undefined && <span className="flex items-center gap-0.5"><span className="w-2 h-2 rounded bg-red-400 inline-block" /> exp</span>}
        <span className="flex items-center gap-0.5"><span className="w-0.5 h-3 bg-blue-500 inline-block" /> now</span>
      </div>
    </div>
  );
}

export const JWTDecoder: React.FC = () => {
  const [token, setToken] = useState('');

  const decoded = useMemo(() => decodeJWT(token), [token]);

  const isExpired = decoded?.payload.exp ? (decoded.payload.exp as number) * 1000 < Date.now() : null;
  const alg = decoded?.header.alg ? String(decoded.header.alg) : '';
  const algInfo = ALGO_INFO[alg];

  const iat = decoded?.payload.iat as number | undefined;
  const nbf = decoded?.payload.nbf as number | undefined;
  const exp = decoded?.payload.exp as number | undefined;
  const hasTimeline = iat !== undefined || nbf !== undefined || exp !== undefined;

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-50 to-rose-50 dark:from-gray-950 dark:to-rose-950 p-3 gap-2 overflow-hidden">

      <div className="flex items-center gap-2">
        <button onClick={() => setToken(SAMPLE_JWT)} className="px-2 py-0.5 text-[10px] bg-rose-600 text-white rounded hover:bg-rose-700">Load Sample</button>
        {token && <button onClick={() => setToken('')} className="px-2 py-0.5 text-[10px] bg-gray-500 text-white rounded hover:bg-gray-600">Clear</button>}
        {token && decoded && <CopyBtn text={JSON.stringify({ header: decoded.header, payload: decoded.payload }, null, 2)} />}
      </div>

      <textarea value={token} onChange={e => setToken(e.target.value)} placeholder="Paste your JWT here... (header.payload.signature)"
        className="w-full p-2 text-xs rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 font-mono resize-none"
        style={{ minHeight: 64 }} />

      {token && !decoded && (
        <div className="flex items-center gap-1 text-xs text-red-500 font-semibold">
          <AlertTriangle size={12} /> Invalid JWT format. Expected: header.payload.signature
        </div>
      )}

      {decoded && (
        <div className="flex-1 min-h-0 flex gap-3 overflow-hidden">
          {/* Left: sections */}
          <div className="flex-1 flex flex-col gap-2 overflow-auto min-w-0">
            {/* Color-coded JWT */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-2 border border-gray-200 dark:border-gray-700">
              <div className="text-[10px] text-gray-400 mb-0.5">Color-coded JWT</div>
              <div className="text-[10px] font-mono break-all leading-relaxed">
                <span className="text-rose-600 dark:text-rose-400">{decoded.rawParts[0]}</span>
                <span className="text-gray-400">.</span>
                <span className="text-indigo-600 dark:text-indigo-400">{decoded.rawParts[1]}</span>
                <span className="text-gray-400">.</span>
                <span className="text-emerald-600 dark:text-emerald-400">{decoded.rawParts[2]}</span>
              </div>
            </div>

            {/* Algorithm info */}
            {algInfo && (
              <div className={`rounded-lg p-2 border flex items-start gap-2 ${algInfo.strength === 'strong' ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700' : 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700'}`}>
                {algInfo.strength === 'strong'
                  ? <Shield size={12} className="text-green-600 shrink-0 mt-0.5" />
                  : <ShieldAlert size={12} className="text-red-500 shrink-0 mt-0.5" />}
                <div>
                  <span className={`text-xs font-bold ${algInfo.strength === 'strong' ? 'text-green-700 dark:text-green-300' : 'text-red-600 dark:text-red-400'}`}>{alg}</span>
                  <span className="text-[10px] text-gray-600 dark:text-gray-400 ml-1.5">{algInfo.note}</span>
                </div>
              </div>
            )}

            {/* Timeline */}
            {hasTimeline && <TimelineBar iat={iat} nbf={nbf} exp={exp} />}

            {/* Header */}
            <div className="bg-rose-50 dark:bg-rose-900/20 rounded-lg p-2.5 border border-rose-200 dark:border-rose-800">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-rose-700 dark:text-rose-300">Header</span>
                <div className="flex items-center gap-1">
                  {decoded.header.alg && <span className="px-1.5 py-0.5 bg-rose-200 dark:bg-rose-800 rounded text-[9px] font-bold text-rose-800 dark:text-rose-200">{String(decoded.header.alg)}</span>}
                  {decoded.header.typ && <span className="px-1.5 py-0.5 bg-rose-200 dark:bg-rose-800 rounded text-[9px] font-bold text-rose-800 dark:text-rose-200">{String(decoded.header.typ)}</span>}
                </div>
              </div>
              <pre className="text-[10px] font-mono text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{JSON.stringify(decoded.header, null, 2)}</pre>
            </div>

            {/* Payload */}
            <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-2.5 border border-indigo-200 dark:border-indigo-800">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-indigo-700 dark:text-indigo-300">Payload</span>
                {isExpired !== null && (
                  <span className={`flex items-center gap-0.5 px-2 py-0.5 rounded text-[10px] font-bold ${isExpired ? 'bg-red-200 dark:bg-red-900 text-red-800 dark:text-red-200' : 'bg-green-200 dark:bg-green-900 text-green-800 dark:text-green-200'}`}>
                    {isExpired ? <AlertTriangle size={9} /> : <CheckCircle size={9} />}
                    {isExpired ? 'Expired' : 'Valid'}
                  </span>
                )}
              </div>
              <pre className="text-[10px] font-mono text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{JSON.stringify(decoded.payload, null, 2)}</pre>
            </div>

            {/* Signature */}
            <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-2.5 border border-emerald-200 dark:border-emerald-800">
              <div className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 mb-1">Signature</div>
              <div className="text-[10px] font-mono text-gray-700 dark:text-gray-300 break-all">{decoded.signature}</div>
            </div>
          </div>

          {/* Right: claims */}
          <div className="w-52 shrink-0 overflow-auto">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
              <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Claims</div>
              <div className="space-y-2">
                {Object.entries(decoded.payload).map(([key, val]) => {
                  const isTime = (key === 'exp' || key === 'iat' || key === 'nbf') && typeof val === 'number';
                  return (
                    <div key={key} className="border-b border-gray-100 dark:border-gray-700 pb-1.5">
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-gray-500">{CLAIM_LABELS[key] || key}</span>
                        {key === 'exp' && isExpired !== null && (
                          <span className={`text-[8px] px-1 rounded ${isExpired ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                            {isExpired ? 'expired' : 'valid'}
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] font-mono text-gray-800 dark:text-gray-200 break-all mt-0.5">
                        {isTime ? formatTimestamp(val as number) : typeof val === 'object' ? JSON.stringify(val) : String(val)}
                      </div>
                      {isTime && <div className="text-[9px] text-gray-400">{String(val)}</div>}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {!token && (
        <div className="flex-1 flex items-center justify-center text-sm text-gray-400">
          Paste a JWT above to decode it
        </div>
      )}
    </div>
  );
};
