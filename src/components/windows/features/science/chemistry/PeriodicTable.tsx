import React, { useState } from 'react';
import { X } from 'lucide-react';
import { elements, categoryColors, Element } from './elements-data';

export const PeriodicTable: React.FC = () => {
  const [selectedElement, setSelectedElement] = useState<Element | null>(null);
  const [scale, setScale] = useState(1);

  const getElementPosition = (element: Element) => {
    // Handle lanthanides and actinides
    if (element.number >= 58 && element.number <= 71) {
      return { gridColumn: element.number - 54, gridRow: 9 };
    }
    if (element.number >= 90 && element.number <= 103) {
      return { gridColumn: element.number - 86, gridRow: 10 };
    }
    return {
      gridColumn: element.group || 1,
      gridRow: element.period,
    };
  };

  return (
    <div className="h-full flex flex-col p-2 overflow-hidden">
      <div className="mb-2">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-bold dark:text-white">Periodic Table (118 Elements)</h2>
          <div className="flex items-center gap-2">
            <span className="text-xs dark:text-gray-300">Zoom:</span>
            <input
              type="range"
              min="0.5"
              max="1"
              step="0.1"
              value={scale}
              onChange={(e) => setScale(Number(e.target.value))}
              className="w-20"
            />
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="mb-2 flex flex-wrap gap-1 text-xs">
        {Object.entries(categoryColors).map(([category, color]) => (
          <div key={category} className="flex items-center gap-1">
            <div className={`w-3 h-3 rounded ${color}`}></div>
            <span className="dark:text-gray-300 capitalize text-xs">
              {category.replace('-', ' ')}
            </span>
          </div>
        ))}
      </div>

      {/* Periodic Table Grid */}
      <div className="flex-1 overflow-auto">
        <div 
          className="relative" 
          style={{ 
            display: 'grid', 
            gridTemplateColumns: `repeat(18, ${scale * 50}px)`, 
            gridTemplateRows: `repeat(10, ${scale * 60}px)`,
            gap: `${scale * 2}px`,
            fontSize: `${scale * 12}px`
          }}
        >
          {elements.map((element) => (
            <div
              key={element.number}
              style={getElementPosition(element)}
              onClick={() => setSelectedElement(element)}
              className={`${
                categoryColors[element.category]
              } p-1 rounded cursor-pointer hover:scale-105 transition-transform shadow-sm hover:shadow-md`}
            >
              <div className="text-[0.6em] font-bold text-gray-800">{element.number}</div>
              <div className="text-[1.5em] font-bold text-center text-gray-900 leading-none">{element.symbol}</div>
              <div className="text-[0.5em] text-center text-gray-800 truncate">{element.name}</div>
              <div className="text-[0.5em] text-center text-gray-700">{element.atomicMass.toFixed(2)}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Element Detail Modal */}
      {selectedElement && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className={`${categoryColors[selectedElement.category]} w-20 h-20 rounded-lg flex items-center justify-center`}>
                  <span className="text-4xl font-bold text-gray-900">{selectedElement.symbol}</span>
                </div>
                <div>
                  <h2 className="text-2xl font-bold dark:text-white">{selectedElement.name}</h2>
                  <p className="text-gray-600 dark:text-gray-400">Atomic Number: {selectedElement.number}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedElement(null)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 dark:text-gray-300" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="text-xs text-gray-600 dark:text-gray-400">Atomic Mass</p>
                <p className="text-lg font-semibold dark:text-white">{selectedElement.atomicMass} u</p>
              </div>

              <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="text-xs text-gray-600 dark:text-gray-400">Category</p>
                <p className="text-sm font-semibold dark:text-white capitalize">
                  {selectedElement.category.replace('-', ' ')}
                </p>
              </div>

              <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg col-span-2">
                <p className="text-xs text-gray-600 dark:text-gray-400">Electron Configuration</p>
                <p className="text-sm font-semibold dark:text-white">{selectedElement.electronConfig}</p>
              </div>

              <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="text-xs text-gray-600 dark:text-gray-400">Group & Period</p>
                <p className="text-sm font-semibold dark:text-white">
                  {selectedElement.group ? `Group ${selectedElement.group}, ` : ''}Period {selectedElement.period}
                </p>
              </div>

              <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="text-xs text-gray-600 dark:text-gray-400">State</p>
                <p className="text-sm font-semibold dark:text-white capitalize">{selectedElement.state || 'Unknown'}</p>
              </div>

              {selectedElement.meltingPoint && (
                <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <p className="text-xs text-gray-600 dark:text-gray-400">Melting Point</p>
                  <p className="text-sm font-semibold dark:text-white">{selectedElement.meltingPoint}°C</p>
                </div>
              )}

              {selectedElement.boilingPoint && (
                <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <p className="text-xs text-gray-600 dark:text-gray-400">Boiling Point</p>
                  <p className="text-sm font-semibold dark:text-white">{selectedElement.boilingPoint}°C</p>
                </div>
              )}

              {selectedElement.density && (
                <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <p className="text-xs text-gray-600 dark:text-gray-400">Density</p>
                  <p className="text-sm font-semibold dark:text-white">{selectedElement.density} g/cm³</p>
                </div>
              )}

              {selectedElement.electronegativity && (
                <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <p className="text-xs text-gray-600 dark:text-gray-400">Electronegativity</p>
                  <p className="text-sm font-semibold dark:text-white">{selectedElement.electronegativity}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
