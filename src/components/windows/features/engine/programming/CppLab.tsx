import React, { useState } from 'react';
import { BookOpen, Code, ChevronRight, Check, X, RotateCcw } from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────────────────────────
type TokenType = 'keyword' | 'string' | 'comment' | 'number' | 'type' | 'plain';
interface CodeToken { text: string; type: TokenType }
interface CodeExample { code: string; output: string; label: string }
interface Exercise { prompt: string; blanks: { id: string; answer: string }[]; template: string }
interface Topic {
  id: string;
  title: string;
  explanation: string;
  examples: CodeExample[];
  exercises: Exercise[];
}

// ─── Syntax Highlighting ────────────────────────────────────────────────────────
const KW = new Set([
  'auto','break','case','catch','class','const','constexpr','consteval','continue',
  'co_await','co_return','co_yield','concept','default','delete','do','else','enum',
  'explicit','export','extern','final','for','friend','goto','if','inline','mutable',
  'namespace','new','noexcept','operator','override','private','protected','public',
  'requires','return','sizeof','static','static_assert','struct','switch','template',
  'this','throw','try','typedef','typeid','typename','using','virtual','void','volatile',
  'while','nullptr','true','false','include','define','pragma',
]);
const TY = new Set([
  'int','float','double','char','bool','long','short','unsigned','signed','string',
  'vector','map','array','unique_ptr','shared_ptr','weak_ptr','size_t','cout','cin',
  'endl','pair','set','unordered_map','unordered_set','deque','list','stack','queue',
  'priority_queue','ostream','ofstream','ifstream','mutex','optional','variant','any',
  'string_view','tuple','function','wchar_t','int8_t','int16_t','int32_t','int64_t',
  'uint8_t','uint16_t','uint32_t','uint64_t','nullptr_t','ptrdiff_t','byte',
]);
const TC: Record<TokenType, string> = {
  keyword: 'text-blue-400', string: 'text-green-400', comment: 'text-gray-500 italic',
  number: 'text-orange-400', type: 'text-purple-400', plain: 'text-gray-200',
};

