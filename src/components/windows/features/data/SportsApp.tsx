import React, { useState } from 'react';
import { Trophy, Calendar, Users } from 'lucide-react';

interface Match {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  status: 'live' | 'finished' | 'upcoming';
  time: string;
}

export const SportsApp: React.FC = () => {
  const [sport, setSport] = useState<'football' | 'basketball' | 'cricket'>('football');
  const [matches] = useState<Match[]>([
    { id: '1', homeTeam: 'Man City', awayTeam: 'Liverpool', homeScore: 2, awayScore: 1, status: 'live', time: '67\'' },
    { id: '2', homeTeam: 'Arsenal', awayTeam: 'Chelsea', homeScore: 3, awayScore: 3, status: 'finished', time: 'FT' },
    { id: '3', homeTeam: 'Man Utd', awayTeam: 'Tottenham', homeScore: 0, awayScore: 0, status: 'upcoming', time: '15:00' },
    { id: '4', homeTeam: 'Newcastle', awayTeam: 'Brighton', homeScore: 1, awayScore: 0, status: 'live', time: '45\'' },
  ]);

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      <div className="p-4 bg-white dark:bg-gray-800 border-b dark:border-gray-700">
        <div className="flex items-center gap-2 mb-4">
          <Trophy className="h-6 w-6 text-yellow-500" />
          <h2 className="text-xl font-bold dark:text-white">Sports Live</h2>
        </div>
        
        <div className="flex gap-2">
          {(['football', 'basketball', 'cricket'] as const).map(s => (
            <button
              key={s}
              onClick={() => setSport(s)}
              className={`px-4 py-2 rounded-lg font-semibold capitalize transition-colors ${
                sport === s
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>
      
      <div className="flex-1 overflow-auto p-4">
        <div className="grid gap-3">
          {matches.map(match => (
            <div
              key={match.id}
              className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg"
            >
              <div className="flex items-center justify-between mb-3">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  match.status === 'live'
                    ? 'bg-red-500 text-white animate-pulse'
                    : match.status === 'finished'
                    ? 'bg-gray-500 text-white'
                    : 'bg-blue-500 text-white'
                }`}>
                  {match.status === 'live' ? `LIVE ${match.time}` : match.time}
                </span>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-gray-400" />
                    <span className="font-semibold dark:text-white">{match.homeTeam}</span>
                  </div>
                  <span className="text-2xl font-bold dark:text-white">{match.homeScore}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-gray-400" />
                    <span className="font-semibold dark:text-white">{match.awayTeam}</span>
                  </div>
                  <span className="text-2xl font-bold dark:text-white">{match.awayScore}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
