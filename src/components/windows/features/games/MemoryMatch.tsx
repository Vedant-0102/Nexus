import React, { useState, useEffect } from 'react';
import { RotateCw, Star } from 'lucide-react';

const EMOJIS = ['🎮', '🎯', '🎨', '🎭', '🎪', '🎸', '🎺', '🎻'];

export const MemoryMatch: React.FC = () => {
  const [cards, setCards] = useState<{ id: number; emoji: string; flipped: boolean; matched: boolean }[]>([]);
  const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [matches, setMatches] = useState(0);

  useEffect(() => {
    initGame();
  }, []);

  const initGame = () => {
    const shuffled = [...EMOJIS, ...EMOJIS]
      .sort(() => Math.random() - 0.5)
      .map((emoji, id) => ({ id, emoji, flipped: false, matched: false }));
    setCards(shuffled);
    setFlippedIndices([]);
    setMoves(0);
    setMatches(0);
  };

  const handleCardClick = (index: number) => {
    if (flippedIndices.length === 2 || cards[index].flipped || cards[index].matched) return;

    const newCards = [...cards];
    newCards[index].flipped = true;
    setCards(newCards);

    const newFlipped = [...flippedIndices, index];
    setFlippedIndices(newFlipped);

    if (newFlipped.length === 2) {
      setMoves(prev => prev + 1);
      const [first, second] = newFlipped;
      
      if (cards[first].emoji === cards[second].emoji) {
        newCards[first].matched = true;
        newCards[second].matched = true;
        setCards(newCards);
        setMatches(prev => prev + 1);
        setFlippedIndices([]);
      } else {
        setTimeout(() => {
          newCards[first].flipped = false;
          newCards[second].flipped = false;
          setCards(newCards);
          setFlippedIndices([]);
        }, 1000);
      }
    }
  };

  return (
    <div className="h-full flex flex-col items-center justify-center p-4 bg-gradient-to-br from-pink-100 to-purple-200 dark:from-gray-900 dark:to-gray-800">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold dark:text-white">Memory Match</h2>
          <button onClick={initGame} className="p-2 bg-purple-500 hover:bg-purple-600 text-white rounded">
            <RotateCw className="h-5 w-5" />
          </button>
        </div>
        
        <div className="flex justify-between mb-4 text-lg font-semibold dark:text-white">
          <span>Moves: {moves}</span>
          <span>Matches: {matches}/8</span>
        </div>
        
        <div className="grid grid-cols-4 gap-3">
          {cards.map((card, index) => (
            <div
              key={card.id}
              onClick={() => handleCardClick(index)}
              className={`w-20 h-20 flex items-center justify-center text-4xl rounded-lg cursor-pointer transition-all transform ${
                card.flipped || card.matched
                  ? 'bg-white dark:bg-gray-700 rotate-0'
                  : 'bg-gradient-to-br from-purple-500 to-pink-500 hover:scale-105'
              } ${card.matched ? 'opacity-50' : ''}`}
            >
              {(card.flipped || card.matched) && card.emoji}
            </div>
          ))}
        </div>
        
        {matches === 8 && (
          <div className="mt-4 text-center">
            <p className="text-xl font-bold text-green-500 mb-2 flex items-center justify-center gap-2">
              <Star className="h-6 w-6 fill-current" />
              You Won in {moves} moves!
              <Star className="h-6 w-6 fill-current" />
            </p>
            <button onClick={initGame} className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded">
              Play Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
