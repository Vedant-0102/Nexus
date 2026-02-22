import React, { useState, useMemo } from 'react';

function base64urlDecode(str: string): string {
  try {
    const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - base64.length % 4) % 4);
    return atob(padded);
  } catch {
    return '';
  }
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
  } catch {
    return null;
  }
}

const SAMPLE_JWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE5MTYyMzkwMjIsImlzcyI6InNlY3VyZS1uZXh1cyIsImF1ZCI6ImRlbW8tYXBwIiwianRpIjoiYWJjMTIzIn0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';

const CLAIM_LABELS: Record<string, string> = {
  iss: 'Issuer', sub: 'Subject', aud: 'Audience', exp: 'Expiration', iat: 'Issued At',
  nbf: 'Not Before', jti: 'JWT ID', name: 'Name', email: 'Email', role: 'Role',
};

function formatTimestamp(ts: number): string {
  try { return new Date(ts * 1000).toLocaleString(); } catch { return String(ts); }
}

export const JWTDecoder: React.FC = () => {
  const [token, setToken] = useState('');

  const decoded = useMemo(() => decodeJWT(token), [token]);

  const isExpired = decoded?.payload.exp ? (decoded.payload.exp as number) * 1000 < Date.now() : null;

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-50 to-rose-50 dark:from-gray-950 dark:to-rose-950 p-3 overflow-hidden">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">JWT Decoder</span>
        <button onClick={() => setToken(SAMPLE_JWT)} className="px-2 py-0.5 text-[10px] bg-rose-600 text-white rounded hover:bg-rose-700">Load Sample</button>
        {token && <button onClick={() => setToken('')} className="px-2 py-0.5 text-[10px] bg-gray-500 text-white rounded hover:bg-gray-600">Clear</button>}
      </div>

      <textarea value={token} onChange={e => setToken(e.target.value)} placeholder="Paste your JWT here..."
        className="w-full h-20 p-2 text-xs rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 font-mono resize-none mb-2" />

      {token && !decoded && (
        <div className="text-xs text-red-500 font-semibold mb-2">Invalid JWT format. Expected: header.payload.signature</div>
      )}

      {decoded && (
        <>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-2 mb-2 border border-gray-200 dark:border-gray-700">
            <div className="text-[10px] text-gray-500 mb-1">Color-coded JWT</div>
            <div className="text-xs font-mono break-all">
              <span className="text-rose-600 dark:text-rose-400">{decoded.rawParts[0]}</span>
              <span className="text-gray-400">.</span>
              <span className="text-indigo-600 dark:text-indigo-400">{decoded.rawParts[1]}</span>
              <span className="text-gray-400">.</span>
              <span className="text-emerald-600 dark:text-emerald-400">{decoded.rawParts[2]}</span>
            </div>
          </div>

          <div className="flex-1 min-h-0 flex gap-3 overflow-hidden">
            <div className="flex-1 flex flex-col gap-3 overflow-auto">
              <div className="bg-rose-50 dark:bg-rose-900/20 rounded-lg p-3 border border-rose-200 dark:border-rose-800">
                <div className="text-xs font-semibold text-rose-700 dark:text-rose-300 mb-1.5">Header</div>
                <div className="flex items-center gap-2 mb-2">
                  {decoded.header.alg && <span className="px-2 py-0.5 bg-rose-200 dark:bg-rose-800 rounded text-[10px] font-bold text-rose-800 dark:text-rose-200">alg: {String(decoded.header.alg)}</span>}
                  {decoded.header.typ && <span className="px-2 py-0.5 bg-rose-200 dark:bg-rose-800 rounded text-[10px] font-bold text-rose-800 dark:text-rose-200">typ: {String(decoded.header.typ)}</span>}
                </div>
                <pre className="text-[10px] font-mono text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{JSON.stringify(decoded.header, null, 2)}</pre>
              </div>

              <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-3 border border-indigo-200 dark:border-indigo-800">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold text-indigo-700 dark:text-indigo-300">Payload</span>
                  {isExpired !== null && (
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${isExpired ? 'bg-red-200 dark:bg-red-900 text-red-800 dark:text-red-200' : 'bg-green-200 dark:bg-green-900 text-green-800 dark:text-green-200'}`}>
                      {isExpired ? 'Expired' : 'Valid'}
                    </span>
                  )}
                </div>
                <pre className="text-[10px] font-mono text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{JSON.stringify(decoded.payload, null, 2)}</pre>
              </div>

              <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-3 border border-emerald-200 dark:border-emerald-800">
                <div className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 mb-1">Signature</div>
                <div className="text-[10px] font-mono text-gray-700 dark:text-gray-300 break-all">{decoded.signature}</div>
              </div>
            </div>

            <div className="w-56 overflow-auto">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Claims</div>
                <div className="space-y-1.5">
                  {Object.entries(decoded.payload).map(([key, val]) => (
                    <div key={key} className="border-b border-gray-100 dark:border-gray-700 pb-1">
                      <div className="text-[10px] text-gray-500">{CLAIM_LABELS[key] || key}</div>
                      <div className="text-[10px] font-mono text-gray-800 dark:text-gray-200 break-all">
                        {(key === 'exp' || key === 'iat' || key === 'nbf') && typeof val === 'number'
                          ? formatTimestamp(val as number)
                          : typeof val === 'object' ? JSON.stringify(val) : String(val)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {!token && (
        <div className="flex-1 flex items-center justify-center text-sm text-gray-400">
          Paste a JWT above to decode it
        </div>
      )}
    </div>
  );
};
