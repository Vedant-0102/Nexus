import React, { useState, useCallback } from 'react';
import { Shield, BookOpen, Terminal, ChevronRight, ChevronDown, CheckCircle2, XCircle, AlertTriangle, Eye, Award, RotateCcw, ArrowLeft, Code2, FileWarning, History } from 'lucide-react';

// ───────────────────────── Types ─────────────────────────

type Tab = 'learn' | 'sandbox';
type OWASPId = 'A01' | 'A02' | 'A03' | 'A04' | 'A05' | 'A06' | 'A07' | 'A08' | 'A09' | 'A10';
type SandboxView = 'list' | 'detail';
type CodeView = 'vulnerable' | 'fixed' | 'side-by-side';

interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

interface OWASPEntry {
  id: OWASPId;
  rank: number;
  title: string;
  shortTitle: string;
  description: string;
  riskLevel: 'Critical' | 'High' | 'Medium';
  severity: number;
  exampleAttack: string;
  impact: string;
  realWorldImpact: string;
  vulnerableCode: string;
  fixedCode: string;
  codeExplanation: string;
  quiz: [QuizQuestion, QuizQuestion];
}

// ───────────────────────── Data ─────────────────────────

const OWASP_DATA: OWASPEntry[] = [
  {
    id: 'A01',
    rank: 1,
    shortTitle: 'Broken Access Control',
    title: 'Broken Access Control',
    description:
      'Access control enforces policy such that users cannot act outside of their intended permissions. Failures typically lead to unauthorized information disclosure, modification, or destruction of all data, or performing a business function outside the user\'s limits. Common vulnerabilities include violation of the principle of least privilege, bypassing access control checks by modifying the URL, API request, or internal application state, or accessing another user\'s data by providing its unique identifier (Insecure Direct Object References).',
    riskLevel: 'Critical',
    severity: 9.4,
    exampleAttack:
      'An attacker modifies the browser URL from /api/users/123 to /api/users/456, accessing another user\'s account data. Without server-side authorization checks, the application simply returns whatever user ID is requested, exposing personal information, payment details, and private communications.',
    impact:
      'Unauthorized access to sensitive data, account takeover, data modification or destruction, privilege escalation to admin-level access, and complete system compromise. Broken access control moved to the #1 position in 2021 due to its prevalence and severity.',
    realWorldImpact:
      'In 2019, Capital One suffered a breach affecting 106 million customers when a misconfigured WAF allowed an attacker to access S3 buckets with sensitive data, bypassing access controls.',
    vulnerableCode: `// VULNERABLE: No authorization check
app.get('/api/users/:id', (req, res) => {
  // Any authenticated user can access
  // ANY user's data by changing the ID
  const user = db.findUser(req.params.id);
  res.json(user);
});

// VULNERABLE: Direct object reference
app.get('/api/documents/:docId', (req, res) => {
  // No check if user owns this document
  const doc = db.getDocument(req.params.docId);
  res.json(doc);
});

// VULNERABLE: Missing function-level access control
app.post('/api/admin/delete-user', (req, res) => {
  // No role check - any user can call admin endpoint
  db.deleteUser(req.body.userId);
  res.json({ success: true });
});`,
    fixedCode: `// FIXED: Proper authorization check
app.get('/api/users/:id', authorize, (req, res) => {
  // Only allow users to access their own data
  // or admins to access any data
  if (req.user.id !== req.params.id
      && req.user.role !== 'admin') {
    return res.status(403).json({
      error: 'Forbidden'
    });
  }
  const user = db.findUser(req.params.id);
  res.json(user);
});

// FIXED: Verify ownership before returning data
app.get('/api/documents/:docId', authorize, (req, res) => {
  const doc = db.getDocument(req.params.docId);
  if (doc.ownerId !== req.user.id) {
    return res.status(403).json({
      error: 'Forbidden'
    });
  }
  res.json(doc);
});

// FIXED: Role-based access control middleware
app.post('/api/admin/delete-user',
  authorize,
  requireRole('admin'),
  (req, res) => {
    db.deleteUser(req.body.userId);
    res.json({ success: true });
  }
);`,
    codeExplanation:
      'The vulnerable code allows any authenticated user to access any resource by simply manipulating the URL parameter. There are no authorization checks at any level. The fixed code verifies that the requesting user owns the resource or has the required role before granting access, using middleware for role-based access control.',
    quiz: [
      {
        question: 'What is an IDOR vulnerability?',
        options: [
          'A type of SQL Injection attack',
          'Insecure Direct Object Reference - accessing objects by manipulating identifiers without authorization',
          'A cross-site scripting attack vector',
          'A denial of service technique targeting object serialization',
        ],
        correctIndex: 1,
        explanation:
          'IDOR (Insecure Direct Object Reference) occurs when an application uses user-controllable input to directly access objects, allowing attackers to bypass authorization by modifying the reference value (e.g., changing /user/123 to /user/456).',
      },
      {
        question: 'Which HTTP status code should be returned when an authenticated user attempts to access a resource they are not authorized to view?',
        options: [
          '200 OK - to avoid revealing resource existence',
          '401 Unauthorized - user is not logged in',
          '403 Forbidden - user is authenticated but lacks permission',
          '500 Internal Server Error - to hide the real reason',
        ],
        correctIndex: 2,
        explanation:
          '403 Forbidden indicates the server understood the request but refuses to authorize it. 401 means unauthenticated (not logged in), while 403 means authenticated but not authorized. Some implementations use 404 to avoid revealing that the resource exists.',
      },
    ],
  },
  {
    id: 'A02',
    rank: 2,
    shortTitle: 'Cryptographic Failures',
    title: 'Cryptographic Failures',
    description:
      'Previously known as "Sensitive Data Exposure," this category focuses on failures related to cryptography which often lead to exposure of sensitive data. This includes determining the protection needs of data in transit and at rest, use of weak or deprecated cryptographic algorithms, use of default or weak cryptographic keys, missing encryption enforcement, and failure to properly validate certificates. Sensitive data such as passwords, credit card numbers, health records, and personal information require extra protection.',
    riskLevel: 'Critical',
    severity: 9.2,
    exampleAttack:
      'A web application stores user passwords using unsalted MD5 hashes. An attacker gains access to the database through another vulnerability and uses pre-computed rainbow tables to crack 90% of the passwords within hours. These credentials are then used for credential-stuffing attacks on other services where users reused passwords.',
    impact:
      'Exposure of sensitive data including credentials, financial information (credit cards, bank accounts), health records, personal data (SSNs, addresses), and business secrets. Can lead to identity theft, financial fraud, regulatory fines (GDPR, HIPAA), and reputational damage.',
    realWorldImpact:
      'The 2017 Equifax breach exposed 147 million records partly because sensitive data was stored without proper encryption, and expired SSL certificates went unnoticed for months, allowing attackers to exfiltrate data undetected.',
    vulnerableCode: `// VULNERABLE: Storing passwords in plaintext
async function createUser(username, password) {
  await db.query(
    'INSERT INTO users (name, password) VALUES (?, ?)',
    [username, password] // Plain text password!
  );
}

// VULNERABLE: Using weak hashing (MD5)
const crypto = require('crypto');
const hash = crypto.createHash('md5')
  .update(password).digest('hex');

// VULNERABLE: Hardcoded encryption key
const SECRET_KEY = 'my-secret-key-123';
const encrypted = encrypt(data, SECRET_KEY);

// VULNERABLE: Transmitting data over HTTP
const apiUrl = 'http://api.example.com/payment';
fetch(apiUrl, { body: JSON.stringify(cardData) });`,
    fixedCode: `// FIXED: Using bcrypt for password hashing
const bcrypt = require('bcrypt');
const SALT_ROUNDS = 12;

async function createUser(username, password) {
  const hashedPassword = await bcrypt.hash(
    password, SALT_ROUNDS
  );
  await db.query(
    'INSERT INTO users (name, password) VALUES (?, ?)',
    [username, hashedPassword]
  );
}

// FIXED: Using strong hashing with salt
const hash = crypto.createHash('sha256')
  .update(salt + password).digest('hex');

// FIXED: Key from environment variable
const SECRET_KEY = process.env.ENCRYPTION_KEY;
if (!SECRET_KEY) throw new Error('Key not configured');
const encrypted = encrypt(data, SECRET_KEY);

// FIXED: Always use HTTPS with cert validation
const apiUrl = 'https://api.example.com/payment';
fetch(apiUrl, {
  body: JSON.stringify(cardData),
  headers: { 'Content-Type': 'application/json' }
});`,
    codeExplanation:
      'The vulnerable code stores passwords in plaintext, uses weak MD5 hashing without salts, hardcodes encryption keys in source code, and transmits sensitive data over unencrypted HTTP. The fixed version uses bcrypt with proper salt rounds (computationally expensive to brute-force), environment-based key management, and enforces HTTPS for data in transit.',
    quiz: [
      {
        question: 'Why is MD5 considered insecure for password hashing?',
        options: [
          'It produces hashes that are too long to store efficiently',
          'It is too computationally slow for modern server hardware',
          'It is extremely fast, making brute-force feasible, and has known collision vulnerabilities',
          'It only works with passwords shorter than 16 characters',
        ],
        correctIndex: 2,
        explanation:
          'MD5 is extremely fast (billions of hashes per second on modern GPUs), making brute-force attacks very feasible. It also has known collision vulnerabilities, meaning different inputs can produce the same hash. Password hashing algorithms like bcrypt are intentionally slow to resist brute-force.',
      },
      {
        question: 'What is the primary advantage of bcrypt over SHA-256 for password hashing?',
        options: [
          'bcrypt produces shorter hash values saving storage space',
          'bcrypt has a configurable work factor that makes it intentionally slow and adaptive',
          'bcrypt uses a secret key making it impossible to crack',
          'bcrypt is a newer algorithm and therefore more secure by default',
        ],
        correctIndex: 1,
        explanation:
          'bcrypt has a configurable cost factor (salt rounds) that controls how computationally expensive the hashing is. As hardware gets faster, you can increase the cost factor. This "adaptive" nature makes brute-force attacks consistently impractical even as computing power increases.',
      },
    ],
  },
  {
    id: 'A03',
    rank: 3,
    shortTitle: 'Injection',
    title: 'Injection',
    description:
      'Injection flaws occur when untrusted data is sent to an interpreter as part of a command or query. The attacker\'s hostile data can trick the interpreter into executing unintended commands or accessing data without proper authorization. SQL injection, NoSQL injection, OS command injection, and LDAP injection are among the most common forms. An application is vulnerable when user-supplied data is not validated, filtered, or sanitized, or when dynamic queries are used without context-aware escaping.',
    riskLevel: 'Critical',
    severity: 9.0,
    exampleAttack:
      'An attacker enters \' OR \'1\'=\'1\' -- into a login form\'s username field. The application constructs the SQL query: SELECT * FROM users WHERE username=\'\' OR \'1\'=\'1\' --\' AND password=\'...\'. The OR \'1\'=\'1\' always evaluates true, and -- comments out the rest, granting access without valid credentials.',
    impact:
      'Complete database compromise including data theft, modification, or deletion. OS command injection can lead to full server takeover. Injection attacks can bypass authentication, escalate privileges, and potentially pivot to other systems on the network.',
    realWorldImpact:
      'SQL injection has been behind numerous major breaches. The 2008 Heartland Payment Systems breach used SQL injection to steal 130 million credit card numbers, one of the largest data breaches in history at the time.',
    vulnerableCode: `// VULNERABLE: SQL Injection
app.get('/api/search', (req, res) => {
  const query = req.query.q;
  // User input directly concatenated into SQL!
  const sql = \`SELECT * FROM products
    WHERE name LIKE '%\${query}%'\`;
  db.query(sql);
  // Input: ' OR '1'='1' --
  // Becomes: SELECT * FROM products
  //   WHERE name LIKE '%' OR '1'='1' --%'
});

// VULNERABLE: Command Injection
app.get('/api/ping', (req, res) => {
  const host = req.query.host;
  // User input directly in shell command!
  exec(\`ping -c 4 \${host}\`);
  // Input: ; rm -rf / -- deletes everything!
});`,
    fixedCode: `// FIXED: Parameterized Query (Prepared Statement)
app.get('/api/search', (req, res) => {
  const query = req.query.q;
  // Parameters are safely escaped by the driver
  const sql = 'SELECT * FROM products WHERE name LIKE ?';
  db.query(sql, [\`%\${query}%\`]);
  // Input is ALWAYS treated as data, never as code
});

// FIXED: Input validation + allowlist approach
app.get('/api/ping', (req, res) => {
  const host = req.query.host;
  // Validate: only allow valid IP addresses
  const ipRegex = /^\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}$/;
  if (!ipRegex.test(host)) {
    return res.status(400).json({
      error: 'Invalid IP address format'
    });
  }
  // Additional: verify each octet is 0-255
  const octets = host.split('.').map(Number);
  if (octets.some(o => o < 0 || o > 255)) {
    return res.status(400).json({
      error: 'Invalid IP address range'
    });
  }
  execFile('ping', ['-c', '4', host]); // execFile prevents shell injection
});`,
    codeExplanation:
      'The vulnerable code concatenates user input directly into SQL queries and OS commands, allowing attackers to inject their own SQL/commands. The fixed version uses parameterized queries (prepared statements) that separate data from code, strict input validation with allowlists, and execFile instead of exec to avoid shell interpretation.',
    quiz: [
      {
        question: 'What is the most effective primary defense against SQL injection?',
        options: [
          'Input length validation and character escaping',
          'Parameterized queries (prepared statements) that separate code from data',
          'Web Application Firewall (WAF) rules',
          'Encoding all special characters in user input',
        ],
        correctIndex: 1,
        explanation:
          'Parameterized queries (prepared statements) are the gold standard defense. They send the SQL structure and user data separately to the database engine, ensuring user input is ALWAYS treated as data and never as executable SQL code, regardless of its content.',
      },
      {
        question: 'Why is using execFile() safer than exec() for running system commands in Node.js?',
        options: [
          'execFile() runs commands faster than exec()',
          'execFile() does not spawn a shell, so shell metacharacters like ; and | are not interpreted',
          'execFile() automatically encrypts command output',
          'execFile() only allows whitelisted commands to run',
        ],
        correctIndex: 1,
        explanation:
          'exec() spawns a shell (/bin/sh) which interprets metacharacters like ;, |, &&, enabling command chaining attacks. execFile() invokes the executable directly without a shell, so shell metacharacters in arguments are treated as literal strings, not command separators.',
      },
    ],
  },
  {
    id: 'A04',
    rank: 4,
    shortTitle: 'Insecure Design',
    title: 'Insecure Design',
    description:
      'Insecure design is a broad category representing different weaknesses expressed as missing or ineffective security controls and architectural flaws. It is distinct from implementation bugs: a secure design can still have implementation defects that lead to vulnerabilities, but an insecure design cannot be fixed by a perfect implementation alone. Threat modeling, secure design patterns, and reference architectures are needed to protect against this category.',
    riskLevel: 'High',
    severity: 8.0,
    exampleAttack:
      'An e-commerce site allows unlimited password reset attempts with a 4-digit SMS code. An attacker initiates a password reset for a victim and brute-forces all 10,000 possible codes within minutes, taking over the account. No rate limiting, no lockout, no escalating delay -- flaws in the design itself, not the code.',
    impact:
      'Business logic bypass, account takeover through design flaws, inability to resist automated attacks, and fundamental security weaknesses that require architectural redesign rather than code patches. These vulnerabilities are often more expensive and time-consuming to remediate than implementation bugs.',
    realWorldImpact:
      'Many social media platforms initially allowed unlimited password attempts with no rate limiting or account lockout -- an insecure design that enabled large-scale credential stuffing attacks affecting millions of accounts.',
    vulnerableCode: `// VULNERABLE: No rate limiting on login
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const user = db.findUser(username);
  if (user && verifyPassword(password, user.hash)) {
    return res.json({ token: generateToken(user) });
  }
  // Attackers can try unlimited passwords!
  // No delay, no lockout, no CAPTCHA
  res.status(401).json({ error: 'Invalid credentials' });
});

// VULNERABLE: No bot protection on registration
app.post('/api/register', (req, res) => {
  // Bots can create thousands of fake accounts
  const user = createUser(req.body);
  res.json(user);
});

// VULNERABLE: Password reset with weak token
app.post('/api/reset-password', (req, res) => {
  const code = Math.floor(Math.random() * 10000);
  // 4-digit code, no expiry, no attempt limit
  sendSMS(req.body.phone, code);
});`,
    fixedCode: `// FIXED: Rate limiting + progressive lockout
const loginAttempts = new Map();
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 min

app.post('/api/login', rateLimit({
  windowMs: 60000, max: 10 // 10 req/min per IP
}), (req, res) => {
  const { username, password } = req.body;
  const attempts = loginAttempts.get(username);

  if (attempts?.count >= MAX_ATTEMPTS) {
    const elapsed = Date.now() - attempts.lastAttempt;
    if (elapsed < LOCKOUT_DURATION) {
      return res.status(429).json({
        error: 'Account temporarily locked.',
        retryAfter: Math.ceil(
          (LOCKOUT_DURATION - elapsed) / 1000
        )
      });
    }
    loginAttempts.delete(username);
  }

  const user = db.findUser(username);
  if (user && verifyPassword(password, user.hash)) {
    loginAttempts.delete(username);
    return res.json({ token: generateToken(user) });
  }

  // Track failed attempt with timestamps
  const current = loginAttempts.get(username)
    || { count: 0 };
  loginAttempts.set(username, {
    count: current.count + 1,
    lastAttempt: Date.now()
  });
  res.status(401).json({ error: 'Invalid credentials' });
});`,
    codeExplanation:
      'The vulnerable code has no protections against brute force, automated attacks, or abuse of business logic. The fixed version implements multiple layers of defense-in-depth: IP-based rate limiting, per-account lockout after failed attempts, progressive delays, and secure token generation. These are design-level controls, not just code fixes.',
    quiz: [
      {
        question: 'What fundamentally distinguishes "insecure design" from implementation bugs?',
        options: [
          'Insecure design only affects web applications while bugs affect all software',
          'An insecure design cannot be fixed by perfect implementation alone -- it requires architectural changes',
          'Implementation bugs are always more severe than design flaws',
          'Insecure design is only found in open-source software projects',
        ],
        correctIndex: 1,
        explanation:
          'Insecure design refers to missing or flawed security controls at the architectural level. No amount of perfect coding can fix a fundamentally insecure design. For example, if the design lacks rate limiting entirely, the best implementation of the login endpoint is still vulnerable to brute force.',
      },
      {
        question: 'Which practice is most effective at preventing insecure design vulnerabilities?',
        options: [
          'Code review of all pull requests',
          'Automated static analysis scanning',
          'Threat modeling during the design phase before coding begins',
          'Penetration testing after deployment',
        ],
        correctIndex: 2,
        explanation:
          'Threat modeling during design identifies security requirements and potential attack vectors before any code is written. It ensures security controls (rate limiting, access control, input validation) are part of the architecture from the start, rather than bolted on afterward.',
      },
    ],
  },
  {
    id: 'A05',
    rank: 5,
    shortTitle: 'Security Misconfiguration',
    title: 'Security Misconfiguration',
    description:
      'The application might be vulnerable if it has missing appropriate security hardening across any part of the application stack, has unnecessary features enabled (ports, services, pages, accounts, privileges), default accounts and their passwords are still enabled and unchanged, error handling reveals stack traces or other overly informative error messages, or security settings in application servers, frameworks, libraries, and databases are not set to secure values.',
    riskLevel: 'High',
    severity: 7.5,
    exampleAttack:
      'A production server runs with debug mode enabled and default admin credentials (admin/admin). An attacker discovers the /admin panel through directory enumeration, logs in with default credentials, and gains full administrative access. Error pages display stack traces revealing the internal framework version, database type, and file paths.',
    impact:
      'Unauthorized access through default credentials, information leakage through verbose error messages, exposure of sensitive files through directory listing, and exploitation of unnecessary services. Often serves as a stepping stone for more severe attacks.',
    realWorldImpact:
      'In 2019, a misconfigured AWS S3 bucket at a major financial firm exposed 885 million records of mortgage documents, bank statements, and Social Security numbers to anyone with the direct URL.',
    vulnerableCode: `// VULNERABLE: Detailed error messages in production
app.use((err, req, res, next) => {
  // Exposes stack trace and internal details!
  res.status(500).json({
    error: err.message,
    stack: err.stack,
    query: req.query,
    dbConfig: db.config  // Leaks DB credentials!
  });
});

// VULNERABLE: Default and insecure configuration
const config = {
  debug: true,             // Debug mode in production!
  adminPassword: 'admin',  // Default credentials!
  cors: { origin: '*' },   // Open CORS to everyone!
  directoryListing: true,  // Exposes file structure!
  poweredBy: true,         // Reveals tech stack!
};`,
    fixedCode: `// FIXED: Minimal error information in production
app.use((err, req, res, next) => {
  // Log full details server-side for debugging
  logger.error({
    error: err.message,
    stack: err.stack,
    requestId: req.id,
    timestamp: new Date().toISOString()
  });
  // Return only minimal, safe info to client
  res.status(500).json({
    error: 'An internal error occurred.',
    requestId: req.id  // For support reference only
  });
});

// FIXED: Hardened configuration
const config = {
  debug: process.env.NODE_ENV !== 'production',
  adminPassword: process.env.ADMIN_PASSWORD,
  cors: {
    origin: ['https://myapp.com'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  },
  directoryListing: false,
  helmet: true,  // Adds security headers
};
// Also: disable X-Powered-By header
app.disable('x-powered-by');`,
    codeExplanation:
      'The vulnerable code exposes internal system details through verbose error messages, uses default credentials, has overly permissive CORS allowing any origin, and enables directory listing. The fixed version logs detailed errors server-side only, returns minimal information to clients, uses environment variables for secrets, restricts CORS origins, and disables features that reveal the technology stack.',
    quiz: [
      {
        question: 'Which of the following is a common security misconfiguration vulnerability?',
        options: [
          'Using HTTPS with TLS 1.3 for all communications',
          'Leaving default admin credentials (admin/admin) unchanged in production',
          'Implementing Content Security Policy (CSP) headers',
          'Disabling directory listing on production web servers',
        ],
        correctIndex: 1,
        explanation:
          'Default credentials are one of the most common and easily exploitable misconfigurations. Automated scanners routinely check for default username/password combinations across thousands of applications and devices. Always change default credentials before deployment.',
      },
      {
        question: 'Why should error messages in production be minimal and generic?',
        options: [
          'To save bandwidth and improve page load performance',
          'Because detailed errors only confuse end users',
          'To prevent attackers from discovering internal details like stack traces, database types, and file paths',
          'Because logging libraries cannot handle detailed error objects',
        ],
        correctIndex: 2,
        explanation:
          'Detailed error messages in production can reveal valuable information to attackers: framework versions (enabling targeted exploits), database types (informing injection attacks), file paths (aiding path traversal), and stack traces (exposing internal logic). Always log details server-side and return generic messages to clients.',
      },
    ],
  },
  {
    id: 'A06',
    rank: 6,
    shortTitle: 'Vulnerable Components',
    title: 'Vulnerable and Outdated Components',
    description:
      'Components such as libraries, frameworks, and other software modules run with the same privileges as the application. If a vulnerable component is exploited, such an attack can facilitate serious data loss or server takeover. Applications and APIs using components with known vulnerabilities may undermine application defenses and enable various attacks and impacts. You are vulnerable if you do not know the versions of all components you use, if the software is unsupported or out of date, or if you do not scan for vulnerabilities regularly.',
    riskLevel: 'High',
    severity: 7.5,
    exampleAttack:
      'An application uses lodash version 4.17.11, which has a known prototype pollution vulnerability (CVE-2019-10744). An attacker crafts a malicious JSON payload that exploits this vulnerability to modify Object.prototype, injecting properties that affect all objects in the application, potentially bypassing authentication or executing arbitrary code.',
    impact:
      'Exploitation of known CVEs in outdated components can lead to remote code execution, data breaches, denial of service, and complete system compromise. The severity depends on the specific vulnerability but can be critical since the exploit code is often publicly available.',
    realWorldImpact:
      'The 2017 Equifax breach exploited a known Apache Struts vulnerability (CVE-2017-5638) that had a patch available two months before the attack. Failure to update this single component exposed 147 million records and cost the company over $1.4 billion.',
    vulnerableCode: `// VULNERABLE: Outdated dependencies with known CVEs
// package.json
{
  "dependencies": {
    "lodash": "4.17.11",     // Prototype pollution
                              // CVE-2019-10744
    "express": "4.16.0",     // Multiple known vulns
    "jquery": "2.2.4",       // XSS vulnerabilities
    "moment": "2.19.1",      // ReDoS vulnerability
    "minimist": "1.2.0"      // Prototype pollution
  }
}

// No lockfile = inconsistent, unreproducible builds
// No audit process in the CI/CD pipeline
// No automated dependency update mechanism
// No monitoring for new CVE disclosures`,
    fixedCode: `// FIXED: Maintained and audited dependencies
// package.json
{
  "dependencies": {
    "lodash": "4.17.21",    // Latest patched version
    "express": "4.18.2",    // Current stable release
    "date-fns": "2.30.0",   // Modern moment.js replacement
    "dompurify": "3.0.5"    // For safe HTML sanitization
  },
  "scripts": {
    "audit": "npm audit --production",
    "audit:fix": "npm audit fix",
    "outdated": "npm outdated",
    "preinstall": "npx npm-force-resolutions"
  },
  "overrides": {
    "minimist": ">=1.2.6"
  }
}

// Use package-lock.json for reproducible builds
// Run 'npm audit' in CI/CD - fail on high/critical
// Enable Dependabot or Renovate for auto-updates
// Subscribe to security advisories for key deps
// Review changelogs before major version upgrades`,
    codeExplanation:
      'The vulnerable setup uses outdated packages with publicly known CVEs, has no process for tracking or updating dependencies, and lacks reproducible builds. The fixed version uses current patched versions, replaces abandoned libraries with maintained alternatives, includes audit scripts in CI/CD, uses lockfiles for reproducibility, and establishes automated dependency management.',
    quiz: [
      {
        question: 'What is the best practice for managing third-party dependency vulnerabilities?',
        options: [
          'Never update dependencies to avoid introducing breaking changes',
          'Only update dependencies when users report issues',
          'Automate dependency scanning and updates in CI/CD pipelines with tools like npm audit',
          'Remove all third-party dependencies and write everything from scratch',
        ],
        correctIndex: 2,
        explanation:
          'Automated scanning (npm audit, Dependabot, Snyk, Renovate) integrated into CI/CD catches known vulnerabilities early and continuously. Regular updates with automated testing keep components patched while catching breaking changes before deployment.',
      },
      {
        question: 'Why was the 2017 Equifax breach particularly embarrassing from a component management perspective?',
        options: [
          'The vulnerable component was custom-built internal software',
          'A patch for the exploited Apache Struts vulnerability was available two months before the breach',
          'The vulnerability was in an obscure component nobody could have known about',
          'The exploit required physical access to the server hardware',
        ],
        correctIndex: 1,
        explanation:
          'The Apache Struts vulnerability (CVE-2017-5638) had a public patch available in March 2017, but Equifax did not apply it until after the breach was discovered in September. This two-month window highlights the importance of timely patching and vulnerability monitoring processes.',
      },
    ],
  },
  {
    id: 'A07',
    rank: 7,
    shortTitle: 'Auth Failures',
    title: 'Identification and Authentication Failures',
    description:
      'Confirmation of the user\'s identity, authentication, and session management is critical to protect against authentication-related attacks. There may be authentication weaknesses if the application permits automated attacks such as credential stuffing, allows brute force, permits default or weak passwords, uses weak credential recovery processes, uses plain text or weakly hashed passwords, has missing or ineffective multi-factor authentication, or exposes session identifiers in the URL.',
    riskLevel: 'High',
    severity: 8.0,
    exampleAttack:
      'An attacker uses a list of 10 million username/password pairs from previous breaches (credential stuffing). The application has no rate limiting, no account lockout, and no MFA. The attacker automates login attempts and successfully compromises thousands of accounts where users reused passwords from other breached services.',
    impact:
      'Account takeover, identity theft, unauthorized access to sensitive functionality, and lateral movement within systems. Authentication failures can expose all users of a system and serve as entry points for more sophisticated attacks.',
    realWorldImpact:
      'The 2020 SolarWinds attack exploited authentication weaknesses in the supply chain, compromising 18,000 organizations including US government agencies through a tampered software update that bypassed authentication mechanisms.',
    vulnerableCode: `// VULNERABLE: Weak session management
app.post('/login', (req, res) => {
  const user = authenticate(req.body);
  if (user) {
    // Predictable session ID based on user data + time
    req.session.id = user.id + '_' + Date.now();
    // Session never expires
    // No secure/httpOnly/sameSite cookie flags
    res.cookie('session', req.session.id);
    res.json({ success: true });
  }
});

// VULNERABLE: No MFA, extremely weak password policy
function validatePassword(password) {
  return password.length >= 4; // Way too weak!
}

// VULNERABLE: Password in URL (visible in logs/history)
app.get('/login?user=admin&pass=secret', handler);`,
    fixedCode: `// FIXED: Secure session management
const crypto = require('crypto');

app.post('/login', rateLimit({
  windowMs: 60000, max: 5
}), (req, res) => {
  const user = authenticate(req.body);
  if (user) {
    // Cryptographically random session ID
    const sessionId = crypto.randomBytes(32)
      .toString('hex');
    // Session with strict expiration
    sessions.set(sessionId, {
      userId: user.id,
      createdAt: Date.now(),
      expiresAt: Date.now() + 30 * 60 * 1000,
      mfaVerified: false
    });
    res.cookie('session', sessionId, {
      httpOnly: true,      // No JS access (XSS protection)
      secure: true,        // HTTPS only
      sameSite: 'strict',  // CSRF protection
      maxAge: 30 * 60 * 1000 // 30 min expiry
    });
    res.json({ requireMFA: true });
  }
});

// FIXED: Strong password policy
function validatePassword(password) {
  return password.length >= 12
    && /[A-Z]/.test(password)
    && /[a-z]/.test(password)
    && /[0-9]/.test(password)
    && /[^A-Za-z0-9]/.test(password);
}`,
    codeExplanation:
      'The vulnerable code uses predictable session IDs (guessable), sets no security cookie flags (exposing sessions to XSS and CSRF), has a trivially weak password policy, and no multi-factor authentication. The fixed version generates cryptographically random session tokens, uses all security cookie flags (httpOnly, secure, sameSite), enforces session expiration, requires MFA, and mandates strong passwords.',
    quiz: [
      {
        question: 'Which cookie attribute prevents client-side JavaScript from accessing the session cookie?',
        options: [
          'Secure - requires HTTPS connection',
          'SameSite - prevents cross-site requests',
          'HttpOnly - blocks JavaScript access to the cookie',
          'Domain - restricts cookie to a specific domain',
        ],
        correctIndex: 2,
        explanation:
          'The HttpOnly flag tells the browser to prevent client-side JavaScript (document.cookie) from accessing the cookie. This significantly reduces the impact of XSS attacks, which commonly attempt to steal session tokens by reading cookies with injected scripts.',
      },
      {
        question: 'What is credential stuffing and why is it effective?',
        options: [
          'A technique to create strong passwords by combining multiple words together',
          'Using username/password pairs from previous breaches to access other services where users reused credentials',
          'A method of encrypting credentials before transmission over the network',
          'A brute-force attack that tries every possible password combination sequentially',
        ],
        correctIndex: 1,
        explanation:
          'Credential stuffing uses leaked username/password pairs from previous data breaches to attempt login on other services. It is effective because many users reuse the same password across multiple services. MFA, breach-password checking, and rate limiting are key defenses.',
      },
    ],
  },
  {
    id: 'A08',
    rank: 8,
    shortTitle: 'Integrity Failures',
    title: 'Software and Data Integrity Failures',
    description:
      'Software and data integrity failures relate to code and infrastructure that does not protect against integrity violations. This includes using software from untrusted sources, insecure CI/CD pipelines without verification, and auto-update functionality without sufficient integrity validation. Attackers can potentially upload their own updates to be distributed and run on all installations. Insecure deserialization is a subset where objects or data from untrusted sources are processed without validation.',
    riskLevel: 'High',
    severity: 7.8,
    exampleAttack:
      'An attacker compromises a widely-used NPM package by gaining access to the maintainer\'s account (which lacked MFA). They publish a new version containing a cryptocurrency miner that executes during npm install via a postinstall script. Thousands of applications pull the malicious update automatically, unknowingly running the attacker\'s code in their build pipelines.',
    impact:
      'Supply chain compromise affecting potentially millions of downstream users, backdoor installation through tampered updates, data manipulation through insecure deserialization, and CI/CD pipeline compromise enabling persistent unauthorized access.',
    realWorldImpact:
      'The 2020 SolarWinds supply chain attack injected malicious code into a legitimate software update, affecting 18,000 customers including major US government agencies. The attackers compromised the build pipeline to insert backdoors that went undetected for months.',
    vulnerableCode: `// VULNERABLE: Unverified deserialization
app.post('/api/import', (req, res) => {
  // Deserializing untrusted data without validation!
  const data = JSON.parse(req.body.payload);
  // No schema validation, no size limits
  db.importRecords(data);
  res.json({ imported: data.length });
});

// VULNERABLE: Loading scripts without integrity check
// <script src="https://cdn.example.com/lib.js">
// </script>
// If CDN is compromised, malicious code runs!

// VULNERABLE: Auto-update without signature verification
async function autoUpdate() {
  const update = await fetch(updateURL);
  // Installing without verifying digital signature!
  await install(await update.blob());
}`,
    fixedCode: `// FIXED: Schema-validated deserialization
const Joi = require('joi');
const importSchema = Joi.array().items(
  Joi.object({
    id: Joi.string().uuid().required(),
    name: Joi.string().max(255).required(),
    value: Joi.number().required()
  })
).max(1000); // Limit array size to prevent DoS

app.post('/api/import', (req, res) => {
  const parsed = JSON.parse(req.body.payload);
  const { error, value } = importSchema.validate(parsed);
  if (error) return res.status(400)
    .json({ error: error.message });
  db.importRecords(value);
  res.json({ imported: value.length });
});

// FIXED: Subresource Integrity (SRI) for CDN scripts
// <script src="https://cdn.example.com/lib.js"
//   integrity="sha384-oqVuAfXRKap7fdgcCY..."
//   crossorigin="anonymous"></script>

// FIXED: Cryptographic signature verification for updates
async function autoUpdate() {
  const update = await fetch(updateURL);
  const signature = await fetch(signatureURL);
  if (!crypto.verify('sha256', update, publicKey, signature)) {
    throw new Error('Update signature verification failed');
  }
  await install(await update.blob());
}`,
    codeExplanation:
      'The vulnerable code blindly trusts incoming data (no schema validation), external CDN resources (no integrity check), and software updates (no signature verification). The fixed version validates all incoming data against strict schemas with size limits, uses SRI hashes to verify CDN-loaded scripts have not been tampered with, and requires cryptographic signature verification before installing any updates.',
    quiz: [
      {
        question: 'What is Subresource Integrity (SRI) and what does it protect against?',
        options: [
          'An encryption method for JavaScript files during transmission',
          'A browser feature that verifies fetched resources have not been tampered with using cryptographic hashes',
          'A JavaScript framework for client-side data validation',
          'A server-side middleware for protecting API endpoints',
        ],
        correctIndex: 1,
        explanation:
          'SRI allows browsers to verify that resources fetched from CDNs or third-party servers have not been modified. The browser computes a hash of the downloaded file and compares it to the expected hash in the integrity attribute. If they do not match, the browser refuses to execute the script.',
      },
      {
        question: 'In a supply chain attack on a package registry, what is the most critical defense?',
        options: [
          'Using a package-lock.json file for reproducible builds',
          'Requiring MFA for package maintainer accounts and verifying package signatures',
          'Only using packages with more than 1000 GitHub stars',
          'Downloading packages directly from GitHub instead of npm',
        ],
        correctIndex: 1,
        explanation:
          'MFA for maintainer accounts prevents unauthorized package publishes (a common attack vector), and signature verification ensures packages have not been tampered with. Lock files help with reproducibility but do not prevent a compromised publish from affecting new installs.',
      },
    ],
  },
  {
    id: 'A09',
    rank: 9,
    shortTitle: 'Logging Failures',
    title: 'Security Logging and Monitoring Failures',
    description:
      'Without logging and monitoring, breaches cannot be detected. Insufficient logging, detection, monitoring, and active response occurs at any time when auditable events such as logins, failed logins, and high-value transactions are not logged, warnings and errors generate no or inadequate log messages, logs are only stored locally, appropriate alerting thresholds and response escalation processes are not in place, or penetration testing and scans by DAST tools do not trigger alerts.',
    riskLevel: 'Medium',
    severity: 6.5,
    exampleAttack:
      'An attacker performs a credential stuffing attack with 50,000 login attempts over several hours. Because the application only logs successful logins (not failures) and has no alerting on anomalous patterns, the attack goes completely undetected. The attacker successfully compromises 200 accounts and exfiltrates data over several weeks before anyone notices.',
    impact:
      'Inability to detect active attacks, delayed incident response (average breach detection time is 287 days), loss of forensic evidence for investigation, failure to meet compliance requirements (PCI-DSS, HIPAA, GDPR), and inability to identify the scope of a breach after discovery.',
    realWorldImpact:
      'The 2013 Target breach went undetected for weeks despite security tools flagging suspicious activity. Inadequate monitoring of alerts and response processes allowed attackers to steal 40 million credit card numbers and 70 million personal records.',
    vulnerableCode: `// VULNERABLE: No logging of security events
app.post('/login', (req, res) => {
  const user = authenticate(req.body);
  if (user) {
    res.json({ token: generateToken(user) });
  } else {
    // Failed login: not logged at all!
    // No alerting on brute force patterns!
    res.status(401).json({ error: 'Invalid' });
  }
});

// VULNERABLE: Logging sensitive data in plaintext
app.post('/api/payment', (req, res) => {
  console.log('Payment request:', req.body);
  // Logs now contain:
  // { cardNumber: '4111111111111111',
  //   cvv: '123', expiry: '12/25',
  //   password: 'userSecret123' }
  // Sensitive data permanently in log files!
});`,
    fixedCode: `// FIXED: Comprehensive security event logging
const logger = require('./secureLogger');

app.post('/login', (req, res) => {
  const user = authenticate(req.body);
  if (user) {
    logger.info('AUTH_SUCCESS', {
      userId: user.id,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      timestamp: new Date().toISOString()
    });
    res.json({ token: generateToken(user) });
  } else {
    logger.warn('AUTH_FAILURE', {
      attemptedUsername: req.body.username,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      timestamp: new Date().toISOString()
    });
    // Trigger alert if pattern suggests brute force
    checkAndAlertBruteForce(req.body.username, req.ip);
    res.status(401).json({ error: 'Invalid' });
  }
});

// FIXED: Redacting sensitive data from logs
app.post('/api/payment', (req, res) => {
  logger.info('PAYMENT_REQUEST', {
    userId: req.user.id,
    amount: req.body.amount,
    currency: req.body.currency,
    cardLast4: req.body.cardNumber.slice(-4),
    // NEVER log full card numbers, CVV, or passwords
    timestamp: new Date().toISOString()
  });
});`,
    codeExplanation:
      'The vulnerable code completely ignores security events (no logging of failed logins) and inadvertently logs highly sensitive data (full credit card numbers, CVV, passwords) in plaintext. The fixed version logs all security-relevant events with contextual metadata (IP, user agent, timestamps), implements automated alerting for suspicious patterns, and carefully redacts sensitive fields to only include the minimum necessary information (e.g., last 4 digits of card).',
    quiz: [
      {
        question: 'Which security events should always be logged for effective monitoring?',
        options: [
          'Only successful user logins to track active sessions',
          'Only application errors and unhandled exceptions',
          'Authentication attempts (both success and failure), access control failures, and input validation failures',
          'Only events that are manually flagged by developers in code',
        ],
        correctIndex: 2,
        explanation:
          'Comprehensive security logging must cover all authentication events (successes reveal account compromise, failures reveal brute force), authorization failures (reveal escalation attempts), and input validation failures (reveal injection/XSS attempts). Both successes and failures together provide the context needed to detect and investigate security incidents.',
      },
      {
        question: 'Why is logging full credit card numbers in application logs a serious security issue?',
        options: [
          'Credit card numbers take up too much storage space in log files',
          'It violates PCI-DSS compliance and creates an additional attack surface where card data can be stolen from log files',
          'Log files cannot properly encode numeric sequences longer than 10 digits',
          'It slows down log ingestion and search performance significantly',
        ],
        correctIndex: 1,
        explanation:
          'Logging full card numbers violates PCI-DSS (Payment Card Industry Data Security Standard) requirements and creates a secondary location where sensitive data can be stolen. Log files often have weaker access controls than databases and may be transmitted to third-party logging services. Always redact to show only the last 4 digits.',
      },
    ],
  },
  {
    id: 'A10',
    rank: 10,
    shortTitle: 'SSRF',
    title: 'Server-Side Request Forgery (SSRF)',
    description:
      'SSRF flaws occur whenever a web application fetches a remote resource without validating the user-supplied URL. It allows an attacker to coerce the application to send a crafted request to an unexpected destination, even when protected by a firewall, VPN, or another type of network access control list. As modern web applications provide end-users with convenient features such as URL previews, webhook delivery, and file imports from URLs, the incidence of SSRF is increasing.',
    riskLevel: 'High',
    severity: 8.5,
    exampleAttack:
      'A web application has a "Preview URL" feature. An attacker submits the URL http://169.254.169.254/latest/meta-data/iam/security-credentials/ which targets the AWS EC2 metadata service. The server fetches this URL internally (bypassing firewalls that block external access to metadata) and returns the IAM role credentials to the attacker, who then uses them to access S3 buckets, databases, and other AWS services.',
    impact:
      'Access to internal services behind firewalls, cloud metadata credential theft (AWS/GCP/Azure), internal network port scanning and service discovery, reading local files through file:// protocol, and pivoting to attack internal infrastructure that is not directly internet-accessible.',
    realWorldImpact:
      'The 2019 Capital One breach was enabled by SSRF, where the attacker exploited a misconfigured WAF to make requests to the AWS metadata service (169.254.169.254), obtaining IAM credentials that gave access to S3 buckets containing 106 million customer records.',
    vulnerableCode: `// VULNERABLE: Unvalidated URL fetching
app.get('/api/preview', async (req, res) => {
  const url = req.query.url;
  // Fetches ANY URL the user provides!
  // Including internal network addresses!
  const response = await fetch(url);
  const html = await response.text();
  res.json({ preview: html });
});

// Attacker exploits with:
// /api/preview?url=http://169.254.169.254/
//   latest/meta-data/iam/security-credentials/
// This accesses AWS internal metadata service!

// Also exploitable for internal network scanning:
// /api/preview?url=http://192.168.1.1/admin
// /api/preview?url=http://10.0.0.50:3306/
// /api/preview?url=file:///etc/passwd`,
    fixedCode: `// FIXED: URL validation and SSRF prevention
const { URL } = require('url');
const dns = require('dns').promises;

const BLOCKED_RANGES = [
  '10.0.0.0/8',       // Private Class A
  '172.16.0.0/12',    // Private Class B
  '192.168.0.0/16',   // Private Class C
  '169.254.0.0/16',   // Link-local / AWS metadata
  '127.0.0.0/8',      // Loopback
  '0.0.0.0/8',        // Current network
  '100.64.0.0/10',    // Shared address space
];

async function isUrlSafe(urlString) {
  const parsed = new URL(urlString);
  // 1. Only allow HTTP and HTTPS protocols
  if (!['http:', 'https:'].includes(parsed.protocol)) {
    return false; // Block file://, gopher://, etc.
  }
  // 2. Resolve DNS to check actual destination IP
  const addresses = await dns.resolve4(parsed.hostname);
  for (const addr of addresses) {
    if (isInBlockedRange(addr, BLOCKED_RANGES)) {
      return false; // Block internal/private IPs
    }
  }
  return true;
}

app.get('/api/preview', async (req, res) => {
  if (!await isUrlSafe(req.query.url)) {
    return res.status(400).json({
      error: 'URL not allowed'
    });
  }
  const resp = await fetch(req.query.url, {
    redirect: 'error', // Prevent redirect bypass
    timeout: 5000,
    headers: { 'User-Agent': 'URLPreview/1.0' }
  });
  res.json({ preview: await resp.text() });
});`,
    codeExplanation:
      'The vulnerable code fetches any user-provided URL without any validation, including internal network addresses (192.168.x.x, 10.x.x.x), cloud metadata endpoints (169.254.169.254), and even local files (file:// protocol). The fixed version validates URLs by restricting allowed protocols, resolving DNS to detect internal IP targets, blocking all private/reserved IP ranges, preventing redirect-based bypasses, and applying request timeouts.',
    quiz: [
      {
        question: 'What makes the AWS metadata endpoint (169.254.169.254) a prime SSRF target?',
        options: [
          'It requires no authentication and provides IAM credentials, access keys, and instance configuration data',
          'It is publicly accessible from any IP address on the internet',
          'It stores encrypted user passwords that can be decrypted offline',
          'It provides direct SSH access to the EC2 server instance',
        ],
        correctIndex: 0,
        explanation:
          'The AWS EC2 metadata service at 169.254.169.254 is accessible without authentication from within the instance. It provides IAM role credentials, access keys, instance identity documents, and user data scripts. SSRF allows external attackers to access this internal-only service through the application, effectively stealing cloud credentials.',
      },
      {
        question: 'Why must SSRF protection include DNS resolution checks, not just URL string matching?',
        options: [
          'DNS resolution is faster than string matching for URL validation',
          'Attackers can use DNS rebinding, shortened URLs, or special encodings to bypass string-based URL filters',
          'String matching cannot handle HTTPS URLs properly',
          'DNS checks are required by HTTP specification RFCs',
        ],
        correctIndex: 1,
        explanation:
          'Attackers bypass string-based filters using: DNS rebinding (domain resolves to internal IP), URL encoding (%31%36%39.%32%35%34...), decimal IP notation (2852039166 = 169.254.169.254), IPv6 mapped addresses, and redirects through allowed domains. DNS resolution reveals the actual destination IP regardless of how the URL is obfuscated.',
      },
    ],
  },
];

