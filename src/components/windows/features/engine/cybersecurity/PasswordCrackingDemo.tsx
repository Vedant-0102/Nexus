import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  BookOpen,
  FlaskConical,
  Shield,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Info,
  CheckCircle2,
  XCircle,
  Zap,
  Clock,
  Hash,
  KeyRound,
  Eye,
  EyeOff,
  Play,
  Square,
  ChevronRight,
  Lock,
  Unlock,
  Cpu,
  Server,
  Globe,
} from 'lucide-react';

// ─── Constants ────────────────────────────────────────────────────────────────

type CrackMode = 'dictionary' | 'bruteforce';
type ActiveTab = 'learn' | 'sandbox';

const DICTIONARY: string[] = [
  'password', '123456', '12345678', 'qwerty', 'abc123', 'monkey', 'master',
  'dragon', 'letmein', 'login', 'princess', 'football', 'shadow', 'sunshine',
  'trustno1', 'iloveyou', 'batman', 'access', 'hello', 'charlie', 'admin',
  'welcome', 'passw0rd', 'password1', 'p@ssword', 'pass1234', 'hunter2',
  'baseball', 'soccer', 'hockey', 'michael', 'jordan', 'superman', 'harley',
  'ranger', 'thomas', 'robert', 'daniel', 'starwars', 'klaster', 'george',
  'computer', 'michelle', 'jessica', 'pepper', 'zxcvbn', 'summer', 'winter',
  'freedom', 'thunder', 'ginger', 'hammer', 'silver', 'cookie', 'orange',
  'corvette', 'bigdog', 'cheese', 'midnight', 'sparky', 'camaro', 'matrix',
  'falcon', 'andrea', 'alexis', 'johnson', 'creative', 'secret', 'america',
  '1234', '12345', '123456789', '1234567', '1234567890', '111111', '000000',
  'test', 'guest', 'root', 'toor', 'qwerty123', 'letmein1', 'pass', 'love',
  'god', 'money', 'nothing', 'maggie', 'biteme', 'ashley', 'cowboy',
  'flower', 'buster', 'junior', 'sophie', 'bailey', 'princess1', 'diamond',
];

const CHARSET_LOWER = 'abcdefghijklmnopqrstuvwxyz';
const CHARSET_UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const CHARSET_DIGITS = '0123456789';
const CHARSET_SPECIAL = '!@#$%^&*()-_=+[]{}|;:,.<>?/~`';

// ─── Helpers ──────────────────────────────────────────────────────────────────

interface PasswordAnalysis {
  score: number;
  entropy: number;
  feedback: string[];
  label: string;
  charSets: { lower: boolean; upper: boolean; digits: boolean; special: boolean };
  poolSize: number;
}

function analyzePassword(pw: string): PasswordAnalysis {
  if (!pw)
    return {
      score: 0, entropy: 0, feedback: [], label: '',
      charSets: { lower: false, upper: false, digits: false, special: false },
      poolSize: 0,
    };

  let poolSize = 0;
  const feedback: string[] = [];
  const hasLower = /[a-z]/.test(pw);
  const hasUpper = /[A-Z]/.test(pw);
  const hasDigits = /[0-9]/.test(pw);
  const hasSpecial = /[^a-zA-Z0-9]/.test(pw);

  if (hasLower) poolSize += 26;
  if (hasUpper) poolSize += 26;
  if (hasDigits) poolSize += 10;
  if (hasSpecial) poolSize += 32;
  if (poolSize === 0) poolSize = 26;

  const entropy = Math.floor(pw.length * Math.log2(poolSize));

  if (!hasUpper) feedback.push('Add uppercase letters for a larger character pool');
  if (!hasLower) feedback.push('Add lowercase letters');
  if (!hasDigits) feedback.push('Add numeric digits to increase entropy');
  if (!hasSpecial) feedback.push('Add special characters (!@#$%...) for maximum pool size');
  if (pw.length < 8) feedback.push('Use at least 8 characters -- short passwords are trivially cracked');
  else if (pw.length < 12) feedback.push('Consider 12+ characters for robust protection');
  else if (pw.length < 16) feedback.push('16+ characters makes brute force essentially infeasible');
  if (DICTIONARY.includes(pw.toLowerCase())) feedback.push('This is a common dictionary password -- extremely vulnerable');
  if (/(.)\1{2,}/.test(pw)) feedback.push('Avoid repeated characters (e.g. "aaa") -- they reduce effective entropy');
  if (/^(012|123|234|345|456|567|678|789|abc|bcd|cde|qwe|wer|asd|sdf)/.test(pw.toLowerCase())) {
    feedback.push('Avoid sequential patterns (e.g. "123", "abc") -- attackers test these first');
  }

  let score: number;
  let label: string;
  if (entropy < 28) { score = 1; label = 'Weak'; }
  else if (entropy < 36) { score = 2; label = 'Fair'; }
  else if (entropy < 50) { score = 3; label = 'Good'; }
  else if (entropy < 65) { score = 4; label = 'Strong'; }
  else { score = 5; label = 'Excellent'; }

  return {
    score, entropy, feedback, label, poolSize,
    charSets: { lower: hasLower, upper: hasUpper, digits: hasDigits, special: hasSpecial },
  };
}

