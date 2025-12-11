import React, { useState, useEffect } from 'react';
import { Trophy, Calendar, Clock, Flag, User, TrendingUp, RefreshCw } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Driver {
  position: number;
  name: string;
  team: string;
  points: number;
  wins: number;
}

interface Constructor {
  position: number;
  name: string;
  points: number;
  color: string;
}

interface Race {
  round: number;
  name: string;
  circuit: string;
  date: string;
  time: string;
  country: string;
}

export const F1App: React.FC = () => {
  const [selectedTab, setSelectedTab] = useState('standings');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [driversStandings, setDriversStandings] = useState<Driver[]>([]);
  const [constructorsStandings, setConstructorsStandings] = useState<Constructor[]>([]);
  const [upcomingRaces, setUpcomingRaces] = useState<Race[]>([]);

  // Fetch F1 data from Ergast API
  useEffect(() => {
    const fetchF1Data = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Fetch current season driver standings
        const driversResponse = await fetch('https://ergast.com/api/f1/current/driverStandings.json');
        const driversData = await driversResponse.json();
        
        const drivers = driversData.MRData.StandingsTable.StandingsLists[0]?.DriverStandings.map((standing: any) => ({
          position: parseInt(standing.position),
          name: `${standing.Driver.givenName} ${standing.Driver.familyName}`,
          team: standing.Constructors[0]?.name || 'Unknown',
          points: parseInt(standing.points),
          wins: parseInt(standing.wins),
        })) || [];
        
        setDriversStandings(drivers);

        // Fetch constructor standings
        const constructorsResponse = await fetch('https://ergast.com/api/f1/current/constructorStandings.json');
        const constructorsData = await constructorsResponse.json();
        
        const teamColors: { [key: string]: string } = {
          'Red Bull': '#0600EF',
          'Mercedes': '#00D2BE',
          'Ferrari': '#DC0000',
          'McLaren': '#FF8700',
          'Aston Martin': '#006F62',
          'Alpine': '#0090FF',
          'Williams': '#005AFF',
          'AlphaTauri': '#2B4562',
          'RB': '#2B4562',
          'Alfa Romeo': '#900000',
          'Sauber': '#900000',
          'Haas': '#FFFFFF',
        };
        
        const constructors = constructorsData.MRData.StandingsTable.StandingsLists[0]?.ConstructorStandings.map((standing: any) => ({
          position: parseInt(standing.position),
          name: standing.Constructor.name,
          points: parseInt(standing.points),
          color: teamColors[standing.Constructor.name] || '#888888',
        })) || [];
        
        setConstructorsStandings(constructors);

        // Fetch race schedule
        const scheduleResponse = await fetch('https://ergast.com/api/f1/current.json');
        const scheduleData = await scheduleResponse.json();
        
        const countryFlags: { [key: string]: string } = {
          'Bahrain': '🇧🇭', 'Saudi Arabia': '🇸🇦', 'Australia': '🇦🇺', 'Japan': '🇯🇵',
          'China': '🇨🇳', 'USA': '🇺🇸', 'Italy': '🇮🇹', 'Monaco': '🇲🇨', 'Spain': '🇪🇸',
          'Canada': '🇨🇦', 'Austria': '🇦🇹', 'UK': '🇬🇧', 'Hungary': '🇭🇺', 'Belgium': '🇧🇪',
          'Netherlands': '🇳🇱', 'Singapore': '🇸🇬', 'Mexico': '🇲🇽', 'Brazil': '🇧🇷',
          'UAE': '🇦🇪', 'Azerbaijan': '🇦🇿', 'Miami': '🇺🇸', 'Las Vegas': '🇺🇸',
        };
        
        const races = scheduleData.MRData.RaceTable.Races.slice(0, 5).map((race: any) => ({
          round: parseInt(race.round),
          name: race.raceName,
          circuit: race.Circuit.circuitName,
          date: new Date(race.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          time: race.time ? race.time.substring(0, 5) : 'TBA',
          country: countryFlags[race.Circuit.Location.country] || '🏁',
        }));
        
        setUpcomingRaces(races);
        
      } catch (err) {
        console.error('Error fetching F1 data:', err);
        setError('Failed to load F1 data. Using demo data.');
        
        // Fallback to demo data
        setDriversStandings([
          { position: 1, name: 'Max Verstappen', team: 'Red Bull Racing', points: 575, wins: 19 },
          { position: 2, name: 'Sergio Perez', team: 'Red Bull Racing', points: 285, wins: 2 },
          { position: 3, name: 'Lewis Hamilton', team: 'Mercedes', points: 234, wins: 0 },
        ]);
        
        setConstructorsStandings([
          { position: 1, name: 'Red Bull Racing', points: 860, color: '#0600EF' },
          { position: 2, name: 'Mercedes', points: 409, color: '#00D2BE' },
          { position: 3, name: 'Ferrari', points: 406, color: '#DC0000' },
        ]);
        
        setUpcomingRaces([
          { round: 1, name: 'Bahrain Grand Prix', circuit: 'Bahrain International Circuit', date: 'Mar 2, 2024', time: '15:00', country: '🇧🇭' },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchF1Data();
  }, []);

  const getPositionColor = (position: number) => {
    if (position === 1) return 'bg-yellow-400 text-yellow-900';
    if (position === 2) return 'bg-gray-300 text-gray-900';
    if (position === 3) return 'bg-orange-400 text-orange-900';
    return 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-red-50 to-gray-50 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-red-800 rounded-lg flex items-center justify-center">
              <Flag className="text-white" size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Formula 1</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {loading ? 'Loading...' : 'Live Data from Ergast API'}
              </p>
            </div>
          </div>
          <button
            onClick={() => window.location.reload()}
            disabled={loading}
            className="px-3 py-2 text-sm bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-lg transition-colors flex items-center gap-2"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* Content */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="flex-1 flex flex-col">
        <TabsList className="mx-4 mt-4">
          <TabsTrigger value="standings" className="flex items-center gap-2">
            <Trophy size={16} />
            Drivers
          </TabsTrigger>
          <TabsTrigger value="constructors" className="flex items-center gap-2">
            <TrendingUp size={16} />
            Constructors
          </TabsTrigger>
          <TabsTrigger value="calendar" className="flex items-center gap-2">
            <Calendar size={16} />
            Calendar
          </TabsTrigger>
        </TabsList>

        {/* Loading State */}
        {loading && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Loading F1 data...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="mx-4 mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <p className="text-yellow-800 dark:text-yellow-200 text-sm">{error}</p>
          </div>
        )}

        {/* Drivers Standings */}
        {!loading && <TabsContent value="standings" className="flex-1 p-4 overflow-auto">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-red-600 to-red-800 p-4">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <Trophy size={20} />
                  Drivers Championship
                </h3>
              </div>
              
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {driversStandings.map((driver) => (
                  <div
                    key={driver.position}
                    className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${getPositionColor(driver.position)}`}>
                        {driver.position}
                      </div>
                      
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900 dark:text-gray-100">
                          {driver.name}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {driver.team}
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                          {driver.points}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          {driver.wins} {driver.wins === 1 ? 'win' : 'wins'}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>}

        {/* Constructors Standings */}
        {!loading && <TabsContent value="constructors" className="flex-1 p-4 overflow-auto">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-red-600 to-red-800 p-4">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <TrendingUp size={20} />
                  Constructors Championship
                </h3>
              </div>
              
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {constructorsStandings.map((constructor) => (
                  <div
                    key={constructor.position}
                    className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${getPositionColor(constructor.position)}`}>
                        {constructor.position}
                      </div>
                      
                      <div
                        className="w-1 h-12 rounded"
                        style={{ backgroundColor: constructor.color }}
                      />
                      
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900 dark:text-gray-100">
                          {constructor.name}
                        </div>
                      </div>
                      
                      <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        {constructor.points}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>}

        {/* Race Calendar */}
        {!loading && <TabsContent value="calendar" className="flex-1 p-4 overflow-auto">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-red-600 to-red-800 p-4">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <Calendar size={20} />
                  2024 Race Calendar
                </h3>
              </div>
              
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {upcomingRaces.map((race) => (
                  <div
                    key={race.round}
                    className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-start gap-4">
                      <div className="text-3xl">
                        {race.country}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="px-2 py-1 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 text-xs font-semibold rounded">
                            Round {race.round}
                          </span>
                          <span className="font-bold text-gray-900 dark:text-gray-100">
                            {race.name}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          {race.circuit}
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-1 text-gray-700 dark:text-gray-300">
                            <Calendar size={14} />
                            {race.date}
                          </div>
                          <div className="flex items-center gap-1 text-gray-700 dark:text-gray-300">
                            <Clock size={14} />
                            {race.time} Local
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>Note:</strong> This is demo data for the 2024 season. In production, this would connect to a live F1 API for real-time standings and race information.
              </p>
            </div>
          </div>
        </TabsContent>}
      </Tabs>
    </div>
  );
};