// ───────────────────────── History Data ─────────────────────────

const OWASP_HISTORY = [
  {
    year: '2013',
    changes: [
      'A1: Injection remained the top threat',
      'A2: Broken Authentication and Session Management',
      'A3: Cross-Site Scripting (XSS)',
      'A4: Insecure Direct Object References',
      'A8: Cross-Site Request Forgery (CSRF) still listed',
      'A10: Unvalidated Redirects and Forwards included',
    ],
  },
  {
    year: '2017',
    changes: [
      'A1: Injection still at the top for 3rd consecutive list',
      'A4: XML External Entities (XXE) was added as a new entry',
      'A7: Cross-Site Scripting (XSS) dropped from #3 to #7',
      'A8: Insecure Deserialization added as new entry',
      'A10: Insufficient Logging & Monitoring added (new)',
      'CSRF removed from Top 10 (frameworks now include protection by default)',
      'Unvalidated Redirects removed from Top 10',
    ],
  },
  {
    year: '2021',
    changes: [
      'A01: Broken Access Control moved from #5 to #1 (94% of apps tested had some form)',
      'A02: Cryptographic Failures (renamed from Sensitive Data Exposure)',
      'A03: Injection dropped from #1 to #3 (XSS now merged here)',
      'A04: Insecure Design is entirely new -- focuses on design flaws vs. implementation bugs',
      'A06: Vulnerable Components moved up from #9 (renamed for clarity)',
      'A08: Software and Data Integrity Failures is new (includes Insecure Deserialization from 2017)',
      'A10: Server-Side Request Forgery (SSRF) added based on community survey',
      'XXE merged into Security Misconfiguration (A05)',
    ],
  },
];

