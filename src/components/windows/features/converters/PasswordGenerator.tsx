import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Copy, RefreshCw, Check } from 'lucide-react';
import { randomPassword } from '@/lib/crypto/random';

export const PasswordGenerator: React.FC = () => {
  const [password, setPassword] = useState('');
  const [length, setLength] = useState(16);
  const [includeUppercase, setIncludeUppercase] = useState(true);
  const [includeLowercase, setIncludeLowercase] = useState(true);
  const [includeNumbers, setIncludeNumbers] = useState(true);
  const [includeSymbols, setIncludeSymbols] = useState(true);
  const [copied, setCopied] = useState(false);

  const generatePassword = () => {
    const sets: string[] = [];
    if (includeUppercase) sets.push('ABCDEFGHIJKLMNOPQRSTUVWXYZ');
    if (includeLowercase) sets.push('abcdefghijklmnopqrstuvwxyz');
    if (includeNumbers) sets.push('0123456789');
    if (includeSymbols) sets.push('!@#$%^&*()_+-=[]{}|;:,.<>?');

    if (sets.length === 0) {
      setPassword('Please select at least one character type');
      return;
    }

    // randomPassword draws without modulo bias and guarantees at least one
    // character from each selected set, so the result always satisfies the
    // policy the user picked.
    setPassword(randomPassword(sets, length));
    setCopied(false);
  };

  const copyToClipboard = () => {
    if (password && !password.startsWith('Please')) {
      navigator.clipboard.writeText(password);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getStrength = () => {
    if (!password || password.startsWith('Please')) return { label: '', color: '' };
    
    let score = 0;
    if (length >= 12) score++;
    if (length >= 16) score++;
    if (includeUppercase) score++;
    if (includeLowercase) score++;
    if (includeNumbers) score++;
    if (includeSymbols) score++;

    if (score <= 2) return { label: 'Weak', color: 'text-red-500' };
    if (score <= 4) return { label: 'Medium', color: 'text-yellow-500' };
    return { label: 'Strong', color: 'text-green-500' };
  };

  const strength = getStrength();

  return (
    <div className="h-full flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50 p-6">
      <Card className="w-full max-w-2xl p-8 space-y-6">
        <div className="space-y-4">
          <div className="relative">
            <div className="flex items-center gap-2 p-4 bg-slate-100 rounded-lg border-2 border-slate-300 font-mono text-lg break-all min-h-[60px]">
              {password || 'Click Generate to create a password'}
            </div>
            {password && !password.startsWith('Please') && (
              <div className="absolute top-2 right-2 flex gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={copyToClipboard}
                  className="h-8 w-8 p-0"
                >
                  {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            )}
          </div>

          {strength.label && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">Password Strength:</span>
              <span className={`font-semibold ${strength.color}`}>{strength.label}</span>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Length: {length}</Label>
            </div>
            <Slider
              value={[length]}
              onValueChange={(value) => setLength(value[0])}
              min={4}
              max={64}
              step={1}
              className="w-full"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <Label htmlFor="uppercase" className="text-sm cursor-pointer">Uppercase (A-Z)</Label>
              <Switch
                id="uppercase"
                checked={includeUppercase}
                onCheckedChange={setIncludeUppercase}
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <Label htmlFor="lowercase" className="text-sm cursor-pointer">Lowercase (a-z)</Label>
              <Switch
                id="lowercase"
                checked={includeLowercase}
                onCheckedChange={setIncludeLowercase}
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <Label htmlFor="numbers" className="text-sm cursor-pointer">Numbers (0-9)</Label>
              <Switch
                id="numbers"
                checked={includeNumbers}
                onCheckedChange={setIncludeNumbers}
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <Label htmlFor="symbols" className="text-sm cursor-pointer">Symbols (!@#$...)</Label>
              <Switch
                id="symbols"
                checked={includeSymbols}
                onCheckedChange={setIncludeSymbols}
              />
            </div>
          </div>
        </div>

        <Button
          onClick={generatePassword}
          className="w-full h-12 text-base gap-2"
          size="lg"
        >
          <RefreshCw className="h-5 w-5" />
          Generate Password
        </Button>
      </Card>
    </div>
  );
};
