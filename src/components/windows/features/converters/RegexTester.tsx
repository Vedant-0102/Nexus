import React, { useState, useMemo } from 'react';
import { AlertCircle, CheckCircle2, Copy, HelpCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const RegexTester: React.FC = () => {
  const [pattern, setPattern] = useState<string>('\\b[A-Z][a-z]+\\b');
  const [flags, setFlags] = useState<string>('g');
  const [testString, setTestString] = useState<string>('Hello World! This is a Test String with Multiple Words.');
  const [replaceWith, setReplaceWith] = useState<string>('***');
  const [showGuide, setShowGuide] = useState<boolean>(false);

  const result = useMemo(() => {
    if (!pattern) return null;

    try {
      const regex = new RegExp(pattern, flags);
      const matches = Array.from(testString.matchAll(regex));
      const isValid = true;
      const replaced = testString.replace(regex, replaceWith);

      return { isValid, matches, replaced, error: null };
    } catch (error) {
      return {
        isValid: false,
        matches: [],
        replaced: '',
        error: error instanceof Error ? error.message : 'Invalid regex',
      };
    }
  }, [pattern, flags, testString, replaceWith]);

  const highlightMatches = () => {
    if (!result?.matches.length) return testString;

    let highlighted = testString;
    let offset = 0;

    result.matches.forEach((match) => {
      const start = match.index! + offset;
      const end = start + match[0].length;
      const before = highlighted.slice(0, start);
      const matchText = highlighted.slice(start, end);
      const after = highlighted.slice(end);

      highlighted = `${before}<mark class="bg-yellow-300 dark:bg-yellow-600">${matchText}</mark>${after}`;
      offset += 47; // Length of mark tags
    });

    return highlighted;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900">
      <div className="p-4 border-b dark:border-gray-700 flex items-center justify-between">
        <h2 className="text-2xl font-semibold dark:text-white">Regex Tester</h2>
        <Button variant="outline" size="sm" onClick={() => setShowGuide(true)}>
          <HelpCircle className="h-4 w-4 mr-2" />
          Quick Guide
        </Button>
      </div>

      {/* Guide Modal */}
      {showGuide && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowGuide(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl max-h-[80vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold dark:text-white">Regex Quick Guide</h3>
              <button onClick={() => setShowGuide(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-4 text-sm dark:text-gray-300">
              <div>
                <h4 className="font-semibold mb-2">Common Patterns:</h4>
                <ul className="space-y-1 ml-4">
                  <li><code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">\d</code> - Any digit (0-9)</li>
                  <li><code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">\w</code> - Any word character (a-z, A-Z, 0-9, _)</li>
                  <li><code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">\s</code> - Any whitespace</li>
                  <li><code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">.</code> - Any character except newline</li>
                  <li><code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">[A-Z]</code> - Any uppercase letter</li>
                  <li><code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">[0-9]</code> - Any digit</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Quantifiers:</h4>
                <ul className="space-y-1 ml-4">
                  <li><code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">*</code> - 0 or more times</li>
                  <li><code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">+</code> - 1 or more times</li>
                  <li><code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">?</code> - 0 or 1 time</li>
                  <li><code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">{`{n}`}</code> - Exactly n times</li>
                  <li><code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">{`{n,m}`}</code> - Between n and m times</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Anchors:</h4>
                <ul className="space-y-1 ml-4">
                  <li><code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">^</code> - Start of string</li>
                  <li><code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">$</code> - End of string</li>
                  <li><code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">\b</code> - Word boundary</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Examples:</h4>
                <ul className="space-y-2 ml-4">
                  <li><code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">\b[A-Z][a-z]+\b</code> - Capitalized words</li>
                  <li><code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">\d{3}-\d{3}-\d{4}</code> - Phone number (123-456-7890)</li>
                  <li><code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{`{2,}`}</code> - Email</li>
                  <li><code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">https?://[^\s]+</code> - URL</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Flags:</h4>
                <ul className="space-y-1 ml-4">
                  <li><code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">g</code> - Global (find all matches)</li>
                  <li><code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">i</code> - Case-insensitive</li>
                  <li><code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">m</code> - Multiline</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-auto p-4">
        <div className="max-w-4xl mx-auto space-y-4">
          {/* Pattern Input */}
          <div>
            <label className="block text-sm font-semibold mb-2 dark:text-white">
              Regular Expression
            </label>
            <div className="flex gap-2">
              <span className="px-3 py-2 border rounded-l dark:bg-gray-800 dark:text-white dark:border-gray-700">/</span>
              <input
                type="text"
                value={pattern}
                onChange={(e) => setPattern(e.target.value)}
                placeholder="[A-Za-z0-9]+"
                className="flex-1 px-3 py-2 border-y dark:bg-gray-800 dark:text-white dark:border-gray-700 font-mono"
              />
              <span className="px-3 py-2 border dark:bg-gray-800 dark:text-white dark:border-gray-700">/</span>
              <input
                type="text"
                value={flags}
                onChange={(e) => setFlags(e.target.value)}
                placeholder="g"
                className="w-20 px-3 py-2 border rounded-r dark:bg-gray-800 dark:text-white dark:border-gray-700 font-mono"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">Flags: g (global), i (case-insensitive), m (multiline)</p>
          </div>

          {/* Validation Status */}
          {result && (
            <div className={`flex items-center gap-2 p-3 rounded ${result.isValid ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
              {result.isValid ? (
                <>
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <span className="text-green-700 dark:text-green-400">
                    Valid regex • {result.matches.length} match{result.matches.length !== 1 ? 'es' : ''} found
                  </span>
                </>
              ) : (
                <>
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  <span className="text-red-700 dark:text-red-400">{result.error}</span>
                </>
              )}
            </div>
          )}

          {/* Test String */}
          <div>
            <label className="block text-sm font-semibold mb-2 dark:text-white">
              Test String
            </label>
            <textarea
              value={testString}
              onChange={(e) => setTestString(e.target.value)}
              placeholder="Enter text to test against the regex..."
              className="w-full h-32 px-3 py-2 border rounded dark:bg-gray-800 dark:text-white dark:border-gray-700 resize-none"
            />
          </div>

          {/* Highlighted Matches */}
          {result?.isValid && testString && (
            <div>
              <label className="block text-sm font-semibold mb-2 dark:text-white">
                Matches Highlighted
              </label>
              <div
                className="p-3 border rounded dark:border-gray-700 bg-gray-50 dark:bg-gray-800 whitespace-pre-wrap break-words"
                dangerouslySetInnerHTML={{ __html: highlightMatches() }}
              />
            </div>
          )}

          {/* Match Details */}
          {result?.matches && result.matches.length > 0 && (
            <div>
              <label className="block text-sm font-semibold mb-2 dark:text-white">
                Match Details
              </label>
              <div className="border rounded dark:border-gray-700 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-3 py-2 text-left">#</th>
                      <th className="px-3 py-2 text-left">Match</th>
                      <th className="px-3 py-2 text-left">Index</th>
                      <th className="px-3 py-2 text-left">Groups</th>
                    </tr>
                  </thead>
                  <tbody className="dark:text-gray-300">
                    {result.matches.map((match, i) => (
                      <tr key={i} className="border-t dark:border-gray-700">
                        <td className="px-3 py-2">{i + 1}</td>
                        <td className="px-3 py-2 font-mono">{match[0]}</td>
                        <td className="px-3 py-2">{match.index}</td>
                        <td className="px-3 py-2 font-mono">
                          {match.slice(1).length > 0 ? match.slice(1).join(', ') : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Replace */}
          <div>
            <label className="block text-sm font-semibold mb-2 dark:text-white">
              Replace With
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={replaceWith}
                onChange={(e) => setReplaceWith(e.target.value)}
                placeholder="Replacement text (use $1, $2 for groups)"
                className="flex-1 px-3 py-2 border rounded dark:bg-gray-800 dark:text-white dark:border-gray-700 font-mono"
              />
              <Button
                variant="outline"
                onClick={() => copyToClipboard(result?.replaced || '')}
                disabled={!result?.replaced}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Replaced Result */}
          {result?.replaced && replaceWith && (
            <div>
              <label className="block text-sm font-semibold mb-2 dark:text-white">
                Result
              </label>
              <pre className="p-3 border rounded dark:border-gray-700 bg-gray-50 dark:bg-gray-800 whitespace-pre-wrap break-words dark:text-gray-300">
                {result.replaced}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
