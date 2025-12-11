import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { create, all, MathNode, OperatorNode, FunctionNode } from 'mathjs';
import katex from 'katex';
import 'katex/dist/katex.min.css';

const math = create(all);

interface DerivativeResult {
  result: string;
  latex: string;
  steps: Array<{ description: string; latex: string }>;
  variable: string;
}

export const DerivativeCalculator = () => {
  const [expression, setExpression] = useState('x^2');
  const [variable, setVariable] = useState('x');
  const [result, setResult] = useState<DerivativeResult | null>(null);
  const [error, setError] = useState<string>('');

  const addImplicitMultiplication = (expr: string): string => {
    return expr
      .replace(/(\d)([a-zA-Z])/g, '$1*$2')           // 3x -> 3*x
      .replace(/([a-zA-Z])(\d)/g, '$1*$2')           // x2 -> x*2
      .replace(/\)(\d)/g, ')*$1')                     // )2 -> )*2
      .replace(/\)([a-zA-Z])/g, ')*$1')              // )x -> )*x
      .replace(/(\d)\(/g, '$1*(')                     // 2( -> 2*(
      .replace(/([a-zA-Z])\(/g, '$1*(')              // x( -> x*(
      .replace(/\)\(/g, ')*(');                       // )( -> )*(
  };

  const toLatex = (expr: string): string => {
    try {
      const node = math.parse(expr);
      return node.toTex();
    } catch {
      return expr;
    }
  };

  const getDerivativeSteps = (originalExpr: string, derivativeExpr: string, varName: string): Array<{ description: string; latex: string }> => {
    const steps: Array<{ description: string; latex: string }> = [];
    
    try {
      const original = math.parse(originalExpr);
      const derivative = math.parse(derivativeExpr);
      
      // Identify the rule used with proper type guards
      if (original.type === 'OperatorNode') {
        const opNode = original as OperatorNode;
        if (opNode.op === '+' || opNode.op === '-') {
          steps.push({
            description: 'Sum/Difference Rule',
            latex: `\\frac{d}{d${varName}}[f \\pm g] = \\frac{df}{d${varName}} \\pm \\frac{dg}{d${varName}}`
          });
        } else if (opNode.op === '*') {
          steps.push({
            description: 'Product Rule',
            latex: `\\frac{d}{d${varName}}[f \\cdot g] = f' \\cdot g + f \\cdot g'`
          });
        } else if (opNode.op === '/') {
          steps.push({
            description: 'Quotient Rule',
            latex: `\\frac{d}{d${varName}}\\left[\\frac{f}{g}\\right] = \\frac{f' \\cdot g - f \\cdot g'}{g^2}`
          });
        } else if (opNode.op === '^') {
          steps.push({
            description: 'Power Rule',
            latex: `\\frac{d}{d${varName}}[${varName}^n] = n \\cdot ${varName}^{n-1}`
          });
        }
      } else if (original.type === 'FunctionNode') {
        const funcNode = original as FunctionNode;
        const funcName = funcNode.fn?.name || '';
        if (['sin', 'cos', 'tan'].includes(funcName)) {
          steps.push({
            description: 'Trigonometric Derivative',
            latex: `\\frac{d}{d${varName}}[\\${funcName}(u)] = \\${funcName}'(u) \\cdot \\frac{du}{d${varName}}`
          });
        } else if (funcName === 'log') {
          steps.push({
            description: 'Logarithmic Derivative',
            latex: `\\frac{d}{d${varName}}[\\ln(u)] = \\frac{1}{u} \\cdot \\frac{du}{d${varName}}`
          });
        } else if (funcName === 'exp') {
          steps.push({
            description: 'Exponential Derivative',
            latex: `\\frac{d}{d${varName}}[e^u] = e^u \\cdot \\frac{du}{d${varName}}`
          });
        }
        
        // Check for chain rule
        const arg = funcNode.args?.[0];
        if (arg && arg.type !== 'SymbolNode') {
          steps.push({
            description: 'Chain Rule Applied',
            latex: `\\frac{d}{d${varName}}[f(g(${varName}))] = f'(g(${varName})) \\cdot g'(${varName})`
          });
        }
      }
      
      // Add simplification step if needed
      const simplified = math.simplify(derivative);
      if (simplified.toString() !== derivative.toString()) {
        steps.push({
          description: 'Simplified',
          latex: simplified.toTex()
        });
      }
    } catch (e) {
      // Fallback to basic step
      steps.push({
        description: 'Applied differentiation rules',
        latex: toLatex(derivativeExpr)
      });
    }
    
    return steps;
  };

  const calculateDerivative = () => {
    try {
      setError('');
      
      // Add implicit multiplication
      let parsedExpr = addImplicitMultiplication(expression)
        .replace(/ln/gi, 'log')
        .replace(/sqrt/gi, 'sqrt')
        .replace(/exp/gi, 'exp');

      // Compute derivative using math.js
      const derivative = math.derivative(parsedExpr, variable);
      
      // Simplify the result
      const simplified = math.simplify(derivative);
      const simplifiedStr = simplified.toString();
      
      // Get step-by-step explanation
      const steps = getDerivativeSteps(parsedExpr, simplifiedStr, variable);
      
      // Convert to LaTeX
      const resultLatex = simplified.toTex().replace(/\\log/g, '\\ln');

      setResult({
        result: simplifiedStr.replace(/log/g, 'ln'),
        latex: resultLatex,
        steps,
        variable
      });
    } catch (err: any) {
      const errorMsg = err.message || 'Invalid expression';
      if (errorMsg.includes('Undefined symbol')) {
        setError(`Invalid expression. Make sure to use "${variable}" as your variable.`);
      } else if (errorMsg.includes('Unexpected')) {
        setError('Syntax error. Check your expression format.');
      } else {
        setError(`Error: ${errorMsg}`);
      }
      setResult(null);
    }
  };

  const renderLatex = (latex: string): string => {
    try {
      return katex.renderToString(latex, {
        throwOnError: false,
        displayMode: true
      });
    } catch {
      return latex;
    }
  };

  const examples = [
    { expr: 'x^2', desc: 'Power rule' },
    { expr: '3x^4 + 2x^2 - 5', desc: 'Polynomial' },
    { expr: 'sin(x)', desc: 'Basic trig' },
    { expr: 'cos(2x)', desc: 'Chain rule' },
    { expr: 'x*sin(x)', desc: 'Product rule' },
    { expr: 'sin(x)/x', desc: 'Quotient rule' },
    { expr: 'e^x', desc: 'Exponential' },
    { expr: 'ln(x)', desc: 'Natural log' },
    { expr: 'sin(x^2)', desc: 'Composite' },
    { expr: 'x^3 + sin(x) - 3cos(2x)', desc: 'Mixed' },
    { expr: 'sqrt(x)', desc: 'Square root' },
    { expr: 'tan(x)', desc: 'Tangent' },
  ];

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 p-6 overflow-auto">
      <h1 className="text-2xl font-bold dark:text-white mb-6">Advanced Derivative Calculator</h1>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="p-6 dark:bg-gray-800">
          <h3 className="text-xl font-bold mb-4 dark:text-white">Input Function</h3>
          
          <div className="space-y-4">
            <div>
              <Label>Expression f({variable})</Label>
              <Input
                value={expression}
                onChange={(e) => setExpression(e.target.value)}
                placeholder="e.g., x^2, sin(2x), x*sin(x)"
                className="font-mono"
                onKeyDown={(e) => e.key === 'Enter' && calculateDerivative()}
              />
              <p className="text-xs text-gray-500 mt-1">
                💡 Implicit multiplication supported: 2x, xsin(x)
              </p>
            </div>

            <div>
              <Label>Variable</Label>
              <Input
                value={variable}
                onChange={(e) => setVariable(e.target.value)}
                placeholder="x, y, t, etc."
                maxLength={1}
                className="w-20"
              />
            </div>
            
            <Button onClick={calculateDerivative} className="w-full">
              Calculate d/d{variable}
            </Button>

            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded text-xs dark:text-gray-300">
              <p className="font-semibold mb-2">✨ Powered by math.js + KaTeX</p>
              <p className="font-semibold mb-1">Supported:</p>
              <ul className="space-y-0.5 ml-4 list-disc">
                <li>All basic operations and functions</li>
                <li>Product, Quotient, Chain rules</li>
                <li>Trig, exponential, logarithmic</li>
                <li>Nested and composite functions</li>
              </ul>
            </div>
          </div>

          <div className="mt-4">
            <h4 className="font-semibold mb-2 dark:text-white text-sm">Quick Examples:</h4>
            <div className="space-y-1 max-h-64 overflow-y-auto">
              {examples.map((ex, i) => (
                <button
                  key={i}
                  onClick={() => setExpression(ex.expr)}
                  className="block w-full text-left text-xs p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded dark:text-gray-300"
                >
                  <span className="font-mono">{ex.expr}</span>
                  <span className="text-gray-500 dark:text-gray-400 ml-2">({ex.desc})</span>
                </button>
              ))}
            </div>
          </div>
        </Card>

        <Card className="p-6 dark:bg-gray-800">
          <h3 className="text-xl font-bold mb-4 dark:text-white">Result</h3>
          {error ? (
            <div className="p-4 bg-red-50 dark:bg-red-900/30 rounded">
              <p className="text-red-900 dark:text-red-300 font-semibold">Error</p>
              <p className="text-sm text-red-800 dark:text-red-400 mt-1">{error}</p>
            </div>
          ) : result ? (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 dark:bg-green-900/30 rounded">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Original Function:</p>
                <div 
                  className="text-center my-2"
                  dangerouslySetInnerHTML={{ __html: renderLatex(`f(${result.variable}) = ${toLatex(expression)}`) }}
                />
              </div>
              
              <div className="p-4 bg-blue-50 dark:bg-blue-900/30 rounded">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Derivative:</p>
                <div 
                  className="text-center my-2"
                  dangerouslySetInnerHTML={{ __html: renderLatex(`f'(${result.variable}) = ${result.latex}`) }}
                />
              </div>

              {result.steps.length > 0 && (
                <div className="p-4 bg-purple-50 dark:bg-purple-900/30 rounded">
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Rules Applied:</p>
                  <div className="space-y-3">
                    {result.steps.map((step, i) => (
                      <div key={i} className="border-l-2 border-purple-400 pl-3">
                        <p className="text-xs font-semibold text-purple-700 dark:text-purple-300 mb-1">
                          {step.description}
                        </p>
                        <div 
                          className="text-sm"
                          dangerouslySetInnerHTML={{ __html: renderLatex(step.latex) }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="p-3 bg-yellow-50 dark:bg-yellow-900/30 rounded text-xs dark:text-gray-300">
                <p><strong>Note:</strong> This calculator uses symbolic differentiation with automatic rule detection.</p>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400 mb-2">Enter an expression and click calculate</p>
              <p className="text-xs text-gray-400 dark:text-gray-500">Try: x^2, sin(2x), or x*sin(x)</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
