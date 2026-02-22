import React, { useState } from 'react';
import { BookOpen, Code, ChevronRight, Check, X, RotateCcw } from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

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
  id: string;
  title: string;
  icon: React.ReactNode;
  explanation: string;
  examples: CodeExample[];
  exercises: Exercise[];
}

// ---------------------------------------------------------------------------
// Topic data  (12 topics, 2-3 examples each, 2 exercises each)
// ---------------------------------------------------------------------------

const topics: TopicData[] = [
  // 1 -- Introduction --------------------------------------------------------
  {
    id: 'intro',
    title: 'Introduction',
    icon: <BookOpen size={14} />,
    explanation:
      'C# (pronounced "C sharp") is a modern, type-safe, object-oriented language created by Anders Hejlsberg at Microsoft. It runs on the .NET runtime (formerly .NET Core / .NET Framework) and is used for desktop apps (WPF, WinForms, MAUI), web backends (ASP.NET Core), game development (Unity), mobile apps (Xamarin / .NET MAUI), cloud microservices, and CLI tools. Install the .NET SDK from dotnet.microsoft.com, scaffold a project with the dotnet CLI, and run it instantly. Since C# 9 you can use top-level statements -- no class or Main method boilerplate required.',
    examples: [
      {
        title: 'Hello World (classic)',
        lines: [
          '// Terminal: dotnet new console -n MyApp',
          '// Terminal: cd MyApp && dotnet run',
          '',
          'using System;',
          '',
          'class Program',
          '{',
          '    static void Main(string[] args)',
          '    {',
          '        Console.WriteLine("Hello, World!");',
          '    }',
          '}',
        ],
      },
      {
        title: 'Top-level statements (C# 9+)',
        lines: [
          '// No class or Main needed -- just write code',
          'Console.WriteLine("Hello from top-level!");',
          'Console.WriteLine($".NET {Environment.Version}");',
          '',
          '// You can still define methods below',
          'void Greet(string name)',
          '{',
          '    Console.WriteLine($"Hi, {name}!");',
          '}',
          '',
          'Greet("Alice");',
        ],
      },
      {
        title: 'dotnet CLI basics',
        lines: [
          '// Create projects',
          '// dotnet new console -n MyConsole',
          '// dotnet new webapi  -n MyApi',
          '// dotnet new classlib -n MyLib',
          '',
          '// Build & run',
          '// dotnet build',
          '// dotnet run',
          '// dotnet test',
          '',
          '// Add packages',
          '// dotnet add package Newtonsoft.Json',
          '// dotnet add package Dapper',
        ],
      },
    ],
    exercises: [
      {
        question: 'Complete the code to print "Hello, World!" to the console.',
        code: 'Console.___("Hello, World!");',
        answer: 'WriteLine',
        hint: 'The method that writes a line of text to standard output',
      },
      {
        question: 'Which CLI command creates a new console application named MyApp?',
        code: 'dotnet ___ console -n MyApp',
        answer: 'new',
        hint: 'The dotnet subcommand that scaffolds a new project from a template',
      },
    ],
  },

  // 2 -- Variables & Types ---------------------------------------------------
  {
    id: 'variables',
    title: 'Variables & Types',
    icon: <Code size={14} />,
    explanation:
      'C# is statically typed with rich type inference via var. Primitive types include int (32-bit), long (64-bit), double (64-bit float), decimal (128-bit, finance), float (32-bit), char, bool, and byte. The string type is immutable and supports interpolation with $"". Use const for compile-time constants, readonly for runtime constants, and the ? suffix to make value types nullable (int?). The dynamic keyword bypasses compile-time checking entirely.',
    examples: [
      {
        title: 'Primitive types & inference',
        lines: [
          'int count = 42;',
          'long bigNum = 9_000_000_000L;',
          'double pi = 3.14159;',
          'float approx = 2.71f;',
          'decimal price = 19.99m;',
          'char letter = \'A\';',
          'bool active = true;',
          'string name = "Alice";',
          '',
          '// Type inference',
          'var score = 100;        // int',
          'var ratio = 0.75;       // double',
          'var label = "default";  // string',
        ],
      },
      {
        title: 'const, readonly, nullable',
        lines: [
          'const double TAX_RATE = 0.08;',
          '',
          'class Config',
          '{',
          '    public readonly string Env;',
          '    public Config(string env) => Env = env;',
          '}',
          '',
          '// Nullable value types',
          'int? age = null;',
          'Console.WriteLine(age.HasValue);   // False',
          'Console.WriteLine(age ?? -1);      // -1',
          '',
          '// Nullable reference types (C# 8+)',
          'string? nickname = null;',
          'Console.WriteLine(nickname?.Length ?? 0);',
        ],
      },
      {
        title: 'String interpolation & verbatim',
        lines: [
          'string first = "John";',
          'string last = "Doe";',
          'int year = 2024;',
          '',
          '// Interpolation',
          'string msg = $"{first} {last}, joined {year}";',
          'Console.WriteLine(msg);',
          '',
          '// Verbatim string (no escapes)',
          'string path = @"C:\\Users\\John\\file.txt";',
          '',
          '// Raw string literal (C# 11+)',
          'string json = """',
          '    { "name": "Alice", "age": 30 }',
          '    """;',
        ],
      },
    ],
    exercises: [
      {
        question: 'Declare a nullable integer variable set to null.',
        code: 'int___ age = null;',
        answer: '?',
        hint: 'Append this symbol to a value type to make it nullable',
      },
      {
        question: 'Create an interpolated string producing "Hello, Alice!".',
        code: 'string name = "Alice";\nstring greeting = $"___";',
        answer: 'Hello, {name}!',
        hint: 'Use curly braces inside $"" to embed the variable',
      },
    ],
  },

  // 3 -- Operators -----------------------------------------------------------
  {
    id: 'operators',
    title: 'Operators',
    icon: <Code size={14} />,
    explanation:
      'C# provides arithmetic (+, -, *, /, %), comparison (==, !=, <, >, <=, >=), and logical (&&, ||, !) operators. The null-coalescing operator ?? returns the right operand when the left is null. The null-conditional ?. short-circuits to null if the left side is null. The is keyword tests types and patterns; as performs safe casts returning null on failure. Pattern matching (C# 7+) enables concise type checks and deconstruction inside if and switch.',
    examples: [
      {
        title: 'Arithmetic & comparison',
        lines: [
          'int a = 17, b = 5;',
          'Console.WriteLine(a + b);   // 22',
          'Console.WriteLine(a / b);   // 3  (integer)',
          'Console.WriteLine(a % b);   // 2',
          'Console.WriteLine(a / (double)b); // 3.4',
          '',
          'Console.WriteLine(a > b);   // True',
          'Console.WriteLine(a == 17); // True',
          'Console.WriteLine(a != b);  // True',
        ],
      },
      {
        title: 'Null-coalescing & null-conditional',
        lines: [
          'string? input = null;',
          '',
          '// ?? returns right side when left is null',
          'string value = input ?? "default";',
          'Console.WriteLine(value);  // "default"',
          '',
          '// ??= assigns only if null',
          'input ??= "fallback";',
          'Console.WriteLine(input);  // "fallback"',
          '',
          '// ?. short-circuits to null',
          'string? name = null;',
          'int? len = name?.Length;',
          'Console.WriteLine(len ?? 0);  // 0',
        ],
      },
      {
        title: 'is, as, and pattern matching',
        lines: [
          'object obj = "Hello";',
          '',
          '// Type check with is',
          'if (obj is string s)',
          '    Console.WriteLine(s.ToUpper()); // HELLO',
          '',
          '// Safe cast with as',
          'string? text = obj as string;',
          'Console.WriteLine(text?.Length);  // 5',
          '',
          '// Pattern matching (C# 9+)',
          'int score = 85;',
          'string grade = score switch',
          '{',
          '    >= 90 => "A",',
          '    >= 80 => "B",',
          '    >= 70 => "C",',
          '    _     => "F"',
          '};',
          'Console.WriteLine(grade);  // B',
        ],
      },
    ],
    exercises: [
      {
        question: 'Use the null-coalescing operator to provide a default of 0.',
        code: 'int? value = null;\nint result = value ___ 0;',
        answer: '??',
        hint: 'Two question marks -- returns right side when left is null',
      },
      {
        question: 'Complete the pattern matching to check if obj is a string.',
        code: 'object obj = "Hi";\nif (obj ___ string s)\n    Console.WriteLine(s);',
        answer: 'is',
        hint: 'The keyword that tests whether an object matches a type or pattern',
      },
    ],
  },

  // 4 -- Control Flow --------------------------------------------------------
  {
    id: 'control-flow',
    title: 'Control Flow',
    icon: <ChevronRight size={14} />,
    explanation:
      'C# supports if/else if/else branching, classic switch statements, and pattern-matching switch expressions (C# 8+). For loops include the C-style for, the collection-based foreach, while, and do-while. The break keyword exits a loop early, and continue skips to the next iteration. Switch expressions with pattern matching produce concise, exhaustive branching without fallthrough.',
    examples: [
      {
        title: 'if / else & classic switch',
        lines: [
          'int temp = 28;',
          '',
          'if (temp > 35)',
          '    Console.WriteLine("Hot");',
          'else if (temp > 20)',
          '    Console.WriteLine("Warm");',
          'else',
          '    Console.WriteLine("Cold");',
          '',
          '// Classic switch',
          'string day = "Mon";',
          'switch (day)',
          '{',
          '    case "Mon": case "Tue": case "Wed":',
          '    case "Thu": case "Fri":',
          '        Console.WriteLine("Weekday"); break;',
          '    case "Sat": case "Sun":',
          '        Console.WriteLine("Weekend"); break;',
          '    default:',
          '        Console.WriteLine("Unknown"); break;',
          '}',
        ],
      },
      {
        title: 'Pattern-matching switch expression',
        lines: [
          'object val = 42;',
          '',
          'string desc = val switch',
          '{',
          '    int n when n < 0    => "Negative",',
          '    int n when n == 0   => "Zero",',
          '    int n               => $"Positive: {n}",',
          '    string s            => $"String: {s}",',
          '    null                => "Null",',
          '    _                   => "Other"',
          '};',
          '',
          'Console.WriteLine(desc);  // Positive: 42',
        ],
      },
      {
        title: 'Loops: for, foreach, while, do-while',
        lines: [
          '// for',
          'for (int i = 0; i < 5; i++)',
          '    Console.Write($"{i} ");  // 0 1 2 3 4',
          '',
          '// foreach',
          'foreach (var ch in "ABCD")',
          '    Console.Write($"{ch} "); // A B C D',
          '',
          '// while with break/continue',
          'int n = 0;',
          'while (n < 10)',
          '{',
          '    n++;',
          '    if (n % 2 == 0) continue;',
          '    if (n > 7) break;',
          '    Console.Write($"{n} ");  // 1 3 5 7',
          '}',
          '',
          '// do-while',
          'int x = 0;',
          'do { x++; } while (x < 3);',
          'Console.Write(x);  // 3',
        ],
      },
    ],
    exercises: [
      {
        question: 'Complete the foreach loop to iterate over the array.',
        code: 'int[] nums = { 1, 2, 3 };\nforeach (int n ___ nums)\n    Console.Write(n);',
        answer: 'in',
        hint: 'The keyword that separates the variable from the collection in foreach',
      },
      {
        question: 'Complete the switch expression wildcard/discard pattern.',
        code: 'string result = value switch\n{\n    > 0 => "Pos",\n    0   => "Zero",\n    ___  => "Neg"\n};',
        answer: '_',
        hint: 'The single underscore discard pattern that matches everything else',
      },
    ],
  },

  // 5 -- Arrays & Collections ------------------------------------------------
  {
    id: 'collections',
    title: 'Arrays & Collections',
    icon: <Code size={14} />,
    explanation:
      'C# arrays are fixed-size, zero-indexed, and strongly typed. For dynamic sizing use List<T>. Dictionary<TKey,TValue> stores key-value pairs with O(1) lookup. HashSet<T> holds unique values with set operations. Queue<T> is FIFO, Stack<T> is LIFO. All generic collections implement IEnumerable<T>, making them LINQ-compatible. The yield return keyword lets you create lazy iterators without allocating a full collection.',
    examples: [
      {
        title: 'Arrays & List<T>',
        lines: [
          '// Arrays',
          'int[] nums = { 10, 20, 30, 40, 50 };',
          'Console.WriteLine(nums[2]);       // 30',
          'Console.WriteLine(nums.Length);    // 5',
          'Array.Sort(nums);',
          'Array.Reverse(nums);',
          '',
          '// List<T>',
          'var names = new List<string> { "Alice", "Bob" };',
          'names.Add("Charlie");',
          'names.Remove("Bob");',
          'names.Insert(0, "Zara");',
          'Console.WriteLine(names.Count);    // 3',
          'Console.WriteLine(names.Contains("Alice")); // True',
          'names.ForEach(n => Console.Write($"{n} "));',
        ],
      },
      {
        title: 'Dictionary, HashSet, Queue, Stack',
        lines: [
          '// Dictionary<K, V>',
          'var scores = new Dictionary<string, int>',
          '{',
          '    ["Alice"] = 95,',
          '    ["Bob"]   = 82',
          '};',
          'scores["Charlie"] = 90;',
          'if (scores.TryGetValue("Bob", out int val))',
          '    Console.WriteLine(val);  // 82',
          '',
          '// HashSet<T>',
          'var set = new HashSet<int> { 1, 2, 3, 2, 1 };',
          'Console.WriteLine(set.Count);  // 3',
          '',
          '// Queue & Stack',
          'var q = new Queue<string>();',
          'q.Enqueue("first"); q.Enqueue("second");',
          'Console.WriteLine(q.Dequeue()); // first',
          '',
          'var stk = new Stack<int>();',
          'stk.Push(10); stk.Push(20);',
          'Console.WriteLine(stk.Pop()); // 20',
        ],
      },
      {
        title: 'IEnumerable & yield return',
        lines: [
          '// Custom iterator with yield return',
          'IEnumerable<int> Fibonacci(int count)',
          '{',
          '    int a = 0, b = 1;',
          '    for (int i = 0; i < count; i++)',
          '    {',
          '        yield return a;',
          '        (a, b) = (b, a + b);',
          '    }',
          '}',
          '',
          'foreach (var n in Fibonacci(8))',
          '    Console.Write($"{n} ");',
          '// 0 1 1 2 3 5 8 13',
          '',
          '// Lazy -- only computed on demand',
          'var first5 = Fibonacci(1000).Take(5);',
        ],
      },
    ],
    exercises: [
      {
        question: 'Add an element to the list using the correct method.',
        code: 'var items = new List<int>();\nitems.___(42);',
        answer: 'Add',
        hint: 'The method that appends a single element to a List<T>',
      },
      {
        question: 'Safely retrieve a value from a dictionary.',
        code: 'var d = new Dictionary<string, int> { ["a"] = 1 };\nd.___(\"a\", out int v);',
        answer: 'TryGetValue',
        hint: 'Returns true/false and sets the out parameter if the key exists',
      },
    ],
  },

  // 6 -- Methods -------------------------------------------------------------
  {
    id: 'methods',
    title: 'Methods',
    icon: <Code size={14} />,
    explanation:
      'Methods are declared inside classes or structs with a return type, name, and parameters. C# supports ref (by-reference), out (must assign before returning), and in (readonly reference) parameters. The params keyword accepts a variable number of arguments. Overloading lets you define methods with the same name but different signatures. Expression-bodied members (=>) provide a concise single-expression syntax. Local functions are nested helpers. Extension methods add functionality to existing types without inheritance.',
    examples: [
      {
        title: 'Declaration, ref/out/in, params',
        lines: [
          '// Basic method with default param',
          'static string Greet(string name, string prefix = "Hello")',
          '    => $"{prefix}, {name}!";',
          '',
          '// ref parameter (caller must init)',
          'static void Increment(ref int x) => x++;',
          '',
          '// out parameter (must assign inside)',
          'static bool TryDivide(int a, int b, out double result)',
          '{',
          '    if (b == 0) { result = 0; return false; }',
          '    result = (double)a / b;',
          '    return true;',
          '}',
          '',
          '// in parameter (readonly ref)',
          'static double Area(in double radius)',
          '    => Math.PI * radius * radius;',
          '',
          '// params -- variable args',
          'static int Sum(params int[] nums)',
          '    => nums.Sum();',
          '',
          'Console.WriteLine(Sum(1, 2, 3, 4)); // 10',
        ],
      },
      {
        title: 'Overloading & expression-bodied',
        lines: [
          'class MathHelper',
          '{',
          '    // Overloaded methods',
          '    public static int Max(int a, int b)',
          '        => a > b ? a : b;',
          '',
          '    public static double Max(double a, double b)',
          '        => a > b ? a : b;',
          '',
          '    public static int Max(int a, int b, int c)',
          '        => Max(Max(a, b), c);',
          '',
          '    // Expression-bodied property',
          '    public double Pi => 3.14159;',
          '}',
          '',
          'Console.WriteLine(MathHelper.Max(3, 7));      // 7',
          'Console.WriteLine(MathHelper.Max(1.5, 2.3));  // 2.3',
          'Console.WriteLine(MathHelper.Max(4, 9, 6));   // 9',
        ],
      },
      {
        title: 'Local functions & extension methods',
        lines: [
          '// Local function (nested helper)',
          'static int Factorial(int n)',
          '{',
          '    if (n < 0) throw new ArgumentException();',
          '    return Inner(n);',
          '',
          '    static int Inner(int x)',
          '        => x <= 1 ? 1 : x * Inner(x - 1);',
          '}',
          '',
          '// Extension method (must be in static class)',
          'public static class StringExtensions',
          '{',
          '    public static string Reverse(this string s)',
          '    {',
          '        var arr = s.ToCharArray();',
          '        Array.Reverse(arr);',
          '        return new string(arr);',
          '    }',
          '',
          '    public static bool IsNullOrEmpty(this string? s)',
          '        => string.IsNullOrEmpty(s);',
          '}',
          '',
          'Console.WriteLine("hello".Reverse()); // olleh',
        ],
      },
    ],
    exercises: [
      {
        question: 'Define an expression-bodied method returning the square of n.',
        code: 'static int Square(int n) ___ n * n;',
        answer: '=>',
        hint: 'The fat arrow used for expression-bodied members',
      },
      {
        question: 'Complete the extension method syntax with the correct keyword.',
        code: 'public static int WordCount(___ string s)\n    => s.Split(\' \').Length;',
        answer: 'this',
        hint: 'This keyword before the first parameter marks it as an extension method',
      },
    ],
  },

  // 7 -- OOP -----------------------------------------------------------------
  {
    id: 'oop',
    title: 'OOP',
    icon: <BookOpen size={14} />,
    explanation:
      'C# is a fully object-oriented language. Classes are reference types; structs are value types. Records (C# 9+) are immutable reference types with value-based equality. Constructors initialize objects; properties (get/set/init) control field access. Access modifiers include public, private, protected, internal, and protected internal. Partial classes split a class across files. Sealed prevents inheritance. Static classes cannot be instantiated and contain only static members.',
    examples: [
      {
        title: 'Class, struct, record',
        lines: [
          '// Class (reference type)',
          'public class Person',
          '{',
          '    public string Name { get; set; }',
          '    public int Age { get; set; }',
          '',
          '    public Person(string name, int age)',
          '    {',
          '        Name = name;',
          '        Age = age;',
          '    }',
          '',
          '    public override string ToString()',
          '        => $"{Name} (age {Age})";',
          '}',
          '',
          '// Struct (value type)',
          'public struct Point',
          '{',
          '    public double X { get; }',
          '    public double Y { get; }',
          '    public Point(double x, double y) => (X, Y) = (x, y);',
          '}',
          '',
          '// Record (immutable, value equality)',
          'public record Product(string Name, decimal Price);',
          'var p = new Product("Widget", 9.99m);',
          'var p2 = p with { Price = 12.99m }; // non-destructive mutation',
        ],
      },
      {
        title: 'Properties, init, access modifiers',
        lines: [
          'public class Account',
          '{',
          '    // Auto-property',
          '    public string Id { get; private set; }',
          '',
          '    // Init-only (C# 9+)',
          '    public string Owner { get; init; }',
          '',
          '    // Computed property',
          '    public string Display => $"{Owner} ({Id})";',
          '',
          '    // Full property with backing field',
          '    private decimal _balance;',
          '    public decimal Balance',
          '    {',
          '        get => _balance;',
          '        private set => _balance = value >= 0',
          '            ? value',
          '            : throw new InvalidOperationException();',
          '    }',
          '',
          '    public Account(string id, string owner)',
          '    {',
          '        Id = id;',
          '        Owner = owner;',
          '        _balance = 0;',
          '    }',
          '}',
        ],
      },
      {
        title: 'Sealed, static, partial',
        lines: [
          '// Sealed class -- cannot be inherited',
          'public sealed class Singleton',
          '{',
          '    private static readonly Singleton _inst = new();',
          '    private Singleton() { }',
          '    public static Singleton Instance => _inst;',
          '}',
          '',
          '// Static class -- no instances',
          'public static class MathUtils',
          '{',
          '    public static int Clamp(int val, int min, int max)',
          '        => Math.Max(min, Math.Min(max, val));',
          '}',
          '',
          '// Partial class -- split across files',
          '// File1.cs',
          'public partial class Order',
          '{',
          '    public int Id { get; set; }',
          '}',
          '// File2.cs',
          'public partial class Order',
          '{',
          '    public decimal Total { get; set; }',
          '}',
        ],
      },
    ],
    exercises: [
      {
        question: 'Complete the auto-property with get and set accessors.',
        code: 'public class Dog\n{\n    public string Name { ___; ___; }\n}',
        answer: 'get; set',
        hint: 'Auto-properties declare get and set separated by semicolons',
      },
      {
        question: 'Declare a record type for a User with Name and Email.',
        code: 'public ___ User(string Name, string Email);',
        answer: 'record',
        hint: 'The C# 9+ keyword for immutable reference types with value equality',
      },
    ],
  },

  // 8 -- Inheritance & Interfaces ---------------------------------------------
  {
    id: 'inheritance',
    title: 'Inheritance & Interfaces',
    icon: <BookOpen size={14} />,
    explanation:
      'C# supports single class inheritance with the : syntax. Virtual methods can be overridden in derived classes; abstract methods must be overridden. The new keyword hides a base member (use sparingly). Interfaces define contracts with no implementation (though C# 8+ allows default interface methods). A class can implement multiple interfaces. Explicit interface implementation resolves name conflicts. Polymorphism lets you treat derived objects as their base type.',
    examples: [
      {
        title: 'Inheritance, virtual/override, abstract',
        lines: [
          'public abstract class Shape',
          '{',
          '    public string Color { get; set; } = "Red";',
          '    public abstract double Area();',
          '    public virtual string Describe()',
          '        => $"{Color} shape, area = {Area():F2}";',
          '}',
          '',
          'public class Circle : Shape',
          '{',
          '    public double Radius { get; }',
          '    public Circle(double r) => Radius = r;',
          '    public override double Area()',
          '        => Math.PI * Radius * Radius;',
          '}',
          '',
          'public class Rectangle : Shape',
          '{',
          '    public double W { get; }',
          '    public double H { get; }',
          '    public Rectangle(double w, double h) => (W, H) = (w, h);',
          '    public override double Area() => W * H;',
          '    public override string Describe()',
          '        => $"Rect {W}x{H}, area={Area():F2}";',
          '}',
        ],
      },
      {
        title: 'Interfaces & default methods',
        lines: [
          'public interface ISerializable',
          '{',
          '    string Serialize();',
          '}',
          '',
          'public interface ILoggable',
          '{',
          '    // Default interface method (C# 8+)',
          '    void Log() => Console.WriteLine(ToString());',
          '}',
          '',
          'public class User : ISerializable, ILoggable',
          '{',
          '    public string Name { get; set; }',
          '    public string Serialize()',
          '        => $"{{\"name\":\"{Name}\"}}";',
          '}',
          '',
          '// Explicit interface implementation',
          'public class Widget : ISerializable',
          '{',
          '    string ISerializable.Serialize() => "widget-data";',
          '}',
          '// Must cast: ((ISerializable)w).Serialize()',
        ],
      },
      {
        title: 'Polymorphism in action',
        lines: [
          '// Polymorphism -- base reference, derived behavior',
          'Shape[] shapes = {',
          '    new Circle(5),',
          '    new Rectangle(4, 6)',
          '};',
          '',
          'foreach (Shape s in shapes)',
          '{',
          '    Console.WriteLine(s.Describe());',
          '    Console.WriteLine($"  Area: {s.Area():F2}");',
          '}',
          '',
          '// Type checking in polymorphic context',
          'foreach (Shape s in shapes)',
          '{',
          '    if (s is Circle c)',
          '        Console.WriteLine($"  Radius: {c.Radius}");',
          '    else if (s is Rectangle r)',
          '        Console.WriteLine($"  {r.W} x {r.H}");',
          '}',
        ],
      },
    ],
    exercises: [
      {
        question: 'Override the abstract method in the derived class.',
        code: 'public class Dog : Animal\n{\n    public ___ string Speak() => "Woof!";\n}',
        answer: 'override',
        hint: 'The keyword that replaces a virtual or abstract member in a derived class',
      },
      {
        question: 'Implement the interface after the colon in the class declaration.',
        code: 'public class Logger ___ ILoggable\n{\n    public void Log(string msg) { }\n}',
        answer: ':',
        hint: 'The symbol used to denote inheritance or interface implementation',
      },
    ],
  },

  // 9 -- Error Handling -------------------------------------------------------
  {
    id: 'errors',
    title: 'Error Handling',
    icon: <X size={14} />,
    explanation:
      'C# uses structured exception handling with try/catch/finally. Catch blocks filter by exception type and can use the when keyword for conditional catches. The finally block always executes for cleanup. Throw creates or re-throws exceptions. Custom exceptions extend Exception. The exception hierarchy starts with System.Exception, branching to SystemException and ApplicationException. The using statement (and using declaration in C# 8+) ensures IDisposable resources are cleaned up automatically.',
    examples: [
      {
        title: 'try/catch/finally & when filter',
        lines: [
          'static int ParseSafe(string s)',
          '{',
          '    try',
          '    {',
          '        return int.Parse(s);',
          '    }',
          '    catch (FormatException ex)',
          '        when (s.Length > 0)',
          '    {',
          '        Console.WriteLine($"Bad format: {ex.Message}");',
          '        return -1;',
          '    }',
          '    catch (Exception ex)',
          '    {',
          '        Console.WriteLine($"Error: {ex.Message}");',
          '        return -1;',
          '    }',
          '    finally',
          '    {',
          '        Console.WriteLine("Parse attempted.");',
          '    }',
          '}',
          '',
          'Console.WriteLine(ParseSafe("abc")); // -1',
          'Console.WriteLine(ParseSafe("42"));  // 42',
        ],
      },
      {
        title: 'Custom exceptions',
        lines: [
          'public class InsufficientFundsException : Exception',
          '{',
          '    public decimal Amount { get; }',
          '    public decimal Balance { get; }',
          '',
          '    public InsufficientFundsException(',
          '        decimal amount, decimal balance)',
          '        : base($"Cannot withdraw {amount}, balance {balance}")',
          '    {',
          '        Amount = amount;',
          '        Balance = balance;',
          '    }',
          '}',
          '',
          'static void Withdraw(decimal amount, decimal balance)',
          '{',
          '    if (amount > balance)',
          '        throw new InsufficientFundsException(amount, balance);',
          '}',
        ],
      },
      {
        title: 'using statement & IDisposable',
        lines: [
          '// Classic using statement',
          'using (var reader = new StreamReader("file.txt"))',
          '{',
          '    string content = reader.ReadToEnd();',
          '    Console.WriteLine(content);',
          '}  // reader.Dispose() called automatically',
          '',
          '// Using declaration (C# 8+)',
          'static void ReadFile(string path)',
          '{',
          '    using var stream = File.OpenRead(path);',
          '    using var reader = new StreamReader(stream);',
          '    Console.WriteLine(reader.ReadToEnd());',
          '}  // both disposed at end of scope',
          '',
          '// Implementing IDisposable',
          'public class TempFile : IDisposable',
          '{',
          '    public string Path { get; }',
          '    public TempFile() => Path = Path.GetTempFileName();',
          '    public void Dispose() => File.Delete(Path);',
          '}',
        ],
      },
    ],
    exercises: [
      {
        question: 'Complete the catch clause to filter with a condition.',
        code: 'catch (HttpRequestException ex)\n    ___ (ex.StatusCode == 404)\n{\n    Console.WriteLine("Not found");\n}',
        answer: 'when',
        hint: 'The keyword that adds a boolean condition to a catch clause',
      },
      {
        question: 'Complete the custom exception base class call.',
        code: 'public class AppException : ___\n{\n    public AppException(string msg) : base(msg) { }\n}',
        answer: 'Exception',
        hint: 'The root exception class all custom exceptions should derive from',
      },
    ],
  },

  // 10 -- Generics ------------------------------------------------------------
  {
    id: 'generics',
    title: 'Generics',
    icon: <Code size={14} />,
    explanation:
      'Generics enable type-safe, reusable code without boxing or casting. Define generic classes, interfaces, and methods with type parameters in angle brackets. Constraints (where T : ...) restrict what types can be used: class (reference type), struct (value type), new() (parameterless constructor), IInterface, base class, notnull, and unmanaged. Covariance (out T) and contravariance (in T) control type parameter variance in interfaces and delegates -- out means the type is only used as return, in means only as input.',
    examples: [
      {
        title: 'Generic classes & methods',
        lines: [
          '// Generic class',
          'public class Result<T>',
          '{',
          '    public bool Success { get; }',
          '    public T? Value { get; }',
          '    public string? Error { get; }',
          '',
          '    private Result(T value)',
          '        { Success = true; Value = value; }',
          '    private Result(string error)',
          '        { Success = false; Error = error; }',
          '',
          '    public static Result<T> Ok(T value) => new(value);',
          '    public static Result<T> Fail(string err) => new(err);',
          '}',
          '',
          '// Generic method',
          'static T Max<T>(T a, T b) where T : IComparable<T>',
          '    => a.CompareTo(b) >= 0 ? a : b;',
          '',
          'Console.WriteLine(Max(3, 7));       // 7',
          'Console.WriteLine(Max("abc", "z")); // z',
        ],
      },
      {
        title: 'Constraints (where)',
        lines: [
          '// Multiple constraints',
          'public class Repository<T>',
          '    where T : class, IEntity, new()',
          '{',
          '    private readonly List<T> _items = new();',
          '',
          '    public T Create()',
          '    {',
          '        var item = new T(); // needs new()',
          '        _items.Add(item);',
          '        return item;',
          '    }',
          '}',
          '',
          '// struct constraint',
          'static T AddOne<T>(T value) where T : struct, INumber<T>',
          '    => value + T.One;',
          '',
          '// notnull constraint',
          'public class Cache<TKey, TVal>',
          '    where TKey : notnull',
          '{',
          '    private readonly Dictionary<TKey, TVal> _data = new();',
          '}',
        ],
      },
      {
        title: 'Covariance & contravariance',
        lines: [
          '// Covariance (out) -- T used only as return',
          'public interface IProducer<out T>',
          '{',
          '    T Produce();',
          '}',
          '',
          '// Contravariance (in) -- T used only as input',
          'public interface IConsumer<in T>',
          '{',
          '    void Consume(T item);',
          '}',
          '',
          '// Example usage:',
          '// IProducer<Animal> can be assigned',
          '//   from IProducer<Dog>  (covariant)',
          '',
          '// IConsumer<Dog> can be assigned',
          '//   from IConsumer<Animal>  (contravariant)',
          '',
          '// Built-in: IEnumerable<out T>, Func<in T, out R>',
          'IEnumerable<object> items = new List<string>();',
        ],
      },
    ],
    exercises: [
      {
        question: 'Complete the generic constraint requiring a parameterless constructor.',
        code: 'public class Factory<T> where T : class, ___\n{\n    public T Create() => new T();\n}',
        answer: 'new()',
        hint: 'The constraint that requires T to have a public parameterless constructor',
      },
      {
        question: 'Mark the type parameter as covariant.',
        code: 'public interface IReadOnly<___ T>\n{\n    T GetValue();\n}',
        answer: 'out',
        hint: 'The keyword for covariance -- T is only produced, never consumed',
      },
    ],
  },

  // 11 -- LINQ ----------------------------------------------------------------
  {
    id: 'linq',
    title: 'LINQ',
    icon: <Code size={14} />,
    explanation:
      'Language Integrated Query (LINQ) provides a unified query syntax over any IEnumerable<T> or IQueryable<T>. Method syntax chains extension methods like Where(), Select(), OrderBy(), GroupBy(), and Join(). Query syntax uses SQL-like from/where/select keywords. LINQ is lazy -- queries execute only when enumerated (deferred execution). Key methods: First/FirstOrDefault for single items, Any/All for boolean checks, Aggregate for reductions, ToDictionary/ToLookup for grouping, and SelectMany for flattening nested collections.',
    examples: [
      {
        title: 'Where, Select, OrderBy, GroupBy',
        lines: [
          'using System.Linq;',
          '',
          'var students = new[]',
          '{',
          '    new { Name = "Alice", Grade = 92 },',
          '    new { Name = "Bob",   Grade = 78 },',
          '    new { Name = "Carol", Grade = 95 },',
          '    new { Name = "Dave",  Grade = 85 },',
          '    new { Name = "Eve",   Grade = 72 }',
          '};',
          '',
          '// Filter + transform + sort',
          'var honors = students',
          '    .Where(s => s.Grade >= 85)',
          '    .OrderByDescending(s => s.Grade)',
          '    .Select(s => $"{s.Name}: {s.Grade}");',
          '',
          'foreach (var s in honors)',
          '    Console.WriteLine(s);',
          '// Carol: 95',
          '// Alice: 92',
          '// Dave: 85',
        ],
      },
      {
        title: 'Join, Aggregate, Any, All, ToDictionary',
        lines: [
          'var nums = Enumerable.Range(1, 10);',
          '',
          'int sum = nums.Aggregate(0, (acc, n) => acc + n);',
          'Console.WriteLine(sum);  // 55',
          '',
          'bool anyBig = nums.Any(n => n > 8);    // True',
          'bool allPos = nums.All(n => n > 0);    // True',
          '',
          'int first = nums.First(n => n > 5);         // 6',
          'int? maybe = nums.FirstOrDefault(n => n > 99); // 0',
          '',
          '// ToDictionary',
          'var dict = students.ToDictionary(',
          '    s => s.Name,',
          '    s => s.Grade);',
          'Console.WriteLine(dict["Alice"]); // 92',
          '',
          '// SelectMany (flatten)',
          'var words = new[] { "hello world", "foo bar" };',
          'var letters = words.SelectMany(w => w.Split(\' \'));',
          '// ["hello","world","foo","bar"]',
        ],
      },
      {
        title: 'Query syntax & GroupBy',
        lines: [
          '// Query syntax (SQL-like)',
          'var query = from s in students',
          '            where s.Grade >= 80',
          '            orderby s.Grade descending',
          '            select new { s.Name, s.Grade };',
          '',
          '// GroupBy',
          'var byGrade = students.GroupBy(',
          '    s => s.Grade >= 90 ? "A" :',
          '         s.Grade >= 80 ? "B" :',
          '         s.Grade >= 70 ? "C" : "F");',
          '',
          'foreach (var group in byGrade)',
          '{',
          '    Console.WriteLine($"Grade {group.Key}:");',
          '    foreach (var s in group)',
          '        Console.WriteLine($"  {s.Name}");',
          '}',
          '// Grade A:  Alice, Carol',
          '// Grade B:  Dave',
          '// Grade C:  Bob, Eve',
        ],
      },
    ],
    exercises: [
      {
        question: 'Complete the LINQ query to filter even numbers.',
        code: 'var evens = numbers.Where(n => ___);',
        answer: 'n % 2 == 0',
        hint: 'Use the modulo operator to check divisibility by 2',
      },
      {
        question: 'Use LINQ to get the first element greater than 10, or -1 if none.',
        code: 'int val = nums.___(n => n > 10, -1);',
        answer: 'FirstOrDefault',
        hint: 'Returns the first match or a default value if no match exists',
      },
    ],
  },

  // 12 -- Async & Delegates ---------------------------------------------------
  {
    id: 'async-delegates',
    title: 'Async & Delegates',
    icon: <BookOpen size={14} />,
    explanation:
      'C# async/await uses Task and Task<T> for asynchronous operations without blocking threads. Mark methods async and return Task or Task<T>; use await to suspend until the task completes. ValueTask<T> avoids heap allocation for synchronous fast paths. Delegates are type-safe function pointers -- Action<T> (void), Func<T,TResult> (returns value), and Predicate<T> (returns bool) are built-in. Events combine delegates with the observer pattern. Lambda expressions provide concise anonymous function syntax. The standard event pattern uses EventHandler<TEventArgs>.',
    examples: [
      {
        title: 'async/await, Task, ValueTask',
        lines: [
          'using System.Net.Http;',
          'using System.Threading.Tasks;',
          '',
          'public class ApiClient',
          '{',
          '    private readonly HttpClient _http = new();',
          '',
          '    public async Task<string> GetAsync(string url)',
          '    {',
          '        var response = await _http.GetAsync(url);',
          '        response.EnsureSuccessStatusCode();',
          '        return await response.Content.ReadAsStringAsync();',
          '    }',
          '',
          '    // ValueTask for cache-hit fast path',
          '    private string? _cache;',
          '    public async ValueTask<string> GetCachedAsync(string url)',
          '    {',
          '        if (_cache is not null) return _cache;',
          '        _cache = await GetAsync(url);',
          '        return _cache;',
          '    }',
          '}',
          '',
          '// Parallel tasks',
          'var t1 = client.GetAsync("/api/users");',
          'var t2 = client.GetAsync("/api/posts");',
          'await Task.WhenAll(t1, t2);',
        ],
      },
      {
        title: 'Delegates: Action, Func, Predicate, lambdas',
        lines: [
          '// Func<T, TResult> -- has return value',
          'Func<int, int, int> add = (a, b) => a + b;',
          'Console.WriteLine(add(3, 4));  // 7',
          '',
          '// Action<T> -- void return',
          'Action<string> log = msg',
          '    => Console.WriteLine($"[LOG] {msg}");',
          'log("Started");',
          '',
          '// Predicate<T> -- returns bool',
          'Predicate<int> isEven = n => n % 2 == 0;',
          'Console.WriteLine(isEven(4));  // True',
          '',
          '// Method group conversion',
          'var nums = new List<int> { 1, 2, 3, 4, 5 };',
          'nums.RemoveAll(isEven);',
          '// nums = [1, 3, 5]',
          '',
          '// Multiline lambda',
          'Func<string, string> process = input =>',
          '{',
          '    var trimmed = input.Trim();',
          '    return trimmed.ToUpper();',
          '};',
        ],
      },
      {
        title: 'Events & event pattern',
        lines: [
          '// Custom event args',
          'public class OrderEventArgs : EventArgs',
          '{',
          '    public int OrderId { get; }',
          '    public decimal Total { get; }',
          '    public OrderEventArgs(int id, decimal total)',
          '        => (OrderId, Total) = (id, total);',
          '}',
          '',
          'public class OrderService',
          '{',
          '    public event EventHandler<OrderEventArgs>? OrderPlaced;',
          '',
          '    public void PlaceOrder(int id, decimal total)',
          '    {',
          '        // ... process order',
          '        OrderPlaced?.Invoke(this,',
          '            new OrderEventArgs(id, total));',
          '    }',
          '}',
          '',
          '// Subscribe',
          'var svc = new OrderService();',
          'svc.OrderPlaced += (sender, e) =>',
          '    Console.WriteLine($"Order #{e.OrderId}: ${e.Total}");',
          'svc.PlaceOrder(1, 29.99m);',
        ],
      },
    ],
    exercises: [
      {
        question: 'Complete the async method signature returning a string Task.',
        code: 'public ___ Task<string> FetchAsync(string url)\n{\n    return await client.GetStringAsync(url);\n}',
        answer: 'async',
        hint: 'The keyword that marks a method as asynchronous',
      },
      {
        question: 'Declare a Func that takes two ints and returns their sum.',
        code: 'Func<int, int, int> add = (a, b) => ___;',
        answer: 'a + b',
        hint: 'Simply return the sum of the two lambda parameters',
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Syntax highlighting
// ---------------------------------------------------------------------------

const CS_KEYWORDS = new Set([
  'using','namespace','class','struct','interface','enum','record','abstract',
  'sealed','static','partial','void','return','if','else','for','foreach',
  'while','do','switch','case','default','break','continue','goto',
  'try','catch','finally','throw','new','this','base',
  'public','private','protected','internal','virtual','override',
  'async','await','var','const','readonly','ref','out','in',
  'true','false','null','is','as','not','where','from',
  'select','orderby','descending','ascending','get','set','init',
  'event','delegate','yield','typeof','nameof','when','with',
  'params','dynamic','notnull','unmanaged',
]);

const CS_TYPES = new Set([
  'int','string','bool','double','float','decimal','char','byte',
  'long','short','object','dynamic','Task','ValueTask','List',
  'Dictionary','HashSet','Queue','Stack','Array','IEnumerable',
  'IQueryable','IComparable','INumber','IEntity','IDisposable',
  'Action','Func','Predicate','EventHandler','EventArgs',
  'Console','String','Math','File','Path','StreamReader',
  'HttpClient','HttpRequestException','Exception','ArgumentException',
  'FormatException','DivideByZeroException','InvalidOperationException',
  'Result','Repository','Cache','Singleton','MathUtils','MathHelper',
  'StringExtensions','Shape','Circle','Rectangle','Person','Point',
  'Product','Account','Order','OrderEventArgs','OrderService',
  'ApiClient','TempFile','Box','Config','Dog','Animal','User',
  'Widget','Logger','Button','ISerializable','ILoggable',
  'IProducer','IConsumer','IReadOnly','ITrainable','Enumerable',
]);

function highlightLine(line: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  let i = 0;
  let key = 0;

  while (i < line.length) {
    // Single-line comment
    if (line[i] === '/' && line[i + 1] === '/') {
      nodes.push(
        <span key={key++} className="text-gray-500">{line.slice(i)}</span>
      );
      break;
    }

    // Strings (regular, verbatim, interpolated, raw)
    if (
      line[i] === '"' ||
      (line[i] === '$' && line[i + 1] === '"') ||
      (line[i] === '@' && line[i + 1] === '"')
    ) {
      const start = i;
      if (line[i] === '$' || line[i] === '@') i++;
      i++;
      while (i < line.length) {
        if (line[i] === '\\') { i += 2; continue; }
        if (line[i] === '"') { i++; break; }
        i++;
      }
      nodes.push(
        <span key={key++} className="text-green-400">{line.slice(start, i)}</span>
      );
      continue;
    }

    // Char literals
    if (line[i] === "'" && i + 2 < line.length) {
      const start = i;
      i++;
      if (line[i] === '\\') i++;
      i++;
      if (i < line.length && line[i] === "'") i++;
      nodes.push(
        <span key={key++} className="text-green-400">{line.slice(start, i)}</span>
      );
      continue;
    }

    // Numbers
    if (/\d/.test(line[i]) && (i === 0 || /[\s(,=[\-+*/<>:;{!?]/.test(line[i - 1]))) {
      const start = i;
      while (i < line.length && /[\d._fFmMdDlL]/.test(line[i])) i++;
      nodes.push(
        <span key={key++} className="text-orange-400">{line.slice(start, i)}</span>
      );
      continue;
    }

    // Identifiers / keywords / types
    if (/[a-zA-Z_]/.test(line[i])) {
      const start = i;
      while (i < line.length && /[a-zA-Z0-9_]/.test(line[i])) i++;
      const word = line.slice(start, i);

      if (CS_TYPES.has(word)) {
        nodes.push(
          <span key={key++} className="text-purple-400">{word}</span>
        );
      } else if (CS_KEYWORDS.has(word)) {
        nodes.push(
          <span key={key++} className="text-blue-400">{word}</span>
        );
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

export const CSharpLab: React.FC = () => {
  const [activeTopic, setActiveTopic] = useState<string>('intro');
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [results, setResults] = useState<Record<string, boolean | null>>({});
  const [showHint, setShowHint] = useState<Record<string, boolean>>({});

  const currentTopic = topics.find((t) => t.id === activeTopic) ?? topics[0];

  const exKey = (topicId: string, idx: number) => `${topicId}_${idx}`;

  const handleCheck = (eIdx: number) => {
    const k = exKey(activeTopic, eIdx);
    const trimmed = (inputs[k] ?? '').trim();
    const expected = currentTopic.exercises[eIdx].answer.trim();
    setResults((prev) => ({ ...prev, [k]: trimmed === expected }));
  };

  const handleReset = (eIdx: number) => {
    const k = exKey(activeTopic, eIdx);
    setInputs((prev) => ({ ...prev, [k]: '' }));
    setResults((prev) => ({ ...prev, [k]: null }));
    setShowHint((prev) => ({ ...prev, [k]: false }));
  };

  const completedCount = topics.filter((t) =>
    t.exercises.every((_, i) => results[exKey(t.id, i)] === true)
  ).length;

  return (
    <div className="h-full flex flex-col overflow-hidden bg-gradient-to-br from-slate-50 to-purple-50 dark:from-gray-950 dark:to-purple-950/20">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-200 dark:border-gray-800 bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm">
        <Code size={16} className="text-purple-600 dark:text-purple-400" />
        <h1 className="text-sm font-semibold text-slate-800 dark:text-gray-100">
          C# Lab
        </h1>
        <span className="text-[11px] text-slate-400 dark:text-gray-500 ml-1">
          Interactive Reference &amp; Practice
        </span>
        <span className="ml-auto text-[11px] text-slate-400 dark:text-gray-500">
          {completedCount}/{topics.length} completed
        </span>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-56 shrink-0 border-r border-slate-200 dark:border-gray-800 bg-white/40 dark:bg-gray-900/40 overflow-y-auto">
          <nav className="py-2">
            {topics.map((t, tIdx) => {
              const isActive = activeTopic === t.id;
              const isDone = t.exercises.every(
                (_, i) => results[exKey(t.id, i)] === true
              );
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveTopic(t.id)}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-left text-[13px] transition-colors ${
                    isActive
                      ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 font-medium'
                      : 'text-slate-600 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-gray-800/50'
                  }`}
                >
                  <span className="text-[11px] text-slate-400 dark:text-gray-600 w-4 text-right shrink-0">
                    {tIdx + 1}
                  </span>
                  <span className="shrink-0">{t.icon}</span>
                  <span className="truncate flex-1">{t.title}</span>
                  {isDone && (
                    <Check size={12} className="text-emerald-500 shrink-0" />
                  )}
                  {isActive && !isDone && (
                    <ChevronRight size={12} className="shrink-0 opacity-50" />
                  )}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Topic title */}
          <div className="flex items-center gap-2">
            <span className="text-purple-600 dark:text-purple-400">
              {currentTopic.icon}
            </span>
            <h2 className="text-lg font-semibold text-slate-800 dark:text-gray-100">
              {currentTopic.title}
            </h2>
          </div>

          {/* Explanation */}
          <p className="text-[13px] leading-relaxed text-slate-600 dark:text-gray-400 max-w-2xl">
            {currentTopic.explanation}
          </p>

          {/* Code examples */}
          {currentTopic.examples.map((ex, eIdx) => (
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
            </div>
          ))}

          {/* Exercises */}
          {currentTopic.exercises.map((exercise, eIdx) => {
            const k = exKey(activeTopic, eIdx);
            const currentInput = inputs[k] ?? '';
            const currentResult = results[k] ?? null;

            return (
              <div
                key={eIdx}
                className="max-w-2xl border border-slate-200 dark:border-gray-800 rounded-lg bg-white dark:bg-gray-900/60 overflow-hidden"
              >
                <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 dark:bg-gray-800/40 border-b border-slate-200 dark:border-gray-800">
                  <BookOpen size={13} className="text-amber-500" />
                  <span className="text-[13px] font-medium text-slate-700 dark:text-gray-300">
                    Exercise {eIdx + 1}
                  </span>
                  {currentResult === true && (
                    <Check size={12} className="text-emerald-500 ml-auto" />
                  )}
                </div>

                <div className="p-4 space-y-3">
                  <p className="text-[13px] text-slate-700 dark:text-gray-300">
                    {exercise.question}
                  </p>

                  {/* Code with blank */}
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
                        value={currentInput}
                        onChange={(e) => {
                          setInputs((prev) => ({
                            ...prev,
                            [k]: e.target.value,
                          }));
                          if (currentResult !== null) {
                            setResults((prev) => ({
                              ...prev,
                              [k]: null,
                            }));
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && currentInput.trim())
                            handleCheck(eIdx);
                        }}
                        placeholder="Type your answer..."
                        className={`w-full px-3 py-2 text-[13px] rounded-md border bg-white dark:bg-gray-800 text-slate-800 dark:text-gray-200 placeholder-slate-400 dark:placeholder-gray-600 outline-none transition-colors ${
                          currentResult === true
                            ? 'border-emerald-400 dark:border-emerald-500'
                            : currentResult === false
                            ? 'border-red-400 dark:border-red-500'
                            : 'border-slate-300 dark:border-gray-700 focus:border-purple-400 dark:focus:border-purple-500'
                        }`}
                      />
                      {currentResult === true && (
                        <Check
                          size={14}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-emerald-500"
                        />
                      )}
                      {currentResult === false && (
                        <X
                          size={14}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-red-500"
                        />
                      )}
                    </div>

                    <button
                      onClick={() => handleCheck(eIdx)}
                      disabled={!currentInput.trim()}
                      className="flex items-center gap-1.5 px-3 py-2 text-[12px] font-medium rounded-md bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronRight size={12} />
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
                  {currentResult === true && (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
                      <Check
                        size={14}
                        className="text-emerald-600 dark:text-emerald-400"
                      />
                      <span className="text-[12px] text-emerald-700 dark:text-emerald-300">
                        Correct! Well done.
                      </span>
                    </div>
                  )}

                  {currentResult === false && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                        <X
                          size={14}
                          className="text-red-600 dark:text-red-400"
                        />
                        <span className="text-[12px] text-red-700 dark:text-red-300">
                          Not quite. Try again or check the hint.
                        </span>
                      </div>
                      {!showHint[k] && (
                        <button
                          onClick={() =>
                            setShowHint((prev) => ({ ...prev, [k]: true }))
                          }
                          className="text-[12px] text-purple-600 dark:text-purple-400 hover:underline"
                        >
                          Show hint
                        </button>
                      )}
                    </div>
                  )}

                  {showHint[k] && (
                    <div className="flex items-start gap-2 px-3 py-2 rounded-md bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800">
                      <BookOpen
                        size={14}
                        className="text-amber-500 mt-0.5 shrink-0"
                      />
                      <span className="text-[12px] text-amber-700 dark:text-amber-300">
                        {exercise.hint}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Navigation */}
          <div className="max-w-2xl flex items-center justify-between pt-2 pb-6">
            <button
              onClick={() => {
                const idx = topics.findIndex((t) => t.id === activeTopic);
                if (idx > 0) setActiveTopic(topics[idx - 1].id);
              }}
              disabled={topics.findIndex((t) => t.id === activeTopic) === 0}
              className="flex items-center gap-1.5 px-3 py-2 text-[12px] font-medium rounded-md border border-slate-300 dark:border-gray-700 text-slate-600 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={12} className="rotate-180" />
              Previous
            </button>
            <span className="text-[11px] text-slate-400 dark:text-gray-500">
              {topics.findIndex((t) => t.id === activeTopic) + 1} /{' '}
              {topics.length}
            </span>
            <button
              onClick={() => {
                const idx = topics.findIndex((t) => t.id === activeTopic);
                if (idx < topics.length - 1)
                  setActiveTopic(topics[idx + 1].id);
              }}
              disabled={
                topics.findIndex((t) => t.id === activeTopic) ===
                topics.length - 1
              }
              className="flex items-center gap-1.5 px-3 py-2 text-[12px] font-medium rounded-md bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
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
