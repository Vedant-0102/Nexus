import React, { useState } from 'react';
import { BookOpen, Code, ChevronRight, Check, X, RotateCcw } from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface CodeExample {
  title: string;
  code: string;
}

interface Exercise {
  prompt: string;
  placeholder: string;
  answer: string;
}

interface Topic {
  id: string;
  title: string;
  explanation: string;
  codeExamples: CodeExample[];
  exercises: Exercise[];
}

/* ------------------------------------------------------------------ */
/*  Syntax-highlighted code renderer                                   */
/* ------------------------------------------------------------------ */

const tokenize = (code: string): React.ReactNode[] => {
  const rules: { pattern: RegExp; cls: string }[] = [
    { pattern: /(\/\/[^\n]*)/, cls: 'text-gray-500' },
    { pattern: /(\/\*[\s\S]*?\*\/)/, cls: 'text-gray-500' },
    { pattern: /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)/, cls: 'text-green-400' },
    { pattern: /\b(\d+(?:\.\d+)?)\b/, cls: 'text-orange-400' },
    { pattern: /\b(require|import|module|exports|from)\b/, cls: 'text-purple-400' },
    {
      pattern:
        /\b(const|let|var|function|return|if|else|for|while|do|switch|case|break|continue|new|class|extends|constructor|this|super|try|catch|finally|throw|export|default|async|await|of|in|typeof|instanceof|null|undefined|true|false|yield|static|get|set|delete)\b/,
      cls: 'text-blue-400',
    },
    {
      pattern:
        /\b(console|Promise|Array|Object|JSON|Error|Buffer|process|__dirname|__filename|setTimeout|setInterval|setImmediate|clearTimeout|clearInterval|Map|Set|RegExp|Date|Math|Number|String|Boolean|Symbol|EventEmitter|Stream|require)\b/,
      cls: 'text-yellow-300',
    },
    { pattern: /(=>)/, cls: 'text-blue-400' },
  ];

  const combined = rules.map((r) => r.pattern.source).join('|');
  const masterRe = new RegExp(combined, 'g');
  const nodes: React.ReactNode[] = [];
  let lastIndex = 0;
  let key = 0;
  let match: RegExpExecArray | null;

  while ((match = masterRe.exec(code)) !== null) {
    if (match.index > lastIndex)
      nodes.push(
        <span key={key++} className="text-gray-200">
          {code.slice(lastIndex, match.index)}
        </span>
      );
    const text = match[0];
    let cls = 'text-gray-200';
    let found = false;
    for (let g = 1; g <= match.length - 1; g++) {
      if (match[g] === text) {
        let accum = 1;
        for (const rule of rules) {
          const groups = (rule.pattern.source.match(/\((?!\?)/g)?.length ?? 0) || 1;
          if (g >= accum && g < accum + groups) {
            cls = rule.cls;
            found = true;
            break;
          }
          accum += groups;
        }
        if (found) break;
      }
    }
    nodes.push(
      <span key={key++} className={cls}>
        {text}
      </span>
    );
    lastIndex = match.index + text.length;
  }
  if (lastIndex < code.length)
    nodes.push(
      <span key={key++} className="text-gray-200">
        {code.slice(lastIndex)}
      </span>
    );
  return nodes;
};

const CodeBlock: React.FC<{ code: string; title?: string }> = ({ code, title }) => (
  <div className="bg-gray-950 rounded-lg p-3 font-mono text-[12px] overflow-x-auto border border-gray-800">
    {title && (
      <div className="text-[10px] text-gray-500 mb-2 pb-1 border-b border-gray-800 font-sans font-medium uppercase tracking-wider">
        {title}
      </div>
    )}
    <pre className="leading-relaxed whitespace-pre-wrap">{tokenize(code)}</pre>
  </div>
);

/* ------------------------------------------------------------------ */
/*  Topic data (12 topics, 2-3 code examples + 2 exercises each)       */
/* ------------------------------------------------------------------ */

