import React, { useState } from 'react';
import { Copy, Check, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export const LoremIpsumGenerator: React.FC = () => {
  const [paragraphs, setParagraphs] = useState<number>(3);
  const [words, setWords] = useState<number>(50);
  const [sentences, setSentences] = useState<number>(5);
  const [generatedText, setGeneratedText] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'paragraphs' | 'words' | 'sentences'>('paragraphs');

  const loremWords = [
    'lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing', 'elit',
    'sed', 'do', 'eiusmod', 'tempor', 'incididunt', 'ut', 'labore', 'et', 'dolore',
    'magna', 'aliqua', 'enim', 'ad', 'minim', 'veniam', 'quis', 'nostrud',
    'exercitation', 'ullamco', 'laboris', 'nisi', 'aliquip', 'ex', 'ea', 'commodo',
    'consequat', 'duis', 'aute', 'irure', 'in', 'reprehenderit', 'voluptate',
    'velit', 'esse', 'cillum', 'fugiat', 'nulla', 'pariatur', 'excepteur', 'sint',
    'occaecat', 'cupidatat', 'non', 'proident', 'sunt', 'culpa', 'qui', 'officia',
    'deserunt', 'mollit', 'anim', 'id', 'est', 'laborum', 'vitae', 'elementum',
    'tempus', 'quam', 'pellentesque', 'nec', 'nam', 'aliquam', 'sem', 'fringilla',
    'mattis', 'enim', 'ultricies', 'mi', 'eget', 'mauris', 'pharetra', 'odio',
    'facilisis', 'gravida', 'neque', 'convallis', 'posuere', 'morbi', 'leo',
    'urna', 'molestie', 'at', 'arcu', 'cursus', 'euismod', 'quis', 'viverra',
    'nibh', 'cras', 'pulvinar', 'proin', 'libero', 'nunc', 'consequat', 'interdum',
    'varius', 'integer', 'malesuada', 'fames', 'ac', 'turpis', 'egestas',
    'maecenas', 'accumsan', 'lacus', 'vel', 'facilisis', 'volutpat', 'est'
  ];

  const generateWord = (): string => {
    return loremWords[Math.floor(Math.random() * loremWords.length)];
  };

  const generateSentence = (wordCount: number = 10): string => {
    const sentence = [];
    for (let i = 0; i < wordCount; i++) {
      sentence.push(generateWord());
    }
    const text = sentence.join(' ');
    return text.charAt(0).toUpperCase() + text.slice(1) + '.';
  };

  const generateParagraph = (sentenceCount: number = 5): string => {
    const sentences = [];
    for (let i = 0; i < sentenceCount; i++) {
      sentences.push(generateSentence(Math.floor(Math.random() * 10) + 5));
    }
    return sentences.join(' ');
  };

  const generateByParagraphs = () => {
    const result = [];
    for (let i = 0; i < paragraphs; i++) {
      result.push(generateParagraph(Math.floor(Math.random() * 5) + 3));
    }
    setGeneratedText(result.join('\n\n'));
  };

  const generateByWords = () => {
    const result = [];
    for (let i = 0; i < words; i++) {
      result.push(generateWord());
    }
    setGeneratedText(result.join(' '));
  };

  const generateBySentences = () => {
    const result = [];
    for (let i = 0; i < sentences; i++) {
      result.push(generateSentence(Math.floor(Math.random() * 10) + 5));
    }
    setGeneratedText(result.join(' '));
  };

  const handleGenerate = () => {
    switch (activeTab) {
      case 'paragraphs':
        generateByParagraphs();
        break;
      case 'words':
        generateByWords();
        break;
      case 'sentences':
        generateBySentences();
        break;
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900">
      <div className="p-4 border-b dark:border-gray-700">
        <div className="flex items-center gap-3">
          <FileText className="h-6 w-6 text-blue-600" />
          <div>
            <h2 className="text-2xl font-semibold dark:text-white">Lorem Ipsum Generator</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">Generate placeholder text for your designs</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <div className="max-w-4xl mx-auto space-y-4">
          {/* Controls */}
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="paragraphs">Paragraphs</TabsTrigger>
              <TabsTrigger value="words">Words</TabsTrigger>
              <TabsTrigger value="sentences">Sentences</TabsTrigger>
            </TabsList>

            <TabsContent value="paragraphs" className="mt-4">
              <div className="flex items-center gap-4">
                <label className="text-sm font-semibold dark:text-white">Number of Paragraphs:</label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={paragraphs}
                  onChange={(e) => setParagraphs(Math.max(1, Math.min(20, parseInt(e.target.value) || 1)))}
                  className="w-24 px-3 py-2 border rounded dark:bg-gray-800 dark:text-white dark:border-gray-700"
                />
                <Button onClick={handleGenerate}>Generate</Button>
              </div>
            </TabsContent>

            <TabsContent value="words" className="mt-4">
              <div className="flex items-center gap-4">
                <label className="text-sm font-semibold dark:text-white">Number of Words:</label>
                <input
                  type="number"
                  min="1"
                  max="500"
                  value={words}
                  onChange={(e) => setWords(Math.max(1, Math.min(500, parseInt(e.target.value) || 1)))}
                  className="w-24 px-3 py-2 border rounded dark:bg-gray-800 dark:text-white dark:border-gray-700"
                />
                <Button onClick={handleGenerate}>Generate</Button>
              </div>
            </TabsContent>

            <TabsContent value="sentences" className="mt-4">
              <div className="flex items-center gap-4">
                <label className="text-sm font-semibold dark:text-white">Number of Sentences:</label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={sentences}
                  onChange={(e) => setSentences(Math.max(1, Math.min(50, parseInt(e.target.value) || 1)))}
                  className="w-24 px-3 py-2 border rounded dark:bg-gray-800 dark:text-white dark:border-gray-700"
                />
                <Button onClick={handleGenerate}>Generate</Button>
              </div>
            </TabsContent>
          </Tabs>

          {/* Generated Text */}
          {generatedText && (
            <div className="border rounded dark:border-gray-700">
              <div className="flex items-center justify-between p-3 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                <span className="text-sm font-semibold dark:text-white">Generated Text</span>
                <Button variant="ghost" size="sm" onClick={copyToClipboard}>
                  {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                  <span className="ml-2">{copied ? 'Copied!' : 'Copy'}</span>
                </Button>
              </div>
              <div className="p-4 max-h-96 overflow-auto">
                <p className="text-sm dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                  {generatedText}
                </p>
              </div>
            </div>
          )}

          {/* Info */}
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">What is Lorem Ipsum?</h3>
            <p className="text-sm text-blue-800 dark:text-blue-400">
              Lorem Ipsum is placeholder text commonly used in the graphic, print, and publishing industries 
              for previewing layouts and visual mockups. It helps designers focus on design elements without 
              being distracted by meaningful content.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-3 gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setParagraphs(1);
                setActiveTab('paragraphs');
                setTimeout(() => generateByParagraphs(), 100);
              }}
            >
              Quick: 1 Paragraph
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setParagraphs(3);
                setActiveTab('paragraphs');
                setTimeout(() => generateByParagraphs(), 100);
              }}
            >
              Quick: 3 Paragraphs
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setParagraphs(5);
                setActiveTab('paragraphs');
                setTimeout(() => generateByParagraphs(), 100);
              }}
            >
              Quick: 5 Paragraphs
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
