import React, { useState } from 'react';
import { BookOpen, Code, ChevronRight, Check, X, RotateCcw } from 'lucide-react';

// ── Types ────────────────────────────────────────────────────────────────────

interface Example {
  title: string;
  code: string[];
  output: string;
}

interface Exercise {
  question: string;
  code: string;
  answer: string;
  hint: string;
}

interface TopicData {
  title: string;
  explanation: string;
  examples: Example[];
  exercises: Exercise[];
}

// ── Topic data ───────────────────────────────────────────────────────────────

const topics: Record<string, TopicData> = {
  intro: {
    title: 'Introduction',
    explanation:
      'Python is a high-level, interpreted language prized for readability and a massive ecosystem. It dominates web development (Django, Flask, FastAPI), data science (pandas, NumPy, matplotlib), AI/ML (PyTorch, TensorFlow, scikit-learn), automation, and scripting. Install from python.org, use pip to manage packages, and run scripts with python file.py or interactively via the REPL.',
    examples: [
      {
        title: 'Hello World & Version Check',
        code: [
          '# Save as hello.py, run: python hello.py',
          'import sys',
          '',
          'print("Hello, World!")',
          'print(f"Python version: {sys.version_info.major}.{sys.version_info.minor}")',
        ],
        output: 'Hello, World!\nPython version: 3.12',
      },
      {
        title: 'Using the REPL & pip',
        code: [
          '# Start REPL: just type "python" in your terminal',
          '# >>> 2 + 2',
          '# 4',
          '# >>> exit()',
          '',
          '# Install a package with pip',
          '# pip install requests',
          '# pip list            -- show installed packages',
          '# pip freeze > requirements.txt',
          '',
          'import math',
          'print(math.sqrt(144))',
          'print(math.pi)',
        ],
        output: '12.0\n3.141592653589793',
      },
      {
        title: 'Script with Shebang & Main Guard',
        code: [
          '#!/usr/bin/env python3',
          '"""A simple script demonstrating best practices."""',
          '',
          'def main():',
          '    name = "Secure Nexus"',
          '    print(f"Welcome to {name}")',
          '    print("Python is ready to go!")',
          '',
          'if __name__ == "__main__":',
          '    main()',
        ],
        output: 'Welcome to Secure Nexus\nPython is ready to go!',
      },
    ],
    exercises: [
      {
        question: 'Complete the code to print "Hello, World!"',
        code: 'print(___)',
        answer: '"Hello, World!"',
        hint: 'Wrap the string in double quotes inside the parentheses',
      },
      {
        question: 'Import the math module and print the value of pi',
        code: 'import math\nprint(math.___)',
        answer: 'pi',
        hint: 'pi is an attribute of the math module, not a function call',
      },
    ],
  },

  variables: {
    title: 'Variables & Types',
    explanation:
      'Python is dynamically typed -- variables are created on assignment without declaring a type. Core types include int, float, str, bool, and None. Use type() to inspect, and int(), str(), float() to cast between types. F-strings (f"...{expr}...") are the modern way to format strings. Triple quotes enable multiline strings.',
    examples: [
      {
        title: 'Core Types & type()',
        code: [
          'age = 25                # int',
          'height = 5.11           # float',
          'name = "Alice"          # str',
          'is_admin = True         # bool',
          'nothing = None          # NoneType',
          '',
          'print(type(age))        # <class \'int\'>',
          'print(type(height))     # <class \'float\'>',
          'print(type(name))       # <class \'str\'>',
          'print(type(is_admin))   # <class \'bool\'>',
          'print(type(nothing))    # <class \'NoneType\'>',
        ],
        output: "<class 'int'>\n<class 'float'>\n<class 'str'>\n<class 'bool'>\n<class 'NoneType'>",
      },
      {
        title: 'Type Casting & Conversions',
        code: [
          '# String to int / float',
          'num_str = "42"',
          'num = int(num_str)',
          'print(num + 8)            # 50',
          '',
          'price_str = "19.99"',
          'price = float(price_str)',
          'print(price * 2)          # 39.98',
          '',
          '# Number to string',
          'val = 100',
          'print("Score: " + str(val))',
          '',
          '# Bool casting',
          'print(bool(0))            # False',
          'print(bool(""))           # False',
          'print(bool("hello"))      # True',
          'print(bool(42))           # True',
        ],
        output: '50\n39.98\nScore: 100\nFalse\nFalse\nTrue\nTrue',
      },
      {
        title: 'F-strings & Multiline Strings',
        code: [
          'user = "Bob"',
          'score = 95.678',
          '',
          '# f-string with expressions',
          'print(f"User: {user}, Score: {score:.1f}")',
          'print(f"Name length: {len(user)}")',
          "print(f\"{'YES' if score > 90 else 'NO'}\")",
          '',
          '# Multiline string',
          'query = """',
          'SELECT *',
          'FROM users',
          'WHERE active = 1',
          '"""',
          'print(query.strip())',
        ],
        output: 'User: Bob, Score: 95.7\nName length: 3\nYES\nSELECT *\nFROM users\nWHERE active = 1',
      },
    ],
    exercises: [
      {
        question: 'Convert the string "99" to an integer and add 1',
        code: 'result = ___(\"99\") + 1\nprint(result)',
        answer: 'int',
        hint: 'Use the built-in function that converts strings to integers',
      },
      {
        question: 'Create an f-string that prints "Score: 95"',
        code: 'score = 95\nprint(f"___")',
        answer: 'Score: {score}',
        hint: 'Place the variable name inside curly braces within the f-string',
      },
    ],
  },

  operators: {
    title: 'Operators',
    explanation:
      'Python provides arithmetic operators (+, -, *, /, //, %, **), comparison operators (==, !=, <, >, <=, >=), logical operators (and, or, not), augmented assignment (+=, -=, *=, etc.), identity checks (is, is not), and membership tests (in, not in). Floor division // truncates toward negative infinity, and ** is exponentiation.',
    examples: [
      {
        title: 'Arithmetic & Assignment Operators',
        code: [
          'a, b = 17, 5',
          '',
          'print(f"a + b  = {a + b}")    # 22',
          'print(f"a - b  = {a - b}")    # 12',
          'print(f"a * b  = {a * b}")    # 85',
          'print(f"a / b  = {a / b}")    # 3.4  (true division)',
          'print(f"a // b = {a // b}")   # 3    (floor division)',
          'print(f"a % b  = {a % b}")    # 2    (modulo)',
          'print(f"a ** b = {a ** b}")   # 1419857 (power)',
          '',
          '# Augmented assignment',
          'x = 10',
          'x += 5   # x = 15',
          'x *= 2   # x = 30',
          'x //= 4  # x = 7',
          'print(f"x = {x}")',
        ],
        output: 'a + b  = 22\na - b  = 12\na * b  = 85\na / b  = 3.4\na // b = 3\na % b  = 2\na ** b = 1419857\nx = 7',
      },
      {
        title: 'Comparison & Logical Operators',
        code: [
          'x, y = 10, 20',
          '',
          'print(x == y)     # False',
          'print(x != y)     # True',
          'print(x < y)      # True',
          'print(x >= 10)    # True',
          '',
          '# Logical operators',
          'print(x > 5 and y < 30)    # True',
          'print(x > 15 or y > 15)    # True',
          'print(not (x == y))         # True',
          '',
          '# Chained comparisons (Python-specific)',
          'age = 25',
          'print(18 <= age < 65)       # True',
        ],
        output: 'False\nTrue\nTrue\nTrue\nTrue\nTrue\nTrue\nTrue',
      },
      {
        title: 'Identity & Membership Operators',
        code: [
          '# Identity: "is" checks object identity (same memory)',
          'a = [1, 2, 3]',
          'b = [1, 2, 3]',
          'c = a',
          '',
          'print(a == b)      # True  (same value)',
          'print(a is b)      # False (different objects)',
          'print(a is c)      # True  (same object)',
          '',
          '# Membership: "in" checks containment',
          'fruits = ["apple", "banana", "cherry"]',
          'print("banana" in fruits)       # True',
          'print("grape" not in fruits)    # True',
          '',
          'text = "Hello, World"',
          'print("World" in text)          # True',
        ],
        output: 'True\nFalse\nTrue\nTrue\nTrue\nTrue',
      },
    ],
    exercises: [
      {
        question: 'What operator gives the remainder of 17 divided by 5?',
        code: 'result = 17 ___ 5\nprint(result)  # should print 2',
        answer: '%',
        hint: 'The modulo operator returns the remainder of integer division',
      },
      {
        question: 'Check if "python" is in the list of languages',
        code: 'langs = ["python", "java", "rust"]\nprint("python" ___ langs)',
        answer: 'in',
        hint: 'The membership operator tests if an element exists in a sequence',
      },
    ],
  },

  io: {
    title: 'Input/Output',
    explanation:
      'print() outputs to stdout with configurable sep (separator) and end (line ending) parameters. input() reads strings from stdin. For file I/O, use open() with modes "r" (read), "w" (write), "a" (append). Always prefer the with statement for automatic file closing.',
    examples: [
      {
        title: 'print() Parameters & Formatting',
        code: [
          '# Basic print with sep and end',
          'print("Hello", "World", sep=", ")',
          'print("Loading", end="...")',
          'print("Done!")',
          '',
          '# Formatted output',
          'name = "Alice"',
          'balance = 1234.5678',
          'print(f"{name:>10}: ${balance:,.2f}")',
          '',
          '# Print multiple values',
          'items = ["apple", "banana", "cherry"]',
          'print(*items, sep=" | ")',
        ],
        output: 'Hello, World\nLoading...Done!\n     Alice: $1,234.57\napple | banana | cherry',
      },
      {
        title: 'input() & Type Conversion',
        code: [
          '# input() always returns a string',
          '# name = input("Enter name: ")',
          '# age = int(input("Enter age: "))',
          '',
          '# Simulating input for demonstration',
          'name = "Alice"',
          'age_str = "25"',
          'age = int(age_str)',
          '',
          'print(f"Hello {name}, you are {age} years old")',
          'print(f"Next year you will be {age + 1}")',
        ],
        output: 'Hello Alice, you are 25 years old\nNext year you will be 26',
      },
      {
        title: 'File I/O with Context Manager',
        code: [
          '# Writing to a file',
          'with open("data.txt", "w") as f:',
          '    f.write("Line 1\\n")',
          '    f.write("Line 2\\n")',
          '    f.write("Line 3\\n")',
          '',
          '# Reading entire file',
          'with open("data.txt", "r") as f:',
          '    content = f.read()',
          '    print(content)',
          '',
          '# Reading line by line',
          'with open("data.txt", "r") as f:',
          '    for line in f:',
          '        print(line.strip().upper())',
        ],
        output: 'Line 1\nLine 2\nLine 3\n\nLINE 1\nLINE 2\nLINE 3',
      },
    ],
    exercises: [
      {
        question: 'Print "A", "B", "C" separated by dashes using sep',
        code: 'print("A", "B", "C", sep=___)',
        answer: '"-"',
        hint: 'sep takes a string that goes between each printed argument',
      },
      {
        question: 'Open a file called "log.txt" for writing',
        code: 'with open("log.txt", ___) as f:\n    f.write("entry")',
        answer: '"w"',
        hint: 'The write mode is a single character string',
      },
    ],
  },

  control: {
    title: 'Control Flow',
    explanation:
      'Python control flow includes if/elif/else branching, for loops over iterables, while loops with conditions, and the match-case statement (Python 3.10+). Ternary expressions provide single-line conditionals. Use break to exit a loop, continue to skip to the next iteration, and pass as a no-op placeholder. range(start, stop, step) generates integer sequences.',
    examples: [
      {
        title: 'if/elif/else & Ternary',
        code: [
          'score = 85',
          '',
          'if score >= 90:',
          '    grade = "A"',
          'elif score >= 80:',
          '    grade = "B"',
          'elif score >= 70:',
          '    grade = "C"',
          'else:',
          '    grade = "F"',
          '',
          'print(f"Grade: {grade}")',
          '',
          '# Ternary (conditional expression)',
          'status = "pass" if score >= 60 else "fail"',
          'print(f"Status: {status}")',
          '',
          '# match-case (Python 3.10+)',
          'command = "quit"',
          'match command:',
          '    case "start":',
          '        print("Starting...")',
          '    case "quit" | "exit":',
          '        print("Goodbye!")',
          '    case _:',
          '        print("Unknown command")',
        ],
        output: 'Grade: B\nStatus: pass\nGoodbye!',
      },
      {
        title: 'for Loops, range() & Enumerate',
        code: [
          '# Loop with range',
          'for i in range(5):',
          '    print(i, end=" ")         # 0 1 2 3 4',
          'print()',
          '',
          '# range(start, stop, step)',
          'for i in range(2, 11, 3):',
          '    print(i, end=" ")         # 2 5 8',
          'print()',
          '',
          '# Loop over a list with index',
          'langs = ["Python", "Rust", "Go"]',
          'for idx, lang in enumerate(langs):',
          '    print(f"{idx}: {lang}")',
          '',
          '# Nested loop with break',
          'for i in range(3):',
          '    for j in range(3):',
          '        if j == 2:',
          '            break',
          '        print(f"({i},{j})", end=" ")',
          'print()',
        ],
        output: '0 1 2 3 4\n2 5 8\n0: Python\n1: Rust\n2: Go\n(0,0) (0,1) (1,0) (1,1) (2,0) (2,1)',
      },
      {
        title: 'while, break, continue, pass',
        code: [
          '# while loop with break',
          'total = 0',
          'n = 1',
          'while True:',
          '    total += n',
          '    if total > 10:',
          '        break',
          '    n += 1',
          'print(f"Stopped at n={n}, total={total}")',
          '',
          '# continue to skip odd numbers',
          'evens = []',
          'for i in range(10):',
          '    if i % 2 != 0:',
          '        continue',
          '    evens.append(i)',
          'print(f"Evens: {evens}")',
          '',
          '# pass as placeholder',
          'def todo_function():',
          '    pass  # implement later',
        ],
        output: 'Stopped at n=5, total=15\nEvens: [0, 2, 4, 6, 8]',
      },
    ],
    exercises: [
      {
        question: 'Complete the range to print numbers 1 through 5',
        code: 'for i in range(1, ___):\n    print(i, end=" ")',
        answer: '6',
        hint: 'range(start, stop) is exclusive of stop, so use stop = 6',
      },
      {
        question: 'Write a ternary that assigns "even" or "odd" based on x',
        code: 'x = 7\nresult = "even" if x % 2 == 0 ___ "odd"\nprint(result)',
        answer: 'else',
        hint: 'The ternary syntax is: value_if_true if condition else value_if_false',
      },
    ],
  },

  datastructures: {
    title: 'Data Structures',
    explanation:
      'Python has four core collection types. Lists are ordered and mutable (append, pop, slice, sort). Tuples are ordered and immutable, used for fixed collections. Dicts map keys to values with O(1) lookup. Sets hold unique elements and support union, intersection, and difference. Comprehensions provide concise syntax for building any of these.',
    examples: [
      {
        title: 'Lists: CRUD, Slicing & Comprehensions',
        code: [
          'nums = [10, 20, 30, 40, 50]',
          '',
          '# Access & slice',
          'print(nums[0])         # 10',
          'print(nums[-1])        # 50',
          'print(nums[1:4])       # [20, 30, 40]',
          'print(nums[::2])       # [10, 30, 50]',
          '',
          '# Mutate',
          'nums.append(60)',
          'nums.insert(0, 5)',
          'removed = nums.pop(2)  # removes 20',
          'print(nums)',
          '',
          '# List comprehension',
          'squares = [x**2 for x in range(1, 6)]',
          'print(squares)',
          '',
          'evens = [x for x in range(20) if x % 2 == 0]',
          'print(evens)',
        ],
        output: '10\n50\n[20, 30, 40]\n[10, 30, 50]\n[5, 10, 30, 40, 50, 60]\n[1, 4, 9, 16, 25]\n[0, 2, 4, 6, 8, 10, 12, 14, 16, 18]',
      },
      {
        title: 'Dicts: Access, Iteration & Comprehensions',
        code: [
          'user = {',
          '    "name": "Alice",',
          '    "age": 30,',
          '    "role": "engineer"',
          '}',
          '',
          '# Access with .get() (safe, returns None if missing)',
          'print(user.get("name"))            # Alice',
          'print(user.get("email", "N/A"))    # N/A',
          '',
          '# Iteration',
          'for key, val in user.items():',
          '    print(f"  {key}: {val}")',
          '',
          '# Dict comprehension',
          'word = "abracadabra"',
          'freq = {ch: word.count(ch) for ch in set(word)}',
          'print(freq)',
        ],
        output: 'Alice\nN/A\n  name: Alice\n  age: 30\n  role: engineer\n{\'a\': 5, \'b\': 2, \'r\': 2, \'c\': 1, \'d\': 1}',
      },
      {
        title: 'Tuples, Sets & Nested Structures',
        code: [
          '# Tuples (immutable)',
          'point = (3, 7)',
          'x, y = point            # unpacking',
          'print(f"x={x}, y={y}")',
          '',
          '# Sets (unique, unordered)',
          'a = {1, 2, 3, 4}',
          'b = {3, 4, 5, 6}',
          'print(f"Union:        {a | b}")',
          'print(f"Intersection: {a & b}")',
          'print(f"Difference:   {a - b}")',
          '',
          '# Nested: list of dicts',
          'students = [',
          '    {"name": "Alice", "gpa": 3.9},',
          '    {"name": "Bob", "gpa": 3.5},',
          '    {"name": "Carol", "gpa": 3.8},',
          ']',
          'top = [s["name"] for s in students if s["gpa"] >= 3.8]',
          'print(f"Honor roll: {top}")',
        ],
        output: 'x=3, y=7\nUnion:        {1, 2, 3, 4, 5, 6}\nIntersection: {3, 4}\nDifference:   {1, 2}\nHonor roll: [\'Alice\', \'Carol\']',
      },
    ],
    exercises: [
      {
        question: 'Create a list comprehension for squares of 1 through 5',
        code: 'squares = [x**2 for x in ___]\nprint(squares)',
        answer: 'range(1, 6)',
        hint: 'range(1, 6) generates numbers 1, 2, 3, 4, 5',
      },
      {
        question: 'Safely get a missing key from a dict with a default',
        code: 'data = {"a": 1}\nval = data.___(\"b\", 0)\nprint(val)  # should print 0',
        answer: 'get',
        hint: 'The dict method that returns a default value instead of raising KeyError',
      },
    ],
  },

  functions: {
    title: 'Functions',
    explanation:
      'Functions are defined with def, can have default parameters, accept variable positional args with *args and keyword args with **kwargs. Lambda creates anonymous single-expression functions. Python supports type hints for documentation, docstrings for built-in help, and has clear scope rules (local vs global). Functions are first-class objects.',
    examples: [
      {
        title: 'Parameters, Defaults & Return',
        code: [
          'def calculate_bmi(weight_kg: float, height_m: float = 1.75) -> float:',
          '    """Calculate Body Mass Index."""',
          '    return round(weight_kg / (height_m ** 2), 1)',
          '',
          'print(calculate_bmi(70))          # uses default height',
          'print(calculate_bmi(85, 1.80))    # explicit height',
          '',
          '# Multiple return values (tuple)',
          'def min_max(numbers: list) -> tuple:',
          '    return min(numbers), max(numbers)',
          '',
          'lo, hi = min_max([4, 1, 7, 2, 9])',
          'print(f"Min: {lo}, Max: {hi}")',
        ],
        output: '22.9\n26.2\nMin: 1, Max: 9',
      },
      {
        title: '*args, **kwargs & Lambda',
        code: [
          '# *args collects extra positional arguments',
          'def total(*args):',
          '    return sum(args)',
          '',
          'print(total(1, 2, 3, 4))    # 10',
          '',
          '# **kwargs collects extra keyword arguments',
          'def build_url(base, **params):',
          '    query = "&".join(f"{k}={v}" for k, v in params.items())',
          '    return f"{base}?{query}"',
          '',
          'url = build_url("https://api.example.com/search", q="python", page=1)',
          'print(url)',
          '',
          '# Lambda (anonymous function)',
          'words = ["banana", "apple", "cherry"]',
          'words.sort(key=lambda w: len(w))',
          'print(words)',
        ],
        output: '10\nhttps://api.example.com/search?q=python&page=1\n[\'apple\', \'banana\', \'cherry\']',
      },
      {
        title: 'Scope, Docstrings & Type Hints',
        code: [
          'count = 0  # global variable',
          '',
          'def increment():',
          '    global count',
          '    count += 1',
          '',
          'increment()',
          'increment()',
          'print(f"count = {count}")',
          '',
          'def fibonacci(n: int) -> list[int]:',
          '    """Return first n Fibonacci numbers.',
          '',
          '    Args:',
          '        n: How many numbers to generate.',
          '',
          '    Returns:',
          '        A list of Fibonacci numbers.',
          '    """',
          '    fibs = [0, 1]',
          '    for _ in range(n - 2):',
          '        fibs.append(fibs[-1] + fibs[-2])',
          '    return fibs[:n]',
          '',
          'print(fibonacci(8))',
        ],
        output: 'count = 2\n[0, 1, 1, 2, 3, 5, 8, 13]',
      },
    ],
    exercises: [
      {
        question: 'Define a function that returns the square of a number',
        code: 'def square(n):\n    return ___',
        answer: 'n ** 2',
        hint: 'Use the ** operator for exponentiation',
      },
      {
        question: 'Sort a list of tuples by the second element using lambda',
        code: 'pairs = [(1, 3), (2, 1), (3, 2)]\npairs.sort(key=lambda p: ___)\nprint(pairs)',
        answer: 'p[1]',
        hint: 'Access the second element (index 1) of each tuple p',
      },
    ],
  },

  oop: {
    title: 'OOP',
    explanation:
      'Classes bundle data (attributes) and behavior (methods). The __init__ constructor initializes instances via self. Python supports single and multiple inheritance with super(). Use @property for computed attributes, @staticmethod for utility methods, @classmethod for alternative constructors, and dunder methods (__str__, __repr__, __len__, etc.) to hook into Python operators and built-ins.',
    examples: [
      {
        title: 'Class, __init__, Instance vs Class Variables',
        code: [
          'class BankAccount:',
          '    bank_name = "SecureBank"     # class variable',
          '',
          '    def __init__(self, owner: str, balance: float = 0):',
          '        self.owner = owner       # instance variable',
          '        self.balance = balance',
          '',
          '    def deposit(self, amount: float):',
          '        self.balance += amount',
          '        return self.balance',
          '',
          '    def withdraw(self, amount: float) -> float:',
          '        if amount > self.balance:',
          '            raise ValueError("Insufficient funds")',
          '        self.balance -= amount',
          '        return self.balance',
          '',
          '    def __str__(self) -> str:',
          '        return f"{self.owner}: ${self.balance:.2f}"',
          '',
          'acc = BankAccount("Alice", 100)',
          'acc.deposit(50)',
          'acc.withdraw(30)',
          'print(acc)',
          'print(BankAccount.bank_name)',
        ],
        output: 'Alice: $120.00\nSecureBank',
      },
      {
        title: 'Inheritance, super() & Method Overriding',
        code: [
          'class Shape:',
          '    def __init__(self, color: str = "red"):',
          '        self.color = color',
          '',
          '    def area(self) -> float:',
          '        raise NotImplementedError',
          '',
          '    def describe(self) -> str:',
          '        return f"{self.color} shape, area={self.area():.2f}"',
          '',
          'class Circle(Shape):',
          '    def __init__(self, radius: float, color: str = "blue"):',
          '        super().__init__(color)',
          '        self.radius = radius',
          '',
          '    def area(self) -> float:',
          '        return 3.14159 * self.radius ** 2',
          '',
          'class Rectangle(Shape):',
          '    def __init__(self, w: float, h: float, color: str = "green"):',
          '        super().__init__(color)',
          '        self.w, self.h = w, h',
          '',
          '    def area(self) -> float:',
          '        return self.w * self.h',
          '',
          'shapes = [Circle(5), Rectangle(4, 6, "yellow")]',
          'for s in shapes:',
          '    print(s.describe())',
        ],
        output: 'blue shape, area=78.54\nyellow shape, area=24.00',
      },
      {
        title: '@property, @staticmethod, @classmethod & Dunders',
        code: [
          'class Temperature:',
          '    def __init__(self, celsius: float):',
          '        self._celsius = celsius',
          '',
          '    @property',
          '    def celsius(self) -> float:',
          '        return self._celsius',
          '',
          '    @celsius.setter',
          '    def celsius(self, value: float):',
          '        if value < -273.15:',
          '            raise ValueError("Below absolute zero")',
          '        self._celsius = value',
          '',
          '    @property',
          '    def fahrenheit(self) -> float:',
          '        return self._celsius * 9/5 + 32',
          '',
          '    @staticmethod',
          '    def is_freezing(temp_c: float) -> bool:',
          '        return temp_c <= 0',
          '',
          '    @classmethod',
          '    def from_fahrenheit(cls, f: float):',
          '        return cls((f - 32) * 5/9)',
          '',
          '    def __repr__(self) -> str:',
          '        return f"Temperature({self._celsius}C)"',
          '',
          '    def __len__(self) -> int:',
          '        return int(abs(self._celsius))',
          '',
          't = Temperature.from_fahrenheit(212)',
          'print(f"{t.celsius}C = {t.fahrenheit}F")',
          'print(Temperature.is_freezing(-5))',
          'print(repr(t))',
        ],
        output: '100.0C = 212.0F\nTrue\nTemperature(100.0C)',
      },
    ],
    exercises: [
      {
        question: 'Complete the constructor to store the "color" attribute',
        code: 'class Car:\n    def __init__(self, color):\n        ___',
        answer: 'self.color = color',
        hint: 'Assign the parameter to self.<attribute_name>',
      },
      {
        question: 'Make Dog inherit from Animal',
        code: 'class Animal:\n    pass\n\nclass Dog(___):\n    pass',
        answer: 'Animal',
        hint: 'Put the parent class name inside the parentheses',
      },
    ],
  },

  errors: {
    title: 'Error Handling',
    explanation:
      'Use try/except to catch exceptions, else for the success path, and finally for cleanup that always runs. Raise exceptions with raise, define custom ones by subclassing Exception, and use assert for debug-time invariant checks. Common built-in exceptions include ValueError, TypeError, KeyError, IndexError, FileNotFoundError, and ZeroDivisionError.',
    examples: [
      {
        title: 'try / except / else / finally',
        code: [
          'def parse_age(value: str) -> int:',
          '    try:',
          '        age = int(value)',
          '    except ValueError:',
          '        print(f"Invalid input: {value!r}")',
          '        return -1',
          '    except TypeError:',
          '        print("Input must be a string")',
          '        return -1',
          '    else:',
          '        print(f"Parsed successfully: {age}")',
          '        return age',
          '    finally:',
          '        print("--- done parsing ---")',
          '',
          'parse_age("25")',
          'parse_age("abc")',
        ],
        output: 'Parsed successfully: 25\n--- done parsing ---\nInvalid input: \'abc\'\n--- done parsing ---',
      },
      {
        title: 'raise & Custom Exceptions',
        code: [
          'class InsufficientFundsError(Exception):',
          '    def __init__(self, balance, amount):',
          '        self.balance = balance',
          '        self.amount = amount',
          '        super().__init__(',
          '            f"Cannot withdraw ${amount}: only ${balance} available"',
          '        )',
          '',
          'def withdraw(balance, amount):',
          '    if amount > balance:',
          '        raise InsufficientFundsError(balance, amount)',
          '    return balance - amount',
          '',
          'try:',
          '    result = withdraw(50, 100)',
          'except InsufficientFundsError as e:',
          '    print(f"Error: {e}")',
          '    print(f"  Tried: ${e.amount}, Had: ${e.balance}")',
        ],
        output: 'Error: Cannot withdraw $100: only $50 available\n  Tried: $100, Had: $50',
      },
      {
        title: 'assert & Common Exception Types',
        code: [
          '# assert for debug checks (disabled with python -O)',
          'def set_volume(level: int):',
          '    assert 0 <= level <= 100, f"Volume {level} out of range"',
          '    print(f"Volume set to {level}")',
          '',
          'set_volume(75)',
          '',
          '# Common exception types',
          'errors = {',
          '    "ValueError":    lambda: int("abc"),',
          '    "KeyError":      lambda: {}["missing"],',
          '    "IndexError":    lambda: [][0],',
          '    "TypeError":     lambda: "2" + 2,',
          '    "ZeroDivision":  lambda: 1 / 0,',
          '}',
          '',
          'for name, fn in errors.items():',
          '    try:',
          '        fn()',
          '    except Exception as e:',
          '        print(f"{name}: {type(e).__name__}")',
        ],
        output: 'Volume set to 75\nValueError: ValueError\nKeyError: KeyError\nIndexError: IndexError\nTypeError: TypeError\nZeroDivision: ZeroDivisionError',
      },
    ],
    exercises: [
      {
        question: 'Catch a ValueError when converting a string to int',
        code: 'try:\n    int("abc")\nexcept ___:\n    print("Bad value")',
        answer: 'ValueError',
        hint: 'The exception type raised when a value conversion fails',
      },
      {
        question: 'Raise a custom error with a message',
        code: 'raise ___("Something went wrong")',
        answer: 'Exception',
        hint: 'The base class for all built-in exceptions in Python',
      },
    ],
  },

  modules: {
    title: 'Modules & Packages',
    explanation:
      'A module is any .py file. Import it with import, access specific names with from...import, and alias with as. The __name__ == "__main__" guard lets a module work both as a script and an importable library. Packages are directories with __init__.py. Use pip to install third-party packages and virtual environments (venv) to isolate project dependencies.',
    examples: [
      {
        title: 'import, from...import, and as',
        code: [
          '# Full module import',
          'import os',
          'print(os.getcwd())',
          '',
          '# Import specific names',
          'from datetime import datetime, timedelta',
          'now = datetime.now()',
          'tomorrow = now + timedelta(days=1)',
          'print(f"Now:      {now.strftime(\"%Y-%m-%d\")}")',
          'print(f"Tomorrow: {tomorrow.strftime(\"%Y-%m-%d\")}")',
          '',
          '# Alias for convenience',
          'import json as j',
          'data = {"name": "Alice", "score": 95}',
          'text = j.dumps(data, indent=2)',
          'print(text)',
        ],
        output: 'Now:      2025-01-15\nTomorrow: 2025-01-16\n{\n  "name": "Alice",\n  "score": 95\n}',
      },
      {
        title: '__name__ Guard & Creating Modules',
        code: [
          '# file: utils.py',
          'def slugify(text: str) -> str:',
          '    """Convert text to URL-safe slug."""',
          '    return text.lower().strip().replace(" ", "-")',
          '',
          'def truncate(text: str, length: int = 50) -> str:',
          '    if len(text) <= length:',
          '        return text',
          '    return text[:length - 3] + "..."',
          '',
          '# Only runs when executed directly, not on import',
          'if __name__ == "__main__":',
          '    print(slugify("Hello World Post"))',
          '    print(truncate("A" * 60, 20))',
        ],
        output: 'hello-world-post\nAAAAAAAAAAAAAAAAA...',
      },
      {
        title: 'Virtual Environments & pip',
        code: [
          '# Create a virtual environment',
          '# python -m venv .venv',
          '',
          '# Activate it',
          '# Windows:  .venv\\Scripts\\activate',
          '# macOS:    source .venv/bin/activate',
          '',
          '# Install packages',
          '# pip install requests flask',
          '# pip install -r requirements.txt',
          '',
          '# Freeze current packages',
          '# pip freeze > requirements.txt',
          '',
          '# Check installed packages',
          'import sys',
          'print(f"Python: {sys.executable}")',
          'print(f"Version: {sys.version_info[:3]}")',
        ],
        output: 'Python: /usr/bin/python3\nVersion: (3, 12, 0)',
      },
    ],
    exercises: [
      {
        question: 'Import only the sqrt function from the math module',
        code: 'from math ___ sqrt\nprint(sqrt(16))',
        answer: 'import',
        hint: 'The keyword that follows "from module" in a selective import',
      },
      {
        question: 'Complete the main guard idiom',
        code: 'if __name__ == ___:\n    main()',
        answer: '"__main__"',
        hint: 'When a script is run directly, __name__ is set to this string value',
      },
    ],
  },

  advanced: {
    title: 'Advanced',
    explanation:
      'Python advanced features include decorators (functions that wrap other functions with @syntax), generators (lazy iterators using yield), context managers (with statement for resource management), comprehensions for lists/dicts/sets, the walrus operator (:= for assignment expressions), and advanced unpacking with * and **.',
    examples: [
      {
        title: 'Decorators: Concept & Practical Use',
        code: [
          'import time',
          '',
          '# Decorator that times function execution',
          'def timer(fn):',
          '    def wrapper(*args, **kwargs):',
          '        start = time.perf_counter()',
          '        result = fn(*args, **kwargs)',
          '        elapsed = time.perf_counter() - start',
          '        print(f"{fn.__name__} took {elapsed:.4f}s")',
          '        return result',
          '    return wrapper',
          '',
          '# Decorator with arguments',
          'def retry(max_attempts=3):',
          '    def decorator(fn):',
          '        def wrapper(*args, **kwargs):',
          '            for attempt in range(1, max_attempts + 1):',
          '                try:',
          '                    return fn(*args, **kwargs)',
          '                except Exception as e:',
          '                    print(f"Attempt {attempt} failed: {e}")',
          '            raise RuntimeError(f"All {max_attempts} attempts failed")',
          '        return wrapper',
          '    return decorator',
          '',
          '@timer',
          'def compute(n):',
          '    return sum(i**2 for i in range(n))',
          '',
          'print(compute(100000))',
        ],
        output: 'compute took 0.0234s\n333328333350000',
      },
      {
        title: 'Generators & Context Managers',
        code: [
          '# Generator: yields values lazily',
          'def fibonacci():',
          '    a, b = 0, 1',
          '    while True:',
          '        yield a',
          '        a, b = b, a + b',
          '',
          '# Take first 10 Fibonacci numbers',
          'fib = fibonacci()',
          'first_10 = [next(fib) for _ in range(10)]',
          'print(first_10)',
          '',
          '# Generator expression (like list comp but lazy)',
          'total = sum(x**2 for x in range(1000000))',
          'print(f"Sum of squares: {total}")',
          '',
          '# Custom context manager',
          'class Timer:',
          '    def __enter__(self):',
          '        self.start = time.perf_counter()',
          '        return self',
          '',
          '    def __exit__(self, *args):',
          '        self.elapsed = time.perf_counter() - self.start',
          '        print(f"Block took {self.elapsed:.4f}s")',
          '',
          'with Timer():',
          '    total = sum(range(1000000))',
        ],
        output: '[0, 1, 1, 2, 3, 5, 8, 13, 21, 34]\nSum of squares: 333332833333500000\nBlock took 0.0312s',
      },
      {
        title: 'Walrus Operator, Unpacking & Comprehensions',
        code: [
          '# Walrus operator (:= ) assigns inside expressions',
          'data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]',
          'if (n := len(data)) > 5:',
          '    print(f"Long list: {n} elements")',
          '',
          '# Filtered with walrus',
          'results = [y for x in data if (y := x**2) > 20]',
          'print(results)',
          '',
          '# Advanced unpacking',
          'first, *middle, last = [1, 2, 3, 4, 5]',
          'print(f"first={first}, middle={middle}, last={last}")',
          '',
          '# Dict comprehension with condition',
          'scores = {"Alice": 92, "Bob": 67, "Carol": 85, "Dan": 45}',
          'passed = {k: v for k, v in scores.items() if v >= 70}',
          'print(passed)',
          '',
          '# Set comprehension',
          'text = "hello world"',
          'vowels = {ch for ch in text if ch in "aeiou"}',
          'print(vowels)',
        ],
        output: 'Long list: 10 elements\n[25, 36, 49, 64, 81, 100]\nfirst=1, middle=[2, 3, 4], last=5\n{\'Alice\': 92, \'Carol\': 85}\n{\'e\', \'o\'}',
      },
    ],
    exercises: [
      {
        question: 'Write a list comprehension for even numbers 0 through 9',
        code: 'evens = [x for x in range(10) ___]\nprint(evens)',
        answer: 'if x % 2 == 0',
        hint: 'Add a condition at the end of the comprehension to filter evens',
      },
      {
        question: 'Unpack the first and last from a list, ignoring the middle',
        code: 'first, ___, last = [10, 20, 30, 40, 50]',
        answer: '*_',
        hint: 'Use *variable_name to capture the rest; _ is conventional for unused values',
      },
    ],
  },

  async: {
    title: 'Async & Itertools',
    explanation:
      'async/await enables non-blocking I/O for network, file, and database operations. asyncio.run() is the entry point for async code. The itertools module provides memory-efficient combinatoric iterators (chain, combinations, permutations, product). functools offers higher-order utilities like reduce, partial for currying, and lru_cache for automatic memoization.',
    examples: [
      {
        title: 'async/await & asyncio.run()',
        code: [
          'import asyncio',
          '',
          'async def fetch_data(name: str, delay: float) -> str:',
          '    print(f"Fetching {name}...")',
          '    await asyncio.sleep(delay)',
          '    return f"{name}: done ({delay}s)"',
          '',
          'async def main():',
          '    # Run concurrently with gather',
          '    results = await asyncio.gather(',
          '        fetch_data("users", 0.3),',
          '        fetch_data("orders", 0.2),',
          '        fetch_data("products", 0.1),',
          '    )',
          '    for r in results:',
          '        print(r)',
          '',
          'asyncio.run(main())',
        ],
        output: 'Fetching users...\nFetching orders...\nFetching products...\nusers: done (0.3s)\norders: done (0.2s)\nproducts: done (0.1s)',
      },
      {
        title: 'itertools: chain, combinations, permutations',
        code: [
          'from itertools import chain, combinations, permutations, product',
          '',
          '# chain: flatten multiple iterables',
          'a = [1, 2]',
          'b = [3, 4]',
          'c = [5, 6]',
          'print(list(chain(a, b, c)))',
          '',
          '# combinations (order does not matter)',
          'team = ["A", "B", "C", "D"]',
          'pairs = list(combinations(team, 2))',
          'print(f"Pairs: {pairs}")',
          '',
          '# permutations (order matters)',
          'perms = list(permutations(["x", "y", "z"], 2))',
          'print(f"Perms: {perms}")',
          '',
          '# product (cartesian product)',
          'grid = list(product(range(2), repeat=3))',
          'print(f"Binary: {grid}")',
        ],
        output: '[1, 2, 3, 4, 5, 6]\nPairs: [(\'A\', \'B\'), (\'A\', \'C\'), (\'A\', \'D\'), (\'B\', \'C\'), (\'B\', \'D\'), (\'C\', \'D\')]\nPerms: [(\'x\', \'y\'), (\'x\', \'z\'), (\'y\', \'x\'), (\'y\', \'z\'), (\'z\', \'x\'), (\'z\', \'y\')]\nBinary: [(0, 0, 0), (0, 0, 1), (0, 1, 0), (0, 1, 1), (1, 0, 0), (1, 0, 1), (1, 1, 0), (1, 1, 1)]',
      },
      {
        title: 'functools: reduce, partial, lru_cache',
        code: [
          'from functools import reduce, partial, lru_cache',
          '',
          '# reduce: fold a sequence to a single value',
          'nums = [1, 2, 3, 4, 5]',
          'product = reduce(lambda a, b: a * b, nums)',
          'print(f"Product: {product}")',
          '',
          '# partial: pre-fill function arguments',
          'def power(base, exp):',
          '    return base ** exp',
          '',
          'square = partial(power, exp=2)',
          'cube = partial(power, exp=3)',
          'print(f"5^2={square(5)}, 3^3={cube(3)}")',
          '',
          '# lru_cache: automatic memoization',
          '@lru_cache(maxsize=128)',
          'def fib(n: int) -> int:',
          '    if n < 2:',
          '        return n',
          '    return fib(n - 1) + fib(n - 2)',
          '',
          'print(f"fib(30) = {fib(30)}")',
          'print(f"fib(50) = {fib(50)}")',
          'print(f"Cache: {fib.cache_info()}")',
        ],
        output: 'Product: 120\n5^2=25, 3^3=27\nfib(30) = 832040\nfib(50) = 12586269025\nCache: CacheInfo(hits=48, misses=51, maxsize=128, currsize=51)',
      },
    ],
    exercises: [
      {
        question: 'Run an async function using asyncio',
        code: 'import asyncio\nasync def hello():\n    return "hi"\nasyncio.___(hello())',
        answer: 'run',
        hint: 'The asyncio function that creates an event loop and runs a coroutine',
      },
      {
        question: 'Use reduce to sum a list of numbers',
        code: 'from functools import reduce\nnums = [1, 2, 3, 4]\ntotal = reduce(lambda a, b: ___, nums)',
        answer: 'a + b',
        hint: 'The lambda takes two arguments and should return their sum',
      },
    ],
  },
};