const topics: Topic[] = [
  /* ============================================================== */
  /*  1. INTRODUCTION                                                */
  /* ============================================================== */
  {
    id: 'introduction',
    title: 'Introduction',
    explanation:
      'Node.js is a JavaScript runtime built on Chrome\'s V8 engine. It lets you run JavaScript outside the browser -- on servers, desktops, and IoT devices. Node uses a single-threaded, non-blocking, event-driven architecture which makes it ideal for I/O-heavy workloads like web servers and APIs. Install Node from nodejs.org, use the REPL by typing "node" in your terminal, or run scripts with "node script.js". Node has no window or document object -- instead it provides server-side APIs like fs, http, path, os, and crypto.',
    codeExamples: [
      {
        title: 'What is Node.js',
        code: `// Node.js is a runtime, NOT a language
// It runs JavaScript on the server using the V8 engine

// Check your Node version
console.log(process.version);     // v20.11.0
console.log(process.platform);    // "win32", "linux", "darwin"
console.log(process.arch);        // "x64", "arm64"

// Node provides server-side globals
// No window, no document -- instead:
// - process     (current process info)
// - __dirname   (directory of current file)
// - __filename  (path of current file)
// - global      (like window in browsers)
// - Buffer      (binary data handling)

console.log("Hello from Node.js!");
console.log(__dirname);   // /home/user/project
console.log(__filename);  // /home/user/project/app.js`,
      },
      {
        title: 'Node REPL and running scripts',
        code: `// The REPL (Read-Eval-Print Loop)
// Open terminal and type: node
// > 2 + 2
// 4
// > .help   (shows REPL commands)
// > .exit   (quit REPL)

// Running a script file
// $ node app.js
// $ node src/server.js

// Useful flags
// $ node --version          (shows Node version)
// $ node --watch app.js     (auto-restart on changes)
// $ node -e "console.log(1+1)"  (evaluate inline)
// $ node --inspect app.js   (enable debugger)

// Non-blocking I/O example
const fs = require('fs');

console.log("1: Before read");
fs.readFile('file.txt', 'utf8', (err, data) => {
  console.log("3: File contents:", data);
});
console.log("2: After read (runs BEFORE file is read!)");
// Output order: 1, 2, 3 -- non-blocking!`,
      },
      {
        title: 'Event-driven architecture',
        code: `// Node.js uses an event loop for concurrency
// Single thread handles thousands of connections

// The event loop phases:
// 1. timers        (setTimeout, setInterval)
// 2. pending       (system callbacks)
// 3. poll          (I/O events)
// 4. check         (setImmediate)
// 5. close         (cleanup)

setTimeout(() => console.log("timer"), 0);
setImmediate(() => console.log("immediate"));
process.nextTick(() => console.log("nextTick"));
console.log("sync");

// Output:
// sync
// nextTick
// timer (or immediate)
// immediate (or timer)

// process.nextTick runs before any I/O
// setImmediate runs in the check phase`,
      },
    ],
    exercises: [
      {
        prompt: 'Which engine does Node.js use to run JavaScript?',
        placeholder: 'The ___ engine',
        answer: 'V8',
      },
      {
        prompt: 'What global object holds the current directory path in Node?',
        placeholder: 'console.log(___);',
        answer: '__dirname',
      },
    ],
  },

  /* ============================================================== */
  /*  2. MODULES                                                     */
  /* ============================================================== */
  {
    id: 'modules',
    title: 'Modules',
    explanation:
      'Node.js has two module systems: CommonJS (CJS) uses require() and module.exports, while ES Modules (ESM) uses import/export. CommonJS is the default -- every .js file is a module. ESM requires "type": "module" in package.json or a .mjs extension. __dirname and __filename are available in CJS but not in ESM (use import.meta.url instead). Node resolves modules by checking: core modules, then node_modules, then relative paths.',
    codeExamples: [
      {
        title: 'CommonJS (require / module.exports)',
        code: `// math.js -- exporting a module
function add(a, b) { return a + b; }
function multiply(a, b) { return a * b; }

// Export multiple things
module.exports = { add, multiply };

// Or export one thing
// module.exports = add;

// Or attach to exports shorthand
// exports.add = add;
// exports.multiply = multiply;
// WARNING: never do exports = { ... } (breaks ref)

// app.js -- importing the module
const { add, multiply } = require('./math');
console.log(add(2, 3));       // 5
console.log(multiply(4, 5));  // 20

// __dirname and __filename in CJS
console.log(__dirname);   // /home/user/project
console.log(__filename);  // /home/user/project/app.js`,
      },
      {
        title: 'ES Modules (import / export)',
        code: `// Requires "type": "module" in package.json
// Or use .mjs file extension

// math.mjs -- named exports
export function add(a, b) { return a + b; }
export function multiply(a, b) { return a * b; }

// default export
export default class Calculator {
  add(a, b) { return a + b; }
}

// app.mjs -- importing
import Calculator, { add, multiply } from './math.mjs';
import * as math from './math.mjs';

console.log(add(2, 3));               // 5
console.log(math.multiply(4, 5));     // 20

// No __dirname in ESM -- use import.meta
import { fileURLToPath } from 'url';
import { dirname } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);`,
      },
      {
        title: 'Module resolution and creating modules',
        code: `// Node resolves modules in this order:
// 1. Core modules:   require('fs'), require('path')
// 2. node_modules:   require('express')
// 3. Relative paths: require('./utils')
// 4. Absolute paths: require('/home/user/lib')

// Creating a reusable module
// logger.js
class Logger {
  constructor(prefix) {
    this.prefix = prefix;
  }
  info(msg) {
    console.log('[INFO ' + this.prefix + '] ' + msg);
  }
  error(msg) {
    console.error('[ERR ' + this.prefix + '] ' + msg);
  }
}
module.exports = Logger;

// Using it
const Logger = require('./logger');
const log = new Logger('app');
log.info('Server started');  // [INFO app] Server started
log.error('DB failed');      // [ERR app] DB failed`,
      },
    ],
    exercises: [
      {
        prompt: 'Export a function using CommonJS syntax:',
        placeholder: 'module.___ = myFunction;',
        answer: 'exports',
      },
      {
        prompt: 'Import a named export using ES module syntax:',
        placeholder: '___ { readFile } from "fs/promises";',
        answer: 'import',
      },
    ],
  },

  /* ============================================================== */
  /*  3. NPM & PACKAGES                                              */
  /* ============================================================== */
  {
    id: 'npm',
    title: 'NPM & Packages',
    explanation:
      'npm (Node Package Manager) is the world\'s largest software registry. package.json is the heart of every Node project -- it tracks metadata, scripts, dependencies, and devDependencies. Use "npm init -y" to bootstrap a project. Semantic versioning (semver): MAJOR.MINOR.PATCH. The caret (^) allows minor updates, tilde (~) allows patch updates. package-lock.json locks exact versions for reproducible installs. Never commit node_modules -- add it to .gitignore.',
    codeExamples: [
      {
        title: 'package.json structure',
        code: `// package.json -- created with: npm init -y
{
  "name": "my-api",
  "version": "1.0.0",
  "description": "My REST API server",
  "main": "src/index.js",
  "type": "commonjs",
  "scripts": {
    "start": "node src/index.js",
    "dev": "node --watch src/index.js",
    "test": "jest --coverage",
    "lint": "eslint src/",
    "build": "tsc"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1"
  },
  "devDependencies": {
    "jest": "^29.7.0",
    "eslint": "^8.56.0",
    "nodemon": "^3.0.2"
  },
  "engines": { "node": ">=18.0.0" }
}`,
      },
      {
        title: 'npm commands',
        code: `// Initialize a project
// $ npm init -y

// Install dependencies
// $ npm install express        (adds to dependencies)
// $ npm install -D jest        (adds to devDependencies)
// $ npm install                (install all from package.json)
// $ npm install express@4.18.2 (specific version)
// $ npm uninstall express      (remove package)

// Run scripts
// $ npm start                  (runs "start" script)
// $ npm test                   (runs "test" script)
// $ npm run dev                (runs custom "dev" script)

// npx -- run packages without installing globally
// $ npx create-react-app my-app
// $ npx ts-node script.ts
// $ npx eslint --init

// Semantic versioning: MAJOR.MINOR.PATCH
// ^4.18.2 --> allows 4.x.x (minor + patch)
// ~4.18.2 --> allows 4.18.x (patch only)
// 4.18.2  --> exact version only

// Check outdated packages
// $ npm outdated
// $ npm update`,
      },
      {
        title: 'package-lock.json and node_modules',
        code: `// package-lock.json
// - Auto-generated, locks EXACT dependency versions
// - Ensures identical installs across machines
// - ALWAYS commit this file to git

// node_modules/
// - Contains all installed packages
// - Can be thousands of files
// - NEVER commit to git

// .gitignore should include:
// node_modules/
// .env
// dist/
// coverage/

// Global vs local installs
// $ npm install -g nodemon   (global, available everywhere)
// $ npm install nodemon      (local, project only)

// List installed packages
// $ npm list --depth=0       (top-level only)
// $ npm list                 (full tree)

// Clean install (CI environments)
// $ npm ci                   (uses lock file exactly)
// Faster and stricter than npm install`,
      },
    ],
    exercises: [
      {
        prompt: 'Which npm flag installs a package as a dev dependency?',
        placeholder: 'npm install ___ jest',
        answer: '-D',
      },
      {
        prompt: 'Which file locks exact dependency versions for reproducible installs?',
        placeholder: 'The file is called ___',
        answer: 'package-lock.json',
      },
    ],
  },

  /* ============================================================== */
  /*  4. FILE SYSTEM                                                  */
  /* ============================================================== */
  {
    id: 'filesystem',
    title: 'File System',
    explanation:
      'The fs module provides three API styles: callbacks (fs.readFile), synchronous (fs.readFileSync), and promises (fs.promises.readFile). The path module handles cross-platform path construction -- always use path.join() instead of string concatenation. Key operations: reading/writing files, checking existence, creating directories, listing directory contents, deleting files, and getting file stats.',
    codeExamples: [
      {
        title: 'Reading and writing files',
        code: `const fs = require('fs');
const path = require('path');

// Callback style
fs.readFile('data.txt', 'utf8', (err, data) => {
  if (err) throw err;
  console.log(data);
});

// Synchronous (blocks event loop -- use sparingly)
const config = fs.readFileSync('config.json', 'utf8');
const parsed = JSON.parse(config);

// Promise style (modern, preferred)
async function readAndWrite() {
  const data = await fs.promises.readFile('input.txt', 'utf8');
  const upper = data.toUpperCase();
  await fs.promises.writeFile('output.txt', upper, 'utf8');
  console.log('File written successfully');
}

// Append to a file (don't overwrite)
fs.appendFileSync('log.txt', 'New entry\\n');

// Write JSON
const users = [{ id: 1, name: 'Alice' }];
fs.writeFileSync('users.json', JSON.stringify(users, null, 2));`,
      },
      {
        title: 'Directories, existence checks, stats',
        code: `const fs = require('fs');
const path = require('path');

// Check if file/dir exists
if (fs.existsSync('config.json')) {
  console.log('Config found');
}

// Create directory (recursive)
fs.mkdirSync('data/logs/archive', { recursive: true });

// Read directory contents
const files = fs.readdirSync('./src');
console.log(files); // ['index.js', 'utils.js', ...]

// Get file stats
const stats = fs.statSync('app.js');
console.log(stats.isFile());       // true
console.log(stats.isDirectory());  // false
console.log(stats.size);           // bytes

// Delete a file
fs.unlinkSync('temp.txt');

// Delete a directory (recursive)
fs.rmSync('old-data', { recursive: true, force: true });

// Watch for file changes
fs.watch('src', { recursive: true }, (event, file) => {
  console.log(event, file);  // "change", "index.js"
});`,
      },
      {
        title: 'Path module utilities',
        code: `const path = require('path');

// ALWAYS use path.join -- handles OS separators
const fp = path.join(__dirname, 'data', 'users.json');
// Linux: /home/user/project/data/users.json
// Windows: C:\\Users\\user\\project\\data\\users.json

// path.resolve -- returns absolute path
const abs = path.resolve('src', 'index.js');
// /home/user/project/src/index.js

// Extract parts of a path
console.log(path.basename('/a/b/c.txt'));     // "c.txt"
console.log(path.basename('/a/b/c.txt', '.txt')); // "c"
console.log(path.extname('server.js'));       // ".js"
console.log(path.dirname('/a/b/c.txt'));      // "/a/b"

// Parse a full path
const info = path.parse('/home/user/app.js');
// { root: '/', dir: '/home/user',
//   base: 'app.js', ext: '.js', name: 'app' }

// Normalize messy paths
console.log(path.normalize('/a/b/../c/./d'));
// "/a/c/d"`,
      },
    ],
    exercises: [
      {
        prompt: 'Read a file asynchronously with promises:',
        placeholder: "const data = await fs.___.readFile('f.txt', 'utf8');",
        answer: 'promises',
      },
      {
        prompt: 'Build a cross-platform file path safely:',
        placeholder: "const fp = path.___(__dirname, 'data', 'file.txt');",
        answer: 'join',
      },
    ],
  },

  /* ============================================================== */
  /*  5. HTTP SERVER                                                  */
  /* ============================================================== */
  {
    id: 'http-server',
    title: 'HTTP Server',
    explanation:
      'The built-in http module creates servers without any framework. http.createServer() takes a callback receiving req (IncomingMessage) and res (ServerResponse). The request object has url, method, and headers. The response object has writeHead() for status/headers, write() for body chunks, and end() to finish. This low-level API is the foundation for Express, Koa, and other frameworks.',
    codeExamples: [
      {
        title: 'Basic HTTP server',
        code: `const http = require('http');

const server = http.createServer((req, res) => {
  // req.url    -- "/", "/about", "/api/users?page=1"
  // req.method -- "GET", "POST", "PUT", "DELETE"
  // req.headers -- { host, content-type, ... }

  console.log(req.method, req.url);

  // Set status code and headers
  res.writeHead(200, {
    'Content-Type': 'text/plain',
    'X-Custom': 'hello'
  });

  // Send response body and end
  res.end('Hello, World!');
});

// Listen on port 3000
server.listen(3000, () => {
  console.log('Server running at http://localhost:3000');
});

// Status codes:
// 200 OK, 201 Created, 204 No Content
// 301 Moved, 304 Not Modified
// 400 Bad Request, 401 Unauthorized, 404 Not Found
// 500 Internal Server Error`,
      },
      {
        title: 'Routing and serving JSON',
        code: `const http = require('http');

const users = [
  { id: 1, name: 'Alice', role: 'admin' },
  { id: 2, name: 'Bob', role: 'user' },
];

const server = http.createServer((req, res) => {
  const { method, url } = req;

  if (method === 'GET' && url === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end('<h1>Welcome</h1><p>My API Server</p>');
  }
  else if (method === 'GET' && url === '/api/users') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(users));
  }
  else if (method === 'GET' && url.startsWith('/api/users/')) {
    const id = parseInt(url.split('/')[3]);
    const user = users.find(u => u.id === id);
    if (user) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(user));
    } else {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'User not found' }));
    }
  }
  else {
    res.writeHead(404);
    res.end('Not Found');
  }
});

server.listen(3000);`,
      },
      {
        title: 'Handling POST request body',
        code: `const http = require('http');

const server = http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/api/data') {
    // Body comes in chunks (streams)
    let body = '';

    req.on('data', (chunk) => {
      body += chunk.toString();
    });

    req.on('end', () => {
      try {
        const parsed = JSON.parse(body);
        console.log('Received:', parsed);

        res.writeHead(201, {
          'Content-Type': 'application/json'
        });
        res.end(JSON.stringify({
          status: 'created',
          data: parsed
        }));
      } catch (err) {
        res.writeHead(400, {
          'Content-Type': 'application/json'
        });
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
      }
    });
  } else {
    res.writeHead(405);
    res.end('Method Not Allowed');
  }
});

server.listen(3000);`,
      },
    ],
    exercises: [
      {
        prompt: 'Create an HTTP server with a request handler:',
        placeholder: 'const server = http.___(handleRequest);',
        answer: 'createServer',
      },
      {
        prompt: 'Set the status code to 200 and content type header:',
        placeholder: "res.___(200, { 'Content-Type': 'application/json' });",
        answer: 'writeHead',
      },
    ],
  },

  /* ============================================================== */
  /*  6. EXPRESS.JS                                                   */
  /* ============================================================== */
  {
    id: 'express',
    title: 'Express.js',
    explanation:
      'Express.js is the most popular Node.js web framework. It wraps the http module with a cleaner API for routing, middleware, and request/response handling. Create an app with express(), define routes with app.get/post/put/delete, access params via req.params, query strings via req.query, and parsed bodies via req.body. Use express.static() to serve files and express.Router() to organize routes into modules.',
    codeExamples: [
      {
        title: 'Express basics and routing',
        code: `const express = require('express');
const app = express();

// Built-in middleware
app.use(express.json());           // parse JSON bodies
app.use(express.urlencoded({ extended: true })); // form data
app.use(express.static('public')); // serve static files

// GET route
app.get('/', (req, res) => {
  res.send('Hello Express!');
});

// Route with URL parameter
app.get('/users/:id', (req, res) => {
  const { id } = req.params;       // URL param
  res.json({ userId: id });
});

// Query string: /search?q=node&page=2
app.get('/search', (req, res) => {
  const { q, page } = req.query;
  res.json({ query: q, page: page || 1 });
});

// POST with body
app.post('/users', (req, res) => {
  const { name, email } = req.body;
  const user = { id: Date.now(), name, email };
  res.status(201).json(user);
});

app.listen(3000, () => console.log('Listening on :3000'));`,
      },
      {
        title: 'All HTTP methods and response helpers',
        code: `const express = require('express');
const app = express();
app.use(express.json());

let items = [{ id: 1, name: 'Item A' }];

// GET all
app.get('/api/items', (req, res) => {
  res.json(items);
});

// GET one
app.get('/api/items/:id', (req, res) => {
  const item = items.find(i => i.id === +req.params.id);
  if (!item) return res.status(404).json({ error: 'Not found' });
  res.json(item);
});

// POST create
app.post('/api/items', (req, res) => {
  const item = { id: Date.now(), ...req.body };
  items.push(item);
  res.status(201).json(item);
});

// PUT update (full replace)
app.put('/api/items/:id', (req, res) => {
  const idx = items.findIndex(i => i.id === +req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  items[idx] = { id: items[idx].id, ...req.body };
  res.json(items[idx]);
});

// DELETE
app.delete('/api/items/:id', (req, res) => {
  items = items.filter(i => i.id !== +req.params.id);
  res.status(204).end();
});`,
      },
      {
        title: 'Express Router for modular routes',
        code: `// routes/users.js
const express = require('express');
const router = express.Router();

// All routes here are prefixed with /api/users
router.get('/', (req, res) => {
  res.json([{ id: 1, name: 'Alice' }]);
});

router.get('/:id', (req, res) => {
  res.json({ id: req.params.id });
});

router.post('/', (req, res) => {
  res.status(201).json({ id: Date.now(), ...req.body });
});

module.exports = router;

// app.js -- mount the router
const express = require('express');
const userRoutes = require('./routes/users');
const app = express();

app.use(express.json());
app.use('/api/users', userRoutes);  // mount at prefix
// GET /api/users      --> router's '/'
// GET /api/users/42   --> router's '/:id'

app.listen(3000);`,
      },
    ],
    exercises: [
      {
        prompt: 'Parse incoming JSON request bodies in Express:',
        placeholder: 'app.use(express.___());',
        answer: 'json',
      },
      {
        prompt: 'Send a JSON response with 201 status code:',
        placeholder: "res.___(201).json({ created: true });",
        answer: 'status',
      },
    ],
  },

  /* ============================================================== */
  /*  7. MIDDLEWARE                                                   */
  /* ============================================================== */
  {
    id: 'middleware',
    title: 'Middleware',
    explanation:
      'Middleware functions have access to req, res, and next(). They execute sequentially in the order defined. Call next() to pass control to the next middleware or route handler. Middleware can modify req/res, end the request cycle, or pass errors. Error-handling middleware has four parameters: (err, req, res, next). Order matters -- define middleware before the routes that need it. Common uses: logging, authentication, CORS, body parsing, and rate limiting.',
    codeExamples: [
      {
        title: 'Custom middleware and next()',
        code: `const express = require('express');
const app = express();

// Middleware runs in ORDER of definition
// Every request passes through app.use() middleware

// 1. Logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  console.log(req.method + ' ' + req.url);
  res.on('finish', () => {
    const ms = Date.now() - start;
    console.log(res.statusCode + ' ' + ms + 'ms');
  });
  next(); // MUST call next() or request hangs
});

// 2. Add custom property to request
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

// 3. Route handler (also middleware)
app.get('/', (req, res) => {
  res.json({ time: req.requestTime });
});

// Middleware only for specific routes
const adminOnly = (req, res, next) => {
  if (req.headers['x-role'] !== 'admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  next();
};

app.get('/admin', adminOnly, (req, res) => {
  res.json({ secret: 'admin data' });
});`,
      },
      {
        title: 'Error handling middleware',
        code: `const express = require('express');
const app = express();
app.use(express.json());

// Route that might throw
app.get('/api/data', async (req, res, next) => {
  try {
    // Simulate an error
    throw new Error('Database connection failed');
  } catch (err) {
    next(err); // Pass error to error middleware
  }
});

// Custom error class
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
  }
}

app.get('/api/users/:id', (req, res, next) => {
  const user = null; // not found
  if (!user) {
    return next(new AppError('User not found', 404));
  }
  res.json(user);
});

// Error middleware -- MUST have 4 parameters
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  const status = err.statusCode || 500;
  res.status(status).json({
    error: err.message,
    status: status
  });
});`,
      },
      {
        title: 'Common third-party middleware',
        code: `const express = require('express');
const cors = require('cors');
const app = express();

// CORS -- allow cross-origin requests
app.use(cors());
// Or with options:
app.use(cors({
  origin: 'https://myapp.com',
  methods: ['GET', 'POST'],
  credentials: true
}));

// Body parsing (built-in)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Static files (built-in)
app.use(express.static('public'));

// morgan -- HTTP request logger (npm install morgan)
// const morgan = require('morgan');
// app.use(morgan('dev'));
// Output: GET /api/users 200 3.452 ms

// helmet -- security headers (npm install helmet)
// const helmet = require('helmet');
// app.use(helmet());

// ORDER MATTERS:
// 1. Security middleware (helmet, cors)
// 2. Body parsers (json, urlencoded)
// 3. Logging (morgan)
// 4. Auth middleware
// 5. Routes
// 6. Error handlers (LAST)`,
      },
    ],
    exercises: [
      {
        prompt: 'What must you call in middleware to pass control to the next handler?',
        placeholder: 'app.use((req, res, ___) => { ___(); });',
        answer: 'next',
      },
      {
        prompt: 'How many parameters does an Express error-handling middleware have?',
        placeholder: 'An error middleware has ___ parameters (err, req, res, next)',
        answer: '4',
      },
    ],
  },

  /* ============================================================== */
  /*  8. ASYNC PATTERNS                                               */
  /* ============================================================== */
  {
    id: 'async-patterns',
    title: 'Async Patterns',
    explanation:
      'Node.js is single-threaded but handles concurrency through non-blocking I/O and the event loop. There are three async patterns: callbacks (error-first convention), Promises (.then/.catch), and async/await (syntactic sugar over Promises). Use Promise.all() for parallel execution and Promise.allSettled() when you need all results even if some fail. util.promisify() converts callback-based functions to promises. Understanding the event loop phases (timers, I/O, check) is crucial for performance.',
    codeExamples: [
      {
        title: 'Callbacks and Promises',
        code: `const fs = require('fs');
const { promisify } = require('util');

// 1. Callback pattern (error-first convention)
// First arg is always error, second is result
fs.readFile('data.txt', 'utf8', (err, data) => {
  if (err) {
    console.error('Failed:', err.message);
    return; // ALWAYS return after error
  }
  console.log('Data:', data);
});

// Callback hell (pyramid of doom)
fs.readFile('a.txt', 'utf8', (err, a) => {
  fs.readFile('b.txt', 'utf8', (err, b) => {
    fs.writeFile('c.txt', a + b, (err) => {
      console.log('Done!'); // deeply nested
    });
  });
});

// 2. Promise pattern
fs.promises.readFile('data.txt', 'utf8')
  .then(data => data.toUpperCase())
  .then(upper => fs.promises.writeFile('out.txt', upper))
  .then(() => console.log('Written!'))
  .catch(err => console.error(err));

// Convert callback to promise
const readFile = promisify(fs.readFile);
readFile('data.txt', 'utf8').then(console.log);`,
      },
      {
        title: 'async/await and parallel execution',
        code: `const fs = require('fs');

// async/await -- cleanest async pattern
async function processFiles() {
  try {
    const data = await fs.promises.readFile('input.txt', 'utf8');
    const result = data.toUpperCase();
    await fs.promises.writeFile('output.txt', result);
    console.log('Done!');
  } catch (err) {
    console.error('Error:', err.message);
  }
}

// SEQUENTIAL -- waits for each one
async function sequential() {
  const a = await fetchUser(1);   // 1 second
  const b = await fetchUser(2);   // 1 second
  // Total: 2 seconds
}

// PARALLEL -- runs simultaneously
async function parallel() {
  const [a, b] = await Promise.all([
    fetchUser(1),   // 1 second
    fetchUser(2),   // 1 second
  ]);
  // Total: 1 second (runs in parallel)
}

// Promise.allSettled -- never rejects
async function resilient() {
  const results = await Promise.allSettled([
    fetchUser(1),
    fetchUser(999), // this fails
  ]);
  // results[0] = { status: 'fulfilled', value: ... }
  // results[1] = { status: 'rejected', reason: Error }
}`,
      },
      {
        title: 'Event loop and timing',
        code: `// The event loop processes tasks in phases:
// 1. Microtasks: process.nextTick, Promise callbacks
// 2. Timers: setTimeout, setInterval
// 3. I/O: fs, network callbacks
// 4. Check: setImmediate

console.log('1: sync');

setTimeout(() => console.log('2: setTimeout'), 0);

setImmediate(() => console.log('3: setImmediate'));

process.nextTick(() => console.log('4: nextTick'));

Promise.resolve().then(() => console.log('5: promise'));

console.log('6: sync');

// Output:
// 1: sync
// 6: sync
// 4: nextTick  (microtask, runs first)
// 5: promise   (microtask, after nextTick)
// 2: setTimeout (timer phase)
// 3: setImmediate (check phase)

// process.nextTick vs setImmediate
// nextTick: runs BEFORE any I/O (can starve I/O)
// setImmediate: runs AFTER I/O (safer for recursion)`,
      },
    ],
    exercises: [
      {
        prompt: 'Run two async operations in parallel and await both:',
        placeholder: 'const [a, b] = await Promise.___([ fn1(), fn2() ]);',
        answer: 'all',
      },
      {
        prompt: 'Convert a callback-based function to return a Promise:',
        placeholder: "const readFile = require('util').___(fs.readFile);",
        answer: 'promisify',
      },
    ],
  },

  /* ============================================================== */
  /*  9. EVENTS & STREAMS                                             */
  /* ============================================================== */
  {
    id: 'events-streams',
    title: 'Events & Streams',
    explanation:
      'EventEmitter is the core of Node\'s event-driven architecture -- most built-in modules (http, fs, streams) inherit from it. Register listeners with on() or once(), emit events with emit(), and remove listeners with removeListener(). Streams process data in chunks without loading everything into memory. There are four types: Readable, Writable, Duplex (both), and Transform (modify data). Use pipe() to connect streams and handle backpressure automatically.',
    codeExamples: [
      {
        title: 'EventEmitter basics',
        code: `const { EventEmitter } = require('events');

// Create an emitter
const emitter = new EventEmitter();

// Register listeners
emitter.on('message', (text) => {
  console.log('Received:', text);
});

emitter.on('message', (text) => {
  console.log('Also got:', text);
});

// once -- fires only one time
emitter.once('connect', () => {
  console.log('Connected! (fires once)');
});

// Emit events
emitter.emit('message', 'Hello!');
emitter.emit('connect');
emitter.emit('connect');  // ignored, already fired once

// Remove a listener
const handler = (data) => console.log(data);
emitter.on('data', handler);
emitter.removeListener('data', handler);

// Extend EventEmitter in a class
class Server extends EventEmitter {
  start() {
    console.log('Starting...');
    this.emit('ready', { port: 3000 });
  }
}
const srv = new Server();
srv.on('ready', (info) => console.log('Ready on', info.port));
srv.start();`,
      },
      {
        title: 'Readable and Writable streams',
        code: `const fs = require('fs');

// Reading a large file with streams
// Instead of loading entire file into memory:
const readable = fs.createReadStream('large-file.log', {
  encoding: 'utf8',
  highWaterMark: 64 * 1024 // 64KB chunks
});

readable.on('data', (chunk) => {
  console.log('Chunk size:', chunk.length);
});
readable.on('end', () => console.log('Read complete'));
readable.on('error', (err) => console.error(err));

// Writing with streams
const writable = fs.createWriteStream('output.log');
writable.write('Line 1\\n');
writable.write('Line 2\\n');
writable.end('Final line\\n'); // signals end
writable.on('finish', () => console.log('Write complete'));

// pipe() -- connect readable to writable
// Handles backpressure automatically
const src = fs.createReadStream('input.txt');
const dest = fs.createWriteStream('copy.txt');
src.pipe(dest);
dest.on('finish', () => console.log('Copy complete'));

// process.stdin and process.stdout are streams
process.stdin.pipe(process.stdout); // echo input`,
      },
      {
        title: 'Transform streams and pipeline',
        code: `const { Transform, pipeline } = require('stream');
const fs = require('fs');
const { promisify } = require('util');

// Transform stream -- modify data as it flows
const toUpperCase = new Transform({
  transform(chunk, encoding, callback) {
    const upper = chunk.toString().toUpperCase();
    callback(null, upper); // push transformed data
  }
});

// Chain with pipe
fs.createReadStream('input.txt')
  .pipe(toUpperCase)
  .pipe(fs.createWriteStream('upper.txt'));

// pipeline() -- better error handling than pipe()
const pipelineAsync = promisify(pipeline);

async function processFile() {
  try {
    await pipelineAsync(
      fs.createReadStream('data.csv'),
      new Transform({
        transform(chunk, enc, cb) {
          // Process each chunk
          const lines = chunk.toString().split('\\n');
          const filtered = lines.filter(l => l.includes('ERROR'));
          cb(null, filtered.join('\\n'));
        }
      }),
      fs.createWriteStream('errors.log')
    );
    console.log('Pipeline complete');
  } catch (err) {
    console.error('Pipeline failed:', err);
  }
}`,
      },
    ],
    exercises: [
      {
        prompt: 'Register an event listener that fires every time:',
        placeholder: "emitter.___('data', handler);",
        answer: 'on',
      },
      {
        prompt: 'Connect a readable stream to a writable stream:',
        placeholder: 'readableStream.___(writableStream);',
        answer: 'pipe',
      },
    ],
  },

  /* ============================================================== */
  /*  10. ENVIRONMENT & CONFIG                                        */
  /* ============================================================== */
  {
    id: 'env-config',
    title: 'Environment & Config',
    explanation:
      'Environment variables configure your app without hardcoding values. Access them via process.env. The dotenv package loads variables from a .env file. process.argv provides command-line arguments. process.exit() terminates the process (0 = success, 1 = error). process.cwd() returns the current working directory. NODE_ENV conventionally distinguishes development/production/test environments. Never commit .env files -- use .env.example as a template.',
    codeExamples: [
      {
        title: 'process.env and dotenv',
        code: `// .env file (never commit this!)
// PORT=3000
// DATABASE_URL=mongodb://localhost:27017/mydb
// JWT_SECRET=my-super-secret-key
// NODE_ENV=development

// Load .env file (npm install dotenv)
require('dotenv').config();

// Access environment variables
const port = process.env.PORT || 3000;
const dbUrl = process.env.DATABASE_URL;
const secret = process.env.JWT_SECRET;
const env = process.env.NODE_ENV || 'development';

console.log('Port:', port);
console.log('Environment:', env);

// Check required variables
const required = ['DATABASE_URL', 'JWT_SECRET'];
for (const key of required) {
  if (!process.env[key]) {
    console.error('Missing env var: ' + key);
    process.exit(1); // exit with error code
  }
}

// Setting env vars from command line:
// PORT=8080 node app.js           (Unix)
// set PORT=8080 && node app.js    (Windows CMD)
// $env:PORT=8080; node app.js     (PowerShell)`,
      },
      {
        title: 'process.argv and CLI arguments',
        code: `// process.argv is an array:
// [0] = path to node executable
// [1] = path to script file
// [2+] = user arguments

// $ node app.js --name Alice --port 3000
console.log(process.argv);
// ['/usr/bin/node', '/app.js', '--name', 'Alice', '--port', '3000']

// Simple argument parsing
function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i += 2) {
    const key = argv[i].replace(/^--/, '');
    args[key] = argv[i + 1];
  }
  return args;
}

const args = parseArgs(process.argv);
console.log(args); // { name: 'Alice', port: '3000' }

// Other useful process properties
console.log(process.cwd());     // current working directory
console.log(process.pid);       // process ID
console.log(process.uptime());  // seconds since start
console.log(process.memoryUsage().heapUsed); // bytes

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Shutting down gracefully...');
  server.close(() => process.exit(0));
});`,
      },
      {
        title: 'Config patterns',
        code: `// config.js -- centralized configuration
require('dotenv').config();

const config = {
  port: parseInt(process.env.PORT, 10) || 3000,
  env: process.env.NODE_ENV || 'development',
  db: {
    url: process.env.DATABASE_URL,
    poolSize: parseInt(process.env.DB_POOL, 10) || 5,
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES || '24h',
  },
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
  },
  isDev: process.env.NODE_ENV === 'development',
  isProd: process.env.NODE_ENV === 'production',
  isTest: process.env.NODE_ENV === 'test',
};

module.exports = config;

// Usage in other files:
const config = require('./config');

if (config.isDev) {
  console.log('Running in development mode');
}

const app = require('express')();
app.listen(config.port, () => {
  console.log('Port: ' + config.port);
  console.log('Env: ' + config.env);
});`,
      },
    ],
    exercises: [
      {
        prompt: 'Access an environment variable in Node.js:',
        placeholder: 'const dbUrl = process.___["DATABASE_URL"];',
        answer: 'env',
      },
      {
        prompt: 'Exit the process with a failure code:',
        placeholder: 'process.___(1);',
        answer: 'exit',
      },
    ],
  },

  /* ============================================================== */
  /*  11. ERROR HANDLING                                               */
  /* ============================================================== */
  {
    id: 'error-handling',
    title: 'Error Handling',
    explanation:
      'Robust error handling is critical in Node.js. Use try/catch with async/await, .catch() with Promises, and error-first callbacks. Distinguish between operational errors (expected, like invalid input or network timeout) and programmer errors (bugs). Register process-level handlers for uncaughtException and unhandledRejection as safety nets. In Express, use error middleware with four parameters. Create custom error classes for consistent error responses.',
    codeExamples: [
      {
        title: 'try/catch and async error handling',
        code: `const fs = require('fs');

// Synchronous try/catch
try {
  const data = JSON.parse('{ invalid json }');
} catch (err) {
  console.error('Parse error:', err.message);
}

// Async/await MUST use try/catch
async function readConfig(path) {
  try {
    const raw = await fs.promises.readFile(path, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    if (err.code === 'ENOENT') {
      console.error('File not found:', path);
      return null;
    }
    throw err; // re-throw unexpected errors
  }
}

// Promise .catch()
fs.promises.readFile('missing.txt', 'utf8')
  .then(data => console.log(data))
  .catch(err => console.error('Error:', err.code));

// Wrapping async Express handlers
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// app.get('/data', asyncHandler(async (req, res) => {
//   const data = await fetchData(); // errors go to next()
//   res.json(data);
// }));`,
      },
      {
        title: 'Custom error classes and process-level handlers',
        code: `// Custom error classes
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

class NotFoundError extends AppError {
  constructor(resource) {
    super(resource + ' not found', 404);
  }
}

class ValidationError extends AppError {
  constructor(message) {
    super(message, 400);
  }
}

// Usage
function getUser(id) {
  const user = null; // db lookup
  if (!user) throw new NotFoundError('User');
  return user;
}

// Global safety nets (last resort)
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION:', err);
  process.exit(1); // must exit -- state is unreliable
});

process.on('unhandledRejection', (reason) => {
  console.error('UNHANDLED REJECTION:', reason);
  process.exit(1);
});`,
      },
      {
        title: 'Express error handling pattern',
        code: `const express = require('express');
const app = express();
app.use(express.json());

// Wrap async route handlers
const wrap = (fn) => (req, res, next) =>
  fn(req, res, next).catch(next);

// Routes throw errors -- middleware catches them
app.get('/users/:id', wrap(async (req, res) => {
  const user = await db.findUser(req.params.id);
  if (!user) {
    const err = new Error('User not found');
    err.statusCode = 404;
    throw err;
  }
  res.json(user);
}));

// 404 handler -- after all routes
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error middleware (4 params) -- LAST
app.use((err, req, res, next) => {
  // Log full error in development
  if (process.env.NODE_ENV === 'development') {
    console.error(err.stack);
  }

  const status = err.statusCode || 500;
  res.status(status).json({
    error: err.message,
    ...(process.env.NODE_ENV === 'development' && {
      stack: err.stack
    })
  });
});

app.listen(3000);`,
      },
    ],
    exercises: [
      {
        prompt: 'Catch unhandled promise rejections at the process level:',
        placeholder: "process.on('___', (reason) => { console.error(reason); });",
        answer: 'unhandledRejection',
      },
      {
        prompt: 'Handle errors in async/await code:',
        placeholder: '___ { await riskyOperation(); } catch (err) { handleError(err); }',
        answer: 'try',
      },
    ],
  },

  /* ============================================================== */
  /*  12. REST API PATTERNS                                           */
  /* ============================================================== */
  {
    id: 'rest-api',
    title: 'REST API Patterns',
    explanation:
      'REST APIs follow conventions: use nouns for resources (/users, /posts), HTTP methods for actions (GET=read, POST=create, PUT=update, DELETE=remove), and proper status codes (200 OK, 201 Created, 204 No Content, 400 Bad Request, 401 Unauthorized, 404 Not Found, 500 Server Error). Implement request validation, pagination with query params (?page=1&limit=20), filtering/sorting, and consistent JSON response formats. Protect routes with JWT authentication and rate limiting.',
    codeExamples: [
      {
        title: 'CRUD API with validation',
        code: `const express = require('express');
const app = express();
app.use(express.json());

let users = [
  { id: 1, name: 'Alice', email: 'alice@test.com' },
  { id: 2, name: 'Bob', email: 'bob@test.com' },
];
let nextId = 3;

// Validation helper
function validateUser(body) {
  const errors = [];
  if (!body.name || body.name.length < 2)
    errors.push('Name must be at least 2 characters');
  if (!body.email || !body.email.includes('@'))
    errors.push('Valid email is required');
  return errors;
}

// GET /api/users -- list all
app.get('/api/users', (req, res) => {
  res.json({ data: users, total: users.length });
});

// GET /api/users/:id -- get one
app.get('/api/users/:id', (req, res) => {
  const user = users.find(u => u.id === +req.params.id);
  if (!user) return res.status(404).json({ error: 'Not found' });
  res.json({ data: user });
});

// POST /api/users -- create
app.post('/api/users', (req, res) => {
  const errors = validateUser(req.body);
  if (errors.length > 0)
    return res.status(400).json({ errors });
  const user = { id: nextId++, ...req.body };
  users.push(user);
  res.status(201).json({ data: user });
});

// DELETE /api/users/:id
app.delete('/api/users/:id', (req, res) => {
  users = users.filter(u => u.id !== +req.params.id);
  res.status(204).end();
});`,
      },
      {
        title: 'Pagination and filtering',
        code: `const express = require('express');
const app = express();

// Sample data
const products = Array.from({ length: 100 }, (_, i) => ({
  id: i + 1,
  name: 'Product ' + (i + 1),
  price: Math.round(Math.random() * 10000) / 100,
  category: ['electronics', 'books', 'clothing'][i % 3],
}));

// GET /api/products?page=1&limit=10&category=books&sort=price
app.get('/api/products', (req, res) => {
  let result = [...products];
  const page = parseInt(req.query.page) || 1;
  const limit = Math.min(parseInt(req.query.limit) || 20, 100);

  // Filter by category
  if (req.query.category) {
    result = result.filter(p => p.category === req.query.category);
  }

  // Filter by price range
  if (req.query.minPrice) {
    result = result.filter(p => p.price >= +req.query.minPrice);
  }

  // Sort
  if (req.query.sort) {
    const field = req.query.sort;
    const order = req.query.order === 'desc' ? -1 : 1;
    result.sort((a, b) => (a[field] > b[field] ? order : -order));
  }

  // Paginate
  const total = result.length;
  const start = (page - 1) * limit;
  const data = result.slice(start, start + limit);

  res.json({
    data,
    pagination: {
      page, limit, total,
      pages: Math.ceil(total / limit),
      hasNext: start + limit < total,
      hasPrev: page > 1,
    }
  });
});`,
      },
      {
        title: 'JWT auth pattern and rate limiting',
        code: `const express = require('express');
const jwt = require('jsonwebtoken');
const app = express();
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

// Login -- issue a token
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  // In real app: verify against database
  if (email === 'admin@test.com' && password === 'pass') {
    const token = jwt.sign(
      { userId: 1, role: 'admin' },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    return res.json({ token });
  }
  res.status(401).json({ error: 'Invalid credentials' });
});

// Auth middleware -- verify token
function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }
  try {
    const token = header.split(' ')[1];
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
}

// Protected route
app.get('/api/profile', auth, (req, res) => {
  res.json({ user: req.user });
});

// Simple rate limiter (in-memory)
const rateLimit = new Map();
function limiter(max, windowMs) {
  return (req, res, next) => {
    const ip = req.ip;
    const now = Date.now();
    const record = rateLimit.get(ip) || { count: 0, start: now };
    if (now - record.start > windowMs) {
      record.count = 0;
      record.start = now;
    }
    record.count++;
    rateLimit.set(ip, record);
    if (record.count > max) {
      return res.status(429).json({ error: 'Too many requests' });
    }
    next();
  };
}

app.use('/api/', limiter(100, 60000)); // 100 req/min`,
      },
    ],
    exercises: [
      {
        prompt: 'What status code indicates a resource was successfully created?',
        placeholder: 'res.status(___).json({ data: newItem });',
        answer: '201',
      },
      {
        prompt: 'What HTTP status code means "Too Many Requests" (rate limited)?',
        placeholder: 'res.status(___).json({ error: "Rate limited" });',
        answer: '429',
      },
    ],
  },
];

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export const NodeJsLab: React.FC = () => {
  const [activeTopic, setActiveTopic] = useState<string>(topics[0].id);
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [results, setResults] = useState<Record<string, boolean | null>>({});

  const current = topics.find((t) => t.id === activeTopic)!;
  const currentIdx = topics.findIndex((t) => t.id === activeTopic);

  const normalize = (s: string) =>
    s
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/["\u201c\u201d]/g, '"')
      .replace(/['\u2018\u2019]/g, "'")
      .toLowerCase();

  const exKey = (topicId: string, idx: number) => topicId + '-' + idx;

  const checkAnswer = (topicId: string, exIdx: number) => {
    const topic = topics.find((t) => t.id === topicId)!;
    const exercise = topic.exercises[exIdx];
    const key = exKey(topicId, exIdx);
    const input = inputs[key] ?? '';
    setResults((prev) => ({
      ...prev,
      [key]: normalize(input) === normalize(exercise.answer),
    }));
  };

  const resetExercise = (topicId: string, exIdx: number) => {
    const key = exKey(topicId, exIdx);
    setInputs((prev) => {
      const n = { ...prev };
      delete n[key];
      return n;
    });
    setResults((prev) => {
      const n = { ...prev };
      delete n[key];
      return n;
    });
  };

  const topicComplete = (topicId: string) => {
    const topic = topics.find((t) => t.id === topicId)!;
    return topic.exercises.every((_, i) => results[exKey(topicId, i)] === true);
  };

  const topicAttempted = (topicId: string) => {
    const topic = topics.find((t) => t.id === topicId)!;
    return topic.exercises.some((_, i) => results[exKey(topicId, i)] !== undefined);
  };

  const completedCount = topics.filter((t) => topicComplete(t.id)).length;

  return (
    <div className="h-full flex flex-col overflow-hidden bg-gradient-to-br from-slate-50 to-green-50 dark:from-gray-950 dark:to-green-950/20">
      {/* Header */}
      <div className="flex-none flex items-center gap-2 px-4 py-2.5 border-b border-gray-200 dark:border-gray-800 bg-white/60 dark:bg-gray-900/60 backdrop-blur">
        <div className="p-1.5 rounded-md bg-green-100 dark:bg-green-900/40">
          <Code size={16} className="text-green-600 dark:text-green-400" />
        </div>
        <h1 className="text-sm font-semibold text-gray-800 dark:text-gray-100">Node.js Lab</h1>
        <span className="ml-2 text-[10px] px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 font-medium">
          {completedCount}/{topics.length} complete
        </span>
        <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 font-medium">
          Interactive
        </span>
      </div>

      <div className="flex-1 flex min-h-0">
        {/* Sidebar */}
        <div className="flex-none w-56 border-r border-gray-200 dark:border-gray-800 bg-white/40 dark:bg-gray-900/40 overflow-y-auto">
          <div className="px-3 py-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
              Topics
            </span>
          </div>
          <nav className="px-1.5 pb-3 space-y-0.5">
            {topics.map((topic, i) => {
              const isActive = topic.id === activeTopic;
              const done = topicComplete(topic.id);
              const attempted = topicAttempted(topic.id);
              return (
                <button
                  key={topic.id}
                  onClick={() => setActiveTopic(topic.id)}
                  className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-200 shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/60 hover:text-gray-800 dark:hover:text-gray-200'
                  }`}
                >
                  <span className="flex-none w-4 h-4 flex items-center justify-center rounded text-[9px] bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 font-bold">
                    {i + 1}
                  </span>
                  <span className="truncate text-left">{topic.title}</span>
                  {done && <Check size={12} className="ml-auto flex-none text-green-500" />}
                  {!done && attempted && <X size={12} className="ml-auto flex-none text-red-400" />}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Topic heading */}
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 text-xs font-bold">
              {currentIdx + 1}
            </span>
            <h2 className="text-base font-bold text-gray-800 dark:text-gray-100">{current.title}</h2>
            <span className="text-[10px] text-gray-400 dark:text-gray-500 ml-1">
              {current.codeExamples.length} examples / {current.exercises.length} exercises
            </span>
          </div>

          {/* Explanation */}
          <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-900/50 p-3">
            <div className="flex items-center gap-1.5 mb-1.5">
              <BookOpen size={12} className="text-blue-500 dark:text-blue-400" />
              <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Explanation
              </span>
            </div>
            <p className="text-xs leading-relaxed text-gray-700 dark:text-gray-300">{current.explanation}</p>
          </div>

          {/* Code examples */}
          {current.codeExamples.map((ex, i) => (
            <div key={i}>
              <div className="flex items-center gap-1.5 mb-1.5">
                <Code size={12} className="text-purple-500 dark:text-purple-400" />
                <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Example {i + 1}: {ex.title}
                </span>
              </div>
              <CodeBlock code={ex.code} />
            </div>
          ))}

          {/* Exercises */}
          <div className="space-y-3">
            <div className="flex items-center gap-1.5">
              <ChevronRight size={12} className="text-green-600 dark:text-green-400" />
              <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Exercises
              </span>
            </div>

            {current.exercises.map((exercise, exIdx) => {
              const key = exKey(current.id, exIdx);
              const result = results[key];
              return (
                <div
                  key={exIdx}
                  className={`rounded-lg border p-3 ${
                    result === true
                      ? 'border-green-300 dark:border-green-700 bg-green-50/70 dark:bg-green-950/30'
                      : result === false
                      ? 'border-red-300 dark:border-red-700 bg-red-50/70 dark:bg-red-950/30'
                      : 'border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-gray-900/30'
                  }`}
                >
                  <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {exIdx + 1}. {exercise.prompt}
                  </p>
                  <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                    <code className="text-[11px] text-gray-500 dark:text-gray-400 font-mono whitespace-nowrap">
                      {exercise.placeholder.split('___')[0]}
                    </code>
                    <input
                      type="text"
                      value={inputs[key] ?? ''}
                      onChange={(e) => setInputs((prev) => ({ ...prev, [key]: e.target.value }))}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') checkAnswer(current.id, exIdx);
                      }}
                      placeholder="your answer"
                      className="flex-1 min-w-[80px] max-w-[200px] px-2 py-1 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-xs font-mono text-gray-800 dark:text-gray-200 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-green-400 dark:focus:ring-green-600"
                    />
                    <code className="text-[11px] text-gray-500 dark:text-gray-400 font-mono whitespace-nowrap">
                      {exercise.placeholder.split('___').slice(1).join('___')}
                    </code>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => checkAnswer(current.id, exIdx)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-green-500 hover:bg-green-600 text-white transition-colors"
                    >
                      <Check size={12} /> Check
                    </button>
                    <button
                      onClick={() => resetExercise(current.id, exIdx)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 transition-colors"
                    >
                      <RotateCcw size={12} /> Reset
                    </button>
                    {result === true && (
                      <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400 font-medium ml-auto">
                        <Check size={14} /> Correct!
                      </span>
                    )}
                    {result === false && (
                      <span className="flex items-center gap-1 text-xs text-red-600 dark:text-red-400 font-medium ml-auto">
                        <X size={14} /> Try again
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between pt-2 pb-6">
            {currentIdx > 0 ? (
              <button
                onClick={() => setActiveTopic(topics[currentIdx - 1].id)}
                className="flex items-center gap-1 text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              >
                <ChevronRight size={12} className="rotate-180" />
                {topics[currentIdx - 1].title}
              </button>
            ) : (
              <div />
            )}
            {currentIdx < topics.length - 1 ? (
              <button
                onClick={() => setActiveTopic(topics[currentIdx + 1].id)}
                className="flex items-center gap-1 text-xs font-medium text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 transition-colors"
              >
                {topics[currentIdx + 1].title}
                <ChevronRight size={12} />
              </button>
            ) : (
              <div />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
