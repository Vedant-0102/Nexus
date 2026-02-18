import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { create, all, MathNode, OperatorNode, FunctionNode, ConstantNode, SymbolNode } from 'mathjs';
import katex from 'katex';
import 'katex/dist/katex.min.css';

const math = create(all);

interface IntegralResult {
  result: string;
  latex: string;
  steps: Array<{ description: string; latex: string }>;
  variable: string;
  note?: string;
}

export const IntegralCalculator = () => {
  const [expression, setExpression] = useState('x^2');
  const [variable, setVariable] = useState('x');
  const [result, setResult] = useState<IntegralResult | null>(null);
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

  const calculateIntegral = () => {
    try {
      setError('');
      
      // Add implicit multiplication
      let parsedExpr = addImplicitMultiplication(expression)
        .replace(/ln/gi, 'log')
        .replace(/sqrt/gi, 'sqrt')
        .replace(/exp/gi, 'exp');

      const steps: Array<{ description: string; latex: string }> = [];

      // For common integrals, we'll compute them manually since math.js doesn't have built-in integration
      const integralResult = computeIntegral(parsedExpr, variable, steps);
      
      if (!integralResult) {
        throw new Error('Unable to compute integral. Try simpler expressions or use integration techniques manually.');
      }

      // Simplify the result
      const simplified = math.simplify(integralResult);
      const simplifiedStr = simplified.toString();
      
      // Convert to LaTeX
      const resultLatex = simplified.toTex().replace(/\\log/g, '\\ln');

      setResult({
        result: simplifiedStr.replace(/log/g, 'ln') + ' + C',
        latex: resultLatex + ' + C',
        steps,
        variable,
        note: 'C is the constant of integration'
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

  const computeIntegral = (expr: string, varName: string, steps: Array<{ description: string; latex: string }>): string | null => {
    try {
      const node = math.parse(expr) as MathNode;
      
      // Handle sums and differences
      if (node.type === 'OperatorNode') {
        const opNode = node as OperatorNode;
        if (opNode.op === '+' || opNode.op === '-') {
          const left = computeIntegral(opNode.args[0].toString(), varName, steps);
          const right = computeIntegral(opNode.args[1].toString(), varName, steps);
          if (left && right) {
            steps.push({
              description: 'Sum/Difference Rule',
              latex: `\\int (f \\pm g) \\, d${varName} = \\int f \\, d${varName} \\pm \\int g \\, d${varName}`
            });
            return opNode.op === '+' ? `${left} + ${right}` : `${left} - (${right})`;
          }
        }

        // Power rule: x^n -> x^(n+1)/(n+1)
        if (opNode.op === '^') {
          const base = opNode.args[0];
          const exponent = opNode.args[1];
          
          if (base.type === 'SymbolNode' && (base as SymbolNode).name === varName && exponent.type === 'ConstantNode') {
            const n = (exponent as ConstantNode).value as number;
            if (n === -1) {
              steps.push({
                description: 'Special Case: x⁻¹',
                latex: `\\int ${varName}^{-1} \\, d${varName} = \\ln|${varName}|`
              });
              return `log(abs(${varName}))`;
            }
            steps.push({
              description: 'Power Rule',
              latex: `\\int ${varName}^{${n}} \\, d${varName} = \\frac{${varName}^{${n + 1}}}{${n + 1}}`
            });
            return `(${varName}^${n + 1})/${n + 1}`;
          }
        }

        // Constant multiple: c*f(x)
        if (opNode.op === '*') {
          const left = opNode.args[0];
          const right = opNode.args[1];
          
          if (left.type === 'ConstantNode') {
            const c = (left as ConstantNode).value;
            const integral = computeIntegral(right.toString(), varName, steps);
            if (integral) {
              return `${c}*(${integral})`;
            }
          }
          
          if (right.type === 'ConstantNode') {
            const c = (right as ConstantNode).value;
            const integral = computeIntegral(left.toString(), varName, steps);
            if (integral) {
              return `${c}*(${integral})`;
            }
          }
        }

        // Division: 1/x
        if (opNode.op === '/') {
          const numerator = opNode.args[0];
          const denominator = opNode.args[1];
          
          if (numerator.type === 'ConstantNode' && (numerator as ConstantNode).value === 1 &&
              denominator.type === 'SymbolNode' && (denominator as SymbolNode).name === varName) {
            steps.push({
              description: 'Logarithm Rule',
              latex: `\\int \\frac{1}{${varName}} \\, d${varName} = \\ln|${varName}|`
            });
            return `log(abs(${varName}))`;
          }
        }
      }

      // Linear term: x
      if (node.type === 'SymbolNode' && (node as SymbolNode).name === varName) {
        steps.push({
          description: 'Power Rule',
          latex: `\\int ${varName} \\, d${varName} = \\frac{${varName}^2}{2}`
        });
        return `(${varName}^2)/2`;
      }

      // Constant
      if (node.type === 'ConstantNode') {
        const c = (node as ConstantNode).value;
        steps.push({
          description: 'Constant Rule',
          latex: `\\int ${c} \\, d${varName} = ${c}${varName}`
        });
        return `${c}*${varName}`;
      }

      // Function nodes (trig, exp, log, sqrt)
      if (node.type === 'FunctionNode') {
        const funcNode = node as FunctionNode;
        const funcName = funcNode.fn?.name || '';
        const arg = funcNode.args[0];

        // sin(x) or sin(k*x)
        if (funcName === 'sin') {
          if (arg.type === 'SymbolNode' && (arg as SymbolNode).name === varName) {
            steps.push({
              description: 'Trigonometric Integral',
              latex: `\\int \\sin(${varName}) \\, d${varName} = -\\cos(${varName})`
            });
            return `-cos(${varName})`;
          }
          // Handle sin(k*x)
          if (arg.type === 'OperatorNode') {
            const argOp = arg as OperatorNode;
            if (argOp.op === '*') {
              const left = argOp.args[0];
              const right = argOp.args[1];
              let k: number | null = null;
              
              if (left.type === 'ConstantNode' && right.type === 'SymbolNode' && (right as SymbolNode).name === varName) {
                k = (left as ConstantNode).value as number;
              } else if (right.type === 'ConstantNode' && left.type === 'SymbolNode' && (left as SymbolNode).name === varName) {
                k = (right as ConstantNode).value as number;
              }
              
              if (k !== null) {
                steps.push({
                  description: 'Trig with u-substitution',
                  latex: `\\int \\sin(${k}${varName}) \\, d${varName} = -\\frac{\\cos(${k}${varName})}{${k}}`
                });
                return `(-cos(${k}*${varName}))/${k}`;
              }
            }
          }
        }

        // cos(x) or cos(k*x)
        if (funcName === 'cos') {
          if (arg.type === 'SymbolNode' && (arg as SymbolNode).name === varName) {
            steps.push({
              description: 'Trigonometric Integral',
              latex: `\\int \\cos(${varName}) \\, d${varName} = \\sin(${varName})`
            });
            return `sin(${varName})`;
          }
          // Handle cos(k*x)
          if (arg.type === 'OperatorNode') {
            const argOp = arg as OperatorNode;
            if (argOp.op === '*') {
              const left = argOp.args[0];
              const right = argOp.args[1];
              let k: number | null = null;
              
              if (left.type === 'ConstantNode' && right.type === 'SymbolNode' && (right as SymbolNode).name === varName) {
                k = (left as ConstantNode).value as number;
              } else if (right.type === 'ConstantNode' && left.type === 'SymbolNode' && (left as SymbolNode).name === varName) {
                k = (right as ConstantNode).value as number;
              }
              
              if (k !== null) {
                steps.push({
                  description: 'Trig with u-substitution',
                  latex: `\\int \\cos(${k}${varName}) \\, d${varName} = \\frac{\\sin(${k}${varName})}{${k}}`
                });
                return `(sin(${k}*${varName}))/${k}`;
              }
            }
          }
        }

        // tan(x)
        if (funcName === 'tan' && arg.type === 'SymbolNode' && (arg as SymbolNode).name === varName) {
          steps.push({
            description: 'Trigonometric Integral',
            latex: `\\int \\tan(${varName}) \\, d${varName} = -\\ln|\\cos(${varName})|`
          });
          return `-log(abs(cos(${varName})))`;
        }

        // exp(x) or exp(k*x)
        if (funcName === 'exp') {
          if (arg.type === 'SymbolNode' && (arg as SymbolNode).name === varName) {
            steps.push({
              description: 'Exponential Rule',
              latex: `\\int e^{${varName}} \\, d${varName} = e^{${varName}}`
            });
            return `exp(${varName})`;
          }
          // Handle exp(k*x)
          if (arg.type === 'OperatorNode') {
            const argOp = arg as OperatorNode;
            if (argOp.op === '*') {
              const left = argOp.args[0];
              const right = argOp.args[1];
              let k: number | null = null;
              
              if (left.type === 'ConstantNode' && right.type === 'SymbolNode' && (right as SymbolNode).name === varName) {
                k = (left as ConstantNode).value as number;
              } else if (right.type === 'ConstantNode' && left.type === 'SymbolNode' && (left as SymbolNode).name === varName) {
                k = (right as ConstantNode).value as number;
              }
              
              if (k !== null) {
                steps.push({
                  description: 'Exponential with u-substitution',
                  latex: `\\int e^{${k}${varName}} \\, d${varName} = \\frac{e^{${k}${varName}}}{${k}}`
                });
                return `(exp(${k}*${varName}))/${k}`;
              }
            }
          }
        }

        // log(x) - integration by parts
        if (funcName === 'log' && arg.type === 'SymbolNode' && (arg as SymbolNode).name === varName) {
          steps.push({
            description: 'Integration by Parts',
            latex: `\\int \\ln(${varName}) \\, d${varName} = ${varName}\\ln(${varName}) - ${varName}`
          });
          return `${varName}*log(${varName}) - ${varName}`;
        }

        // sqrt(x) = x^(1/2)
        if (funcName === 'sqrt' && arg.type === 'SymbolNode' && (arg as SymbolNode).name === varName) {
          steps.push({
            description: 'Power Rule',
            latex: `\\int \\sqrt{${varName}} \\, d${varName} = \\frac{2}{3}${varName}^{3/2}`
          });
          return `(2/3)*(${varName}^(3/2))`;
        }
      }

      return null;
    } catch {
      return null;
    }
  };

  const examples = [
    { expr: 'x^2', desc: 'Power rule' },
    { expr: '3x^4 + 2x - 5', desc: 'Polynomial' },
    { expr: 'sin(x)', desc: 'Basic trig' },
    { expr: 'cos(3x)', desc: 'Trig with substitution' },
    { expr: 'exp(x)', desc: 'Exponential' },
    { expr: '1/x', desc: 'Natural log' },
    { expr: 'ln(x)', desc: 'Integration by parts' },
    { expr: 'sqrt(x)', desc: 'Square root' },
    { expr: 'x^3 + sin(x) - cos(2x)', desc: 'Mixed functions' },
    { expr: 'tan(x)', desc: 'Tangent' },
    { expr: 'x^(-1)', desc: 'Negative power' },
  ];

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-900 dark:to-gray-800 p-6 overflow-auto">
      <h1 className="text-2xl font-bold dark:text-white mb-6">Advanced Integral Calculator</h1>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="p-6 dark:bg-gray-800">
          <h3 className="text-xl font-bold mb-4 dark:text-white">Input Function</h3>
          
          <div className="space-y-4">
            <div>
              <Label>Expression f({variable})</Label>
              <Input
                value={expression}
                onChange={(e) => setExpression(e.target.value)}
                placeholder="e.g., x^2, sin(2x), 3x^4 + cos(x)"
                className="font-mono"
                onKeyDown={(e) => e.key === 'Enter' && calculateIntegral()}
              />
              <p className="text-xs text-gray-500 mt-1">
                💡 Implicit multiplication supported: 2x, 3sin(x)
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
            
            <Button onClick={calculateIntegral} className="w-full">
              Calculate ∫f({variable})d{variable}
            </Button>

            <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded text-xs dark:text-gray-300">
              <p className="font-semibold mb-2">✨ Powered by math.js + KaTeX</p>
              <p className="font-semibold mb-1">Supported:</p>
              <ul className="space-y-0.5 ml-4 list-disc">
                <li>Polynomials with power rule</li>
                <li>Trig functions: sin, cos, tan</li>
                <li>Trig with u-substitution: sin(kx), cos(kx)</li>
                <li>Exponential: e^x, exp(kx)</li>
                <li>Logarithm: ln(x), 1/x</li>
                <li>Roots and nested functions</li>
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
              
              <div className="p-4 bg-purple-50 dark:bg-purple-900/30 rounded">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Indefinite Integral:</p>
                <div 
                  className="text-center my-2"
                  dangerouslySetInnerHTML={{ __html: renderLatex(`\\int f(${result.variable}) \\, d${result.variable} = ${result.latex}`) }}
                />
              </div>

              {result.steps.length > 0 && (
                <div className="p-4 bg-blue-50 dark:bg-blue-900/30 rounded">
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Rules Applied:</p>
                  <div className="space-y-3">
                    {result.steps.map((step, i) => (
                      <div key={i} className="border-l-2 border-blue-400 pl-3">
                        <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 mb-1">
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
                <p><strong>Note:</strong> {result.note || 'C represents the constant of integration.'}</p>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400 mb-2">Enter an expression and click calculate</p>
              <p className="text-xs text-gray-400 dark:text-gray-500">Try: x^2, sin(2x), or 3x^3 + cos(x)</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
