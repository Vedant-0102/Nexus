import React, { useState } from 'react';
import { Calculator, Beaker, FlaskConical, Droplet } from 'lucide-react';

type CalculatorMode = 'molar-mass' | 'moles-mass' | 'concentration' | 'limiting-reactant';

// Atomic masses for common elements
const atomicMasses: Record<string, number> = {
  H: 1.008, He: 4.003, Li: 6.941, Be: 9.012, B: 10.811, C: 12.011, N: 14.007, O: 15.999,
  F: 18.998, Ne: 20.180, Na: 22.990, Mg: 24.305, Al: 26.982, Si: 28.086, P: 30.974,
  S: 32.065, Cl: 35.453, Ar: 39.948, K: 39.098, Ca: 40.078, Fe: 55.845, Cu: 63.546,
  Zn: 65.380, Br: 79.904, Ag: 107.868, I: 126.904, Au: 196.967, Hg: 200.590, Pb: 207.200
};

export const ChemistryCalculator: React.FC = () => {
  const [mode, setMode] = useState<CalculatorMode>('molar-mass');

  return (
    <div className="h-full flex flex-col p-4 overflow-hidden">
      <h2 className="text-xl font-bold mb-3 dark:text-white">Chemistry Calculator</h2>
      
      <div className="flex gap-2 mb-4 overflow-x-auto">
        <button
          onClick={() => setMode('molar-mass')}
          className={`px-3 py-2 rounded-lg font-medium whitespace-nowrap transition-colors text-sm ${
            mode === 'molar-mass'
              ? 'bg-green-500 text-white'
              : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
        >
          Molar Mass
        </button>
        <button
          onClick={() => setMode('moles-mass')}
          className={`px-3 py-2 rounded-lg font-medium whitespace-nowrap transition-colors text-sm ${
            mode === 'moles-mass'
              ? 'bg-green-500 text-white'
              : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
        >
          Moles/Mass
        </button>
        <button
          onClick={() => setMode('concentration')}
          className={`px-3 py-2 rounded-lg font-medium whitespace-nowrap transition-colors text-sm ${
            mode === 'concentration'
              ? 'bg-green-500 text-white'
              : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
        >
          Concentration
        </button>
        <button
          onClick={() => setMode('limiting-reactant')}
          className={`px-3 py-2 rounded-lg font-medium whitespace-nowrap transition-colors text-sm ${
            mode === 'limiting-reactant'
              ? 'bg-green-500 text-white'
              : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
        >
          Limiting Reactant
        </button>
      </div>

      <div className="flex-1 overflow-auto">
        {mode === 'molar-mass' && <MolarMassCalculator />}
        {mode === 'moles-mass' && <MolesMassCalculator />}
        {mode === 'concentration' && <ConcentrationCalculator />}
        {mode === 'limiting-reactant' && <LimitingReactantCalculator />}
      </div>
    </div>
  );
};

const MolarMassCalculator: React.FC = () => {
  const [formula, setFormula] = useState('');
  const [result, setResult] = useState<{ mass: number; breakdown: string[] } | null>(null);
  const [error, setError] = useState('');

  const parseFormula = (formula: string): Record<string, number> => {
    const elements: Record<string, number> = {};
    const regex = /([A-Z][a-z]?)(\d*)/g;
    let match;

    while ((match = regex.exec(formula)) !== null) {
      const element = match[1];
      const count = match[2] ? parseInt(match[2]) : 1;
      
      if (!atomicMasses[element]) {
        throw new Error(`Unknown element: ${element}`);
      }
      
      elements[element] = (elements[element] || 0) + count;
    }

    return elements;
  };

  const calculate = () => {
    try {
      setError('');
      const elements = parseFormula(formula);
      let totalMass = 0;
      const breakdown: string[] = [];

      for (const [element, count] of Object.entries(elements)) {
        const mass = atomicMasses[element] * count;
        totalMass += mass;
        breakdown.push(`${element}: ${count} × ${atomicMasses[element].toFixed(3)} = ${mass.toFixed(3)} g/mol`);
      }

      setResult({ mass: totalMass, breakdown });
    } catch (err) {
      setError((err as Error).message);
      setResult(null);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
        <div className="flex items-center gap-2 mb-4">
          <Calculator className="h-6 w-6 text-green-500" />
          <h3 className="text-lg font-bold dark:text-white">Molar Mass Calculator</h3>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2 dark:text-gray-300">
              Chemical Formula
            </label>
            <input
              type="text"
              value={formula}
              onChange={(e) => setFormula(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && calculate()}
              className="w-full px-4 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-white"
              placeholder="e.g., H2O, C6H12O6, NaCl"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Examples: H2O, C6H12O6, Ca(OH)2, H2SO4
            </p>
          </div>

          <button
            onClick={calculate}
            className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 rounded-lg transition-colors"
          >
            Calculate Molar Mass
          </button>

          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {result && (
            <div className="space-y-3">
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {result.mass.toFixed(3)} g/mol
                </p>
              </div>

              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <h4 className="font-semibold mb-2 dark:text-white text-sm">Breakdown:</h4>
                <div className="space-y-1 text-sm dark:text-gray-300">
                  {result.breakdown.map((line, i) => (
                    <p key={i}>{line}</p>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const MolesMassCalculator: React.FC = () => {
  const [molarMass, setMolarMass] = useState('');
  const [moles, setMoles] = useState('');
  const [mass, setMass] = useState('');
  const [calculateWhat, setCalculateWhat] = useState<'mass' | 'moles'>('mass');

  const calculate = () => {
    const mm = parseFloat(molarMass);
    
    if (calculateWhat === 'mass') {
      const mol = parseFloat(moles);
      if (!isNaN(mm) && !isNaN(mol)) {
        setMass((mm * mol).toFixed(4));
      }
    } else {
      const m = parseFloat(mass);
      if (!isNaN(mm) && !isNaN(m)) {
        setMoles((m / mm).toFixed(4));
      }
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
        <div className="flex items-center gap-2 mb-4">
          <Beaker className="h-6 w-6 text-blue-500" />
          <h3 className="text-lg font-bold dark:text-white">Moles ⇄ Mass Converter</h3>
        </div>
        
        <div className="space-y-4">
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setCalculateWhat('mass')}
              className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium ${
                calculateWhat === 'mass'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 dark:text-white'
              }`}
            >
              Calculate Mass
            </button>
            <button
              onClick={() => setCalculateWhat('moles')}
              className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium ${
                calculateWhat === 'moles'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 dark:text-white'
              }`}
            >
              Calculate Moles
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 dark:text-gray-300">
              Molar Mass (g/mol)
            </label>
            <input
              type="number"
              value={molarMass}
              onChange={(e) => setMolarMass(e.target.value)}
              className="w-full px-4 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-white"
              placeholder="e.g., 18.015 for H₂O"
            />
          </div>

          {calculateWhat === 'mass' ? (
            <div>
              <label className="block text-sm font-medium mb-2 dark:text-gray-300">
                Number of Moles (mol)
              </label>
              <input
                type="number"
                value={moles}
                onChange={(e) => setMoles(e.target.value)}
                className="w-full px-4 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-white"
                placeholder="e.g., 2"
              />
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium mb-2 dark:text-gray-300">
                Mass (g)
              </label>
              <input
                type="number"
                value={mass}
                onChange={(e) => setMass(e.target.value)}
                className="w-full px-4 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-white"
                placeholder="e.g., 36.03"
              />
            </div>
          )}

          <button
            onClick={calculate}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 rounded-lg transition-colors"
          >
            Calculate
          </button>

          {calculateWhat === 'mass' && mass && (
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <p className="text-lg font-semibold dark:text-white">
                Mass = {mass} grams
              </p>
            </div>
          )}

          {calculateWhat === 'moles' && moles && (
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <p className="text-lg font-semibold dark:text-white">
                Moles = {moles} mol
              </p>
            </div>
          )}

          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <h4 className="font-semibold mb-2 dark:text-white text-sm">Formula:</h4>
            <p className="text-sm dark:text-gray-300">
              n = m / M
            </p>
            <p className="text-xs dark:text-gray-400 mt-1">
              where n = moles, m = mass (g), M = molar mass (g/mol)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const ConcentrationCalculator: React.FC = () => {
  const [moles, setMoles] = useState('');
  const [volume, setVolume] = useState('');
  const [molarity, setMolarity] = useState('');
  const [calculateWhat, setCalculateWhat] = useState<'molarity' | 'moles' | 'volume'>('molarity');

  const calculate = () => {
    if (calculateWhat === 'molarity') {
      const n = parseFloat(moles);
      const v = parseFloat(volume);
      if (!isNaN(n) && !isNaN(v) && v > 0) {
        setMolarity((n / v).toFixed(4));
      }
    } else if (calculateWhat === 'moles') {
      const m = parseFloat(molarity);
      const v = parseFloat(volume);
      if (!isNaN(m) && !isNaN(v)) {
        setMoles((m * v).toFixed(4));
      }
    } else {
      const m = parseFloat(molarity);
      const n = parseFloat(moles);
      if (!isNaN(m) && !isNaN(n) && m > 0) {
        setVolume((n / m).toFixed(4));
      }
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
        <div className="flex items-center gap-2 mb-4">
          <FlaskConical className="h-6 w-6 text-purple-500" />
          <h3 className="text-lg font-bold dark:text-white">Molarity Calculator</h3>
        </div>
        
        <div className="space-y-4">
          <div className="flex gap-2 mb-4 flex-wrap">
            <button
              onClick={() => setCalculateWhat('molarity')}
              className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium ${
                calculateWhat === 'molarity'
                  ? 'bg-purple-500 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 dark:text-white'
              }`}
            >
              Calculate Molarity
            </button>
            <button
              onClick={() => setCalculateWhat('moles')}
              className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium ${
                calculateWhat === 'moles'
                  ? 'bg-purple-500 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 dark:text-white'
              }`}
            >
              Calculate Moles
            </button>
            <button
              onClick={() => setCalculateWhat('volume')}
              className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium ${
                calculateWhat === 'volume'
                  ? 'bg-purple-500 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 dark:text-white'
              }`}
            >
              Calculate Volume
            </button>
          </div>

          {calculateWhat !== 'moles' && (
            <div>
              <label className="block text-sm font-medium mb-2 dark:text-gray-300">
                Moles of Solute (mol)
              </label>
              <input
                type="number"
                value={moles}
                onChange={(e) => setMoles(e.target.value)}
                className="w-full px-4 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-white"
                placeholder="e.g., 0.5"
              />
            </div>
          )}

          {calculateWhat !== 'volume' && (
            <div>
              <label className="block text-sm font-medium mb-2 dark:text-gray-300">
                Volume of Solution (L)
              </label>
              <input
                type="number"
                value={volume}
                onChange={(e) => setVolume(e.target.value)}
                className="w-full px-4 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-white"
                placeholder="e.g., 1.0"
              />
            </div>
          )}

          {calculateWhat !== 'molarity' && (
            <div>
              <label className="block text-sm font-medium mb-2 dark:text-gray-300">
                Molarity (M or mol/L)
              </label>
              <input
                type="number"
                value={molarity}
                onChange={(e) => setMolarity(e.target.value)}
                className="w-full px-4 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-white"
                placeholder="e.g., 0.5"
              />
            </div>
          )}

          <button
            onClick={calculate}
            className="w-full bg-purple-500 hover:bg-purple-600 text-white font-semibold py-3 rounded-lg transition-colors"
          >
            Calculate
          </button>

          {calculateWhat === 'molarity' && molarity && (
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <p className="text-lg font-semibold dark:text-white">
                Molarity = {molarity} M (mol/L)
              </p>
            </div>
          )}

          {calculateWhat === 'moles' && moles && (
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <p className="text-lg font-semibold dark:text-white">
                Moles = {moles} mol
              </p>
            </div>
          )}

          {calculateWhat === 'volume' && volume && (
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <p className="text-lg font-semibold dark:text-white">
                Volume = {volume} L
              </p>
            </div>
          )}

          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <h4 className="font-semibold mb-2 dark:text-white text-sm">Formula:</h4>
            <p className="text-sm dark:text-gray-300">
              M = n / V
            </p>
            <p className="text-xs dark:text-gray-400 mt-1">
              where M = molarity (mol/L), n = moles, V = volume (L)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const LimitingReactantCalculator: React.FC = () => {
  const [reactant1Mass, setReactant1Mass] = useState('');
  const [reactant1MM, setReactant1MM] = useState('');
  const [reactant1Coeff, setReactant1Coeff] = useState('1');
  const [reactant2Mass, setReactant2Mass] = useState('');
  const [reactant2MM, setReactant2MM] = useState('');
  const [reactant2Coeff, setReactant2Coeff] = useState('1');
  const [result, setResult] = useState<{
    limiting: string;
    excess: string;
    moles1: number;
    moles2: number;
    ratio1: number;
    ratio2: number;
  } | null>(null);

  const calculate = () => {
    const mass1 = parseFloat(reactant1Mass);
    const mm1 = parseFloat(reactant1MM);
    const coeff1 = parseFloat(reactant1Coeff);
    const mass2 = parseFloat(reactant2Mass);
    const mm2 = parseFloat(reactant2MM);
    const coeff2 = parseFloat(reactant2Coeff);

    if (!isNaN(mass1) && !isNaN(mm1) && !isNaN(coeff1) && 
        !isNaN(mass2) && !isNaN(mm2) && !isNaN(coeff2)) {
      
      const moles1 = mass1 / mm1;
      const moles2 = mass2 / mm2;
      
      const ratio1 = moles1 / coeff1;
      const ratio2 = moles2 / coeff2;
      
      const limiting = ratio1 < ratio2 ? 'Reactant 1' : 'Reactant 2';
      const excess = ratio1 < ratio2 ? 'Reactant 2' : 'Reactant 1';
      
      setResult({
        limiting,
        excess,
        moles1,
        moles2,
        ratio1,
        ratio2
      });
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
        <div className="flex items-center gap-2 mb-4">
          <Droplet className="h-6 w-6 text-orange-500" />
          <h3 className="text-lg font-bold dark:text-white">Limiting Reactant Calculator</h3>
        </div>
        
        <div className="space-y-4">
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <h4 className="font-semibold mb-2 dark:text-white text-sm">Reactant 1</h4>
            <div className="space-y-2">
              <div>
                <label className="block text-xs font-medium mb-1 dark:text-gray-300">
                  Coefficient in Equation
                </label>
                <input
                  type="number"
                  value={reactant1Coeff}
                  onChange={(e) => setReactant1Coeff(e.target.value)}
                  className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-white text-sm"
                  placeholder="e.g., 2"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1 dark:text-gray-300">
                  Mass (g)
                </label>
                <input
                  type="number"
                  value={reactant1Mass}
                  onChange={(e) => setReactant1Mass(e.target.value)}
                  className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-white text-sm"
                  placeholder="e.g., 10"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1 dark:text-gray-300">
                  Molar Mass (g/mol)
                </label>
                <input
                  type="number"
                  value={reactant1MM}
                  onChange={(e) => setReactant1MM(e.target.value)}
                  className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-white text-sm"
                  placeholder="e.g., 18.015"
                />
              </div>
            </div>
          </div>

          <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <h4 className="font-semibold mb-2 dark:text-white text-sm">Reactant 2</h4>
            <div className="space-y-2">
              <div>
                <label className="block text-xs font-medium mb-1 dark:text-gray-300">
                  Coefficient in Equation
                </label>
                <input
                  type="number"
                  value={reactant2Coeff}
                  onChange={(e) => setReactant2Coeff(e.target.value)}
                  className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-white text-sm"
                  placeholder="e.g., 1"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1 dark:text-gray-300">
                  Mass (g)
                </label>
                <input
                  type="number"
                  value={reactant2Mass}
                  onChange={(e) => setReactant2Mass(e.target.value)}
                  className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-white text-sm"
                  placeholder="e.g., 20"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1 dark:text-gray-300">
                  Molar Mass (g/mol)
                </label>
                <input
                  type="number"
                  value={reactant2MM}
                  onChange={(e) => setReactant2MM(e.target.value)}
                  className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-white text-sm"
                  placeholder="e.g., 32.00"
                />
              </div>
            </div>
          </div>

          <button
            onClick={calculate}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-lg transition-colors"
          >
            Find Limiting Reactant
          </button>

          {result && (
            <div className="space-y-3">
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                  Limiting Reactant: {result.limiting}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Excess Reactant: {result.excess}
                </p>
              </div>

              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <h4 className="font-semibold mb-2 dark:text-white text-sm">Details:</h4>
                <div className="space-y-1 text-sm dark:text-gray-300">
                  <p>Reactant 1: {result.moles1.toFixed(4)} mol (ratio: {result.ratio1.toFixed(4)})</p>
                  <p>Reactant 2: {result.moles2.toFixed(4)} mol (ratio: {result.ratio2.toFixed(4)})</p>
                  <p className="text-xs mt-2 text-gray-500 dark:text-gray-400">
                    The reactant with the smaller mole ratio is the limiting reactant.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
