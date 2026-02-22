import React, { useState } from 'react';
import { BookOpen, Code, ChevronRight, Check, X, RotateCcw } from 'lucide-react';

// ── Data structures ─────────────────────────────────────────────────────────

interface Exercise {
  question: string;
  code: string;
  answer: string;
  hint: string;
}

interface CodeExample {
  title: string;
  lines: string[];
}

interface TopicData {
  title: string;
  icon: React.ReactNode;
  explanation: string;
  examples: CodeExample[];
  exercises: Exercise[];
}

// ── Topics ──────────────────────────────────────────────────────────────────

const topics: Record<string, TopicData> = {
  introduction: {
    title: 'Introduction',
    icon: <BookOpen size={14} />,
    explanation:
      'TypeScript is a statically typed superset of JavaScript developed by Microsoft. It compiles to plain JS via the tsc compiler, catching type errors at build time instead of runtime. Configuration lives in tsconfig.json. Files use .ts for pure logic and .tsx when JSX is involved. Types make refactoring safer, enable better tooling, and serve as living documentation.',
    examples: [
      {
        title: 'Getting started with tsc',
        lines: [
          '// Install TypeScript globally',
          '// npm install -g typescript',
          '',
          '// hello.ts',
          'let greeting: string = "Hello, TypeScript!";',
          'let version: number = 5.4;',
          'console.log(greeting);',
          'console.log("Version:", version);',
          '',
          '// Compile & run:',
          '// tsc hello.ts   -> produces hello.js',
          '// node hello.js  -> Hello, TypeScript!',
        ],
      },
      {
        title: 'tsconfig.json essentials',
        lines: [
          '// tsconfig.json configures the compiler',
          '// {',
          '//   "compilerOptions": {',
          '//     "target": "ES2022",',
          '//     "module": "ESNext",',
          '//     "strict": true,',
          '//     "outDir": "./dist",',
          '//     "rootDir": "./src",',
          '//     "jsx": "react-jsx",',
          '//     "esModuleInterop": true,',
          '//     "declaration": true',
          '//   },',
          '//   "include": ["src/**/*"]',
          '// }',
          '',
          '// .ts  -> pure TypeScript logic',
          '// .tsx -> TypeScript with JSX (React)',
          '// .d.ts -> declaration files (types only)',
        ],
      },
      {
        title: 'Why types matter',
        lines: [
          '// Without types (JavaScript) - bug found at runtime',
          '// function add(a, b) { return a + b; }',
          '// add("5", 3); // "53" -- silent bug!',
          '',
          '// With types (TypeScript) - bug caught at compile time',
          'function add(a: number, b: number): number {',
          '  return a + b;',
          '}',
          '// add("5", 3); // ERROR: Argument of type',
          '//               // string is not assignable',
          'console.log(add(5, 3)); // 8 -- correct!',
        ],
      },
    ],
    exercises: [
      {
        question: 'What file extension is used for TypeScript files with JSX?',
        code: '// React components use the .___ extension',
        answer: 'tsx',
        hint: 'It combines TypeScript (.ts) with JSX (.jsx)',
      },
      {
        question: 'Add the correct type annotation for this string variable.',
        code: 'let city: ___ = "Tokyo";',
        answer: 'string',
        hint: 'The primitive type for text values in TypeScript',
      },
    ],
  },

  'basic-types': {
    title: 'Basic Types',
    icon: <Code size={14} />,
    explanation:
      'TypeScript provides several primitive types: string, number, boolean for everyday values; null and undefined for absence of value; any to opt out of checking; unknown as a type-safe alternative to any; never for values that never occur; and void for functions that return nothing. Type annotations use a colon after the variable name, but TypeScript can also infer types from assignments.',
    examples: [
      {
        title: 'Primitive types & annotations',
        lines: [
          '// Explicit type annotations',
          'let name: string = "Alice";',
          'let age: number = 30;',
          'let active: boolean = true;',
          'let nothing: null = null;',
          'let notDefined: undefined = undefined;',
          '',
          '// Type inference - TS figures out the type',
          'let city = "Paris";       // inferred: string',
          'const PI = 3.14159;       // inferred: 3.14159 (literal)',
          'let items = [1, 2, 3];    // inferred: number[]',
          '',
          '// const narrows to literal types',
          'const direction = "north"; // type: "north" not string',
        ],
      },
      {
        title: 'any, unknown, never, void',
        lines: [
          '// any -- disables all type checking (avoid!)',
          'let flexible: any = 42;',
          'flexible = "now a string"; // no error',
          'flexible.nonExistent();    // no error (dangerous!)',
          '',
          '// unknown -- type-safe alternative to any',
          'let safe: unknown = "hello";',
          '// safe.toUpperCase(); // ERROR: Object is of type unknown',
          'if (typeof safe === "string") {',
          '  console.log(safe.toUpperCase()); // OK after narrowing',
          '}',
          '',
          '// void -- function returns nothing',
          'function log(msg: string): void {',
          '  console.log(msg);',
          '}',
          '',
          '// never -- function never returns',
          'function fail(msg: string): never {',
          '  throw new Error(msg);',
          '}',
        ],
      },
      {
        title: 'Type annotations vs inference',
        lines: [
          '// When to annotate explicitly:',
          '// 1. Function parameters (always)',
          'function greet(name: string): string {',
          '  return "Hello " + name;',
          '}',
          '',
          '// 2. Variables with delayed initialization',
          'let result: number;',
          'result = computeValue();',
          '',
          '// 3. When inference is not specific enough',
          'let ids: number[] = [];  // not just never[]',
          '',
          '// When inference is sufficient:',
          'let x = 10;          // obviously number',
          'let s = "hello";     // obviously string',
          'let flag = true;     // obviously boolean',
        ],
      },
    ],
    exercises: [
      {
        question: 'What type should you use for a variable that could be anything but requires narrowing before use?',
        code: 'let data: ___ = fetchData();',
        answer: 'unknown',
        hint: 'The type-safe alternative to any -- starts with "u"',
      },
      {
        question: 'What return type should a function have if it always throws an error?',
        code: 'function crash(msg: string): ___ {\n  throw new Error(msg);\n}',
        answer: 'never',
        hint: 'The type for values that never occur',
      },
    ],
  },

  'arrays-tuples': {
    title: 'Arrays & Tuples',
    icon: <Code size={14} />,
    explanation:
      'TypeScript arrays are typed collections where every element shares one type. You can write number[] or Array<number>. Tuples are fixed-length arrays where each position has its own type, like [string, number]. Readonly arrays and tuples prevent mutations. Tuples can also use rest elements and optional elements for flexible patterns.',
    examples: [
      {
        title: 'Typed arrays',
        lines: [
          '// Two equivalent syntaxes for typed arrays',
          'let nums: number[] = [1, 2, 3, 4, 5];',
          'let names: Array<string> = ["Alice", "Bob"];',
          '',
          '// Mixed types require a union',
          'let mixed: (string | number)[] = [1, "two", 3];',
          '',
          '// Array methods are type-aware',
          'let doubled = nums.map(n => n * 2);    // number[]',
          'let found = nums.find(n => n > 3);     // number | undefined',
          'let total = nums.reduce((a, b) => a + b, 0); // number',
          '',
          '// Readonly array -- no push, pop, etc.',
          'const frozen: readonly number[] = [1, 2, 3];',
          '// frozen.push(4); // ERROR: Property push does not exist',
          'let copy = [...frozen, 4]; // OK -- creates new array',
        ],
      },
      {
        title: 'Tuples',
        lines: [
          '// Tuple: fixed length, specific types per position',
          'let pair: [string, number] = ["age", 30];',
          'let rgb: [number, number, number] = [255, 128, 0];',
          '',
          '// Destructuring tuples',
          'let [key, value] = pair;  // key:string, value:number',
          '',
          '// Optional tuple elements',
          'let coord: [number, number, number?] = [10, 20];',
          '',
          '// Labeled tuples (for readability)',
          'type Range = [start: number, end: number];',
          'let r: Range = [0, 100];',
          '',
          '// Tuple with rest element',
          'type StringAndNums = [string, ...number[]];',
          'let row: StringAndNums = ["total", 1, 2, 3, 4];',
          '',
          '// Readonly tuple',
          'let point: readonly [number, number] = [10, 20];',
          '// point[0] = 5; // ERROR: read-only property',
        ],
      },
    ],
    exercises: [
      {
        question: 'Define the type for an array that holds only strings.',
        code: 'let fruits: ___[] = ["apple", "banana"];',
        answer: 'string',
        hint: 'The primitive type for text values',
      },
      {
        question: 'What keyword makes an array immutable in TypeScript?',
        code: 'const ids: ___ number[] = [1, 2, 3];',
        answer: 'readonly',
        hint: 'Prevents push, pop, and index assignment',
      },
    ],
  },

  interfaces: {
    title: 'Interfaces',
    icon: <BookOpen size={14} />,
    explanation:
      'Interfaces define the shape of objects in TypeScript. They support optional properties with ?, readonly modifiers, extending other interfaces, implementing in classes, index signatures for dynamic keys, and function type definitions. Interfaces are open for declaration merging, meaning you can add properties across multiple declarations.',
    examples: [
      {
        title: 'Defining & extending interfaces',
        lines: [
          '// Basic interface',
          'interface User {',
          '  name: string;',
          '  email: string;',
          '  age?: number;           // optional property',
          '  readonly id: string;    // cannot be reassigned',
          '}',
          '',
          'let user: User = {',
          '  id: "u-001",',
          '  name: "Alice",',
          '  email: "alice@example.com",',
          '};',
          '',
          '// Extending interfaces',
          'interface Admin extends User {',
          '  role: "admin" | "superadmin";',
          '  permissions: string[];',
          '}',
          '',
          'let admin: Admin = {',
          '  id: "a-001", name: "Bob",',
          '  email: "bob@co.com",',
          '  role: "admin",',
          '  permissions: ["read", "write"],',
          '};',
        ],
      },
      {
        title: 'Index signatures & function types',
        lines: [
          '// Index signature -- dynamic keys',
          'interface StringMap {',
          '  [key: string]: string;',
          '}',
          'let env: StringMap = {',
          '  NODE_ENV: "production",',
          '  PORT: "3000",',
          '};',
          '',
          '// Function type in interface',
          'interface MathOp {',
          '  (a: number, b: number): number;',
          '}',
          'let add: MathOp = (a, b) => a + b;',
          '',
          '// Interface with callable + properties',
          'interface Logger {',
          '  (message: string): void;',
          '  level: string;',
          '}',
        ],
      },
      {
        title: 'Implementing interfaces in classes',
        lines: [
          'interface Serializable {',
          '  serialize(): string;',
          '  deserialize(data: string): void;',
          '}',
          '',
          'interface Identifiable {',
          '  readonly id: string;',
          '}',
          '',
          '// A class can implement multiple interfaces',
          'class Document implements Serializable, Identifiable {',
          '  readonly id: string;',
          '  content: string = "";',
          '',
          '  constructor(id: string) {',
          '    this.id = id;',
          '  }',
          '  serialize(): string {',
          '    return JSON.stringify({ id: this.id, content: this.content });',
          '  }',
          '  deserialize(data: string): void {',
          '    let parsed = JSON.parse(data);',
          '    this.content = parsed.content;',
          '  }',
          '}',
        ],
      },
    ],
    exercises: [
      {
        question: 'Mark the email property as optional in this interface.',
        code: 'interface Contact {\n  name: string;\n  email___: string;\n}',
        answer: '?',
        hint: 'A single character after the property name makes it optional',
      },
      {
        question: 'What keyword lets a class adopt an interface contract?',
        code: 'class Dog ___ Animal {\n  speak() { return "Woof"; }\n}',
        answer: 'implements',
        hint: 'Different from extends -- used for interfaces, not classes',
      },
    ],
  },

  'type-aliases': {
    title: 'Type Aliases & Unions',
    icon: <Code size={14} />,
    explanation:
      'The type keyword creates aliases for any type expression. Union types (A | B) allow a value to be one of several types. Intersection types (A & B) combine types into one that has all properties. Literal types restrict values to exact strings, numbers, or booleans. Discriminated unions use a shared tag property for exhaustive pattern matching. Type narrowing lets the compiler understand which branch of a union you are in.',
    examples: [
      {
        title: 'Type aliases, unions & intersections',
        lines: [
          '// Type alias for a primitive union',
          'type ID = string | number;',
          'let userId: ID = "abc-123";',
          'userId = 42; // also valid',
          '',
          '// Literal types',
          'type Direction = "north" | "south" | "east" | "west";',
          'let dir: Direction = "north";',
          '// dir = "up"; // ERROR: not assignable',
          '',
          '// Intersection types -- combine shapes',
          'type Named = { name: string };',
          'type Aged = { age: number };',
          'type Person = Named & Aged;',
          '',
          'let p: Person = { name: "Alice", age: 30 };',
          '// Must have ALL properties from both types',
        ],
      },
      {
        title: 'Discriminated unions & narrowing',
        lines: [
          '// Discriminated union with a "kind" tag',
          'type Shape =',
          '  | { kind: "circle"; radius: number }',
          '  | { kind: "rect"; width: number; height: number }',
          '  | { kind: "triangle"; base: number; height: number };',
          '',
          'function area(s: Shape): number {',
          '  switch (s.kind) {',
          '    case "circle":',
          '      return Math.PI * s.radius ** 2;',
          '    case "rect":',
          '      return s.width * s.height;',
          '    case "triangle":',
          '      return 0.5 * s.base * s.height;',
          '  }',
          '}',
          '',
          'console.log(area({ kind: "circle", radius: 5 }));',
          '// 78.54',
          'console.log(area({ kind: "rect", width: 4, height: 6 }));',
          '// 24',
        ],
      },
      {
        title: 'Type narrowing techniques',
        lines: [
          '// typeof narrowing',
          'function format(val: string | number): string {',
          '  if (typeof val === "string") {',
          '    return val.toUpperCase();   // TS knows: string',
          '  }',
          '  return val.toFixed(2);        // TS knows: number',
          '}',
          '',
          '// Truthiness narrowing',
          'function printName(name: string | null) {',
          '  if (name) {',
          '    console.log(name.toUpperCase()); // string',
          '  } else {',
          '    console.log("Anonymous");',
          '  }',
          '}',
          '',
          '// Equality narrowing',
          'function example(x: string | number, y: string | boolean) {',
          '  if (x === y) {',
          '    // x and y must both be string here',
          '    console.log(x.toUpperCase());',
          '  }',
          '}',
        ],
      },
    ],
    exercises: [
      {
        question: 'Create a union type that accepts either a string or a number.',
        code: 'type ID = string ___ number;',
        answer: '|',
        hint: 'The pipe character combines types into a union',
      },
      {
        question: 'What operator combines two types into one that has all properties of both?',
        code: 'type Employee = Person ___ JobInfo;',
        answer: '&',
        hint: 'The ampersand creates an intersection type',
      },
    ],
  },

  functions: {
    title: 'Functions',
    icon: <Code size={14} />,
    explanation:
      'TypeScript functions can have typed parameters, explicit return types, optional parameters with ?, default values, and rest parameters with spread syntax. Function overloads let you define multiple call signatures. The void return type means a function does not return a value, while the this parameter lets you type the calling context.',
    examples: [
      {
        title: 'Parameters & return types',
        lines: [
          '// Typed parameters and return type',
          'function add(a: number, b: number): number {',
          '  return a + b;',
          '}',
          '',
          '// Arrow function with types',
          'const multiply = (a: number, b: number): number => a * b;',
          '',
          '// Optional parameter (must come last)',
          'function greet(name: string, title?: string): string {',
          '  return title ? `${title} ${name}` : name;',
          '}',
          '',
          '// Default parameter',
          'function createUser(name: string, role: string = "user") {',
          '  return { name, role };',
          '}',
          '',
          '// Rest parameters',
          'function sum(...nums: number[]): number {',
          '  return nums.reduce((a, b) => a + b, 0);',
          '}',
          'console.log(sum(1, 2, 3, 4)); // 10',
        ],
      },
      {
        title: 'Function overloads',
        lines: [
          '// Overloads: multiple signatures, one implementation',
          'function parse(input: string): number;',
          'function parse(input: number): string;',
          'function parse(input: string | number): number | string {',
          '  if (typeof input === "string") {',
          '    return parseInt(input, 10);',
          '  }',
          '  return input.toString();',
          '}',
          '',
          'let n = parse("42");   // return type: number',
          'let s = parse(42);     // return type: string',
          '',
          '// Function type alias',
          'type Comparator<T> = (a: T, b: T) => number;',
          '',
          'let sortByAge: Comparator<{ age: number }> = (a, b) => {',
          '  return a.age - b.age;',
          '};',
        ],
      },
      {
        title: 'void, undefined & this parameter',
        lines: [
          '// void -- function does not return a value',
          'function logMessage(msg: string): void {',
          '  console.log(msg);',
          '  // return undefined; is OK with void',
          '}',
          '',
          '// Callback type with void return',
          'type Callback = (data: string) => void;',
          'let cb: Callback = (data) => { console.log(data); };',
          '',
          '// this parameter (must be first, erased at runtime)',
          'interface Button {',
          '  label: string;',
          '  click(this: Button): void;',
          '}',
          '',
          'let btn: Button = {',
          '  label: "Submit",',
          '  click() {',
          '    console.log("Clicked:", this.label);',
          '  },',
          '};',
          'btn.click(); // "Clicked: Submit"',
        ],
      },
    ],
    exercises: [
      {
        question: 'Add the return type for a function that returns a number.',
        code: 'function double(n: number): ___ {\n  return n * 2;\n}',
        answer: 'number',
        hint: 'The same as the parameter type',
      },
      {
        question: 'Make the second parameter optional in this function.',
        code: 'function greet(name: string, title___: string) {\n  return title ? title + " " + name : name;\n}',
        answer: '?',
        hint: 'A single character that goes after the parameter name',
      },
    ],
  },

  'objects-classes': {
    title: 'Objects & Classes',
    icon: <BookOpen size={14} />,
    explanation:
      'TypeScript classes support access modifiers (public, private, protected) to control visibility, abstract classes for base types that cannot be instantiated, readonly properties that can only be set in the constructor, and parameter properties that declare and assign in one step. Classes can implement interfaces and extend other classes.',
    examples: [
      {
        title: 'Access modifiers & parameter properties',
        lines: [
          'class Animal {',
          '  // Parameter properties: shorthand for declaration + assignment',
          '  constructor(',
          '    public name: string,',
          '    private _sound: string,',
          '    protected speed: number',
          '  ) {}',
          '',
          '  // Public: accessible everywhere (default)',
          '  speak(): string {',
          '    return `${this.name} says ${this._sound}`;',
          '  }',
          '',
          '  // Getter for private field',
          '  get sound(): string {',
          '    return this._sound;',
          '  }',
          '}',
          '',
          'let dog = new Animal("Rex", "Woof", 40);',
          'console.log(dog.speak());   // "Rex says Woof"',
          'console.log(dog.name);      // "Rex" (public)',
          '// dog._sound;  // ERROR: private',
          '// dog.speed;   // ERROR: protected',
        ],
      },
      {
        title: 'Abstract classes',
        lines: [
          '// Abstract class: cannot be instantiated directly',
          'abstract class Shape {',
          '  abstract area(): number;',
          '  abstract perimeter(): number;',
          '',
          '  describe(): string {',
          '    return `Area: ${this.area().toFixed(2)}`;',
          '  }',
          '}',
          '',
          'class Circle extends Shape {',
          '  constructor(private radius: number) { super(); }',
          '',
          '  area(): number {',
          '    return Math.PI * this.radius ** 2;',
          '  }',
          '  perimeter(): number {',
          '    return 2 * Math.PI * this.radius;',
          '  }',
          '}',
          '',
          '// let s = new Shape(); // ERROR: cannot instantiate',
          'let c = new Circle(5);',
          'console.log(c.describe()); // "Area: 78.54"',
        ],
      },
      {
        title: 'Readonly properties & implements',
        lines: [
          'interface Printable {',
          '  toString(): string;',
          '}',
          '',
          'class Config implements Printable {',
          '  readonly apiUrl: string;',
          '  readonly timeout: number;',
          '',
          '  constructor(url: string, timeout: number) {',
          '    this.apiUrl = url;       // OK in constructor',
          '    this.timeout = timeout;',
          '  }',
          '',
          '  // this.apiUrl = "x"; // ERROR outside constructor',
          '',
          '  toString(): string {',
          '    return `Config(${this.apiUrl}, ${this.timeout}ms)`;',
          '  }',
          '}',
          '',
          'let cfg = new Config("https://api.example.com", 5000);',
          'console.log(cfg.toString());',
          '// "Config(https://api.example.com, 5000ms)"',
        ],
      },
    ],
    exercises: [
      {
        question: 'What access modifier hides a property from outside the class?',
        code: 'class User {\n  constructor(___ password: string) {}\n}',
        answer: 'private',
        hint: 'Only accessible within the class itself, not subclasses',
      },
      {
        question: 'What keyword prevents a class from being instantiated directly?',
        code: '___ class Vehicle {\n  abstract drive(): void;\n}',
        answer: 'abstract',
        hint: 'Used for base classes that define a contract for subclasses',
      },
    ],
  },

  generics: {
    title: 'Generics',
    icon: <Code size={14} />,
    explanation:
      'Generics let you write reusable, type-safe code that works with any type. Use angle brackets <T> to define type parameters. Constraints with extends limit acceptable types. The keyof operator gets union of keys from a type, and typeof extracts the type of a value. Generics work on functions, classes, interfaces, and type aliases.',
    examples: [
      {
        title: 'Generic functions & inference',
        lines: [
          '// Generic identity function',
          'function identity<T>(arg: T): T {',
          '  return arg;',
          '}',
          '',
          '// Explicit type argument',
          'let s = identity<string>("hello");  // string',
          '// Inferred type argument',
          'let n = identity(42);               // number',
          '',
          '// Generic with constraint',
          'function getLength<T extends { length: number }>(item: T): number {',
          '  return item.length;',
          '}',
          'console.log(getLength("hello"));    // 5',
          'console.log(getLength([1, 2, 3]));  // 3',
          '// getLength(123); // ERROR: number has no length',
          '',
          '// Multiple type parameters',
          'function pair<A, B>(a: A, b: B): [A, B] {',
          '  return [a, b];',
          '}',
          'let p = pair("age", 30); // [string, number]',
        ],
      },
      {
        title: 'Generic interfaces & classes',
        lines: [
          '// Generic interface',
          'interface Repository<T> {',
          '  findById(id: string): T | null;',
          '  save(item: T): void;',
          '  findAll(): T[];',
          '}',
          '',
          '// Generic class',
          'class Stack<T> {',
          '  private items: T[] = [];',
          '',
          '  push(item: T): void {',
          '    this.items.push(item);',
          '  }',
          '  pop(): T | undefined {',
          '    return this.items.pop();',
          '  }',
          '  peek(): T | undefined {',
          '    return this.items[this.items.length - 1];',
          '  }',
          '}',
          '',
          'let numStack = new Stack<number>();',
          'numStack.push(10);',
          'numStack.push(20);',
          'console.log(numStack.pop()); // 20',
        ],
      },
      {
        title: 'keyof, typeof & default type params',
        lines: [
          '// keyof -- union of keys',
          'interface User {',
          '  name: string;',
          '  age: number;',
          '  email: string;',
          '}',
          'type UserKey = keyof User; // "name" | "age" | "email"',
          '',
          '// Lookup with keyof constraint',
          'function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {',
          '  return obj[key];',
          '}',
          '',
          'let user = { name: "Alice", age: 30, email: "a@b.com" };',
          'let name = getProperty(user, "name"); // string',
          '',
          '// typeof -- extract type from a value',
          'const config = { debug: true, port: 3000 };',
          'type Config = typeof config;',
          '// { debug: boolean; port: number }',
          '',
          '// Default type parameter',
          'interface ApiResponse<T = unknown> {',
          '  data: T;',
          '  status: number;',
          '}',
          'let res: ApiResponse = { data: null, status: 200 };',
        ],
      },
    ],
    exercises: [
      {
        question: 'Add the type parameter to make this function generic.',
        code: 'function wrap<___>(value: T): { value: T } {\n  return { value };\n}',
        answer: 'T',
        hint: 'The conventional single-letter name for a type parameter',
      },
      {
        question: 'What operator gives you a union type of all keys of an object type?',
        code: 'type Keys = ___ User;',
        answer: 'keyof',
        hint: 'It means "keys of" and produces a union of key names',
      },
    ],
  },

  'type-guards': {
    title: 'Type Guards',
    icon: <ChevronRight size={14} />,
    explanation:
      'Type guards narrow a variable type within a conditional block. Built-in guards include typeof for primitives, instanceof for class instances, and the in operator for property checks. Custom type guards use the "is" keyword. Assertion functions use asserts to narrow as a side effect. The satisfies operator validates a value matches a type without widening it.',
    examples: [
      {
        title: 'typeof, instanceof & in',
        lines: [
          '// typeof guard for primitives',
          'function padValue(val: string | number): string {',
          '  if (typeof val === "number") {',
          '    return val.toString().padStart(3, "0");',
          '  }',
          '  return val.padStart(3, " ");  // TS knows: string',
          '}',
          '',
          '// instanceof guard for classes',
          'class ApiError extends Error {',
          '  constructor(public code: number, msg: string) {',
          '    super(msg);',
          '  }',
          '}',
          'function handleError(e: unknown) {',
          '  if (e instanceof ApiError) {',
          '    console.log(e.code, e.message); // ApiError',
          '  } else if (e instanceof Error) {',
          '    console.log(e.message);          // Error',
          '  }',
          '}',
          '',
          '// in operator for property existence',
          'function move(pet: { swim: () => void } | { fly: () => void }) {',
          '  if ("swim" in pet) pet.swim();',
          '  else pet.fly();',
          '}',
        ],
      },
      {
        title: 'Custom type guards with "is"',
        lines: [
          '// Custom type guard function',
          'interface Fish { swim(): void; kind: "fish"; }',
          'interface Bird { fly(): void; kind: "bird"; }',
          '',
          'function isFish(pet: Fish | Bird): pet is Fish {',
          '  return pet.kind === "fish";',
          '}',
          '',
          'function handlePet(pet: Fish | Bird) {',
          '  if (isFish(pet)) {',
          '    pet.swim();  // TS knows: Fish',
          '  } else {',
          '    pet.fly();   // TS knows: Bird',
          '  }',
          '}',
          '',
          '// Guard for unknown values',
          'function isString(val: unknown): val is string {',
          '  return typeof val === "string";',
          '}',
          '',
          'function process(val: unknown) {',
          '  if (isString(val)) {',
          '    console.log(val.toUpperCase()); // safe!',
          '  }',
          '}',
        ],
      },
      {
        title: 'Assertion functions & satisfies',
        lines: [
          '// Assertion function -- throws if condition fails',
          'function assertDefined<T>(',
          '  val: T | null | undefined,',
          '  msg?: string',
          '): asserts val is T {',
          '  if (val == null) throw new Error(msg ?? "Undefined");',
          '}',
          '',
          'function getUser(): string | null { return "Alice"; }',
          'let user = getUser();',
          'assertDefined(user, "No user found");',
          'console.log(user.toUpperCase()); // safe after assertion',
          '',
          '// satisfies -- validate type without widening',
          'type Colors = Record<string, [number, number, number]>;',
          '',
          'const palette = {',
          '  red: [255, 0, 0],',
          '  green: [0, 255, 0],',
          '  blue: [0, 0, 255],',
          '} satisfies Colors;',
          '',
          '// palette.red is still [number, number, number]',
          '// AND we get autocomplete on "red", "green", "blue"',
          'let r = palette.red[0]; // number',
        ],
      },
    ],
    exercises: [
      {
        question: 'Complete the custom type guard return type annotation.',
        code: 'function isNumber(x: unknown): x ___ number {\n  return typeof x === "number";\n}',
        answer: 'is',
        hint: 'The keyword that makes a function a type predicate',
      },
      {
        question: 'Which keyword does an assertion function use in its return type?',
        code: 'function assertString(v: unknown): ___ v is string {\n  if (typeof v !== "string") throw new Error();\n}',
        answer: 'asserts',
        hint: 'It declares that the function asserts a condition about its parameter',
      },
    ],
  },

  'utility-types': {
    title: 'Utility Types',
    icon: <BookOpen size={14} />,
    explanation:
      'TypeScript ships with many built-in utility types. Partial makes all properties optional. Required makes all required. Pick and Omit select or remove keys. Record creates a map type. Readonly prevents mutation. ReturnType and Parameters extract function signatures. Exclude, Extract, and NonNullable filter union members. Awaited unwraps Promise types.',
    examples: [
      {
        title: 'Partial, Required, Pick, Omit',
        lines: [
          'interface User {',
          '  name: string;',
          '  email: string;',
          '  age: number;',
          '  active: boolean;',
          '}',
          '',
          '// Partial -- all properties become optional',
          'type UpdateData = Partial<User>;',
          '// { name?: string; email?: string; age?: number; ... }',
          '',
          '// Required -- all properties become required',
          'type FullUser = Required<User>;',
          '',
          '// Pick -- select specific properties',
          'type Credentials = Pick<User, "name" | "email">;',
          '// { name: string; email: string }',
          '',
          '// Omit -- remove specific properties',
          'type PublicProfile = Omit<User, "email" | "active">;',
          '// { name: string; age: number }',
          '',
          'function updateUser(id: string, data: Partial<User>) {',
          '  console.log("Updating", id, data);',
          '}',
          'updateUser("u1", { name: "Bob" }); // OK',
        ],
      },
      {
        title: 'Record, Readonly, ReturnType, Parameters',
        lines: [
          '// Record -- key-value map type',
          'type Scores = Record<string, number>;',
          'let grades: Scores = { alice: 95, bob: 87 };',
          '',
          '// Record with literal key union',
          'type StatusMap = Record<"ok" | "error" | "loading", string>;',
          '',
          '// Readonly -- prevent mutation',
          'type FrozenUser = Readonly<User>;',
          '// let u: FrozenUser = { ... };',
          '// u.name = "X"; // ERROR: readonly',
          '',
          '// ReturnType -- extract return type of a function',
          'function fetchData() { return { id: 1, value: "x" }; }',
          'type FetchResult = ReturnType<typeof fetchData>;',
          '// { id: number; value: string }',
          '',
          '// Parameters -- extract parameter types as tuple',
          'function log(msg: string, level: number): void {}',
          'type LogParams = Parameters<typeof log>;',
          '// [string, number]',
        ],
      },
      {
        title: 'Exclude, Extract, NonNullable, Awaited',
        lines: [
          '// Exclude -- remove members from union',
          'type T1 = Exclude<"a" | "b" | "c", "a">;',
          '// "b" | "c"',
          '',
          '// Extract -- keep only matching members',
          'type T2 = Extract<"a" | "b" | "c", "a" | "f">;',
          '// "a"',
          '',
          '// NonNullable -- remove null and undefined',
          'type T3 = NonNullable<string | null | undefined>;',
          '// string',
          '',
          '// Awaited -- unwrap Promise types',
          'type T4 = Awaited<Promise<string>>;',
          '// string',
          '',
          'type T5 = Awaited<Promise<Promise<number>>>;',
          '// number (deeply unwrapped)',
          '',
          '// Combining utilities',
          'type SafePartialUser = NonNullable<Partial<User>>;',
          'type ReadonlyPick = Readonly<Pick<User, "name" | "email">>;',
        ],
      },
    ],
    exercises: [
      {
        question: 'Which utility type makes all properties of an interface optional?',
        code: 'type Draft = ___<Article>;',
        answer: 'Partial',
        hint: 'It makes every property optional with ?',
      },
      {
        question: 'Which utility type removes null and undefined from a union?',
        code: 'type Safe = ___<string | null | undefined>;',
        answer: 'NonNullable',
        hint: 'It starts with "Non" and removes nullable types',
      },
    ],
  },

  'mapped-conditional': {
    title: 'Mapped & Conditional',
    icon: <Code size={14} />,
    explanation:
      'Mapped types transform every property of a type using the [K in keyof T] syntax. Template literal types construct string types from other types. Conditional types use the T extends U ? X : Y syntax for type-level branching. The infer keyword captures types within conditional type branches. Distributive conditionals automatically distribute over unions.',
    examples: [
      {
        title: 'Mapped types',
        lines: [
          '// Built-in Partial is a mapped type:',
          '// type Partial<T> = { [K in keyof T]?: T[K] };',
          '',
          '// Custom mapped type: make all properties nullable',
          'type Nullable<T> = {',
          '  [K in keyof T]: T[K] | null;',
          '};',
          '',
          '// Remap keys with "as" clause',
          'type Getters<T> = {',
          '  [K in keyof T as `get${Capitalize<string & K>}`]: () => T[K];',
          '};',
          '',
          'interface Person { name: string; age: number; }',
          'type PersonGetters = Getters<Person>;',
          '// { getName: () => string; getAge: () => number }',
          '',
          '// Remove specific properties with mapped type',
          'type RemoveReadonly<T> = {',
          '  -readonly [K in keyof T]: T[K];',
          '};',
        ],
      },
      {
        title: 'Template literal types',
        lines: [
          '// Template literal types build string unions',
          'type Color = "red" | "blue" | "green";',
          'type Size = "sm" | "md" | "lg";',
          'type ClassName = `${Color}-${Size}`;',
          '// "red-sm" | "red-md" | "red-lg" | "blue-sm" | ...',
          '',
          '// Built-in string manipulation types',
          'type Upper = Uppercase<"hello">;   // "HELLO"',
          'type Lower = Lowercase<"HELLO">;   // "hello"',
          'type Cap = Capitalize<"hello">;     // "Hello"',
          'type Uncap = Uncapitalize<"Hello">; // "hello"',
          '',
          '// Event handler pattern',
          'type EventName<T extends string> = `on${Capitalize<T>}`;',
          'type ClickEvent = EventName<"click">; // "onClick"',
          'type FocusEvent = EventName<"focus">; // "onFocus"',
        ],
      },
      {
        title: 'Conditional types & infer',
        lines: [
          '// Conditional type: T extends U ? X : Y',
          'type IsString<T> = T extends string ? true : false;',
          'type A = IsString<"hello">; // true',
          'type B = IsString<42>;      // false',
          '',
          '// infer keyword -- capture types in branches',
          'type ElementType<T> =',
          '  T extends (infer E)[] ? E : never;',
          '',
          'type Nums = ElementType<number[]>;    // number',
          'type Strs = ElementType<string[]>;    // string',
          '',
          '// Unwrap Promise with infer',
          'type UnwrapPromise<T> =',
          '  T extends Promise<infer R> ? R : T;',
          '',
          'type X = UnwrapPromise<Promise<string>>; // string',
          'type Y = UnwrapPromise<number>;           // number',
          '',
          '// Distributive conditional types',
          'type ToArray<T> = T extends unknown ? T[] : never;',
          'type D = ToArray<string | number>;',
          '// string[] | number[]  (distributed!)',
        ],
      },
    ],
    exercises: [
      {
        question: 'Complete this mapped type that makes all properties readonly.',
        code: 'type Immutable<T> = {\n  ___ [K in keyof T]: T[K];\n};',
        answer: 'readonly',
        hint: 'The modifier keyword that prevents property reassignment',
      },
      {
        question: 'What keyword captures a type inside a conditional type branch?',
        code: 'type GetReturn<T> =\n  T extends (...args: any[]) => ___ R ? R : never;',
        answer: 'infer',
        hint: 'It lets you declare a type variable inside the extends clause',
      },
    ],
  },

  'advanced-patterns': {
    title: 'Advanced Patterns',
    icon: <BookOpen size={14} />,
    explanation:
      'Advanced TypeScript includes declaration merging (combining multiple declarations of the same name), const assertions for literal inference, enums and const enums, decorators for annotating classes, namespaces for organizing code, and module augmentation for extending third-party types. These patterns are essential for library authors and complex applications.',
    examples: [
      {
        title: 'Enums, const enums & as const',
        lines: [
          '// Numeric enum (auto-incremented)',
          'enum Direction {',
          '  Up,      // 0',
          '  Down,    // 1',
          '  Left,    // 2',
          '  Right,   // 3',
          '}',
          '',
          '// String enum (explicit values)',
          'enum Status {',
          '  Active = "ACTIVE",',
          '  Inactive = "INACTIVE",',
          '}',
          '',
          '// const enum -- inlined at compile time',
          'const enum HttpMethod {',
          '  GET = "GET",',
          '  POST = "POST",',
          '}',
          '// Compiled to: let m = "GET" (no object emitted)',
          '',
          '// as const -- deep readonly + literal types',
          'const ROUTES = {',
          '  home: "/",',
          '  about: "/about",',
          '  users: "/users",',
          '} as const;',
          '// typeof ROUTES.home is "/" not string',
          'type Route = typeof ROUTES[keyof typeof ROUTES];',
          '// "/" | "/about" | "/users"',
        ],
      },
      {
        title: 'Declaration merging & module augmentation',
        lines: [
          '// Declaration merging: interfaces merge automatically',
          'interface Box {',
          '  width: number;',
          '  height: number;',
          '}',
          'interface Box {',
          '  color: string;',
          '}',
          '// Box now has width, height, and color',
          '',
          '// Module augmentation: extend third-party types',
          '// declare module "express" {',
          '//   interface Request {',
          '//     userId?: string;',
          '//     sessionData?: Record<string, unknown>;',
          '//   }',
          '// }',
          '',
          '// Namespace for organizing related types',
          'namespace Validation {',
          '  export interface Rule {',
          '    validate(value: unknown): boolean;',
          '    message: string;',
          '  }',
          '  export function run(rules: Rule[], val: unknown) {',
          '    return rules.every(r => r.validate(val));',
          '  }',
          '}',
        ],
      },
      {
        title: 'Decorators & triple-slash directives',
        lines: [
          '// Decorator (stage 3 / experimentalDecorators)',
          'function logged(',
          '  target: any,',
          '  propertyKey: string,',
          '  descriptor: PropertyDescriptor',
          ') {',
          '  let original = descriptor.value;',
          '  descriptor.value = function (...args: any[]) {',
          '    console.log(`Calling ${propertyKey}`);',
          '    return original.apply(this, args);',
          '  };',
          '}',
          '',
          'class Api {',
          '  @logged',
          '  fetchData(id: string) {',
          '    return { id, data: "result" };',
          '  }',
          '}',
          '',
          '// Triple-slash directive (legacy, for .d.ts files)',
          '// /// <reference types="node" />',
          '// /// <reference path="./global.d.ts" />',
          '',
          '// Prefer modern imports:',
          '// import type { Buffer } from "node:buffer";',
        ],
      },
    ],
    exercises: [
      {
        question: 'What two words create a deeply readonly literal type from a value?',
        code: 'const colors = ["red", "blue"] ___ ___;',
        answer: 'as const',
        hint: 'A type assertion that makes the value readonly with literal types',
      },
      {
        question: 'What keyword groups related types and functions together?',
        code: '___ Utils {\n  export function parse(s: string): number { return +s; }\n}',
        answer: 'namespace',
        hint: 'An older TypeScript concept for organizing code, similar to modules',
      },
    ],
  },
};

