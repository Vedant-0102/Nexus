import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Plus, Trash2, Play, RotateCcw, Check, X,
  BookOpen, Brain, TrendingUp, Download, Upload, Folder, Settings,
  Keyboard, Timer, ArrowRight, ArrowLeft, Box
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Flashcard {
  id: string;
  front: string;
  back: string;
  category: string;
  lastReviewed?: string;
  correctCount: number;
  incorrectCount: number;
  difficulty: 'easy' | 'medium' | 'hard';
  leitnerBox: number;
  nextReviewDate?: string;
  streak: number;
}

interface Deck {
  id: string;
  name: string;
  cards: Flashcard[];
  created: Date;
}

interface FlashcardSettings {
  keyboardShortcuts: boolean;
  srsEnabled: boolean;
  markdownEnabled: boolean;
  sessionTimer: boolean;
  autoAdvance: boolean;
}

const DEFAULT_SETTINGS: FlashcardSettings = {
  keyboardShortcuts: true,
  srsEnabled: true,
  markdownEnabled: true,
  sessionTimer: true,
  autoAdvance: false,
};

const LEITNER_INTERVALS = [0, 1, 3, 7, 14, 30]; // days per box (0-indexed, box 0 unused)

function renderMarkdown(text: string, enabled: boolean): React.ReactNode {
  if (!enabled) return text;
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={i} className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-sm font-mono">{part.slice(1, -1)}</code>;
    }
    // Handle line-level list items
    if (part.includes('\n')) {
      return part.split('\n').map((line, j) => {
        if (line.startsWith('- ')) {
          return <div key={`${i}-${j}`} className="flex gap-1.5"><span>&#8226;</span><span>{line.slice(2)}</span></div>;
        }
        return j > 0 ? <React.Fragment key={`${i}-${j}`}><br />{line}</React.Fragment> : line;
      });
    }
    return part;
  });
}

function isDue(card: Flashcard): boolean {
  if (!card.nextReviewDate) return true;
  return new Date(card.nextReviewDate) <= new Date();
}

