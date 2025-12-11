import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Calculator, Binary, Sigma, Zap } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type NumberBase = 'decimal' | 'binary' | 'hexadecimal' | 'octal';
type AngleMode = 'degrees' | 'radians';

export const SuperCalculator = () => {
  const [display, setDisplay] = useState('0');
  const [prevValue, setPrevValue] = useState<number | null>(null);
  const [operator, setOperator] = useState<string | null>(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);
  const [memory, setMemory] = useState(0);
  const [history, setHistory] = useState<string[]>([]);
  const [mode, setMode] = useState<'basic' | 'scientific' | 'programmer' | 'physics'>('basic');
  const [numberBase, setNumberBase] = useState<NumberBase>('decimal');
  const [angleMode, setAngleMode] = useState<AngleMode>('degrees');

  const inputDigit = (digit: string) => {
    if (waitingForOperand) {
      setDisplay(digit);
      setWaitingForOperand(false);
    } else {
      // In programmer mode (binary, octal, hex), allow leading zeros
      // In decimal mode, replace '0' with the digit (unless it's a decimal number)
      if (numberBase !== 'decimal') {
        // Programmer mode: always append
        setDisplay(display + digit);
      } else {
        // Decimal mode: replace '0' only if there's no decimal point
        setDisplay(display === '0' && display.indexOf('.') === -1 ? digit : display + digit);
      }
    }
  };

  const inputDot = () => {
    if (numberBase !== 'decimal') return;
    if (waitingForOperand) {
      setDisplay('0.');
      setWaitingForOperand(false);
      return;
    }
    if (display.indexOf('.') === -1) {
      setDisplay(display + '.');
    }
  };

  const clearDisplay = () => {
    setDisplay('0');
    setPrevValue(null);
    setOperator(null);
    setWaitingForOperand(false);
  };

  const performOperation = (nextOperator: string) => {
    const inputValue = parseFloat(display);

    if (prevValue === null) {
      setPrevValue(inputValue);
    } else if (operator) {
      const currentValue = prevValue || 0;
      let newValue = 0;

      switch (operator) {
        case '+': newValue = currentValue + inputValue; break;
        case '-': newValue = currentValue - inputValue; break;
        case '×': newValue = currentValue * inputValue; break;
        case '÷': newValue = currentValue / inputValue; break;
        case '^': newValue = Math.pow(currentValue, inputValue); break;
        case 'mod': newValue = currentValue % inputValue; break;
        case 'AND': newValue = Math.floor(currentValue) & Math.floor(inputValue); break;
        case 'OR': newValue = Math.floor(currentValue) | Math.floor(inputValue); break;
        case 'XOR': newValue = Math.floor(currentValue) ^ Math.floor(inputValue); break;
        default: newValue = inputValue;
      }

      setPrevValue(newValue);
      setDisplay(String(newValue));
      addToHistory(`${currentValue} ${operator} ${inputValue} = ${newValue}`);
    }

    setWaitingForOperand(true);
    setOperator(nextOperator);
  };

  const scientificFunction = (func: string) => {
    const value = parseFloat(display);
    let result = 0;
    const toRadians = angleMode === 'degrees' ? Math.PI / 180 : 1;

    switch (func) {
      case 'sin': result = Math.sin(value * toRadians); break;
      case 'cos': result = Math.cos(value * toRadians); break;
      case 'tan': result = Math.tan(value * toRadians); break;
      case 'asin': result = Math.asin(value) / toRadians; break;
      case 'acos': result = Math.acos(value) / toRadians; break;
      case 'atan': result = Math.atan(value) / toRadians; break;
      case 'sinh': result = Math.sinh(value); break;
      case 'cosh': result = Math.cosh(value); break;
      case 'tanh': result = Math.tanh(value); break;
      case 'ln': result = Math.log(value); break;
      case 'log': result = Math.log10(value); break;
      case 'log2': result = Math.log2(value); break;
      case 'sqrt': result = Math.sqrt(value); break;
      case 'cbrt': result = Math.cbrt(value); break;
      case '1/x': result = 1 / value; break;
      case 'x²': result = value * value; break;
      case 'x³': result = value * value * value; break;
      case '!': result = factorial(value); break;
      case 'e^x': result = Math.exp(value); break;
      case '10^x': result = Math.pow(10, value); break;
      case '2^x': result = Math.pow(2, value); break;
      case '|x|': result = Math.abs(value); break;
      case 'floor': result = Math.floor(value); break;
      case 'ceil': result = Math.ceil(value); break;
      case 'round': result = Math.round(value); break;
      case 'NOT': result = ~Math.floor(value); break;
    }

    setDisplay(String(result));
    setWaitingForOperand(true);
    addToHistory(`${func}(${value}) = ${result}`);
  };

  const factorial = (n: number): number => {
    if (n < 0) return NaN;
    if (n === 0 || n === 1) return 1;
    if (n > 170) return Infinity;
    return n * factorial(n - 1);
  };

  const insertConstant = (constant: string) => {
    let value = 0;
    switch (constant) {
      case 'π': value = Math.PI; break;
      case 'e': value = Math.E; break;
      case 'φ': value = (1 + Math.sqrt(5)) / 2; break; // Golden ratio
      case 'c': value = 299792458; break; // Speed of light
      case 'g': value = 9.80665; break; // Gravity
      case 'h': value = 6.62607015e-34; break; // Planck
      case 'k': value = 1.380649e-23; break; // Boltzmann
      case 'Na': value = 6.02214076e23; break; // Avogadro
    }
    setDisplay(String(value));
    setWaitingForOperand(true);
  };

  const convertBase = (value: string, from: NumberBase, to: NumberBase): string => {
    let decimal: number;
    
    switch (from) {
      case 'binary': decimal = parseInt(value, 2); break;
      case 'octal': decimal = parseInt(value, 8); break;
      case 'hexadecimal': decimal = parseInt(value, 16); break;
      default: decimal = parseFloat(value);
    }

    if (isNaN(decimal)) return '0';

    switch (to) {
      case 'binary': return decimal.toString(2);
      case 'octal': return decimal.toString(8);
      case 'hexadecimal': return decimal.toString(16).toUpperCase();
      default: return decimal.toString();
    }
  };

  const handleBaseChange = (newBase: NumberBase) => {
    const converted = convertBase(display, numberBase, newBase);
    setDisplay(converted);
    setNumberBase(newBase);
  };

  const addToHistory = (entry: string) => {
    setHistory(prev => [entry, ...prev.slice(0, 9)]);
  };

  const memoryAdd = () => {
    setMemory(memory + parseFloat(display));
  };

  const memorySubtract = () => {
    setMemory(memory - parseFloat(display));
  };

  const memoryRecall = () => {
    setDisplay(String(memory));
    setWaitingForOperand(true);
  };

  const memoryClear = () => {
    setMemory(0);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        e.preventDefault();
        inputDigit(e.key);
      } else if (e.key === '.') {
        e.preventDefault();
        inputDot();
      } else if (['+', '-', '*', '/'].includes(e.key)) {
        e.preventDefault();
        const op = e.key === '*' ? '×' : e.key === '/' ? '÷' : e.key;
        performOperation(op);
      } else if (e.key === '=' || e.key === 'Enter') {
        e.preventDefault();
        performOperation('=');
      } else if (e.key === 'Escape') {
        e.preventDefault();
        clearDisplay();
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        if (display !== '0' && !waitingForOperand) {
          setDisplay(display.length > 1 ? display.slice(0, -1) : '0');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [display, operator, prevValue, waitingForOperand]);

  return (
    <div className="p-6 h-full bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:to-gray-800 overflow-auto">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl">
            <Calculator className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold dark:text-white">Super Calculator</h1>
            <p className="text-gray-600 dark:text-gray-400">Advanced Scientific & Programmer Calculator</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-4 gap-4">
          <div className="lg:col-span-3">
            <Tabs value={mode} onValueChange={(v) => setMode(v as any)} className="w-full">
              <TabsList className="grid w-full grid-cols-4 mb-4">
                <TabsTrigger value="basic">
                  <Calculator className="h-4 w-4 mr-2" />
                  Basic
                </TabsTrigger>
                <TabsTrigger value="scientific">
                  <Sigma className="h-4 w-4 mr-2" />
                  Scientific
                </TabsTrigger>
                <TabsTrigger value="programmer">
                  <Binary className="h-4 w-4 mr-2" />
                  Programmer
                </TabsTrigger>
                <TabsTrigger value="physics">
                  <Zap className="h-4 w-4 mr-2" />
                  Physics
                </TabsTrigger>
              </TabsList>

              <Card className="p-6 dark:bg-gray-800">
                {/* Display */}
                <div className="bg-gray-100 dark:bg-gray-700 p-6 text-right text-4xl font-mono rounded-lg mb-4 break-all min-h-[100px] flex flex-col justify-end">
                  {numberBase !== 'decimal' && (
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                      {numberBase.toUpperCase()}
                    </div>
                  )}
                  <span className="dark:text-white">{display}</span>
                </div>

                {/* Memory & Mode Indicators */}
                <div className="flex justify-between items-center mb-4 text-sm">
                  <div className="flex gap-4">
                    {memory !== 0 && (
                      <span className="text-blue-600 dark:text-blue-400 font-semibold">
                        M: {memory}
                      </span>
                    )}
                    {mode === 'scientific' && (
                      <span className="text-purple-600 dark:text-purple-400">
                        {angleMode === 'degrees' ? 'DEG' : 'RAD'}
                      </span>
                    )}
                  </div>
                </div>

                <TabsContent value="basic" className="mt-0">
                  <div className="grid grid-cols-4 gap-3">
                    <Button variant="outline" onClick={clearDisplay} className="col-span-2 h-16 text-lg font-semibold">AC</Button>
                    <Button variant="outline" onClick={() => performOperation('mod')} className="h-16 text-lg">%</Button>
                    <Button variant="outline" onClick={() => performOperation('÷')} className="h-16 text-lg">÷</Button>

                    <Button onClick={() => inputDigit('7')} className="h-16 text-xl">7</Button>
                    <Button onClick={() => inputDigit('8')} className="h-16 text-xl">8</Button>
                    <Button onClick={() => inputDigit('9')} className="h-16 text-xl">9</Button>
                    <Button variant="outline" onClick={() => performOperation('×')} className="h-16 text-lg">×</Button>

                    <Button onClick={() => inputDigit('4')} className="h-16 text-xl">4</Button>
                    <Button onClick={() => inputDigit('5')} className="h-16 text-xl">5</Button>
                    <Button onClick={() => inputDigit('6')} className="h-16 text-xl">6</Button>
                    <Button variant="outline" onClick={() => performOperation('-')} className="h-16 text-lg">−</Button>

                    <Button onClick={() => inputDigit('1')} className="h-16 text-xl">1</Button>
                    <Button onClick={() => inputDigit('2')} className="h-16 text-xl">2</Button>
                    <Button onClick={() => inputDigit('3')} className="h-16 text-xl">3</Button>
                    <Button variant="outline" onClick={() => performOperation('+')} className="h-16 text-lg">+</Button>

                    <Button onClick={() => inputDigit('0')} className="col-span-2 h-16 text-xl">0</Button>
                    <Button onClick={inputDot} className="h-16 text-xl">.</Button>
                    <Button variant="secondary" onClick={() => performOperation('=')} className="h-16 text-lg">=</Button>
                  </div>
                </TabsContent>

                <TabsContent value="scientific" className="mt-0">
                  <div className="space-y-3">
                    <div className="flex gap-2 mb-3">
                      <Button
                        size="sm"
                        variant={angleMode === 'degrees' ? 'default' : 'outline'}
                        onClick={() => setAngleMode('degrees')}
                      >
                        DEG
                      </Button>
                      <Button
                        size="sm"
                        variant={angleMode === 'radians' ? 'default' : 'outline'}
                        onClick={() => setAngleMode('radians')}
                      >
                        RAD
                      </Button>
                    </div>

                    <div className="grid grid-cols-6 gap-2">
                      {/* Trigonometric Functions */}
                      <Button variant="outline" onClick={() => scientificFunction('sin')} className="h-12 text-sm">sin</Button>
                      <Button variant="outline" onClick={() => scientificFunction('cos')} className="h-12 text-sm">cos</Button>
                      <Button variant="outline" onClick={() => scientificFunction('tan')} className="h-12 text-sm">tan</Button>
                      <Button variant="outline" onClick={() => scientificFunction('asin')} className="h-12 text-sm">asin</Button>
                      <Button variant="outline" onClick={() => scientificFunction('acos')} className="h-12 text-sm">acos</Button>
                      <Button variant="outline" onClick={() => scientificFunction('atan')} className="h-12 text-sm">atan</Button>

                      {/* Hyperbolic Functions */}
                      <Button variant="outline" onClick={() => scientificFunction('sinh')} className="h-12 text-sm">sinh</Button>
                      <Button variant="outline" onClick={() => scientificFunction('cosh')} className="h-12 text-sm">cosh</Button>
                      <Button variant="outline" onClick={() => scientificFunction('tanh')} className="h-12 text-sm">tanh</Button>
                      <Button variant="outline" onClick={() => insertConstant('π')} className="h-12 text-sm">π</Button>
                      <Button variant="outline" onClick={() => insertConstant('e')} className="h-12 text-sm">e</Button>
                      <Button variant="outline" onClick={() => insertConstant('φ')} className="h-12 text-sm">φ</Button>

                      {/* Logarithms */}
                      <Button variant="outline" onClick={() => scientificFunction('ln')} className="h-12 text-sm">ln</Button>
                      <Button variant="outline" onClick={() => scientificFunction('log')} className="h-12 text-sm">log</Button>
                      <Button variant="outline" onClick={() => scientificFunction('log2')} className="h-12 text-sm">log₂</Button>
                      <Button variant="outline" onClick={() => scientificFunction('e^x')} className="h-12 text-sm">eˣ</Button>
                      <Button variant="outline" onClick={() => scientificFunction('10^x')} className="h-12 text-sm">10ˣ</Button>
                      <Button variant="outline" onClick={() => scientificFunction('2^x')} className="h-12 text-sm">2ˣ</Button>

                      {/* Powers & Roots */}
                      <Button variant="outline" onClick={() => scientificFunction('sqrt')} className="h-12 text-sm">√x</Button>
                      <Button variant="outline" onClick={() => scientificFunction('cbrt')} className="h-12 text-sm">∛x</Button>
                      <Button variant="outline" onClick={() => scientificFunction('x²')} className="h-12 text-sm">x²</Button>
                      <Button variant="outline" onClick={() => scientificFunction('x³')} className="h-12 text-sm">x³</Button>
                      <Button variant="outline" onClick={() => performOperation('^')} className="h-12 text-sm">xʸ</Button>
                      <Button variant="outline" onClick={() => scientificFunction('1/x')} className="h-12 text-sm">1/x</Button>

                      {/* Other Functions */}
                      <Button variant="outline" onClick={() => scientificFunction('!')} className="h-12 text-sm">n!</Button>
                      <Button variant="outline" onClick={() => scientificFunction('|x|')} className="h-12 text-sm">|x|</Button>
                      <Button variant="outline" onClick={() => scientificFunction('floor')} className="h-12 text-sm">⌊x⌋</Button>
                      <Button variant="outline" onClick={() => scientificFunction('ceil')} className="h-12 text-sm">⌈x⌉</Button>
                      <Button variant="outline" onClick={() => scientificFunction('round')} className="h-12 text-sm">round</Button>
                      <Button variant="outline" onClick={clearDisplay} className="h-12 text-sm">AC</Button>
                    </div>

                    <div className="grid grid-cols-4 gap-2 mt-4">
                      <Button onClick={() => inputDigit('7')} className="h-12">7</Button>
                      <Button onClick={() => inputDigit('8')} className="h-12">8</Button>
                      <Button onClick={() => inputDigit('9')} className="h-12">9</Button>
                      <Button variant="outline" onClick={() => performOperation('÷')} className="h-12">÷</Button>

                      <Button onClick={() => inputDigit('4')} className="h-12">4</Button>
                      <Button onClick={() => inputDigit('5')} className="h-12">5</Button>
                      <Button onClick={() => inputDigit('6')} className="h-12">6</Button>
                      <Button variant="outline" onClick={() => performOperation('×')} className="h-12">×</Button>

                      <Button onClick={() => inputDigit('1')} className="h-12">1</Button>
                      <Button onClick={() => inputDigit('2')} className="h-12">2</Button>
                      <Button onClick={() => inputDigit('3')} className="h-12">3</Button>
                      <Button variant="outline" onClick={() => performOperation('-')} className="h-12">−</Button>

                      <Button onClick={() => inputDigit('0')} className="col-span-2 h-12">0</Button>
                      <Button onClick={inputDot} className="h-12">.</Button>
                      <Button variant="outline" onClick={() => performOperation('+')} className="h-12">+</Button>
                    </div>

                    <Button variant="secondary" onClick={() => performOperation('=')} className="w-full h-12">=</Button>
                  </div>
                </TabsContent>

                <TabsContent value="programmer" className="mt-0">
                  <div className="space-y-4">
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant={numberBase === 'decimal' ? 'default' : 'outline'}
                        onClick={() => handleBaseChange('decimal')}
                      >
                        DEC
                      </Button>
                      <Button
                        size="sm"
                        variant={numberBase === 'binary' ? 'default' : 'outline'}
                        onClick={() => handleBaseChange('binary')}
                      >
                        BIN
                      </Button>
                      <Button
                        size="sm"
                        variant={numberBase === 'octal' ? 'default' : 'outline'}
                        onClick={() => handleBaseChange('octal')}
                      >
                        OCT
                      </Button>
                      <Button
                        size="sm"
                        variant={numberBase === 'hexadecimal' ? 'default' : 'outline'}
                        onClick={() => handleBaseChange('hexadecimal')}
                      >
                        HEX
                      </Button>
                    </div>

                    {/* Bitwise Operations */}
                    <div className="grid grid-cols-4 gap-2">
                      <Button variant="outline" onClick={() => performOperation('AND')} className="h-12">AND</Button>
                      <Button variant="outline" onClick={() => performOperation('OR')} className="h-12">OR</Button>
                      <Button variant="outline" onClick={() => performOperation('XOR')} className="h-12">XOR</Button>
                      <Button variant="outline" onClick={() => scientificFunction('NOT')} className="h-12">NOT</Button>
                    </div>

                    {/* Hex Digits */}
                    {numberBase === 'hexadecimal' && (
                      <div className="grid grid-cols-6 gap-2">
                        <Button onClick={() => inputDigit('A')} className="h-12">A</Button>
                        <Button onClick={() => inputDigit('B')} className="h-12">B</Button>
                        <Button onClick={() => inputDigit('C')} className="h-12">C</Button>
                        <Button onClick={() => inputDigit('D')} className="h-12">D</Button>
                        <Button onClick={() => inputDigit('E')} className="h-12">E</Button>
                        <Button onClick={() => inputDigit('F')} className="h-12">F</Button>
                      </div>
                    )}

                    {/* Number Pad */}
                    <div className="grid grid-cols-4 gap-2">
                      <Button onClick={() => inputDigit('7')} className="h-12" disabled={numberBase === 'binary'}>7</Button>
                      <Button onClick={() => inputDigit('8')} className="h-12" disabled={numberBase === 'binary' || numberBase === 'octal'}>8</Button>
                      <Button onClick={() => inputDigit('9')} className="h-12" disabled={numberBase === 'binary' || numberBase === 'octal'}>9</Button>
                      <Button variant="outline" onClick={() => performOperation('÷')} className="h-12">÷</Button>

                      <Button onClick={() => inputDigit('4')} className="h-12" disabled={numberBase === 'binary'}>4</Button>
                      <Button onClick={() => inputDigit('5')} className="h-12" disabled={numberBase === 'binary'}>5</Button>
                      <Button onClick={() => inputDigit('6')} className="h-12" disabled={numberBase === 'binary'}>6</Button>
                      <Button variant="outline" onClick={() => performOperation('×')} className="h-12">×</Button>

                      <Button onClick={() => inputDigit('1')} className="h-12">1</Button>
                      <Button onClick={() => inputDigit('2')} className="h-12" disabled={numberBase === 'binary'}>2</Button>
                      <Button onClick={() => inputDigit('3')} className="h-12" disabled={numberBase === 'binary'}>3</Button>
                      <Button variant="outline" onClick={() => performOperation('-')} className="h-12">−</Button>

                      <Button onClick={() => inputDigit('0')} className="col-span-2 h-12">0</Button>
                      <Button variant="outline" onClick={clearDisplay} className="h-12">AC</Button>
                      <Button variant="outline" onClick={() => performOperation('+')} className="h-12">+</Button>
                    </div>

                    <Button variant="secondary" onClick={() => performOperation('=')} className="w-full h-12">=</Button>

                    {/* Conversion Display */}
                    <Card className="p-4 bg-blue-50 dark:bg-gray-700">
                      <h3 className="font-bold mb-2 dark:text-white text-sm">Conversions</h3>
                      <div className="space-y-1 text-xs font-mono dark:text-gray-300">
                        <p><strong>DEC:</strong> {convertBase(display, numberBase, 'decimal')}</p>
                        <p><strong>BIN:</strong> {convertBase(display, numberBase, 'binary')}</p>
                        <p><strong>OCT:</strong> {convertBase(display, numberBase, 'octal')}</p>
                        <p><strong>HEX:</strong> {convertBase(display, numberBase, 'hexadecimal')}</p>
                      </div>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="physics" className="mt-0">
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-2">
                      <Button variant="outline" onClick={() => insertConstant('c')} className="h-12 text-sm">
                        <Zap className="h-4 w-4 mr-1" />c
                      </Button>
                      <Button variant="outline" onClick={() => insertConstant('g')} className="h-12 text-sm">g</Button>
                      <Button variant="outline" onClick={() => insertConstant('h')} className="h-12 text-sm">h</Button>
                      <Button variant="outline" onClick={() => insertConstant('k')} className="h-12 text-sm">k</Button>
                      <Button variant="outline" onClick={() => insertConstant('Na')} className="h-12 text-sm">Nₐ</Button>
                      <Button variant="outline" onClick={() => insertConstant('π')} className="h-12 text-sm">π</Button>
                    </div>

                    <div className="grid grid-cols-4 gap-2">
                      <Button onClick={() => inputDigit('7')} className="h-12">7</Button>
                      <Button onClick={() => inputDigit('8')} className="h-12">8</Button>
                      <Button onClick={() => inputDigit('9')} className="h-12">9</Button>
                      <Button variant="outline" onClick={() => performOperation('÷')} className="h-12">÷</Button>

                      <Button onClick={() => inputDigit('4')} className="h-12">4</Button>
                      <Button onClick={() => inputDigit('5')} className="h-12">5</Button>
                      <Button onClick={() => inputDigit('6')} className="h-12">6</Button>
                      <Button variant="outline" onClick={() => performOperation('×')} className="h-12">×</Button>

                      <Button onClick={() => inputDigit('1')} className="h-12">1</Button>
                      <Button onClick={() => inputDigit('2')} className="h-12">2</Button>
                      <Button onClick={() => inputDigit('3')} className="h-12">3</Button>
                      <Button variant="outline" onClick={() => performOperation('-')} className="h-12">−</Button>

                      <Button onClick={() => inputDigit('0')} className="col-span-2 h-12">0</Button>
                      <Button onClick={inputDot} className="h-12">.</Button>
                      <Button variant="outline" onClick={() => performOperation('+')} className="h-12">+</Button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <Button variant="outline" onClick={clearDisplay} className="h-12">Clear</Button>
                      <Button variant="secondary" onClick={() => performOperation('=')} className="h-12">=</Button>
                    </div>

                    <Card className="p-4 bg-blue-50 dark:bg-gray-700">
                      <h3 className="font-bold mb-2 dark:text-white text-sm">Physics Constants</h3>
                      <div className="text-xs space-y-1 dark:text-gray-300">
                        <p><strong>c:</strong> Speed of light = 2.998×10⁸ m/s</p>
                        <p><strong>g:</strong> Gravity = 9.807 m/s²</p>
                        <p><strong>h:</strong> Planck = 6.626×10⁻³⁴ J·s</p>
                        <p><strong>k:</strong> Boltzmann = 1.381×10⁻²³ J/K</p>
                        <p><strong>Nₐ:</strong> Avogadro = 6.022×10²³ mol⁻¹</p>
                      </div>
                    </Card>
                  </div>
                </TabsContent>
              </Card>
            </Tabs>
          </div>

          {/* Side Panel */}
          <div className="space-y-4">
            <Card className="p-4 dark:bg-gray-800">
              <h3 className="font-bold mb-3 dark:text-white">Memory</h3>
              <div className="grid grid-cols-2 gap-2">
                <Button size="sm" variant="outline" onClick={memoryAdd}>M+</Button>
                <Button size="sm" variant="outline" onClick={memorySubtract}>M−</Button>
                <Button size="sm" variant="outline" onClick={memoryRecall}>MR</Button>
                <Button size="sm" variant="outline" onClick={memoryClear}>MC</Button>
              </div>
            </Card>

            <Card className="p-4 dark:bg-gray-800">
              <h3 className="font-bold mb-3 dark:text-white">History</h3>
              <div className="space-y-1 max-h-64 overflow-y-auto">
                {history.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400">No history</p>
                ) : (
                  history.map((entry, i) => (
                    <div
                      key={i}
                      className="text-xs p-2 bg-gray-100 dark:bg-gray-700 rounded cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600"
                      onClick={() => {
                        const result = entry.split('=')[1]?.trim();
                        if (result) setDisplay(result);
                      }}
                    >
                      {entry}
                    </div>
                  ))
                )}
              </div>
            </Card>

            <Card className="p-4 dark:bg-gray-800">
              <h3 className="font-bold mb-2 dark:text-white text-sm">Features</h3>
              <ul className="text-xs space-y-1 dark:text-gray-300">
                <li>✓ Basic arithmetic</li>
                <li>✓ Scientific functions</li>
                <li>✓ Trig (sin, cos, tan, etc.)</li>
                <li>✓ Hyperbolic functions</li>
                <li>✓ Binary/Hex/Oct converter</li>
                <li>✓ Bitwise operations</li>
                <li>✓ Physics constants</li>
                <li>✓ Memory functions</li>
                <li>✓ Calculation history</li>
              </ul>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};
