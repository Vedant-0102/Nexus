import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Ship, Search, MapPin, Clock, Anchor, Navigation2 } from 'lucide-react';

interface Vessel {
  id: string;
  name: string;
  imo: string;
  type: 'cargo' | 'tanker' | 'passenger' | 'fishing' | 'military';
  origin: string;
  destination: string;
  latitude: number;
  longitude: number;
  speed: number;
  heading: number;
  status: 'underway' | 'anchored' | 'moored' | 'at_sea';
}

const mockVessels: Vessel[] = [
  { id: '1', name: 'EVER GIVEN', imo: 'IMO9811000', type: 'cargo', origin: 'Singapore', destination: 'Rotterdam', latitude: 15.5, longitude: 55.2, speed: 18.5, heading: 315, status: 'underway' },
  { id: '2', name: 'MAERSK ESSEX', imo: 'IMO9632839', type: 'cargo', origin: 'Shanghai', destination: 'Los Angeles', latitude: 35.2, longitude: -150.5, speed: 22.3, heading: 90, status: 'underway' },
  { id: '3', name: 'HARMONY OF SEAS', imo: 'IMO9774500', type: 'passenger', origin: 'Miami', destination: 'Cozumel', latitude: 25.8, longitude: -80.2, speed: 20.1, heading: 180, status: 'underway' },
  { id: '4', name: 'FRONT ALTAIR', imo: 'IMO9268708', type: 'tanker', origin: 'Kuwait', destination: 'Japan', latitude: 25.3, longitude: 60.5, speed: 14.2, heading: 45, status: 'underway' },
  { id: '5', name: 'QUEEN MARY 2', imo: 'IMO9241061', type: 'passenger', origin: 'Southampton', destination: 'New York', latitude: 45.5, longitude: -40.2, speed: 25.5, heading: 270, status: 'underway' },
  { id: '6', name: 'PACIFIC EXPLORER', imo: 'IMO9187887', type: 'fishing', origin: 'Honolulu', destination: 'Honolulu', latitude: 20.5, longitude: -160.3, speed: 8.5, heading: 135, status: 'at_sea' },
];

