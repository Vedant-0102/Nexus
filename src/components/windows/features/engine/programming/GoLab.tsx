import React, { useState } from 'react';
import {
  BookOpen,
  Code,
  ChevronRight,
  Check,
  X,
  RotateCcw,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Exercise {
  question: string;
  code: string;
  answer: string;
  hint: string;
}

interface CodeBlock {
  title: string;
  lines: string[];
  output?: string;
}

interface TopicData {
  title: string;
  icon: React.ReactNode;
  description: string;
  codeBlocks: CodeBlock[];
  exercises: Exercise[];
}

// ---------------------------------------------------------------------------
// Topic data  (12 topics, 2-3 code blocks each, 2 exercises each)
// ---------------------------------------------------------------------------

const topics: Record<string, TopicData> = {
  introduction: {
    title: 'Introduction',
    icon: <BookOpen size={14} />,
    description:
      'Go (Golang) was created at Google in 2009 by Robert Griesemer, Rob Pike, and Ken Thompson. It is a statically typed, compiled language designed for simplicity, reliability, and high performance. Go powers modern cloud infrastructure (Docker, Kubernetes, Terraform), backend services, CLI tools, and DevOps pipelines. Its fast compilation, built-in concurrency primitives, and minimal syntax make it ideal for systems programming at scale. Every Go program starts with package main and a main() function. Compile with go build, run directly with go run main.go. Simplicity is a core design principle -- there is intentionally only one way to write a loop, no class hierarchies, and no implicit type coercions.',
    codeBlocks: [
      {
        title: 'Hello World',
        lines: [
          'package main',
          '',
          'import "fmt"',
          '',
          'func main() {',
          '    fmt.Println("Hello, World!")',
          '    fmt.Println("Go is compiled & fast")',
          '}',
        ],
        output: 'Hello, World!\nGo is compiled & fast',
      },
      {
        title: 'Multiple Imports',
        lines: [
          'package main',
          '',
          'import (',
          '    "fmt"',
          '    "math"',
          '    "strings"',
          ')',
          '',
          'func main() {',
          '    fmt.Println("Pi:", math.Pi)',
          '    fmt.Println(strings.ToUpper("go"))',
          '    fmt.Println("2^10 =", math.Pow(2, 10))',
          '}',
        ],
        output: 'Pi: 3.141592653589793\nGO\n2^10 = 1024',
      },
      {
        title: 'Build & Run',
        lines: [
          '// Terminal commands:',
          '// go run main.go      -- compile + run',
          '// go build -o app     -- compile to binary',
          '// ./app               -- run the binary',
          '// go fmt ./...        -- format all files',
          '// go vet ./...        -- static analysis',
        ],
      },
    ],
    exercises: [
      {
        question: 'Complete the code to print "Hello" to the console.',
        code: 'func main() {\n    fmt.___("Hello")\n}',
        answer: 'Println',
        hint: 'The fmt function that prints a line ending with newline is Println',
      },
      {
        question: 'What keyword declares the entry-point function in Go?',
        code: 'package main\n\nfunc ___() {\n    fmt.Println("start")\n}',
        answer: 'main',
        hint: 'Every executable Go program needs a function named main',
      },
    ],
  },

  variables: {
    title: 'Variables & Types',
    icon: <Code size={14} />,
    description:
      'Go is statically typed with type inference. Primitive types include int, float64, string, bool, byte (alias for uint8), and rune (alias for int32 for Unicode). Use := for short variable declaration inside functions. Use var for package-level or explicit-type declarations. Constants are declared with const and can use iota for auto-incrementing enumerations. Every type has a zero value: 0 for numbers, "" for strings, false for bools, nil for pointers/slices/maps. Type conversions are always explicit -- Go never implicitly converts between types.',
    codeBlocks: [
      {
        title: 'Short Declaration & Types',
        lines: [
          'package main',
          '',
          'import "fmt"',
          '',
          'func main() {',
          '    // Short declaration (type inferred)',
          '    name := "Alice"',
          '    age := 30',
          '    pi := 3.14159',
          '    active := true',
          '    initial := \'A\'  // rune (int32)',
          '',
          '    fmt.Printf("name: %s (%T)\\n", name, name)',
          '    fmt.Printf("age: %d (%T)\\n", age, age)',
          '    fmt.Printf("pi: %.2f (%T)\\n", pi, pi)',
          '    fmt.Printf("active: %t\\n", active)',
          '    fmt.Printf("initial: %c (%d)\\n", initial, initial)',
          '}',
        ],
        output: 'name: Alice (string)\nage: 30 (int)\npi: 3.14 (float64)\nactive: true\ninitial: A (65)',
      },
      {
        title: 'var, const & iota',
        lines: [
          'package main',
          '',
          'import "fmt"',
          '',
          '// Package-level var',
          'var version string = "1.0.0"',
          '',
          '// Constants with iota',
          'const (',
          '    Sunday    = iota  // 0',
          '    Monday           // 1',
          '    Tuesday          // 2',
          '    Wednesday        // 3',
          ')',
          '',
          'func main() {',
          '    var count int        // zero value: 0',
          '    var label string     // zero value: ""',
          '    var ok bool          // zero value: false',
          '',
          '    fmt.Println(count, label, ok)',
          '    fmt.Println("Wednesday =", Wednesday)',
          '}',
        ],
        output: '0  false\nWednesday = 3',
      },
      {
        title: 'Type Conversion',
        lines: [
          'func main() {',
          '    x := 42',
          '    f := float64(x)        // int -> float64',
          '    s := string(rune(65))   // int -> rune -> string "A"',
          '',
          '    var b byte = 72',
          '    ch := rune(b)           // byte -> rune',
          '',
          '    fmt.Println(f, s, string(ch))',
          '    // No implicit conversion:',
          '    // var n int = 3.14  <-- compile error',
          '}',
        ],
        output: '42 A H',
      },
    ],
    exercises: [
      {
        question: 'Declare variable x with value 42 using short declaration.',
        code: 'x ___ 42',
        answer: ':=',
        hint: 'Short variable declaration uses colon-equals (:=)',
      },
      {
        question: 'What is the zero value of a bool in Go?',
        code: 'var ok bool\nfmt.Println(ok) // prints ___',
        answer: 'false',
        hint: 'Boolean zero value is the negative/falsy value',
      },
    ],
  },

  operators: {
    title: 'Operators & I/O',
    icon: <Code size={14} />,
    description:
      'Go uses the fmt package for formatted I/O. Println prints with a newline. Printf uses format verbs: %d (int), %f (float), %s (string), %v (default), %T (type name), %+v (struct with field names), %q (quoted string), %p (pointer), %b (binary), %x (hex). Sprintf returns a formatted string instead of printing. Scanf reads formatted input from stdin. Arithmetic operators work as expected (+, -, *, /, %). Comparison returns bool. Logical operators are && (and), || (or), ! (not). Bitwise operators include &, |, ^, <<, >>.',
    codeBlocks: [
      {
        title: 'Printf Format Verbs',
        lines: [
          'package main',
          '',
          'import "fmt"',
          '',
          'type Point struct{ X, Y int }',
          '',
          'func main() {',
          '    p := Point{3, 7}',
          '    fmt.Printf("Default:    %v\\n", p)',
          '    fmt.Printf("With names: %+v\\n", p)',
          '    fmt.Printf("Type:       %T\\n", p)',
          '',
          '    name := "Go"',
          '    fmt.Printf("String:  %s\\n", name)',
          '    fmt.Printf("Quoted:  %q\\n", name)',
          '    fmt.Printf("Integer: %d\\n", 255)',
          '    fmt.Printf("Binary:  %b\\n", 255)',
          '    fmt.Printf("Hex:     %x\\n", 255)',
          '    fmt.Printf("Float:   %.3f\\n", 3.14159)',
          '',
          '    msg := fmt.Sprintf("coords: (%d,%d)", 10, 20)',
          '    fmt.Println(msg)',
          '}',
        ],
        output: 'Default:    {3 7}\nWith names: {X:3 Y:7}\nType:       main.Point\nString:  Go\nQuoted:  "Go"\nInteger: 255\nBinary:  11111111\nHex:     ff\nFloat:   3.142\ncoords: (10,20)',
      },
      {
        title: 'Arithmetic & Comparison',
        lines: [
          'func main() {',
          '    a, b := 17, 5',
          '    fmt.Println("Add:", a + b)    // 22',
          '    fmt.Println("Sub:", a - b)    // 12',
          '    fmt.Println("Mul:", a * b)    // 85',
          '    fmt.Println("Div:", a / b)    // 3 (integer)',
          '    fmt.Println("Mod:", a % b)    // 2',
          '',
          '    fmt.Println("Equal:", a == b)     // false',
          '    fmt.Println("Greater:", a > b)    // true',
          '',
          '    x, y := true, false',
          '    fmt.Println("AND:", x && y)   // false',
          '    fmt.Println("OR:", x || y)    // true',
          '    fmt.Println("NOT:", !x)       // false',
          '}',
        ],
        output: 'Add: 22\nSub: 12\nMul: 85\nDiv: 3\nMod: 2\nEqual: false\nGreater: true\nAND: false\nOR: true\nNOT: false',
      },
    ],
    exercises: [
      {
        question: 'Which format verb prints the type of a value?',
        code: 'fmt.Printf("Type: ___\\n", 42)',
        answer: '%T',
        hint: 'Capital T is for Type in Go format verbs',
      },
      {
        question: 'What does 17 % 5 evaluate to in Go?',
        code: 'fmt.Println(17 % 5) // prints ___',
        answer: '2',
        hint: 'Modulo returns the remainder after integer division (17 = 3*5 + 2)',
      },
    ],
  },

  'control-flow': {
    title: 'Control Flow',
    icon: <ChevronRight size={14} />,
    description:
      'Go has if/else (no parentheses around conditions), switch (no break needed, cases do not fall through), and for (the only loop keyword). The if statement supports an init statement before the condition. Switch can operate without an expression for clean conditional chains, and supports type switches. The for loop serves as for, while, and infinite loop. Use range to iterate over slices, maps, strings, and channels. break, continue, and labeled loops provide loop control. goto exists but is rarely used.',
    codeBlocks: [
      {
        title: 'if with Init & Switch',
        lines: [
          'func main() {',
          '    // if with init statement',
          '    if x := 42; x > 40 {',
          '        fmt.Println("x is large:", x)',
          '    }',
          '    // x is not accessible here',
          '',
          '    // Switch (no break needed)',
          '    lang := "Go"',
          '    switch lang {',
          '    case "Go":',
          '        fmt.Println("Compiled, concurrent")',
          '    case "Python":',
          '        fmt.Println("Interpreted, dynamic")',
          '    default:',
          '        fmt.Println("Other language")',
          '    }',
          '',
          '    // Expressionless switch (like if/else)',
          '    score := 85',
          '    switch {',
          '    case score >= 90:',
          '        fmt.Println("Grade: A")',
          '    case score >= 80:',
          '        fmt.Println("Grade: B")',
          '    default:',
          '        fmt.Println("Grade: C")',
          '    }',
          '}',
        ],
        output: 'x is large: 42\nCompiled, concurrent\nGrade: B',
      },
      {
        title: 'For Loop Variants',
        lines: [
          'func main() {',
          '    // Classic for loop',
          '    for i := 0; i < 3; i++ {',
          '        fmt.Print(i, " ")',
          '    }',
          '    fmt.Println()',
          '',
          '    // While-style loop',
          '    n := 1',
          '    for n < 100 {',
          '        n *= 2',
          '    }',
          '    fmt.Println("n:", n)',
          '',
          '    // Range over slice',
          '    colors := []string{"red", "green", "blue"}',
          '    for idx, c := range colors {',
          '        fmt.Printf("  %d: %s\\n", idx, c)',
          '    }',
          '',
          '    // Range (index only)',
          '    for i := range colors {',
          '        fmt.Print(i, " ")',
          '    }',
          '}',
        ],
        output: '0 1 2\nn: 128\n  0: red\n  1: green\n  2: blue\n0 1 2',
      },
      {
        title: 'Labels & Type Switch',
        lines: [
          'func main() {',
          '    // Labeled break',
          '    outer:',
          '    for i := 0; i < 3; i++ {',
          '        for j := 0; j < 3; j++ {',
          '            if i == 1 && j == 1 {',
          '                break outer',
          '            }',
          '            fmt.Printf("(%d,%d) ", i, j)',
          '        }',
          '    }',
          '    fmt.Println()',
          '',
          '    // Type switch',
          '    var val any = "hello"',
          '    switch v := val.(type) {',
          '    case int:',
          '        fmt.Println("int:", v)',
          '    case string:',
          '        fmt.Println("string:", v)',
          '    default:',
          '        fmt.Println("unknown type")',
          '    }',
          '}',
        ],
        output: '(0,0) (0,1) (0,2) (1,0)\nstring: hello',
      },
    ],
    exercises: [
      {
        question: 'Complete the for loop to iterate from 0 to 4.',
        code: 'for i := 0; i ___ 5; i++ {\n    fmt.Println(i)\n}',
        answer: '<',
        hint: 'Use the less-than operator so i goes 0, 1, 2, 3, 4',
      },
      {
        question: 'Complete the range loop to get both index and value.',
        code: 'for idx, val := ___ items {',
        answer: 'range',
        hint: 'The keyword that iterates over collections in Go',
      },
    ],
  },

  'arrays-slices': {
    title: 'Arrays & Slices',
    icon: <Code size={14} />,
    description:
      'Arrays in Go have a fixed size that is part of the type ([5]int differs from [10]int). Slices are dynamically-sized views backed by arrays and are far more common. Create slices with literals, make([]T, len, cap), or by slicing an array. append() adds elements (may reallocate). copy() copies elements between slices. len() returns current length, cap() returns capacity. A nil slice has len/cap 0 and equals nil, while an empty slice ([]int{}) is non-nil with len 0. Slice tricks include filtering in-place, deleting elements, and building 2D slices.',
    codeBlocks: [
      {
        title: 'Arrays & Basic Slices',
        lines: [
          'func main() {',
          '    // Fixed-size array',
          '    var arr [3]int = [3]int{10, 20, 30}',
          '    fmt.Println("Array:", arr)',
          '    fmt.Println("Length:", len(arr))',
          '',
          '    // Slice literal',
          '    nums := []int{1, 2, 3, 4, 5}',
          '    fmt.Println("Slice:", nums)',
          '    fmt.Println("nums[1:3]:", nums[1:3])',
          '',
          '    // make([]T, length, capacity)',
          '    s := make([]int, 3, 10)',
          '    fmt.Printf("len=%d cap=%d %v\\n", len(s), cap(s), s)',
          '}',
        ],
        output: 'Array: [10 20 30]\nLength: 3\nSlice: [1 2 3 4 5]\nnums[1:3]: [2 3]\nlen=3 cap=10 [0 0 0]',
      },
      {
        title: 'append, copy & nil vs empty',
        lines: [
          'func main() {',
          '    // Append grows the slice',
          '    s := []int{1, 2}',
          '    s = append(s, 3, 4, 5)',
          '    fmt.Println("After append:", s)',
          '',
          '    // Copy between slices',
          '    src := []int{10, 20, 30}',
          '    dst := make([]int, len(src))',
          '    copied := copy(dst, src)',
          '    fmt.Println("Copied:", copied, "dst:", dst)',
          '',
          '    // nil slice vs empty slice',
          '    var nilSlice []int',
          '    emptySlice := []int{}',
          '    fmt.Println("nil slice:", nilSlice == nil)     // true',
          '    fmt.Println("empty slice:", emptySlice == nil) // false',
          '    fmt.Println("Both len 0:", len(nilSlice), len(emptySlice))',
          '}',
        ],
        output: 'After append: [1 2 3 4 5]\nCopied: 3 dst: [10 20 30]\nnil slice: true\nempty slice: false\nBoth len 0: 0 0',
      },
      {
        title: 'Slice Tricks & 2D Slices',
        lines: [
          'func main() {',
          '    // Delete element at index 2',
          '    s := []int{10, 20, 30, 40, 50}',
          '    s = append(s[:2], s[3:]...)',
          '    fmt.Println("After delete:", s)',
          '',
          '    // Filter in-place',
          '    nums := []int{1, 2, 3, 4, 5, 6}',
          '    evens := nums[:0]',
          '    for _, n := range nums {',
          '        if n%2 == 0 {',
          '            evens = append(evens, n)',
          '        }',
          '    }',
          '    fmt.Println("Evens:", evens)',
          '',
          '    // 2D slice (matrix)',
          '    matrix := make([][]int, 3)',
          '    for i := range matrix {',
          '        matrix[i] = make([]int, 3)',
          '        matrix[i][i] = 1 // identity diagonal',
          '    }',
          '    fmt.Println("Matrix:", matrix)',
          '}',
        ],
        output: 'After delete: [10 20 40 50]\nEvens: [2 4 6]\nMatrix: [[1 0 0] [0 1 0] [0 0 1]]',
      },
    ],
    exercises: [
      {
        question: 'Add element 99 to slice s.',
        code: 's = ___(s, 99)',
        answer: 'append',
        hint: 'The built-in function that adds elements to a slice',
      },
      {
        question: 'Create a slice of 5 ints with capacity 10.',
        code: 's := make([]int, 5, ___)',
        answer: '10',
        hint: 'The third argument to make() sets the capacity',
      },
    ],
  },

  'maps-structs': {
    title: 'Maps & Structs',
    icon: <Code size={14} />,
    description:
      'Maps are Go\'s hash tables: map[KeyType]ValueType. Create with make() or a literal. Access values with m[key]. Delete with delete(m, key). The comma-ok pattern (val, ok := m[key]) detects missing keys. Structs group fields into composite types. Embedding a struct inside another gives field promotion. Struct tags (backtick metadata) drive JSON encoding and validation. Anonymous structs are useful for one-off data groupings without declaring a named type.',
    codeBlocks: [
      {
        title: 'Maps: Create, Access, Delete',
        lines: [
          'func main() {',
          '    // Map literal',
          '    ages := map[string]int{',
          '        "Alice": 30,',
          '        "Bob":   25,',
          '    }',
          '    fmt.Println("Alice:", ages["Alice"])',
          '',
          '    // Add & delete',
          '    ages["Eve"] = 28',
          '    delete(ages, "Bob")',
          '    fmt.Println("After:", ages)',
          '',
          '    // Comma-ok pattern',
          '    val, ok := ages["Bob"]',
          '    fmt.Println("Bob:", val, "exists:", ok)',
          '',
          '    // Iterate (random order)',
          '    for name, age := range ages {',
          '        fmt.Printf("  %s: %d\\n", name, age)',
          '    }',
          '}',
        ],
        output: 'Alice: 30\nAfter: map[Alice:30 Eve:28]\nBob: 0 exists: false',
      },
      {
        title: 'Structs & Embedding',
        lines: [
          'type Address struct {',
          '    City    string',
          '    Country string',
          '}',
          '',
          'type Person struct {',
          '    Name string',
          '    Age  int',
          '    Address  // embedded struct',
          '}',
          '',
          'func main() {',
          '    p := Person{',
          '        Name: "Alice",',
          '        Age:  30,',
          '        Address: Address{',
          '            City:    "Seattle",',
          '            Country: "USA",',
          '        },',
          '    }',
          '    // Promoted field access',
          '    fmt.Println(p.Name, "lives in", p.City)',
          '    fmt.Printf("%+v\\n", p)',
          '}',
        ],
        output: 'Alice lives in Seattle\n{Name:Alice Age:30 Address:{City:Seattle Country:USA}}',
      },
      {
        title: 'Struct Tags & Anonymous Structs',
        lines: [
          'import "encoding/json"',
          '',
          'type User struct {',
          '    Name  string `json:"name"`',
          '    Email string `json:"email"`',
          '    Age   int    `json:"age,omitempty"`',
          '}',
          '',
          'func main() {',
          '    u := User{Name: "Bob", Email: "bob@go.dev"}',
          '    data, _ := json.Marshal(u)',
          '    fmt.Println(string(data))',
          '',
          '    // Anonymous struct',
          '    config := struct {',
          '        Host string',
          '        Port int',
          '    }{',
          '        Host: "localhost",',
          '        Port: 8080,',
          '    }',
          '    fmt.Printf("%+v\\n", config)',
          '}',
        ],
        output: '{"name":"Bob","email":"bob@go.dev"}\n{Host:localhost Port:8080}',
      },
    ],
    exercises: [
      {
        question: 'Check if key "admin" exists in the map.',
        code: 'val, ___ := roles["admin"]',
        answer: 'ok',
        hint: 'The second return value is conventionally named ok (bool)',
      },
      {
        question: 'Remove key "temp" from map m.',
        code: '___(m, "temp")',
        answer: 'delete',
        hint: 'The built-in function that removes a key from a map',
      },
    ],
  },

  functions: {
    title: 'Functions',
    icon: <Code size={14} />,
    description:
      'Go functions support multiple return values, named return parameters, and variadic arguments (...T). Functions are first-class values that can be assigned to variables, passed as arguments, and returned from other functions. Closures capture variables from their enclosing scope. The defer keyword schedules a call to run when the surrounding function returns, executing in LIFO order. The init() function runs automatically before main() for package initialization. Go does not support function overloading or default parameters.',
    codeBlocks: [
      {
        title: 'Multiple Returns & Named Returns',
        lines: [
          '// Multiple return values',
          'func divide(a, b float64) (float64, error) {',
          '    if b == 0 {',
          '        return 0, fmt.Errorf("divide by zero")',
          '    }',
          '    return a / b, nil',
          '}',
          '',
          '// Named returns',
          'func swap(x, y int) (first, second int) {',
          '    first = y',
          '    second = x',
          '    return // naked return',
          '}',
          '',
          'func main() {',
          '    result, err := divide(10, 3)',
          '    fmt.Printf("%.2f, %v\\n", result, err)',
          '    a, b := swap(1, 2)',
          '    fmt.Println(a, b)',
          '}',
        ],
        output: '3.33, <nil>\n2 1',
      },
      {
        title: 'Variadic, First-class & Closures',
        lines: [
          '// Variadic function',
          'func sum(nums ...int) int {',
          '    total := 0',
          '    for _, n := range nums {',
          '        total += n',
          '    }',
          '    return total',
          '}',
          '',
          '// Functions as values',
          'func apply(fn func(int, int) int, a, b int) int {',
          '    return fn(a, b)',
          '}',
          '',
          '// Closure',
          'func counter() func() int {',
          '    n := 0',
          '    return func() int {',
          '        n++',
          '        return n',
          '    }',
          '}',
          '',
          'func main() {',
          '    fmt.Println(sum(1, 2, 3, 4))  // 10',
          '    add := func(a, b int) int { return a + b }',
          '    fmt.Println(apply(add, 5, 3)) // 8',
          '',
          '    next := counter()',
          '    fmt.Println(next(), next(), next()) // 1 2 3',
          '}',
        ],
        output: '10\n8\n1 2 3',
      },
      {
        title: 'Defer (LIFO) & init()',
        lines: [
          'package main',
          '',
          'import "fmt"',
          '',
          'func init() {',
          '    // Runs before main automatically',
          '    fmt.Println("init: setting up")',
          '}',
          '',
          'func readFile() {',
          '    fmt.Println("open file")',
          '    defer fmt.Println("close file")  // runs last',
          '    defer fmt.Println("flush buffer") // runs second-to-last',
          '    fmt.Println("read contents")',
          '}',
          '',
          'func main() {',
          '    readFile()',
          '    // Output order of defers: LIFO',
          '}',
        ],
        output: 'init: setting up\nopen file\nread contents\nflush buffer\nclose file',
      },
    ],
    exercises: [
      {
        question: 'Complete the variadic function signature.',
        code: 'func sum(nums ___int) int {',
        answer: '...',
        hint: 'Variadic parameters use three dots before the type',
      },
      {
        question: 'Schedule Close() to run when the function exits.',
        code: '___ file.Close()',
        answer: 'defer',
        hint: 'This keyword defers execution until the enclosing function returns',
      },
    ],
  },

  'methods-interfaces': {
    title: 'Methods & Interfaces',
    icon: <BookOpen size={14} />,
    description:
      'Methods are functions with a receiver argument attached to a type. Value receivers get a copy; pointer receivers can modify the original. Interfaces are satisfied implicitly -- a type implements an interface simply by having all its methods. No "implements" keyword is needed. The empty interface (any, alias for interface{}) accepts any value. Type assertions extract the concrete type from an interface. Type switches branch on the dynamic type. Standard library interfaces like io.Reader and io.Writer provide composable abstractions for I/O.',
    codeBlocks: [
      {
        title: 'Methods: Value vs Pointer Receiver',
        lines: [
          'type Rect struct {',
          '    Width, Height float64',
          '}',
          '',
          '// Value receiver (read-only)',
          'func (r Rect) Area() float64 {',
          '    return r.Width * r.Height',
          '}',
          '',
          '// Pointer receiver (can modify)',
          'func (r *Rect) Scale(factor float64) {',
          '    r.Width *= factor',
          '    r.Height *= factor',
          '}',
          '',
          'func main() {',
          '    r := Rect{10, 5}',
          '    fmt.Println("Area:", r.Area())   // 50',
          '    r.Scale(2)',
          '    fmt.Println("Scaled:", r.Width, r.Height) // 20 10',
          '    fmt.Println("Area:", r.Area())   // 200',
          '}',
        ],
        output: 'Area: 50\nScaled: 20 10\nArea: 200',
      },
      {
        title: 'Interfaces (Implicit)',
        lines: [
          'type Shape interface {',
          '    Area() float64',
          '    Perimeter() float64',
          '}',
          '',
          'type Circle struct{ Radius float64 }',
          '',
          'func (c Circle) Area() float64 {',
          '    return 3.14159 * c.Radius * c.Radius',
          '}',
          'func (c Circle) Perimeter() float64 {',
          '    return 2 * 3.14159 * c.Radius',
          '}',
          '',
          '// Circle implicitly satisfies Shape',
          'func describe(s Shape) {',
          '    fmt.Printf("Area=%.2f Perim=%.2f\\n", s.Area(), s.Perimeter())',
          '}',
          '',
          'func main() {',
          '    c := Circle{5}',
          '    describe(c)',
          '}',
        ],
        output: 'Area=78.54 Perim=31.42',
      },
      {
        title: 'Type Assertions & io.Reader',
        lines: [
          'import (',
          '    "fmt"',
          '    "io"',
          '    "strings"',
          ')',
          '',
          '// Type assertion',
          'func printIfString(val any) {',
          '    if s, ok := val.(string); ok {',
          '        fmt.Println("String:", s)',
          '    } else {',
          '        fmt.Println("Not a string")',
          '    }',
          '}',
          '',
          '// io.Reader interface example',
          'func readAll(r io.Reader) string {',
          '    buf := make([]byte, 1024)',
          '    n, _ := r.Read(buf)',
          '    return string(buf[:n])',
          '}',
          '',
          'func main() {',
          '    printIfString("hello")',
          '    printIfString(42)',
          '',
          '    r := strings.NewReader("Go is great")',
          '    fmt.Println(readAll(r))',
          '}',
        ],
        output: 'String: hello\nNot a string\nGo is great',
      },
    ],
    exercises: [
      {
        question: 'Define a method Area() on type Circle with value receiver.',
        code: 'func (___ Circle) Area() float64 {',
        answer: 'c',
        hint: 'The receiver is a variable name before the type e.g. (c Circle)',
      },
      {
        question: 'What keyword makes a pointer receiver method modify the original?',
        code: 'func (r ___Rect) Scale(f float64) {',
        answer: '*',
        hint: 'A pointer receiver uses the asterisk before the type name',
      },
    ],
  },

  errors: {
    title: 'Error Handling',
    icon: <X size={14} />,
    description:
      'Go treats errors as values, not exceptions. The built-in error interface has a single method: Error() string. Create errors with errors.New() or fmt.Errorf(). Wrap errors with %w in fmt.Errorf to preserve the error chain. Unwrap and inspect with errors.Is() (compare to sentinel) and errors.As() (extract typed error). Custom error types implement the error interface. Sentinel errors (var ErrNotFound = errors.New("not found")) provide stable comparison targets. For truly unrecoverable situations, panic() stops execution and defer/recover can intercept it.',
    codeBlocks: [
      {
        title: 'Basic Error Handling',
        lines: [
          'import (',
          '    "errors"',
          '    "fmt"',
          ')',
          '',
          'func divide(a, b float64) (float64, error) {',
          '    if b == 0 {',
          '        return 0, errors.New("division by zero")',
          '    }',
          '    return a / b, nil',
          '}',
          '',
          'func main() {',
          '    result, err := divide(10, 0)',
          '    if err != nil {',
          '        fmt.Println("Error:", err)',
          '        return',
          '    }',
          '    fmt.Println("Result:", result)',
          '}',
        ],
        output: 'Error: division by zero',
      },
      {
        title: 'Wrapping & Sentinel Errors',
        lines: [
          'import (',
          '    "errors"',
          '    "fmt"',
          ')',
          '',
          '// Sentinel error',
          'var ErrNotFound = errors.New("not found")',
          '',
          'func findUser(id int) (string, error) {',
          '    if id != 1 {',
          '        return "", fmt.Errorf("findUser(%d): %w", id, ErrNotFound)',
          '    }',
          '    return "Alice", nil',
          '}',
          '',
          'func main() {',
          '    _, err := findUser(99)',
          '    fmt.Println(err)',
          '',
          '    // errors.Is checks the chain',
          '    if errors.Is(err, ErrNotFound) {',
          '        fmt.Println("User does not exist")',
          '    }',
          '}',
        ],
        output: 'findUser(99): not found\nUser does not exist',
      },
      {
        title: 'Custom Errors & Panic/Recover',
        lines: [
          '// Custom error type',
          'type ValidationError struct {',
          '    Field   string',
          '    Message string',
          '}',
          '',
          'func (e *ValidationError) Error() string {',
          '    return fmt.Sprintf("%s: %s", e.Field, e.Message)',
          '}',
          '',
          'func validate(age int) error {',
          '    if age < 0 {',
          '        return &ValidationError{"age", "must be positive"}',
          '    }',
          '    return nil',
          '}',
          '',
          '// Panic and recover',
          'func safeDivide(a, b int) (result int) {',
          '    defer func() {',
          '        if r := recover(); r != nil {',
          '            fmt.Println("Recovered:", r)',
          '            result = 0',
          '        }',
          '    }()',
          '    return a / b  // panics if b == 0',
          '}',
          '',
          'func main() {',
          '    err := validate(-5)',
          '    var ve *ValidationError',
          '    if errors.As(err, &ve) {',
          '        fmt.Println("Field:", ve.Field)',
          '    }',
          '    fmt.Println(safeDivide(10, 0))',
          '}',
        ],
        output: 'Field: age\nRecovered: runtime error: integer divide by zero\n0',
      },
    ],
    exercises: [
      {
        question: 'Complete the standard error check pattern.',
        code: 'if err != ___ {\n    return err\n}',
        answer: 'nil',
        hint: 'In Go, nil represents the zero/absent value for error',
      },
      {
        question: 'Wrap an error with context using fmt.Errorf.',
        code: 'return fmt.Errorf("open config: ___", err)',
        answer: '%w',
        hint: 'The %w verb wraps an error preserving the chain for errors.Is/As',
      },
    ],
  },

  'goroutines-channels': {
    title: 'Goroutines & Channels',
    icon: <ChevronRight size={14} />,
    description:
      'Goroutines are lightweight concurrent functions started with the go keyword. They are multiplexed onto OS threads by the Go runtime and cost only a few KB of stack. Channels (make(chan T)) are typed conduits for safe communication between goroutines. Unbuffered channels synchronize sender and receiver. Buffered channels (make(chan T, capacity)) allow sends until full. Use range to receive until a channel is closed. The select statement waits on multiple channel operations. sync.WaitGroup coordinates goroutine completion. sync.Mutex protects shared state from data races.',
    codeBlocks: [
      {
        title: 'Goroutines & WaitGroup',
        lines: [
          'import (',
          '    "fmt"',
          '    "sync"',
          ')',
          '',
          'func worker(id int, wg *sync.WaitGroup) {',
          '    defer wg.Done()',
          '    fmt.Printf("Worker %d starting\\n", id)',
          '    // simulate work...',
          '    fmt.Printf("Worker %d done\\n", id)',
          '}',
          '',
          'func main() {',
          '    var wg sync.WaitGroup',
          '',
          '    for i := 1; i <= 3; i++ {',
          '        wg.Add(1)',
          '        go worker(i, &wg)',
          '    }',
          '',
          '    wg.Wait()',
          '    fmt.Println("All workers finished")',
          '}',
        ],
        output: 'Worker 1 starting\nWorker 1 done\nWorker 2 starting\nWorker 2 done\nWorker 3 starting\nWorker 3 done\nAll workers finished',
      },
      {
        title: 'Channels & Buffered Channels',
        lines: [
          'func main() {',
          '    // Unbuffered channel',
          '    ch := make(chan string)',
          '    go func() {',
          '        ch <- "ping"',
          '    }()',
          '    msg := <-ch',
          '    fmt.Println(msg) // ping',
          '',
          '    // Buffered channel',
          '    buf := make(chan int, 3)',
          '    buf <- 10',
          '    buf <- 20',
          '    buf <- 30',
          '    fmt.Println(<-buf) // 10',
          '    fmt.Println(<-buf) // 20',
          '',
          '    // Range over channel',
          '    jobs := make(chan int, 5)',
          '    for i := 1; i <= 5; i++ {',
          '        jobs <- i',
          '    }',
          '    close(jobs)',
          '    for j := range jobs {',
          '        fmt.Print(j, " ")',
          '    }',
          '}',
        ],
        output: 'ping\n10\n20\n1 2 3 4 5',
      },
      {
        title: 'Select & Mutex',
        lines: [
          'import (',
          '    "fmt"',
          '    "sync"',
          '    "time"',
          ')',
          '',
          '// Select waits on multiple channels',
          'func main() {',
          '    ch1 := make(chan string, 1)',
          '    ch2 := make(chan string, 1)',
          '    ch1 <- "one"',
          '',
          '    select {',
          '    case msg := <-ch1:',
          '        fmt.Println("Received:", msg)',
          '    case msg := <-ch2:',
          '        fmt.Println("Received:", msg)',
          '    case <-time.After(time.Second):',
          '        fmt.Println("Timeout")',
          '    }',
          '',
          '    // Mutex for shared state',
          '    var mu sync.Mutex',
          '    count := 0',
          '    var wg sync.WaitGroup',
          '    for i := 0; i < 1000; i++ {',
          '        wg.Add(1)',
          '        go func() {',
          '            defer wg.Done()',
          '            mu.Lock()',
          '            count++',
          '            mu.Unlock()',
          '        }()',
          '    }',
          '    wg.Wait()',
          '    fmt.Println("Count:", count) // always 1000',
          '}',
        ],
        output: 'Received: one\nCount: 1000',
      },
    ],
    exercises: [
      {
        question: 'Launch function process() as a goroutine.',
        code: '___ process()',
        answer: 'go',
        hint: 'Prefix any function call with this keyword to run it concurrently',
      },
      {
        question: 'Create a buffered channel of int with capacity 5.',
        code: 'ch := make(chan int, ___)',
        answer: '5',
        hint: 'The second argument to make(chan T, n) sets the buffer size',
      },
    ],
  },

  'packages-modules': {
    title: 'Packages & Modules',
    icon: <BookOpen size={14} />,
    description:
      'Go code is organized into packages. A module is a collection of packages versioned together, defined by go.mod. Initialize with go mod init <module-path>. The go.sum file contains cryptographic checksums. Exported names start with an uppercase letter; lowercase names are unexported (package-private). The internal/ directory restricts import to the parent module. Use go get to add dependencies and go install to build and install binaries. Standard library packages (fmt, net/http, os, encoding/json) need no external dependencies.',
    codeBlocks: [
      {
        title: 'Module Init & go.mod',
        lines: [
          '// Terminal:',
          '// mkdir myapp && cd myapp',
          '// go mod init github.com/user/myapp',
          '',
          '// go.mod file generated:',
          '// module github.com/user/myapp',
          '// go 1.22',
          '',
          '// Project layout:',
          '// myapp/',
          '//   go.mod',
          '//   go.sum',
          '//   main.go',
          '//   internal/',
          '//     auth/',
          '//       auth.go',
          '//   pkg/',
          '//     utils/',
          '//       utils.go',
        ],
      },
      {
        title: 'Exported vs Unexported',
        lines: [
          '// pkg/mathutil/mathutil.go',
          'package mathutil',
          '',
          '// Max is exported (uppercase)',
          'func Max(a, b int) int {',
          '    if a > b {',
          '        return a',
          '    }',
          '    return b',
          '}',
          '',
          '// helper is unexported (lowercase)',
          'func helper() int {',
          '    return 42',
          '}',
          '',
          '// ---- main.go ----',
          'package main',
          '',
          'import (',
          '    "fmt"',
          '    "github.com/user/myapp/pkg/mathutil"',
          ')',
          '',
          'func main() {',
          '    fmt.Println(mathutil.Max(3, 7)) // OK',
          '    // mathutil.helper() <-- compile error',
          '}',
        ],
        output: '7',
      },
      {
        title: 'go get & go install',
        lines: [
          '// Add a dependency:',
          '// go get github.com/gin-gonic/gin@latest',
          '',
          '// Install a binary tool:',
          '// go install golang.org/x/tools/gopls@latest',
          '',
          '// Update all dependencies:',
          '// go get -u ./...',
          '',
          '// Tidy unused dependencies:',
          '// go mod tidy',
          '',
          '// Vendor dependencies locally:',
          '// go mod vendor',
          '',
          '// List all dependencies:',
          '// go list -m all',
        ],
      },
    ],
    exercises: [
      {
        question: 'Initialize a new Go module.',
        code: 'go ___ init github.com/user/myapp',
        answer: 'mod',
        hint: 'The go subcommand for module management',
      },
      {
        question: 'Make function doStuff visible outside its package.',
        code: 'func ___Stuff() { }',
        answer: 'Do',
        hint: 'Exported identifiers start with an uppercase letter in Go',
      },
    ],
  },

  advanced: {
    title: 'Advanced',
    icon: <ChevronRight size={14} />,
    description:
      'Go 1.18 introduced generics with type parameters and constraints. context.Context carries deadlines, cancellation signals, and request-scoped values across API boundaries. The reflect package enables runtime type inspection. Build tags control conditional compilation. The testing package supports unit tests (go test), benchmarks, and table-driven test patterns using *testing.T. These features round out Go for production systems requiring flexibility, observability, and quality assurance.',
    codeBlocks: [
      {
        title: 'Generics (Type Parameters)',
        lines: [
          '// Generic function with constraint',
          'type Number interface {',
          '    int | int64 | float64',
          '}',
          '',
          'func Sum[T Number](nums []T) T {',
          '    var total T',
          '    for _, n := range nums {',
          '        total += n',
          '    }',
          '    return total',
          '}',
          '',
          '// Generic data structure',
          'type Stack[T any] struct {',
          '    items []T',
          '}',
          '',
          'func (s *Stack[T]) Push(v T) {',
          '    s.items = append(s.items, v)',
          '}',
          '',
          'func (s *Stack[T]) Pop() (T, bool) {',
          '    if len(s.items) == 0 {',
          '        var zero T',
          '        return zero, false',
          '    }',
          '    v := s.items[len(s.items)-1]',
          '    s.items = s.items[:len(s.items)-1]',
          '    return v, true',
          '}',
          '',
          'func main() {',
          '    fmt.Println(Sum([]int{1, 2, 3, 4})) // 10',
          '',
          '    s := &Stack[string]{}',
          '    s.Push("a")',
          '    s.Push("b")',
          '    v, _ := s.Pop()',
          '    fmt.Println(v) // b',
          '}',
        ],
        output: '10\nb',
      },
      {
        title: 'Context & Reflection',
        lines: [
          'import (',
          '    "context"',
          '    "fmt"',
          '    "reflect"',
          '    "time"',
          ')',
          '',
          '// Context with timeout',
          'func fetchData(ctx context.Context) (string, error) {',
          '    select {',
          '    case <-time.After(2 * time.Second):',
          '        return "data", nil',
          '    case <-ctx.Done():',
          '        return "", ctx.Err()',
          '    }',
          '}',
          '',
          'func main() {',
          '    ctx, cancel := context.WithTimeout(',
          '        context.Background(),',
          '        1*time.Second,',
          '    )',
          '    defer cancel()',
          '',
          '    _, err := fetchData(ctx)',
          '    fmt.Println("Error:", err)',
          '',
          '    // Reflection basics',
          '    x := 42',
          '    t := reflect.TypeOf(x)',
          '    v := reflect.ValueOf(x)',
          '    fmt.Println("Type:", t, "Value:", v, "Kind:", t.Kind())',
          '}',
        ],
        output: 'Error: context deadline exceeded\nType: int Value: 42 Kind: int',
      },
      {
        title: 'Testing (Table-Driven)',
        lines: [
          '// math.go',
          'package math',
          '',
          'func Add(a, b int) int { return a + b }',
          '',
          '// math_test.go',
          'package math',
          '',
          'import "testing"',
          '',
          'func TestAdd(t *testing.T) {',
          '    tests := []struct {',
          '        name     string',
          '        a, b     int',
          '        expected int',
          '    }{',
          '        {"positive", 2, 3, 5},',
          '        {"negative", -1, -2, -3},',
          '        {"zero", 0, 0, 0},',
          '        {"mixed", -1, 5, 4},',
          '    }',
          '',
          '    for _, tt := range tests {',
          '        t.Run(tt.name, func(t *testing.T) {',
          '            got := Add(tt.a, tt.b)',
          '            if got != tt.expected {',
          '                t.Errorf("Add(%d,%d) = %d; want %d",',
          '                    tt.a, tt.b, got, tt.expected)',
          '            }',
          '        })',
          '    }',
          '}',
          '',
          '// Run: go test -v ./...',
        ],
        output: '=== RUN   TestAdd/positive\n=== RUN   TestAdd/negative\n=== RUN   TestAdd/zero\n=== RUN   TestAdd/mixed\n--- PASS: TestAdd (0.00s)\nPASS',
      },
    ],
    exercises: [
      {
        question: 'Complete the generic function signature.',
        code: 'func Max[T ___](a, b T) T {',
        answer: 'comparable',
        hint: 'The built-in constraint that allows == and ordering comparisons',
      },
      {
        question: 'Create a context with a 5 second timeout.',
        code: 'ctx, cancel := context.WithTimeout(\n    context.Background(),\n    5*time.___,\n)',
        answer: 'Second',
        hint: 'time.Second represents one second duration in Go',
      },
    ],
  },
};

const topicKeys = Object.keys(topics);

// ---------------------------------------------------------------------------
// Syntax highlighter
// ---------------------------------------------------------------------------

const GO_KEYWORDS = new Set([
  'package', 'import', 'func', 'return', 'if', 'else', 'for', 'range',
  'switch', 'case', 'default', 'break', 'continue', 'go', 'chan',
  'select', 'defer', 'var', 'const', 'type', 'struct', 'interface',
  'map', 'make', 'new', 'append', 'close', 'len', 'cap', 'nil',
  'true', 'false', 'panic', 'recover', 'delete', 'copy', 'iota',
  'fallthrough', 'goto',
]);

const GO_TYPES = new Set([
  'int', 'int8', 'int16', 'int32', 'int64',
  'uint', 'uint8', 'uint16', 'uint32', 'uint64',
  'float32', 'float64', 'string', 'bool', 'byte', 'rune', 'error',
  'any', 'comparable', 'context', 'Context',
]);

function highlightLine(line: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  let i = 0;
  let key = 0;

  while (i < line.length) {
    // Single-line comments
    if (line[i] === '/' && line[i + 1] === '/') {
      nodes.push(
        <span key={key++} className="text-gray-500">{line.slice(i)}</span>,
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
        <span key={key++} className="text-green-400">{line.slice(start, i)}</span>,
      );
      continue;
    }

    // Backtick raw strings
    if (line[i] === '`') {
      const start = i;
      i++;
      while (i < line.length && line[i] !== '`') i++;
      if (i < line.length) i++;
      nodes.push(
        <span key={key++} className="text-green-400">{line.slice(start, i)}</span>,
      );
      continue;
    }

    // Character literals
    if (line[i] === "'" && i + 2 < line.length) {
      const start = i;
      i++;
      if (line[i] === '\\') i++;
      i++;
      if (i < line.length && line[i] === "'") i++;
      nodes.push(
        <span key={key++} className="text-green-400">{line.slice(start, i)}</span>,
      );
      continue;
    }

    // Numbers
    if (/\d/.test(line[i]) && (i === 0 || /[\s(,=[\-+*/<>:{}|&^~!]/.test(line[i - 1]))) {
      const start = i;
      while (i < line.length && /[\d.xXa-fA-F_]/.test(line[i])) i++;
      nodes.push(
        <span key={key++} className="text-orange-400">{line.slice(start, i)}</span>,
      );
      continue;
    }

    // Identifiers / keywords / types
    if (/[a-zA-Z_]/.test(line[i])) {
      const start = i;
      while (i < line.length && /[a-zA-Z0-9_]/.test(line[i])) i++;
      const word = line.slice(start, i);
      if (GO_KEYWORDS.has(word)) {
        nodes.push(<span key={key++} className="text-blue-400">{word}</span>);
      } else if (GO_TYPES.has(word)) {
        nodes.push(<span key={key++} className="text-purple-400">{word}</span>);
      } else {
        nodes.push(<span key={key++}>{word}</span>);
      }
      continue;
    }

    nodes.push(<span key={key++}>{line[i]}</span>);
    i++;
  }

  return nodes;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const GoLab: React.FC = () => {
  const [activeTopic, setActiveTopic] = useState<string>('introduction');
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [results, setResults] = useState<Record<string, boolean | null>>({});

  const topic = topics[activeTopic];

  const exKey = (idx: number) => `${activeTopic}_ex${idx}`;

  const handleCheck = (exIdx: number) => {
    const k = exKey(exIdx);
    const trimmed = (inputs[k] ?? '').trim();
    const expected = topic.exercises[exIdx].answer.trim();
    setResults((p) => ({ ...p, [k]: trimmed === expected }));
  };

  const handleReset = (exIdx: number) => {
    const k = exKey(exIdx);
    setInputs((p) => ({ ...p, [k]: '' }));
    setResults((p) => ({ ...p, [k]: null }));
  };

  // Count how many exercises have been solved per topic
  const topicProgress = (key: string): { done: number; total: number } => {
    const t = topics[key];
    let done = 0;
    t.exercises.forEach((_, i) => {
      if (results[`${key}_ex${i}`] === true) done++;
    });
    return { done, total: t.exercises.length };
  };

  return (
    <div className="h-full flex flex-col overflow-hidden bg-gradient-to-br from-slate-50 to-cyan-50 dark:from-gray-950 dark:to-cyan-950/20">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-200 dark:border-gray-800 bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm">
        <Code size={16} className="text-cyan-600 dark:text-cyan-400" />
        <h1 className="text-sm font-semibold text-slate-800 dark:text-gray-100">
          Go Lab
        </h1>
        <span className="text-[11px] text-slate-400 dark:text-gray-500 ml-1">
          Interactive Go Reference -- Beginner to Advanced
        </span>
        <div className="ml-auto flex items-center gap-1.5 text-[11px] text-slate-400 dark:text-gray-500">
          <Check size={10} className="text-emerald-500" />
          {Object.keys(topics).reduce((acc, k) => acc + topicProgress(k).done, 0)}
          /{Object.keys(topics).reduce((acc, k) => acc + topicProgress(k).total, 0)} exercises
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-56 shrink-0 border-r border-slate-200 dark:border-gray-800 bg-white/40 dark:bg-gray-900/40 overflow-y-auto">
          <nav className="py-2">
            {topicKeys.map((key, idx) => {
              const t = topics[key];
              const isActive = activeTopic === key;
              const prog = topicProgress(key);
              const allDone = prog.done === prog.total;
              return (
                <button
                  key={key}
                  onClick={() => setActiveTopic(key)}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-left text-[13px] transition-colors ${
                    isActive
                      ? 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300 font-medium'
                      : 'text-slate-600 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-gray-800/50'
                  }`}
                >
                  <span className="text-[11px] text-slate-400 dark:text-gray-600 w-4 text-right shrink-0">
                    {idx + 1}
                  </span>
                  <span className="shrink-0">{t.icon}</span>
                  <span className="truncate flex-1">{t.title}</span>
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
            <span className="text-cyan-600 dark:text-cyan-400">{topic.icon}</span>
            <h2 className="text-lg font-semibold text-slate-800 dark:text-gray-100">
              {topic.title}
            </h2>
            <span className="ml-2 text-[11px] px-2 py-0.5 rounded-full bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400">
              {topicKeys.indexOf(activeTopic) + 1} / {topicKeys.length}
            </span>
          </div>

          {/* Description */}
          <p className="text-[13px] leading-relaxed text-slate-600 dark:text-gray-400 max-w-2xl">
            {topic.description}
          </p>

          {/* Code blocks */}
          {topic.codeBlocks.map((block, bIdx) => (
            <div key={bIdx} className="max-w-2xl">
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 rounded-t-lg border-b border-gray-700">
                <Code size={12} className="text-gray-400" />
                <span className="text-[11px] text-gray-400">{block.title}</span>
              </div>
              <div className="bg-gray-950 rounded-b-lg p-3 font-mono text-[12px] text-gray-200 leading-relaxed overflow-x-auto">
                {block.lines.map((line, lIdx) => (
                  <div key={lIdx} className="min-h-[1.3em]">
                    {line === '' ? '\u00A0' : highlightLine(line)}
                  </div>
                ))}
              </div>
              {block.output && (
                <div className="mt-1">
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-200 dark:bg-gray-800 rounded-t-lg">
                    <ChevronRight size={10} className="text-slate-500 dark:text-gray-400" />
                    <span className="text-[10px] text-slate-500 dark:text-gray-400">Output</span>
                  </div>
                  <div className="bg-slate-100 dark:bg-gray-800/60 rounded-b-lg p-2.5 font-mono text-[11px] text-slate-700 dark:text-gray-300 whitespace-pre-wrap">
                    {block.output}
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Exercises */}
          <div className="max-w-2xl space-y-4">
            <div className="flex items-center gap-2">
              <BookOpen size={14} className="text-amber-500" />
              <h3 className="text-sm font-semibold text-slate-700 dark:text-gray-300">
                Exercises
              </h3>
            </div>

            {topic.exercises.map((ex, exIdx) => {
              const k = exKey(exIdx);
              const val = inputs[k] ?? '';
              const res = results[k] ?? null;

              return (
                <div
                  key={exIdx}
                  className="border border-slate-200 dark:border-gray-800 rounded-lg bg-white dark:bg-gray-900/60 overflow-hidden"
                >
                  <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 dark:bg-gray-800/40 border-b border-slate-200 dark:border-gray-800">
                    <span className="text-[11px] font-bold text-slate-400 dark:text-gray-500">
                      {exIdx + 1}
                    </span>
                    <span className="text-[13px] text-slate-700 dark:text-gray-300">
                      {ex.question}
                    </span>
                    {res === true && <Check size={12} className="text-emerald-500 ml-auto" />}
                  </div>

                  <div className="p-4 space-y-3">
                    {/* Exercise code template */}
                    <div className="bg-gray-950 rounded-lg p-3 font-mono text-[12px] text-gray-300 whitespace-pre-wrap">
                      {ex.code.split('___').map((part, pIdx, arr) => (
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

                    {/* Input + buttons */}
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <input
                          type="text"
                          value={val}
                          onChange={(e) => {
                            setInputs((p) => ({ ...p, [k]: e.target.value }));
                            if (res !== null) setResults((p) => ({ ...p, [k]: null }));
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && val.trim()) handleCheck(exIdx);
                          }}
                          placeholder="Type your answer..."
                          className={`w-full px-3 py-2 text-[13px] rounded-md border bg-white dark:bg-gray-800 text-slate-800 dark:text-gray-200 placeholder-slate-400 dark:placeholder-gray-600 outline-none transition-colors ${
                            res === true
                              ? 'border-emerald-400 dark:border-emerald-500'
                              : res === false
                              ? 'border-red-400 dark:border-red-500'
                              : 'border-slate-300 dark:border-gray-700 focus:border-cyan-400 dark:focus:border-cyan-500'
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
                        onClick={() => handleCheck(exIdx)}
                        disabled={!val.trim()}
                        className="flex items-center gap-1.5 px-3 py-2 text-[12px] font-medium rounded-md bg-cyan-600 text-white hover:bg-cyan-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      >
                        <Check size={12} />
                        Check
                      </button>

                      <button
                        onClick={() => handleReset(exIdx)}
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
                            Not quite. Try again.
                          </span>
                        </div>
                        <div className="flex items-start gap-2 px-3 py-2 rounded-md bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800">
                          <BookOpen size={12} className="text-amber-500 mt-0.5 shrink-0" />
                          <span className="text-[12px] text-amber-700 dark:text-amber-300">
                            Hint: {ex.hint}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Navigation */}
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
            <span className="text-[11px] text-slate-400 dark:text-gray-500">
              {topicKeys.indexOf(activeTopic) + 1} of {topicKeys.length}
            </span>
            <button
              onClick={() => {
                const idx = topicKeys.indexOf(activeTopic);
                if (idx < topicKeys.length - 1) setActiveTopic(topicKeys[idx + 1]);
              }}
              disabled={topicKeys.indexOf(activeTopic) === topicKeys.length - 1}
              className="flex items-center gap-1.5 px-3 py-2 text-[12px] font-medium rounded-md bg-cyan-600 text-white hover:bg-cyan-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
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