function formatCrackTime(seconds: number): string {
  if (seconds < 0.001) return 'Instant';
  if (seconds < 1) return `${(seconds * 1000).toFixed(0)} milliseconds`;
  if (seconds < 60) return `${seconds.toFixed(1)} seconds`;
  if (seconds < 3600) return `${(seconds / 60).toFixed(1)} minutes`;
  if (seconds < 86400) return `${(seconds / 3600).toFixed(1)} hours`;
  if (seconds < 86400 * 365) return `${(seconds / 86400).toFixed(0)} days`;
  if (seconds < 86400 * 365 * 1000) return `${(seconds / (86400 * 365)).toFixed(1)} years`;
  if (seconds < 86400 * 365 * 1e6) return `${(seconds / (86400 * 365 * 1000)).toFixed(0)} thousand years`;
  if (seconds < 86400 * 365 * 1e9) return `${(seconds / (86400 * 365 * 1e6)).toFixed(0)} million years`;
  if (seconds < 86400 * 365 * 1e12) return `${(seconds / (86400 * 365 * 1e9)).toFixed(0)} billion years`;
  return `${(seconds / (86400 * 365 * 1e12)).toFixed(0)} trillion years`;
}

function crackTimeAtSpeed(entropy: number, guessesPerSecond: number): string {
  const combinations = Math.pow(2, entropy);
  const seconds = combinations / guessesPerSecond / 2;
  return formatCrackTime(seconds);
}

// ─── Section wrapper for Learn tab ────────────────────────────────────────────