const topicKeys = Object.keys(topics);

// ── Syntax highlighting ─────────────────────────────────────────────────────

const KEYWORDS = new Set([
  'const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while',
  'class', 'extends', 'implements', 'new', 'this', 'try', 'catch', 'finally',
  'throw', 'async', 'await', 'typeof', 'instanceof', 'import', 'from',
  'export', 'default', 'switch', 'case', 'break', 'continue', 'of', 'in',
  'abstract', 'readonly', 'private', 'public', 'protected', 'static',
  'super', 'true', 'false', 'null', 'undefined', 'console', 'interface',
  'type', 'enum', 'as', 'keyof', 'infer', 'is', 'declare', 'module',
  'namespace', 'satisfies', 'asserts', 'get', 'set',
]);

const TYPE_KEYWORDS = new Set([
  'string', 'number', 'boolean', 'any', 'void', 'never', 'unknown',
  'object', 'Array', 'Map', 'Set', 'Record', 'Partial', 'Required',
  'Pick', 'Omit', 'Readonly', 'Promise', 'Math', 'Function', 'Object',
  'Error', 'ReturnType', 'Parameters', 'Exclude', 'Extract',
  'NonNullable', 'Awaited', 'Uppercase', 'Lowercase', 'Capitalize',
  'Uncapitalize', 'JSON',
]);