const topicKeys = Object.keys(topics);

// ── Syntax highlighting ──────────────────────────────────────────────────────

const KEYWORDS = new Set([
  'def', 'class', 'return', 'if', 'elif', 'else', 'for', 'while', 'in',
  'import', 'from', 'try', 'except', 'finally', 'raise', 'with', 'as',
  'yield', 'lambda', 'pass', 'break', 'continue', 'True', 'False', 'None',
  'and', 'or', 'not', 'is', 'async', 'await', 'global', 'nonlocal', 'del',
  'assert', 'match', 'case',
]);

const BUILTINS = new Set([
  'print', 'len', 'range', 'type', 'int', 'str', 'float', 'bool', 'list',
  'dict', 'set', 'tuple', 'sum', 'min', 'max', 'abs', 'round', 'sorted',
  'enumerate', 'zip', 'map', 'filter', 'any', 'all', 'next', 'iter',
  'open', 'input', 'isinstance', 'issubclass', 'super', 'property',
  'staticmethod', 'classmethod', 'repr', 'hash', 'id', 'vars', 'dir',
  'getattr', 'setattr', 'hasattr', 'callable',
]);

function highlightLine(line: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  let i = 0;
  let key = 0;

  while (i < line.length) {
    // Decorator
    if (line[i] === '@' && (i === 0 || /\s/.test(line[i - 1]))) {
      const start = i;
      i++;
      while (i < line.length && /[a-zA-Z0-9_.]/.test(line[i])) i++;
      nodes.push(
        <span key={key++} className="text-purple-400">
          {line.slice(start, i)}
        </span>
      );
      continue;
    }

    // Comments
    if (line[i] === '#') {
      nodes.push(
        <span key={key++} className="text-gray-500">
          {line.slice(i)}
        </span>
      );
      break;
    }

    // Strings
    if (
      line[i] === '"' || line[i] === "'" ||
      (line[i] === 'f' && i + 1 < line.length && (line[i + 1] === '"' || line[i + 1] === "'"))
    ) {
      const isFString = line[i] === 'f';
      const start = i;
      if (isFString) i++;
      const quoteChar = line[i];
      const triple = line.substring(i, i + 3) === quoteChar.repeat(3);
      const quote = triple ? quoteChar.repeat(3) : quoteChar;
      i += quote.length;
      while (i < line.length) {
        if (line[i] === '\\') { i += 2; continue; }
        if (line.substring(i, i + quote.length) === quote) { i += quote.length; break; }
        i++;
      }
      nodes.push(
        <span key={key++} className="text-green-400">
          {line.slice(start, i)}
        </span>
      );
      continue;
    }

    // Numbers
    if (/\d/.test(line[i]) && (i === 0 || /[\s(,=[\-+*/<>:!%|&^~{]/.test(line[i - 1]))) {
      const start = i;
      while (i < line.length && /[\d._eE+\-]/.test(line[i])) i++;
      nodes.push(
        <span key={key++} className="text-orange-400">
          {line.slice(start, i)}
        </span>
      );
      continue;
    }

    // Words (keywords, builtins, identifiers)
    if (/[a-zA-Z_]/.test(line[i])) {
      const start = i;
      while (i < line.length && /[a-zA-Z0-9_]/.test(line[i])) i++;
      const word = line.slice(start, i);
      if (KEYWORDS.has(word)) {
        nodes.push(
          <span key={key++} className="text-blue-400">{word}</span>
        );
      } else if (BUILTINS.has(word)) {
        nodes.push(
          <span key={key++} className="text-yellow-400">{word}</span>
        );
      } else {
        nodes.push(<span key={key++}>{word}</span>);
      }
      continue;
    }

    // Default
    nodes.push(<span key={key++}>{line[i]}</span>);
    i++;
  }

  return nodes;
}

// ── Component ────────────────────────────────────────────────────────────────

export const PythonLab: React.FC = () => {
  const [activeTopic, setActiveTopic] = useState('intro');
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [results, setResults] = useState<Record<string, boolean | null>>({});

  const topic = topics[activeTopic];

  const exKey = (idx: number) => `${activeTopic}-ex${idx}`;

  const handleCheck = (idx: number) => {
    const key = exKey(idx);
    const trimmed = (inputs[key] ?? '').trim();
    const expected = topic.exercises[idx].answer.trim();
    setResults((p) => ({ ...p, [key]: trimmed === expected }));
  };

  const handleReset = (idx: number) => {
    const key = exKey(idx);
    setInputs((p) => ({ ...p, [key]: '' }));
    setResults((p) => ({ ...p, [key]: null }));
  };

  const completedTopics = topicKeys.filter((k) =>
    topics[k].exercises.every((_, i) => results[`${k}-ex${i}`] === true)
  );

  return (
    <div className="h-full flex flex-col overflow-hidden bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-950 dark:to-blue-950/20">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-200 dark:border-gray-800 bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm">
        <Code size={16} className="text-blue-600 dark:text-blue-400" />
        <h1 className="text-sm font-semibold text-slate-800 dark:text-gray-100">
          Python Lab
        </h1>
        <span className="text-[11px] text-slate-400 dark:text-gray-500 ml-1">
          Interactive Reference & Practice
        </span>
        <div className="ml-auto flex items-center gap-1.5 text-[11px] text-slate-400 dark:text-gray-500">
          <Check size={11} className="text-emerald-500" />
          {completedTopics.length}/{topicKeys.length}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-56 shrink-0 border-r border-slate-200 dark:border-gray-800 bg-white/40 dark:bg-gray-900/40 overflow-y-auto">
          <nav className="py-2">
            {topicKeys.map((key, i) => {
              const t = topics[key];
              const isActive = activeTopic === key;
              const isDone = completedTopics.includes(key);
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
                    {i + 1}
                  </span>
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
        <main className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Title */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <BookOpen size={16} className="text-blue-600 dark:text-blue-400" />
              <h2 className="text-lg font-semibold text-slate-800 dark:text-gray-100">
                {topic.title}
              </h2>
            </div>
            <p className="text-[13px] leading-relaxed text-slate-600 dark:text-gray-400 max-w-2xl">
              {topic.explanation}
            </p>
          </div>

          {/* Examples */}
          {topic.examples.map((ex, eIdx) => (
            <div key={eIdx} className="max-w-2xl">
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 rounded-t-lg border-b border-gray-700">
                <Code size={12} className="text-gray-400" />
                <span className="text-[11px] text-gray-400">{ex.title}</span>
              </div>
              <div className="bg-gray-950 rounded-b-lg p-3 font-mono text-[12px] text-gray-200 leading-relaxed overflow-x-auto">
                {ex.code.map((line, lIdx) => (
                  <div key={lIdx} className="min-h-[1.3em]">
                    {line === '' ? '\u00A0' : highlightLine(line)}
                  </div>
                ))}
              </div>
              {ex.output && (
                <div className="mt-1">
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-200 dark:bg-gray-800 rounded-t-lg">
                    <ChevronRight size={11} className="text-slate-500 dark:text-gray-400" />
                    <span className="text-[11px] text-slate-500 dark:text-gray-400">Output</span>
                  </div>
                  <div className="bg-slate-100 dark:bg-gray-800/60 rounded-b-lg p-3 font-mono text-[12px] text-slate-700 dark:text-gray-300 whitespace-pre-wrap">
                    {ex.output}
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Exercises */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-gray-300 flex items-center gap-2">
              <BookOpen size={14} className="text-amber-500" />
              Exercises
            </h3>

            {topic.exercises.map((exercise, idx) => {
              const key = exKey(idx);
              const value = inputs[key] ?? '';
              const result = results[key] ?? null;

              return (
                <div
                  key={idx}
                  className={`max-w-2xl border rounded-lg bg-white dark:bg-gray-900/60 overflow-hidden transition-colors ${
                    result === true
                      ? 'border-emerald-400 dark:border-emerald-600'
                      : result === false
                      ? 'border-red-400 dark:border-red-600'
                      : 'border-slate-200 dark:border-gray-800'
                  }`}
                >
                  <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 dark:bg-gray-800/40 border-b border-slate-200 dark:border-gray-800">
                    <span className="text-[11px] font-bold text-slate-400 dark:text-gray-500">
                      #{idx + 1}
                    </span>
                    <span className="text-[13px] text-slate-700 dark:text-gray-300">
                      {exercise.question}
                    </span>
                  </div>

                  <div className="p-4 space-y-3">
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

                    {/* Input + buttons */}
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <input
                          type="text"
                          value={value}
                          onChange={(e) => {
                            setInputs((p) => ({ ...p, [key]: e.target.value }));
                            if (result !== null) {
                              setResults((p) => ({ ...p, [key]: null }));
                            }
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && value.trim()) handleCheck(idx);
                          }}
                          placeholder="Type your answer..."
                          className={`w-full px-3 py-2 text-[13px] rounded-md border bg-white dark:bg-gray-800 text-slate-800 dark:text-gray-200 placeholder-slate-400 dark:placeholder-gray-600 outline-none transition-colors ${
                            result === true
                              ? 'border-emerald-400 dark:border-emerald-500'
                              : result === false
                              ? 'border-red-400 dark:border-red-500'
                              : 'border-slate-300 dark:border-gray-700 focus:border-blue-400 dark:focus:border-blue-500'
                          }`}
                        />
                        {result === true && (
                          <Check size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-emerald-500" />
                        )}
                        {result === false && (
                          <X size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-red-500" />
                        )}
                      </div>

                      <button
                        onClick={() => handleCheck(idx)}
                        disabled={!value.trim()}
                        className="flex items-center gap-1.5 px-3 py-2 text-[12px] font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      >
                        <Check size={12} />
                        Check
                      </button>

                      <button
                        onClick={() => handleReset(idx)}
                        className="flex items-center gap-1.5 px-3 py-2 text-[12px] font-medium rounded-md border border-slate-300 dark:border-gray-700 text-slate-600 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-gray-800 transition-colors"
                      >
                        <RotateCcw size={12} />
                        Reset
                      </button>
                    </div>

                    {/* Feedback */}
                    {result === true && (
                      <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
                        <Check size={14} className="text-emerald-600 dark:text-emerald-400" />
                        <span className="text-[12px] text-emerald-700 dark:text-emerald-300">
                          Correct! Well done.
                        </span>
                      </div>
                    )}

                    {result === false && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                          <X size={14} className="text-red-600 dark:text-red-400" />
                          <span className="text-[12px] text-red-700 dark:text-red-300">
                            Not quite. Try again or check the hint below.
                          </span>
                        </div>
                        <div className="flex items-start gap-2 px-3 py-2 rounded-md bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800">
                          <BookOpen size={13} className="text-amber-500 mt-0.5 shrink-0" />
                          <span className="text-[12px] text-amber-700 dark:text-amber-300">
                            Hint: {exercise.hint}
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
          <div className="max-w-2xl flex items-center justify-between pt-2 pb-6">
            <button
              onClick={() => {
                const idx = topicKeys.indexOf(activeTopic);
                if (idx > 0) setActiveTopic(topicKeys[idx - 1]);
              }}
              disabled={topicKeys.indexOf(activeTopic) === 0}
              className="flex items-center gap-1.5 px-4 py-2 text-[13px] font-medium rounded-md border border-slate-300 dark:border-gray-700 text-slate-600 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={14} className="rotate-180" />
              Previous
            </button>
            <span className="text-[12px] text-slate-400 dark:text-gray-600">
              {topicKeys.indexOf(activeTopic) + 1} / {topicKeys.length}
            </span>
            <button
              onClick={() => {
                const idx = topicKeys.indexOf(activeTopic);
                if (idx < topicKeys.length - 1) setActiveTopic(topicKeys[idx + 1]);
              }}
              disabled={topicKeys.indexOf(activeTopic) === topicKeys.length - 1}
              className="flex items-center gap-1.5 px-4 py-2 text-[13px] font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              Next
              <ChevronRight size={14} />
            </button>
          </div>
        </main>
      </div>
    </div>
  );
};
