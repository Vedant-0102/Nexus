import React, { useState } from 'react';
import { BookOpen, Code, ChevronRight, Check, X, RotateCcw } from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CodeExample {
  title: string;
  lines: string[];
  output?: string;
}

interface Exercise {
  question: string;
  code: string;
  answer: string;
  hint: string;
}

interface TopicData {
  title: string;
  icon: React.ReactNode;
  explanation: string;
  examples: CodeExample[];
  exercises: Exercise[];
}

// ---------------------------------------------------------------------------
// Topic data (12 topics, 2-3 examples each, 2 exercises each)
// ---------------------------------------------------------------------------

const topics: Record<string, TopicData> = {
  introduction: {
    title: 'Introduction',
    icon: <BookOpen size={14} />,
    explanation:
      'Rust is a systems programming language focused on safety, speed, and concurrency. It guarantees memory safety without a garbage collector through its ownership system. Rust compiles to native code and is used for systems programming, WebAssembly, CLI tools, embedded devices, and game engines. Cargo is the official build tool and package manager; crates.io hosts community packages.',
    examples: [
      {
        title: 'Hello World & Cargo basics',
        lines: [
          '// Install Rust via https://rustup.rs',
          '// Create project: cargo new my_app',
          '// Build:          cargo build',
          '// Run:            cargo run',
          '// Test:           cargo test',
          '',
          'fn main() {',
          '    println!("Hello, World!");',
          '}',
        ],
        output: 'Hello, World!',
      },
      {
        title: 'Cargo.toml & dependencies',
        lines: [
          '// Cargo.toml is the manifest file',
          '// [package]',
          '// name = "my_app"',
          '// version = "0.1.0"',
          '// edition = "2021"',
          '//',
          '// [dependencies]',
          '// serde = "1.0"',
          '// tokio = { version = "1", features = ["full"] }',
          '',
          '// After adding deps, run:',
          '//   cargo build   (downloads & compiles)',
          '//   cargo update  (updates to latest compatible)',
        ],
      },
      {
        title: 'Multiple print macros',
        lines: [
          'fn main() {',
          '    println!("standard output");',
          '    eprintln!("standard error");',
          '',
          '    let name = "Rust";',
          '    let year = 2015;',
          '    println!("{} was released in {}", name, year);',
          '    println!("{name} is awesome!");  // inline',
          '}',
        ],
        output: 'standard output\nstandard error\nRust was released in 2015\nRust is awesome!',
      },
    ],
    exercises: [
      {
        question: 'Complete the macro call to print "Hello, Rust!"',
        code: 'fn main() {\n    ___("Hello, Rust!");\n}',
        answer: 'println!',
        hint: 'Use the println! macro (with the exclamation mark) to print to stdout',
      },
      {
        question: 'Which command creates a new Rust project called my_app?',
        code: 'cargo ___ my_app',
        answer: 'new',
        hint: 'The cargo subcommand for creating a new project is "new"',
      },
    ],
  },

  variables: {
    title: 'Variables & Types',
    icon: <Code size={14} />,
    explanation:
      'Variables are immutable by default in Rust. Use the mut keyword to allow reassignment. Rust is statically typed with strong type inference. Scalar types include integers (i8-i128, u8-u128), floats (f32, f64), bool, and char. Compound types include tuples and arrays. Shadowing lets you re-declare a variable with let, even changing its type. Constants use const and must always have a type annotation.',
    examples: [
      {
        title: 'Immutable, mutable, and type annotations',
        lines: [
          'let x: i32 = 42;           // immutable',
          'let mut count: u32 = 0;     // mutable',
          'count += 1;',
          '',
          'let pi: f64 = 3.14159;',
          'let active: bool = true;',
          'let letter: char = \'A\';',
          'let name: &str = "Alice";   // string slice (borrowed)',
          'let owned: String = String::from("Bob");',
          '',
          'println!("{x} {count} {pi} {active} {letter}");',
          'println!("{name} and {owned}");',
        ],
        output: '42 1 3.14159 true A\nAlice and Bob',
      },
      {
        title: 'Shadowing, constants, and type aliases',
        lines: [
          '// Shadowing: re-declare with let',
          'let x = 5;',
          'let x = x + 1;        // x is now 6',
          'let x = x * 2;        // x is now 12',
          '',
          '// Change type via shadowing',
          'let spaces = "   ";',
          'let spaces = spaces.len();  // now usize',
          '',
          '// Constants (always typed, UPPER_SNAKE_CASE)',
          'const MAX_POINTS: u32 = 100_000;',
          'const PI: f64 = 3.14159265;',
          '',
          '// Type alias',
          'type Meters = f64;',
          'let height: Meters = 1.83;',
          '',
          'println!("{x} {spaces} {MAX_POINTS} {height}");',
        ],
        output: '12 3 100000 1.83',
      },
      {
        title: 'Tuples and arrays',
        lines: [
          '// Tuple: fixed-size, mixed types',
          'let tup: (i32, f64, bool) = (500, 6.4, true);',
          'let (a, b, c) = tup;         // destructure',
          'let first = tup.0;           // index access',
          'println!("{a} {b} {c} {first}");',
          '',
          '// Array: fixed-size, same type',
          'let arr: [i32; 5] = [1, 2, 3, 4, 5];',
          'let zeros = [0; 10];         // [0, 0, 0, ... x10]',
          'println!("{} {}", arr[0], arr.len());',
          'println!("{}", zeros.len());',
        ],
        output: '500 6.4 true 500\n1 5\n10',
      },
    ],
    exercises: [
      {
        question: 'Add the keyword that allows a variable to be reassigned',
        code: 'let ___ x: i32 = 5;\nx = 10;',
        answer: 'mut',
        hint: 'Place the "mut" keyword between let and the variable name',
      },
      {
        question: 'Declare a constant with value 100 (constants need a type)',
        code: '___ MAX: u32 = 100;',
        answer: 'const',
        hint: 'Use the "const" keyword instead of "let" for compile-time constants',
      },
    ],
  },

  operators: {
    title: 'Operators & I/O',
    icon: <Code size={14} />,
    explanation:
      'Rust provides arithmetic (+, -, *, /, %), comparison (==, !=, <, >, <=, >=), and logical (&&, ||, !) operators. The println! macro uses {} for Display formatting and {:?} for Debug formatting. The format! macro builds a String without printing. Type casting is done with the "as" keyword. The turbofish syntax ::<T> specifies generic type parameters explicitly.',
    examples: [
      {
        title: 'Print formatting',
        lines: [
          'let name = "Rust";',
          'let version = 1.75;',
          '',
          'println!("Display: {}", name);',
          'println!("Debug:   {:?}", (1, 2, 3));',
          'println!("Pretty:  {:#?}", vec![1, 2, 3]);',
          '',
          '// Positional and named',
          'println!("{0} is {1}, {0} is great", "Rust", "fast");',
          'println!("{lang} v{ver}", lang = name, ver = version);',
          '',
          '// Padding and alignment',
          'println!("{:<10}|", "left");',
          'println!("{:>10}|", "right");',
          'println!("{:^10}|", "center");',
          'println!("{:0>5}", 42);',
        ],
        output: 'Display: Rust\nDebug:   (1, 2, 3)\nPretty:  [1, 2, 3]\nRust is fast, Rust is great\nRust v1.75\nleft      |\n     right|\n  center  |\n00042',
      },
      {
        title: 'Arithmetic and comparison',
        lines: [
          'let a: i32 = 17;',
          'let b: i32 = 5;',
          '',
          'println!("{} + {} = {}",  a, b, a + b);',
          'println!("{} - {} = {}",  a, b, a - b);',
          'println!("{} * {} = {}",  a, b, a * b);',
          'println!("{} / {} = {}",  a, b, a / b);   // integer division',
          'println!("{} % {} = {}",  a, b, a % b);',
          '',
          'println!("{} == {} is {}",  a, b, a == b);',
          'println!("{} > {} is {}",   a, b, a > b);',
          '',
          'let p = true;',
          'let q = false;',
          'println!("{} && {} = {}",  p, q, p && q);',
          'println!("{} || {} = {}",  p, q, p || q);',
          'println!("!{} = {}",      p, !p);',
        ],
        output: '17 + 5 = 22\n17 - 5 = 12\n17 * 5 = 85\n17 / 5 = 3\n17 % 5 = 2\n17 == 5 is false\n17 > 5 is true\ntrue && false = false\ntrue || false = true\n!true = false',
      },
      {
        title: 'Type casting and turbofish',
        lines: [
          '// Casting with "as"',
          'let x: i32 = 65;',
          'let y: f64 = x as f64;',
          'let c: char = x as u8 as char;',
          'println!("{x} -> {y} -> {c}");',
          '',
          'let big: u64 = 1_000_000;',
          'let small: u16 = big as u16;  // truncation!',
          'println!("{big} as u16 = {small}");',
          '',
          '// Turbofish ::<T>',
          'let parsed = "42".parse::<i32>().unwrap();',
          'let collected: Vec<i32> = (1..=5).collect();',
          'let collected2 = (1..=5).collect::<Vec<i32>>();',
          'println!("{parsed} {:?} {:?}", collected, collected2);',
        ],
        output: '65 -> 65 -> A\n1000000 as u16 = 16960\n42 [1, 2, 3, 4, 5] [1, 2, 3, 4, 5]',
      },
    ],
    exercises: [
      {
        question: 'Which format specifier prints a value using Debug trait?',
        code: 'println!("___", my_vec);',
        answer: '{:?}',
        hint: 'Use {:?} inside the format string for Debug output',
      },
      {
        question: 'Cast the integer to a float using the "as" keyword',
        code: 'let x: i32 = 10;\nlet y: f64 = x ___ f64;',
        answer: 'as',
        hint: 'The "as" keyword performs explicit type casting in Rust',
      },
    ],
  },

  'control-flow': {
    title: 'Control Flow',
    icon: <ChevronRight size={14} />,
    explanation:
      'In Rust, if/else is an expression that returns a value. There are three loop forms: loop (infinite, break to exit), while (condition-checked), and for (iterator-based). Loop labels allow breaking out of nested loops. break can return a value from loop. while let and if let provide concise pattern matching for common cases. Ranges use .. (exclusive) and ..= (inclusive).',
    examples: [
      {
        title: 'if/else expressions and for loops',
        lines: [
          'let temp = 22;',
          '',
          '// if/else as an expression',
          'let weather = if temp > 30 {',
          '    "hot"',
          '} else if temp > 20 {',
          '    "warm"',
          '} else {',
          '    "cold"',
          '};',
          'println!("{weather}");',
          '',
          '// for with range',
          'for i in 1..=3 {',
          '    print!("{i} ");',
          '}',
          'println!();',
          '',
          '// for over iterator',
          'let fruits = vec!["apple", "banana", "cherry"];',
          'for (i, fruit) in fruits.iter().enumerate() {',
          '    println!("{i}: {fruit}");',
          '}',
        ],
        output: 'warm\n1 2 3\n0: apple\n1: banana\n2: cherry',
      },
      {
        title: 'loop, labels, and break-with-value',
        lines: [
          '// Infinite loop with break',
          'let mut n = 0;',
          'loop {',
          '    n += 1;',
          '    if n == 3 { break; }',
          '}',
          'println!("n = {n}");',
          '',
          '// break with value',
          'let mut counter = 0;',
          'let result = loop {',
          '    counter += 1;',
          '    if counter == 10 {',
          '        break counter * 2;',
          '    }',
          '};',
          'println!("result = {result}");',
          '',
          "// Loop labels ('outer, 'inner)",
          'let mut found = false;',
          "'outer: for x in 0..5 {",
          '    for y in 0..5 {',
          '        if x + y == 6 {',
          '            found = true;',
          "            break 'outer;",
          '        }',
          '    }',
          '}',
          'println!("found = {found}");',
        ],
        output: 'n = 3\nresult = 20\nfound = true',
      },
      {
        title: 'while let and if let',
        lines: [
          '// while loop',
          'let mut countdown = 3;',
          'while countdown > 0 {',
          '    print!("{countdown}.. ");',
          '    countdown -= 1;',
          '}',
          'println!("Go!");',
          '',
          '// if let (concise pattern matching)',
          'let config: Option<i32> = Some(42);',
          'if let Some(val) = config {',
          '    println!("config = {val}");',
          '} else {',
          '    println!("not configured");',
          '}',
          '',
          '// while let',
          'let mut stack = vec![1, 2, 3];',
          'while let Some(top) = stack.pop() {',
          '    print!("{top} ");',
          '}',
          'println!();',
        ],
        output: '3.. 2.. 1.. Go!\nconfig = 42\n3 2 1',
      },
    ],
    exercises: [
      {
        question: 'Write the inclusive range from 1 to 5',
        code: 'for i in 1___5 {\n    print!("{i} ");\n}',
        answer: '..=',
        hint: 'Use ..= for an inclusive range (includes the end value)',
      },
      {
        question: 'Break out of the outer loop using a label',
        code: "'outer: for x in 0..3 {\n    for y in 0..3 {\n        if x == 1 { break ___; }\n    }\n}",
        answer: "'outer",
        hint: 'Reference the loop label with the same lifetime-like syntax: \'outer',
      },
    ],
  },

  ownership: {
    title: 'Ownership',
    icon: <BookOpen size={14} />,
    explanation:
      'Ownership is Rust\'s core memory management strategy. Three rules: (1) each value has exactly one owner, (2) when the owner goes out of scope the value is dropped, (3) assigning a heap value to another variable moves it, invalidating the original. Stack-only types (i32, bool, f64, char, tuples of Copy types) implement the Copy trait and are copied instead of moved. Use clone() for explicit deep copies of heap data.',
    examples: [
      {
        title: 'Move semantics',
        lines: [
          '// Stack types are Copy (no move)',
          'let a = 42;',
          'let b = a;  // a is copied, both valid',
          'println!("{a} {b}");',
          '',
          '// Heap types are Moved',
          'let s1 = String::from("hello");',
          'let s2 = s1;  // s1 is MOVED to s2',
          '// println!("{s1}");  // ERROR: s1 no longer valid',
          'println!("{s2}");',
          '',
          '// Clone for deep copy',
          'let s3 = String::from("world");',
          'let s4 = s3.clone();  // deep copy',
          'println!("{s3} {s4}");  // both valid',
        ],
        output: '42 42\nhello\nworld world',
      },
      {
        title: 'Ownership with functions',
        lines: [
          'fn take_ownership(s: String) {',
          '    println!("got: {s}");',
          '}  // s is dropped here',
          '',
          'fn make_copy(n: i32) {',
          '    println!("copy: {n}");',
          '}  // n is Copy, nothing special',
          '',
          'fn give_back() -> String {',
          '    let s = String::from("returned");',
          '    s  // ownership transferred to caller',
          '}',
          '',
          'fn main() {',
          '    let msg = String::from("hello");',
          '    take_ownership(msg);',
          '    // msg is no longer valid here',
          '',
          '    let num = 42;',
          '    make_copy(num);',
          '    println!("still have: {num}");',
          '',
          '    let received = give_back();',
          '    println!("{received}");',
          '}',
        ],
        output: 'got: hello\ncopy: 42\nstill have: 42\nreturned',
      },
      {
        title: 'Scope and Drop',
        lines: [
          '// Values are dropped when they leave scope',
          '{',
          '    let s = String::from("scoped");',
          '    println!("{s}");',
          '}  // s is dropped (memory freed) here',
          '',
          '// Custom drop order',
          'struct Droppable(i32);',
          '',
          'impl Drop for Droppable {',
          '    fn drop(&mut self) {',
          '        println!("dropping {}", self.0);',
          '    }',
          '}',
          '',
          'fn main() {',
          '    let _a = Droppable(1);',
          '    let _b = Droppable(2);',
          '    println!("end of main");',
          '}  // _b dropped first, then _a (reverse order)',
        ],
        output: 'scoped\nend of main\ndropping 2\ndropping 1',
      },
    ],
    exercises: [
      {
        question: 'Make a deep copy so both s1 and s2 remain valid',
        code: 'let s1 = String::from("rust");\nlet s2 = s1.___();',
        answer: 'clone',
        hint: 'Use clone() to create a deep copy of heap-allocated data',
      },
      {
        question: 'Which trait allows a type to be copied instead of moved?',
        code: '// i32 implements the ___ trait',
        answer: 'Copy',
        hint: 'Stack-only types implement the Copy trait for implicit duplication',
      },
    ],
  },

  borrowing: {
    title: 'Borrowing & References',
    icon: <Code size={14} />,
    explanation:
      'References let you use a value without taking ownership. An immutable reference (&T) allows reading but not modifying. A mutable reference (&mut T) allows modification but enforces exclusive access. The borrowing rules: you can have either one mutable reference OR any number of immutable references at a time. This prevents data races at compile time. Slices (&[T] and &str) are references to contiguous sequences.',
    examples: [
      {
        title: 'Immutable and mutable references',
        lines: [
          '// Immutable borrow',
          'fn calc_len(s: &String) -> usize {',
          '    s.len()  // can read but not modify',
          '}',
          '',
          '// Mutable borrow',
          'fn append_world(s: &mut String) {',
          '    s.push_str(", world!");',
          '}',
          '',
          'fn main() {',
          '    let mut greeting = String::from("hello");',
          '',
          '    let len = calc_len(&greeting);',
          '    println!("len = {len}");',
          '',
          '    append_world(&mut greeting);',
          '    println!("{greeting}");',
          '}',
        ],
        output: 'len = 5\nhello, world!',
      },
      {
        title: 'Borrowing rules',
        lines: [
          'let mut s = String::from("hello");',
          '',
          '// Multiple immutable borrows: OK',
          'let r1 = &s;',
          'let r2 = &s;',
          'println!("{r1} {r2}");',
          '// r1, r2 no longer used after this',
          '',
          '// Mutable borrow after immutables are done: OK',
          'let r3 = &mut s;',
          'r3.push_str(" world");',
          'println!("{r3}");',
          '',
          '// This would NOT compile:',
          '// let r4 = &s;',
          '// let r5 = &mut s;  // ERROR: cannot borrow',
          '// println!("{r4} {r5}");',
        ],
        output: 'hello hello\nhello world',
      },
      {
        title: 'Slices: &[T] and &str',
        lines: [
          '// String slices',
          'let s = String::from("hello world");',
          'let hello: &str = &s[0..5];',
          'let world: &str = &s[6..];',
          'println!("{hello} | {world}");',
          '',
          '// Array slices',
          'let arr = [10, 20, 30, 40, 50];',
          'let slice: &[i32] = &arr[1..4];',
          'println!("{:?}", slice);',
          '',
          '// Prefer &str over &String',
          'fn first_word(s: &str) -> &str {',
          '    let bytes = s.as_bytes();',
          '    for (i, &byte) in bytes.iter().enumerate() {',
          '        if byte == b\' \' { return &s[..i]; }',
          '    }',
          '    s',
          '}',
          'println!("{}", first_word("hello world"));',
        ],
        output: 'hello | world\n[20, 30, 40]\nhello',
      },
    ],
    exercises: [
      {
        question: 'Pass a mutable reference to a function',
        code: 'fn add_one(n: &mut i32) { *n += 1; }\nlet mut x = 5;\nadd_one(___ x);',
        answer: '&mut',
        hint: 'Use &mut to create a mutable reference',
      },
      {
        question: 'Take a string slice parameter (preferred over &String)',
        code: 'fn greet(name: ___) {\n    println!("hi {name}");\n}',
        answer: '&str',
        hint: 'Use &str as the parameter type for borrowed string data',
      },
    ],
  },

  structs: {
    title: 'Structs & Enums',
    icon: <Code size={14} />,
    explanation:
      'Structs group related data with named fields. Tuple structs have unnamed fields. Unit structs have no fields. Use impl blocks to attach methods. Methods that take &self are borrowing, &mut self mutate, and self consume. Enums define a type with variants that can hold data. Option<T> (Some/None) and Result<T,E> (Ok/Err) are enum types used pervasively.',
    examples: [
      {
        title: 'Struct definition and impl block',
        lines: [
          '#[derive(Debug)]',
          'struct Rectangle {',
          '    width: f64,',
          '    height: f64,',
          '}',
          '',
          'impl Rectangle {',
          '    // Associated function (constructor)',
          '    fn new(w: f64, h: f64) -> Self {',
          '        Rectangle { width: w, height: h }',
          '    }',
          '',
          '    // Method (borrows self)',
          '    fn area(&self) -> f64 {',
          '        self.width * self.height',
          '    }',
          '',
          '    // Mutable method',
          '    fn scale(&mut self, factor: f64) {',
          '        self.width *= factor;',
          '        self.height *= factor;',
          '    }',
          '}',
          '',
          'let mut r = Rectangle::new(10.0, 5.0);',
          'println!("area = {}", r.area());',
          'r.scale(2.0);',
          'println!("{:?}", r);',
        ],
        output: 'area = 50\nRectangle { width: 20.0, height: 10.0 }',
      },
      {
        title: 'Tuple structs, unit structs, and update syntax',
        lines: [
          '// Tuple struct',
          'struct Color(u8, u8, u8);',
          'let red = Color(255, 0, 0);',
          'println!("R={} G={} B={}", red.0, red.1, red.2);',
          '',
          '// Unit struct (marker)',
          'struct Marker;',
          'let _m = Marker;',
          '',
          '// Struct update syntax',
          '#[derive(Debug)]',
          'struct User {',
          '    name: String,',
          '    age: u32,',
          '    active: bool,',
          '}',
          '',
          'let user1 = User {',
          '    name: String::from("Alice"),',
          '    age: 30,',
          '    active: true,',
          '};',
          'let user2 = User {',
          '    name: String::from("Bob"),',
          '    ..user1  // copies age and active',
          '};',
          'println!("{:?}", user2);',
        ],
        output: 'R=255 G=0 B=0\nUser { name: "Bob", age: 30, active: true }',
      },
      {
        title: 'Enums with data, Option and Result',
        lines: [
          '#[derive(Debug)]',
          'enum Shape {',
          '    Circle(f64),',
          '    Rectangle(f64, f64),',
          '    Triangle { base: f64, height: f64 },',
          '}',
          '',
          'fn area(s: &Shape) -> f64 {',
          '    match s {',
          '        Shape::Circle(r) => 3.14159 * r * r,',
          '        Shape::Rectangle(w, h) => w * h,',
          '        Shape::Triangle { base, height } => base * height / 2.0,',
          '    }',
          '}',
          '',
          'let shapes = vec![',
          '    Shape::Circle(5.0),',
          '    Shape::Rectangle(4.0, 6.0),',
          '    Shape::Triangle { base: 3.0, height: 8.0 },',
          '];',
          'for s in &shapes {',
          '    println!("{:?} => area = {:.2}", s, area(s));',
          '}',
        ],
        output: 'Circle(5.0) => area = 78.54\nRectangle(4.0, 6.0) => area = 24.00\nTriangle { base: 3.0, height: 8.0 } => area = 12.00',
      },
    ],
    exercises: [
      {
        question: 'What parameter type does a method use to borrow self immutably?',
        code: 'impl MyStruct {\n    fn name(___)  -> &str {\n        &self.name\n    }\n}',
        answer: '&self',
        hint: 'Use &self to borrow self immutably in a method signature',
      },
      {
        question: 'Create a new instance with the associated function',
        code: 'let r = Rectangle::___(10.0, 5.0);',
        answer: 'new',
        hint: 'Call the associated function "new" on the type using :: syntax',
      },
    ],
  },

  patterns: {
    title: 'Pattern Matching',
    icon: <ChevronRight size={14} />,
    explanation:
      'Match expressions must be exhaustive -- every possible value must be handled. Patterns can destructure structs, enums, and tuples. Guards add conditions with "if". The @ binding captures a value while testing it against a pattern. The _ wildcard matches anything, and .. ignores remaining fields. if let and while let are shorthand for single-pattern matching.',
    examples: [
      {
        title: 'Match exhaustiveness and guards',
        lines: [
          'let num = 13;',
          '',
          'let desc = match num {',
          '    0 => "zero",',
          '    1..=12 => "small",',
          '    13..=19 => "teen",',
          '    n if n < 0 => "negative",',
          '    _ => "big",',
          '};',
          'println!("{num} is {desc}");',
          '',
          '// Multiple patterns with |',
          'let c = \'x\';',
          'let kind = match c {',
          "    'a'..='z' => \"lowercase\",",
          "    'A'..='Z' => \"uppercase\",",
          "    '0'..='9' => \"digit\",",
          '    _ => "other",',
          '};',
          'println!("{c} is {kind}");',
        ],
        output: '13 is teen\nx is lowercase',
      },
      {
        title: 'Destructuring and @ bindings',
        lines: [
          '// Destructure struct',
          'struct Point { x: i32, y: i32 }',
          'let p = Point { x: 3, y: -7 };',
          'let Point { x, y } = p;',
          'println!("({x}, {y})");',
          '',
          '// Destructure enum',
          'enum Msg {',
          '    Quit,',
          '    Move { x: i32, y: i32 },',
          '    Write(String),',
          '}',
          '',
          'let m = Msg::Move { x: 10, y: 20 };',
          'match m {',
          '    Msg::Quit => println!("quit"),',
          '    Msg::Move { x, y } => println!("move to ({x},{y})"),',
          '    Msg::Write(text) => println!("write: {text}"),',
          '}',
          '',
          '// @ binding: capture while testing',
          'let val = 15;',
          'match val {',
          '    n @ 1..=10 => println!("{n} in [1,10]"),',
          '    n @ 11..=20 => println!("{n} in [11,20]"),',
          '    other => println!("{other} out of range"),',
          '}',
        ],
        output: '(3, -7)\nmove to (10,20)\n15 in [11,20]',
      },
      {
        title: 'Nested patterns and ignoring fields',
        lines: [
          '// Tuple destructuring',
          'let (a, _, c) = (1, 2, 3);  // ignore second',
          'println!("{a} {c}");',
          '',
          '// Ignore remaining fields with ..',
          'struct Config {',
          '    debug: bool,',
          '    verbose: bool,',
          '    port: u16,',
          '    host: String,',
          '}',
          '',
          'let cfg = Config {',
          '    debug: true,',
          '    verbose: false,',
          '    port: 8080,',
          '    host: String::from("localhost"),',
          '};',
          '',
          'let Config { debug, port, .. } = cfg;',
          'println!("debug={debug} port={port}");',
          '',
          '// Nested match',
          'let pair = (Some(42), None::<i32>);',
          'match pair {',
          '    (Some(a), Some(b)) => println!("both: {a} {b}"),',
          '    (Some(a), None) => println!("first only: {a}"),',
          '    _ => println!("other"),',
          '}',
        ],
        output: '1 3\ndebug=true port=8080\nfirst only: 42',
      },
    ],
    exercises: [
      {
        question: 'What wildcard pattern matches any value?',
        code: 'match val {\n    1 => "one",\n    2 => "two",\n    ___ => "other",\n}',
        answer: '_',
        hint: 'The underscore _ is the wildcard/catch-all pattern',
      },
      {
        question: 'Use @ to bind the matched value to a name',
        code: 'match age {\n    n ___ 0..=17 => println!("{n} is minor"),\n    _ => println!("adult"),\n}',
        answer: '@',
        hint: 'The @ symbol binds the matched value to the variable on its left',
      },
    ],
  },

  errors: {
    title: 'Error Handling',
    icon: <X size={14} />,
    explanation:
      'Rust has no exceptions. Recoverable errors use Result<T, E> with Ok(value) or Err(error). Optional values use Option<T> with Some(value) or None. The ? operator propagates errors by returning Err early. unwrap() and expect() extract values but panic on failure. Custom error types implement std::error::Error and can use the From trait for conversion. The thiserror and anyhow crates simplify error handling in libraries and applications.',
    examples: [
      {
        title: 'Result and the ? operator',
        lines: [
          'use std::num::ParseIntError;',
          '',
          'fn parse_and_double(s: &str) -> Result<i32, ParseIntError> {',
          '    let n = s.parse::<i32>()?;  // returns Err if parse fails',
          '    Ok(n * 2)',
          '}',
          '',
          'fn main() {',
          '    match parse_and_double("21") {',
          '        Ok(val) => println!("success: {val}"),',
          '        Err(e) => println!("error: {e}"),',
          '    }',
          '',
          '    match parse_and_double("abc") {',
          '        Ok(val) => println!("success: {val}"),',
          '        Err(e) => println!("error: {e}"),',
          '    }',
          '}',
        ],
        output: 'success: 42\nerror: invalid digit found in string',
      },
      {
        title: 'unwrap, expect, and chaining',
        lines: [
          '// unwrap: panics with generic message on Err/None',
          'let x: Result<i32, &str> = Ok(10);',
          'let val = x.unwrap();',
          'println!("unwrapped: {val}");',
          '',
          '// expect: panics with custom message',
          'let y: Option<i32> = Some(42);',
          'let val = y.expect("expected a value");',
          'println!("expected: {val}");',
          '',
          '// Chaining with map, and_then, unwrap_or',
          'let result: Result<i32, &str> = Ok(5);',
          'let doubled = result.map(|v| v * 2);',
          'println!("{:?}", doubled);',
          '',
          'let opt: Option<i32> = None;',
          'let fallback = opt.unwrap_or(0);',
          'println!("fallback: {fallback}");',
          '',
          'let chained: Option<i32> = Some(3)',
          '    .and_then(|x| if x > 2 { Some(x * 10) } else { None });',
          'println!("{:?}", chained);',
        ],
        output: 'unwrapped: 10\nexpected: 42\nOk(10)\nfallback: 0\nSome(30)',
      },
      {
        title: 'Custom error types',
        lines: [
          'use std::fmt;',
          '',
          '#[derive(Debug)]',
          'enum AppError {',
          '    NotFound(String),',
          '    ParseError(String),',
          '    Unauthorized,',
          '}',
          '',
          'impl fmt::Display for AppError {',
          '    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {',
          '        match self {',
          '            AppError::NotFound(s) => write!(f, "not found: {s}"),',
          '            AppError::ParseError(s) => write!(f, "parse error: {s}"),',
          '            AppError::Unauthorized => write!(f, "unauthorized"),',
          '        }',
          '    }',
          '}',
          '',
          'fn find_user(id: u32) -> Result<String, AppError> {',
          '    if id == 0 {',
          '        Err(AppError::NotFound("user 0".into()))',
          '    } else {',
          '        Ok(format!("User#{id}"))',
          '    }',
          '}',
          '',
          'println!("{}", find_user(1).unwrap());',
          'println!("{}", find_user(0).unwrap_err());',
        ],
        output: 'User#1\nnot found: user 0',
      },
    ],
    exercises: [
      {
        question: 'What operator propagates errors (returns Err early)?',
        code: 'fn read_num(s: &str) -> Result<i32, ParseIntError> {\n    let n = s.parse::<i32>()___;\n    Ok(n)\n}',
        answer: '?',
        hint: 'The ? operator after a Result returns Err early if it fails',
      },
      {
        question: 'Provide a default value if Option is None',
        code: 'let opt: Option<i32> = None;\nlet val = opt.___(0);',
        answer: 'unwrap_or',
        hint: 'Use unwrap_or(default) to provide a fallback value for None',
      },
    ],
  },

  traits: {
    title: 'Traits & Generics',
    icon: <BookOpen size={14} />,
    explanation:
      'Traits define shared behavior, similar to interfaces. impl Trait for Type provides concrete implementations. Traits can have default method implementations. Generics use <T> to write type-agnostic code. Trait bounds (T: Display) constrain what types can be used. Where clauses improve readability for complex bounds. Associated types simplify traits with a single type parameter. Supertraits require implementing another trait first.',
    examples: [
      {
        title: 'Trait definition, impl, and default methods',
        lines: [
          'trait Summary {',
          '    fn title(&self) -> &str;',
          '',
          '    // Default method implementation',
          '    fn summarize(&self) -> String {',
          '        format!("[Read more: {}]", self.title())',
          '    }',
          '}',
          '',
          'struct Article {',
          '    title: String,',
          '    content: String,',
          '}',
          '',
          'impl Summary for Article {',
          '    fn title(&self) -> &str { &self.title }',
          '',
          '    fn summarize(&self) -> String {',
          '        format!("{}: {}...", self.title, &self.content[..20])',
          '    }',
          '}',
          '',
          'struct Tweet { user: String, body: String }',
          '',
          'impl Summary for Tweet {',
          '    fn title(&self) -> &str { &self.user }',
          '    // uses default summarize()',
          '}',
          '',
          'let a = Article {',
          '    title: "Rust 2024".into(),',
          '    content: "Exciting new features and improvements".into(),',
          '};',
          'println!("{}", a.summarize());',
        ],
        output: 'Rust 2024: Exciting new features...',
      },
      {
        title: 'Generics and trait bounds',
        lines: [
          'use std::fmt::Display;',
          '',
          '// Generic function with trait bound',
          'fn largest<T: PartialOrd>(list: &[T]) -> &T {',
          '    let mut max = &list[0];',
          '    for item in &list[1..] {',
          '        if item > max { max = item; }',
          '    }',
          '    max',
          '}',
          '',
          '// Multiple bounds with +',
          'fn print_largest<T: Display + PartialOrd>(a: T, b: T) {',
          '    let big = if a >= b { a } else { b };',
          '    println!("largest: {big}");',
          '}',
          '',
          '// Where clause (cleaner for many bounds)',
          'fn process<T, U>(t: T, u: U) -> String',
          'where',
          '    T: Display + Clone,',
          '    U: Display,',
          '{',
          '    format!("{t} and {u}")',
          '}',
          '',
          'let nums = vec![34, 50, 25, 100, 65];',
          'println!("max = {}", largest(&nums));',
          'print_largest(10, 20);',
        ],
        output: 'max = 100\nlargest: 20',
      },
      {
        title: 'Generic structs and associated types',
        lines: [
          '// Generic struct',
          'struct Pair<T> {',
          '    first: T,',
          '    second: T,',
          '}',
          '',
          'impl<T: Display> Pair<T> {',
          '    fn show(&self) {',
          '        println!("({}, {})", self.first, self.second);',
          '    }',
          '}',
          '',
          'let p = Pair { first: 10, second: 20 };',
          'p.show();',
          '',
          '// Associated type in trait',
          'trait Container {',
          '    type Item;',
          '    fn first(&self) -> Option<&Self::Item>;',
          '}',
          '',
          'struct Stack<T> { items: Vec<T> }',
          '',
          'impl<T> Container for Stack<T> {',
          '    type Item = T;',
          '    fn first(&self) -> Option<&T> {',
          '        self.items.first()',
          '    }',
          '}',
          '',
          'let s = Stack { items: vec![1, 2, 3] };',
          'println!("first = {:?}", s.first());',
        ],
        output: '(10, 20)\nfirst = Some(1)',
      },
    ],
    exercises: [
      {
        question: 'Implement the Summary trait for MyStruct',
        code: 'impl ___ for MyStruct {\n    fn title(&self) -> &str { "hello" }\n}',
        answer: 'Summary',
        hint: 'Place the trait name between "impl" and "for"',
      },
      {
        question: 'Add a trait bound requiring Display',
        code: 'fn show<T: ___>(item: T) {\n    println!("{item}");\n}',
        answer: 'Display',
        hint: 'The Display trait enables {} formatting in println!',
      },
    ],
  },

  collections: {
    title: 'Collections & Iterators',
    icon: <Code size={14} />,
    explanation:
      'Vec<T> is a growable array. HashMap<K,V> stores key-value pairs. HashSet<T> stores unique values. BTreeMap provides sorted keys. The Iterator trait exposes combinators like map, filter, fold, collect, and many more. iter() borrows, iter_mut() borrows mutably, and into_iter() takes ownership. Iterator chains are lazy -- nothing runs until a consumer (collect, sum, for_each) is called.',
    examples: [
      {
        title: 'Vec, HashMap, and HashSet',
        lines: [
          'use std::collections::{HashMap, HashSet};',
          '',
          '// Vec<T>',
          'let mut v: Vec<i32> = vec![1, 2, 3];',
          'v.push(4);',
          'v.extend([5, 6]);',
          'v.retain(|&x| x % 2 != 0);  // keep odds',
          'println!("vec: {:?}", v);',
          '',
          '// HashMap<K, V>',
          'let mut scores: HashMap<&str, i32> = HashMap::new();',
          'scores.insert("Alice", 95);',
          'scores.insert("Bob", 87);',
          'scores.entry("Carol").or_insert(90);',
          'println!("Alice = {:?}", scores.get("Alice"));',
          '',
          '// HashSet<T>',
          'let mut seen: HashSet<i32> = HashSet::new();',
          'seen.insert(1);',
          'seen.insert(2);',
          'seen.insert(1);  // duplicate ignored',
          'println!("unique: {:?}", seen.len());',
        ],
        output: 'vec: [1, 3, 5]\nAlice = Some(95)\nunique: 2',
      },
      {
        title: 'Iterator combinators',
        lines: [
          'let nums = vec![1, 2, 3, 4, 5, 6, 7, 8, 9, 10];',
          '',
          '// map + collect',
          'let squares: Vec<i32> = nums.iter().map(|x| x * x).collect();',
          'println!("squares: {:?}", &squares[..5]);',
          '',
          '// filter + sum',
          'let even_sum: i32 = nums.iter()',
          '    .filter(|&&x| x % 2 == 0)',
          '    .sum();',
          'println!("even sum: {even_sum}");',
          '',
          '// fold (reduce)',
          'let product: i32 = (1..=5).fold(1, |acc, x| acc * x);',
          'println!("5! = {product}");',
          '',
          '// chain, enumerate, take',
          'let a = [1, 2];',
          'let b = [3, 4];',
          'let chained: Vec<i32> = a.iter()',
          '    .chain(b.iter())',
          '    .copied()',
          '    .collect();',
          'println!("chained: {:?}", chained);',
        ],
        output: 'squares: [1, 4, 9, 16, 25]\neven sum: 30\n5! = 120\nchained: [1, 2, 3, 4]',
      },
      {
        title: 'iter vs iter_mut vs into_iter',
        lines: [
          'let names = vec!["Alice", "Bob", "Carol"];',
          '',
          '// iter(): borrows each element (&T)',
          'for name in names.iter() {',
          '    print!("{name} ");',
          '}',
          'println!();',
          'println!("names still valid: {}", names.len());',
          '',
          '// iter_mut(): mutable borrow (&mut T)',
          'let mut nums = vec![1, 2, 3];',
          'for n in nums.iter_mut() {',
          '    *n *= 10;',
          '}',
          'println!("mutated: {:?}", nums);',
          '',
          '// into_iter(): takes ownership (T)',
          'let words = vec!["hi", "bye"];',
          'let upper: Vec<String> = words.into_iter()',
          '    .map(|w| w.to_uppercase())',
          '    .collect();',
          'println!("upper: {:?}", upper);',
          '// words is no longer valid here',
        ],
        output: 'Alice Bob Carol\nnames still valid: 3\nmutated: [10, 20, 30]\nupper: ["HI", "BYE"]',
      },
    ],
    exercises: [
      {
        question: 'Insert a default value if the key is not present',
        code: 'let mut map = HashMap::new();\nmap.entry("key").___( 42);',
        answer: 'or_insert(',
        hint: 'Use .entry("key").or_insert(value) to insert a default',
      },
      {
        question: 'Collect an iterator of doubled values into a Vec',
        code: 'let doubled: Vec<i32> = (1..=3)\n    .map(|x| x * 2)\n    .___();',
        answer: 'collect',
        hint: 'Use .collect() to consume an iterator into a collection',
      },
    ],
  },

  lifetimes: {
    title: 'Lifetimes & Advanced',
    icon: <BookOpen size={14} />,
    explanation:
      'Lifetime annotations (\'a) tell the compiler how long references are valid. Elision rules let you omit lifetimes in simple cases. \'static means the reference lives for the entire program. Closures come in three flavors: Fn (borrow), FnMut (borrow mutably), FnOnce (take ownership). Smart pointers include Box<T> (heap allocation), Rc<T> (reference counting), and RefCell<T> (interior mutability). Unsafe Rust lets you dereference raw pointers and call extern functions.',
    examples: [
      {
        title: 'Lifetime annotations',
        lines: [
          "// Without annotations, compiler can't know",
          "// which input's lifetime the output shares",
          "fn longest<'a>(x: &'a str, y: &'a str) -> &'a str {",
          '    if x.len() >= y.len() { x } else { y }',
          '}',
          '',
          'fn main() {',
          '    let s1 = String::from("long string");',
          '    let result;',
          '    {',
          '        let s2 = String::from("xyz");',
          '        result = longest(s1.as_str(), s2.as_str());',
          '        println!("longest: {result}");',
          '    }',
          '}',
          '',
          '// Lifetime in struct',
          "struct Excerpt<'a> {",
          "    text: &'a str,",
          '}',
          '',
          'let novel = String::from("Call me Ishmael. Some years...");',
          "let first = novel.split('.').next().unwrap();",
          'let exc = Excerpt { text: first };',
          'println!("excerpt: {}", exc.text);',
        ],
        output: 'longest: long string\nexcerpt: Call me Ishmael',
      },
      {
        title: 'Closures: Fn, FnMut, FnOnce',
        lines: [
          '// Fn: borrows captured variables',
          'let greeting = String::from("hello");',
          'let say_hi = || println!("{greeting}");',
          'say_hi();',
          'say_hi();  // can call multiple times',
          '',
          '// FnMut: mutably borrows captured variables',
          'let mut count = 0;',
          'let mut inc = || { count += 1; };',
          'inc();',
          'inc();',
          'println!("count = {count}");',
          '',
          '// FnOnce: consumes captured variables',
          'let name = String::from("Rust");',
          'let consume = move || {',
          '    println!("consumed: {name}");',
          '    // name is moved into the closure',
          '};',
          'consume();',
          '// consume(); // ERROR: FnOnce, already consumed',
          '',
          '// Closures as parameters',
          'fn apply<F: Fn(i32) -> i32>(f: F, x: i32) -> i32 {',
          '    f(x)',
          '}',
          'let double = |x| x * 2;',
          'println!("apply: {}", apply(double, 5));',
        ],
        output: 'hello\nhello\ncount = 2\nconsumed: Rust\napply: 10',
      },
      {
        title: 'Smart pointers: Box, Rc, RefCell',
        lines: [
          'use std::rc::Rc;',
          'use std::cell::RefCell;',
          '',
          '// Box<T>: heap allocation, single owner',
          'let boxed: Box<i32> = Box::new(42);',
          'println!("boxed: {boxed}");',
          '',
          '// Recursive type needs Box',
          'enum List {',
          '    Cons(i32, Box<List>),',
          '    Nil,',
          '}',
          'let list = List::Cons(1, Box::new(',
          '    List::Cons(2, Box::new(List::Nil))',
          '));',
          '',
          '// Rc<T>: reference-counted shared ownership',
          'let shared = Rc::new(String::from("shared"));',
          'let a = Rc::clone(&shared);',
          'let b = Rc::clone(&shared);',
          'println!("refs: {}", Rc::strong_count(&shared));',
          '',
          '// RefCell<T>: interior mutability',
          'let data = RefCell::new(vec![1, 2, 3]);',
          'data.borrow_mut().push(4);',
          'println!("data: {:?}", data.borrow());',
        ],
        output: 'boxed: 42\nrefs: 3\ndata: [1, 2, 3, 4]',
      },
    ],
    exercises: [
      {
        question: 'Annotate the returned reference lifetime to match input',
        code: "fn first_word<___>(s: &'a str) -> &'a str {\n    &s[..1]\n}",
        answer: "'a",
        hint: 'Declare the lifetime parameter \'a inside angle brackets',
      },
      {
        question: 'Clone an Rc to create another owner',
        code: 'let a = Rc::new(42);\nlet b = Rc::___(&a);',
        answer: 'clone',
        hint: 'Use Rc::clone(&rc) to increment the reference count',
      },
    ],
  },
};