function highlightLine(line: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  let i = 0;
  let key = 0;

  while (i < line.length) {
    // Comments
    if (line[i] === '/' && line[i + 1] === '/') {
      nodes.push(
        <span key={key++} className="text-gray-500">
          {line.slice(i)}
        </span>,
      );
      break;
    }

    // Strings
    if (line[i] === '"' || line[i] === "'" || line[i] === '`') {
      const start = i;
      const quote = line[i];
      i++;
      while (i < line.length) {
        if (line[i] === '\\') { i += 2; continue; }
        if (line[i] === quote) { i++; break; }
        i++;
      }
      nodes.push(
        <span key={key++} className="text-green-400">
          {line.slice(start, i)}
        </span>,
      );
      continue;
    }

    // Numbers
    if (
      /\d/.test(line[i]) &&
      (i === 0 || /[\s(,=[\-+*/<>:;{|?]/.test(line[i - 1]))
    ) {
      const start = i;
      while (i < line.length && /[\d.]/.test(line[i])) i++;
      nodes.push(
        <span key={key++} className="text-orange-400">
          {line.slice(start, i)}
        </span>,
      );
      continue;
    }

    // Identifiers
    if (/[a-zA-Z_$]/.test(line[i])) {
      const start = i;
      while (i < line.length && /[a-zA-Z0-9_$]/.test(line[i])) i++;
      const word = line.slice(start, i);
      if (TYPE_KEYWORDS.has(word)) {
        nodes.push(
          <span key={key++} className="text-purple-400">{word}</span>,
        );
      } else if (KEYWORDS.has(word)) {
        nodes.push(
          <span key={key++} className="text-blue-400">{word}</span>,
        );
      } else {
        nodes.push(<span key={key++}>{word}</span>);
      }
      continue;
    }

    // Decorators
    if (line[i] === '@') {
      const start = i;
      i++;
      while (i < line.length && /[a-zA-Z0-9_]/.test(line[i])) i++;
      nodes.push(
        <span key={key++} className="text-yellow-400">
          {line.slice(start, i)}
        </span>,
      );
      continue;
    }

    nodes.push(<span key={key++}>{line[i]}</span>);
    i++;
  }

  return nodes;
}

// ── Component ───────────────────────────────────────────────────────────────

export const TypeScriptLab: React.FC = () => {
  const [activeTopic, setActiveTopic] = useState<string>('introduction');
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [results, setResults] = useState<Record<string, boolean | null>>({});
  const [showHints, setShowHints] = useState<Record<string, boolean>>({});

  const current = topics[activeTopic];

  const exKey = (idx: number) => `${activeTopic}-${idx}`;

  const handleCheck = (idx: number) => {
    const key = exKey(idx);
    const trimmed = (inputs[key] ?? '').trim();
    const expected = current.exercises[idx].answer.trim();
    setResults((p) => ({ ...p, [key]: trimmed === expected }));
  };

  const handleReset = (idx: number) => {
    const key = exKey(idx);
    setInputs((p) => ({ ...p, [key]: '' }));
    setResults((p) => ({ ...p, [key]: null }));
    setShowHints((p) => ({ ...p, [key]: false }));
  };

  const completedCount = topicKeys.filter((tk) => {
    const t = topics[tk];
    return t.exercises.every((_, i) => results[`${tk}-${i}`] === true);
  }).length;

  return (
    <div className="h-full flex flex-col overflow-hidden bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-950 dark:to-blue-950/20">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-200 dark:border-gray-800 bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm">
        <Code size={16} className="text-blue-600 dark:text-blue-400" />
        <h1 className="text-sm font-semibold text-slate-800 dark:text-gray-100">
          TypeScript Lab
        </h1>
        <span className="text-[11px] text-slate-400 dark:text-gray-500 ml-1">
          Noob to Master
        </span>
        <div className="ml-auto flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-gray-500">
          <Check size={11} className="text-emerald-500" />
          {completedCount}/{topicKeys.length} topics
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-56 shrink-0 border-r border-slate-200 dark:border-gray-800 bg-white/40 dark:bg-gray-900/40 overflow-y-auto">
          <nav className="py-2">
            {topicKeys.map((key, idx) => {
              const topic = topics[key];
              const isActive = activeTopic === key;
              const allDone = topic.exercises.every(
                (_, i) => results[`${key}-${i}`] === true,
              );
              return (
                <button
                  key={key}
                  onClick={() => setActiveTopic(key)}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-left text-[13px] transition-colors ${
                    isActive
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium'
                      : 'text-slate-600 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-gray-800/50'
                  }`}
                >
                  <span className="text-[11px] text-slate-400 dark:text-gray-600 w-4 text-right shrink-0">
                    {idx + 1}
                  </span>
                  <span className="shrink-0">{topic.icon}</span>
                  <span className="truncate flex-1">{topic.title}</span>
                  {allDone && (
                    <Check size={12} className="text-emerald-500 shrink-0" />
                  )}
                  {isActive && !allDone && (
                    <ChevronRight size={12} className="shrink-0 opacity-50" />
                  )}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Topic heading */}
          <div className="flex items-center gap-2">
            <span className="text-blue-600 dark:text-blue-400">{current.icon}</span>
            <h2 className="text-lg font-semibold text-slate-800 dark:text-gray-100">
              {current.title}
            </h2>
            <span className="text-[11px] px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full">
              {topicKeys.indexOf(activeTopic) + 1} / {topicKeys.length}
            </span>
          </div>

          {/* Explanation */}
          <p className="text-[13px] leading-relaxed text-slate-600 dark:text-gray-400 max-w-2xl">
            {current.explanation}
          </p>

          {/* Code examples */}
          {current.examples.map((example, eIdx) => (
            <div key={eIdx} className="max-w-2xl">
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 rounded-t-lg border-b border-gray-700">
                <Code size={12} className="text-gray-400" />
                <span className="text-[11px] text-gray-400">{example.title}</span>
              </div>
              <div className="bg-gray-950 rounded-b-lg p-3 font-mono text-[12px] text-gray-200 leading-relaxed overflow-x-auto">
                {example.lines.map((line, lIdx) => (
                  <div key={lIdx} className="min-h-[1.3em]">
                    {line === '' ? '\u00A0' : highlightLine(line)}
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Exercises */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <BookOpen size={14} className="text-amber-500" />
              <h3 className="text-sm font-semibold text-slate-700 dark:text-gray-300">
                Exercises
              </h3>
            </div>

            {current.exercises.map((exercise, eIdx) => {
              const key = exKey(eIdx);
              const val = inputs[key] ?? '';
              const res = results[key] ?? null;
              const hintVisible = showHints[key] ?? false;

              return (
                <div
                  key={eIdx}
                  className="max-w-2xl border border-slate-200 dark:border-gray-800 rounded-lg bg-white dark:bg-gray-900/60 overflow-hidden"
                >
                  <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 dark:bg-gray-800/40 border-b border-slate-200 dark:border-gray-800">
                    <span className="text-[11px] font-bold text-slate-400 dark:text-gray-600">
                      {eIdx + 1}
                    </span>
                    <span className="text-[13px] font-medium text-slate-700 dark:text-gray-300">
                      {exercise.question}
                    </span>
                    {res === true && (
                      <Check size={13} className="ml-auto text-emerald-500" />
                    )}
                  </div>

                  <div className="p-4 space-y-3">
                    {/* Exercise code with blank */}
                    <div className="bg-gray-950 rounded-lg p-3 font-mono text-[12px] text-gray-300 whitespace-pre-wrap">
                      {exercise.code.split('___').map((part, pIdx, arr) => (
                        <React.Fragment key={pIdx}>
                          {highlightLine(part)}
                          {pIdx < arr.length - 1 && (
                            <span className="inline-block text-amber-400 border-b border-dashed border-amber-400/50">
                              {'___'}
                            </span>
                          )}
                        </React.Fragment>
                      ))}
                    </div>

                    {/* Input + controls */}
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <input
                          type="text"
                          value={val}
                          onChange={(e) => {
                            setInputs((p) => ({ ...p, [key]: e.target.value }));
                            if (res !== null) {
                              setResults((p) => ({ ...p, [key]: null }));
                            }
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && val.trim()) handleCheck(eIdx);
                          }}
                          placeholder="Type your answer..."
                          className={`w-full px-3 py-2 text-[13px] rounded-md border bg-white dark:bg-gray-800 text-slate-800 dark:text-gray-200 placeholder-slate-400 dark:placeholder-gray-600 outline-none transition-colors ${
                            res === true
                              ? 'border-emerald-400 dark:border-emerald-500'
                              : res === false
                                ? 'border-red-400 dark:border-red-500'
                                : 'border-slate-300 dark:border-gray-700 focus:border-blue-400 dark:focus:border-blue-500'
                          }`}
                        />
                        {res === true && (
                          <Check
                            size={14}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-emerald-500"
                          />
                        )}
                        {res === false && (
                          <X
                            size={14}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-red-500"
                          />
                        )}
                      </div>

                      <button
                        onClick={() => handleCheck(eIdx)}
                        disabled={!val.trim()}
                        className="flex items-center gap-1.5 px-3 py-2 text-[12px] font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      >
                        <Check size={12} />
                        Check
                      </button>

                      <button
                        onClick={() => handleReset(eIdx)}
                        className="flex items-center gap-1.5 px-3 py-2 text-[12px] font-medium rounded-md border border-slate-300 dark:border-gray-700 text-slate-600 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-gray-800 transition-colors"
                      >
                        <RotateCcw size={12} />
                        Reset
                      </button>
                    </div>

                    {/* Feedback */}
                    {res === true && (
                      <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
                        <Check size={14} className="text-emerald-600 dark:text-emerald-400" />
                        <span className="text-[12px] text-emerald-700 dark:text-emerald-300">
                          Correct! Well done.
                        </span>
                      </div>
                    )}

                    {res === false && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                          <X size={14} className="text-red-600 dark:text-red-400" />
                          <span className="text-[12px] text-red-700 dark:text-red-300">
                            Not quite. Try again or check the hint.
                          </span>
                        </div>
                        {!hintVisible && (
                          <button
                            onClick={() =>
                              setShowHints((p) => ({ ...p, [key]: true }))
                            }
                            className="text-[12px] text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            Show hint
                          </button>
                        )}
                      </div>
                    )}

                    {hintVisible && (
                      <div className="flex items-start gap-2 px-3 py-2 rounded-md bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800">
                        <ChevronRight size={14} className="text-amber-500 mt-0.5 shrink-0" />
                        <span className="text-[12px] text-amber-700 dark:text-amber-300">
                          {exercise.hint}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Navigation buttons */}
          <div className="max-w-2xl flex items-center justify-between pt-2 pb-4">
            <button
              onClick={() => {
                const idx = topicKeys.indexOf(activeTopic);
                if (idx > 0) setActiveTopic(topicKeys[idx - 1]);
              }}
              disabled={topicKeys.indexOf(activeTopic) === 0}
              className="flex items-center gap-1.5 px-3 py-2 text-[12px] font-medium rounded-md border border-slate-300 dark:border-gray-700 text-slate-600 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={12} className="rotate-180" />
              Previous
            </button>
            <button
              onClick={() => {
                const idx = topicKeys.indexOf(activeTopic);
                if (idx < topicKeys.length - 1) setActiveTopic(topicKeys[idx + 1]);
              }}
              disabled={topicKeys.indexOf(activeTopic) === topicKeys.length - 1}
              className="flex items-center gap-1.5 px-3 py-2 text-[12px] font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              Next
              <ChevronRight size={12} />
            </button>
          </div>
        </main>
      </div>
    </div>
  );
};
