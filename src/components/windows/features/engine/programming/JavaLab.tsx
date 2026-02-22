import React, { useState } from 'react';
import { BookOpen, Code, ChevronRight, Check, X, RotateCcw } from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Exercise {
  prompt: string;
  template: string;
  answer: string;
  hint: string;
}

interface CodeExample {
  title: string;
  code: string;
}

interface Topic {
  id: string;
  label: string;
  explanation: string;
  examples: CodeExample[];
  exercises: Exercise[];
}

// ─── Syntax Highlighting ─────────────────────────────────────────────────────

const KW = new Set([
  'public','private','protected','static','final','void','class','interface',
  'abstract','extends','implements','new','return','if','else','for','while',
  'do','switch','case','break','continue','default','try','catch','finally',
  'throw','throws','import','package','this','super','instanceof','enum',
  'synchronized','volatile','transient','native','var','yield','record',
  'sealed','permits','non-sealed','module','requires','exports','opens',
]);

const TY = new Set([
  'int','long','double','float','boolean','char','byte','short',
  'String','Integer','Long','Double','Float','Boolean','Character','Byte','Short',
  'Object','ArrayList','LinkedList','HashMap','TreeMap','HashSet','TreeSet',
  'List','Map','Set','Queue','Deque','Iterator','Collections','Arrays',
  'Optional','Stream','IntStream','Collectors','Comparable','Comparator',
  'Exception','RuntimeException','IOException','NullPointerException',
  'IllegalArgumentException','ArithmeticException','NumberFormatException',
  'Predicate','Function','Consumer','Supplier','BiFunction',
  'StringBuilder','StringBuffer','Math','System','Scanner','BufferedReader',
  'AutoCloseable','Closeable','Iterable','CompletableFuture',
]);

function hl(code: string): React.ReactNode[] {
  return code.split('\n').map((line, li) => {
    const spans: React.ReactNode[] = [];
    let i = 0;
    while (i < line.length) {
      if (line[i] === '@' && /[A-Za-z]/.test(line[i + 1] || '')) {
        let e = i + 1;
        while (e < line.length && /[A-Za-z0-9_]/.test(line[e])) e++;
        spans.push(<span key={`${li}-${i}`} className="text-yellow-400">{line.slice(i, e)}</span>);
        i = e; continue;
      }
      if (line[i] === '/' && line[i + 1] === '/') {
        spans.push(<span key={`${li}-${i}`} className="text-gray-500">{line.slice(i)}</span>);
        i = line.length; continue;
      }
      if (line[i] === '"') {
        let e = i + 1;
        while (e < line.length && line[e] !== '"') { if (line[e] === '\\') e++; e++; }
        e = Math.min(e + 1, line.length);
        spans.push(<span key={`${li}-${i}`} className="text-green-400">{line.slice(i, e)}</span>);
        i = e; continue;
      }
      if (line[i] === "'") {
        let e = i + 1;
        if (e < line.length && line[e] === '\\') e++;
        e += 2; e = Math.min(e, line.length);
        spans.push(<span key={`${li}-${i}`} className="text-green-400">{line.slice(i, e)}</span>);
        i = e; continue;
      }
      if (/[0-9]/.test(line[i]) && (i === 0 || !/[A-Za-z_]/.test(line[i - 1]))) {
        let e = i;
        while (e < line.length && /[0-9.fFdDlLxXabcdefABCDEF_]/.test(line[e])) e++;
        spans.push(<span key={`${li}-${i}`} className="text-orange-400">{line.slice(i, e)}</span>);
        i = e; continue;
      }
      if (/[A-Za-z_$]/.test(line[i])) {
        let e = i;
        while (e < line.length && /[A-Za-z0-9_$]/.test(line[e])) e++;
        const w = line.slice(i, e);
        if (KW.has(w)) spans.push(<span key={`${li}-${i}`} className="text-blue-400 font-semibold">{w}</span>);
        else if (TY.has(w)) spans.push(<span key={`${li}-${i}`} className="text-purple-400">{w}</span>);
        else spans.push(<span key={`${li}-${i}`} className="text-gray-200">{w}</span>);
        i = e; continue;
      }
      spans.push(<span key={`${li}-${i}`} className="text-gray-400">{line[i]}</span>);
      i++;
    }
    return <div key={li} className="leading-relaxed">{spans.length > 0 ? spans : '\u00A0'}</div>;
  });
}

// ─── Topics Data ─────────────────────────────────────────────────────────────

