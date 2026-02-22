import React, { useState } from 'react';
import { BookOpen, Code, ChevronRight, Check, X, RotateCcw } from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Exercise {
  id: string;
  prompt: string;
  placeholder: string;
  answer: string;
}

interface CodeExample {
  title: string;
  code: string;
}

interface Topic {
  id: string;
  title: string;
  explanation: string;
  examples: CodeExample[];
  exercises: Exercise[];
}

/* ------------------------------------------------------------------ */
/*  Syntax-highlighted code renderer                                   */
/* ------------------------------------------------------------------ */

const tokenize = (code: string): React.ReactNode[] => {
  const rules: { pattern: RegExp; cls: string }[] = [
    { pattern: /(\/\/[^\n]*)/, cls: 'text-gray-500' },
    { pattern: /(\/\*[\s\S]*?\*\/)/, cls: 'text-gray-500' },
    {
      pattern: /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)/,
      cls: 'text-green-400',
    },
    { pattern: /\b(\d+(?:\.\d+)?n?)\b/, cls: 'text-orange-400' },
    {
      pattern:
        /\b(const|let|var|function|return|if|else|for|while|do|switch|case|break|continue|new|class|extends|constructor|this|super|try|catch|finally|throw|import|export|default|from|async|await|yield|of|in|typeof|instanceof|null|undefined|true|false|static|get|set|delete|void|with|debugger|enum|implements|interface|package|private|protected|public)\b/,
      cls: 'text-blue-400',
    },
    {
      pattern:
        /\b(console|Promise|Array|Object|Math|JSON|Error|TypeError|ReferenceError|SyntaxError|RangeError|Map|Set|WeakMap|WeakSet|Symbol|Proxy|Reflect|Number|String|Boolean|Date|RegExp|Function|parseInt|parseFloat|isNaN|isFinite|fetch|setTimeout|setInterval|clearTimeout|clearInterval|queueMicrotask|globalThis|window|document)\b/,
      cls: 'text-yellow-400',
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
    if (match.index > lastIndex) {
      nodes.push(
        <span key={key++} className="text-gray-200">
          {code.slice(lastIndex, match.index)}
        </span>
      );
    }

    const text = match[0];
    let cls = 'text-gray-200';

    let found = false;
    for (let g = 1; g <= match.length - 1; g++) {
      if (match[g] === text) {
        let accum = 1;
        for (const rule of rules) {
          const groups =
            (rule.pattern.source.match(/\((?!\?)/g)?.length ?? 0) || 1;
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

  if (lastIndex < code.length) {
    nodes.push(
      <span key={key++} className="text-gray-200">
        {code.slice(lastIndex)}
      </span>
    );
  }

  return nodes;
};

const CodeBlock: React.FC<{ code: string; title?: string }> = ({
  code,
  title,
}) => (
  <div className="bg-gray-950 rounded-lg p-3 font-mono text-[12px] overflow-x-auto border border-gray-800">
    {title && (
      <div className="flex items-center gap-1.5 mb-2 pb-1.5 border-b border-gray-800">
        <span className="w-2 h-2 rounded-full bg-red-500" />
        <span className="w-2 h-2 rounded-full bg-yellow-500" />
        <span className="w-2 h-2 rounded-full bg-green-500" />
        <span className="ml-1.5 text-[10px] text-gray-500">{title}</span>
      </div>
    )}
    <pre className="leading-relaxed whitespace-pre-wrap">{tokenize(code)}</pre>
  </div>
);

/* ------------------------------------------------------------------ */
/*  Topic data                                                         */
/* ------------------------------------------------------------------ */

const topics: Topic[] = [
  /* ---- 1. INTRODUCTION ---- */
  {
    id: 'intro',
    title: 'Introduction',
    explanation:
      'JavaScript is the programming language of the web. Every browser ships a JS engine (V8 in Chrome, SpiderMonkey in Firefox). With Node.js, JS also runs server-side. You can run JS in the browser console (F12), inside a <script> tag, or as standalone .js files. JS is dynamically typed, single-threaded, and uses an event-driven execution model.',
    examples: [
      {
        title: 'hello.js',
        code: `// Your first JavaScript program
console.log("Hello, JavaScript!");

// Variables hold data
let message = "Welcome to the lab";
console.log(message);

// JS can do math
console.log(2 + 2);       // 4
console.log(10 * 3);      // 30`,
      },
      {
        title: 'environment.js',
        code: `// Detect runtime environment
if (typeof window !== "undefined") {
  console.log("Running in a browser");
  console.log("URL:", window.location.href);
} else {
  console.log("Running in Node.js");
  console.log("Version:", process.version);
}

// Using the script tag in HTML
// <script src="app.js"></script>
// <script>console.log("inline JS");</script>`,
      },
      {
        title: 'console-methods.js',
        code: `// console has many useful methods
console.log("Regular log");
console.warn("This is a warning");
console.error("This is an error");
console.table({ name: "Alice", age: 25 });

// Timing code execution
console.time("loop");
for (let i = 0; i < 100000; i++) {}
console.timeEnd("loop"); // loop: 1.23ms`,
      },
    ],
    exercises: [
      {
        id: 'intro-1',
        prompt:
          'Complete the statement to print "Hello World" to the console:',
        placeholder: 'console.___(___)',
        answer: 'log "Hello World"',
      },
      {
        id: 'intro-2',
        prompt:
          'Which keyword checks the data type of a value at runtime?',
        placeholder: '___ 42',
        answer: 'typeof',
      },
    ],
  },
  /* ---- 2. VARIABLES & TYPES ---- */
  {
    id: 'variables',
    title: 'Variables & Types',
    explanation:
      'JavaScript has three variable declaration keywords: const (block-scoped, cannot be reassigned), let (block-scoped, can be reassigned), and var (function-scoped, hoisted -- avoid in modern code). JS has 8 data types: string, number, boolean, null, undefined, BigInt, Symbol, and object. Template literals use backticks for string interpolation.',
    examples: [
      {
        title: 'declarations.js',
        code: `// const -- use by default
const PI = 3.14159;
const APP_NAME = "SecureNexus";

// let -- when value will change
let score = 0;
score = 10;      // OK
score += 5;      // 15

// var -- legacy, avoid
var old = "hoisted to function scope";

// const with objects/arrays -- reference is fixed,
// but contents can be mutated
const arr = [1, 2, 3];
arr.push(4);     // OK -- modifying content
// arr = [5];    // ERROR -- reassigning reference`,
      },
      {
        title: 'types.js',
        code: `// Primitive types
const str = "hello";           // string
const num = 42;                // number
const float = 3.14;           // number (no int/float distinction)
const big = 9007199254740991n; // BigInt
const bool = true;            // boolean
const empty = null;            // null (intentional absence)
let x;                         // undefined (not yet assigned)
const sym = Symbol("id");     // Symbol (unique identifier)

// typeof operator
console.log(typeof str);    // "string"
console.log(typeof num);    // "number"
console.log(typeof bool);   // "boolean"
console.log(typeof empty);  // "object" (historical bug)
console.log(typeof x);      // "undefined"
console.log(typeof sym);    // "symbol"
console.log(typeof big);    // "bigint"`,
      },
      {
        title: 'template-literals.js',
        code: `// Template literals with backticks
const name = "Alice";
const age = 30;

// String interpolation
console.log(\`Hello, \${name}!\`);
console.log(\`Age next year: \${age + 1}\`);

// Multi-line strings
const html = \`
  <div>
    <h1>\${name}</h1>
    <p>Age: \${age}</p>
  </div>
\`;

// Expression in template
const price = 9.99;
const qty = 3;
console.log(\`Total: $\${(price * qty).toFixed(2)}\`);
// Total: $29.97`,
      },
    ],
    exercises: [
      {
        id: 'var-1',
        prompt:
          'Declare a block-scoped variable "age" set to 25 that can be reassigned later:',
        placeholder: '___ age = 25;',
        answer: 'let',
      },
      {
        id: 'var-2',
        prompt:
          'What does typeof null return in JavaScript?',
        placeholder: 'typeof null === "___"',
        answer: 'object',
      },
    ],
  },
  /* ---- 3. OPERATORS ---- */
  {
    id: 'operators',
    title: 'Operators',
    explanation:
      'JavaScript has arithmetic (+, -, *, /, %, **), comparison (==, ===, !=, !==, <, >, <=, >=), logical (&&, ||, !), and assignment operators. Always prefer strict equality (===) which checks both value and type. The nullish coalescing operator (??) returns the right operand when the left is null or undefined. Optional chaining (?.) safely accesses nested properties.',
    examples: [
      {
        title: 'arithmetic-comparison.js',
        code: `// Arithmetic operators
console.log(10 + 3);    // 13
console.log(10 - 3);    // 7
console.log(10 * 3);    // 30
console.log(10 / 3);    // 3.333...
console.log(10 % 3);    // 1 (remainder)
console.log(2 ** 10);   // 1024 (exponent)

// Strict vs loose equality
console.log(0 == false);    // true  (type coercion)
console.log(0 === false);   // false (no coercion)
console.log("5" == 5);      // true  (string coerced)
console.log("5" === 5);     // false (different types)
console.log(null == undefined);  // true
console.log(null === undefined); // false`,
      },
      {
        title: 'logical-ternary.js',
        code: `// Logical operators
const a = true, b = false;
console.log(a && b);   // false (AND)
console.log(a || b);   // true  (OR)
console.log(!a);        // false (NOT)

// Short-circuit evaluation
const user = null;
const name = user && user.name; // null (short-circuits)
const fallback = name || "Guest"; // "Guest"

// Ternary operator
const age = 20;
const status = age >= 18 ? "adult" : "minor";
console.log(status); // "adult"

// Nested ternary (use sparingly)
const grade = 85;
const letter = grade >= 90 ? "A"
             : grade >= 80 ? "B"
             : grade >= 70 ? "C" : "F";
console.log(letter); // "B"`,
      },
      {
        title: 'nullish-optional.js',
        code: `// Nullish coalescing (??)
// Returns right side only for null/undefined
const val1 = null ?? "default";    // "default"
const val2 = undefined ?? "default"; // "default"
const val3 = 0 ?? "default";      // 0 (not null)
const val4 = "" ?? "default";     // "" (not null)
const val5 = false ?? "default";  // false (not null)

// Compare with || which treats 0, "", false as falsy
const val6 = 0 || "default";     // "default"

// Optional chaining (?.)
const user = { profile: { address: { city: "NYC" } } };
console.log(user?.profile?.address?.city); // "NYC"
console.log(user?.settings?.theme);        // undefined

// With methods and arrays
const arr = [1, 2, 3];
console.log(arr?.[0]);  // 1
console.log(arr?.at?.(-1)); // 3`,
      },
    ],
    exercises: [
      {
        id: 'op-1',
        prompt:
          'What operator checks both value AND type without coercion?',
        placeholder: '5 ___ "5" // false',
        answer: '===',
      },
      {
        id: 'op-2',
        prompt:
          'What operator returns the right side only if the left is null or undefined?',
        placeholder: 'const val = maybeNull ___ "fallback";',
        answer: '??',
      },
    ],
  },
  /* ---- 4. STRINGS & ARRAYS ---- */
  {
    id: 'strings-arrays',
    title: 'Strings & Arrays',
    explanation:
      'Strings are immutable sequences of characters with many built-in methods like slice, split, includes, replace, trim, padStart, and repeat. Arrays are ordered, mutable collections with powerful iteration methods: map (transform), filter (select), reduce (accumulate), find (locate), some/every (test), flat (flatten), and forEach (iterate). Chaining these methods enables concise data processing.',
    examples: [
      {
        title: 'string-methods.js',
        code: `const str = "  Hello, World!  ";

// Trimming & case
console.log(str.trim());           // "Hello, World!"
console.log(str.trim().toLowerCase()); // "hello, world!"
console.log(str.trim().toUpperCase()); // "HELLO, WORLD!"

// Searching
console.log(str.includes("World")); // true
console.log(str.indexOf("World"));  // 9
console.log(str.startsWith("  He")); // true

// Extracting
console.log("abcdef".slice(1, 4));  // "bcd"
console.log("abcdef".slice(-3));    // "def"

// Splitting & joining
const csv = "a,b,c,d";
const parts = csv.split(",");       // ["a","b","c","d"]
console.log(parts.join(" - "));     // "a - b - c - d"

// Replace
console.log("foo bar foo".replace("foo", "baz"));    // "baz bar foo"
console.log("foo bar foo".replaceAll("foo", "baz")); // "baz bar baz"

// Padding & repeating
console.log("5".padStart(3, "0"));  // "005"
console.log("ha".repeat(3));        // "hahaha"`,
      },
      {
        title: 'array-basics.js',
        code: `// Creating arrays
const nums = [1, 2, 3, 4, 5];
const mixed = [1, "two", true, null];
const empty = [];
const filled = Array(5).fill(0); // [0, 0, 0, 0, 0]

// Adding / removing
const arr = [1, 2, 3];
arr.push(4);          // [1,2,3,4] -- add to end
arr.unshift(0);       // [0,1,2,3,4] -- add to start
arr.pop();            // [0,1,2,3] -- remove from end
arr.shift();          // [1,2,3] -- remove from start
arr.splice(1, 1);     // [1,3] -- remove at index 1

// Checking
console.log([1, 2, 3].includes(2)); // true
console.log(Array.isArray([1]));     // true
console.log([1, 2, 3].indexOf(2));   // 1

// Spreading & copying
const a = [1, 2];
const b = [3, 4];
const merged = [...a, ...b];  // [1,2,3,4]
const copy = [...a];           // [1,2] (shallow copy)`,
      },
      {
        title: 'array-iteration.js',
        code: `const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

// map -- transform each element
const doubled = nums.map(n => n * 2);
// [2, 4, 6, 8, 10, 12, 14, 16, 18, 20]

// filter -- keep matching elements
const evens = nums.filter(n => n % 2 === 0);
// [2, 4, 6, 8, 10]

// reduce -- accumulate to single value
const sum = nums.reduce((acc, n) => acc + n, 0);
// 55

// find / findIndex
const firstBig = nums.find(n => n > 7);    // 8
const idx = nums.findIndex(n => n > 7);    // 7

// some / every
console.log(nums.some(n => n > 9));   // true
console.log(nums.every(n => n > 0));  // true

// flat -- flatten nested arrays
const nested = [[1, 2], [3, [4, 5]]];
console.log(nested.flat());    // [1,2,3,[4,5]]
console.log(nested.flat(2));   // [1,2,3,4,5]

// forEach -- side effects only (no return)
nums.forEach((n, i) => {
  if (n % 5 === 0) console.log(\`Index \${i}: \${n}\`);
});
// Index 4: 5
// Index 9: 10`,
      },
    ],
    exercises: [
      {
        id: 'sa-1',
        prompt:
          'Use .filter() to keep only numbers greater than 3 from [1,2,3,4,5]:',
        placeholder: '[1,2,3,4,5].filter(___)',
        answer: 'n => n > 3',
      },
      {
        id: 'sa-2',
        prompt:
          'Use .reduce() to compute the product of [2,3,4] (result: 24):',
        placeholder: '[2,3,4].reduce((acc, n) => ___, 1)',
        answer: 'acc * n',
      },
    ],
  },
  /* ---- 5. CONTROL FLOW ---- */
  {
    id: 'control',
    title: 'Control Flow',
    explanation:
      'JavaScript offers if/else for branching, switch for multi-way dispatch, and several loop constructs: for (classic counter), for...of (iterate values of iterables), for...in (iterate object keys), while, and do-while. Break exits a loop early, continue skips to the next iteration. Label statements allow breaking out of nested loops.',
    examples: [
      {
        title: 'branching.js',
        code: `// if / else if / else
const score = 85;
if (score >= 90) {
  console.log("Grade: A");
} else if (score >= 80) {
  console.log("Grade: B");
} else if (score >= 70) {
  console.log("Grade: C");
} else {
  console.log("Grade: F");
}
// Grade: B

// switch statement
const day = "Monday";
switch (day) {
  case "Monday":
  case "Tuesday":
  case "Wednesday":
  case "Thursday":
  case "Friday":
    console.log("Weekday");
    break;
  case "Saturday":
  case "Sunday":
    console.log("Weekend");
    break;
  default:
    console.log("Invalid day");
}
// Weekday`,
      },
      {
        title: 'loops.js',
        code: `// Classic for loop
for (let i = 0; i < 5; i++) {
  console.log(i); // 0, 1, 2, 3, 4
}

// for...of -- iterate over values (arrays, strings, maps)
const colors = ["red", "green", "blue"];
for (const color of colors) {
  console.log(color);
}

// for...in -- iterate over keys (objects)
const user = { name: "Alice", age: 30, role: "admin" };
for (const key in user) {
  console.log(\`\${key}: \${user[key]}\`);
}

// while loop
let count = 0;
while (count < 3) {
  console.log(\`Count: \${count}\`);
  count++;
}

// do-while -- always runs at least once
let input;
do {
  input = "valid"; // simulated
  console.log("Processing:", input);
} while (input !== "valid");`,
      },
      {
        title: 'break-continue-label.js',
        code: `// break -- exit loop early
for (let i = 0; i < 10; i++) {
  if (i === 5) break;
  console.log(i); // 0, 1, 2, 3, 4
}

// continue -- skip current iteration
for (let i = 0; i < 6; i++) {
  if (i % 2 === 0) continue;
  console.log(i); // 1, 3, 5
}

// Label statement -- break outer loop
outer: for (let i = 0; i < 3; i++) {
  for (let j = 0; j < 3; j++) {
    if (i === 1 && j === 1) break outer;
    console.log(\`i=\${i}, j=\${j}\`);
  }
}
// i=0,j=0  i=0,j=1  i=0,j=2  i=1,j=0`,
      },
    ],
    exercises: [
      {
        id: 'cf-1',
        prompt:
          'Which loop keyword iterates over the values of an array or iterable?',
        placeholder: 'for (const item ___ array) {}',
        answer: 'of',
      },
      {
        id: 'cf-2',
        prompt:
          'Which keyword skips the rest of the current iteration and jumps to the next one?',
        placeholder: 'if (skip) ___;',
        answer: 'continue',
      },
    ],
  },
  /* ---- 6. FUNCTIONS ---- */
  {
    id: 'functions',
    title: 'Functions',
    explanation:
      'Functions are first-class values in JavaScript. They can be declared with the function keyword or as arrow functions (=>). Arrow functions have concise syntax and lexically bind "this". Functions support default parameters, rest parameters (...args), and can be immediately invoked (IIFE). Closures occur when inner functions capture variables from their outer scope. Higher-order functions accept or return functions.',
    examples: [
      {
        title: 'declaration-vs-expression.js',
        code: `// Function declaration (hoisted)
function greet(name) {
  return "Hello, " + name + "!";
}
console.log(greet("Alice")); // Hello, Alice!

// Function expression (not hoisted)
const square = function(x) {
  return x * x;
};

// Arrow function -- concise
const add = (a, b) => a + b;
const double = x => x * 2;   // single param: no parens

// Arrow with block body
const clamp = (val, min, max) => {
  if (val < min) return min;
  if (val > max) return max;
  return val;
};
console.log(clamp(15, 0, 10)); // 10

// Default and rest parameters
const greetAll = (greeting = "Hi", ...names) => {
  return names.map(n => \`\${greeting}, \${n}!\`);
};
console.log(greetAll("Hey", "Alice", "Bob"));
// ["Hey, Alice!", "Hey, Bob!"]`,
      },
      {
        title: 'closures-callbacks.js',
        code: `// Closure -- function remembers its scope
function createCounter(start = 0) {
  let count = start;
  return {
    increment: () => ++count,
    decrement: () => --count,
    getCount: () => count,
  };
}
const counter = createCounter(10);
counter.increment();
counter.increment();
console.log(counter.getCount()); // 12

// Callback pattern
function fetchData(url, onSuccess, onError) {
  // Simulated async operation
  const success = true;
  if (success) {
    onSuccess({ data: "result" });
  } else {
    onError(new Error("Failed"));
  }
}
fetchData(
  "/api/users",
  (data) => console.log("Got:", data),
  (err) => console.error(err.message)
);

// IIFE -- Immediately Invoked Function Expression
const result = (() => {
  const secret = 42;
  return secret * 2;
})();
console.log(result); // 84`,
      },
      {
        title: 'higher-order.js',
        code: `// Higher-order function: takes a function as argument
function repeat(n, action) {
  for (let i = 0; i < n; i++) {
    action(i);
  }
}
repeat(3, i => console.log(\`Step \${i}\`));
// Step 0, Step 1, Step 2

// Higher-order function: returns a function
function multiplier(factor) {
  return (number) => number * factor;
}
const triple = multiplier(3);
const tenX = multiplier(10);
console.log(triple(5));  // 15
console.log(tenX(5));    // 50

// Function composition
const compose = (f, g) => (x) => f(g(x));
const addOne = x => x + 1;
const doubleIt = x => x * 2;
const doubleThenAdd = compose(addOne, doubleIt);
console.log(doubleThenAdd(5)); // 11 (5*2+1)`,
      },
    ],
    exercises: [
      {
        id: 'fn-1',
        prompt:
          'Write an arrow function "double" that takes a number and returns it times 2:',
        placeholder: 'const double = ___',
        answer: 'n => n * 2',
      },
      {
        id: 'fn-2',
        prompt:
          'What pattern occurs when an inner function captures a variable from its outer scope?',
        placeholder: '___',
        answer: 'closure',
      },
    ],
  },
  /* ---- 7. OBJECTS ---- */
  {
    id: 'objects',
    title: 'Objects',
    explanation:
      'Objects store key-value pairs and are the backbone of JavaScript. Property access uses dot notation (obj.key) or bracket notation (obj["key"]). Destructuring extracts properties into variables. The spread operator (...) copies or merges objects. Object.keys(), Object.values(), and Object.entries() provide iteration helpers. Computed property names use [expression] syntax inside object literals. The "this" keyword refers to the object a method is called on.',
    examples: [
      {
        title: 'object-basics.js',
        code: `// Object literal
const user = {
  name: "Alice",
  age: 30,
  role: "admin",
  isActive: true,
};

// Dot vs bracket notation
console.log(user.name);        // "Alice"
console.log(user["age"]);      // 30

// Dynamic key with bracket notation
const key = "role";
console.log(user[key]);        // "admin"

// Shorthand properties
const x = 10, y = 20;
const point = { x, y };        // { x: 10, y: 20 }

// Computed property names
const field = "email";
const profile = {
  [field]: "alice@test.com",
  [\`\${field}Verified\`]: true,
};
console.log(profile.email);          // "alice@test.com"
console.log(profile.emailVerified);  // true`,
      },
      {
        title: 'destructuring-spread.js',
        code: `// Object destructuring
const user = { name: "Bob", age: 25, role: "user" };
const { name, age, role } = user;
console.log(name, age); // Bob 25

// Renaming during destructuring
const { name: userName, role: userRole } = user;
console.log(userName);  // "Bob"

// Default values
const { theme = "light", lang = "en" } = {};
console.log(theme, lang); // "light" "en"

// Nested destructuring
const data = { user: { address: { city: "NYC" } } };
const { user: { address: { city } } } = data;
console.log(city); // "NYC"

// Spread operator -- merge / copy
const defaults = { theme: "dark", lang: "en" };
const prefs = { theme: "light", fontSize: 14 };
const config = { ...defaults, ...prefs };
// { theme: "light", lang: "en", fontSize: 14 }

// Rest in destructuring
const { name: n, ...rest } = user;
console.log(rest); // { age: 25, role: "user" }`,
      },
      {
        title: 'object-methods.js',
        code: `const car = {
  brand: "Tesla",
  model: "Model 3",
  year: 2024,
  specs: { hp: 283, range: 358 },
};

// Object.keys / values / entries
console.log(Object.keys(car));
// ["brand", "model", "year", "specs"]

console.log(Object.values(car));
// ["Tesla", "Model 3", 2024, {...}]

Object.entries(car).forEach(([key, val]) => {
  console.log(\`\${key}: \${val}\`);
});

// Object.assign -- merge (mutates target)
const target = { a: 1 };
Object.assign(target, { b: 2 }, { c: 3 });
// target = { a: 1, b: 2, c: 3 }

// Object.freeze -- make immutable
const frozen = Object.freeze({ x: 1, y: 2 });
frozen.x = 99; // silently fails (or throws in strict)
console.log(frozen.x); // 1

// "this" keyword
const person = {
  name: "Charlie",
  greet() {
    return \`Hi, I'm \${this.name}\`;
  },
};
console.log(person.greet()); // "Hi, I'm Charlie"`,
      },
    ],
    exercises: [
      {
        id: 'obj-1',
        prompt:
          'Destructure "name" and "age" from { name: "Eve", age: 28 }:',
        placeholder: 'const { ___ } = person;',
        answer: 'name, age',
      },
      {
        id: 'obj-2',
        prompt:
          'Which method returns an array of [key, value] pairs from an object?',
        placeholder: 'Object.___(myObj)',
        answer: 'entries',
      },
    ],
  },
  /* ---- 8. OOP ---- */
  {
    id: 'oop',
    title: 'OOP',
    explanation:
      'ES6 classes provide syntactic sugar over JavaScript\'s prototypal inheritance. Classes have a constructor for initialization, methods for behavior, getters/setters for computed properties, and static members for class-level utilities. Inheritance uses extends and super. Private fields (prefixed with #) are truly encapsulated. The instanceof operator checks the prototype chain.',
    examples: [
      {
        title: 'class-basics.js',
        code: `class Animal {
  constructor(name, sound) {
    this.name = name;
    this.sound = sound;
  }

  speak() {
    return \`\${this.name} says \${this.sound}\`;
  }

  toString() {
    return \`Animal(\${this.name})\`;
  }
}

const cat = new Animal("Cat", "Meow");
console.log(cat.speak());     // Cat says Meow
console.log(cat.toString());  // Animal(Cat)
console.log(cat instanceof Animal); // true

// Getters and setters
class Temperature {
  constructor(celsius) {
    this.celsius = celsius;
  }

  get fahrenheit() {
    return this.celsius * 9 / 5 + 32;
  }

  set fahrenheit(f) {
    this.celsius = (f - 32) * 5 / 9;
  }
}

const temp = new Temperature(100);
console.log(temp.fahrenheit); // 212
temp.fahrenheit = 32;
console.log(temp.celsius);   // 0`,
      },
      {
        title: 'inheritance.js',
        code: `class Shape {
  constructor(color = "black") {
    this.color = color;
  }

  area() {
    return 0;
  }

  describe() {
    return \`\${this.color} shape, area: \${this.area()}\`;
  }
}

class Circle extends Shape {
  constructor(radius, color) {
    super(color);
    this.radius = radius;
  }

  area() {
    return Math.PI * this.radius ** 2;
  }
}

class Rectangle extends Shape {
  constructor(w, h, color) {
    super(color);
    this.w = w;
    this.h = h;
  }

  area() {
    return this.w * this.h;
  }
}

const c = new Circle(5, "red");
console.log(c.describe());
// red shape, area: 78.539...
console.log(c instanceof Shape); // true

const r = new Rectangle(4, 6, "blue");
console.log(r.area()); // 24`,
      },
      {
        title: 'private-static.js',
        code: `class BankAccount {
  // Private fields (truly encapsulated)
  #balance;
  #owner;

  // Static property
  static #accountCount = 0;

  constructor(owner, initialBalance = 0) {
    this.#owner = owner;
    this.#balance = initialBalance;
    BankAccount.#accountCount++;
  }

  deposit(amount) {
    if (amount <= 0) throw new Error("Invalid amount");
    this.#balance += amount;
    return this;
  }

  withdraw(amount) {
    if (amount > this.#balance) throw new Error("Insufficient funds");
    this.#balance -= amount;
    return this;
  }

  get balance() {
    return this.#balance;
  }

  // Static method
  static getAccountCount() {
    return BankAccount.#accountCount;
  }
}

const acc = new BankAccount("Alice", 100);
acc.deposit(50).withdraw(30);
console.log(acc.balance);    // 120
// acc.#balance = 999;       // SyntaxError!
console.log(BankAccount.getAccountCount()); // 1`,
      },
    ],
    exercises: [
      {
        id: 'oop-1',
        prompt:
          'Add a constructor that sets this.name to the given argument:',
        placeholder: 'class Person { ___ }',
        answer: 'constructor(name) { this.name = name; }',
      },
      {
        id: 'oop-2',
        prompt:
          'Which keyword calls the parent class constructor inside a child class?',
        placeholder: 'class Dog extends Animal { constructor() { ___(); } }',
        answer: 'super',
      },
    ],
  },
  /* ---- 9. ERROR HANDLING ---- */
  {
    id: 'errors',
    title: 'Error Handling',
    explanation:
      'Use try/catch/finally to handle runtime errors gracefully. The throw keyword creates an error. JavaScript has built-in error types: Error, TypeError (wrong type), ReferenceError (undefined variable), SyntaxError (bad syntax), and RangeError (out-of-range value). Custom error classes extend Error for domain-specific failures. The finally block always runs regardless of success or failure.',
    examples: [
      {
        title: 'try-catch-finally.js',
        code: `// Basic try/catch
function parseJSON(str) {
  try {
    const data = JSON.parse(str);
    console.log("Parsed:", data);
    return data;
  } catch (error) {
    console.log("Failed:", error.message);
    return null;
  } finally {
    console.log("Attempt complete");
  }
}

parseJSON('{"valid": true}');
// Parsed: { valid: true }
// Attempt complete

parseJSON('not json');
// Failed: Unexpected token 'o'...
// Attempt complete

// Catching specific error types
function safeDivide(a, b) {
  if (typeof a !== "number" || typeof b !== "number") {
    throw new TypeError("Arguments must be numbers");
  }
  if (b === 0) {
    throw new RangeError("Cannot divide by zero");
  }
  return a / b;
}

try {
  safeDivide(10, 0);
} catch (e) {
  if (e instanceof RangeError) {
    console.log("Range error:", e.message);
  } else if (e instanceof TypeError) {
    console.log("Type error:", e.message);
  }
}`,
      },
      {
        title: 'custom-errors.js',
        code: `// Custom error class
class ValidationError extends Error {
  constructor(field, message) {
    super(message);
    this.name = "ValidationError";
    this.field = field;
  }
}

class NotFoundError extends Error {
  constructor(resource, id) {
    super(\`\${resource} with id \${id} not found\`);
    this.name = "NotFoundError";
    this.resource = resource;
    this.id = id;
  }
}

// Using custom errors
function validateUser(user) {
  if (!user.name) {
    throw new ValidationError("name", "Name is required");
  }
  if (user.age < 0 || user.age > 150) {
    throw new ValidationError("age", "Age out of range");
  }
  return true;
}

try {
  validateUser({ name: "", age: 25 });
} catch (e) {
  if (e instanceof ValidationError) {
    console.log(\`\${e.field}: \${e.message}\`);
    // name: Name is required
  }
}

// Error properties
const err = new Error("Something broke");
console.log(err.name);     // "Error"
console.log(err.message);  // "Something broke"
console.log(err.stack);    // full stack trace`,
      },
    ],
    exercises: [
      {
        id: 'err-1',
        prompt:
          'Wrap the risky call in error handling that logs the error message:',
        placeholder: '___ { riskyCall(); } ___ (e) { console.log(e.message); }',
        answer: 'try catch',
      },
      {
        id: 'err-2',
        prompt:
          'Which error type is thrown when you access an undeclared variable?',
        placeholder: '___',
        answer: 'ReferenceError',
      },
    ],
  },
  /* ---- 10. ASYNC ---- */
  {
    id: 'async',
    title: 'Async',
    explanation:
      'JavaScript is single-threaded but handles async operations via callbacks, Promises, and async/await. A Promise represents a value that may not be available yet. It can be pending, fulfilled, or rejected. Promise.all runs promises in parallel and waits for all. Promise.race resolves with the first settled. async/await provides synchronous-looking syntax for promise-based code. The fetch API returns promises for HTTP requests.',
    examples: [
      {
        title: 'promises.js',
        code: `// Creating a promise
const delay = (ms) => new Promise((resolve) => {
  setTimeout(() => resolve(\`Done after \${ms}ms\`), ms);
});

// Consuming with then/catch/finally
delay(1000)
  .then(msg => console.log(msg))
  .catch(err => console.error(err))
  .finally(() => console.log("Cleanup"));

// Promise chaining
const fetchUser = (id) =>
  Promise.resolve({ id, name: "Alice" });

const fetchPosts = (user) =>
  Promise.resolve([
    { title: "Post 1", author: user.name },
    { title: "Post 2", author: user.name },
  ]);

fetchUser(1)
  .then(user => fetchPosts(user))
  .then(posts => console.log(posts))
  .catch(err => console.error(err));

// Promise.reject
const fail = () => Promise.reject(new Error("Oops"));
fail().catch(e => console.log(e.message)); // "Oops"`,
      },
      {
        title: 'async-await.js',
        code: `// async/await -- cleaner promise syntax
async function loadUserData(id) {
  try {
    const user = await fetchUser(id);
    const posts = await fetchPosts(user);
    console.log(\`\${user.name} has \${posts.length} posts\`);
    return posts;
  } catch (error) {
    console.error("Load failed:", error.message);
    return [];
  }
}

// Simulated fetch API pattern
async function getJSON(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(\`HTTP \${response.status}\`);
  }
  return response.json();
}

// Parallel execution vs sequential
async function parallel() {
  // BAD -- sequential (slow)
  const a = await delay(1000);
  const b = await delay(1000);
  // Total: ~2000ms

  // GOOD -- parallel (fast)
  const [c, d] = await Promise.all([
    delay(1000),
    delay(1000),
  ]);
  // Total: ~1000ms
}`,
      },
      {
        title: 'promise-combinators.js',
        code: `// Promise.all -- wait for ALL to fulfill
const p1 = Promise.resolve(1);
const p2 = Promise.resolve(2);
const p3 = Promise.resolve(3);

Promise.all([p1, p2, p3])
  .then(results => console.log(results)); // [1, 2, 3]

// Promise.all fails fast on first rejection
Promise.all([p1, Promise.reject("err"), p3])
  .catch(e => console.log(e)); // "err"

// Promise.allSettled -- wait for all, never rejects
Promise.allSettled([p1, Promise.reject("err"), p3])
  .then(results => console.log(results));
// [
//   { status: "fulfilled", value: 1 },
//   { status: "rejected", reason: "err" },
//   { status: "fulfilled", value: 3 }
// ]

// Promise.race -- first to settle wins
Promise.race([
  new Promise(r => setTimeout(() => r("slow"), 200)),
  new Promise(r => setTimeout(() => r("fast"), 100)),
]).then(result => console.log(result)); // "fast"

// Promise.any -- first to fulfill wins (ignores rejections)
Promise.any([
  Promise.reject("a"),
  Promise.resolve("b"),
  Promise.resolve("c"),
]).then(result => console.log(result)); // "b"`,
      },
    ],
    exercises: [
      {
        id: 'async-1',
        prompt:
          'Complete the async function to await a promise and return its value:',
        placeholder: '___ function getData() { const val = ___ fetchData(); return val; }',
        answer: 'async await',
      },
      {
        id: 'async-2',
        prompt:
          'Which Promise combinator waits for ALL promises and never rejects?',
        placeholder: 'Promise.___(promises)',
        answer: 'allSettled',
      },
    ],
  },
  /* ---- 11. MODULES ---- */
  {
    id: 'modules',
    title: 'Modules',
    explanation:
      'ES modules use import/export to share code between files. Named exports allow multiple exports per file, while default export provides a single main export. Dynamic import() loads modules at runtime and returns a promise. The module pattern (pre-ES6) uses IIFEs and closures to encapsulate private state. Modern bundlers (Webpack, Vite, esbuild) transform modules for browser compatibility.',
    examples: [
      {
        title: 'named-exports.js',
        code: `// math.js -- named exports
export const PI = 3.14159;

export function add(a, b) {
  return a + b;
}

export function multiply(a, b) {
  return a * b;
}

export const clamp = (val, min, max) =>
  Math.min(Math.max(val, min), max);

// app.js -- importing named exports
import { PI, add, multiply } from './math.js';
console.log(add(2, 3));        // 5
console.log(PI);               // 3.14159

// Renaming imports
import { add as sum } from './math.js';
console.log(sum(1, 2));        // 3

// Import everything as namespace
import * as MathUtils from './math.js';
console.log(MathUtils.multiply(3, 4)); // 12`,
      },
      {
        title: 'default-export.js',
        code: `// logger.js -- default export
export default class Logger {
  constructor(prefix) {
    this.prefix = prefix;
  }

  log(msg) {
    console.log(\`[\${this.prefix}] \${msg}\`);
  }

  error(msg) {
    console.error(\`[\${this.prefix}] ERROR: \${msg}\`);
  }
}

// Can also export a function as default
// export default function createApp() { ... }

// app.js -- importing default
import Logger from './logger.js';
// Name can be anything for defaults
import MyLogger from './logger.js';

const log = new Logger("APP");
log.log("Started");  // [APP] Started

// Mixing default and named
// utils.js
export default function main() {}
export const VERSION = "1.0.0";

// consumer.js
import main, { VERSION } from './utils.js';`,
      },
      {
        title: 'dynamic-import.js',
        code: `// Dynamic import -- lazy loading at runtime
async function loadModule(name) {
  try {
    const module = await import(\`./modules/\${name}.js\`);
    module.init();
  } catch (error) {
    console.error(\`Failed to load \${name}:\`, error);
  }
}

// Conditional loading
async function loadChart() {
  if (document.querySelector("#chart")) {
    const { Chart } = await import("chart.js");
    new Chart(/* ... */);
  }
}

// The module pattern (pre-ES6)
const CounterModule = (() => {
  let count = 0;   // private
  return {
    increment: () => ++count,
    decrement: () => --count,
    getCount: () => count,
  };
})();

CounterModule.increment();
CounterModule.increment();
console.log(CounterModule.getCount()); // 2
// count is not accessible directly`,
      },
    ],
    exercises: [
      {
        id: 'mod-1',
        prompt:
          'Import a default export called "App" from "./App.js":',
        placeholder: 'import ___ from "./App.js";',
        answer: 'App',
      },
      {
        id: 'mod-2',
        prompt:
          'What function loads a module lazily at runtime and returns a promise?',
        placeholder: 'const mod = await ___(\"./heavy.js\");',
        answer: 'import',
      },
    ],
  },
  /* ---- 12. ADVANCED ---- */
  {
    id: 'advanced',
    title: 'Advanced',
    explanation:
      'Advanced JS includes the event loop (call stack + microtask queue + macrotask queue), WeakMap/WeakSet (garbage-collectible keys), Proxy/Reflect (meta-programming), generators (pausable functions with yield), iterators (Symbol.iterator protocol), and tagged template literals (custom string processing). Understanding the event loop is critical: microtasks (promises) run before macrotasks (setTimeout).',
    examples: [
      {
        title: 'event-loop.js',
        code: `// Event loop execution order
console.log("1 - synchronous");

setTimeout(() => {
  console.log("2 - macrotask (setTimeout)");
}, 0);

Promise.resolve().then(() => {
  console.log("3 - microtask (promise)");
});

queueMicrotask(() => {
  console.log("4 - microtask (queueMicrotask)");
});

console.log("5 - synchronous");

// Output order:
// 1 - synchronous
// 5 - synchronous
// 3 - microtask (promise)
// 4 - microtask (queueMicrotask)
// 2 - macrotask (setTimeout)

// Why? Synchronous code runs first (call stack),
// then microtasks drain, then next macrotask runs.`,
      },
      {
        title: 'weakmap-proxy.js',
        code: `// WeakMap -- keys must be objects, GC-friendly
const cache = new WeakMap();

function process(obj) {
  if (cache.has(obj)) return cache.get(obj);
  const result = { ...obj, processed: true };
  cache.set(obj, result);
  return result;
}

let data = { id: 1 };
process(data);
data = null; // original object can be garbage collected

// WeakSet -- same concept, stores objects
const visited = new WeakSet();

// Proxy -- intercept operations on objects
const handler = {
  get(target, prop) {
    console.log(\`Reading \${String(prop)}\`);
    return Reflect.get(target, prop);
  },
  set(target, prop, value) {
    console.log(\`Setting \${String(prop)} = \${value}\`);
    return Reflect.set(target, prop, value);
  },
};

const obj = new Proxy({}, handler);
obj.name = "Alice";  // Setting name = Alice
console.log(obj.name); // Reading name -> "Alice"

// Practical: validation proxy
const validator = new Proxy({}, {
  set(target, prop, value) {
    if (prop === "age" && typeof value !== "number") {
      throw new TypeError("Age must be a number");
    }
    return Reflect.set(target, prop, value);
  },
});`,
      },
      {
        title: 'generators-iterators.js',
        code: `// Generator function -- pausable with yield
function* range(start, end, step = 1) {
  for (let i = start; i < end; i += step) {
    yield i;
  }
}

for (const n of range(0, 10, 2)) {
  console.log(n); // 0, 2, 4, 6, 8
}

// Infinite generator
function* fibonacci() {
  let a = 0, b = 1;
  while (true) {
    yield a;
    [a, b] = [b, a + b];
  }
}

const fib = fibonacci();
console.log(fib.next().value); // 0
console.log(fib.next().value); // 1
console.log(fib.next().value); // 1
console.log(fib.next().value); // 2
console.log(fib.next().value); // 3

// Custom iterator with Symbol.iterator
const countdown = {
  from: 5,
  [Symbol.iterator]() {
    let current = this.from;
    return {
      next() {
        return current >= 0
          ? { value: current--, done: false }
          : { done: true, value: undefined };
      },
    };
  },
};

for (const n of countdown) {
  console.log(n); // 5, 4, 3, 2, 1, 0
}

// Tagged template literal
function sql(strings, ...values) {
  return strings.reduce((result, str, i) => {
    const val = i < values.length ? \`$\${i + 1}\` : "";
    return result + str + val;
  }, "");
}

const table = "users";
const id = 42;
console.log(sql\`SELECT * FROM \${table} WHERE id = \${id}\`);
// SELECT * FROM $1 WHERE id = $2`,
      },
    ],
    exercises: [
      {
        id: 'adv-1',
        prompt:
          'In the event loop, which runs first: microtasks (promises) or macrotasks (setTimeout)?',
        placeholder: '___',
        answer: 'microtasks',
      },
      {
        id: 'adv-2',
        prompt:
          'What keyword pauses a generator function and emits a value?',
        placeholder: 'function* gen() { ___ 42; }',
        answer: 'yield',
      },
    ],
  },
];

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export const JavaScriptLab: React.FC = () => {
  const [activeTopic, setActiveTopic] = useState<string>(topics[0].id);
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [results, setResults] = useState<Record<string, boolean | null>>({});

  const current = topics.find((t) => t.id === activeTopic)!;

  /* Normalize answer comparison */
  const normalize = (s: string) =>
    s
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/["\u201C\u201D]/g, '"')
      .replace(/['\u2018\u2019]/g, "'")
      .toLowerCase();

  const checkAnswer = (exerciseId: string, answer: string) => {
    setResults((prev) => ({
      ...prev,
      [exerciseId]: normalize(inputs[exerciseId] ?? '') === normalize(answer),
    }));
  };

  const resetExercise = (exerciseId: string) => {
    setInputs((prev) => {
      const next = { ...prev };
      delete next[exerciseId];
      return next;
    });
    setResults((prev) => {
      const next = { ...prev };
      delete next[exerciseId];
      return next;
    });
  };

  /* Check if all exercises for a topic are completed correctly */
  const topicStatus = (topicId: string): boolean | null => {
    const topic = topics.find((t) => t.id === topicId);
    if (!topic) return null;
    const exerciseIds = topic.exercises.map((e) => e.id);
    const answered = exerciseIds.filter((id) => results[id] !== undefined && results[id] !== null);
    if (answered.length === 0) return null;
    return exerciseIds.every((id) => results[id] === true);
  };

  const topicIdx = topics.findIndex((t) => t.id === activeTopic);
  const prevTopic = topicIdx > 0 ? topics[topicIdx - 1] : null;
  const nextTopic = topicIdx < topics.length - 1 ? topics[topicIdx + 1] : null;

  return (
    <div className="h-full flex flex-col overflow-hidden bg-gradient-to-br from-slate-50 to-yellow-50 dark:from-gray-950 dark:to-yellow-950/20">
      {/* Header */}
      <div className="flex-none flex items-center gap-2 px-4 py-2.5 border-b border-gray-200 dark:border-gray-800 bg-white/60 dark:bg-gray-900/60 backdrop-blur">
        <div className="p-1.5 rounded-md bg-yellow-100 dark:bg-yellow-900/40">
          <Code size={16} className="text-yellow-600 dark:text-yellow-400" />
        </div>
        <h1 className="text-sm font-semibold text-gray-800 dark:text-gray-100">
          JavaScript Lab
        </h1>
        <span className="text-[10px] text-gray-500 dark:text-gray-400">
          {topicIdx + 1} / {topics.length}
        </span>
        <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300 font-medium">
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
              const status = topicStatus(topic.id);
              return (
                <button
                  key={topic.id}
                  onClick={() => setActiveTopic(topic.id)}
                  className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-200 shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/60 hover:text-gray-800 dark:hover:text-gray-200'
                  }`}
                >
                  <span className="flex-none w-4 h-4 flex items-center justify-center rounded text-[10px] bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                    {i + 1}
                  </span>
                  <span className="truncate text-left">{topic.title}</span>
                  {status === true && (
                    <Check
                      size={12}
                      className="ml-auto flex-none text-green-500"
                    />
                  )}
                  {status === false && (
                    <X
                      size={12}
                      className="ml-auto flex-none text-red-400"
                    />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Topic heading */}
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-md bg-yellow-100 dark:bg-yellow-900/40 text-yellow-600 dark:text-yellow-400">
              <BookOpen size={14} />
            </span>
            <h2 className="text-base font-bold text-gray-800 dark:text-gray-100">
              {current.title}
            </h2>
          </div>

          {/* Explanation */}
          <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-900/50 p-3">
            <div className="flex items-center gap-1.5 mb-1.5">
              <BookOpen
                size={12}
                className="text-blue-500 dark:text-blue-400"
              />
              <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Concept
              </span>
            </div>
            <p className="text-xs leading-relaxed text-gray-700 dark:text-gray-300">
              {current.explanation}
            </p>
          </div>

          {/* Code examples */}
          {current.examples.map((example, i) => (
            <div key={i}>
              <div className="flex items-center gap-1.5 mb-1.5">
                <Code
                  size={12}
                  className="text-purple-500 dark:text-purple-400"
                />
                <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Example {i + 1}
                </span>
              </div>
              <CodeBlock code={example.code} title={example.title} />
            </div>
          ))}

          {/* Exercises */}
          <div className="space-y-3">
            <div className="flex items-center gap-1.5">
              <ChevronRight
                size={12}
                className="text-yellow-600 dark:text-yellow-400"
              />
              <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Exercises
              </span>
            </div>

            {current.exercises.map((exercise, i) => {
              const r = results[exercise.id];
              return (
                <div
                  key={exercise.id}
                  className={`rounded-lg border p-3 ${
                    r === true
                      ? 'border-green-300 dark:border-green-700 bg-green-50/70 dark:bg-green-950/30'
                      : r === false
                      ? 'border-red-300 dark:border-red-700 bg-red-50/70 dark:bg-red-950/30'
                      : 'border-yellow-200 dark:border-yellow-800 bg-yellow-50/70 dark:bg-yellow-950/30'
                  }`}
                >
                  <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {i + 1}. {exercise.prompt}
                  </p>

                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <code className="text-[11px] text-gray-500 dark:text-gray-400 font-mono whitespace-nowrap">
                      {exercise.placeholder.split('___')[0]}
                    </code>
                    <input
                      type="text"
                      value={inputs[exercise.id] ?? ''}
                      onChange={(e) =>
                        setInputs((prev) => ({
                          ...prev,
                          [exercise.id]: e.target.value,
                        }))
                      }
                      onKeyDown={(e) => {
                        if (e.key === 'Enter')
                          checkAnswer(exercise.id, exercise.answer);
                      }}
                      placeholder="your answer"
                      className="flex-1 min-w-[120px] px-2 py-1 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-xs font-mono text-gray-800 dark:text-gray-200 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-yellow-400 dark:focus:ring-yellow-600"
                    />
                    <code className="text-[11px] text-gray-500 dark:text-gray-400 font-mono whitespace-nowrap">
                      {exercise.placeholder.split('___').slice(1).join('___')}
                    </code>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        checkAnswer(exercise.id, exercise.answer)
                      }
                      className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-yellow-500 hover:bg-yellow-600 text-white transition-colors"
                    >
                      <Check size={12} />
                      Check
                    </button>
                    <button
                      onClick={() => resetExercise(exercise.id)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 transition-colors"
                    >
                      <RotateCcw size={12} />
                      Reset
                    </button>

                    {r === true && (
                      <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400 font-medium ml-auto">
                        <Check size={14} />
                        Correct!
                      </span>
                    )}
                    {r === false && (
                      <span className="flex items-center gap-1 text-xs text-red-600 dark:text-red-400 font-medium ml-auto">
                        <X size={14} />
                        Try again
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between pt-2 pb-4">
            {prevTopic ? (
              <button
                onClick={() => setActiveTopic(prevTopic.id)}
                className="flex items-center gap-1 text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              >
                <ChevronRight size={12} className="rotate-180" />
                {prevTopic.title}
              </button>
            ) : (
              <div />
            )}
            {nextTopic ? (
              <button
                onClick={() => setActiveTopic(nextTopic.id)}
                className="flex items-center gap-1 text-xs font-medium text-yellow-600 dark:text-yellow-400 hover:text-yellow-700 dark:hover:text-yellow-300 transition-colors"
              >
                {nextTopic.title}
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