// ───────────────────────── Helper Functions ─────────────────────────

const riskColor = (level: string): string => {
  switch (level) {
    case 'Critical':
      return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800';
    case 'High':
      return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800';
    case 'Medium':
      return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800';
    default:
      return '';
  }
};

const severityBarColor = (severity: number): string => {
  if (severity >= 9.0) return 'bg-red-500';
  if (severity >= 7.5) return 'bg-orange-500';
  if (severity >= 6.0) return 'bg-yellow-500';
  return 'bg-green-500';
};

// ───────────────────────── Component ─────────────────────────

export const OWASPTop10: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('learn');
  const [expandedLearnSection, setExpandedLearnSection] = useState<string | null>('what-is-owasp');
  const [expandedVuln, setExpandedVuln] = useState<OWASPId | null>(null);

  // Sandbox state
  const [sandboxView, setSandboxView] = useState<SandboxView>('list');
  const [selectedEntry, setSelectedEntry] = useState<OWASPId | null>(null);
  const [codeView, setCodeView] = useState<CodeView>('side-by-side');
  const [studiedVulns, setStudiedVulns] = useState<Set<OWASPId>>(new Set());
  const [quizzedVulns, setQuizzedVulns] = useState<Set<OWASPId>>(new Set());

  // Quiz state
  const [quizMode, setQuizMode] = useState(false);
  const [quizEntryId, setQuizEntryId] = useState<OWASPId | null>(null);
  const [quizCurrentQ, setQuizCurrentQ] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<(number | null)[]>([null, null]);
  const [quizRevealed, setQuizRevealed] = useState<boolean[]>([false, false]);

  const entry = selectedEntry ? OWASP_DATA.find(e => e.id === selectedEntry)! : null;
  const totalStudied = studiedVulns.size;
  const totalQuizzed = quizzedVulns.size;

  const toggleLearnSection = useCallback((section: string) => {
    setExpandedLearnSection(prev => (prev === section ? null : section));
  }, []);

  const toggleVuln = useCallback((id: OWASPId) => {
    setExpandedVuln(prev => (prev === id ? null : id));
  }, []);

  const openDetail = useCallback((id: OWASPId) => {
    setSelectedEntry(id);
    setSandboxView('detail');
    setCodeView('side-by-side');
    setQuizMode(false);
    setStudiedVulns(prev => new Set([...prev, id]));
  }, []);

  const backToList = useCallback(() => {
    setSelectedEntry(null);
    setSandboxView('list');
    setQuizMode(false);
    setQuizEntryId(null);
  }, []);

  const startQuiz = useCallback((id: OWASPId) => {
    setQuizMode(true);
    setQuizEntryId(id);
    setQuizCurrentQ(0);
    setQuizAnswers([null, null]);
    setQuizRevealed([false, false]);
  }, []);

  const handleQuizAnswer = useCallback((optIdx: number) => {
    if (quizRevealed[quizCurrentQ]) return;
    setQuizAnswers(prev => {
      const next = [...prev];
      next[quizCurrentQ] = optIdx;
      return next;
    });
    setQuizRevealed(prev => {
      const next = [...prev];
      next[quizCurrentQ] = true;
      return next;
    });
  }, [quizCurrentQ, quizRevealed]);

  const nextQuizQuestion = useCallback(() => {
    if (quizCurrentQ < 1) {
      setQuizCurrentQ(1);
    } else {
      if (quizEntryId) {
        setQuizzedVulns(prev => new Set([...prev, quizEntryId]));
      }
      setQuizMode(false);
      setQuizEntryId(null);
    }
  }, [quizCurrentQ, quizEntryId]);

  const resetProgress = useCallback(() => {
    setStudiedVulns(new Set());
    setQuizzedVulns(new Set());
  }, []);

  // ───────── Render Learn Tab ─────────

  const renderLearnTab = () => (
    <div className="space-y-3">
      {/* What is OWASP */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <button
          onClick={() => toggleLearnSection('what-is-owasp')}
          className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
        >
          <div className="flex items-center gap-2">
            <BookOpen size={16} className="text-red-500 flex-shrink-0" />
            <span className="font-bold text-sm text-gray-800 dark:text-gray-200">What is OWASP?</span>
          </div>
          {expandedLearnSection === 'what-is-owasp' ? (
            <ChevronDown size={16} className="text-gray-400" />
          ) : (
            <ChevronRight size={16} className="text-gray-400" />
          )}
        </button>
        {expandedLearnSection === 'what-is-owasp' && (
          <div className="px-4 pb-4 border-t border-gray-100 dark:border-gray-700">
            <div className="mt-3 space-y-3">
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                The <strong>Open Web Application Security Project (OWASP)</strong> is a nonprofit foundation that works to improve the security of software. Through community-led open-source software projects, hundreds of local chapters worldwide, tens of thousands of members, and leading educational and training conferences, the OWASP Foundation is the source for developers and technologists to secure the web.
              </p>
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                Founded in 2001, OWASP operates as a community of security professionals and enthusiasts who contribute free resources, tools, documentation, and standards. Their work is freely available and accessible, making it a cornerstone resource for application security.
              </p>
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">Key OWASP Projects:</p>
                <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                  <li className="flex items-start gap-1.5"><span className="text-red-500 mt-0.5">&#8226;</span> <span><strong>OWASP Top 10</strong> -- The most critical web application security risks</span></li>
                  <li className="flex items-start gap-1.5"><span className="text-red-500 mt-0.5">&#8226;</span> <span><strong>OWASP ZAP</strong> -- Free security testing tool for finding vulnerabilities</span></li>
                  <li className="flex items-start gap-1.5"><span className="text-red-500 mt-0.5">&#8226;</span> <span><strong>OWASP ASVS</strong> -- Application Security Verification Standard</span></li>
                  <li className="flex items-start gap-1.5"><span className="text-red-500 mt-0.5">&#8226;</span> <span><strong>OWASP Testing Guide</strong> -- Comprehensive web app testing methodology</span></li>
                  <li className="flex items-start gap-1.5"><span className="text-red-500 mt-0.5">&#8226;</span> <span><strong>OWASP Cheat Sheet Series</strong> -- Concise best practice guides for developers</span></li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Why Top 10 Matters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <button
          onClick={() => toggleLearnSection('why-top10')}
          className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Shield size={16} className="text-red-500 flex-shrink-0" />
            <span className="font-bold text-sm text-gray-800 dark:text-gray-200">Why the Top 10 Matters</span>
          </div>
          {expandedLearnSection === 'why-top10' ? (
            <ChevronDown size={16} className="text-gray-400" />
          ) : (
            <ChevronRight size={16} className="text-gray-400" />
          )}
        </button>
        {expandedLearnSection === 'why-top10' && (
          <div className="px-4 pb-4 border-t border-gray-100 dark:border-gray-700">
            <div className="mt-3 space-y-3">
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                The OWASP Top 10 is the most widely recognized document for web application security awareness. It represents a broad consensus about the most critical security risks to web applications, compiled from data across hundreds of organizations and thousands of real-world applications.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3 border border-red-200 dark:border-red-800">
                  <p className="text-xs font-bold text-red-700 dark:text-red-400 mb-1">Industry Standard</p>
                  <p className="text-xs text-red-600 dark:text-red-300">Referenced by PCI-DSS, NIST, HIPAA, and countless regulatory frameworks as a baseline for web security.</p>
                </div>
                <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-3 border border-orange-200 dark:border-orange-800">
                  <p className="text-xs font-bold text-orange-700 dark:text-orange-400 mb-1">Awareness Tool</p>
                  <p className="text-xs text-orange-600 dark:text-orange-300">Helps development teams understand the most prevalent attacks and prioritize security efforts where they matter most.</p>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
                  <p className="text-xs font-bold text-blue-700 dark:text-blue-400 mb-1">Data-Driven</p>
                  <p className="text-xs text-blue-600 dark:text-blue-300">Built from real vulnerability data: the 2021 edition analyzed data from over 500,000 applications across hundreds of organizations.</p>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 border border-green-200 dark:border-green-800">
                  <p className="text-xs font-bold text-green-700 dark:text-green-400 mb-1">Career Essential</p>
                  <p className="text-xs text-green-600 dark:text-green-300">Knowledge of the OWASP Top 10 is expected in security roles and increasingly in all software development positions.</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Overview of All 10 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <button
          onClick={() => toggleLearnSection('overview')}
          className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
        >
          <div className="flex items-center gap-2">
            <FileWarning size={16} className="text-red-500 flex-shrink-0" />
            <span className="font-bold text-sm text-gray-800 dark:text-gray-200">The 10 Vulnerabilities (2021 Edition)</span>
          </div>
          {expandedLearnSection === 'overview' ? (
            <ChevronDown size={16} className="text-gray-400" />
          ) : (
            <ChevronRight size={16} className="text-gray-400" />
          )}
        </button>
        {expandedLearnSection === 'overview' && (
          <div className="px-4 pb-4 border-t border-gray-100 dark:border-gray-700">
            <div className="mt-3 space-y-2">
              {OWASP_DATA.map(v => (
                <div key={v.id} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                  <button
                    onClick={() => toggleVuln(v.id)}
                    className="w-full flex items-center justify-between px-3 py-2.5 text-left hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="flex-shrink-0 w-9 h-7 rounded bg-red-600 text-white text-[10px] font-black flex items-center justify-center">
                        {v.id}
                      </span>
                      <span className="font-semibold text-xs text-gray-800 dark:text-gray-200 truncate">{v.title}</span>
                      <span className={`flex-shrink-0 px-1.5 py-0.5 text-[9px] font-bold rounded border ${riskColor(v.riskLevel)}`}>
                        {v.riskLevel}
                      </span>
                    </div>
                    {expandedVuln === v.id ? (
                      <ChevronDown size={14} className="text-gray-400 flex-shrink-0" />
                    ) : (
                      <ChevronRight size={14} className="text-gray-400 flex-shrink-0" />
                    )}
                  </button>
                  {expandedVuln === v.id && (
                    <div className="px-3 pb-3 border-t border-gray-100 dark:border-gray-700 space-y-2.5 mt-0">
                      <div className="mt-2.5">
                        <p className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Description</p>
                        <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">{v.description}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div>
                          <p className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Severity</p>
                          <div className="flex items-center gap-1.5">
                            <div className="w-20 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full ${severityBarColor(v.severity)}`} style={{ width: `${v.severity * 10}%` }} />
                            </div>
                            <span className="text-[10px] font-mono text-gray-500">{v.severity}/10</span>
                          </div>
                        </div>
                      </div>
                      <div>
                        <p className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Example Attack Scenario</p>
                        <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">{v.exampleAttack}</p>
                      </div>
                      <div>
                        <p className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Impact</p>
                        <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">{v.impact}</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* History */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <button
          onClick={() => toggleLearnSection('history')}
          className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
        >
          <div className="flex items-center gap-2">
            <History size={16} className="text-red-500 flex-shrink-0" />
            <span className="font-bold text-sm text-gray-800 dark:text-gray-200">Evolution: 2013 to 2021</span>
          </div>
          {expandedLearnSection === 'history' ? (
            <ChevronDown size={16} className="text-gray-400" />
          ) : (
            <ChevronRight size={16} className="text-gray-400" />
          )}
        </button>
        {expandedLearnSection === 'history' && (
          <div className="px-4 pb-4 border-t border-gray-100 dark:border-gray-700">
            <div className="mt-3 space-y-3">
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                The OWASP Top 10 is updated approximately every 3-4 years to reflect the evolving threat landscape. Each edition is based on fresh data collection and community input, showing how attack patterns and defense priorities shift over time.
              </p>
              <div className="space-y-3">
                {OWASP_HISTORY.map(h => (
                  <div key={h.year} className="relative">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-14 h-7 rounded-lg bg-red-600 text-white text-xs font-black flex items-center justify-center">
                        {h.year}
                      </div>
                      <div className="flex-1">
                        <ul className="space-y-1">
                          {h.changes.map((change, i) => (
                            <li key={i} className="text-xs text-gray-700 dark:text-gray-300 flex items-start gap-1.5">
                              <span className="text-red-400 mt-0.5 flex-shrink-0">&#8227;</span>
                              <span>{change}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                  <strong>Key trend:</strong> The 2021 list shows a clear shift from pure implementation bugs toward design-level and architectural security concerns. The additions of Insecure Design (A04) and SSRF (A10) reflect the growing complexity of modern application architectures including cloud services, microservices, and third-party integrations.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // ───────── Render Sandbox List ─────────

  const renderSandboxList = () => (
    <div className="space-y-3">
      {/* Progress overview */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-gray-700 dark:text-gray-300">Your Progress</span>
          {(totalStudied > 0 || totalQuizzed > 0) && (
            <button
              onClick={resetProgress}
              className="flex items-center gap-1 text-[10px] text-gray-400 hover:text-red-500 transition-colors"
            >
              <RotateCcw size={10} />
              Reset
            </button>
          )}
        </div>
        <div className="flex gap-4">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-gray-500 dark:text-gray-400">Studied</span>
              <span className="text-[10px] font-mono text-gray-500">{totalStudied}/10</span>
            </div>
            <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-all duration-500"
                style={{ width: `${(totalStudied / 10) * 100}%` }}
              />
            </div>
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-gray-500 dark:text-gray-400">Quizzed</span>
              <span className="text-[10px] font-mono text-gray-500">{totalQuizzed}/10</span>
            </div>
            <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 rounded-full transition-all duration-500"
                style={{ width: `${(totalQuizzed / 10) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Vulnerability cards */}
      <div className="space-y-2">
        {OWASP_DATA.map(e => {
          const isStudied = studiedVulns.has(e.id);
          const isQuizzed = quizzedVulns.has(e.id);
          return (
            <button
              key={e.id}
              onClick={() => openDetail(e.id)}
              className={`w-full text-left p-3 rounded-xl border transition-all hover:shadow-md ${
                isQuizzed
                  ? 'bg-green-50 dark:bg-green-900/10 border-green-300 dark:border-green-700'
                  : isStudied
                    ? 'bg-blue-50 dark:bg-blue-900/10 border-blue-300 dark:border-blue-700'
                    : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-red-300 dark:hover:border-red-600'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-red-600 text-white flex items-center justify-center font-black text-sm">
                  {e.id}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <span className="font-bold text-sm text-gray-800 dark:text-gray-200">{e.title}</span>
                    <span className={`flex-shrink-0 px-2 py-0.5 text-[10px] font-bold rounded-full border ${riskColor(e.riskLevel)}`}>
                      {e.riskLevel}
                    </span>
                    {isStudied && !isQuizzed && (
                      <span className="flex items-center gap-0.5 text-[10px] text-blue-500 font-semibold">
                        <Eye size={10} /> Studied
                      </span>
                    )}
                    {isQuizzed && (
                      <span className="flex items-center gap-0.5 text-[10px] text-green-500 font-semibold">
                        <Award size={10} /> Complete
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-1">{e.description}</p>
                </div>
                <div className="flex-shrink-0 w-16">
                  <div className="text-[10px] text-gray-500 text-right mb-0.5 font-mono">{e.severity}/10</div>
                  <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${severityBarColor(e.severity)}`}
                      style={{ width: `${e.severity * 10}%` }}
                    />
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );

  // ───────── Render Sandbox Detail ─────────

  const renderSandboxDetail = () => {
    if (!entry) return null;

    // If in quiz mode, render quiz
    if (quizMode && quizEntryId) {
      const qEntry = OWASP_DATA.find(x => x.id === quizEntryId)!;
      const q = qEntry.quiz[quizCurrentQ];
      const isRevealed = quizRevealed[quizCurrentQ];
      const selectedAnswer = quizAnswers[quizCurrentQ];

      return (
        <div className="max-w-2xl mx-auto space-y-4">
          <button
            onClick={() => setQuizMode(false)}
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
          >
            <ArrowLeft size={12} />
            Back to {qEntry.shortTitle}
          </button>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-red-600 dark:text-red-400">
                {qEntry.id}: {qEntry.title}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Question {quizCurrentQ + 1} of 2
              </span>
            </div>

            <div className="w-full h-1 bg-gray-200 dark:bg-gray-700 rounded-full mb-4 overflow-hidden">
              <div
                className="h-full bg-red-500 rounded-full transition-all duration-300"
                style={{ width: `${((quizCurrentQ + (isRevealed ? 1 : 0)) / 2) * 100}%` }}
              />
            </div>

            <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-4">{q.question}</h3>

            <div className="space-y-2">
              {q.options.map((opt, idx) => {
                let btnStyle = 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 hover:border-red-300 dark:hover:border-red-600 cursor-pointer';
                if (isRevealed) {
                  if (idx === q.correctIndex) {
                    btnStyle = 'bg-green-50 dark:bg-green-900/20 border-green-400 dark:border-green-600';
                  } else if (idx === selectedAnswer && idx !== q.correctIndex) {
                    btnStyle = 'bg-red-50 dark:bg-red-900/20 border-red-400 dark:border-red-600';
                  } else {
                    btnStyle = 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 opacity-50';
                  }
                }

                return (
                  <button
                    key={idx}
                    onClick={() => handleQuizAnswer(idx)}
                    disabled={isRevealed}
                    className={`w-full text-left p-3 rounded-lg border transition-all text-sm text-gray-800 dark:text-gray-200 ${btnStyle}`}
                  >
                    <div className="flex items-start gap-2">
                      <span className="font-mono text-xs text-gray-400 mt-0.5 flex-shrink-0">
                        {String.fromCharCode(65 + idx)}.
                      </span>
                      <span className="flex-1">{opt}</span>
                      {isRevealed && idx === q.correctIndex && (
                        <CheckCircle2 size={16} className="text-green-500 flex-shrink-0 mt-0.5" />
                      )}
                      {isRevealed && idx === selectedAnswer && idx !== q.correctIndex && (
                        <XCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {isRevealed && (
              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
                <div className="flex items-start gap-2">
                  <AlertTriangle size={14} className="text-blue-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-blue-800 dark:text-blue-300 leading-relaxed">{q.explanation}</p>
                </div>
              </div>
            )}

            {isRevealed && (
              <div className="mt-3 flex justify-end">
                <button
                  onClick={nextQuizQuestion}
                  className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold transition-colors"
                >
                  {quizCurrentQ < 1 ? 'Next Question' : 'Complete Quiz'}
                </button>
              </div>
            )}
          </div>
        </div>
      );
    }

    // Detail view
    return (
      <div className="max-w-4xl mx-auto space-y-4">
        <button
          onClick={backToList}
          className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
        >
          <ArrowLeft size={12} />
          Back to list
        </button>

        {/* Title card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-red-600 text-white flex items-center justify-center font-black text-base">
              {entry.id}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <h3 className="font-bold text-base text-gray-800 dark:text-gray-200">{entry.title}</h3>
                <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${riskColor(entry.riskLevel)}`}>
                  {entry.riskLevel}
                </span>
                <span className="text-xs font-mono text-gray-500">Severity: {entry.severity}/10</span>
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{entry.description}</p>
            </div>
          </div>

          {/* Severity visualization */}
          <div className="mt-3">
            <div className="flex items-center gap-1">
              {Array.from({ length: 10 }, (_, i) => (
                <div
                  key={i}
                  className={`flex-1 h-3 rounded-sm ${
                    i < Math.round(entry.severity)
                      ? severityBarColor(entry.severity)
                      : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                />
              ))}
            </div>
            <div className="flex justify-between mt-0.5">
              <span className="text-[10px] text-gray-400">Low</span>
              <span className="text-[10px] text-gray-400">Critical</span>
            </div>
          </div>
        </div>

        {/* Real-world impact */}
        <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 border border-amber-200 dark:border-amber-800">
          <div className="flex items-center gap-1.5 mb-1.5">
            <AlertTriangle size={14} className="text-amber-600 dark:text-amber-400" />
            <span className="text-xs font-bold text-amber-800 dark:text-amber-400">Real-World Impact</span>
          </div>
          <p className="text-sm text-amber-900 dark:text-amber-300 leading-relaxed">{entry.realWorldImpact}</p>
        </div>

        {/* Code comparison */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
            <div className="flex items-center gap-1.5">
              <Code2 size={14} className="text-gray-500" />
              <span className="text-xs font-bold text-gray-700 dark:text-gray-300">Code Example</span>
            </div>
            <div className="flex items-center gap-0.5 bg-gray-200 dark:bg-gray-700 rounded-lg p-0.5">
              {(['vulnerable', 'side-by-side', 'fixed'] as const).map(m => (
                <button
                  key={m}
                  onClick={() => setCodeView(m)}
                  className={`px-2.5 py-1 text-[10px] rounded-md font-medium transition-colors ${
                    codeView === m
                      ? 'bg-red-600 text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100'
                  }`}
                >
                  {m === 'side-by-side' ? 'Compare' : m === 'vulnerable' ? 'Vulnerable' : 'Fixed'}
                </button>
              ))}
            </div>
          </div>
          <div className={`${codeView === 'side-by-side' ? 'flex gap-0' : ''}`}>
            {(codeView === 'vulnerable' || codeView === 'side-by-side') && (
              <div className={`${codeView === 'side-by-side' ? 'flex-1 border-r border-gray-200 dark:border-gray-700' : ''}`}>
                <div className="px-3 py-1.5 bg-red-50 dark:bg-red-900/20 text-[10px] font-bold text-red-600 dark:text-red-400 border-b border-gray-200 dark:border-gray-700 flex items-center gap-1">
                  <XCircle size={10} />
                  VULNERABLE CODE
                </div>
                <pre className="p-3 text-[11px] leading-relaxed text-gray-800 dark:text-gray-200 overflow-x-auto font-mono whitespace-pre bg-gray-50 dark:bg-gray-950">
                  {entry.vulnerableCode}
                </pre>
              </div>
            )}
            {(codeView === 'fixed' || codeView === 'side-by-side') && (
              <div className={`${codeView === 'side-by-side' ? 'flex-1' : ''}`}>
                <div className="px-3 py-1.5 bg-green-50 dark:bg-green-900/20 text-[10px] font-bold text-green-600 dark:text-green-400 border-b border-gray-200 dark:border-gray-700 flex items-center gap-1">
                  <CheckCircle2 size={10} />
                  SECURE CODE
                </div>
                <pre className="p-3 text-[11px] leading-relaxed text-gray-800 dark:text-gray-200 overflow-x-auto font-mono whitespace-pre bg-gray-50 dark:bg-gray-950">
                  {entry.fixedCode}
                </pre>
              </div>
            )}
          </div>
          <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-blue-50 dark:bg-blue-900/20">
            <div className="flex items-start gap-1.5">
              <Eye size={12} className="text-blue-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] font-bold text-blue-700 dark:text-blue-400 mb-0.5">What Changed and Why</p>
                <p className="text-xs text-blue-800 dark:text-blue-300 leading-relaxed">{entry.codeExplanation}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => startQuiz(entry.id)}
            className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold transition-colors flex items-center gap-1.5"
          >
            <Terminal size={14} />
            Take Quiz (2 Questions)
          </button>
          {quizzedVulns.has(entry.id) && (
            <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400 font-semibold">
              <Award size={14} />
              Quiz Completed
            </span>
          )}
          {studiedVulns.has(entry.id) && !quizzedVulns.has(entry.id) && (
            <span className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 font-semibold">
              <Eye size={14} />
              Studied
            </span>
          )}
        </div>
      </div>
    );
  };

  // ───────── Main Render ─────────

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-50 to-red-50 dark:from-gray-950 dark:to-red-950 p-3 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-bold text-gray-800 dark:text-gray-200">
          OWASP Top 10 (2021)
        </h2>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-gray-500 dark:text-gray-400">
            {totalQuizzed}/10 completed
          </span>
          <div className="w-24 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 rounded-full transition-all duration-500"
              style={{ width: `${(totalQuizzed / 10) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex items-center gap-1 mb-3 bg-gray-200 dark:bg-gray-800 rounded-lg p-0.5">
        <button
          onClick={() => setActiveTab('learn')}
          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
            activeTab === 'learn'
              ? 'bg-white dark:bg-gray-700 text-red-600 dark:text-red-400 shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
          }`}
        >
          <BookOpen size={13} />
          Learn
        </button>
        <button
          onClick={() => setActiveTab('sandbox')}
          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
            activeTab === 'sandbox'
              ? 'bg-white dark:bg-gray-700 text-red-600 dark:text-red-400 shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
          }`}
        >
          <Terminal size={13} />
          Sandbox
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-auto">
        {activeTab === 'learn' && renderLearnTab()}
        {activeTab === 'sandbox' && sandboxView === 'list' && renderSandboxList()}
        {activeTab === 'sandbox' && sandboxView === 'detail' && renderSandboxDetail()}
      </div>
    </div>
  );
};