const Section: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode }> = ({
  title, icon, children,
}) => (
  <div className="mb-4">
    <div className="flex items-center gap-2 mb-2">
      {icon}
      <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100">{title}</h3>
    </div>
    <div className="pl-1 text-xs leading-relaxed text-gray-700 dark:text-gray-300">
      {children}
    </div>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

export const PasswordCrackingDemo: React.FC = () => {
  const [tab, setTab] = useState<ActiveTab>('learn');

  // Sandbox state
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(true);
  const [mode, setMode] = useState<CrackMode>('dictionary');
  const [isRunning, setIsRunning] = useState(false);
  const [isCracked, setIsCracked] = useState(false);
  const [speed, setSpeed] = useState(50);
  const [attempts, setAttempts] = useState(0);
  const [currentGuess, setCurrentGuess] = useState('');
  const [elapsedMs, setElapsedMs] = useState(0);
  const [recentGuesses, setRecentGuesses] = useState<string[]>([]);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);
  const attemptCountRef = useRef(0);
  const dictIndexRef = useRef(0);
  const bruteStateRef = useRef({ length: 1, indices: [0] });

  const analysis = analyzePassword(password);

  const charset = (() => {
    let cs = CHARSET_LOWER;
    if (/[A-Z]/.test(password)) cs += CHARSET_UPPER;
    if (/[0-9]/.test(password)) cs += CHARSET_DIGITS;
    if (/[^a-zA-Z0-9]/.test(password)) cs += CHARSET_SPECIAL;
    return cs;
  })();

  const stopCracking = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
    setIsRunning(false);
  }, []);

  const startCracking = useCallback(() => {
    if (!password) return;
    setIsCracked(false);
    setAttempts(0);
    setCurrentGuess('');
    setRecentGuesses([]);
    setIsRunning(true);
    attemptCountRef.current = 0;
    dictIndexRef.current = 0;
    bruteStateRef.current = { length: 1, indices: [0] };
    startTimeRef.current = Date.now();

    const guessesPerTick = Math.max(1, Math.floor(speed / 10));

    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      setElapsedMs(elapsed);

      const newGuesses: string[] = [];

      for (let g = 0; g < guessesPerTick; g++) {
        let guess = '';

        if (mode === 'dictionary') {
          if (dictIndexRef.current >= DICTIONARY.length) {
            const baseWord = DICTIONARY[dictIndexRef.current % DICTIONARY.length];
            const variationIdx = Math.floor(dictIndexRef.current / DICTIONARY.length);
            switch (variationIdx) {
              case 1: guess = baseWord + '1'; break;
              case 2: guess = baseWord + '123'; break;
              case 3: guess = baseWord.charAt(0).toUpperCase() + baseWord.slice(1); break;
              case 4: guess = baseWord + '!'; break;
              case 5: guess = baseWord.replace(/a/gi, '@').replace(/e/gi, '3').replace(/o/gi, '0'); break;
              case 6: guess = baseWord + '2024'; break;
              case 7: guess = baseWord + '!!'; break;
              case 8: guess = baseWord.toUpperCase(); break;
              case 9: guess = baseWord + '@1'; break;
              default:
                stopCracking();
                return;
            }
          } else {
            guess = DICTIONARY[dictIndexRef.current];
          }
          dictIndexRef.current++;
        } else {
          const st = bruteStateRef.current;
          guess = st.indices.map(i => charset[i]).join('');

          let carry = true;
          for (let pos = st.indices.length - 1; pos >= 0 && carry; pos--) {
            st.indices[pos]++;
            if (st.indices[pos] >= charset.length) {
              st.indices[pos] = 0;
            } else {
              carry = false;
            }
          }
          if (carry) {
            st.length++;
            st.indices = new Array(st.length).fill(0);
          }
        }

        attemptCountRef.current++;
        newGuesses.push(guess);

        if (guess === password) {
          setAttempts(attemptCountRef.current);
          setCurrentGuess(guess);
          setIsCracked(true);
          setRecentGuesses(prev => [...prev.slice(-19), ...newGuesses]);
          stopCracking();
          return;
        }
      }

      setAttempts(attemptCountRef.current);
      setCurrentGuess(newGuesses[newGuesses.length - 1]);
      setRecentGuesses(prev => [...prev, ...newGuesses].slice(-20));
    }, Math.max(10, 200 - speed * 2));
  }, [password, mode, speed, charset, stopCracking]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const attemptsPerSec = elapsedMs > 0 ? Math.round(attempts / (elapsedMs / 1000)) : 0;

  const strengthColors = ['bg-gray-300 dark:bg-gray-700', 'bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500', 'bg-emerald-500'];
  const strengthTextColors = ['text-gray-400', 'text-red-500', 'text-orange-500', 'text-yellow-500', 'text-green-500', 'text-emerald-500'];

  // ─── RENDER ───────────────────────────────────────────────────────────────

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-50 to-gray-100 dark:from-gray-950 dark:to-gray-900 p-3 overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 mb-3">
        <h2 className="text-sm font-bold text-gray-900 dark:text-white">Password Cracking Demo</h2>
        <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
          Understand how attackers break passwords and how to defend against them
        </p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 mb-3 flex-shrink-0 bg-gray-200/60 dark:bg-gray-800/60 rounded-lg p-0.5">
        {([
          { key: 'learn' as const, label: 'Learn', icon: <BookOpen className="w-3.5 h-3.5" /> },
          { key: 'sandbox' as const, label: 'Sandbox', icon: <FlaskConical className="w-3.5 h-3.5" /> },
        ]).map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all duration-200 ${
              tab === t.key
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 min-h-0 overflow-auto">
        {tab === 'learn' ? (
          /* ════════════════════════════════════════════════════════════
             LEARN TAB
             ════════════════════════════════════════════════════════════ */
          <div className="space-y-1 pb-4">
            {/* What is password cracking? */}
            <Section title="What Is Password Cracking?" icon={<KeyRound className="w-4 h-4 text-purple-500" />}>
              <p className="mb-2">
                Password cracking is the process of recovering plaintext passwords from data that has been stored or
                transmitted by a computer system. Attackers obtain hashed passwords from breached databases, stolen
                backup files, or intercepted network traffic, then use various techniques to reverse the hash and
                discover the original password.
              </p>
              <p className="mb-2">
                Because hash functions are one-way (you cannot mathematically reverse them), attackers must resort
                to guessing: they hash candidate passwords and compare the result to the stolen hash. The goal is
                to find a candidate whose hash matches the target. The speed of this process depends on the hashing
                algorithm used, the attacker's hardware, and the complexity of the password.
              </p>
              <p>
                Understanding these techniques is essential for building strong defenses. When you know how
                attackers think, you can choose passwords that resist every known method.
              </p>
            </Section>

            {/* Attack types */}
            <Section title="Attack Types" icon={<ShieldAlert className="w-4 h-4 text-red-500" />}>
              {/* Brute Force */}
              <div className="mb-3 p-3 bg-red-50 dark:bg-red-900/15 rounded-lg border border-red-200 dark:border-red-800/40">
                <h4 className="text-xs font-bold text-red-700 dark:text-red-400 flex items-center gap-1.5 mb-1">
                  <Zap className="w-3.5 h-3.5" /> Brute Force Attack
                </h4>
                <p className="mb-1.5">
                  The brute force method systematically tries every possible combination of characters up to a given
                  length. Starting from "a", "b", ... "z", "aa", "ab", and so on, it is guaranteed to eventually find
                  any password -- but the time required grows exponentially.
                </p>
                <p className="mb-1.5">
                  <span className="font-semibold">Time complexity:</span> O(C^L) where C is the character set size
                  and L is the password length. For a lowercase-only 8-character password, there are 26^8 =
                  ~208 billion possibilities. With mixed case, digits, and symbols (94 characters), 8 characters
                  yields 94^8 = ~6.1 quadrillion possibilities.
                </p>
                <p>
                  Modern GPUs can compute billions of hashes per second against weak algorithms like MD5. However,
                  brute force becomes impractical for passwords longer than 10-12 characters when strong hashing
                  (bcrypt, Argon2) is used, since each guess takes milliseconds instead of nanoseconds.
                </p>
              </div>

              {/* Dictionary Attack */}
              <div className="mb-3 p-3 bg-orange-50 dark:bg-orange-900/15 rounded-lg border border-orange-200 dark:border-orange-800/40">
                <h4 className="text-xs font-bold text-orange-700 dark:text-orange-400 flex items-center gap-1.5 mb-1">
                  <BookOpen className="w-3.5 h-3.5" /> Dictionary Attack
                </h4>
                <p className="mb-1.5">
                  A dictionary attack uses a pre-compiled wordlist of common passwords, leaked credentials, and
                  natural-language words. Instead of testing every combination, it tests only likely candidates.
                  Common wordlists include RockYou (14 million passwords), SecLists, and CrackStation (1.5 billion entries).
                </p>
                <p className="mb-1.5">
                  Alarmingly effective: studies show that over 80% of real-world passwords can be found in the top
                  10,000 most common passwords. "123456" has appeared in virtually every major breach and remains
                  the single most-used password globally.
                </p>
                <p>
                  Dictionary attacks are often the first technique attempted because they are fast and have a high
                  success rate. Even a modest 10-million-word list can be exhausted in seconds against a fast hash.
                </p>
              </div>

              {/* Rainbow Tables */}
              <div className="mb-3 p-3 bg-violet-50 dark:bg-violet-900/15 rounded-lg border border-violet-200 dark:border-violet-800/40">
                <h4 className="text-xs font-bold text-violet-700 dark:text-violet-400 flex items-center gap-1.5 mb-1">
                  <Hash className="w-3.5 h-3.5" /> Rainbow Table Attack
                </h4>
                <p className="mb-1.5">
                  Rainbow tables are massive pre-computed lookup tables that map hash values back to their original
                  plaintext inputs. Instead of computing hashes on-the-fly, the attacker simply looks up the stolen
                  hash in the table to find the password instantly.
                </p>
                <p className="mb-1.5">
                  They use a chain-reduction technique to compress storage: each chain stores only a start and end
                  point, and intermediate values are recomputed on demand. This allows tables covering trillions of
                  passwords to fit in terabytes of disk space.
                </p>
                <p>
                  <span className="font-semibold">Defense:</span> Salting completely defeats rainbow tables. A salt
                  is a random value appended to each password before hashing, meaning the attacker would need a
                  separate rainbow table for every possible salt -- making pre-computation infeasible.
                </p>
              </div>

              {/* Credential Stuffing */}
              <div className="mb-3 p-3 bg-yellow-50 dark:bg-yellow-900/15 rounded-lg border border-yellow-200 dark:border-yellow-800/40">
                <h4 className="text-xs font-bold text-yellow-700 dark:text-yellow-400 flex items-center gap-1.5 mb-1">
                  <Globe className="w-3.5 h-3.5" /> Credential Stuffing
                </h4>
                <p className="mb-1.5">
                  Credential stuffing exploits password reuse. Attackers take username/password pairs leaked from
                  one breach and automatically try them on dozens of other services. If you used the same password
                  on your email, bank, and a forum that got breached, all those accounts are now compromised.
                </p>
                <p>
                  According to industry reports, credential stuffing attacks account for the majority of login
                  attempts on many large websites. Success rates range from 0.1% to 2%, but given millions of
                  stolen credentials, that translates to thousands of compromised accounts per attack.
                </p>
              </div>

              {/* Hybrid Attacks */}
              <div className="p-3 bg-blue-50 dark:bg-blue-900/15 rounded-lg border border-blue-200 dark:border-blue-800/40">
                <h4 className="text-xs font-bold text-blue-700 dark:text-blue-400 flex items-center gap-1.5 mb-1">
                  <FlaskConical className="w-3.5 h-3.5" /> Hybrid Attacks
                </h4>
                <p className="mb-1.5">
                  Hybrid attacks combine a dictionary wordlist with rule-based mutations. For each dictionary word,
                  the attacker applies transformations: appending numbers ("password1", "password123"), adding symbols
                  ("password!"), leet-speak substitution ("p@ssw0rd"), capitalization ("Password"), reversals, and
                  combinations of multiple words.
                </p>
                <p>
                  Tools like Hashcat support thousands of rules that can be chained together. A single base word
                  can generate millions of variants, making hybrid attacks devastatingly effective against passwords
                  that are merely simple modifications of common words.
                </p>
              </div>
            </Section>

            {/* Password hashing */}
            <Section title="Password Hashing Algorithms" icon={<Hash className="w-4 h-4 text-blue-500" />}>
              <p className="mb-2">
                Responsible systems never store passwords in plaintext. Instead, they store the output of a
                cryptographic hash function. When you log in, the system hashes your input and compares it to the
                stored hash. Here are the major algorithms, from weakest to strongest:
              </p>
              <div className="space-y-2">
                <div className="p-2.5 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-2 mb-1">
                    <XCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                    <span className="text-xs font-bold text-red-600 dark:text-red-400">MD5 (Broken)</span>
                  </div>
                  <p className="text-[11px]">
                    128-bit output, extremely fast (~10 billion hashes/sec on a GPU). Cryptographically broken
                    with known collision attacks. Never use for password storage. A modern GPU can exhaust all
                    8-character alphanumeric passwords in under an hour.
                  </p>
                </div>
                <div className="p-2.5 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-2 mb-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-orange-500 flex-shrink-0" />
                    <span className="text-xs font-bold text-orange-600 dark:text-orange-400">SHA-256 (Inadequate for passwords)</span>
                  </div>
                  <p className="text-[11px]">
                    256-bit output, still very fast (~5 billion hashes/sec on a GPU). While SHA-256 is not
                    cryptographically broken, its speed makes it unsuitable for password hashing. It was designed
                    for data integrity verification, not password storage.
                  </p>
                </div>
                <div className="p-2.5 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                    <span className="text-xs font-bold text-green-600 dark:text-green-400">bcrypt (Good)</span>
                  </div>
                  <p className="text-[11px]">
                    Adaptive hash function with a configurable cost factor. At cost 12 (recommended minimum),
                    each hash takes ~250ms on a CPU. Built-in salt generation. Limits input to 72 bytes. Widely
                    adopted and battle-tested since 1999. A GPU can only manage ~30,000 hashes/sec.
                  </p>
                </div>
                <div className="p-2.5 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                    <span className="text-xs font-bold text-green-600 dark:text-green-400">scrypt (Very Good)</span>
                  </div>
                  <p className="text-[11px]">
                    Memory-hard function that requires significant RAM in addition to CPU time. This makes it
                    resistant to GPU and ASIC attacks, since those devices have limited memory bandwidth. Used
                    by some cryptocurrency systems and password storage implementations.
                  </p>
                </div>
                <div className="p-2.5 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-2 mb-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Argon2 (Best -- PHC Winner)</span>
                  </div>
                  <p className="text-[11px]">
                    Winner of the 2015 Password Hashing Competition. Configurable memory, time, and parallelism
                    parameters. Comes in three variants: Argon2d (data-dependent, GPU-resistant), Argon2i
                    (data-independent, side-channel resistant), and Argon2id (hybrid, recommended). The current
                    gold standard for new applications.
                  </p>
                </div>
              </div>
            </Section>

            {/* Salting */}
            <Section title="Why Salting Matters" icon={<Shield className="w-4 h-4 text-green-500" />}>
              <p className="mb-2">
                A salt is a random string (typically 16-32 bytes) that is concatenated with the password before
                hashing. Each user gets a unique salt, which is stored alongside the hash (it is not secret).
              </p>
              <div className="p-3 bg-green-50 dark:bg-green-900/15 rounded-lg border border-green-200 dark:border-green-800/40 mb-2">
                <p className="font-semibold mb-1">Without salt:</p>
                <p className="font-mono text-[10px] mb-2 break-all">hash("password") = 5f4dcc3b5aa765d61d8327deb882cf99</p>
                <p className="text-[11px] mb-2">
                  If two users both have the password "password", their hashes are identical. An attacker who
                  cracks one has cracked both. Rainbow tables work perfectly.
                </p>
                <p className="font-semibold mb-1">With salt:</p>
                <p className="font-mono text-[10px] mb-1 break-all">hash("a9x7k2" + "password") = 8c229d5a3884b0...</p>
                <p className="font-mono text-[10px] mb-2 break-all">hash("m3p8q1" + "password") = f19e2ca17b3a02...</p>
                <p className="text-[11px]">
                  Same password, different salts, completely different hashes. Rainbow tables become useless
                  because the attacker would need a separate table for every unique salt. This forces attackers
                  to crack each hash individually.
                </p>
              </div>
            </Section>

            {/* Entropy */}
            <Section title="Password Entropy" icon={<Info className="w-4 h-4 text-cyan-500" />}>
              <p className="mb-2">
                Entropy measures the unpredictability of a password in bits. Higher entropy means more possible
                combinations and longer crack times. The formula for a truly random password is:
              </p>
              <div className="p-3 bg-cyan-50 dark:bg-cyan-900/15 rounded-lg border border-cyan-200 dark:border-cyan-800/40 mb-2 text-center">
                <p className="font-mono text-sm font-bold text-cyan-700 dark:text-cyan-300">
                  H = L x log2(C)
                </p>
                <p className="text-[10px] mt-1 text-cyan-600 dark:text-cyan-400">
                  H = entropy in bits, L = password length, C = character set size
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2 mb-2">
                <div className="p-2 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
                  <p className="text-[10px] font-semibold text-gray-600 dark:text-gray-300 mb-1">Character set sizes:</p>
                  <ul className="text-[10px] space-y-0.5">
                    <li>Digits only: 10 (3.32 bits/char)</li>
                    <li>Lowercase: 26 (4.70 bits/char)</li>
                    <li>Mixed case: 52 (5.70 bits/char)</li>
                    <li>+ Digits: 62 (5.95 bits/char)</li>
                    <li>+ Symbols: 94 (6.55 bits/char)</li>
                  </ul>
                </div>
                <div className="p-2 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
                  <p className="text-[10px] font-semibold text-gray-600 dark:text-gray-300 mb-1">Strength thresholds:</p>
                  <ul className="text-[10px] space-y-0.5">
                    <li className="text-red-500">Below 28 bits: Weak</li>
                    <li className="text-orange-500">28-35 bits: Fair</li>
                    <li className="text-yellow-600 dark:text-yellow-400">36-49 bits: Good</li>
                    <li className="text-green-500">50-64 bits: Strong</li>
                    <li className="text-emerald-500">65+ bits: Excellent</li>
                  </ul>
                </div>
              </div>
              <p>
                A truly random 16-character password using the full 94-character set has ~105 bits of entropy
                -- more than enough to resist any foreseeable attack. However, human-chosen passwords typically
                have far less entropy than their length suggests, because people use predictable patterns.
              </p>
            </Section>

            {/* Breach statistics */}
            <Section title="Real-World Breach Statistics" icon={<AlertTriangle className="w-4 h-4 text-amber-500" />}>
              <div className="p-3 bg-amber-50 dark:bg-amber-900/15 rounded-lg border border-amber-200 dark:border-amber-800/40 mb-2">
                <p className="font-semibold text-xs text-amber-700 dark:text-amber-400 mb-2">Most common passwords (from major breaches):</p>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-1">
                  {['123456', 'password', '123456789', '12345678', '12345', 'qwerty', '1234567', '111111', '1234567890', 'abc123'].map((p, i) => (
                    <div key={i} className="px-2 py-1 bg-amber-100 dark:bg-amber-900/30 rounded text-[10px] font-mono text-center text-amber-800 dark:text-amber-300">
                      {i + 1}. {p}
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-1.5">
                <p>
                  <span className="font-semibold">Average crack times</span> (at 10 billion guesses/sec with MD5):
                </p>
                <ul className="space-y-0.5 ml-3">
                  <li>6-character lowercase: ~3 seconds</li>
                  <li>8-character lowercase: ~35 minutes</li>
                  <li>8-character mixed case + digits: ~14 hours</li>
                  <li>10-character full charset: ~5 years</li>
                  <li>12-character full charset: ~34,000 years</li>
                  <li>16-character full charset: ~billions of years</li>
                </ul>
                <p className="mt-2">
                  Over 24 billion username/password pairs have been exposed in data breaches as of 2024.
                  The RockYou breach alone exposed 32 million plaintext passwords. Studies consistently show
                  that approximately 50% of users reuse passwords across multiple sites.
                </p>
              </div>
            </Section>

            {/* Defense */}
            <Section title="Defense Strategies" icon={<ShieldCheck className="w-4 h-4 text-emerald-500" />}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="p-2.5 bg-emerald-50 dark:bg-emerald-900/15 rounded-lg border border-emerald-200 dark:border-emerald-800/40">
                  <h4 className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1 mb-1">
                    <Lock className="w-3 h-3" /> Password Managers
                  </h4>
                  <p className="text-[10px]">
                    Generate and store unique, high-entropy passwords for every account. You only need to remember
                    one strong master password. Eliminates password reuse entirely.
                  </p>
                </div>
                <div className="p-2.5 bg-emerald-50 dark:bg-emerald-900/15 rounded-lg border border-emerald-200 dark:border-emerald-800/40">
                  <h4 className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1 mb-1">
                    <KeyRound className="w-3 h-3" /> Two-Factor Authentication (2FA)
                  </h4>
                  <p className="text-[10px]">
                    Even if an attacker cracks your password, they need a second factor (TOTP code, hardware key,
                    SMS) to access the account. Hardware keys (FIDO2/WebAuthn) provide the strongest protection.
                  </p>
                </div>
                <div className="p-2.5 bg-emerald-50 dark:bg-emerald-900/15 rounded-lg border border-emerald-200 dark:border-emerald-800/40">
                  <h4 className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1 mb-1">
                    <Shield className="w-3 h-3" /> Account Lockout Policies
                  </h4>
                  <p className="text-[10px]">
                    Lock accounts after a set number of failed login attempts (e.g., 5 attempts, then 15-minute
                    lockout). Implements exponential backoff. Stops online brute force attacks cold, though it
                    does not protect against offline hash cracking.
                  </p>
                </div>
                <div className="p-2.5 bg-emerald-50 dark:bg-emerald-900/15 rounded-lg border border-emerald-200 dark:border-emerald-800/40">
                  <h4 className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1 mb-1">
                    <Hash className="w-3 h-3" /> Use Strong Hashing
                  </h4>
                  <p className="text-[10px]">
                    Developers: always use Argon2id or bcrypt with a high cost factor for password storage. Never
                    use MD5, SHA-1, or plain SHA-256. Combine with unique per-user salts (bcrypt and Argon2 handle
                    this automatically).
                  </p>
                </div>
              </div>
            </Section>
          </div>
        ) : (
          /* ════════════════════════════════════════════════════════════
             SANDBOX TAB
             ════════════════════════════════════════════════════════════ */
          <div className="space-y-3 pb-4">
            {/* Password Input & Strength Analysis */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <label className="text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1.5 block">
                Enter a password to analyze
              </label>
              <div className="relative mb-3">
                <input
                  value={password}
                  onChange={e => { setPassword(e.target.value); setIsCracked(false); }}
                  disabled={isRunning}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Type a password..."
                  className="w-full px-3 py-2 pr-10 text-sm rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none font-mono"
                />
                <button
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {password && (
                <>
                  {/* Strength meter */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400">Strength</span>
                      <span className={`text-xs font-bold ${strengthTextColors[analysis.score]}`}>
                        {analysis.label}
                      </span>
                    </div>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map(i => (
                        <div
                          key={i}
                          className={`h-2 flex-1 rounded-full transition-all duration-300 ${
                            i <= analysis.score ? strengthColors[analysis.score] : 'bg-gray-200 dark:bg-gray-700'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Entropy & character set */}
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div className="p-2.5 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                      <div className="text-[10px] text-gray-500 dark:text-gray-400 mb-1">Entropy</div>
                      <div className="text-lg font-bold font-mono text-gray-900 dark:text-white">
                        {analysis.entropy} <span className="text-xs font-normal text-gray-500">bits</span>
                      </div>
                      <div className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">
                        Pool size: {analysis.poolSize} chars | Length: {password.length}
                      </div>
                    </div>
                    <div className="p-2.5 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                      <div className="text-[10px] text-gray-500 dark:text-gray-400 mb-1">Character Sets Used</div>
                      <div className="grid grid-cols-2 gap-1 mt-1">
                        {[
                          { key: 'lower', label: 'a-z', active: analysis.charSets.lower },
                          { key: 'upper', label: 'A-Z', active: analysis.charSets.upper },
                          { key: 'digits', label: '0-9', active: analysis.charSets.digits },
                          { key: 'special', label: '!@#$', active: analysis.charSets.special },
                        ].map(cs => (
                          <div
                            key={cs.key}
                            className={`px-2 py-0.5 rounded text-[10px] font-mono text-center border ${
                              cs.active
                                ? 'bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700 text-green-700 dark:text-green-400'
                                : 'bg-gray-100 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-400 dark:text-gray-500'
                            }`}
                          >
                            {cs.label}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Crack time comparison */}
                  <div className="mb-3">
                    <h4 className="text-[11px] font-semibold text-gray-600 dark:text-gray-300 mb-2 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      Estimated Crack Time by Attacker Capability
                    </h4>
                    <div className="space-y-1.5">
                      {[
                        { label: 'Laptop CPU', icon: <Cpu className="w-3 h-3" />, speed: 1e6, desc: '~1 million guesses/sec' },
                        { label: 'Desktop GPU', icon: <Cpu className="w-3 h-3" />, speed: 1e10, desc: '~10 billion guesses/sec' },
                        { label: 'GPU Cluster', icon: <Server className="w-3 h-3" />, speed: 1e12, desc: '~1 trillion guesses/sec' },
                        { label: 'Nation-State Botnet', icon: <Globe className="w-3 h-3" />, speed: 1e15, desc: '~1 quadrillion guesses/sec' },
                      ].map((tier, i) => {
                        const time = crackTimeAtSpeed(analysis.entropy, tier.speed);
                        const isInstant = time === 'Instant';
                        return (
                          <div
                            key={i}
                            className={`flex items-center gap-2 p-2 rounded-lg border text-xs ${
                              isInstant
                                ? 'bg-red-50 dark:bg-red-900/15 border-red-200 dark:border-red-800/40'
                                : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                            }`}
                          >
                            <div className="text-gray-500 dark:text-gray-400 flex-shrink-0">{tier.icon}</div>
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-gray-800 dark:text-gray-200">{tier.label}</div>
                              <div className="text-[10px] text-gray-400 dark:text-gray-500">{tier.desc}</div>
                            </div>
                            <div className={`font-bold font-mono text-right flex-shrink-0 ${
                              isInstant ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-gray-100'
                            }`}>
                              {time}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Improvement suggestions */}
                  {analysis.feedback.length > 0 && (
                    <div className="p-3 bg-purple-50 dark:bg-purple-900/15 rounded-lg border border-purple-200 dark:border-purple-800/40">
                      <h4 className="text-[11px] font-bold text-purple-700 dark:text-purple-300 mb-1.5 flex items-center gap-1">
                        <Info className="w-3.5 h-3.5" /> Improvement Suggestions
                      </h4>
                      <ul className="space-y-1">
                        {analysis.feedback.map((tip, i) => (
                          <li key={i} className="text-[11px] text-purple-700 dark:text-purple-400 flex items-start gap-1.5">
                            <ChevronRight className="w-3 h-3 mt-0.5 flex-shrink-0 text-purple-400" />
                            {tip}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Attack simulator */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <h4 className="text-xs font-bold text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                Attack Simulator
              </h4>

              {/* Mode selection */}
              <div className="flex flex-wrap items-end gap-3 mb-3">
                <div>
                  <label className="text-[10px] font-medium text-gray-500 dark:text-gray-400 mb-1 block">
                    Attack Mode
                  </label>
                  <div className="flex gap-0.5 bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5">
                    {(['dictionary', 'bruteforce'] as const).map(m => (
                      <button
                        key={m}
                        onClick={() => { if (!isRunning) setMode(m); }}
                        disabled={isRunning}
                        className={`px-3 py-1.5 text-[11px] rounded-md font-medium transition-colors ${
                          mode === m
                            ? 'bg-purple-600 text-white shadow-sm'
                            : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                        }`}
                      >
                        {m === 'dictionary' ? 'Dictionary' : 'Brute Force'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Speed slider */}
                <div className="flex-1 min-w-[140px]">
                  <label className="text-[10px] font-medium text-gray-500 dark:text-gray-400 mb-1 block">
                    Speed: {speed}%
                  </label>
                  <input
                    type="range"
                    min={1}
                    max={100}
                    value={speed}
                    onChange={e => setSpeed(Number(e.target.value))}
                    className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full appearance-none cursor-pointer accent-purple-600"
                  />
                </div>

                {/* Controls */}
                <div className="flex gap-2">
                  {!isRunning ? (
                    <button
                      onClick={startCracking}
                      disabled={!password}
                      className="flex items-center gap-1.5 px-4 py-2 text-xs bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Play className="w-3 h-3" />
                      Start Attack
                    </button>
                  ) : (
                    <button
                      onClick={stopCracking}
                      className="flex items-center gap-1.5 px-4 py-2 text-xs bg-red-600 text-white rounded-lg hover:bg-red-700 font-bold transition-colors"
                    >
                      <Square className="w-3 h-3" />
                      Stop
                    </button>
                  )}
                </div>
              </div>

              {/* Mode description */}
              <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded-lg mb-3 text-[10px] text-gray-500 dark:text-gray-400">
                {mode === 'dictionary' ? (
                  <span>
                    <span className="font-semibold text-gray-700 dark:text-gray-300">Dictionary mode:</span> Tests
                    common passwords from a wordlist, then applies mutations (appending numbers, symbols, leet-speak).
                    Fast against weak passwords.
                  </span>
                ) : (
                  <span>
                    <span className="font-semibold text-gray-700 dark:text-gray-300">Brute force mode:</span> Tries
                    every possible character combination starting from length 1. Guaranteed to find the password
                    eventually, but exponentially slower with length.
                  </span>
                )}
              </div>

              {/* Live stats */}
              <div className="grid grid-cols-3 gap-2 mb-3">
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2.5 text-center border border-gray-200 dark:border-gray-700">
                  <div className="text-[10px] text-gray-500 dark:text-gray-400 mb-0.5">Attempts</div>
                  <div className="text-sm font-bold font-mono text-gray-900 dark:text-white">
                    {attempts.toLocaleString()}
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2.5 text-center border border-gray-200 dark:border-gray-700">
                  <div className="text-[10px] text-gray-500 dark:text-gray-400 mb-0.5">Speed</div>
                  <div className="text-sm font-bold font-mono text-gray-900 dark:text-white">
                    {attemptsPerSec.toLocaleString()}/s
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2.5 text-center border border-gray-200 dark:border-gray-700">
                  <div className="text-[10px] text-gray-500 dark:text-gray-400 mb-0.5">Elapsed</div>
                  <div className="text-sm font-bold font-mono text-gray-900 dark:text-white">
                    {(elapsedMs / 1000).toFixed(1)}s
                  </div>
                </div>
              </div>

              {/* Terminal visualization */}
              <div className="bg-gray-950 rounded-lg border border-gray-700 p-3 min-h-[150px]">
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      isRunning
                        ? 'bg-green-500 animate-pulse'
                        : isCracked
                          ? 'bg-red-500'
                          : 'bg-gray-600'
                    }`}
                  />
                  <span className="text-[10px] font-mono text-gray-400">
                    {isRunning
                      ? `${mode === 'dictionary' ? 'Dictionary' : 'Brute-force'} attack in progress...`
                      : isCracked
                        ? 'PASSWORD CRACKED!'
                        : 'Awaiting attack...'}
                  </span>
                  {isRunning && currentGuess && (
                    <span className="ml-auto text-[10px] font-mono text-gray-500 truncate max-w-[150px]">
                      current: &quot;{currentGuess}&quot;
                    </span>
                  )}
                </div>

                {isCracked && (
                  <div className="mb-2 p-2 bg-red-900/30 border border-red-600/60 rounded-lg">
                    <div className="text-xs font-bold text-red-400 font-mono flex items-center gap-1.5">
                      <Unlock className="w-3.5 h-3.5" />
                      CRACKED: &quot;{password}&quot; found in {attempts.toLocaleString()} attempts (
                      {(elapsedMs / 1000).toFixed(2)}s)
                    </div>
                  </div>
                )}

                <div className="font-mono text-[11px] space-y-0.5 max-h-[120px] overflow-auto scrollbar-thin">
                  {recentGuesses.map((guess, i) => {
                    const isLast = i === recentGuesses.length - 1;
                    const matched = guess === password && isCracked && isLast;
                    return (
                      <div
                        key={i}
                        className={`flex items-center gap-2 ${
                          matched
                            ? 'text-red-400 font-bold'
                            : isLast
                              ? 'text-green-400'
                              : 'text-gray-600'
                        }`}
                      >
                        <span className="text-gray-500 w-4 flex-shrink-0">
                          {matched ? '>' : ' '}
                        </span>
                        <span className="truncate">trying: &quot;{guess}&quot;</span>
                        {matched && (
                          <span className="text-red-500 ml-2 flex-shrink-0 flex items-center gap-1">
                            <XCircle className="w-3 h-3" /> MATCH!
                          </span>
                        )}
                      </div>
                    );
                  })}
                  {!isRunning && !isCracked && recentGuesses.length === 0 && (
                    <div className="text-gray-600">
                      $ ready -- enter a password above and click Start Attack
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Comparison panel */}
            {password && (
              <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                <h4 className="text-xs font-bold text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-blue-500" />
                  Crack Time vs. Hashing Algorithm
                </h4>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 mb-2">
                  The hashing algorithm used by the target system dramatically affects crack time.
                  Below shows how long it would take to crack your password using a desktop GPU against different algorithms.
                </p>
                <div className="space-y-1.5">
                  {[
                    { algo: 'MD5', speed: 1e10, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/10' },
                    { algo: 'SHA-256', speed: 5e9, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-900/10' },
                    { algo: 'bcrypt (cost 12)', speed: 3e4, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-900/10' },
                    { algo: 'scrypt', speed: 1e4, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/10' },
                    { algo: 'Argon2id', speed: 1e3, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/10' },
                  ].map((item, i) => {
                    const time = crackTimeAtSpeed(analysis.entropy, item.speed);
                    return (
                      <div
                        key={i}
                        className={`flex items-center justify-between p-2 rounded-lg ${item.bg} border border-gray-200 dark:border-gray-700`}
                      >
                        <div>
                          <span className={`text-xs font-bold ${item.color}`}>{item.algo}</span>
                          <span className="text-[10px] text-gray-400 ml-2">
                            ({item.speed >= 1e9
                              ? `${(item.speed / 1e9).toFixed(0)}B`
                              : item.speed >= 1e6
                                ? `${(item.speed / 1e6).toFixed(0)}M`
                                : item.speed >= 1e3
                                  ? `${(item.speed / 1e3).toFixed(0)}K`
                                  : item.speed}{' '}
                            H/s)
                          </span>
                        </div>
                        <span className="text-xs font-mono font-bold text-gray-900 dark:text-gray-100">
                          {time}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
