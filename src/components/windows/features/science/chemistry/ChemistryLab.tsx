import React, { useState } from 'react';
import { Beaker, FlaskConical, TestTube, Flame, Droplet, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { EquationBalancer } from './EquationBalancer';

interface Element {
  symbol: string;
  name: string;
  atomicNumber: number;
  atomicMass: number;
  category: string;
  color: string;
}

interface Reaction {
  name: string;
  reactants: string[];
  products: string[];
  type: string;
  description: string;
  color: string;
  energy: string;
  exothermic: boolean;
  observation: string;
}

const periodicElements: Element[] = [
  { symbol: 'H', name: 'Hydrogen', atomicNumber: 1, atomicMass: 1.008, category: 'nonmetal', color: '#FF6B6B' },
  { symbol: 'He', name: 'Helium', atomicNumber: 2, atomicMass: 4.003, category: 'noble-gas', color: '#4ECDC4' },
  { symbol: 'Li', name: 'Lithium', atomicNumber: 3, atomicMass: 6.941, category: 'alkali-metal', color: '#FFD93D' },
  { symbol: 'C', name: 'Carbon', atomicNumber: 6, atomicMass: 12.011, category: 'nonmetal', color: '#95E1D3' },
  { symbol: 'N', name: 'Nitrogen', atomicNumber: 7, atomicMass: 14.007, category: 'nonmetal', color: '#A8E6CF' },
  { symbol: 'O', name: 'Oxygen', atomicNumber: 8, atomicMass: 15.999, category: 'nonmetal', color: '#FF8B94' },
  { symbol: 'Na', name: 'Sodium', atomicNumber: 11, atomicMass: 22.990, category: 'alkali-metal', color: '#FFAAA5' },
  { symbol: 'Mg', name: 'Magnesium', atomicNumber: 12, atomicMass: 24.305, category: 'alkaline-earth', color: '#FFD3B6' },
  { symbol: 'Al', name: 'Aluminum', atomicNumber: 13, atomicMass: 26.982, category: 'post-transition', color: '#FFAAA5' },
  { symbol: 'Cl', name: 'Chlorine', atomicNumber: 17, atomicMass: 35.453, category: 'halogen', color: '#A8E6CF' },
  { symbol: 'Fe', name: 'Iron', atomicNumber: 26, atomicMass: 55.845, category: 'transition-metal', color: '#DCEDC1' },
  { symbol: 'Cu', name: 'Copper', atomicNumber: 29, atomicMass: 63.546, category: 'transition-metal', color: '#FFD93D' },
  { symbol: 'Ag', name: 'Silver', atomicNumber: 47, atomicMass: 107.868, category: 'transition-metal', color: '#C7CEEA' },
  { symbol: 'Au', name: 'Gold', atomicNumber: 79, atomicMass: 196.967, category: 'transition-metal', color: '#FFD700' },
];

const reactions: Reaction[] = [
  {
    name: 'Acid-Base Neutralization',
    reactants: ['HCl', 'NaOH'],
    products: ['NaCl', 'H₂O'],
    type: 'Neutralization',
    description: 'Hydrochloric acid reacts with sodium hydroxide to form salt and water',
    color: '#4ECDC4',
    energy: '−57.3 kJ/mol',
    exothermic: true,
    observation: 'The solution warms up. With an indicator, the color shifts as pH moves toward 7. H⁺ from the acid and OH⁻ from the base combine into water.',
  },
  {
    name: 'Combustion of Methane',
    reactants: ['CH₄', '2O₂'],
    products: ['CO₂', '2H₂O'],
    type: 'Combustion',
    description: 'Methane burns in oxygen to produce carbon dioxide and water',
    color: '#FF6B6B',
    energy: '−890 kJ/mol',
    exothermic: true,
    observation: 'A blue flame — this is what happens in a gas stove. Note the coefficient 2 on O₂ and H₂O: it takes two O₂ molecules to balance the 4 hydrogens and 2 oxygens.',
  },
  {
    name: 'Precipitation',
    reactants: ['AgNO₃', 'NaCl'],
    products: ['AgCl↓', 'NaNO₃'],
    type: 'Precipitation',
    description: 'Silver nitrate reacts with sodium chloride to form silver chloride precipitate',
    color: '#FFD93D',
    energy: '≈ −65 kJ/mol',
    exothermic: true,
    observation: 'A milky white solid (AgCl) suddenly appears and settles — the ↓ arrow means it falls out of solution because it is insoluble in water.',
  },
  {
    name: 'Redox Reaction',
    reactants: ['Zn', 'CuSO₄'],
    products: ['ZnSO₄', 'Cu'],
    type: 'Redox',
    description: 'Zinc displaces copper from copper sulfate solution',
    color: '#95E1D3',
    energy: '−219 kJ/mol',
    exothermic: true,
    observation: 'The blue Cu²⁺ solution fades as reddish copper metal coats the zinc. Zn loses electrons (oxidized), Cu²⁺ gains them (reduced) — Zn is more reactive, so it wins.',
  },
];

export const ChemistryLab: React.FC = () => {
  const [selectedElement, setSelectedElement] = useState<Element | null>(null);
  const [selectedReaction, setSelectedReaction] = useState<Reaction | null>(null);
  const [isReacting, setIsReacting] = useState(false);
  const [pH, setPH] = useState(7);
  const [temperature, setTemperature] = useState(25);

  const runReaction = (reaction: Reaction) => {
    setSelectedReaction(reaction);
    setIsReacting(true);
    setTimeout(() => setIsReacting(false), 3000);
  };

  const getPHColor = (ph: number) => {
    if (ph < 4) return '#FF6B6B';
    if (ph < 7) return '#FFD93D';
    if (ph === 7) return '#4ECDC4';
    if (ph < 11) return '#95E1D3';
    return '#A8E6CF';
  };

  return (
    <div className="h-full w-full bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 p-6 overflow-auto">
      <Tabs defaultValue="periodic" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="periodic">Periodic Table</TabsTrigger>
          <TabsTrigger value="reactions">Reactions</TabsTrigger>
          <TabsTrigger value="lab">Virtual Lab</TabsTrigger>
          <TabsTrigger value="calculator">Calculator</TabsTrigger>
        </TabsList>

        {/* Periodic Table */}
        <TabsContent value="periodic" className="space-y-4">
          <div className="grid grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
            {periodicElements.map((element) => (
              <Card
                key={element.symbol}
                className="p-3 cursor-pointer hover:scale-105 transition-transform"
                style={{ backgroundColor: element.color + '40', borderColor: element.color }}
                onClick={() => setSelectedElement(element)}
              >
                <div className="text-center">
                  <div className="text-xs text-gray-600 dark:text-gray-300">{element.atomicNumber}</div>
                  <div className="text-2xl font-bold">{element.symbol}</div>
                  <div className="text-xs truncate">{element.name}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-300">{element.atomicMass.toFixed(2)}</div>
                </div>
              </Card>
            ))}
          </div>

          {selectedElement && (
            <Card className="p-6 bg-white dark:bg-gray-800">
              <h3 className="text-2xl font-bold mb-4">{selectedElement.name} ({selectedElement.symbol})</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Atomic Number</p>
                  <p className="text-xl font-semibold">{selectedElement.atomicNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Atomic Mass</p>
                  <p className="text-xl font-semibold">{selectedElement.atomicMass} u</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Category</p>
                  <p className="text-xl font-semibold capitalize">{selectedElement.category.replace('-', ' ')}</p>
                </div>
              </div>
            </Card>
          )}
        </TabsContent>

        {/* Reactions */}
        <TabsContent value="reactions" className="space-y-4">
          <div className="grid gap-4">
            {reactions.map((reaction, idx) => (
              <Card key={idx} className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold mb-2">{reaction.name}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{reaction.description}</p>
                    <div className="flex items-center gap-2 text-lg font-mono mb-2">
                      <span>{reaction.reactants.join(' + ')}</span>
                      <span>→</span>
                      <span>{reaction.products.join(' + ')}</span>
                    </div>
                    <span className="inline-block px-3 py-1 rounded-full text-sm" style={{ backgroundColor: reaction.color + '40' }}>
                      {reaction.type}
                    </span>
                  </div>
                  <Button onClick={() => runReaction(reaction)} className="ml-4">
                    <Flame className="mr-2 h-4 w-4" />
                    Run
                  </Button>
                </div>
              </Card>
            ))}
          </div>

          {selectedReaction && (
            <Card className={`p-6 ${isReacting ? 'bg-gradient-to-r from-orange-100 to-red-100 dark:from-orange-900/40 dark:to-red-900/40' : 'bg-white dark:bg-gray-800'}`}>
              <div className="flex items-start gap-3">
                <Flame className={`h-8 w-8 text-orange-500 flex-shrink-0 ${isReacting ? 'animate-bounce' : ''}`} />
                <div className="flex-1">
                  <h4 className="font-bold mb-1">{isReacting ? 'Reaction in progress…' : `Result: ${selectedReaction.name}`}</h4>
                  <p className="text-lg font-mono mb-2">
                    {selectedReaction.reactants.join(' + ')} → {selectedReaction.products.join(' + ')}
                  </p>
                  <div className="grid sm:grid-cols-2 gap-3 text-sm">
                    <div className="p-3 rounded bg-orange-50 dark:bg-orange-900/30">
                      <p className="font-semibold text-orange-800 dark:text-orange-200">
                        {selectedReaction.exothermic ? '🔥 Exothermic' : '🧊 Endothermic'} · ΔH = {selectedReaction.energy}
                      </p>
                      <p className="text-xs mt-1 text-gray-600 dark:text-gray-300">
                        {selectedReaction.exothermic ? 'Energy is released to the surroundings — the products hold less chemical energy than the reactants.' : 'Energy is absorbed from the surroundings.'}
                      </p>
                    </div>
                    <div className="p-3 rounded bg-blue-50 dark:bg-blue-900/30">
                      <p className="font-semibold text-blue-800 dark:text-blue-200">👀 What you'd see</p>
                      <p className="text-xs mt-1 text-gray-600 dark:text-gray-300">{selectedReaction.observation}</p>
                    </div>
                  </div>
                  <p className="text-xs mt-3 text-gray-500 dark:text-gray-400">
                    ⚖️ The equation is balanced: every atom on the left appears on the right — matter is never created or destroyed, only rearranged.
                  </p>
                </div>
              </div>
            </Card>
          )}
        </TabsContent>

        {/* Virtual Lab */}
        <TabsContent value="lab" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Beaker className="h-5 w-5" />
                pH Meter
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-600 dark:text-gray-400">pH Level: {pH}</label>
                  <Slider
                    value={[pH]}
                    onValueChange={(v) => setPH(v[0])}
                    min={0}
                    max={14}
                    step={0.1}
                    className="mt-2"
                  />
                </div>
                <div
                  className="h-32 rounded-lg flex items-center justify-center text-white font-bold text-2xl"
                  style={{ backgroundColor: getPHColor(pH) }}
                >
                  pH {pH.toFixed(1)}
                </div>
                <p className="text-sm text-center">
                  {pH < 7 ? '🔴 Acidic' : pH === 7 ? '🟢 Neutral' : '🔵 Basic'}
                </p>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Flame className="h-5 w-5" />
                Temperature Control
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-600 dark:text-gray-400">Temperature: {temperature}°C</label>
                  <Slider
                    value={[temperature]}
                    onValueChange={(v) => setTemperature(v[0])}
                    min={-20}
                    max={200}
                    step={1}
                    className="mt-2"
                  />
                </div>
                <div className="h-32 bg-gradient-to-t from-blue-500 via-yellow-500 to-red-500 rounded-lg flex items-center justify-center text-white font-bold text-2xl">
                  {temperature}°C
                </div>
                <p className="text-sm text-center">
                  {temperature < 0 ? '❄️ Freezing' : temperature < 100 ? '🌡️ Room Temp' : '🔥 Boiling'}
                </p>
              </div>
            </Card>
          </div>

          <Card className="p-6">
            <h3 className="text-lg font-bold mb-4">Lab Equipment</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button variant="outline" className="h-24 flex-col">
                <Beaker className="h-8 w-8 mb-2" />
                Beaker
              </Button>
              <Button variant="outline" className="h-24 flex-col">
                <FlaskConical className="h-8 w-8 mb-2" />
                Flask
              </Button>
              <Button variant="outline" className="h-24 flex-col">
                <TestTube className="h-8 w-8 mb-2" />
                Test Tube
              </Button>
              <Button variant="outline" className="h-24 flex-col">
                <Droplet className="h-8 w-8 mb-2" />
                Pipette
              </Button>
            </div>
          </Card>
        </TabsContent>

        {/* Calculator */}
        <TabsContent value="calculator" className="space-y-4">
          <EquationBalancer />

          <Card className="p-6 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200">
            <div className="flex gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-yellow-800 dark:text-yellow-200">Safety First!</h4>
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  Always wear proper safety equipment when conducting real chemistry experiments.
                </p>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