const TOPICS: Topic[] = [
  // ── 1. Introduction ──────────────────────────────────────────────────────
  {
    id: 'intro',
    label: '1. Introduction',
    explanation:
      'Java is a statically-typed, object-oriented language created by James Gosling at Sun Microsystems in 1995. It compiles to bytecode via javac, which runs on the Java Virtual Machine (JVM), enabling "write once, run anywhere" portability. The JDK (Java Development Kit) contains the compiler and tools; the JRE (Java Runtime Environment) runs programs; and the JVM interprets bytecode. Java dominates enterprise backends (Spring), Android development, and large-scale distributed systems. Every Java program begins execution from the public static void main(String[] args) method inside a class.',
    examples: [
      {
        title: 'HelloWorld.java',
        code: `// Every Java file must contain a class matching its filename
public class HelloWorld {
    // Entry point - JVM calls this method first
    public static void main(String[] args) {
        System.out.println("Hello, World!");
        System.out.println("Java version: " + System.getProperty("java.version"));
    }
}
// Compile: javac HelloWorld.java
// Run:     java HelloWorld`,
      },
      {
        title: 'JVM Architecture',
        code: `// JDK vs JRE vs JVM
// JDK = JRE + compiler (javac) + tools (javadoc, jar)
// JRE = JVM + standard libraries (java.lang, java.util)
// JVM = bytecode interpreter + JIT compiler + GC

public class JvmDemo {
    public static void main(String[] args) {
        // Runtime info
        Runtime rt = Runtime.getRuntime();
        System.out.println("Max memory: " + rt.maxMemory() / 1024 / 1024 + " MB");
        System.out.println("Available processors: " + rt.availableProcessors());
        System.out.println("OS: " + System.getProperty("os.name"));
    }
}`,
      },
      {
        title: 'Command-Line Arguments',
        code: `public class ArgsDemo {
    public static void main(String[] args) {
        // args array holds command-line arguments
        if (args.length == 0) {
            System.out.println("No arguments provided");
            System.out.println("Usage: java ArgsDemo <name> <age>");
            return;
        }
        for (int i = 0; i < args.length; i++) {
            System.out.println("arg[" + i + "] = " + args[i]);
        }
    }
}
// java ArgsDemo Alice 25`,
      },
    ],
    exercises: [
      {
        prompt: 'Complete the main method signature:',
        template: 'public static void ___(String[] args)',
        answer: 'main',
        hint: 'The entry point method that the JVM looks for when starting a program.',
      },
      {
        prompt: 'Which tool compiles Java source code to bytecode?',
        template: 'Compile with: ___ HelloWorld.java',
        answer: 'javac',
        hint: 'The Java compiler command-line tool (not java, which runs bytecode).',
      },
    ],
  },

  // ── 2. Variables & Types ─────────────────────────────────────────────────
  {
    id: 'variables',
    label: '2. Variables & Types',
    explanation:
      'Java has 8 primitive types: byte (8-bit), short (16-bit), int (32-bit), long (64-bit), float (32-bit decimal), double (64-bit decimal), char (16-bit Unicode), and boolean. Each primitive has a corresponding wrapper class (Integer, Double, etc.) for use with generics and collections. Strings are immutable reference types. The var keyword (Java 10+) enables local type inference. The final keyword makes variables unassignable after initialization. Type casting converts between compatible types -- widening is implicit, narrowing requires explicit casts.',
    examples: [
      {
        title: 'Primitive Types',
        code: `public class Primitives {
    public static void main(String[] args) {
        byte b = 127;            // -128 to 127
        short s = 32767;         // -32768 to 32767
        int i = 2_147_483_647;   // underscores for readability
        long l = 9_223_372_036_854_775_807L; // suffix L
        float f = 3.14f;         // suffix f required
        double d = 3.141592653589793;
        char c = 'A';            // single character
        boolean flag = true;

        System.out.println("byte: " + b);
        System.out.println("int max: " + i);
        System.out.println("long: " + l);
        System.out.println("float: " + f);
        System.out.println("double: " + d);
        System.out.println("char: " + c + " (code " + (int) c + ")");
    }
}`,
      },
      {
        title: 'Wrappers, var, final',
        code: `public class WrapperDemo {
    public static void main(String[] args) {
        // Wrapper classes (autoboxing/unboxing)
        Integer boxed = 42;         // autoboxing: int -> Integer
        int unboxed = boxed;        // unboxing: Integer -> int
        Double pi = Double.valueOf(3.14);
        String numStr = Integer.toString(255, 16); // "ff" (hex)

        // var - local type inference (Java 10+)
        var name = "Alice";         // inferred as String
        var count = 100;            // inferred as int
        var list = new java.util.ArrayList<String>();

        // final - cannot be reassigned
        final int MAX_SIZE = 1024;
        final String GREETING = "Hello";
        // MAX_SIZE = 2048; // ERROR: cannot assign to final

        System.out.println("Boxed: " + boxed);
        System.out.println("Hex: " + numStr);
        System.out.println("Name type: " + name.getClass().getSimpleName());
    }
}`,
      },
      {
        title: 'Type Casting',
        code: `public class CastingDemo {
    public static void main(String[] args) {
        // Widening (implicit) - no data loss
        int myInt = 100;
        long myLong = myInt;       // int -> long
        double myDouble = myLong;  // long -> double

        // Narrowing (explicit) - possible data loss
        double price = 9.99;
        int rounded = (int) price; // truncates to 9
        byte small = (byte) 300;   // wraps: 300 - 256 = 44

        // String conversions
        String s = String.valueOf(42);       // int -> String
        int parsed = Integer.parseInt("123"); // String -> int
        double pd = Double.parseDouble("3.14");

        System.out.println("Widened: " + myDouble);
        System.out.println("Narrowed: " + rounded);
        System.out.println("Wrapped byte: " + small);
        System.out.println("Parsed: " + parsed);
    }
}`,
      },
    ],
    exercises: [
      {
        prompt: 'Declare a constant integer MAX_SIZE with value 50:',
        template: '___ int MAX_SIZE = 50;',
        answer: 'final',
        hint: 'The keyword that prevents reassignment of a variable.',
      },
      {
        prompt: 'Parse the string "42" into an int:',
        template: 'int num = Integer.___(\"42\");',
        answer: 'parseInt',
        hint: 'The static method on Integer that converts a String to a primitive int.',
      },
    ],
  },

  // ── 3. Operators ─────────────────────────────────────────────────────────
  {
    id: 'operators',
    label: '3. Operators',
    explanation:
      'Java provides arithmetic operators (+, -, *, /, %), comparison operators (==, !=, <, >, <=, >=), logical operators (&&, ||, !), bitwise operators (&, |, ^, ~, <<, >>), the instanceof type-check operator, the ternary conditional (?:), and compound assignment operators (+=, -=, etc.). Integer division truncates toward zero. The % operator works with both integers and floating point. The instanceof operator tests whether an object is an instance of a class or interface.',
    examples: [
      {
        title: 'Arithmetic & Comparison',
        code: `public class Operators {
    public static void main(String[] args) {
        // Arithmetic
        int a = 17, b = 5;
        System.out.println("17 / 5 = " + (a / b));   // 3 (truncated)
        System.out.println("17 % 5 = " + (a % b));   // 2 (remainder)
        System.out.println("17.0 / 5 = " + (17.0 / 5)); // 3.4

        // Comparison
        System.out.println("5 == 5: " + (5 == 5));   // true
        System.out.println("5 != 3: " + (5 != 3));   // true

        // Ternary operator
        int max = (a > b) ? a : b;
        System.out.println("Max: " + max);

        // Compound assignment
        int x = 10;
        x += 5;  // x = x + 5 = 15
        x *= 2;  // x = x * 2 = 30
        x %= 7;  // x = x % 7 = 2
        System.out.println("x: " + x);
    }
}`,
      },
      {
        title: 'Logical, Bitwise & instanceof',
        code: `public class LogicalOps {
    public static void main(String[] args) {
        // Logical (short-circuit)
        boolean t = true, f = false;
        System.out.println("t && f: " + (t && f)); // false
        System.out.println("t || f: " + (t || f)); // true
        System.out.println("!t: " + !t);           // false

        // Bitwise operators
        int a = 0b1010; // 10 in binary
        int b = 0b1100; // 12 in binary
        System.out.println("a & b = " + (a & b));  // 8  (1000)
        System.out.println("a | b = " + (a | b));  // 14 (1110)
        System.out.println("a ^ b = " + (a ^ b));  // 6  (0110)
        System.out.println("a << 1 = " + (a << 1)); // 20
        System.out.println("a >> 1 = " + (a >> 1)); // 5

        // instanceof
        Object obj = "Hello";
        System.out.println("Is String: " + (obj instanceof String));
        System.out.println("Is Integer: " + (obj instanceof Integer));
    }
}`,
      },
    ],
    exercises: [
      {
        prompt: 'What operator gives the remainder of integer division?',
        template: 'int remainder = 17 ___ 5; // equals 2',
        answer: '%',
        hint: 'The modulo operator, used to find the remainder after division.',
      },
      {
        prompt: 'Complete the type-check expression:',
        template: 'if (obj ___ String) { /* is a String */ }',
        answer: 'instanceof',
        hint: 'The keyword that tests whether an object is an instance of a type.',
      },
    ],
  },

  // ── 4. Control Flow ──────────────────────────────────────────────────────
  {
    id: 'control',
    label: '4. Control Flow',
    explanation:
      'Java provides if/else for conditional branching, the classic switch statement, and enhanced switch expressions (Java 14+) with arrow syntax that return values. Loop constructs include the standard for loop, the enhanced for-each loop for iterating over arrays and Iterables, while and do-while loops. The break statement exits a loop, continue skips to the next iteration, and labeled break/continue target specific outer loops in nested structures.',
    examples: [
      {
        title: 'If/Else & Switch Expressions',
        code: `public class ControlFlow {
    public static void main(String[] args) {
        int score = 85;

        // If-else chain
        String grade;
        if (score >= 90) grade = "A";
        else if (score >= 80) grade = "B";
        else if (score >= 70) grade = "C";
        else grade = "F";
        System.out.println("Grade: " + grade);

        // Enhanced switch expression (Java 14+)
        String day = "WEDNESDAY";
        String type = switch (day) {
            case "MONDAY", "FRIDAY" -> "Busy day";
            case "SATURDAY", "SUNDAY" -> "Weekend";
            default -> "Regular day";
        };
        System.out.println(day + ": " + type);

        // Switch with yield (multi-line cases)
        int numLetters = switch (day) {
            case "MONDAY", "FRIDAY", "SUNDAY" -> 6;
            case "TUESDAY" -> 7;
            default -> {
                System.out.println("Counting " + day);
                yield day.length();
            }
        };
        System.out.println("Letters: " + numLetters);
    }
}`,
      },
      {
        title: 'Loops & Control Statements',
        code: `public class Loops {
    public static void main(String[] args) {
        // Standard for loop
        for (int i = 0; i < 5; i++) {
            System.out.print(i + " ");
        }
        System.out.println();

        // Enhanced for-each
        String[] fruits = {"apple", "banana", "cherry"};
        for (String fruit : fruits) {
            System.out.println("Fruit: " + fruit);
        }

        // While loop
        int n = 1;
        while (n <= 16) {
            System.out.print(n + " ");
            n *= 2;
        }
        System.out.println();

        // Do-while (runs at least once)
        int x = 0;
        do {
            System.out.println("x = " + x);
            x += 5;
        } while (x < 10);

        // Labeled break for nested loops
        outer:
        for (int i = 0; i < 3; i++) {
            for (int j = 0; j < 3; j++) {
                if (i == 1 && j == 1) break outer;
                System.out.println("i=" + i + " j=" + j);
            }
        }
    }
}`,
      },
    ],
    exercises: [
      {
        prompt: 'Complete the enhanced for-each loop syntax:',
        template: 'for (String item ___ names) { }',
        answer: ':',
        hint: 'The separator between the variable and the collection in a for-each loop.',
      },
      {
        prompt: 'Which keyword exits a loop immediately?',
        template: 'if (found) ___ ;',
        answer: 'break',
        hint: 'Terminates the innermost enclosing loop or switch statement.',
      },
    ],
  },

  // ── 5. Arrays & Strings ──────────────────────────────────────────────────
  {
    id: 'arrays',
    label: '5. Arrays & Strings',
    explanation:
      'Arrays are fixed-size, zero-indexed containers of a single type. Multidimensional arrays are arrays of arrays. The Arrays utility class provides sorting, searching, and conversion methods. Strings in Java are immutable objects stored in a special String pool for memory efficiency. Key String methods include charAt, substring, equals, split, trim, and format. StringBuilder offers mutable string building for performance-critical concatenation in loops.',
    examples: [
      {
        title: 'Arrays & 2D Arrays',
        code: `import java.util.Arrays;

public class ArrayDemo {
    public static void main(String[] args) {
        // Declaration and initialization
        int[] nums = {5, 3, 1, 4, 2};
        String[] names = new String[3];
        names[0] = "Alice";
        names[1] = "Bob";
        names[2] = "Charlie";

        // Arrays utility class
        Arrays.sort(nums);
        System.out.println("Sorted: " + Arrays.toString(nums));
        int idx = Arrays.binarySearch(nums, 3);
        System.out.println("Found 3 at index: " + idx);

        // 2D array
        int[][] matrix = {
            {1, 2, 3},
            {4, 5, 6},
            {7, 8, 9}
        };
        System.out.println("Center: " + matrix[1][1]);
        System.out.println("Matrix: " + Arrays.deepToString(matrix));

        // Array copy
        int[] copy = Arrays.copyOfRange(nums, 1, 4);
        System.out.println("Copy: " + Arrays.toString(copy));
    }
}`,
      },
      {
        title: 'String Methods',
        code: `public class StringDemo {
    public static void main(String[] args) {
        String s = "Hello, World!";

        // Basic methods
        System.out.println("Length: " + s.length());
        System.out.println("charAt(0): " + s.charAt(0));
        System.out.println("substring(7): " + s.substring(7));
        System.out.println("substring(0,5): " + s.substring(0, 5));

        // Comparison (NEVER use == for strings)
        String a = "hello";
        String b = "HELLO";
        System.out.println("equals: " + a.equals(b));
        System.out.println("equalsIgnoreCase: " + a.equalsIgnoreCase(b));

        // Search and split
        System.out.println("contains World: " + s.contains("World"));
        System.out.println("indexOf(o): " + s.indexOf('o'));
        String[] parts = "one,two,three".split(",");
        System.out.println("Split: " + java.util.Arrays.toString(parts));

        // Trim and format
        String padded = "  spaces  ";
        System.out.println("Trimmed: '" + padded.trim() + "'");
        System.out.println("Strip: '" + padded.strip() + "'");
        String fmt = String.format("Name: %s, Age: %d", "Alice", 30);
        System.out.println(fmt);
    }
}`,
      },
      {
        title: 'StringBuilder & String Pool',
        code: `public class StringBuilderDemo {
    public static void main(String[] args) {
        // StringBuilder for efficient concatenation
        StringBuilder sb = new StringBuilder();
        for (int i = 1; i <= 5; i++) {
            sb.append("item").append(i);
            if (i < 5) sb.append(", ");
        }
        System.out.println(sb.toString());

        // StringBuilder methods
        sb = new StringBuilder("Hello World");
        sb.insert(5, ",");
        sb.replace(7, 12, "Java");
        sb.reverse();
        System.out.println("Reversed: " + sb);

        // String pool behavior
        String s1 = "hello";       // from string pool
        String s2 = "hello";       // same pool reference
        String s3 = new String("hello"); // new object
        System.out.println("s1 == s2: " + (s1 == s2));     // true
        System.out.println("s1 == s3: " + (s1 == s3));     // false
        System.out.println("s1.equals(s3): " + s1.equals(s3)); // true
    }
}`,
      },
    ],
    exercises: [
      {
        prompt: 'Sort an array using the utility class:',
        template: 'Arrays.___(myArray);',
        answer: 'sort',
        hint: 'The static method from java.util.Arrays that sorts elements in place.',
      },
      {
        prompt: 'Get a portion of a string from index 3 to 7:',
        template: 'String part = text.___(3, 7);',
        answer: 'substring',
        hint: 'The String method that extracts characters between two indices.',
      },
    ],
  },

  // ── 6. Methods ───────────────────────────────────────────────────────────
  {
    id: 'methods',
    label: '6. Methods',
    explanation:
      'Methods in Java belong to classes and have an access modifier, optional static keyword, return type, name, and parameter list. Method overloading allows multiple methods with the same name but different parameter types or counts. Varargs (Type... name) accept variable-length arguments as an array. Java always passes arguments by value -- primitive values are copied, and object references are copied (so the reference cannot be reassigned in the caller, but the object it points to can be mutated). Method chaining returns "this" from setters for fluent APIs.',
    examples: [
      {
        title: 'Overloading & Return Types',
        code: `public class MethodDemo {
    // Method overloading - same name, different params
    public static int add(int a, int b) {
        return a + b;
    }

    public static double add(double a, double b) {
        return a + b;
    }

    public static String add(String a, String b) {
        return a + b;
    }

    // Method with multiple return paths
    public static String classify(int n) {
        if (n > 0) return "positive";
        if (n < 0) return "negative";
        return "zero";
    }

    public static void main(String[] args) {
        System.out.println(add(3, 4));        // 7
        System.out.println(add(2.5, 3.7));    // 6.2
        System.out.println(add("Hi", " Java")); // Hi Java
        System.out.println(classify(-5));      // negative
    }
}`,
      },
      {
        title: 'Varargs & Static Methods',
        code: `public class VarargsDemo {
    // Varargs - variable number of arguments
    public static int sum(int... numbers) {
        int total = 0;
        for (int n : numbers) total += n;
        return total;
    }

    // Varargs must be last parameter
    public static String join(String sep, String... words) {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < words.length; i++) {
            if (i > 0) sb.append(sep);
            sb.append(words[i]);
        }
        return sb.toString();
    }

    // Static vs instance context
    private static int counter = 0;
    public static int getCount() { return counter; }
    public static void increment() { counter++; }

    public static void main(String[] args) {
        System.out.println(sum(1, 2, 3));         // 6
        System.out.println(sum(10, 20, 30, 40));  // 100
        System.out.println(join("-", "a", "b", "c")); // a-b-c
        increment();
        System.out.println("Count: " + getCount()); // 1
    }
}`,
      },
      {
        title: 'Pass by Value & Chaining',
        code: `public class PassByValue {
    // Java is ALWAYS pass by value
    static void tryChange(int x) {
        x = 999; // does NOT affect caller
    }

    static void trySwap(int[] arr) {
        // reference is copied, but object can be mutated
        arr[0] = 999; // DOES affect caller's array
    }

    // Method chaining with builder pattern
    static class Builder {
        String name = "";
        int age = 0;
        Builder setName(String n) { name = n; return this; }
        Builder setAge(int a) { age = a; return this; }
        String build() { return name + " (age " + age + ")"; }
    }

    public static void main(String[] args) {
        int val = 10;
        tryChange(val);
        System.out.println("After tryChange: " + val); // 10

        int[] arr = {1, 2, 3};
        trySwap(arr);
        System.out.println("After trySwap: " + arr[0]); // 999

        // Method chaining
        String result = new Builder()
            .setName("Alice")
            .setAge(30)
            .build();
        System.out.println(result); // Alice (age 30)
    }
}`,
      },
    ],
    exercises: [
      {
        prompt: 'Define a varargs parameter that accepts multiple integers:',
        template: 'public static int sum(int___ numbers)',
        answer: '...',
        hint: 'Three dots after the type indicate variable-length arguments.',
      },
      {
        prompt: 'Complete the method to make it callable without an instance:',
        template: 'public ___ int getMax(int a, int b) { return a > b ? a : b; }',
        answer: 'static',
        hint: 'The keyword that allows calling a method on the class itself.',
      },
    ],
  },

  // ── 7. OOP ───────────────────────────────────────────────────────────────
  {
    id: 'oop',
    label: '7. OOP',
    explanation:
      'Java is fundamentally object-oriented. Classes are blueprints with fields (state) and methods (behavior). Constructors initialize objects (no return type, same name as the class). The "this" keyword refers to the current instance. Encapsulation hides internal state using private fields with public getters/setters. Java has four access modifiers: public (everywhere), protected (same package + subclasses), default/package-private (same package), and private (same class only). Static members belong to the class rather than to instances.',
    examples: [
      {
        title: 'Classes & Constructors',
        code: `public class Person {
    // Fields (instance variables)
    private String name;
    private int age;
    private static int count = 0; // shared across instances

    // Constructor
    public Person(String name, int age) {
        this.name = name;  // "this" distinguishes field from param
        this.age = age;
        count++;
    }

    // Overloaded constructor
    public Person(String name) {
        this(name, 0); // delegate to other constructor
    }

    // Getters and setters (encapsulation)
    public String getName() { return name; }
    public int getAge() { return age; }
    public void setAge(int age) {
        if (age >= 0) this.age = age;
    }

    // Static method
    public static int getCount() { return count; }

    @Override
    public String toString() {
        return name + " (age " + age + ")";
    }
}
// Person p = new Person("Alice", 25);
// System.out.println(p); // Alice (age 25)`,
      },
      {
        title: 'Access Modifiers & Packages',
        code: `// Access modifiers control visibility:
// public       -> accessible from anywhere
// protected    -> same package + subclasses
// (default)    -> same package only (no keyword)
// private      -> same class only

public class BankAccount {
    private double balance;       // only this class
    private String accountId;     // only this class
    protected String ownerName;   // package + subclasses

    public BankAccount(String owner, double initial) {
        this.ownerName = owner;
        this.balance = initial;
        this.accountId = generateId();
    }

    public double getBalance() { return balance; }

    public void deposit(double amount) {
        if (amount > 0) balance += amount;
    }

    public boolean withdraw(double amount) {
        if (amount > 0 && amount <= balance) {
            balance -= amount;
            return true;
        }
        return false;
    }

    // Private helper method
    private String generateId() {
        return "ACC-" + System.currentTimeMillis();
    }
}`,
      },
      {
        title: 'Static vs Instance',
        code: `public class MathUtils {
    // Static field - shared across all uses
    public static final double PI = 3.14159265;
    private static int callCount = 0;

    // Static method - no access to instance fields
    public static double circleArea(double radius) {
        callCount++;
        return PI * radius * radius;
    }

    public static int factorial(int n) {
        callCount++;
        if (n <= 1) return 1;
        return n * factorial(n - 1);
    }

    public static int getCallCount() { return callCount; }

    public static void main(String[] args) {
        // Static - called on class, no object needed
        System.out.println("Area: " + MathUtils.circleArea(5.0));
        System.out.println("5! = " + MathUtils.factorial(5));
        System.out.println("Calls: " + MathUtils.getCallCount());
    }
}`,
      },
    ],
    exercises: [
      {
        prompt: 'What keyword refers to the current object instance?',
        template: '___.name = name;',
        answer: 'this',
        hint: 'The keyword used inside a class to reference the instance itself.',
      },
      {
        prompt: 'Which access modifier restricts to the same class only?',
        template: '___ double balance;',
        answer: 'private',
        hint: 'The most restrictive access modifier in Java.',
      },
    ],
  },

  // ── 8. Inheritance & Interfaces ──────────────────────────────────────────
  {
    id: 'inheritance',
    label: '8. Inheritance',
    explanation:
      'Inheritance allows a class to extend another, inheriting its fields and methods. The "extends" keyword creates a subclass; "super" accesses the parent constructor or methods. Method overriding provides specialized behavior (marked with @Override). Abstract classes cannot be instantiated and may contain abstract methods. Interfaces define contracts with abstract methods; since Java 8 they can have default and static methods. Functional interfaces (one abstract method) enable lambdas. Sealed classes (Java 17+) restrict which classes can extend them.',
    examples: [
      {
        title: 'Extends & Override',
        code: `abstract class Shape {
    protected String color;

    public Shape(String color) { this.color = color; }
    public abstract double area();

    @Override
    public String toString() {
        return color + " " + getClass().getSimpleName() +
               " (area=" + String.format("%.2f", area()) + ")";
    }
}

class Circle extends Shape {
    private double radius;

    public Circle(String color, double radius) {
        super(color); // call parent constructor
        this.radius = radius;
    }

    @Override
    public double area() { return Math.PI * radius * radius; }
}

class Rectangle extends Shape {
    private double w, h;

    public Rectangle(String color, double w, double h) {
        super(color);
        this.w = w; this.h = h;
    }

    @Override
    public double area() { return w * h; }
}
// Circle c = new Circle("red", 5);
// System.out.println(c); // red Circle (area=78.54)`,
      },
      {
        title: 'Interfaces & Default Methods',
        code: `// Interface with abstract + default + static methods
interface Printable {
    void print(); // abstract - must implement

    default void printUpperCase() { // default - optional override
        System.out.println(toString().toUpperCase());
    }

    static String formatHeader(String title) { // static
        return "=== " + title + " ===";
    }
}

// Functional interface (one abstract method)
@FunctionalInterface
interface Transformer<T> {
    T transform(T input);
}

class Document implements Printable {
    private String content;

    public Document(String content) { this.content = content; }

    @Override
    public void print() { System.out.println(content); }

    @Override
    public String toString() { return content; }
}

// Usage:
// Document doc = new Document("Hello");
// doc.print();           // Hello
// doc.printUpperCase();  // HELLO
// Transformer<String> upper = s -> s.toUpperCase();`,
      },
      {
        title: 'Sealed Classes (Java 17+)',
        code: `// Sealed classes restrict which classes can extend them
sealed class Vehicle permits Car, Truck, Motorcycle {
    protected String make;
    public Vehicle(String make) { this.make = make; }
    public String describe() { return make; }
}

final class Car extends Vehicle {
    private int seats;
    public Car(String make, int seats) {
        super(make);
        this.seats = seats;
    }
}

final class Truck extends Vehicle {
    private double payload;
    public Truck(String make, double payload) {
        super(make);
        this.payload = payload;
    }
}

non-sealed class Motorcycle extends Vehicle {
    // non-sealed allows further subclassing
    public Motorcycle(String make) { super(make); }
}

// Pattern matching with sealed classes
// String info = switch (vehicle) {
//     case Car c    -> c.make + " car, seats=" + c.seats;
//     case Truck t  -> t.make + " truck, payload=" + t.payload;
//     case Motorcycle m -> m.make + " motorcycle";
// };`,
      },
    ],
    exercises: [
      {
        prompt: 'Make class Dog inherit from Animal:',
        template: 'class Dog ___ Animal { }',
        answer: 'extends',
        hint: 'The keyword used for class inheritance in Java.',
      },
      {
        prompt: 'Annotate a method that replaces a parent method:',
        template: '___\npublic double area() { return w * h; }',
        answer: '@Override',
        hint: 'The annotation placed before a method that overrides a parent method.',
      },
    ],
  },

  // ── 9. Error Handling ────────────────────────────────────────────────────
  {
    id: 'errors',
    label: '9. Error Handling',
    explanation:
      'Java uses exceptions to handle errors. Checked exceptions (subclasses of Exception but not RuntimeException) must be caught or declared with "throws". Unchecked exceptions (subclasses of RuntimeException) do not require explicit handling. The try-catch-finally pattern catches exceptions; try-with-resources (Java 7+) automatically closes resources that implement AutoCloseable. Multi-catch (Java 7+) handles multiple exception types in one catch block. Custom exceptions extend Exception (checked) or RuntimeException (unchecked).',
    examples: [
      {
        title: 'Try/Catch/Finally',
        code: `public class ErrorDemo {
    public static int safeDivide(int a, int b) {
        try {
            return a / b;
        } catch (ArithmeticException e) {
            System.out.println("Error: " + e.getMessage());
            return 0;
        } finally {
            // Always executes, even if exception occurs
            System.out.println("Division attempted: " + a + "/" + b);
        }
    }

    public static int parseNumber(String s) {
        try {
            return Integer.parseInt(s);
        } catch (NumberFormatException e) {
            System.out.println("Invalid number: " + s);
            return -1;
        }
    }

    public static void main(String[] args) {
        System.out.println("Result: " + safeDivide(10, 0));
        System.out.println("Parsed: " + parseNumber("abc"));
        System.out.println("Parsed: " + parseNumber("42"));
    }
}`,
      },
      {
        title: 'Try-with-Resources & Multi-Catch',
        code: `import java.io.*;

public class ResourceDemo {
    // try-with-resources: auto-closes any AutoCloseable
    public static String readFirstLine(String path) throws IOException {
        try (BufferedReader br = new BufferedReader(new FileReader(path))) {
            return br.readLine();
        }
        // br.close() called automatically, even on exception
    }

    // Multi-catch (Java 7+) - one block for multiple types
    public static void riskyOperation(String input) {
        try {
            int num = Integer.parseInt(input);
            int[] arr = new int[num];
            arr[num] = 42; // ArrayIndexOutOfBoundsException
        } catch (NumberFormatException | ArrayIndexOutOfBoundsException e) {
            System.out.println("Caught: " + e.getClass().getSimpleName());
            System.out.println("Message: " + e.getMessage());
        }
    }

    public static void main(String[] args) {
        riskyOperation("abc"); // NumberFormatException
        riskyOperation("3");   // ArrayIndexOutOfBoundsException
    }
}`,
      },
      {
        title: 'Custom Exceptions & Throws',
        code: `// Custom checked exception
class InsufficientFundsException extends Exception {
    private double amount;

    public InsufficientFundsException(double amount) {
        super("Insufficient funds: need " + amount + " more");
        this.amount = amount;
    }

    public double getAmount() { return amount; }
}

// Custom unchecked exception
class InvalidAgeException extends RuntimeException {
    public InvalidAgeException(int age) {
        super("Invalid age: " + age + " (must be 0-150)");
    }
}

class Wallet {
    private double balance;

    public Wallet(double balance) { this.balance = balance; }

    // Checked: caller must handle or declare
    public void withdraw(double amount) throws InsufficientFundsException {
        if (amount > balance) {
            throw new InsufficientFundsException(amount - balance);
        }
        balance -= amount;
    }

    // Unchecked: no throws clause needed
    public static void validateAge(int age) {
        if (age < 0 || age > 150) throw new InvalidAgeException(age);
    }
}`,
      },
    ],
    exercises: [
      {
        prompt: 'Complete the catch block for arithmetic errors:',
        template: 'try { x = a / b; } ___ (ArithmeticException e) { }',
        answer: 'catch',
        hint: 'The keyword that follows try to handle a specific exception type.',
      },
      {
        prompt: 'Declare that a method can throw IOException:',
        template: 'public void readFile() ___ IOException { }',
        answer: 'throws',
        hint: 'The keyword in the method signature declaring checked exceptions.',
      },
    ],
  },

  // ── 10. Collections ─────────────────────────────────────────────────────
  {
    id: 'collections',
    label: '10. Collections',
    explanation:
      'The Java Collections Framework provides interfaces (List, Set, Map, Queue) and implementations. ArrayList is a resizable array; LinkedList is a doubly-linked list good for frequent insertion. HashSet stores unique elements with O(1) lookup; TreeSet maintains sorted order. HashMap stores key-value pairs with O(1) access; TreeMap keeps keys sorted. Queue/Deque support FIFO/LIFO operations. The Collections utility class provides sorting, searching, and unmodifiable wrappers. Comparable and Comparator define custom ordering.',
    examples: [
      {
        title: 'List & Set',
        code: `import java.util.*;

public class ListSetDemo {
    public static void main(String[] args) {
        // ArrayList - dynamic array
        List<String> names = new ArrayList<>();
        names.add("Charlie");
        names.add("Alice");
        names.add("Bob");
        names.add("Alice"); // duplicates allowed
        Collections.sort(names);
        System.out.println("Sorted: " + names);
        System.out.println("Index of Bob: " + names.indexOf("Bob"));

        // LinkedList - efficient insert/remove
        LinkedList<Integer> linked = new LinkedList<>();
        linked.addFirst(1);
        linked.addLast(3);
        linked.add(1, 2); // insert at index 1
        System.out.println("LinkedList: " + linked);

        // HashSet - unique, unordered, O(1) lookup
        Set<String> unique = new HashSet<>(names);
        System.out.println("Unique: " + unique);

        // TreeSet - unique, sorted
        Set<Integer> sorted = new TreeSet<>(List.of(5, 3, 1, 4, 2, 3));
        System.out.println("TreeSet: " + sorted);
    }
}`,
      },
      {
        title: 'Map & Queue',
        code: `import java.util.*;

public class MapQueueDemo {
    public static void main(String[] args) {
        // HashMap - O(1) get/put
        Map<String, Integer> scores = new HashMap<>();
        scores.put("Alice", 95);
        scores.put("Bob", 87);
        scores.put("Charlie", 92);
        System.out.println("Bob: " + scores.get("Bob"));
        scores.putIfAbsent("Diana", 88);
        scores.merge("Alice", 5, Integer::sum); // 95 + 5

        // Iterate a map
        for (Map.Entry<String, Integer> e : scores.entrySet()) {
            System.out.println(e.getKey() + ": " + e.getValue());
        }

        // TreeMap - sorted by key
        Map<String, Integer> sorted = new TreeMap<>(scores);
        System.out.println("Sorted keys: " + sorted.keySet());

        // Queue (FIFO) and Deque (double-ended)
        Queue<String> queue = new LinkedList<>();
        queue.offer("first");
        queue.offer("second");
        queue.offer("third");
        System.out.println("Poll: " + queue.poll());  // first
        System.out.println("Peek: " + queue.peek());  // second
    }
}`,
      },
      {
        title: 'Comparable & Comparator',
        code: `import java.util.*;

class Student implements Comparable<Student> {
    String name;
    int grade;

    Student(String name, int grade) {
        this.name = name;
        this.grade = grade;
    }

    // Natural ordering by grade
    @Override
    public int compareTo(Student other) {
        return Integer.compare(this.grade, other.grade);
    }

    @Override
    public String toString() { return name + ":" + grade; }
}

public class SortingDemo {
    public static void main(String[] args) {
        List<Student> students = new ArrayList<>(List.of(
            new Student("Alice", 92),
            new Student("Bob", 85),
            new Student("Charlie", 95)
        ));

        // Sort by natural order (Comparable)
        Collections.sort(students);
        System.out.println("By grade: " + students);

        // Sort by name using Comparator
        students.sort(Comparator.comparing(s -> s.name));
        System.out.println("By name: " + students);

        // Reverse order
        students.sort(Comparator.comparingInt((Student s) -> s.grade).reversed());
        System.out.println("Desc grade: " + students);
    }
}`,
      },
    ],
    exercises: [
      {
        prompt: 'Create an immutable list using the Java 9+ factory method:',
        template: 'List<String> items = List.___("a", "b", "c");',
        answer: 'of',
        hint: 'The static method that creates an unmodifiable list from given elements.',
      },
      {
        prompt: 'Get a value from a HashMap by its key:',
        template: 'String val = map.___(\"myKey\");',
        answer: 'get',
        hint: 'The Map method that retrieves the value associated with a given key.',
      },
    ],
  },

  // ── 11. Generics ────────────────────────────────────────────────────────
  {
    id: 'generics',
    label: '11. Generics',
    explanation:
      'Generics enable type-safe code reuse by parameterizing classes, interfaces, and methods with type variables. Generic types are checked at compile time and erased at runtime (type erasure). Bounded type parameters (<T extends Comparable<T>>) restrict acceptable types. Wildcards provide flexibility: <? extends T> (upper bound, producer) reads elements, <? super T> (lower bound, consumer) writes elements -- this is the PECS principle (Producer Extends, Consumer Super). Generic methods declare their own type parameters independently of their class.',
    examples: [
      {
        title: 'Generic Classes',
        code: `// Generic class with two type parameters
class Pair<K, V> {
    private K key;
    private V value;

    public Pair(K key, V value) {
        this.key = key;
        this.value = value;
    }

    public K getKey() { return key; }
    public V getValue() { return value; }

    @Override
    public String toString() { return key + " = " + value; }
}

// Generic stack implementation
class GenericStack<T> {
    private Object[] data;
    private int size = 0;

    @SuppressWarnings("unchecked")
    public GenericStack(int capacity) {
        data = new Object[capacity];
    }

    public void push(T item) { data[size++] = item; }

    @SuppressWarnings("unchecked")
    public T pop() { return (T) data[--size]; }

    public boolean isEmpty() { return size == 0; }
    public int size() { return size; }
}
// Pair<String, Integer> p = new Pair<>("age", 25);
// GenericStack<String> stack = new GenericStack<>(10);`,
      },
      {
        title: 'Generic Methods & Bounded Types',
        code: `import java.util.*;

public class GenericMethods {
    // Generic method - type param declared before return type
    public static <T> List<T> listOf(T... items) {
        List<T> list = new ArrayList<>();
        for (T item : items) list.add(item);
        return list;
    }

    // Bounded type: T must implement Comparable
    public static <T extends Comparable<T>> T findMax(T[] arr) {
        T max = arr[0];
        for (int i = 1; i < arr.length; i++) {
            if (arr[i].compareTo(max) > 0) max = arr[i];
        }
        return max;
    }

    // Multiple bounds: T must be both Comparable and Serializable
    public static <T extends Comparable<T>> T clamp(T val, T min, T max) {
        if (val.compareTo(min) < 0) return min;
        if (val.compareTo(max) > 0) return max;
        return val;
    }

    public static void main(String[] args) {
        List<String> names = listOf("Alice", "Bob", "Charlie");
        System.out.println(names);

        Integer[] nums = {3, 1, 4, 1, 5, 9};
        System.out.println("Max: " + findMax(nums));

        System.out.println("Clamped: " + clamp(15, 0, 10));
    }
}`,
      },
      {
        title: 'Wildcards (PECS)',
        code: `import java.util.*;

public class WildcardDemo {
    // ? extends T -> reads (Producer Extends)
    public static double sumOfList(List<? extends Number> list) {
        double sum = 0;
        for (Number n : list) sum += n.doubleValue();
        return sum;
    }

    // ? super T -> writes (Consumer Super)
    public static void addNumbers(List<? super Integer> list) {
        list.add(1);
        list.add(2);
        list.add(3);
    }

    // Unbounded wildcard - accepts any type
    public static void printList(List<?> list) {
        for (Object item : list) {
            System.out.print(item + " ");
        }
        System.out.println();
    }

    public static void main(String[] args) {
        List<Integer> ints = List.of(1, 2, 3);
        List<Double> doubles = List.of(1.5, 2.5, 3.5);

        // Both work with ? extends Number
        System.out.println("Int sum: " + sumOfList(ints));
        System.out.println("Dbl sum: " + sumOfList(doubles));

        // ? super Integer accepts List<Integer>, List<Number>, List<Object>
        List<Number> nums = new ArrayList<>();
        addNumbers(nums);
        printList(nums); // 1 2 3
    }
}`,
      },
    ],
    exercises: [
      {
        prompt: 'Complete the generic method that returns type T:',
        template: 'public <T> ___ getFirst(List<T> list) { return list.get(0); }',
        answer: 'T',
        hint: 'The return type must match the generic type parameter declared in angle brackets.',
      },
      {
        prompt: 'Bound a type parameter so T must implement Comparable:',
        template: 'public static <T ___ Comparable<T>> T findMin(List<T> list)',
        answer: 'extends',
        hint: 'In generics, this keyword constrains a type parameter to be a subtype.',
      },
    ],
  },

  // ── 12. Streams & Lambdas ───────────────────────────────────────────────
  {
    id: 'streams',
    label: '12. Streams & Lambdas',
    explanation:
      'Lambda expressions (Java 8+) provide concise syntax for implementing functional interfaces -- interfaces with a single abstract method. Core functional interfaces include Predicate<T> (test), Function<T,R> (apply), Consumer<T> (accept), and Supplier<T> (get). The Stream API processes collections declaratively with operations like filter, map, reduce, collect, and flatMap. Streams are lazy (intermediate operations are deferred until a terminal operation triggers processing). Optional<T> safely represents nullable values. Method references (Class::method) offer shorthand for simple lambda delegations.',
    examples: [
      {
        title: 'Lambda Syntax & Functional Interfaces',
        code: `import java.util.*;
import java.util.function.*;

public class LambdaDemo {
    public static void main(String[] args) {
        // Lambda as Comparator
        List<String> names = new ArrayList<>(
            List.of("Charlie", "Alice", "Bob"));
        names.sort((a, b) -> a.length() - b.length());
        System.out.println("By length: " + names);

        // Predicate<T> - boolean test(T t)
        Predicate<Integer> isEven = n -> n % 2 == 0;
        Predicate<Integer> isPositive = n -> n > 0;
        Predicate<Integer> isEvenAndPositive = isEven.and(isPositive);
        System.out.println("4 even+pos: " + isEvenAndPositive.test(4));

        // Function<T,R> - R apply(T t)
        Function<String, Integer> toLength = String::length;
        Function<Integer, String> toStars = n -> "*".repeat(n);
        Function<String, String> pipeline = toLength.andThen(toStars);
        System.out.println("Hello -> " + pipeline.apply("Hello"));

        // Consumer<T> - void accept(T t)
        Consumer<String> shout = s -> System.out.println(s.toUpperCase());
        shout.accept("hello world");

        // Supplier<T> - T get()
        Supplier<Double> random = Math::random;
        System.out.println("Random: " + random.get());
    }
}`,
      },
      {
        title: 'Stream API',
        code: `import java.util.*;
import java.util.stream.*;

public class StreamDemo {
    public static void main(String[] args) {
        List<String> words = List.of(
            "alpha", "bravo", "charlie", "delta", "echo");

        // filter + map + collect
        List<String> result = words.stream()
            .filter(w -> w.length() > 4)
            .map(String::toUpperCase)
            .sorted()
            .collect(Collectors.toList());
        System.out.println("Filtered: " + result);

        // reduce - accumulate to single value
        int totalLen = words.stream()
            .mapToInt(String::length)
            .sum();
        System.out.println("Total chars: " + totalLen);

        // groupingBy collector
        Map<Integer, List<String>> byLen = words.stream()
            .collect(Collectors.groupingBy(String::length));
        System.out.println("By length: " + byLen);

        // flatMap - flatten nested structures
        List<List<Integer>> nested = List.of(
            List.of(1, 2), List.of(3, 4), List.of(5));
        List<Integer> flat = nested.stream()
            .flatMap(Collection::stream)
            .collect(Collectors.toList());
        System.out.println("Flat: " + flat);

        // IntStream range operations
        int sumEvens = IntStream.rangeClosed(1, 20)
            .filter(n -> n % 2 == 0)
            .sum();
        System.out.println("Even sum 1-20: " + sumEvens);
    }
}`,
      },
      {
        title: 'Optional & Method References',
        code: `import java.util.*;
import java.util.stream.*;

public class OptionalDemo {
    // Optional prevents NullPointerException
    public static Optional<String> findUser(int id) {
        if (id == 1) return Optional.of("Alice");
        if (id == 2) return Optional.of("Bob");
        return Optional.empty();
    }

    public static void main(String[] args) {
        // Optional chaining
        String name = findUser(1)
            .map(String::toUpperCase)
            .orElse("Unknown");
        System.out.println("User 1: " + name);

        String missing = findUser(99)
            .orElseGet(() -> "Default User");
        System.out.println("User 99: " + missing);

        // orElseThrow
        // findUser(99).orElseThrow(() ->
        //     new RuntimeException("User not found"));

        // Method references (4 types)
        List<String> names = List.of("alice", "bob", "charlie");

        // 1. Static method ref:  Class::staticMethod
        // 2. Instance method ref: object::method
        // 3. Arbitrary instance:  Class::instanceMethod
        // 4. Constructor ref:     Class::new

        names.stream()
            .map(String::toUpperCase)    // arbitrary instance
            .forEach(System.out::println); // instance method ref

        // Constructor reference
        List<String> words = List.of("hello", "world");
        List<StringBuilder> builders = words.stream()
            .map(StringBuilder::new)     // constructor ref
            .collect(Collectors.toList());
        System.out.println("Builders: " + builders);
    }
}`,
      },
    ],
    exercises: [
      {
        prompt: 'Complete the stream operation to select matching elements:',
        template: 'nums.stream().___(n -> n % 2 == 0).collect(Collectors.toList())',
        answer: 'filter',
        hint: 'The stream operation that keeps elements matching a predicate.',
      },
      {
        prompt: 'Provide a default value when an Optional is empty:',
        template: 'String name = optional.___(\"default\");',
        answer: 'orElse',
        hint: 'The Optional method that returns a fallback value if empty.',
      },
    ],
  },
];

