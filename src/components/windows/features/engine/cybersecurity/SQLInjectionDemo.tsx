import React, { useState, useCallback } from 'react';
import {
  ShieldAlert, AlertTriangle, CheckCircle, Eye, EyeOff,
  Lock, Unlock, LogIn, XCircle, RotateCcw, Database, BookOpen, Terminal
} from 'lucide-react';

// ─── Types & Data ────────────────────────────────────────────────────────────

interface MockUser {
  id: number;
  username: string;
  password: string;
  role: string;
}

const USERS: MockUser[] = [
  { id: 1, username: 'admin', password: 'Sup3rS3cur3!', role: 'admin' },
  { id: 2, username: 'alice', password: 'alice2024', role: 'user' },
  { id: 3, username: 'bob', password: 'b0bpass', role: 'user' },
];

const ATTACKS = [
  { label: "admin'--", desc: 'Skip the password check' },
  { label: "' OR 1=1 --", desc: 'Match every user' },
  { label: "'; DROP TABLE users;--", desc: 'Delete the table' },
];

// ─── Simulation ──────────────────────────────────────────────────────────────

type Result = {
  type: 'success' | 'injected' | 'failed' | 'dropped';
  user: MockUser | null;
  message: string;
  explain: string;
};

function simulate(username: string, password: string, safe: boolean): Result {
  if (safe) {
    const found = USERS.find(u => u.username === username && u.password === password);
    if (found) return {
      type: 'success', user: found,
      message: `Welcome back, ${found.username}!`,
      explain: 'Input was treated as plain text — special characters had no effect.',
    };
    return {
      type: 'failed', user: null,
      message: 'Wrong username or password.',
      explain: 'Input was compared literally. Injection characters were treated as regular text.',
    };
  }

  const trimmed = username.trim();

  if (trimmed.toLowerCase().includes('drop table')) {
    return {
      type: 'dropped', user: null,
      message: 'Table deleted!',
      explain: "The ';' ended the login query, then DROP TABLE ran as a second command.",
    };
  }

  if (trimmed.includes("' OR 1=1") || trimmed.includes("' OR ''='") || trimmed.includes("' OR 'a'='a")) {
    return {
      type: 'injected', user: USERS[0],
      message: `Logged in as ${USERS[0].username}!`,
      explain: 'OR 1=1 is always true — every row matched, so the app logged you in as the first user.',
    };
  }

  if (trimmed.endsWith("'--") || trimmed.endsWith("' --")) {
    const name = trimmed.replace(/'[\s]*--$/, '');
    const found = USERS.find(u => u.username === name);
    if (found) return {
      type: 'injected', user: found,
      message: `Logged in as ${found.username}!`,
      explain: `The ' closed the username string early, and -- commented out the password check.`,
    };
    return {
      type: 'failed', user: null,
      message: `No user "${name}" exists.`,
      explain: "The injection syntax was correct, but the username didn't match anyone.",
    };
  }

  const found = USERS.find(u => u.username === username && u.password === password);
  if (found) return {
    type: 'success', user: found,
    message: `Welcome back, ${found.username}!`,
    explain: 'Username and password both matched.',
  };
  return {
    type: 'failed', user: null,
    message: 'Wrong username or password.',
    explain: 'No matching credentials found.',
  };
}

// ─── Component ───────────────────────────────────────────────────────────────

export const SQLInjectionDemo: React.FC = () => {
  const [tab, setTab] = useState<'sandbox' | 'learn'>('sandbox');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [safe, setSafe] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [showPass, setShowPass] = useState(false);
  const [dropped, setDropped] = useState(false);

  const handleSubmit = useCallback(() => {
    if (dropped) return;
    const r = simulate(username, password, safe);
    if (r.type === 'dropped') setDropped(true);
    setResult(r);
  }, [username, password, safe, dropped]);

  const handleReset = useCallback(() => {
    setUsername('');
    setPassword('');
    setResult(null);
    setDropped(false);
  }, []);

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-50 to-orange-50 dark:from-gray-950 dark:to-orange-950/20 p-3 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 flex-shrink-0">
        <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100">SQL Injection</h2>
        <div className="flex items-center gap-2">
          {/* Learn / Sandbox tabs */}
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5">
            <button
              onClick={() => setTab('sandbox')}
              className={`px-3 py-1.5 text-xs rounded-md font-medium transition-all flex items-center gap-1.5 ${
                tab === 'sandbox' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm' : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              <Terminal className="w-3 h-3" /> Sandbox
            </button>
            <button
              onClick={() => setTab('learn')}
              className={`px-3 py-1.5 text-xs rounded-md font-medium transition-all flex items-center gap-1.5 ${
                tab === 'learn' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm' : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              <BookOpen className="w-3 h-3" /> Learn
            </button>
          </div>
          {/* Vulnerable / Protected toggle (only in sandbox) */}
          {tab === 'sandbox' && (
            <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5">
              <button
                onClick={() => { setSafe(false); setResult(null); setDropped(false); }}
                className={`px-3 py-1.5 text-xs rounded-md font-medium transition-all flex items-center gap-1.5 ${
                  !safe ? 'bg-red-600 text-white shadow-sm' : 'text-gray-600 dark:text-gray-300'
                }`}
              >
                <Unlock className="w-3 h-3" /> Vulnerable
              </button>
              <button
                onClick={() => { setSafe(true); setResult(null); setDropped(false); }}
                className={`px-3 py-1.5 text-xs rounded-md font-medium transition-all flex items-center gap-1.5 ${
                  safe ? 'bg-green-600 text-white shadow-sm' : 'text-gray-600 dark:text-gray-300'
                }`}
              >
                <Lock className="w-3 h-3" /> Protected
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ─── Learn Tab ─── */}
      {tab === 'learn' ? (
        <div className="flex-1 min-h-0 overflow-y-auto space-y-3">
          {/* What is it */}
          <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800/50 rounded-xl p-4">
            <h3 className="text-xs font-bold text-orange-800 dark:text-orange-300 mb-2">What is SQL Injection?</h3>
            <p className="text-xs text-orange-900 dark:text-orange-200 leading-relaxed">
              SQL Injection is when an attacker puts SQL code into an input field (like a login form) and the server
              runs it as part of its database query. It happens because the app builds SQL by gluing user input directly
              into the query string instead of treating it as data. It&apos;s been the #1 web vulnerability for over a decade.
            </p>
          </div>

          {/* How it works */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
            <h3 className="text-xs font-bold text-gray-800 dark:text-gray-200 mb-3">How it works</h3>
            <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed mb-3">
              A normal login query looks like this:
            </p>
            <div className="bg-gray-950 rounded-lg p-2.5 mb-3">
              <pre className="text-[11px] font-mono text-green-400 whitespace-pre-wrap">SELECT * FROM users WHERE username = &apos;admin&apos; AND password = &apos;Sup3rS3cur3!&apos;</pre>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed mb-3">
              If the app uses string concatenation, typing <code className="px-1 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-orange-600 dark:text-orange-400 text-[11px]">admin&apos;--</code> as username produces:
            </p>
            <div className="bg-gray-950 rounded-lg p-2.5 mb-3">
              <pre className="text-[11px] font-mono whitespace-pre-wrap"><span className="text-green-400">SELECT * FROM users WHERE username = &apos;</span><span className="text-red-400">admin</span><span className="text-yellow-400">&apos;--</span><span className="text-gray-600">&apos; AND password = &apos;anything&apos;</span></pre>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
              The <code className="text-orange-500 text-[11px]">&apos;</code> closes the string, <code className="text-orange-500 text-[11px]">--</code> comments out the rest.
              The database only sees <code className="text-orange-500 text-[11px]">username = &apos;admin&apos;</code> — password check gone.
            </p>
          </div>

          {/* Types */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
            <h3 className="text-xs font-bold text-gray-800 dark:text-gray-200 mb-3">Types of SQL Injection</h3>
            <div className="space-y-2.5">
              {[
                { name: 'Classic (In-Band)', color: 'text-red-700 dark:text-red-400', desc: "Inject via the same channel you read results from. Examples: OR 1=1, admin'--" },
                { name: 'Union-Based', color: 'text-orange-700 dark:text-orange-400', desc: 'Use UNION to append a second query that pulls data from other tables.' },
                { name: 'Blind (Boolean)', color: 'text-yellow-700 dark:text-yellow-400', desc: 'No visible output — ask true/false questions and observe page differences to extract data one character at a time.' },
                { name: 'Time-Based Blind', color: 'text-purple-700 dark:text-purple-400', desc: 'Use SLEEP() to cause delays. If the response is slow, the condition was true.' },
              ].map(t => (
                <div key={t.name} className="flex gap-2">
                  <span className={`text-xs font-bold ${t.color} w-32 flex-shrink-0`}>{t.name}</span>
                  <span className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">{t.desc}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Real-World Impact */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
            <h3 className="text-xs font-bold text-gray-800 dark:text-gray-200 mb-3">Real-World Impact</h3>
            <div className="space-y-1.5 text-xs text-gray-600 dark:text-gray-400">
              <p><strong className="text-gray-800 dark:text-gray-200">Heartland</strong> — 134 million credit cards stolen via SQLi</p>
              <p><strong className="text-gray-800 dark:text-gray-200">Sony</strong> — 77 million PlayStation accounts compromised</p>
              <p><strong className="text-gray-800 dark:text-gray-200">Yahoo</strong> — 450K credentials leaked</p>
              <p><strong className="text-gray-800 dark:text-gray-200">TalkTalk</strong> — 157K records breached, &pound;400K fine</p>
              <p className="pt-1 text-gray-500">Average data breach cost: $4.88M (IBM, 2024)</p>
            </div>
          </div>

          {/* Prevention */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
            <h3 className="text-xs font-bold text-gray-800 dark:text-gray-200 mb-3">Prevention</h3>
            <div className="space-y-2.5">
              {[
                { name: 'Parameterized Queries', tag: 'PRIMARY', tagColor: 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300', desc: 'Separate SQL code from data at the protocol level. The definitive fix.' },
                { name: 'Input Validation', tag: 'SECONDARY', tagColor: 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300', desc: 'Validate formats, enforce length limits, reject unexpected characters. Always combine with parameterized queries.' },
                { name: 'WAF', tag: 'PERIMETER', tagColor: 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-300', desc: 'Web Application Firewall — inspects requests for injection patterns. Good as a safety net, but bypassable.' },
                { name: 'Least Privilege', tag: 'DAMAGE CONTROL', tagColor: 'bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300', desc: "Don't give the app DB account DROP/ALTER privileges. If injection succeeds, the damage is limited." },
              ].map(p => (
                <div key={p.name} className="flex items-start gap-2">
                  <div className="flex items-center gap-1.5 w-40 flex-shrink-0">
                    <span className="text-xs font-bold text-gray-800 dark:text-gray-200">{p.name}</span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${p.tagColor}`}>{p.tag}</span>
                  </div>
                  <span className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">{p.desc}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Code comparison */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/50 rounded-xl p-3">
              <div className="text-[10px] text-red-700 dark:text-red-400 font-bold mb-1.5 flex items-center gap-1"><Unlock className="w-3 h-3" /> Vulnerable</div>
              <div className="bg-gray-950 rounded-lg p-2.5">
                <pre className="text-[11px] font-mono text-red-400 whitespace-pre-wrap leading-relaxed">{`// String concatenation
query = "SELECT * FROM users "
  + "WHERE username = '"
  + username + "'"

db.query(query) // attacker controls SQL`}</pre>
              </div>
            </div>
            <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800/50 rounded-xl p-3">
              <div className="text-[10px] text-green-700 dark:text-green-400 font-bold mb-1.5 flex items-center gap-1"><Lock className="w-3 h-3" /> Safe</div>
              <div className="bg-gray-950 rounded-lg p-2.5">
                <pre className="text-[11px] font-mono text-green-400 whitespace-pre-wrap leading-relaxed">{`// Parameterized query
query = "SELECT * FROM users "
  + "WHERE username = $1"

db.query(query, [username])
// input is NEVER interpreted as SQL`}</pre>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ─── Sandbox Tab ─── */
        <div className="flex-1 min-h-0 overflow-y-auto space-y-3">
          {/* Database peek */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-3">
            <div className="flex items-center gap-1.5 mb-2">
              <Database className="w-3.5 h-3.5 text-blue-500" />
              <span className="text-xs font-bold text-gray-600 dark:text-gray-400">users</span>
            </div>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-1 px-2 text-gray-400 font-semibold">username</th>
                  <th className="text-left py-1 px-2 text-gray-400 font-semibold">password</th>
                  <th className="text-left py-1 px-2 text-gray-400 font-semibold">role</th>
                </tr>
              </thead>
              <tbody>
                {USERS.map(u => (
                  <tr key={u.id} className="border-b border-gray-100 dark:border-gray-800 last:border-0">
                    <td className="py-1 px-2 font-mono text-gray-800 dark:text-gray-200">{u.username}</td>
                    <td className="py-1 px-2 font-mono text-orange-600 dark:text-orange-400">{u.password}</td>
                    <td className="py-1 px-2">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        u.role === 'admin' ? 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'
                      }`}>{u.role}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Main area */}
          {dropped ? (
            <div className="bg-red-950 rounded-xl border-2 border-red-500 p-6 text-center">
              <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-red-400 mb-1">DATABASE DESTROYED</h3>
              <p className="text-xs text-red-300/70 font-mono mb-3">ERROR 1146: Table &apos;app.users&apos; doesn&apos;t exist</p>
              <button onClick={handleReset} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold inline-flex items-center gap-2">
                <RotateCcw className="w-3.5 h-3.5" /> Restore
              </button>
            </div>
          ) : !result ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {/* Login form */}
              <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className={`px-4 py-2.5 ${safe ? 'bg-green-600' : 'bg-gradient-to-r from-blue-600 to-indigo-600'}`}>
                  <h3 className="text-xs font-bold text-white text-center">
                    {safe ? 'Login (parameterized query)' : 'Login (string concatenation)'}
                  </h3>
                </div>
                <div className="p-4 space-y-3">
                  <div>
                    <label className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-1 block">Username</label>
                    <input
                      value={username}
                      onChange={e => setUsername(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                      placeholder={safe ? 'username' : "admin'--"}
                      className="w-full px-3 py-2 text-sm rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                      spellCheck={false}
                      autoComplete="off"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-1 block">Password</label>
                    <div className="relative">
                      <input
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                        type={showPass ? 'text' : 'password'}
                        placeholder={safe ? 'password' : 'anything'}
                        className="w-full px-3 py-2 pr-9 text-sm rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        autoComplete="off"
                      />
                      <button onClick={() => setShowPass(!showPass)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200" title={showPass ? 'Hide' : 'Show'}>
                        {showPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                  <button
                    onClick={handleSubmit}
                    className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
                  >
                    <LogIn className="w-4 h-4" /> Sign In
                  </button>
                  {!safe && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {ATTACKS.map((a, i) => (
                        <button
                          key={i}
                          onClick={() => { setUsername(a.label); setPassword('anything'); }}
                          className="px-2 py-1 text-[10px] font-mono rounded-md bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800/50 text-orange-700 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-900/40 transition-colors"
                          title={a.desc}
                        >
                          {a.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Live SQL */}
              <div className="bg-gray-950 rounded-xl border border-gray-700 p-4 flex flex-col">
                <div className="text-[10px] text-gray-500 uppercase tracking-wider font-bold mb-2">
                  Generated SQL
                </div>
                <div className="flex-1 flex items-center">
                  <pre className="text-sm font-mono leading-relaxed break-all whitespace-pre-wrap">
                    {safe ? (
                      <>
                        <span className="text-blue-400">SELECT * FROM</span>{' '}
                        <span className="text-gray-300">users</span>{' '}
                        <span className="text-blue-400">WHERE</span>{' '}
                        <span className="text-gray-300">username = </span>
                        <span className="text-green-400">$1</span>
                        <span className="text-gray-300"> AND password = </span>
                        <span className="text-green-400">$2</span>
                        {'\n\n'}
                        <span className="text-gray-600">-- $1 = &quot;{username}&quot;</span>
                        {'\n'}
                        <span className="text-gray-600">-- $2 = &quot;****&quot;</span>
                        {'\n'}
                        <span className="text-gray-600">-- (sent as data, not code)</span>
                      </>
                    ) : (
                      <>
                        <span className="text-blue-400">SELECT * FROM</span>{' '}
                        <span className="text-gray-300">users</span>{' '}
                        <span className="text-blue-400">WHERE</span>{' '}
                        <span className="text-gray-300">username = &apos;</span>
                        <span className="text-red-400 bg-red-900/30 px-0.5 rounded">{username || <span className="text-gray-600">...</span>}</span>
                        <span className="text-gray-300">&apos; AND password = &apos;</span>
                        <span className="text-red-400 bg-red-900/30 px-0.5 rounded">{password || <span className="text-gray-600">...</span>}</span>
                        <span className="text-gray-300">&apos;</span>
                      </>
                    )}
                  </pre>
                </div>
                {!safe && username.includes("'") && (
                  <p className="mt-3 text-[11px] text-red-400 bg-red-900/20 rounded-lg px-2.5 py-1.5">
                    The <code>&apos;</code> in your input closes the string early — everything after it is treated as SQL.
                  </p>
                )}
              </div>
            </div>
          ) : (
            /* Result */
            <div className="max-w-md mx-auto">
              <div className={`rounded-xl border-2 overflow-hidden ${
                result.type === 'injected' ? 'border-red-500' :
                result.type === 'success' ? 'border-green-500' :
                'border-gray-400 dark:border-gray-600'
              }`}>
                <div className={`px-5 py-4 text-center ${
                  result.type === 'injected' ? 'bg-red-600' :
                  result.type === 'success' ? 'bg-green-600' :
                  'bg-gray-500'
                }`}>
                  {result.type === 'injected' ? (
                    <ShieldAlert className="w-8 h-8 text-white mx-auto mb-1" />
                  ) : result.type === 'success' ? (
                    <CheckCircle className="w-8 h-8 text-white mx-auto mb-1" />
                  ) : (
                    <XCircle className="w-8 h-8 text-white mx-auto mb-1" />
                  )}
                  <h3 className="text-base font-bold text-white">{result.message}</h3>
                </div>

                {result.user && (
                  <div className="flex items-center gap-3 px-5 py-3 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold">
                      {result.user.username[0].toUpperCase()}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-gray-900 dark:text-gray-100">{result.user.username}</div>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                        result.user.role === 'admin' ? 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'
                      }`}>{result.user.role}</span>
                    </div>
                  </div>
                )}

                <div className="px-5 py-4 bg-white dark:bg-gray-900 space-y-3">
                  <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">{result.explain}</p>

                  <div className="bg-gray-950 rounded-lg p-2.5">
                    <pre className="text-[11px] font-mono text-green-400 whitespace-pre-wrap break-all leading-relaxed">
                      {safe
                        ? `SELECT * FROM users WHERE username = $1 AND password = $2`
                        : `SELECT * FROM users WHERE username = '${username}' AND password = '${password}'`}
                    </pre>
                  </div>

                  <button onClick={handleReset} className="w-full py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors">
                    <RotateCcw className="w-3.5 h-3.5" /> Try Again
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Code comparison */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-950 rounded-xl border border-red-900/50 p-2.5">
              <div className="text-[10px] text-red-400 font-bold mb-1.5 flex items-center gap-1"><Unlock className="w-3 h-3" /> Vulnerable</div>
              <pre className="text-[10px] font-mono text-red-400/80 whitespace-pre-wrap leading-relaxed">{`"...WHERE username = '"
  + input + "'"`}</pre>
            </div>
            <div className="bg-gray-950 rounded-xl border border-green-900/50 p-2.5">
              <div className="text-[10px] text-green-400 font-bold mb-1.5 flex items-center gap-1"><Lock className="w-3 h-3" /> Safe</div>
              <pre className="text-[10px] font-mono text-green-400/80 whitespace-pre-wrap leading-relaxed">{`"...WHERE username = $1"
params = [input]`}</pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