function getNextReviewDate(box: number): string {
  const days = LEITNER_INTERVALS[Math.min(box, 5)];
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

function formatTimer(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export const FlashcardGame: React.FC = () => {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [activeDeckId, setActiveDeckId] = useState<string>('');
  const [activeTab, setActiveTab] = useState('decks');
  const [isStudying, setIsStudying] = useState(false);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [studyCards, setStudyCards] = useState<Flashcard[]>([]);
  const [sessionStats, setSessionStats] = useState({ correct: 0, incorrect: 0 });
  const [sessionTime, setSessionTime] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  // Edit states
  const [newCardFront, setNewCardFront] = useState('');
  const [newCardBack, setNewCardBack] = useState('');
  const [newCardCategory, setNewCardCategory] = useState('General');
  const [newDeckName, setNewDeckName] = useState('');

  // Settings
  const [settings, setSettingsState] = useState<FlashcardSettings>(() => {
    try {
      const saved = localStorage.getItem('flashcard-settings');
      return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
    } catch { return DEFAULT_SETTINGS; }
  });

  const updateSettings = useCallback((patch: Partial<FlashcardSettings>) => {
    setSettingsState(prev => {
      const next = { ...prev, ...patch };
      localStorage.setItem('flashcard-settings', JSON.stringify(next));
      return next;
    });
  }, []);

  // Load decks
  useEffect(() => {
    const saved = localStorage.getItem('flashcard-decks');
    if (saved) {
      const loadedDecks = JSON.parse(saved);
      // Migrate old cards that lack leitnerBox/streak
      const migrated = loadedDecks.map((d: Deck) => ({
        ...d,
        cards: d.cards.map((c: Flashcard) => ({
          leitnerBox: 1,
          streak: 0,
          ...c,
        })),
      }));
      setDecks(migrated);
      if (migrated.length > 0) setActiveDeckId(migrated[0].id);
    } else {
      const sampleDeck: Deck = {
        id: Date.now().toString(),
        name: 'Sample Deck',
        created: new Date(),
        cards: [
          { id: '1', front: 'What is React?', back: 'A JavaScript library for building user interfaces', category: 'Programming', correctCount: 0, incorrectCount: 0, difficulty: 'medium', leitnerBox: 1, streak: 0 },
          { id: '2', front: 'What is TypeScript?', back: 'A typed superset of JavaScript that compiles to plain JavaScript', category: 'Programming', correctCount: 0, incorrectCount: 0, difficulty: 'medium', leitnerBox: 1, streak: 0 },
        ],
      };
      setDecks([sampleDeck]);
      setActiveDeckId(sampleDeck.id);
    }
  }, []);

  // Save decks
  useEffect(() => {
    if (decks.length > 0) {
      localStorage.setItem('flashcard-decks', JSON.stringify(decks));
    }
  }, [decks]);

  // Session timer
  useEffect(() => {
    if (isStudying && settings.sessionTimer) {
      setSessionTime(0);
      timerRef.current = setInterval(() => setSessionTime(t => t + 1), 1000);
      return () => clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isStudying, settings.sessionTimer]);

  const activeDeck = decks.find(d => d.id === activeDeckId);

  const createDeck = () => {
    if (!newDeckName.trim()) return;
    const newDeck: Deck = { id: Date.now().toString(), name: newDeckName, cards: [], created: new Date() };
    setDecks([...decks, newDeck]);
    setActiveDeckId(newDeck.id);
    setNewDeckName('');
  };

  const deleteDeck = (id: string) => {
    if (decks.length === 1) return;
    const newDecks = decks.filter(d => d.id !== id);
    setDecks(newDecks);
    if (activeDeckId === id) setActiveDeckId(newDecks[0].id);
  };

  const addCard = () => {
    if (!newCardFront.trim() || !newCardBack.trim() || !activeDeck) return;
    const newCard: Flashcard = {
      id: Date.now().toString(), front: newCardFront, back: newCardBack,
      category: newCardCategory, correctCount: 0, incorrectCount: 0,
      difficulty: 'medium', leitnerBox: 1, streak: 0,
    };
    setDecks(decks.map(d => d.id === activeDeckId ? { ...d, cards: [...d.cards, newCard] } : d));
    setNewCardFront('');
    setNewCardBack('');
  };

  const deleteCard = (cardId: string) => {
    setDecks(decks.map(d => d.id === activeDeckId ? { ...d, cards: d.cards.filter(c => c.id !== cardId) } : d));
  };

  const updateCard = (cardId: string, updates: Partial<Flashcard>) => {
    setDecks(decks.map(d =>
      d.id === activeDeckId
        ? { ...d, cards: d.cards.map(c => c.id === cardId ? { ...c, ...updates } : c) }
        : d
    ));
  };

  const startStudySession = () => {
    if (!activeDeck || activeDeck.cards.length === 0) return;

    let sorted: Flashcard[];
    if (settings.srsEnabled) {
      // SRS: prioritize due cards from lower boxes
      const due = activeDeck.cards.filter(c => isDue(c));
      const notDue = activeDeck.cards.filter(c => !isDue(c));
      due.sort((a, b) => a.leitnerBox - b.leitnerBox || (a.incorrectCount - a.correctCount) - (b.incorrectCount - b.correctCount));
      sorted = due.length > 0 ? due : notDue.sort((a, b) => a.leitnerBox - b.leitnerBox);
    } else {
      sorted = [...activeDeck.cards].sort((a, b) => (b.incorrectCount - b.correctCount) - (a.incorrectCount - a.correctCount));
    }

    setStudyCards(sorted);
    setCurrentCardIndex(0);
    setIsFlipped(false);
    setIsStudying(true);
    setSessionStats({ correct: 0, incorrect: 0 });
  };

  const handleAnswer = useCallback((correct: boolean) => {
    const currentCard = studyCards[currentCardIndex];
    if (!currentCard) return;

    const srsUpdates: Partial<Flashcard> = {};
    if (settings.srsEnabled) {
      if (correct) {
        const newBox = Math.min(currentCard.leitnerBox + 1, 5);
        srsUpdates.leitnerBox = newBox;
        srsUpdates.streak = currentCard.streak + 1;
        srsUpdates.nextReviewDate = getNextReviewDate(newBox);
      } else {
        srsUpdates.leitnerBox = 1;
        srsUpdates.streak = 0;
        srsUpdates.nextReviewDate = getNextReviewDate(1);
      }
    }

    updateCard(currentCard.id, {
      correctCount: correct ? currentCard.correctCount + 1 : currentCard.correctCount,
      incorrectCount: !correct ? currentCard.incorrectCount + 1 : currentCard.incorrectCount,
      lastReviewed: new Date().toISOString(),
      difficulty: correct
        ? (currentCard.difficulty === 'hard' ? 'medium' : 'easy')
        : (currentCard.difficulty === 'easy' ? 'medium' : 'hard'),
      ...srsUpdates,
    });

    setSessionStats(prev => ({
      correct: correct ? prev.correct + 1 : prev.correct,
      incorrect: !correct ? prev.incorrect + 1 : prev.incorrect,
    }));

    if (currentCardIndex < studyCards.length - 1) {
      setCurrentCardIndex(i => i + 1);
      setIsFlipped(false);
    } else {
      setIsStudying(false);
    }
  }, [currentCardIndex, studyCards, settings.srsEnabled]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!isStudying || !settings.keyboardShortcuts) return;

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        if (!isFlipped) {
          setIsFlipped(true);
        }
      } else if (isFlipped) {
        if (e.key === 'ArrowRight' || e.key === '1') {
          e.preventDefault();
          handleAnswer(true);
        } else if (e.key === 'ArrowLeft' || e.key === '2') {
          e.preventDefault();
          handleAnswer(false);
        }
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isStudying, isFlipped, settings.keyboardShortcuts, handleAnswer]);

  const exportDeck = () => {
    if (!activeDeck) return;
    const json = JSON.stringify(activeDeck, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeDeck.name}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importDeck = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          try {
            const deck = JSON.parse(ev.target?.result as string);
            deck.id = Date.now().toString();
            // Migrate imported cards
            deck.cards = deck.cards.map((c: Flashcard) => ({ leitnerBox: 1, streak: 0, ...c }));
            setDecks([...decks, deck]);
            setActiveDeckId(deck.id);
          } catch (error) {
            console.error('Error importing deck:', error);
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const getDeckStats = (deck: Deck) => {
    const total = deck.cards.length;
    const totalCorrect = deck.cards.reduce((sum, c) => sum + c.correctCount, 0);
    const totalIncorrect = deck.cards.reduce((sum, c) => sum + c.incorrectCount, 0);
    const accuracy = totalCorrect + totalIncorrect > 0
      ? Math.round((totalCorrect / (totalCorrect + totalIncorrect)) * 100)
      : 0;
    const dueCount = deck.cards.filter(c => isDue(c)).length;
    return { total, totalCorrect, totalIncorrect, accuracy, dueCount };
  };

  // ---- STUDY MODE ----
  if (isStudying && studyCards.length > 0) {
    const currentCard = studyCards[currentCardIndex];
    const progress = ((currentCardIndex + 1) / studyCards.length) * 100;

    return (
      <div className="h-full w-full bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 flex flex-col p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold dark:text-white">Study Session</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Card {currentCardIndex + 1} of {studyCards.length}
              {settings.sessionTimer && <span className="ml-3 font-mono"><Timer className="inline h-3.5 w-3.5 mr-1" />{formatTimer(sessionTime)}</span>}
            </p>
          </div>
          <Button onClick={() => setIsStudying(false)} variant="outline">Exit Session</Button>
        </div>

        <div className="mb-6">
          <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center mb-4">
          <div onClick={() => !isFlipped && setIsFlipped(true)} className="w-full max-w-2xl aspect-video cursor-pointer perspective-1000">
            <div className={`relative w-full h-full transition-transform duration-500 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
              <Card className={`absolute w-full h-full p-12 flex flex-col items-center justify-center backface-hidden ${isFlipped ? 'invisible' : ''}`}>
                {settings.srsEnabled && (
                  <div className="absolute top-3 right-3 flex items-center gap-1.5 text-xs text-gray-400">
                    <Box className="h-3 w-3" /> Box {currentCard.leitnerBox}
                    {currentCard.streak > 0 && <span className="text-orange-500 ml-1">&#x1f525;{currentCard.streak}</span>}
                  </div>
                )}
                <div className="text-sm text-gray-500 dark:text-gray-400 mb-4">Question</div>
                <div className="text-3xl font-bold text-center dark:text-white">{renderMarkdown(currentCard.front, settings.markdownEnabled)}</div>
                <div className="mt-8 text-sm text-gray-500 dark:text-gray-400">Click to reveal answer</div>
              </Card>
              <Card className={`absolute w-full h-full p-12 flex flex-col items-center justify-center backface-hidden rotate-y-180 ${!isFlipped ? 'invisible' : ''}`}>
                <div className="text-sm text-gray-500 dark:text-gray-400 mb-4">Answer</div>
                <div className="text-2xl text-center dark:text-white mb-8">{renderMarkdown(currentCard.back, settings.markdownEnabled)}</div>
                <div className="flex gap-4">
                  <Button onClick={() => handleAnswer(false)} variant="outline" className="text-red-500 border-red-500">
                    <X className="h-5 w-5 mr-2" /> Incorrect
                  </Button>
                  <Button onClick={() => handleAnswer(true)} className="bg-green-500 hover:bg-green-600">
                    <Check className="h-5 w-5 mr-2" /> Correct
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        </div>

        {/* Keyboard shortcuts hint */}
        {settings.keyboardShortcuts && (
          <div className="flex items-center justify-center gap-4 text-xs text-gray-500 dark:text-gray-400 mb-4">
            <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-[10px] font-mono">Space</kbd> Flip</span>
            <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-[10px] font-mono">&rarr;</kbd> Correct</span>
            <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-[10px] font-mono">&larr;</kbd> Incorrect</span>
          </div>
        )}

        <div className="grid grid-cols-3 gap-4">
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{sessionStats.correct}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Correct</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{sessionStats.incorrect}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Incorrect</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {sessionStats.correct + sessionStats.incorrect > 0
                ? Math.round((sessionStats.correct / (sessionStats.correct + sessionStats.incorrect)) * 100)
                : 0}%
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Accuracy</div>
          </Card>
        </div>
      </div>
    );
  }

  // ---- MAIN VIEW ----
  return (
    <div className="h-full w-full bg-white dark:bg-gray-900 flex flex-col">
      <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
        <div className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-purple-500" />
          <h2 className="font-semibold dark:text-white">Flashcard Study</h2>
        </div>
        <div className="flex gap-2">
          <Button onClick={importDeck} size="sm" variant="outline"><Upload className="h-4 w-4 mr-2" />Import</Button>
          <Button onClick={exportDeck} size="sm" variant="outline" disabled={!activeDeck}><Download className="h-4 w-4 mr-2" />Export</Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
        <TabsList className="mx-4 mt-2">
          <TabsTrigger value="decks">Decks ({decks.length})</TabsTrigger>
          <TabsTrigger value="cards">Cards ({activeDeck?.cards.length || 0})</TabsTrigger>
          <TabsTrigger value="stats">Statistics</TabsTrigger>
          <TabsTrigger value="settings"><Settings className="h-3.5 w-3.5 mr-1" />Settings</TabsTrigger>
        </TabsList>

        {/* Decks Tab */}
        <TabsContent value="decks" className="flex-1 p-4 overflow-auto">
          <div className="mb-4 flex gap-2">
            <input
              type="text"
              value={newDeckName}
              onChange={(e) => setNewDeckName(e.target.value)}
              placeholder="New deck name..."
              className="flex-1 px-3 py-2 border rounded dark:bg-gray-800 dark:border-gray-700 dark:text-white"
              onKeyDown={(e) => e.key === 'Enter' && createDeck()}
            />
            <Button onClick={createDeck}><Plus className="h-4 w-4 mr-2" />Create Deck</Button>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {decks.map(deck => {
              const stats = getDeckStats(deck);
              return (
                <Card
                  key={deck.id}
                  className={`p-4 cursor-pointer transition-all ${activeDeckId === deck.id ? 'border-2 border-purple-500 shadow-lg' : 'hover:shadow-md'}`}
                  onClick={() => setActiveDeckId(deck.id)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Folder className="h-5 w-5 text-purple-500" />
                      <h3 className="font-bold dark:text-white">{deck.name}</h3>
                    </div>
                    <Button onClick={(e) => { e.stopPropagation(); deleteDeck(deck.id); }} size="sm" variant="ghost" className="text-red-500" disabled={decks.length === 1}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">Cards:</span><span className="font-semibold dark:text-white">{stats.total}</span></div>
                    <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">Accuracy:</span><span className="font-semibold dark:text-white">{stats.accuracy}%</span></div>
                    {settings.srsEnabled && (
                      <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">Due:</span><span className="font-semibold text-orange-500">{stats.dueCount}</span></div>
                    )}
                  </div>
                  {activeDeckId === deck.id && deck.cards.length > 0 && (
                    <Button onClick={startStudySession} className="w-full mt-4"><Play className="h-4 w-4 mr-2" />Start Studying</Button>
                  )}
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Cards Tab */}
        <TabsContent value="cards" className="flex-1 p-4 overflow-auto">
          {activeDeck && (
            <>
              <Card className="p-4 mb-4">
                <h3 className="font-bold mb-3 dark:text-white">Add New Card</h3>
                <div className="space-y-3">
                  <input type="text" value={newCardCategory} onChange={(e) => setNewCardCategory(e.target.value)} placeholder="Category (e.g., Programming, Math)" className="w-full px-3 py-2 border rounded dark:bg-gray-800 dark:border-gray-700 dark:text-white" />
                  <textarea value={newCardFront} onChange={(e) => setNewCardFront(e.target.value)} placeholder="Front (Question)" className="w-full px-3 py-2 border rounded dark:bg-gray-800 dark:border-gray-700 dark:text-white" rows={2} />
                  <textarea value={newCardBack} onChange={(e) => setNewCardBack(e.target.value)} placeholder="Back (Answer)" className="w-full px-3 py-2 border rounded dark:bg-gray-800 dark:border-gray-700 dark:text-white" rows={2} />
                  {settings.markdownEnabled && (
                    <p className="text-xs text-gray-400">Supports **bold** and `code` formatting</p>
                  )}
                  <Button onClick={addCard} className="w-full"><Plus className="h-4 w-4 mr-2" />Add Card</Button>
                </div>
              </Card>

              <div className="space-y-3">
                {activeDeck.cards.map(card => (
                  <Card key={card.id} className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <span className="text-xs px-2 py-1 rounded bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300">{card.category}</span>
                          <span className={`text-xs px-2 py-1 rounded ${
                            card.difficulty === 'easy' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' :
                            card.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300' :
                            'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                          }`}>{card.difficulty}</span>
                          {settings.srsEnabled && (
                            <span className="text-xs px-2 py-1 rounded bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 flex items-center gap-1">
                              <Box className="h-3 w-3" /> {card.leitnerBox}
                              {card.streak > 0 && <span className="text-orange-500">&#x1f525;{card.streak}</span>}
                            </span>
                          )}
                        </div>
                        <div className="font-semibold mb-1 dark:text-white">{card.front}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">{card.back}</div>
                        <div className="flex gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                          <span>&#10003; {card.correctCount}</span>
                          <span>&#10007; {card.incorrectCount}</span>
                          {settings.srsEnabled && !isDue(card) && card.nextReviewDate && (
                            <span className="text-blue-500">Due: {new Date(card.nextReviewDate).toLocaleDateString()}</span>
                          )}
                          {settings.srsEnabled && isDue(card) && (
                            <span className="text-orange-500 font-medium">Due now</span>
                          )}
                        </div>
                      </div>
                      <Button onClick={() => deleteCard(card.id)} size="sm" variant="ghost" className="text-red-500"><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </Card>
                ))}
              </div>
            </>
          )}
        </TabsContent>

        {/* Stats Tab */}
        <TabsContent value="stats" className="flex-1 p-6 overflow-auto">
          {activeDeck && (
            <div className="max-w-4xl mx-auto space-y-6">
              <h3 className="text-2xl font-bold dark:text-white">{activeDeck.name} Statistics</h3>

              <div className="grid md:grid-cols-4 gap-4">
                {(() => {
                  const stats = getDeckStats(activeDeck);
                  return (
                    <>
                      <Card className="p-4 text-center">
                        <div className="text-3xl font-bold text-purple-600">{stats.total}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Total Cards</div>
                      </Card>
                      <Card className="p-4 text-center">
                        <div className="text-3xl font-bold text-green-600">{stats.totalCorrect}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Correct</div>
                      </Card>
                      <Card className="p-4 text-center">
                        <div className="text-3xl font-bold text-red-600">{stats.totalIncorrect}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Incorrect</div>
                      </Card>
                      <Card className="p-4 text-center">
                        <div className="text-3xl font-bold text-blue-600">{stats.accuracy}%</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Accuracy</div>
                      </Card>
                    </>
                  );
                })()}
              </div>

              <Card className="p-6">
                <h4 className="font-bold mb-4 dark:text-white">Cards by Difficulty</h4>
                <div className="space-y-3">
                  {(['easy', 'medium', 'hard'] as const).map(diff => {
                    const count = activeDeck.cards.filter(c => c.difficulty === diff).length;
                    const percentage = activeDeck.cards.length > 0 ? (count / activeDeck.cards.length) * 100 : 0;
                    return (
                      <div key={diff}>
                        <div className="flex justify-between mb-1 text-sm">
                          <span className="capitalize dark:text-white">{diff}</span>
                          <span className="dark:text-gray-400">{count} cards ({percentage.toFixed(0)}%)</span>
                        </div>
                        <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div className={`h-full ${diff === 'easy' ? 'bg-green-500' : diff === 'medium' ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${percentage}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>

              {settings.srsEnabled && (
                <Card className="p-6">
                  <h4 className="font-bold mb-4 dark:text-white">Leitner Box Distribution</h4>
                  <div className="space-y-3">
                    {[1, 2, 3, 4, 5].map(box => {
                      const count = activeDeck.cards.filter(c => c.leitnerBox === box).length;
                      const percentage = activeDeck.cards.length > 0 ? (count / activeDeck.cards.length) * 100 : 0;
                      const colors = ['', 'bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-blue-500', 'bg-green-500'];
                      const labels = ['', 'New / Reset', 'Learning', 'Reviewing', 'Familiar', 'Mastered'];
                      return (
                        <div key={box}>
                          <div className="flex justify-between mb-1 text-sm">
                            <span className="dark:text-white">Box {box} <span className="text-xs text-gray-400">({labels[box]})</span></span>
                            <span className="dark:text-gray-400">{count} cards ({percentage.toFixed(0)}%)</span>
                          </div>
                          <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div className={`h-full ${colors[box]}`} style={{ width: `${percentage}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
                    <p>Review intervals: Box 1 = 1 day, Box 2 = 3 days, Box 3 = 7 days, Box 4 = 14 days, Box 5 = 30 days</p>
                  </div>
                </Card>
              )}
            </div>
          )}
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="flex-1 p-6 overflow-auto">
          <div className="max-w-2xl mx-auto space-y-6">
            <h3 className="text-2xl font-bold dark:text-white">Settings</h3>

            <Card className="p-6 space-y-5">
              {([
                { key: 'keyboardShortcuts' as const, label: 'Keyboard Shortcuts', desc: 'Space to flip, Arrow keys to answer', icon: Keyboard },
                { key: 'srsEnabled' as const, label: 'Spaced Repetition (SRS)', desc: 'Leitner Box system with scheduled review intervals', icon: Box },
                { key: 'markdownEnabled' as const, label: 'Markdown Formatting', desc: 'Render **bold** and `code` on cards', icon: BookOpen },
                { key: 'sessionTimer' as const, label: 'Session Timer', desc: 'Show elapsed time during study sessions', icon: Timer },
                { key: 'autoAdvance' as const, label: 'Auto-Advance', desc: 'Automatically show next card after answering', icon: ArrowRight },
              ]).map(({ key, label, desc, icon: Icon }) => (
                <div key={key} className="flex items-center justify-between">
                  <div className="flex items-start gap-3">
                    <Icon className="h-5 w-5 text-purple-500 mt-0.5 shrink-0" />
                    <div>
                      <p className="font-medium dark:text-white">{label}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{desc}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => updateSettings({ [key]: !settings[key] })}
                    className={`relative w-11 h-6 rounded-full transition-colors ${settings[key] ? 'bg-purple-500' : 'bg-gray-300 dark:bg-gray-600'}`}
                  >
                    <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${settings[key] ? 'translate-x-5' : ''}`} />
                  </button>
                </div>
              ))}
            </Card>

            <Card className="p-6">
              <h4 className="font-bold mb-3 dark:text-white">Keyboard Shortcuts Reference</h4>
              <div className="space-y-2 text-sm">
                {[
                  ['Space', 'Flip card'],
                  ['Arrow Right / 1', 'Mark as correct'],
                  ['Arrow Left / 2', 'Mark as incorrect'],
                ].map(([key, action]) => (
                  <div key={key} className="flex items-center gap-3">
                    <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs font-mono min-w-[80px] text-center dark:text-white">{key}</kbd>
                    <span className="text-gray-600 dark:text-gray-400">{action}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
