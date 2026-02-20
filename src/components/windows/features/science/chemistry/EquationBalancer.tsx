import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { AlertCircle, CheckCircle2, ArrowRight, RefreshCw, Lightbulb } from 'lucide-react';

interface Molecule {
  formula: string;
  coefficient: number;
}

interface BalanceResult {
  balanced: boolean;
  reactants: Molecule[];
  products: Molecule[];
  equation: string;
  steps?: string[];
  error?: string;
}

export const EquationBalancer: React.FC = () => {
  const [reactantsInput, setReactantsInput] = useState('H2 + O2');
  const [productsInput, setProductsInput] = useState('H2O');
  const [result, setResult] = useState<BalanceResult | null>(null);
  const [loading, setLoading] = useState(false);

  // Parse chemical formula to get element counts
  const parseFormula = (formula: string): Record<string, number> => {
    const elements: Record<string, number> = {};
    
    const parseSegment = (segment: string, multiplier: number) => {
      const groupRegex = /\(([^()]+)\)(\d*)/g;
      let processed = segment;
      let groupMatch;
      
      while ((groupMatch = groupRegex.exec(segment)) !== null) {
        const groupContent = groupMatch[1];
        const groupCount = groupMatch[2] ? parseInt(groupMatch[2]) : 1;
        parseSegment(groupContent, multiplier * groupCount);
        processed = processed.replace(groupMatch[0], '');
      }
      
      const regex = /([A-Z][a-z]?)(\d*)/g;
      let match;
      while ((match = regex.exec(processed)) !== null) {
        const element = match[1];
        const count = match[2] ? parseInt(match[2]) : 1;
        elements[element] = (elements[element] || 0) + count * multiplier;
      }
    };
    
    parseSegment(formula, 1);
    return elements;
  };

  // Get all unique elements from both sides
  const getAllElements = (reactants: string[], products: string[]): string[] => {
    const elements = new Set<string>();
    
    [...reactants, ...products].forEach(formula => {
      const parsed = parseFormula(formula);
      Object.keys(parsed).forEach(el => elements.add(el));
    });

    return Array.from(elements).sort();
  };

  // Balance equation using algebraic method
  const balanceEquation = () => {
    setLoading(true);
    
    try {
      const reactants = reactantsInput.split('+').map(s => s.trim()).filter(s => s);
      const products = productsInput.split('+').map(s => s.trim()).filter(s => s);

      if (reactants.length === 0 || products.length === 0) {
        setResult({
          balanced: false,
          reactants: [],
          products: [],
          equation: '',
          error: 'Please enter both reactants and products'
        });
        setLoading(false);
        return;
      }

      // Get all unique elements
      const elements = getAllElements(reactants, products);
      
      // Try to balance with coefficients from 1 to 10
      const maxCoeff = 10;
      let found = false;
      let bestCoeffs: number[] = [];

      // Generate all possible coefficient combinations
      const tryBalance = (coeffs: number[]): boolean => {
        // Check if this combination balances the equation
        const elementCounts: Record<string, { left: number; right: number }> = {};
        
        elements.forEach(el => {
          elementCounts[el] = { left: 0, right: 0 };
        });

        // Count elements on left side (reactants)
        reactants.forEach((formula, i) => {
          const parsed = parseFormula(formula);
          Object.entries(parsed).forEach(([el, count]) => {
            elementCounts[el].left += count * coeffs[i];
          });
        });

        // Count elements on right side (products)
        products.forEach((formula, i) => {
          const parsed = parseFormula(formula);
          Object.entries(parsed).forEach(([el, count]) => {
            elementCounts[el].right += count * coeffs[reactants.length + i];
          });
        });

        // Check if balanced
        return elements.every(el => 
          elementCounts[el].left === elementCounts[el].right
        );
      };

      // Recursive function to try all combinations
      const findCoefficients = (index: number, current: number[]): boolean => {
        if (index === reactants.length + products.length) {
          if (tryBalance(current)) {
            bestCoeffs = [...current];
            return true;
          }
          return false;
        }

        for (let coeff = 1; coeff <= maxCoeff; coeff++) {
          current[index] = coeff;
          if (findCoefficients(index + 1, current)) {
            return true;
          }
        }
        return false;
      };

      // Start search
      found = findCoefficients(0, new Array(reactants.length + products.length).fill(1));

      if (found) {
        // Simplify coefficients by finding GCD
        const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b);
        const findGCD = (arr: number[]): number => arr.reduce((a, b) => gcd(a, b));
        const divisor = findGCD(bestCoeffs);
        const simplifiedCoeffs = bestCoeffs.map(c => c / divisor);

        const balancedReactants: Molecule[] = reactants.map((formula, i) => ({
          formula,
          coefficient: simplifiedCoeffs[i]
        }));

        const balancedProducts: Molecule[] = products.map((formula, i) => ({
          formula,
          coefficient: simplifiedCoeffs[reactants.length + i]
        }));

        const equationStr = 
          balancedReactants.map(m => `${m.coefficient > 1 ? m.coefficient : ''}${m.formula}`).join(' + ') +
          ' → ' +
          balancedProducts.map(m => `${m.coefficient > 1 ? m.coefficient : ''}${m.formula}`).join(' + ');

        setResult({
          balanced: true,
          reactants: balancedReactants,
          products: balancedProducts,
          equation: equationStr,
          steps: generateSteps(balancedReactants, balancedProducts, elements)
        });
      } else {
        setResult({
          balanced: false,
          reactants: [],
          products: [],
          equation: '',
          error: 'Could not balance equation. Please check your input.'
        });
      }
    } catch (error) {
      setResult({
        balanced: false,
        reactants: [],
        products: [],
        equation: '',
        error: 'Error parsing equation. Please check your formula syntax.'
      });
    }

    setLoading(false);
  };

  const generateSteps = (reactants: Molecule[], products: Molecule[], elements: string[]): string[] => {
    const steps: string[] = [];
    
    steps.push('1. Identify all elements in the equation');
    steps.push(`   Elements: ${elements.join(', ')}`);
    
    steps.push('2. Count atoms on each side');
    elements.forEach(el => {
      let leftCount = 0;
      let rightCount = 0;
      
      reactants.forEach(m => {
        const parsed = parseFormula(m.formula);
        leftCount += (parsed[el] || 0) * m.coefficient;
      });
      
      products.forEach(m => {
        const parsed = parseFormula(m.formula);
        rightCount += (parsed[el] || 0) * m.coefficient;
      });
      
      steps.push(`   ${el}: ${leftCount} (left) = ${rightCount} (right) ✓`);
    });
    
    steps.push('3. Equation is balanced!');
    
    return steps;
  };

  const examples = [
    { reactants: 'H2 + O2', products: 'H2O', name: 'Water Formation' },
    { reactants: 'CH4 + O2', products: 'CO2 + H2O', name: 'Methane Combustion' },
    { reactants: 'Fe + O2', products: 'Fe2O3', name: 'Iron Rusting' },
    { reactants: 'N2 + H2', products: 'NH3', name: 'Ammonia Synthesis' },
    { reactants: 'C3H8 + O2', products: 'CO2 + H2O', name: 'Propane Combustion' },
    { reactants: 'Al + O2', products: 'Al2O3', name: 'Aluminum Oxidation' },
    { reactants: 'Ca + H2O', products: 'Ca(OH)2 + H2', name: 'Calcium + Water' },
    { reactants: 'C6H12O6 + O2', products: 'CO2 + H2O', name: 'Glucose Combustion' },
  ];

  const loadExample = (example: typeof examples[0]) => {
    setReactantsInput(example.reactants);
    setProductsInput(example.products);
    setResult(null);
  };

  const reset = () => {
    setReactantsInput('');
    setProductsInput('');
    setResult(null);
  };

  return (
    <div className="h-full w-full bg-gradient-to-br from-blue-50 to-green-50 dark:from-gray-900 dark:to-gray-800 p-6 overflow-auto">
      <div className="max-w-5xl mx-auto space-y-6">
        <Card className="p-6 dark:bg-gray-800">
        <h3 className="text-xl font-bold mb-4 dark:text-white flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-yellow-500" />
          Chemical Equation Balancer
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          Enter chemical formulas separated by + signs. Use proper capitalization (e.g., H2O, CO2, Fe2O3).
        </p>

        <div className="space-y-4">
          {/* Input Section */}
          <div className="grid md:grid-cols-[1fr,auto,1fr] gap-4 items-center">
            <div>
              <label className="block text-sm font-medium mb-2 dark:text-white">
                Reactants (Left Side)
              </label>
              <Input
                value={reactantsInput}
                onChange={(e) => setReactantsInput(e.target.value)}
                placeholder="e.g., H2 + O2"
                className="font-mono"
              />
            </div>

            <div className="flex justify-center pt-6">
              <ArrowRight className="h-6 w-6 text-gray-400" />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 dark:text-white">
                Products (Right Side)
              </label>
              <Input
                value={productsInput}
                onChange={(e) => setProductsInput(e.target.value)}
                placeholder="e.g., H2O"
                className="font-mono"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button 
              onClick={balanceEquation} 
              disabled={loading}
              className="flex-1"
            >
              {loading ? 'Balancing...' : 'Balance Equation'}
            </Button>
            <Button 
              onClick={reset} 
              variant="outline"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Result Section */}
      {result && (
        <Card className={`p-6 ${result.balanced ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'}`}>
          <div className="flex items-start gap-3">
            {result.balanced ? (
              <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0 mt-1" />
            ) : (
              <AlertCircle className="h-6 w-6 text-red-600 flex-shrink-0 mt-1" />
            )}
            
            <div className="flex-1">
              {result.balanced ? (
                <>
                  <h4 className="font-bold text-lg text-green-800 dark:text-green-200 mb-3">
                    Equation Balanced Successfully!
                  </h4>
                  
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-4">
                    <p className="text-2xl font-mono font-bold text-center text-gray-800 dark:text-white">
                      {result.equation}
                    </p>
                  </div>

                  {/* Element Count Verification */}
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-4">
                    <h5 className="font-semibold mb-2 dark:text-white">Verification:</h5>
                    <div className="space-y-1 text-sm">
                      {result.steps?.map((step, i) => (
                        <p key={i} className="text-gray-700 dark:text-gray-300">{step}</p>
                      ))}
                    </div>
                  </div>

                  {/* Coefficients */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                      <h5 className="font-semibold mb-2 text-blue-700 dark:text-blue-300">Reactants:</h5>
                      <ul className="space-y-1">
                        {result.reactants.map((m, i) => (
                          <li key={i} className="text-sm dark:text-gray-300">
                            <span className="font-bold text-blue-600">{m.coefficient > 1 ? m.coefficient : ''}</span>
                            <span className="font-mono ml-1">{m.formula}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                      <h5 className="font-semibold mb-2 text-purple-700 dark:text-purple-300">Products:</h5>
                      <ul className="space-y-1">
                        {result.products.map((m, i) => (
                          <li key={i} className="text-sm dark:text-gray-300">
                            <span className="font-bold text-purple-600">{m.coefficient > 1 ? m.coefficient : ''}</span>
                            <span className="font-mono ml-1">{m.formula}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <h4 className="font-bold text-lg text-red-800 dark:text-red-200 mb-2">
                    Unable to Balance Equation
                  </h4>
                  <p className="text-red-700 dark:text-red-300">
                    {result.error}
                  </p>
                </>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Examples Section */}
      <Card className="p-6 dark:bg-gray-800">
        <h4 className="font-semibold mb-4 dark:text-white">Try These Examples:</h4>
        <div className="grid md:grid-cols-2 gap-3">
          {examples.map((example, i) => (
            <Button
              key={i}
              variant="outline"
              onClick={() => loadExample(example)}
              className="h-auto py-3 flex flex-col items-start text-left"
            >
              <span className="font-semibold text-sm">{example.name}</span>
              <span className="text-xs text-gray-600 dark:text-gray-400 font-mono mt-1">
                {example.reactants} → {example.products}
              </span>
            </Button>
          ))}
        </div>
      </Card>

      {/* Tips Section */}
      <Card className="p-6 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <h4 className="font-semibold mb-3 text-blue-900 dark:text-blue-200">Tips for Using the Balancer:</h4>
        <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-300">
          <li>• Use proper element symbols with correct capitalization (H, O, C, not h, o, c)</li>
          <li>• Separate multiple compounds with + signs</li>
          <li>• Use numbers after elements for subscripts (H2O, not H₂O)</li>
          <li>• For polyatomic ions in parentheses, use format like Ca(OH)2</li>
          <li>• The balancer works best with simple to moderately complex equations</li>
        </ul>
      </Card>
      </div>
    </div>
  );
};