const topicKeys = Object.keys(topics);

// ---------------------------------------------------------------------------
// Syntax highlighting
// ---------------------------------------------------------------------------

const KEYWORDS = new Set([
  'fn', 'let', 'mut', 'struct', 'enum', 'impl', 'trait', 'pub', 'use', 'mod',
  'match', 'if', 'else', 'for', 'while', 'loop', 'return', 'self', 'Self',
  'where', 'const', 'static', 'ref', 'move', 'async', 'await', 'in', 'as',
  'true', 'false', 'type', 'crate', 'super', 'dyn', 'break', 'continue',
  'unsafe', 'extern',
]);

const TYPES = new Set([
  'i8', 'i16', 'i32', 'i64', 'i128', 'isize',
  'u8', 'u16', 'u32', 'u64', 'u128', 'usize',
  'f32', 'f64', 'bool', 'char', 'str',
  'String', 'Vec', 'HashMap', 'HashSet', 'BTreeMap',
  'Option', 'Result', 'Box', 'Rc', 'Arc', 'RefCell',
  'Some', 'None', 'Ok', 'Err',
  'Display', 'Debug', 'Clone', 'Copy', 'PartialOrd', 'PartialEq',
  'Iterator', 'Drop', 'From', 'Into', 'Fn', 'FnMut', 'FnOnce',
]);