export const ShipTracker: React.FC = () => {
  const [vessels, setVessels] = useState<Vessel[]>(mockVessels);
  const [selectedVessel, setSelectedVessel] = useState<Vessel | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [lastUpdate, setLastUpdate] = useState(new Date());

  useEffect(() => {
    // Simulate real-time updates
    const interval = setInterval(() => {
      setVessels(prev => prev.map(vessel => ({
        ...vessel,
        latitude: vessel.latitude + (Math.random() - 0.5) * 0.05,
        longitude: vessel.longitude + (Math.random() - 0.5) * 0.05,
        speed: Math.max(0, Math.min(30, vessel.speed + (Math.random() - 0.5) * 2)),
        heading: (vessel.heading + (Math.random() - 0.5) * 5 + 360) % 360,
      })));
      setLastUpdate(new Date());
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const filteredVessels = vessels.filter(vessel => {
    const matchesSearch = vessel.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vessel.imo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vessel.origin.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vessel.destination.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = filterType === 'all' || vessel.type === filterType;
    
    return matchesSearch && matchesType;
  });

  const getVesselColor = (type: string) => {
    switch (type) {
      case 'cargo': return 'text-blue-600';
      case 'tanker': return 'text-orange-600';
      case 'passenger': return 'text-purple-600';
      case 'fishing': return 'text-green-600';
      case 'military': return 'text-red-600';
      default: return 'text-slate-600';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'underway': return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300';
      case 'anchored': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300';
      case 'moored': return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300';
      case 'at_sea': return 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900 dark:text-cyan-300';
      default: return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
    }
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-50 to-cyan-50 dark:from-slate-900 dark:to-slate-800 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Ship className="h-6 w-6 text-cyan-600" />
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Ship Tracker</h2>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
          <Clock className="h-4 w-4" />
          Last update: {lastUpdate.toLocaleTimeString()}
        </div>
      </div>

      <div className="mb-4 flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by vessel name, IMO, or port..."
            className="pl-10"
          />
        </div>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-3 py-2 border rounded-md bg-white dark:bg-slate-800 text-sm"
        >
          <option value="all">All Types</option>
          <option value="cargo">Cargo</option>
          <option value="tanker">Tanker</option>
          <option value="passenger">Passenger</option>
          <option value="fishing">Fishing</option>
          <option value="military">Military</option>
        </select>
      </div>

      <div className="grid grid-cols-3 gap-4 flex-1">
        {/* Map View */}
        <Card className="col-span-2 p-4 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-100 to-blue-100 dark:from-cyan-900/20 dark:to-blue-900/20">
            {/* Ocean grid */}
            <svg className="w-full h-full opacity-10">
              {[...Array(10)].map((_, i) => (
                <React.Fragment key={i}>
                  <line x1="0" y1={`${i * 10}%`} x2="100%" y2={`${i * 10}%`} stroke="currentColor" strokeWidth="1" />
                  <line x1={`${i * 10}%`} y1="0" x2={`${i * 10}%`} y2="100%" stroke="currentColor" strokeWidth="1" />
                </React.Fragment>
              ))}
            </svg>

            {/* Vessel markers */}
            {filteredVessels.map(vessel => {
              const x = ((vessel.longitude + 180) / 360) * 100;
              const y = ((90 - vessel.latitude) / 180) * 100;
              
              return (
                <div
                  key={vessel.id}
                  className="absolute cursor-pointer transform -translate-x-1/2 -translate-y-1/2 group"
                  style={{ left: `${x}%`, top: `${y}%` }}
                  onClick={() => setSelectedVessel(vessel)}
                >
                  <div
                    className={`transition-all ${
                      selectedVessel?.id === vessel.id
                        ? 'scale-150'
                        : 'hover:scale-125'
                    } ${getVesselColor(vessel.type)}`}
                    style={{ transform: `rotate(${vessel.heading}deg)` }}
                  >
                    <Ship className="h-6 w-6" />
                  </div>
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 bg-black/75 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    {vessel.name}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="absolute bottom-4 left-4 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm p-3 rounded-lg shadow-lg">
            <div className="text-xs font-semibold mb-2">Active Vessels</div>
            <div className="text-2xl font-bold text-cyan-600">{vessels.length}</div>
          </div>

          <div className="absolute top-4 right-4 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm p-3 rounded-lg shadow-lg text-xs space-y-1">
            <div className="font-semibold mb-2">Legend</div>
            <div className="flex items-center gap-2"><Ship className="h-3 w-3 text-blue-600" /> Cargo</div>
            <div className="flex items-center gap-2"><Ship className="h-3 w-3 text-orange-600" /> Tanker</div>
            <div className="flex items-center gap-2"><Ship className="h-3 w-3 text-purple-600" /> Passenger</div>
            <div className="flex items-center gap-2"><Ship className="h-3 w-3 text-green-600" /> Fishing</div>
          </div>
        </Card>

        {/* Vessel List */}
        <Card className="p-4 overflow-y-auto">
          <h3 className="font-semibold mb-3">Active Vessels</h3>
          <div className="space-y-2">
            {filteredVessels.map(vessel => (
              <div
                key={vessel.id}
                className={`p-3 rounded-lg cursor-pointer transition-all ${
                  selectedVessel?.id === vessel.id
                    ? 'bg-cyan-100 dark:bg-cyan-900 border-2 border-cyan-500'
                    : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
                onClick={() => setSelectedVessel(vessel)}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Ship className={`h-4 w-4 ${getVesselColor(vessel.type)}`} />
                  <span className="font-semibold text-sm">{vessel.name}</span>
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-400">
                  {vessel.origin} → {vessel.destination}
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <span className={`text-xs px-2 py-0.5 rounded ${getStatusColor(vessel.status)}`}>
                    {vessel.status.replace('_', ' ')}
                  </span>
                  <span className="text-xs text-slate-500">{vessel.speed.toFixed(1)} kn</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Vessel Details */}
      {selectedVessel && (
        <Card className="mt-4 p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-lg">{selectedVessel.name}</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedVessel(null)}
            >
              Close
            </Button>
          </div>
          <div className="grid grid-cols-6 gap-4 text-sm">
            <div>
              <div className="text-slate-600 dark:text-slate-400">IMO Number</div>
              <div className="font-semibold mt-1">{selectedVessel.imo}</div>
            </div>
            <div>
              <div className="text-slate-600 dark:text-slate-400">Type</div>
              <div className="font-semibold mt-1 capitalize">{selectedVessel.type}</div>
            </div>
            <div>
              <div className="text-slate-600 dark:text-slate-400 flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                Origin
              </div>
              <div className="font-semibold mt-1">{selectedVessel.origin}</div>
            </div>
            <div>
              <div className="text-slate-600 dark:text-slate-400 flex items-center gap-1">
                <Anchor className="h-3 w-3" />
                Destination
              </div>
              <div className="font-semibold mt-1">{selectedVessel.destination}</div>
            </div>
            <div>
              <div className="text-slate-600 dark:text-slate-400 flex items-center gap-1">
                <Navigation2 className="h-3 w-3" />
                Speed
              </div>
              <div className="font-semibold mt-1">{selectedVessel.speed.toFixed(1)} knots</div>
            </div>
            <div>
              <div className="text-slate-600 dark:text-slate-400">Status</div>
              <div className="mt-1">
                <span className={`text-xs px-2 py-1 rounded ${getStatusColor(selectedVessel.status)}`}>
                  {selectedVessel.status.replace('_', ' ')}
                </span>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
