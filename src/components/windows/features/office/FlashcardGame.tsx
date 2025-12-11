import React, { useState, useEffect } from 'react';
import { 
  Plus, Trash2, Edit, Play, RotateCcw, Check, X, 
  BookOpen, Brain, TrendingUp, Download, Upload, Folder
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Flashcard {
  id: string;
  front: string;
  back: string;
  category: string;
  lastReviewed?: Date;
  correctCount: number;
  incorrectCount: number;
  difficulty: 'easy' | 'medium' | 'hard';
}

interface Deck {
  id: string;
  name: string;
  cards: Flashcard[];
  created: Date;
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
  
  // Edit states
  const [editingCard, setEditingCard] = useState<Flashcard | null>(null);
  const [newCardFront, setNewCardFront] = useState('');
  const [newCardBack, setNewCardBack] = useState('');
  const [newCardCategory, setNewCardCategory] = useState('General');
  const [newDeckName, setNewDeckName] = useState('');

  // Load decks from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('flashcard-decks');
    if (saved) {
      const loadedDecks = JSON.parse(saved);
      setDecks(loadedDecks);
      if (loadedDecks.length > 0) {
        setActiveDeckId(loadedDecks[0].id);
      }
    } else {
      // Create sample deck
      const sampleDeck: Deck = {
        id: Date.now().toString(),
        name: 'Sample Deck',
        created: new Date(),
        cards: [
          {
            id: '1',
            front: 'What is React?',
            back: 'A JavaScript library for building user interfaces',
            category: 'Programming',
            correctCount: 0,
            incorrectCount: 0,
            difficulty: 'medium'
          },
          {
            id: '2',
            front: 'What is TypeScript?',
            back: 'A typed superset of JavaScript that compiles to plain JavaScript',
            category: 'Programming',
            correctCount: 0,
            incorrectCount: 0,
            difficulty: 'medium'
          }
        ]
      };
      setDecks([sampleDeck]);
      setActiveDeckId(sampleDeck.id);
    }
  }, []);

  // Save decks to localStorage
  useEffect(() => {
    if (decks.length > 0) {
      localStorage.setItem('flashcard-decks', JSON.stringify(decks));
    }
  }, [decks]);

  const activeDeck = decks.find(d => d.id === activeDeckId);

  const createDeck = () => {
    if (!newDeckName.trim()) return;
    
    const newDeck: Deck = {
      id: Date.now().toString(),
      name: newDeckName,
      cards: [],
      created: new Date()
    };
    setDecks([...decks, newDeck]);
    setActiveDeckId(newDeck.id);
    setNewDeckName('');
  };

  const deleteDeck = (id: string) => {
    if (decks.length === 1) return;
    const newDecks = decks.filter(d => d.id !== id);
    setDecks(newDecks);
    if (activeDeckId === id) {
      setActiveDeckId(newDecks[0].id);
    }
  };

  const addCard = () => {
    if (!newCardFront.trim() || !newCardBack.trim() || !activeDeck) return;

    const newCard: Flashcard = {
      id: Date.now().toString(),
      front: newCardFront,
      back: newCardBack,
      category: newCardCategory,
      correctCount: 0,
      incorrectCount: 0,
      difficulty: 'medium'
    };

    setDecks(decks.map(d => 
      d.id === activeDeckId 
        ? { ...d, cards: [...d.cards, newCard] }
        : d
    ));

    setNewCardFront('');
    setNewCardBack('');
  };

  const deleteCard = (cardId: string) => {
    setDecks(decks.map(d => 
      d.id === activeDeckId 
        ? { ...d, cards: d.cards.filter(c => c.id !== cardId) }
        : d
    ));
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
    
    // Spaced repetition: prioritize cards with more incorrect answers
    const sortedCards = [...activeDeck.cards].sort((a, b) => {
      const aScore = a.incorrectCount - a.correctCount;
      const bScore = b.incorrectCount - b.correctCount;
      return bScore - aScore;
    });

    setStudyCards(sortedCards);
    setCurrentCardIndex(0);
    setIsFlipped(false);
    setIsStudying(true);
    setSessionStats({ correct: 0, incorrect: 0 });
  };

  const handleAnswer = (correct: boolean) => {
    const currentCard = studyCards[currentCardIndex];
    
    updateCard(currentCard.id, {
      correctCount: correct ? currentCard.correctCount + 1 : currentCard.correctCount,
      incorrectCount: !correct ? currentCard.incorrectCount + 1 : currentCard.incorrectCount,
      lastReviewed: new Date(),
      difficulty: correct ? 
        (currentCard.difficulty === 'hard' ? 'medium' : currentCard.difficulty === 'medium' ? 'easy' : 'easy') :
        (currentCard.difficulty === 'easy' ? 'medium' : currentCard.difficulty === 'medium' ? 'hard' : 'hard')
    });

    setSessionStats(prev => ({
      correct: correct ? prev.correct + 1 : prev.correct,
      incorrect: !correct ? prev.incorrect + 1 : prev.incorrect
    }));

    if (currentCardIndex < studyCards.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1);
      setIsFlipped(false);
    } else {
      setIsStudying(false);
    }
  };

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
        reader.onload = (e) => {
          try {
            const deck = JSON.parse(e.target?.result as string);
            deck.id = Date.now().toString();
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
    return { total, totalCorrect, totalIncorrect, accuracy };
  };

  if (isStudying && studyCards.length > 0) {
    const currentCard = studyCards[currentCardIndex];
    const progress = ((currentCardIndex + 1) / studyCards.length) * 100;

    return (
      <div className="h-full w-full bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 flex flex-col p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold dark:text-white">Study Session</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Card {currentCardIndex + 1} of {studyCards.length}
            </p>
          </div>
          <Button onClick={() => setIsStudying(false)} variant="outline">
            Exit Session
          </Button>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Flashcard */}
        <div className="flex-1 flex items-center justify-center mb-6">
          <div
            onClick={() => setIsFlipped(!isFlipped)}
            className="w-full max-w-2xl aspect-video cursor-pointer perspective-1000"
          >
            <div className={`relative w-full h-full transition-transform duration-500 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
              {/* Front */}
              <Card className={`absolute w-full h-full p-12 flex flex-col items-center justify-center backface-hidden ${isFlipped ? 'invisible' : ''}`}>
                <div className="text-sm text-gray-500 dark:text-gray-400 mb-4">Question</div>
                <div className="text-3xl font-bold text-center dark:text-white">{currentCard.front}</div>
                <div className="mt-8 text-sm text-gray-500 dark:text-gray-400">Click to reveal answer</div>
              </Card>

              {/* Back */}
              <Card className={`absolute w-full h-full p-12 flex flex-col items-center justify-center backface-hidden rotate-y-180 ${!isFlipped ? 'invisible' : ''}`}>
                <div className="text-sm text-gray-500 dark:text-gray-400 mb-4">Answer</div>
                <div className="text-2xl text-center dark:text-white mb-8">{currentCard.back}</div>
                <div className="flex gap-4">
                  <Button onClick={() => handleAnswer(false)} variant="outline" className="text-red-500 border-red-500">
                    <X className="h-5 w-5 mr-2" />
                    Incorrect
                  </Button>
                  <Button onClick={() => handleAnswer(true)} className="bg-green-500 hover:bg-green-600">
                    <Check className="h-5 w-5 mr-2" />
                    Correct
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        </div>

        {/* Session Stats */}
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

  return (
    <div className="h-full w-full bg-white dark:bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
        <div className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-purple-500" />
          <h2 className="font-semibold dark:text-white">Flashcard Study</h2>
        </div>
        <div className="flex gap-2">
          <Button onClick={importDeck} size="sm" variant="outline">
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          <Button onClick={exportDeck} size="sm" variant="outline" disabled={!activeDeck}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
        <TabsList className="mx-4 mt-2">
          <TabsTrigger value="decks">Decks ({decks.length})</TabsTrigger>
          <TabsTrigger value="cards">Cards ({activeDeck?.cards.length || 0})</TabsTrigger>
          <TabsTrigger value="stats">Statistics</TabsTrigger>
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
              onKeyPress={(e) => e.key === 'Enter' && createDeck()}
            />
            <Button onClick={createDeck}>
              <Plus className="h-4 w-4 mr-2" />
              Create Deck
            </Button>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {decks.map(deck => {
              const stats = getDeckStats(deck);
              return (
                <Card
                  key={deck.id}
                  className={`p-4 cursor-pointer transition-all ${
                    activeDeckId === deck.id 
                      ? 'border-2 border-purple-500 shadow-lg' 
                      : 'hover:shadow-md'
                  }`}
                  onClick={() => setActiveDeckId(deck.id)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Folder className="h-5 w-5 text-purple-500" />
                      <h3 className="font-bold dark:text-white">{deck.name}</h3>
                    </div>
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteDeck(deck.id);
                      }}
                      size="sm"
                      variant="ghost"
                      className="text-red-500"
                      disabled={decks.length === 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Cards:</span>
                      <span className="font-semibold dark:text-white">{stats.total}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Accuracy:</span>
                      <span className="font-semibold dark:text-white">{stats.accuracy}%</span>
                    </div>
                  </div>

                  {activeDeckId === deck.id && deck.cards.length > 0 && (
                    <Button onClick={startStudySession} className="w-full mt-4">
                      <Play className="h-4 w-4 mr-2" />
                      Start Studying
                    </Button>
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
                  <input
                    type="text"
                    value={newCardCategory}
                    onChange={(e) => setNewCardCategory(e.target.value)}
                    placeholder="Category (e.g., Programming, Math)"
                    className="w-full px-3 py-2 border rounded dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                  />
                  <textarea
                    value={newCardFront}
                    onChange={(e) => setNewCardFront(e.target.value)}
                    placeholder="Front (Question)"
                    className="w-full px-3 py-2 border rounded dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                    rows={2}
                  />
                  <textarea
                    value={newCardBack}
                    onChange={(e) => setNewCardBack(e.target.value)}
                    placeholder="Back (Answer)"
                    className="w-full px-3 py-2 border rounded dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                    rows={2}
                  />
                  <Button onClick={addCard} className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Card
                  </Button>
                </div>
              </Card>

              <div className="space-y-3">
                {activeDeck.cards.map(card => (
                  <Card key={card.id} className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs px-2 py-1 rounded bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300">
                            {card.category}
                          </span>
                          <span className={`text-xs px-2 py-1 rounded ${
                            card.difficulty === 'easy' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' :
                            card.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300' :
                            'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                          }`}>
                            {card.difficulty}
                          </span>
                        </div>
                        <div className="font-semibold mb-1 dark:text-white">{card.front}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">{card.back}</div>
                        <div className="flex gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                          <span>✓ {card.correctCount}</span>
                          <span>✗ {card.incorrectCount}</span>
                        </div>
                      </div>
                      <Button
                        onClick={() => deleteCard(card.id)}
                        size="sm"
                        variant="ghost"
                        className="text-red-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
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
                  {['easy', 'medium', 'hard'].map(diff => {
                    const count = activeDeck.cards.filter(c => c.difficulty === diff).length;
                    const percentage = activeDeck.cards.length > 0 
                      ? (count / activeDeck.cards.length) * 100 
                      : 0;
                    return (
                      <div key={diff}>
                        <div className="flex justify-between mb-1 text-sm">
                          <span className="capitalize dark:text-white">{diff}</span>
                          <span className="dark:text-gray-400">{count} cards ({percentage.toFixed(0)}%)</span>
                        </div>
                        <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${
                              diff === 'easy' ? 'bg-green-500' :
                              diff === 'medium' ? 'bg-yellow-500' :
                              'bg-red-500'
                            }`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
