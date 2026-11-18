import React, { useState, useMemo } from 'react';
import { Copy, Check, BarChart2, Search } from 'lucide-react';

type CipherType = 'caesar' | 'rot13' | 'vigenere' | 'atbash' | 'affine' | 'rail-fence' | 'substitution' | 'morse';



export const ClassicalCiphers: React.FC = () => {
  return (
    <div className="h-full flex items-center justify-center bg-gradient-to-br from-slate-50 to-orange-50 dark:from-gray-950 dark:to-orange-950 p-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2">Classical Ciphers</h2>
        <p className="text-gray-600 dark:text-gray-400">This feature is currently unavailable.</p>
      </div>
    </div>
  );
};