const MACROS = new Set([
  'println', 'print', 'eprintln', 'format', 'vec', 'write', 'writeln',
  'todo', 'unimplemented', 'panic', 'assert', 'assert_eq', 'dbg',
  'include_str', 'cfg', 'derive',
]);

function highlightLine(line: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  let i = 0;
  let key = 0;

  while (i < line.length) {
    // Line comments
    if (line[i] === '/' && line[i + 1] === '/') {
      nodes.push(
        <span key={key++} className="text-gray-500">
          {line.slice(i)}
        </span>,
      );
      break;
    }

    // Strings (double quotes)
    if (line[i] === '"') {
      const start = i;
      i++;
      while (i < line.length) {
        if (line[i] === '\\') { i += 2; continue; }
        if (line[i] === '"') { i++; break; }
        i++;
      }
      nodes.push(
        <span key={key++} className="text-green-400">
          {line.slice(start, i)}
        </span>,
      );
      continue;
    }

    // Char literals
    if (
      line[i] === '\'' &&
      i + 2 < line.length &&
      line[i + 2] === '\'' &&
      /[a-zA-Z0-9\\]/.test(line[i + 1])
    ) {
      nodes.push(
        <span key={key++} className="text-green-400">
          {line.slice(i, i + 3)}
        </span>,
      );
      i += 3;
      continue;
    }

    // Lifetime annotations ('a, 'b, 'static, 'outer, etc.)
    if (line[i] === '\'' && i + 1 < line.length && /[a-zA-Z]/.test(line[i + 1])) {
      const start = i;
      i++;
      while (i < line.length && /[a-zA-Z0-9_]/.test(line[i])) i++;
      nodes.push(
        <span key={key++} className="text-purple-400">
          {line.slice(start, i)}
        </span>,
      );
      continue;
    }

    // Numbers
    if (/\d/.test(line[i]) && (i === 0 || /[\s(,=[\-+*/<>:;{!|&]/.test(line[i - 1]))) {
      const start = i;
      while (i < line.length && /[\d._]/.test(line[i])) i++;
      nodes.push(
        <span key={key++} className="text-orange-400">
          {line.slice(start, i)}
        </span>,
      );
      continue;
    }

    // Identifiers, keywords, types, macros
    if (/[a-zA-Z_]/.test(line[i])) {
      const start = i;
      while (i < line.length && /[a-zA-Z0-9_]/.test(line[i])) i++;
      const word = line.slice(start, i);

      // Macro invocation (word!)
      if (i < line.length && line[i] === '!') {
        nodes.push(
          <span key={key++} className="text-yellow-400">
            {word}!
          </span>,
        );
        i++;
        continue;
      }

      if (TYPES.has(word)) {
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

    // Attribute tokens #[...]
    if (line[i] === '#' && i + 1 < line.length && line[i + 1] === '[') {
      const start = i;
      while (i < line.length && line[i] !== ']') i++;
      if (i < line.length) i++;
      nodes.push(
        <span key={key++} className="text-yellow-400">
          {line.slice(start, i)}
        </span>,
      );
      continue;
    }

    // Default character
    nodes.push(<span key={key++}>{line[i]}</span>);
    i++;
  }

  return nodes;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const RustLab: React.FC = () => {
  const [activeTopic, setActiveTopic] = useState<string>('introduction');
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [results, setResults] = useState<Record<string, boolean | null>>({});
  const [showHints, setShowHints] = useState<Record<string, boolean>>({});

  const topic = topics[activeTopic];

  const exKey = (idx: number) => `${activeTopic}_${idx}`;

  const handleCheck = (idx: number) => {
    const k = exKey(idx);
    const trimmed = (inputs[k] ?? '').trim();
    const expected = topic.exercises[idx].answer.trim();
    setResults((p) => ({ ...p, [k]: trimmed === expected }));
  };

  const handleReset = (idx: number) => {
    const k = exKey(idx);
    setInputs((p) => ({ ...p, [k]: '' }));
    setResults((p) => ({ ...p, [k]: null }));
    setShowHints((p) => ({ ...p, [k]: false }));
  };

  const topicFullyComplete = (key: string) => {
    const t = topics[key];
    return t.exercises.every((_, i) => results[`${key}_${i}`] === true);
  };

  return (
    <div className="h-full flex flex-col overflow-hidden bg-gradient-to-br from-slate-50 to-orange-50 dark:from-gray-950 dark:to-orange-950/20">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-200 dark:border-gray-800 bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm">
        <Code size={16} className="text-orange-600 dark:text-orange-400" />
        <h1 className="text-sm font-semibold text-slate-800 dark:text-gray-100">
          Rust Lab
        </h1>
        <span className="text-[11px] text-slate-400 dark:text-gray-500 ml-1">
          Beginner to Advanced
        </span>
        <div className="ml-auto flex items-center gap-1.5">
          <span className="text-[11px] text-slate-400 dark:text-gray-500">
            {topicKeys.filter(topicFullyComplete).length}/{topicKeys.length} completed
          </span>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-56 shrink-0 border-r border-slate-200 dark:border-gray-800 bg-white/40 dark:bg-gray-900/40 overflow-y-auto">
          <nav className="py-2">
            {topicKeys.map((key, idx) => {
              const t = topics[key];
              const isActive = activeTopic === key;
              const done = topicFullyComplete(key);
              return (
                <button
                  key={key}
                  onClick={() => setActiveTopic(key)}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-left text-[13px] transition-colors ${
                    isActive
                      ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 font-medium'
                      : 'text-slate-600 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-gray-800/50'
                  }`}
                >
                  <span className="text-[11px] text-slate-400 dark:text-gray-600 w-4 text-right shrink-0">
                    {idx + 1}
                  </span>
                  <span className="shrink-0">{t.icon}</span>
                  <span className="truncate flex-1">{t.title}</span>
                  {done && (
                    <Check size={12} className="text-emerald-500 shrink-0" />
                  )}
                  {isActive && !done && (
                    <ChevronRight size={12} className="shrink-0 opacity-50" />
                  )}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Title */}
          <div className="flex items-center gap-2">
            <span className="text-orange-600 dark:text-orange-400">{topic.icon}</span>
            <h2 className="text-lg font-semibold text-slate-800 dark:text-gray-100">
              {topic.title}
            </h2>
          </div>

          {/* Explanation */}
          <p className="text-[13px] leading-relaxed text-slate-600 dark:text-gray-400 max-w-2xl">
            {topic.explanation}
          </p>

          {/* Code examples */}
          {topic.examples.map((ex, eIdx) => (
            <div key={eIdx} className="max-w-2xl">
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 rounded-t-lg border-b border-gray-700">
                <Code size={12} className="text-gray-400" />
                <span className="text-[11px] text-gray-400">{ex.title}</span>
              </div>
              <div className="bg-gray-950 rounded-b-lg p-3 font-mono text-[12px] text-gray-200 leading-relaxed overflow-x-auto">
                {ex.lines.map((line, lIdx) => (
                  <div key={lIdx} className="min-h-[1.3em]">
                    {line === '' ? '\u00A0' : highlightLine(line)}
                  </div>
                ))}
              </div>
              {ex.output && (
                <div className="mt-1">
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-200 dark:bg-gray-800 rounded-t-lg">
                    <ChevronRight size={10} className="text-slate-500 dark:text-gray-400" />
                    <span className="text-[10px] text-slate-500 dark:text-gray-400">Output</span>
                  </div>
                  <div className="bg-slate-100 dark:bg-gray-800/60 rounded-b-lg px-3 py-2 font-mono text-[11px] text-slate-700 dark:text-gray-300 whitespace-pre-wrap">
                    {ex.output}
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Exercises */}
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 mb-3">
              <BookOpen size={14} className="text-amber-500" />
              <span className="text-[13px] font-semibold text-slate-700 dark:text-gray-300">
                Exercises
              </span>
            </div>

            <div className="space-y-4">
              {topic.exercises.map((exercise, eIdx) => {
                const k = exKey(eIdx);
                const val = inputs[k] ?? '';
                const res = results[k] ?? null;
                const hintShown = showHints[k] ?? false;

                return (
                  <div
                    key={eIdx}
                    className="border border-slate-200 dark:border-gray-800 rounded-lg bg-white dark:bg-gray-900/60 overflow-hidden"
                  >
                    <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 dark:bg-gray-800/40 border-b border-slate-200 dark:border-gray-800">
                      <span className="text-[11px] font-medium text-slate-400 dark:text-gray-500">
                        {eIdx + 1}/{topic.exercises.length}
                      </span>
                      <span className="text-[13px] text-slate-700 dark:text-gray-300">
                        {exercise.question}
                      </span>
                      {res === true && <Check size={12} className="text-emerald-500 ml-auto" />}
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
                              const v = e.target.value;
                              setInputs((p) => ({ ...p, [k]: v }));
                              if (res !== null) setResults((p) => ({ ...p, [k]: null }));
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
                                  : 'border-slate-300 dark:border-gray-700 focus:border-orange-400 dark:focus:border-orange-500'
                            }`}
                          />
                          {res === true && (
                            <Check size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-emerald-500" />
                          )}
                          {res === false && (
                            <X size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-red-500" />
                          )}
                        </div>

                        <button
                          onClick={() => handleCheck(eIdx)}
                          disabled={!val.trim()}
                          className="flex items-center gap-1.5 px-3 py-2 text-[12px] font-medium rounded-md bg-orange-600 text-white hover:bg-orange-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                          <ChevronRight size={12} />
                          Check
                        </button>

                        <button
                          onClick={() => handleReset(eIdx)}
                          className="flex items-center gap-1.5 px-3 py-2 text-[12px] font-medium rounded-md border border-slate-300 dark:border-gray-700 text-slate-600 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-gray-800 transition-colors"
                        >
                          <RotateCcw size={12} />
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
                              Not quite. Try again or view the hint.
                            </span>
                          </div>
                          {!hintShown && (
                            <button
                              onClick={() => setShowHints((p) => ({ ...p, [k]: true }))}
                              className="text-[12px] text-orange-600 dark:text-orange-400 hover:underline"
                            >
                              Show hint
                            </button>
                          )}
                        </div>
                      )}

                      {hintShown && (
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
          </div>
        </main>
      </div>
    </div>
  );
};