function tokenize(code: string): CodeToken[] {
  const t: CodeToken[] = [];
  let i = 0;
  while (i < code.length) {
    if (code[i] === '/' && code[i + 1] === '/') {
      let e = code.indexOf('\n', i); if (e === -1) e = code.length;
      t.push({ text: code.slice(i, e), type: 'comment' }); i = e; continue;
    }
    if (code[i] === '/' && code[i + 1] === '*') {
      let e = code.indexOf('*/', i + 2); if (e === -1) e = code.length; else e += 2;
      t.push({ text: code.slice(i, e), type: 'comment' }); i = e; continue;
    }
    if (code[i] === '"' || code[i] === "'") {
      const q = code[i]; let j = i + 1;
      while (j < code.length && code[j] !== q) { if (code[j] === '\\') j++; j++; }
      t.push({ text: code.slice(i, j + 1), type: 'string' }); i = j + 1; continue;
    }
    if (code[i] === '#') {
      let j = i + 1;
      while (j < code.length && /[a-zA-Z_]/.test(code[j])) j++;
      t.push({ text: code.slice(i, j), type: 'keyword' }); i = j; continue;
    }
    if (/[0-9]/.test(code[i]) && (i === 0 || !/[a-zA-Z_]/.test(code[i - 1]))) {
      let j = i;
      while (j < code.length && /[0-9.xXa-fA-FuUlLbB'_]/.test(code[j])) j++;
      if (j < code.length && code[j] === 'f') j++;
      t.push({ text: code.slice(i, j), type: 'number' }); i = j; continue;
    }
    if (/[a-zA-Z_]/.test(code[i])) {
      let j = i;
      while (j < code.length && /[a-zA-Z0-9_]/.test(code[j])) j++;
      const w = code.slice(i, j);
      t.push({ text: w, type: KW.has(w) ? 'keyword' : TY.has(w) ? 'type' : 'plain' });
      i = j; continue;
    }
    if (code[i] === '<' && t.length > 0 && t[t.length - 1].text === 'include') {
      const j = code.indexOf('>', i);
      if (j !== -1) { t.push({ text: code.slice(i, j + 1), type: 'string' }); i = j + 1; continue; }
    }
    t.push({ text: code[i], type: 'plain' }); i++;
  }
  return t;
}

// ─── Topic Data ─────────────────────────────────────────────────────────────────
const TOPICS: Topic[] = [
  // ── 1. Introduction ───────────────────────────────────────────────────────────
  {
    id: 'introduction', title: 'Introduction',
    explanation: 'C++ is a statically-typed, compiled language created by Bjarne Stroustrup in 1979 as an extension of C. It powers game engines (Unreal), operating systems (Windows kernel), high-frequency trading systems, embedded firmware, browsers (Chrome), and databases (MySQL). Code compiles to native machine code via g++, clang++, or MSVC, delivering maximum performance with zero-cost abstractions. C++ supports procedural, object-oriented, generic, and functional paradigms. The language uses namespaces to organize code, with std:: being the standard library namespace.',
    examples: [
      {
        label: 'Hello World',
        code: `#include <iostream>
using namespace std;

int main() {
    cout << "Hello, C++!" << endl;
    cout << "Compiled & blazing fast." << endl;
    return 0;  // 0 = success
}`,
        output: 'Hello, C++!\nCompiled & blazing fast.',
      },
      {
        label: 'Namespaces & Compilation',
        code: `#include <iostream>
// Compile: g++ -std=c++20 -O2 main.cpp -o main

namespace math {
    int add(int a, int b) { return a + b; }
    int mul(int a, int b) { return a * b; }
}

namespace io {
    void print(int val) {
        std::cout << "Result: " << val << std::endl;
    }
}

int main() {
    io::print(math::add(3, 7));
    io::print(math::mul(4, 5));
    return 0;
}`,
        output: 'Result: 10\nResult: 20',
      },
    ],
    exercises: [
      { prompt: 'Complete the output statement to print "Welcome"', blanks: [{ id: 'i1', answer: 'cout' }], template: '___ << "Welcome" << endl;' },
      { prompt: 'Access function foo inside namespace bar', blanks: [{ id: 'i2', answer: '::' }], template: 'bar___foo();' },
    ],
  },
  // ── 2. Variables & Types ──────────────────────────────────────────────────────
  {
    id: 'variables', title: 'Variables & Types',
    explanation: 'C++ is statically typed: every variable has a fixed type at compile time. Fundamental types include int (integers), double (floating point), char (single character), bool (true/false), and std::string (text). Use auto for type inference when the type is obvious from the initializer. const makes a variable immutable; constexpr ensures compile-time evaluation. size_t is an unsigned integer type for sizes and indices. References (&) create aliases to existing variables -- they cannot be null or reseated.',
    examples: [
      {
        label: 'Fundamental types and const',
        code: `#include <iostream>
#include <string>
using namespace std;

int main() {
    int age = 25;
    double pi = 3.14159;
    char grade = 'A';
    bool active = true;
    string name = "Alice";
    const int MAX = 100;
    constexpr double TAU = 6.28318;
    size_t idx = 0;

    cout << name << ", age " << age << endl;
    cout << "pi=" << pi << " grade=" << grade << endl;
    cout << "active=" << active << " MAX=" << MAX << endl;
    cout << "TAU=" << TAU << " idx=" << idx << endl;
    return 0;
}`,
        output: 'Alice, age 25\npi=3.14159 grade=A\nactive=1 MAX=100\nTAU=6.28318 idx=0',
      },
      {
        label: 'Auto, references, and type inference',
        code: `#include <iostream>
#include <string>
using namespace std;

int main() {
    auto x = 42;           // int
    auto y = 3.14;         // double
    auto s = string("Hi"); // std::string
    auto flag = true;      // bool

    int val = 10;
    int& ref = val;   // reference (alias)
    ref = 20;          // modifies val
    cout << "val=" << val << endl;

    const int& cref = val; // read-only reference
    cout << "cref=" << cref << endl;
    // cref = 30;  // ERROR: const reference

    int* ptr = &val;       // pointer
    cout << "ptr=" << *ptr << endl;
    return 0;
}`,
        output: 'val=20\ncref=20\nptr=20',
      },
      {
        label: 'constexpr and compile-time evaluation',
        code: `#include <iostream>
using namespace std;

constexpr int factorial(int n) {
    return n <= 1 ? 1 : n * factorial(n - 1);
}

constexpr int square(int x) { return x * x; }

int main() {
    constexpr int f5 = factorial(5);
    constexpr int s9 = square(9);
    static_assert(f5 == 120, "factorial check");
    cout << "5! = " << f5 << endl;
    cout << "9^2 = " << s9 << endl;
    return 0;
}`,
        output: '5! = 120\n9^2 = 81',
      },
    ],
    exercises: [
      { prompt: 'Declare a reference to variable x', blanks: [{ id: 'v1', answer: '&' }], template: 'int x = 10;\nint___ ref = x;' },
      { prompt: 'Make a compile-time constant equal to 42', blanks: [{ id: 'v2', answer: 'constexpr' }], template: '___ int ANSWER = 42;' },
    ],
  },
  // ── 3. Operators & I/O ────────────────────────────────────────────────────────
  {
    id: 'operators', title: 'Operators & I/O',
    explanation: 'C++ uses cin/cout with the extraction (>>) and insertion (<<) operators for console I/O. getline reads an entire line including spaces. Arithmetic operators: +, -, *, /, % (modulo). Comparison: ==, !=, <, >, <=, >=. Logical: && (and), || (or), ! (not). Bitwise: & (AND), | (OR), ^ (XOR), ~ (NOT), << (left shift), >> (right shift). C++ allows operator overloading so user-defined types can use +, ==, <<, etc. naturally.',
    examples: [
      {
        label: 'Console I/O with cin and cout',
        code: `#include <iostream>
#include <string>
using namespace std;

int main() {
    // Output with cout
    int a = 10, b = 3;
    cout << "Sum: " << (a + b) << endl;
    cout << "Div: " << (a / b) << endl;   // integer division
    cout << "Mod: " << (a % b) << endl;

    // getline for full-line input
    string line = "Hello World";
    cout << "Line: " << line << endl;
    cout << "Length: " << line.length() << endl;

    // Boolean logic
    bool x = true, y = false;
    cout << "AND: " << (x && y) << endl;
    cout << "OR: " << (x || y) << endl;
    cout << "NOT: " << (!x) << endl;
    return 0;
}`,
        output: 'Sum: 13\nDiv: 3\nMod: 1\nLine: Hello World\nLength: 11\nAND: 0\nOR: 1\nNOT: 0',
      },
      {
        label: 'Bitwise and shift operators',
        code: `#include <iostream>
using namespace std;

int main() {
    int a = 0b1010;  // 10
    int b = 0b1100;  // 12

    cout << "AND: " << (a & b) << endl;   // 8  (1000)
    cout << "OR:  " << (a | b) << endl;   // 14 (1110)
    cout << "XOR: " << (a ^ b) << endl;   // 6  (0110)
    cout << "NOT: " << (~a & 0xF) << endl; // 5 (0101)

    int x = 1;
    cout << "1 << 3 = " << (x << 3) << endl; // 8
    cout << "16 >> 2 = " << (16 >> 2) << endl; // 4
    return 0;
}`,
        output: 'AND: 8\nOR:  14\nXOR: 6\nNOT: 5\n1 << 3 = 8\n16 >> 2 = 4',
      },
      {
        label: 'Operator overloading basics',
        code: `#include <iostream>
using namespace std;

struct Vec2 {
    double x, y;
    Vec2 operator+(const Vec2& o) const {
        return {x + o.x, y + o.y};
    }
    bool operator==(const Vec2& o) const {
        return x == o.x && y == o.y;
    }
};
ostream& operator<<(ostream& os, const Vec2& v) {
    return os << "(" << v.x << ", " << v.y << ")";
}

int main() {
    Vec2 a{1.0, 2.0}, b{3.0, 4.0};
    Vec2 c = a + b;
    cout << a << " + " << b << " = " << c << endl;
    cout << "Equal? " << (a == b) << endl;
    return 0;
}`,
        output: '(1, 2) + (3, 4) = (4, 6)\nEqual? 0',
      },
    ],
    exercises: [
      { prompt: 'Read a full line of input into string s', blanks: [{ id: 'o1', answer: 'getline' }], template: 'string s;\n___(cin, s);' },
      { prompt: 'Complete the left shift: multiply x by 8', blanks: [{ id: 'o2', answer: '3' }], template: 'int result = x << ___;' },
    ],
  },
  // ── 4. Control Flow ───────────────────────────────────────────────────────────
  {
    id: 'control-flow', title: 'Control Flow',
    explanation: 'C++ provides if/else for branching, switch/case for multi-way selection, for/while/do-while for loops. Range-based for (C++11) iterates cleanly over containers and arrays. break exits a loop, continue skips to the next iteration. C++17 added structured bindings (auto [a,b] = pair) for clean destructuring and if-with-initializer (if (auto x = expr; condition)).',
    examples: [
      {
        label: 'If/else, switch, and loops',
        code: `#include <iostream>
#include <vector>
using namespace std;

int main() {
    // If-else chain
    int score = 85;
    if (score >= 90) cout << "A" << endl;
    else if (score >= 80) cout << "B" << endl;
    else cout << "C" << endl;

    // Switch with fall-through warning
    int day = 3;
    switch (day) {
        case 1: cout << "Mon" << endl; break;
        case 2: cout << "Tue" << endl; break;
        case 3: cout << "Wed" << endl; break;
        default: cout << "Other" << endl;
    }

    // While loop
    int n = 5;
    while (n > 0) { cout << n-- << " "; }
    cout << endl;

    // Do-while (runs at least once)
    int x = 0;
    do { cout << x << " "; x += 2; } while (x < 6);
    cout << endl;
    return 0;
}`,
        output: 'B\nWed\n5 4 3 2 1 \n0 2 4 ',
      },
      {
        label: 'Range-based for and break/continue',
        code: `#include <iostream>
#include <vector>
using namespace std;

int main() {
    vector<int> nums = {1, 2, 3, 4, 5, 6, 7, 8};

    // Range-based for with continue
    for (const auto& n : nums) {
        if (n % 2 == 0) continue; // skip even
        cout << n << " ";
    }
    cout << endl;

    // Break on condition
    for (int i = 0; i < 100; i++) {
        if (i * i > 50) { cout << "Stop at " << i << endl; break; }
    }

    // Nested loop with labeled break pattern
    bool found = false;
    for (int i = 0; i < 3 && !found; i++) {
        for (int j = 0; j < 3; j++) {
            if (i + j == 3) {
                cout << "Found: " << i << "," << j << endl;
                found = true; break;
            }
        }
    }
    return 0;
}`,
        output: '1 3 5 7 \nStop at 8\nFound: 1,2',
      },
      {
        label: 'Structured bindings (C++17)',
        code: `#include <iostream>
#include <map>
#include <tuple>
using namespace std;

tuple<int, string, bool> getUser() {
    return {42, "Alice", true};
}

int main() {
    // Structured binding with tuple
    auto [id, name, active] = getUser();
    cout << id << " " << name << " " << active << endl;

    // With map iteration
    map<string, int> scores = {{"Math", 95}, {"CS", 88}};
    for (const auto& [subject, score] : scores) {
        cout << subject << ": " << score << endl;
    }

    // If with initializer (C++17)
    if (auto val = 42; val > 0) {
        cout << "Positive: " << val << endl;
    }
    return 0;
}`,
        output: '42 Alice 1\nCS: 88\nMath: 95\nPositive: 42',
      },
    ],
    exercises: [
      { prompt: 'Write a range-based for over vector items', blanks: [{ id: 'cf1', answer: 'auto' }], template: 'for (const ___& item : items) {\n    cout << item << endl;\n}' },
      { prompt: 'Destructure a pair into key and value', blanks: [{ id: 'cf2', answer: 'auto' }], template: '___ [key, value] = make_pair(1, "hello");' },
    ],
  },
  // ── 5. Arrays & Strings ───────────────────────────────────────────────────────
  {
    id: 'arrays-strings', title: 'Arrays & Strings',
    explanation: 'C-style arrays (int arr[5]) are fixed-size with no bounds checking. std::array<T,N> is a safer fixed-size wrapper with .size(), .at() (bounds checked), and iterator support. std::string manages dynamic text with methods like find(), substr(), length(), c_str(), append(), and rfind(). C++17 added std::string_view as a non-owning, lightweight view into string data -- perfect for function parameters to avoid unnecessary copies.',
    examples: [
      {
        label: 'C-style arrays vs std::array',
        code: `#include <iostream>
#include <array>
using namespace std;

int main() {
    // C-style array (dangerous, no bounds check)
    int raw[5] = {10, 20, 30, 40, 50};
    cout << "raw[2]=" << raw[2] << endl;

    // std::array (safe, knows its size)
    array<int, 4> arr = {1, 2, 3, 4};
    cout << "Size: " << arr.size() << endl;
    cout << "at(1): " << arr.at(1) << endl;
    cout << "front: " << arr.front() << endl;
    cout << "back: " << arr.back() << endl;

    // Iterate
    for (const auto& v : arr) cout << v << " ";
    cout << endl;

    // Fill
    arr.fill(0);
    cout << "After fill: " << arr[0] << endl;
    return 0;
}`,
        output: 'raw[2]=30\nSize: 4\nat(1): 2\nfront: 1\nback: 4\n1 2 3 4 \nAfter fill: 0',
      },
      {
        label: 'std::string methods',
        code: `#include <iostream>
#include <string>
using namespace std;

int main() {
    string s = "Hello, World!";
    cout << "Length: " << s.length() << endl;
    cout << "Substr: " << s.substr(7, 5) << endl;

    size_t pos = s.find("World");
    if (pos != string::npos)
        cout << "Found at: " << pos << endl;

    s.append(" C++");
    cout << "Append: " << s << endl;

    // Replace
    string t = "foo bar foo";
    t.replace(t.find("foo"), 3, "baz");
    cout << "Replace: " << t << endl;

    // c_str for C interop
    const char* cstr = s.c_str();
    cout << "C-str: " << cstr << endl;

    // Comparison
    cout << "Equal: " << ("abc" == string("abc")) << endl;
    return 0;
}`,
        output: 'Length: 13\nSubstr: World\nFound at: 7\nAppend: Hello, World! C++\nReplace: baz bar foo\nC-str: Hello, World! C++\nEqual: 1',
      },
      {
        label: 'std::string_view (C++17)',
        code: `#include <iostream>
#include <string>
#include <string_view>
using namespace std;

// No copy -- just a view into existing data
void greet(string_view name) {
    cout << "Hello, " << name << "!" << endl;
    cout << "Length: " << name.length() << endl;
    cout << "First: " << name.front() << endl;
    cout << "Sub: " << name.substr(0, 3) << endl;
}

int main() {
    string s = "Alice";
    greet(s);             // from std::string
    greet("Bob");         // from string literal
    greet(string_view("Charlie").substr(0, 4));
    return 0;
}`,
        output: 'Hello, Alice!\nLength: 5\nFirst: A\nSub: Ali\nHello, Bob!\nLength: 3\nFirst: B\nSub: Bob\nHello, Char!\nLength: 4\nFirst: C\nSub: Cha',
      },
    ],
    exercises: [
      { prompt: 'Get position of "world" in string s', blanks: [{ id: 'as1', answer: 'find' }], template: 'size_t pos = s.___(\"world\");' },
      { prompt: 'Get a substring of 5 chars starting at index 3', blanks: [{ id: 'as2', answer: 'substr' }], template: 'string part = s.___(3, 5);' },
    ],
  },
  // ── 6. Functions ──────────────────────────────────────────────────────────────
  {
    id: 'functions', title: 'Functions',
    explanation: 'C++ functions can pass arguments by value (copy), by reference (&, modifies original), or by pointer (* , address). const T& is the preferred way to pass read-only data without copying. Function overloading allows same-name functions with different parameter types. Default arguments fill in from the right. inline hints the compiler to expand at the call site. constexpr functions evaluate at compile time. Function pointers and std::function enable callbacks and higher-order programming.',
    examples: [
      {
        label: 'Pass by value, reference, pointer',
        code: `#include <iostream>
#include <string>
using namespace std;

void byValue(int x) { x = 99; }     // copy
void byRef(int& x) { x = 99; }      // alias
void byPtr(int* x) { *x = 99; }     // address
void print(const string& s) {       // read-only ref
    cout << s << endl;
}

int add(int a, int b = 10) { return a + b; }
int add(double a, double b) { return a + b; }

int main() {
    int a = 1; byValue(a); cout << "val: " << a << endl;
    int b = 1; byRef(b);   cout << "ref: " << b << endl;
    int c = 1; byPtr(&c);  cout << "ptr: " << c << endl;
    print("Hello!");
    cout << "default: " << add(5) << endl;
    cout << "overload: " << add(1.5, 2.5) << endl;
    return 0;
}`,
        output: 'val: 1\nref: 99\nptr: 99\nHello!\ndefault: 15\noverload: 4',
      },
      {
        label: 'constexpr and inline functions',
        code: `#include <iostream>
using namespace std;

inline int square(int x) { return x * x; }

constexpr int fib(int n) {
    if (n <= 1) return n;
    return fib(n - 1) + fib(n - 2);
}

constexpr int power(int base, int exp) {
    int result = 1;
    for (int i = 0; i < exp; i++) result *= base;
    return result;
}

int main() {
    cout << "square(7)=" << square(7) << endl;
    constexpr int f10 = fib(10);
    cout << "fib(10)=" << f10 << endl;
    constexpr int p = power(2, 10);
    cout << "2^10=" << p << endl;
    static_assert(fib(10) == 55);
    return 0;
}`,
        output: 'square(7)=49\nfib(10)=55\n2^10=1024',
      },
      {
        label: 'Function pointers and std::function',
        code: `#include <iostream>
#include <functional>
#include <vector>
using namespace std;

int add(int a, int b) { return a + b; }
int mul(int a, int b) { return a * b; }

void apply(int a, int b, int (*op)(int, int)) {
    cout << "Result: " << op(a, b) << endl;
}

int main() {
    // Function pointer
    apply(3, 4, add);
    apply(3, 4, mul);

    // std::function with lambdas
    function<int(int,int)> sub = [](int a, int b) {
        return a - b;
    };
    cout << "Sub: " << sub(10, 3) << endl;

    // Store in vector
    vector<function<int(int)>> ops = {
        [](int x) { return x * 2; },
        [](int x) { return x + 10; },
        [](int x) { return x * x; },
    };
    for (auto& fn : ops) cout << fn(5) << " ";
    cout << endl;
    return 0;
}`,
        output: 'Result: 7\nResult: 12\nSub: 7\n10 15 25 ',
      },
    ],
    exercises: [
      { prompt: 'Complete a function taking a string by const reference', blanks: [{ id: 'f1', answer: 'const' }], template: 'void print(___ string& msg) {\n    cout << msg << endl;\n}' },
      { prompt: 'Declare a std::function holding an int->int lambda', blanks: [{ id: 'f2', answer: 'function' }], template: 'std::___<int(int)> fn = [](int x) { return x * 2; };' },
    ],
  },
  // ── 7. OOP ────────────────────────────────────────────────────────────────────
  {
    id: 'oop', title: 'OOP',
    explanation: 'Classes bundle data and behavior behind access specifiers: public (anyone), private (class only), protected (class + derived). Structs default to public, classes to private. Constructors initialize objects: default, parameterized, copy (T(const T&)), and move (T(T&&)). Destructors (~T) clean up resources. Member initializer lists are preferred for construction. The this pointer refers to the current instance. Friend functions/classes bypass access restrictions.',
    examples: [
      {
        label: 'Class basics and access specifiers',
        code: `#include <iostream>
#include <string>
using namespace std;

class BankAccount {
private:
    string owner;
    double balance;
public:
    // Parameterized constructor with init list
    BankAccount(const string& o, double b)
        : owner(o), balance(b) {}

    // Default constructor
    BankAccount() : owner("Unknown"), balance(0) {}

    void deposit(double amt) {
        if (amt > 0) balance += amt;
    }
    bool withdraw(double amt) {
        if (amt > 0 && amt <= balance) {
            balance -= amt; return true;
        }
        return false;
    }
    void print() const {
        cout << owner << ": $" << balance << endl;
    }
};

int main() {
    BankAccount acc("Alice", 1000);
    acc.deposit(500);
    acc.withdraw(200);
    acc.print();

    BankAccount def;
    def.print();
    return 0;
}`,
        output: 'Alice: $1300\nUnknown: $0',
      },
      {
        label: 'Copy, move constructors, and destructor',
        code: `#include <iostream>
#include <string>
using namespace std;

class Resource {
    string name;
    int* data;
public:
    Resource(const string& n, int v)
        : name(n), data(new int(v)) {
        cout << name << " constructed" << endl;
    }
    // Copy constructor (deep copy)
    Resource(const Resource& o)
        : name(o.name + "_copy"), data(new int(*o.data)) {
        cout << name << " copied" << endl;
    }
    // Move constructor (steal resources)
    Resource(Resource&& o) noexcept
        : name(std::move(o.name)), data(o.data) {
        o.data = nullptr;
        cout << name << " moved" << endl;
    }
    ~Resource() {
        delete data;
        cout << name << " destroyed" << endl;
    }
    int value() const { return data ? *data : -1; }
};

int main() {
    Resource a("A", 42);
    Resource b(a);              // copy
    Resource c(std::move(a));   // move
    cout << "b=" << b.value() << " c=" << c.value() << endl;
    return 0;
}`,
        output: 'A constructed\nA_copy copied\nA moved\nb=42 c=42\nA destroyed\nA_copy destroyed\n destroyed',
      },
      {
        label: 'Friend functions and this pointer',
        code: `#include <iostream>
using namespace std;

class Point {
    double x, y;
public:
    Point(double x, double y) : x(x), y(y) {}

    // this pointer to return self
    Point& scale(double factor) {
        this->x *= factor;
        this->y *= factor;
        return *this;  // return self for chaining
    }

    // Friend function can access private members
    friend ostream& operator<<(ostream& os, const Point& p);
    friend double distance(const Point& a, const Point& b);
};

ostream& operator<<(ostream& os, const Point& p) {
    return os << "(" << p.x << ", " << p.y << ")";
}
double distance(const Point& a, const Point& b) {
    double dx = a.x - b.x, dy = a.y - b.y;
    return sqrt(dx*dx + dy*dy);
}

int main() {
    Point p(3, 4);
    p.scale(2).scale(0.5); // chaining
    cout << p << endl;
    cout << "dist=" << distance(Point(0,0), Point(3,4)) << endl;
    return 0;
}`,
        output: '(3, 4)\ndist=5',
      },
    ],
    exercises: [
      { prompt: 'Complete the constructor initializer list for member name', blanks: [{ id: 'oop1', answer: 'name' }], template: 'class Person {\n    string name;\npublic:\n    Person(const string& n) : ___(n) {}\n};' },
      { prompt: 'Return a reference to the current object for chaining', blanks: [{ id: 'oop2', answer: 'this' }], template: 'MyClass& setVal(int v) {\n    value = v;\n    return *___;\n}' },
    ],
  },
  // ── 8. Inheritance & Polymorphism ─────────────────────────────────────────────
  {
    id: 'inheritance', title: 'Inheritance & Polymorphism',
    explanation: 'Inheritance lets a derived class extend a base class, inheriting its interface and implementation. Virtual functions enable runtime polymorphism -- a base pointer calls the correct derived override. Pure virtual functions (= 0) make a class abstract (cannot instantiate). Use override to catch mistakes, final to prevent further overriding. Multiple inheritance is supported but use carefully. dynamic_cast safely downcasts in a type hierarchy with RTTI (run-time type information).',
    examples: [
      {
        label: 'Virtual functions and abstract classes',
        code: `#include <iostream>
#include <string>
#include <vector>
#include <memory>
using namespace std;

class Shape {
public:
    virtual double area() const = 0;    // pure virtual
    virtual string name() const = 0;
    virtual ~Shape() = default;
};

class Circle : public Shape {
    double r;
public:
    Circle(double r) : r(r) {}
    double area() const override { return 3.14159 * r * r; }
    string name() const override { return "Circle"; }
};

class Rect : public Shape {
    double w, h;
public:
    Rect(double w, double h) : w(w), h(h) {}
    double area() const override { return w * h; }
    string name() const override { return "Rect"; }
};

int main() {
    vector<unique_ptr<Shape>> shapes;
    shapes.push_back(make_unique<Circle>(5));
    shapes.push_back(make_unique<Rect>(4, 6));
    for (const auto& s : shapes)
        cout << s->name() << ": " << s->area() << endl;
    return 0;
}`,
        output: 'Circle: 78.5398\nRect: 24',
      },
      {
        label: 'Override, final, and multi-level inheritance',
        code: `#include <iostream>
using namespace std;

class Base {
public:
    virtual void speak() const { cout << "Base" << endl; }
    virtual void id() const { cout << "BaseID" << endl; }
    virtual ~Base() = default;
};

class Mid : public Base {
public:
    void speak() const override { cout << "Mid" << endl; }
    void id() const final { cout << "MidID" << endl; }
};

class Leaf : public Mid {
public:
    void speak() const override { cout << "Leaf" << endl; }
    // void id() const override {} // ERROR: id is final
};

int main() {
    Leaf l;
    Base* bp = &l;
    bp->speak();  // Leaf (polymorphic)
    bp->id();     // MidID (final in Mid)

    Mid m;
    Base& br = m;
    br.speak();   // Mid
    return 0;
}`,
        output: 'Leaf\nMidID\nMid',
      },
      {
        label: 'Multiple inheritance and dynamic_cast',
        code: `#include <iostream>
using namespace std;

class Printable {
public:
    virtual void print() const = 0;
    virtual ~Printable() = default;
};
class Saveable {
public:
    virtual void save() const = 0;
    virtual ~Saveable() = default;
};

class Document : public Printable, public Saveable {
    string title;
public:
    Document(const string& t) : title(t) {}
    void print() const override {
        cout << "Print: " << title << endl;
    }
    void save() const override {
        cout << "Save: " << title << endl;
    }
};

int main() {
    Document doc("Report");
    Printable* pp = &doc;
    pp->print();

    // dynamic_cast to check type at runtime
    if (auto* sp = dynamic_cast<Saveable*>(pp)) {
        sp->save();
        cout << "Cast succeeded" << endl;
    }
    return 0;
}`,
        output: 'Print: Report\nSave: Report\nCast succeeded',
      },
    ],
    exercises: [
      { prompt: 'Make function speak() a pure virtual function', blanks: [{ id: 'inh1', answer: '0' }], template: 'virtual void speak() const = ___;' },
      { prompt: 'Mark this override so compiler checks correctness', blanks: [{ id: 'inh2', answer: 'override' }], template: 'void draw() const ___ {\n    // derived implementation\n}' },
    ],
  },
  // ── 9. Templates ──────────────────────────────────────────────────────────────
  {
    id: 'templates', title: 'Templates',
    explanation: 'Templates enable generic programming -- write code once, use with any type. Function templates and class templates are the foundation of the STL. Template specialization provides custom behavior for specific types. Variadic templates (C++11) accept any number of type arguments. SFINAE (Substitution Failure Is Not An Error) enables compile-time type constraints. C++20 concepts replace SFINAE with readable syntax: template<Concept T> constrains T to types satisfying the concept.',
    examples: [
      {
        label: 'Function and class templates',
        code: `#include <iostream>
#include <string>
using namespace std;

template <typename T>
T maximum(T a, T b) { return (a > b) ? a : b; }

template <typename T, int N>
class Stack {
    T data[N];
    int top = -1;
public:
    bool push(const T& val) {
        if (top >= N - 1) return false;
        data[++top] = val; return true;
    }
    T pop() { return data[top--]; }
    bool empty() const { return top < 0; }
    int size() const { return top + 1; }
};

int main() {
    cout << maximum(10, 20) << endl;
    cout << maximum(3.14, 2.72) << endl;
    cout << maximum<string>("apple", "banana") << endl;

    Stack<int, 5> s;
    s.push(10); s.push(20); s.push(30);
    cout << "Size: " << s.size() << endl;
    cout << "Pop: " << s.pop() << endl;
    return 0;
}`,
        output: '20\n3.14\nbanana\nSize: 3\nPop: 30',
      },
      {
        label: 'Template specialization and variadic templates',
        code: `#include <iostream>
#include <string>
using namespace std;

// Primary template
template <typename T>
string typeName() { return "unknown"; }

// Specializations
template <> string typeName<int>() { return "int"; }
template <> string typeName<double>() { return "double"; }
template <> string typeName<string>() { return "string"; }

// Variadic template: print any number of args
template <typename T>
void print(const T& val) { cout << val << endl; }

template <typename T, typename... Args>
void print(const T& first, const Args&... rest) {
    cout << first << " ";
    print(rest...);
}

int main() {
    cout << typeName<int>() << endl;
    cout << typeName<double>() << endl;
    print(1, 2.5, "hello", true);
    print("a", "b", "c");
    return 0;
}`,
        output: 'int\ndouble\n1 2.5 hello 1\na b c',
      },
      {
        label: 'C++20 Concepts',
        code: `#include <iostream>
#include <concepts>
#include <string>
using namespace std;

// Define a concept
template <typename T>
concept Numeric = integral<T> || floating_point<T>;

// Constrained function
template <Numeric T>
T add(T a, T b) { return a + b; }

// Requires clause
template <typename T>
requires requires(T a, T b) { a + b; a < b; }
T clamp(T val, T lo, T hi) {
    if (val < lo) return lo;
    if (val > hi) return hi;
    return val;
}

int main() {
    cout << add(3, 4) << endl;
    cout << add(1.5, 2.5) << endl;
    // add("a", "b");  // ERROR: string not Numeric
    cout << clamp(15, 0, 10) << endl;
    cout << clamp(3.7, 1.0, 5.0) << endl;
    return 0;
}`,
        output: '7\n4\n10\n3.7',
      },
    ],
    exercises: [
      { prompt: 'Complete the template type parameter declaration', blanks: [{ id: 't1', answer: 'typename' }], template: 'template <___ T>\nT add(T a, T b) { return a + b; }' },
      { prompt: 'Specialize typeName for the bool type', blanks: [{ id: 't2', answer: 'bool' }], template: 'template <> string typeName<___>() {\n    return "bool";\n}' },
    ],
  },
  // ── 10. STL Containers ────────────────────────────────────────────────────────
  {
    id: 'stl', title: 'STL Containers',
    explanation: 'The Standard Template Library provides containers, algorithms, and iterators. Sequence containers: vector (dynamic array), deque (double-ended), list (doubly-linked). Associative: map/set (sorted, O(log n)), unordered_map/unordered_set (hash-based, O(1) average). Adapters: stack (LIFO), queue (FIFO), priority_queue (max-heap). Algorithms from <algorithm> and <numeric> operate on iterator ranges: sort, find, transform, accumulate, count_if, remove_if, and many more.',
    examples: [
      {
        label: 'Vector, map, set, and deque',
        code: `#include <iostream>
#include <vector>
#include <map>
#include <set>
#include <deque>
using namespace std;

int main() {
    // Vector
    vector<int> v = {5, 2, 8, 1};
    v.push_back(3);
    v.insert(v.begin(), 0);
    cout << "Vec size: " << v.size() << endl;

    // Map (sorted keys)
    map<string, int> m = {{"b", 2}, {"a", 1}, {"c", 3}};
    m["d"] = 4;
    for (const auto& [k, val] : m)
        cout << k << "=" << val << " ";
    cout << endl;

    // Set (unique, sorted)
    set<int> s = {3, 1, 4, 1, 5, 9, 2, 6};
    cout << "Set: ";
    for (int x : s) cout << x << " ";
    cout << endl;

    // Deque (double-ended)
    deque<string> d = {"mid"};
    d.push_front("front");
    d.push_back("back");
    cout << "Deque: " << d.front() << ".." << d.back() << endl;
    return 0;
}`,
        output: 'Vec size: 6\na=1 b=2 c=3 d=4 \nSet: 1 2 3 4 5 6 9 \nDeque: front..back',
      },
      {
        label: 'Stack, queue, and priority_queue',
        code: `#include <iostream>
#include <stack>
#include <queue>
using namespace std;

int main() {
    // Stack (LIFO)
    stack<int> st;
    st.push(10); st.push(20); st.push(30);
    cout << "Stack top: " << st.top() << endl;
    st.pop();
    cout << "After pop: " << st.top() << endl;

    // Queue (FIFO)
    queue<string> q;
    q.push("first"); q.push("second"); q.push("third");
    cout << "Queue front: " << q.front() << endl;
    q.pop();
    cout << "After pop: " << q.front() << endl;

    // Priority queue (max-heap by default)
    priority_queue<int> pq;
    pq.push(30); pq.push(10); pq.push(50); pq.push(20);
    cout << "PQ: ";
    while (!pq.empty()) {
        cout << pq.top() << " ";
        pq.pop();
    }
    cout << endl;
    return 0;
}`,
        output: 'Stack top: 30\nAfter pop: 20\nQueue front: first\nAfter pop: second\nPQ: 50 30 20 10 ',
      },
      {
        label: 'STL algorithms',
        code: `#include <iostream>
#include <vector>
#include <algorithm>
#include <numeric>
using namespace std;

int main() {
    vector<int> v = {5, 2, 8, 1, 9, 3, 7};

    sort(v.begin(), v.end());
    cout << "Sorted: ";
    for (int x : v) cout << x << " ";
    cout << endl;

    auto it = find(v.begin(), v.end(), 8);
    cout << "Found 8 at: " << (it - v.begin()) << endl;

    int sum = accumulate(v.begin(), v.end(), 0);
    cout << "Sum: " << sum << endl;

    int evens = count_if(v.begin(), v.end(),
                         [](int x) { return x % 2 == 0; });
    cout << "Evens: " << evens << endl;

    // Transform: double each element
    vector<int> doubled(v.size());
    transform(v.begin(), v.end(), doubled.begin(),
              [](int x) { return x * 2; });
    cout << "Doubled: ";
    for (int x : doubled) cout << x << " ";
    cout << endl;
    return 0;
}`,
        output: 'Sorted: 1 2 3 5 7 8 9 \nFound 8 at: 5\nSum: 35\nEvens: 2\nDoubled: 2 4 6 10 14 16 18 ',
      },
    ],
    exercises: [
      { prompt: 'Sort vector v in ascending order', blanks: [{ id: 'stl1', answer: 'sort' }], template: '___(v.begin(), v.end());' },
      { prompt: 'Sum all elements in vector v starting from 0', blanks: [{ id: 'stl2', answer: 'accumulate' }], template: 'int total = ___(v.begin(), v.end(), 0);' },
    ],
  },
  // ── 11. Smart Pointers & Memory ───────────────────────────────────────────────
  {
    id: 'smart-pointers', title: 'Smart Pointers & Memory',
    explanation: 'Raw new/delete is error-prone. Smart pointers (<memory>) automate lifetime management via RAII. unique_ptr has exclusive ownership -- non-copyable, only movable. shared_ptr uses reference counting for shared ownership. weak_ptr observes a shared_ptr without owning (breaks circular refs). Always prefer make_unique/make_shared over raw new. The Rule of Five: if you define any of destructor, copy constructor, copy assignment, move constructor, or move assignment, define all five. std::move casts an lvalue to an rvalue reference, enabling transfer of resources.',
    examples: [
      {
        label: 'unique_ptr and shared_ptr',
        code: `#include <iostream>
#include <memory>
#include <string>
using namespace std;

class Sensor {
    string name;
public:
    Sensor(const string& n) : name(n) {
        cout << name << " online" << endl;
    }
    ~Sensor() { cout << name << " offline" << endl; }
    void read() const { cout << name << ": 42.0" << endl; }
};

int main() {
    // unique_ptr: exclusive ownership
    auto u = make_unique<Sensor>("Temp");
    u->read();
    // auto u2 = u;  // ERROR: no copy
    auto u2 = std::move(u);  // OK: transfer
    u2->read();

    cout << "---" << endl;
    // shared_ptr: shared ownership
    auto s1 = make_shared<Sensor>("Pressure");
    {
        auto s2 = s1;  // ref count = 2
        cout << "refs: " << s1.use_count() << endl;
    }  // s2 dies, ref count = 1
    cout << "refs: " << s1.use_count() << endl;
    return 0;
}`,
        output: 'Temp online\nTemp: 42.0\nTemp: 42.0\n---\nPressure online\nrefs: 2\nrefs: 1\nPressure offline\nTemp offline',
      },
      {
        label: 'weak_ptr and breaking circular references',
        code: `#include <iostream>
#include <memory>
using namespace std;

struct Node {
    string name;
    shared_ptr<Node> next;
    weak_ptr<Node> prev;  // weak to avoid cycle
    Node(const string& n) : name(n) {
        cout << name << " created" << endl;
    }
    ~Node() { cout << name << " destroyed" << endl; }
};

int main() {
    auto a = make_shared<Node>("A");
    auto b = make_shared<Node>("B");
    a->next = b;
    b->prev = a;  // weak_ptr, no ref count bump

    cout << "a refs: " << a.use_count() << endl;
    cout << "b refs: " << b.use_count() << endl;

    // Lock weak_ptr to use it
    if (auto locked = b->prev.lock()) {
        cout << "B's prev: " << locked->name << endl;
    }
    return 0;
}`,
        output: 'A created\nB created\na refs: 1\nb refs: 2\nB\'s prev: A\nB destroyed\nA destroyed',
      },
      {
        label: 'Rule of Five and move semantics',
        code: `#include <iostream>
#include <cstring>
using namespace std;

class Buffer {
    char* data;
    size_t len;
public:
    // Constructor
    Buffer(const char* s) : len(strlen(s)) {
        data = new char[len + 1];
        strcpy(data, s);
    }
    // Destructor
    ~Buffer() { delete[] data; }
    // Copy constructor
    Buffer(const Buffer& o) : len(o.len) {
        data = new char[len + 1];
        strcpy(data, o.data);
    }
    // Copy assignment
    Buffer& operator=(const Buffer& o) {
        if (this != &o) {
            delete[] data;
            len = o.len;
            data = new char[len + 1];
            strcpy(data, o.data);
        }
        return *this;
    }
    // Move constructor
    Buffer(Buffer&& o) noexcept : data(o.data), len(o.len) {
        o.data = nullptr; o.len = 0;
    }
    // Move assignment
    Buffer& operator=(Buffer&& o) noexcept {
        if (this != &o) {
            delete[] data;
            data = o.data; len = o.len;
            o.data = nullptr; o.len = 0;
        }
        return *this;
    }
    void print() const {
        cout << (data ? data : "null") << " (" << len << ")" << endl;
    }
};

int main() {
    Buffer a("Hello");
    Buffer b(a);             // copy
    Buffer c(std::move(a));  // move
    a.print(); b.print(); c.print();
    return 0;
}`,
        output: 'null (0)\nHello (5)\nHello (5)',
      },
    ],
    exercises: [
      { prompt: 'Create a unique_ptr to an int with value 42', blanks: [{ id: 'sp1', answer: 'make_unique' }], template: 'auto ptr = std::___<int>(42);' },
      { prompt: 'Transfer ownership of unique_ptr u to u2', blanks: [{ id: 'sp2', answer: 'move' }], template: 'auto u2 = std::___(u);' },
    ],
  },
  // ── 12. Modern C++ ────────────────────────────────────────────────────────────
  {
    id: 'modern-cpp', title: 'Modern C++',
    explanation: 'Modern C++ (C++11 through C++23) introduced transformative features. Lambda expressions enable inline anonymous functions with capture lists. auto deduces types automatically. Structured bindings destructure aggregates. std::optional represents a value that may or may not exist. std::variant is a type-safe union. std::any holds any type. C++20 ranges provide composable, lazy view-based algorithms. Coroutines (C++20) enable suspendable functions for async programming and generators.',
    examples: [
      {
        label: 'Lambda expressions in depth',
        code: `#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;

int main() {
    // Basic lambda
    auto greet = [](const string& s) {
        cout << "Hello " << s << endl;
    };
    greet("World");

    // Capture by value and reference
    int factor = 3;
    int total = 0;
    auto calc = [factor, &total](int x) {
        total += x * factor;
        return x * factor;
    };
    cout << calc(5) << endl;  // 15
    cout << calc(2) << endl;  // 6
    cout << "total=" << total << endl;  // 21

    // Mutable lambda (modify captured-by-value)
    int counter = 0;
    auto inc = [counter]() mutable { return ++counter; };
    cout << inc() << " " << inc() << " " << inc() << endl;

    // Generic lambda (C++14)
    auto add = [](auto a, auto b) { return a + b; };
    cout << add(1, 2) << " " << add(1.5, 2.5) << endl;

    // STL with lambda
    vector<int> v = {5, 1, 4, 2, 3};
    sort(v.begin(), v.end(), [](int a, int b) {
        return a > b;  // descending
    });
    for (int x : v) cout << x << " ";
    cout << endl;
    return 0;
}`,
        output: 'Hello World\n15\n6\ntotal=21\n1 2 3\n3 4\n5 4 3 2 1 ',
      },
      {
        label: 'optional, variant, and any',
        code: `#include <iostream>
#include <optional>
#include <variant>
#include <any>
#include <string>
using namespace std;

// optional: value that might not exist
optional<int> divide(int a, int b) {
    if (b == 0) return nullopt;
    return a / b;
}

int main() {
    // std::optional
    auto r1 = divide(10, 3);
    auto r2 = divide(10, 0);
    cout << "10/3: " << r1.value_or(-1) << endl;
    cout << "10/0: " << r2.value_or(-1) << endl;
    if (r1.has_value()) cout << "Valid!" << endl;

    // std::variant (type-safe union)
    variant<int, double, string> v;
    v = 42;
    cout << "int: " << get<int>(v) << endl;
    v = 3.14;
    cout << "double: " << get<double>(v) << endl;
    v = "hello";
    cout << "string: " << get<string>(v) << endl;
    cout << "index: " << v.index() << endl;

    // std::any (holds anything)
    any a = 100;
    cout << "any: " << any_cast<int>(a) << endl;
    a = string("world");
    cout << "any: " << any_cast<string>(a) << endl;
    return 0;
}`,
        output: '10/3: 3\n10/0: -1\nValid!\nint: 42\ndouble: 3.14\nstring: hello\nindex: 2\nany: 100\nany: world',
      },
      {
        label: 'Ranges (C++20) and coroutine concepts',
        code: `#include <iostream>
#include <vector>
#include <ranges>
#include <algorithm>
using namespace std;

// Simplified generator concept (coroutine-like)
// Real coroutines need co_yield/co_return
struct FibGenerator {
    int a = 0, b = 1, count;
    FibGenerator(int n) : count(n) {}
    vector<int> generate() {
        vector<int> result;
        for (int i = 0; i < count; i++) {
            result.push_back(a);
            int next = a + b;
            a = b; b = next;
        }
        return result;
    }
};

int main() {
    vector<int> nums = {1,2,3,4,5,6,7,8,9,10};

    // Ranges: filter + transform (lazy, composable)
    auto result = nums
        | views::filter([](int x) { return x % 2 == 0; })
        | views::transform([](int x) { return x * x; });

    cout << "Even squares: ";
    for (int x : result) cout << x << " ";
    cout << endl;

    // Take and drop
    auto first3 = nums | views::take(3);
    cout << "First 3: ";
    for (int x : first3) cout << x << " ";
    cout << endl;

    // Fibonacci generator
    auto fibs = FibGenerator(8).generate();
    cout << "Fib: ";
    for (int x : fibs) cout << x << " ";
    cout << endl;
    return 0;
}`,
        output: 'Even squares: 4 16 36 64 100 \nFirst 3: 1 2 3 \nFib: 0 1 1 2 3 5 8 13 ',
      },
    ],
    exercises: [
      { prompt: 'Capture variable x by value in a lambda', blanks: [{ id: 'mc1', answer: 'x' }], template: 'int x = 5;\nauto fn = [___]() { return x * 2; };' },
      { prompt: 'Return nullopt when the value is missing', blanks: [{ id: 'mc2', answer: 'nullopt' }], template: 'optional<int> find(int id) {\n    if (id < 0) return ___;\n    return id * 10;\n}' },
    ],
  },
];

// ─── Component ──────────────────────────────────────────────────────────────────
export const CppLab: React.FC = () => {
  const [activeTopic, setActiveTopic] = useState(TOPICS[0].id);
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [results, setResults] = useState<Record<string, boolean | null>>({});
  const [activeExample, setActiveExample] = useState<Record<string, number>>({});

  const topic = TOPICS.find((t) => t.id === activeTopic)!;
  const exIdx = activeExample[activeTopic] ?? 0;
  const currentExample = topic.examples[Math.min(exIdx, topic.examples.length - 1)];

  const handleInput = (id: string, val: string) => {
    setInputs((p) => ({ ...p, [id]: val }));
    setResults((p) => ({ ...p, [id]: null }));
  };

  const checkExercise = (exercise: Exercise) => {
    const r: Record<string, boolean | null> = {};
    for (const b of exercise.blanks)
      r[b.id] = (inputs[b.id] ?? '').trim().toLowerCase() === b.answer.toLowerCase();
    setResults((p) => ({ ...p, ...r }));
  };

  const resetExercise = (exercise: Exercise) => {
    const ci: Record<string, string> = {};
    const cr: Record<string, boolean | null> = {};
    for (const b of exercise.blanks) { ci[b.id] = ''; cr[b.id] = null; }
    setInputs((p) => ({ ...p, ...ci }));
    setResults((p) => ({ ...p, ...cr }));
  };

  const isExerciseDone = (exercise: Exercise) =>
    exercise.blanks.every((b) => results[b.id] === true) &&
    exercise.blanks.some((b) => results[b.id] != null);

  const isTopicDone = (t: Topic) =>
    t.exercises.every((ex) => isExerciseDone(ex));

  const renderCode = (code: string) => (
    <pre className="bg-gray-950 rounded-lg p-3 overflow-x-auto font-mono text-[12px] leading-relaxed">
      <code>
        {tokenize(code).map((tk, i) => (
          <span key={i} className={TC[tk.type]}>{tk.text}</span>
        ))}
      </code>
    </pre>
  );

  const renderExercise = (exercise: Exercise, exIndex: number) => {
    const parts = exercise.template.split('___');
    const allCorrect = isExerciseDone(exercise);
    const hasAnyResult = exercise.blanks.some((b) => results[b.id] != null);

    return (
      <div key={exercise.prompt} className="bg-white dark:bg-gray-900/60 rounded-xl p-4 border border-gray-200 dark:border-gray-800 shadow-sm">
        <div className="flex items-start gap-2 mb-2">
          <ChevronRight size={16} className="text-orange-500 mt-0.5 flex-shrink-0" />
          <h3 className="text-sm font-semibold text-orange-600 dark:text-orange-400 uppercase tracking-wide">
            Exercise {exIndex + 1}
          </h3>
        </div>
        <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">{exercise.prompt}</p>
        <pre className="bg-gray-950 rounded-lg p-3 overflow-x-auto font-mono text-[12px] leading-relaxed whitespace-pre-wrap">
          <code className="text-gray-200">
            {parts.map((part, i) => (
              <React.Fragment key={i}>
                <span>{part}</span>
                {i < exercise.blanks.length && (() => {
                  const b = exercise.blanks[i];
                  const res = results[b.id];
                  const bc = res === true
                    ? 'border-green-500 bg-green-900/30'
                    : res === false
                    ? 'border-red-500 bg-red-900/30'
                    : 'border-indigo-500 bg-gray-800';
                  return (
                    <input
                      type="text"
                      value={inputs[b.id] ?? ''}
                      onChange={(e) => handleInput(b.id, e.target.value)}
                      className={`inline-block w-28 px-2 py-0.5 mx-0.5 rounded border-2 ${bc} text-white text-[12px] font-mono focus:outline-none focus:ring-1 focus:ring-indigo-400`}
                      placeholder="???"
                      spellCheck={false}
                    />
                  );
                })()}
              </React.Fragment>
            ))}
          </code>
        </pre>
        {hasAnyResult && (
          <div className={`mt-3 flex items-center gap-2 text-sm font-medium ${
            allCorrect ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
          }`}>
            {allCorrect
              ? <><Check size={16} /><span>Correct!</span></>
              : <><X size={16} /><span>Not quite -- try again.</span></>}
          </div>
        )}
        <div className="flex items-center gap-2 mt-3">
          <button onClick={() => checkExercise(exercise)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors">
            <Check size={13} />Check
          </button>
          <button onClick={() => resetExercise(exercise)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 transition-colors">
            <RotateCcw size={13} />Reset
          </button>
        </div>
      </div>
    );
  };

  const idx = TOPICS.findIndex((t) => t.id === activeTopic);
  const prev = idx > 0 ? TOPICS[idx - 1] : null;
  const next = idx < TOPICS.length - 1 ? TOPICS[idx + 1] : null;

  return (
    <div className="h-full flex flex-col overflow-hidden bg-gradient-to-br from-slate-50 to-indigo-50 dark:from-gray-950 dark:to-indigo-950/20">
      {/* Header */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-gray-200 dark:border-gray-800 bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-blue-100 dark:bg-blue-900/40 rounded-lg">
            <Code size={20} className="text-blue-600 dark:text-blue-400" />
          </div>
          <h1 className="text-lg font-bold text-gray-800 dark:text-gray-100">C++ Learning Lab</h1>
          <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 font-medium">
            {TOPICS.length} Topics
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 font-medium">
            {TOPICS.filter(isTopicDone).length}/{TOPICS.length} Complete
          </span>
        </div>
      </div>
      {/* Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div className="w-56 flex-shrink-0 overflow-y-auto border-r border-gray-200 dark:border-gray-800 bg-white/40 dark:bg-gray-900/40">
          <nav className="p-2 space-y-0.5">
            {TOPICS.map((t, ti) => {
              const active = t.id === activeTopic;
              const done = isTopicDone(t);
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveTopic(t.id)}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-sm transition-all duration-150 ${
                    active
                      ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 font-semibold'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/60'
                  }`}
                >
                  <span className="flex-shrink-0 w-5 h-5 flex items-center justify-center rounded text-[10px] font-bold bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                    {ti + 1}
                  </span>
                  <span className="truncate flex-1">{t.title}</span>
                  {done && <Check size={14} className="ml-auto flex-shrink-0 text-green-500" />}
                </button>
              );
            })}
          </nav>
        </div>
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Topic title */}
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl">
              <BookOpen size={18} className="text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">{topic.title}</h2>
              <p className="text-xs text-gray-500 dark:text-gray-500">
                Topic {idx + 1} of {TOPICS.length} &middot; {topic.examples.length} examples &middot; {topic.exercises.length} exercises
              </p>
            </div>
          </div>
          {/* Explanation */}
          <div className="bg-white dark:bg-gray-900/60 rounded-xl p-4 border border-gray-200 dark:border-gray-800 shadow-sm">
            <div className="flex items-start gap-2 mb-2">
              <BookOpen size={16} className="text-indigo-500 mt-0.5 flex-shrink-0" />
              <h3 className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide">Concept</h3>
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{topic.explanation}</p>
          </div>
          {/* Example selector tabs */}
          <div className="bg-white dark:bg-gray-900/60 rounded-xl p-4 border border-gray-200 dark:border-gray-800 shadow-sm">
            <div className="flex items-start gap-2 mb-3">
              <Code size={16} className="text-blue-500 mt-0.5 flex-shrink-0" />
              <h3 className="text-sm font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide">Code Examples</h3>
            </div>
            {topic.examples.length > 1 && (
              <div className="flex gap-1 mb-3 flex-wrap">
                {topic.examples.map((ex, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveExample((p) => ({ ...p, [activeTopic]: i }))}
                    className={`px-3 py-1 text-xs rounded-md font-medium transition-colors ${
                      i === exIdx
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    {ex.label}
                  </button>
                ))}
              </div>
            )}
            {topic.examples.length === 1 && (
              <p className="text-xs text-gray-500 dark:text-gray-500 mb-2">{currentExample.label}</p>
            )}
            {renderCode(currentExample.code)}
            {/* Output */}
            <div className="mt-3">
              <p className="text-xs font-semibold text-green-600 dark:text-green-400 uppercase tracking-wide mb-1.5">Output</p>
              <pre className="bg-gray-950 rounded-lg p-3 font-mono text-[12px] text-green-400 overflow-x-auto leading-relaxed whitespace-pre-wrap">
                {currentExample.output}
              </pre>
            </div>
          </div>
          {/* Exercises */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <ChevronRight size={16} className="text-orange-500" />
              <h3 className="text-sm font-semibold text-orange-600 dark:text-orange-400 uppercase tracking-wide">Practice Exercises</h3>
            </div>
            <div className="space-y-3">
              {topic.exercises.map((ex, i) => renderExercise(ex, i))}
            </div>
          </div>
          {/* Navigation */}
          <div className="flex items-center justify-between pt-2 pb-4">
            {prev ? (
              <button
                onClick={() => setActiveTopic(prev.id)}
                className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
              >
                <ChevronRight size={14} className="rotate-180" />
                {prev.title}
              </button>
            ) : <span />}
            <span className="text-xs text-gray-400 dark:text-gray-600">
              {idx + 1} / {TOPICS.length}
            </span>
            {next ? (
              <button
                onClick={() => setActiveTopic(next.id)}
                className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
              >
                {next.title}
                <ChevronRight size={14} />
              </button>
            ) : <span />}
          </div>
        </div>
      </div>
    </div>
  );
};
