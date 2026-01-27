import React, { useState, useEffect } from 'react';
import { ArrowLeft, ArrowUp, ArrowDown, ArrowRight, ArrowUpRight, ArrowDownLeft, ArrowDownRight, ArrowUpLeft, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';

export const GradientGenerator: React.FC = () => {
  const { toast } = useToast();
  const [colorOne, setColorOne] = useState('#7986cb');
  const [colorTwo, setColorTwo] = useState('#1a237e');
  const [currentDirection, setCurrentDirection] = useState('to bottom');
  const [generatedCode, setGeneratedCode] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);

  const directions = [
    { value: 'to top', icon: ArrowUp, label: 'Top' },
    { value: 'to bottom', icon: ArrowDown, label: 'Bottom' },
    { value: 'to right', icon: ArrowRight, label: 'Right' },
    { value: 'to left', icon: ArrowLeft, label: 'Left' },
    { value: 'to top right', icon: ArrowUpRight, label: 'Top Right' },
    { value: 'to bottom left', icon: ArrowDownLeft, label: 'Bottom Left' },
    { value: 'to bottom right', icon: ArrowDownRight, label: 'Bottom Right' },
    { value: 'to top left', icon: ArrowUpLeft, label: 'Top Left' }
  ];

  const generateCode = () => {
    const code = `background: linear-gradient(${currentDirection}, ${colorOne}, ${colorTwo});`;
    setGeneratedCode(code);
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generatedCode);
      setCopySuccess(true);
      toast({ title: 'Copied to clipboard!' });
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      const textArea = document.createElement('textarea');
      textArea.value = generatedCode;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopySuccess(true);
      toast({ title: 'Copied to clipboard!' });
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  useEffect(() => {
    generateCode();
  }, [colorOne, colorTwo, currentDirection]);

  const gradientStyle = {
    background: `linear-gradient(${currentDirection}, ${colorOne}, ${colorTwo})`
  };

  return (
    <div className="h-full w-full bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 p-6 overflow-auto">
      <div className="max-w-6xl mx-auto w-full">


        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Left Side - Controls */}
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-6">
              Controls
            </h2>

            <div className="flex justify-center gap-8 mb-8">
              <div className="flex flex-col items-center gap-3">
                <label className="text-sm font-semibold">
                  Start Color
                </label>
                <input
                  type="color"
                  value={colorOne}
                  onChange={(e) => setColorOne(e.target.value)}
                  className="w-14 h-14 border-2 rounded-lg cursor-pointer hover:scale-105 transition-all"
                />
                <span className="text-xs font-mono font-semibold">
                  {colorOne}
                </span>
              </div>

              <div className="flex flex-col items-center gap-3">
                <label className="text-sm font-semibold">
                  End Color
                </label>
                <input
                  type="color"
                  value={colorTwo}
                  onChange={(e) => setColorTwo(e.target.value)}
                  className="w-14 h-14 border-2 rounded-lg cursor-pointer hover:scale-105 transition-all"
                />
                <span className="text-xs font-mono font-semibold">
                  {colorTwo}
                </span>
              </div>
            </div>

            <div className="mb-8">
              <label className="block text-base font-semibold mb-3">
                Direction
              </label>
              <div className="grid grid-cols-4 gap-2 mt-4">
                {directions.map((direction) => {
                  const IconComponent = direction.icon;
                  return (
                    <button
                      key={direction.value}
                      className={`w-10 h-10 border-2 rounded-lg cursor-pointer flex items-center justify-center transition-all hover:scale-110 ${currentDirection === direction.value
                          ? 'bg-blue-500 text-white border-blue-600'
                          : 'bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                      onClick={() => setCurrentDirection(direction.value)}
                      title={direction.label}
                    >
                      <IconComponent className="w-4 h-4" />
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mb-0">
              <label className="block text-lg font-semibold mb-4">
                CSS Code
              </label>
              <div className="space-y-4 mt-4">
                <textarea
                  value={generatedCode}
                  readOnly
                  className="w-full py-4 px-4 border-2 rounded-lg font-mono text-sm leading-5 bg-white dark:bg-gray-800 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  rows={3}
                />
                <div className="flex justify-center">
                  <Button
                    className="flex items-center gap-2"
                    onClick={copyToClipboard}
                  >
                    <Copy className="w-4 h-4" />
                    {copySuccess ? 'Copied!' : 'Copy CSS'}
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          {/* Right Side - Gradient Preview */}
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-6">
              Preview
            </h2>
            <div className="mb-6">
              <div
                className="w-full h-64 border-2 rounded-lg shadow-lg transition-all duration-300 ease-in-out hover:shadow-xl"
                style={gradientStyle}
              ></div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