// ─── Component ──────────────────────────────────────────────────────────────

export const JavaLab: React.FC = () => {
  const [activeTopic, setActiveTopic] = useState<string>('intro');
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [results, setResults] = useState<Record<string, boolean | null>>({});

  const topic = TOPICS.find(t => t.id === activeTopic) ?? TOPICS[0];

  const exKey = (topicId: string, idx: number) => `${topicId}_${idx}`;

  const handleInput = (key: string, value: string) => {
    setInputs(p => ({ ...p, [key]: value }));
    setResults(p => ({ ...p, [key]: null }));
  };

  const checkAnswer = (key: string, answer: string) => {
    const val = (inputs[key] || '').trim();
    setResults(p => ({ ...p, [key]: val.toLowerCase() === answer.toLowerCase() }));
  };

  const resetExercise = (key: string) => {
    setInputs(p => ({ ...p, [key]: '' }));
    setResults(p => ({ ...p, [key]: null }));
  };

  const totalExercises = TOPICS.reduce((s, t) => s + t.exercises.length, 0);
  const completedCount = Object.values(results).filter(r => r === true).length;

  return (
    <div className="h-full flex flex-col overflow-hidden bg-gradient-to-br from-slate-50 to-red-50 dark:from-gray-950 dark:to-red-950/20">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-200 dark:border-gray-800 bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-red-100 dark:bg-red-900/40 flex items-center justify-center">
            <Code className="w-4 h-4 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100">Java Learning Lab</h2>
            <p className="text-[10px] text-gray-500 dark:text-gray-500">From beginner to mastery -- interactive Java guide</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 rounded-full px-2.5 py-1">
          <Check className="w-3 h-3 text-green-500" />
          {completedCount}/{totalExercises} exercises
        </div>
      </div>

      {/* Main Layout */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Sidebar */}
        <div className="w-56 shrink-0 border-r border-gray-200 dark:border-gray-800 bg-white/40 dark:bg-gray-900/40 overflow-y-auto p-2 space-y-0.5">
          {TOPICS.map(t => {
            const isActive = activeTopic === t.id;
            const doneCount = t.exercises.filter((_, i) => results[exKey(t.id, i)] === true).length;
            const allDone = doneCount === t.exercises.length;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTopic(t.id)}
                className={`w-full text-left px-3 py-2 text-xs rounded-lg font-medium transition-all flex items-center gap-2 ${
                  isActive
                    ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800/50 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                {allDone ? (
                  <Check className="w-3.5 h-3.5 text-green-500 shrink-0" />
                ) : (
                  <ChevronRight className={`w-3.5 h-3.5 shrink-0 transition-transform ${isActive ? 'rotate-90' : ''}`} />
                )}
                <span className="truncate flex-1">{t.label}</span>
                {doneCount > 0 && !allDone && (
                  <span className="text-[9px] text-gray-400 dark:text-gray-500">{doneCount}/{t.exercises.length}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Topic Title */}
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-red-500 dark:text-red-400" />
            <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">{topic.label}</h3>
          </div>

          {/* Explanation */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">{topic.explanation}</p>
          </div>

          {/* Code Examples */}
          {topic.examples.map((ex, ei) => (
            <div key={ei} className="bg-gray-950 rounded-xl border border-gray-700 overflow-hidden">
              <div className="flex items-center gap-2 px-3 py-2 bg-gray-900 border-b border-gray-700">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
                </div>
                <span className="text-[10px] text-gray-500 font-mono ml-1">{ex.title}</span>
                <div className="ml-auto flex items-center gap-1.5 text-[10px] text-gray-500">
                  <Code className="w-3 h-3" /> Java
                </div>
              </div>
              <div className="bg-gray-950 rounded-lg p-3 font-mono text-[12px] overflow-x-auto">
                {hl(ex.code)}
              </div>
            </div>
          ))}

          {/* Exercises */}
          {topic.exercises.map((exercise, ei) => {
            const key = exKey(topic.id, ei);
            const result = results[key];
            return (
              <div
                key={ei}
                className={`rounded-xl border p-4 transition-colors ${
                  result === true
                    ? 'bg-green-50 dark:bg-green-950/20 border-green-300 dark:border-green-800'
                    : result === false
                      ? 'bg-red-50 dark:bg-red-950/20 border-red-300 dark:border-red-800'
                      : 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/50'
                }`}
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                    result === true
                      ? 'bg-green-200 dark:bg-green-800/50'
                      : result === false
                        ? 'bg-red-200 dark:bg-red-800/50'
                        : 'bg-amber-200 dark:bg-amber-800/50'
                  }`}>
                    {result === true ? (
                      <Check className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                    ) : result === false ? (
                      <X className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
                    ) : (
                      <Code className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    )}
                  </div>
                  <h4 className="text-xs font-bold text-gray-900 dark:text-gray-100">Exercise {ei + 1}</h4>
                </div>

                <p className="text-xs text-gray-700 dark:text-gray-300 mb-2">{exercise.prompt}</p>

                {/* Template with blank */}
                <div className="bg-gray-900 rounded-lg p-3 mb-3 font-mono text-[12px]">
                  {exercise.template.split('___').map((part, pi, arr) => (
                    <React.Fragment key={pi}>
                      <span className="text-gray-300">{part}</span>
                      {pi < arr.length - 1 && (
                        <input
                          type="text"
                          value={inputs[key] || ''}
                          onChange={e => handleInput(key, e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && checkAnswer(key, exercise.answer)}
                          className={`inline-block w-28 px-2 py-0.5 mx-1 rounded text-sm font-mono border focus:outline-none focus:ring-2 ${
                            result === true
                              ? 'bg-green-900/40 border-green-600 text-green-300 focus:ring-green-500/40'
                              : result === false
                                ? 'bg-red-900/40 border-red-600 text-red-300 focus:ring-red-500/40'
                                : 'bg-gray-800 border-gray-600 text-yellow-300 focus:ring-yellow-500/40'
                          }`}
                          placeholder="???"
                          spellCheck={false}
                        />
                      )}
                    </React.Fragment>
                  ))}
                </div>

                {/* Result message */}
                {result === true && (
                  <p className="text-xs text-green-700 dark:text-green-400 mb-2 flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5" /> Correct! The answer is <code className="bg-green-200 dark:bg-green-800/50 px-1.5 py-0.5 rounded font-mono text-[11px]">{exercise.answer}</code>
                  </p>
                )}
                {result === false && (
                  <p className="text-xs text-red-700 dark:text-red-400 mb-2 flex items-center gap-1.5">
                    <X className="w-3.5 h-3.5" /> Not quite. Hint: {exercise.hint}
                  </p>
                )}

                {/* Buttons */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => checkAnswer(key, exercise.answer)}
                    disabled={!inputs[key]?.trim()}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
                      inputs[key]?.trim()
                        ? 'bg-red-600 hover:bg-red-700 text-white'
                        : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    <Check className="w-3 h-3" /> Check
                  </button>
                  <button
                    onClick={() => resetExercise(key)}
                    className="px-3 py-1.5 text-xs font-medium rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors flex items-center gap-1.5"
                  >
                    <RotateCcw className="w-3 h-3" /> Reset
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
