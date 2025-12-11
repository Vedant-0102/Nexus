import React, { useState, useEffect } from 'react';
import { Plane, MapPin, Clock, Navigation, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface Flight {
  id: string;
  callsign: string;
  airline: string;
  aircraft: string;
  origin: string;
  destination: string;
  altitude: number;
  speed: number;
  heading: number;
  latitude: number;
  longitude: number;
  status: 'scheduled' | 'boarding' | 'departed' | 'en-route' | 'landing' | 'arrived';
}

const DEMO_FLIGHTS: Flight[] = [
  {
    id: 'AA123',
    callsign: 'AAL123',
    airline: 'American Airlines',
    aircraft: 'Boeing 737-800',
    origin: 'JFK',
    destination: 'LAX',
    altitude: 35000,
    speed: 520,
    heading: 270,
    latitude: 40.7128,
    longitude: -74.0060,
    status: 'en-route'
  },
  {
    id: 'UA456',
    callsign: 'UAL456',
    airline: 'United Airlines',
    aircraft: 'Airbus A320',
    origin: 'ORD',
    destination: 'SFO',
    altitude: 38000,
    speed: 485,
    heading: 285,
    latitude: 41.8781,
    longitude: -87.6298,
    status: 'en-route'
  },
  {
    id: 'DL789',
    callsign: 'DAL789',
    airline: 'Delta Air Lines',
    aircraft: 'Boeing 777-200',
    origin: 'ATL',
    destination: 'LHR',
    altitude: 41000,
    speed: 550,
    heading: 45,
    latitude: 33.6407,
    longitude: -84.4277,
    status: 'en-route'
  },
  {
    id: 'BA101',
    callsign: 'BAW101',
    airline: 'British Airways',
    aircraft: 'Airbus A380',
    origin: 'LHR',
    destination: 'JFK',
    altitude: 39000,
    speed: 530,
    heading: 270,
    latitude: 51.4700,
    longitude: -0.4543,
    status: 'en-route'
  },
  {
    id: 'SW234',
    callsign: 'SWA234',
    airline: 'Southwest Airlines',
    aircraft: 'Boeing 737 MAX',
    origin: 'DEN',
    destination: 'PHX',
    altitude: 32000,
    speed: 495,
    heading: 195,
    latitude: 39.8561,
    longitude: -104.6737,
    status: 'en-route'
  },
];

export const FlightTracker: React.FC = () => {
  const [flights, setFlights] = useState<Flight[]>(DEMO_FLIGHTS);
  const [selectedFlight, setSelectedFlight] = useState<Flight | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    if (!isLive) return;

    const interval = setInterval(() => {
      setFlights(prevFlights =>
        prevFlights.map(flight => ({
          ...flight,
          altitude: Math.max(0, flight.altitude + (Math.random() - 0.5) * 500),
          speed: Math.max(0, flight.speed + (Math.random() - 0.5) * 20),
          heading: (flight.heading + (Math.random() - 0.5) * 5 + 360) % 360,
          latitude: flight.latitude + (Math.random() - 0.5) * 0.1,
          longitude: flight.longitude + (Math.random() - 0.5) * 0.1,
        }))
      );
    }, 3000);

    return () => clearInterval(interval);
  }, [isLive]);

  const getStatusColor = (status: Flight['status']) => {
    switch (status) {
      case 'scheduled': return 'bg-gray-500';
      case 'boarding': return 'bg-yellow-500';
      case 'departed': return 'bg-blue-500';
      case 'en-route': return 'bg-green-500';
      case 'landing': return 'bg-orange-500';
      case 'arrived': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  const filteredFlights = flights.filter(flight =>
    flight.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    flight.callsign.toLowerCase().includes(searchQuery.toLowerCase()) ||
    flight.airline.toLowerCase().includes(searchQuery.toLowerCase()) ||
    flight.origin.toLowerCase().includes(searchQuery.toLowerCase()) ||
    flight.destination.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-full w-full bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 p-6 overflow-auto">
      <div className="space-y-4">
        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Plane className="h-6 w-6" />
              Flight Tracker
            </h2>
            <Button
              onClick={() => setIsLive(!isLive)}
              variant={isLive ? 'default' : 'outline'}
              size="sm"
            >
              {isLive ? (
                <>
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse mr-2" />
                  Live Tracking
                </>
              ) : (
                'Start Live'
              )}
            </Button>
          </div>

          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by flight number, airline, or airport..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="grid gap-3">
            {filteredFlights.map((flight) => (
              <Card
                key={flight.id}
                className={`p-4 cursor-pointer hover:shadow-lg transition-all ${
                  selectedFlight?.id === flight.id ? 'ring-2 ring-blue-500' : ''
                }`}
                onClick={() => setSelectedFlight(flight)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-lg">{flight.id}</h3>
                      <Badge className={getStatusColor(flight.status)}>
                        {flight.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{flight.airline}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-500">{flight.aircraft}</p>
                  </div>
                  <Plane className="h-6 w-6 text-blue-500" style={{ transform: `rotate(${flight.heading}deg)` }} />
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-green-500" />
                    <span className="font-semibold">{flight.origin}</span>
                  </div>
                  <div className="flex-1 mx-4 border-t-2 border-dashed border-gray-300 relative">
                    <Plane className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-4 w-4 text-blue-500" />
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-red-500" />
                    <span className="font-semibold">{flight.destination}</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 mt-3 text-xs text-gray-600 dark:text-gray-400">
                  <div>
                    <span className="font-semibold">Alt:</span> {flight.altitude.toFixed(0)} ft
                  </div>
                  <div>
                    <span className="font-semibold">Speed:</span> {flight.speed.toFixed(0)} kts
                  </div>
                  <div>
                    <span className="font-semibold">Heading:</span> {flight.heading.toFixed(0)}°
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </Card>

        {selectedFlight && (
          <Card className="p-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h3 className="text-2xl font-bold mb-1">{selectedFlight.id}</h3>
                <p className="text-lg text-gray-600 dark:text-gray-400">{selectedFlight.airline}</p>
                <p className="text-sm text-gray-500 dark:text-gray-500">{selectedFlight.aircraft}</p>
              </div>
              <Badge className={`${getStatusColor(selectedFlight.status)} text-lg px-4 py-2`}>
                {selectedFlight.status}
              </Badge>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <Card className="p-4 bg-green-50 dark:bg-green-900/20">
                <div className="flex items-center gap-3 mb-2">
                  <MapPin className="h-5 w-5 text-green-600" />
                  <h4 className="font-semibold">Origin</h4>
                </div>
                <p className="text-2xl font-bold">{selectedFlight.origin}</p>
              </Card>

              <Card className="p-4 bg-red-50 dark:bg-red-900/20">
                <div className="flex items-center gap-3 mb-2">
                  <MapPin className="h-5 w-5 text-red-600" />
                  <h4 className="font-semibold">Destination</h4>
                </div>
                <p className="text-2xl font-bold">{selectedFlight.destination}</p>
              </Card>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Navigation className="h-4 w-4 text-blue-500" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">Altitude</p>
                </div>
                <p className="text-xl font-bold">{selectedFlight.altitude.toFixed(0)} ft</p>
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Plane className="h-4 w-4 text-blue-500" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">Speed</p>
                </div>
                <p className="text-xl font-bold">{selectedFlight.speed.toFixed(0)} kts</p>
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Navigation className="h-4 w-4 text-blue-500" style={{ transform: `rotate(${selectedFlight.heading}deg)` }} />
                  <p className="text-sm text-gray-600 dark:text-gray-400">Heading</p>
                </div>
                <p className="text-xl font-bold">{selectedFlight.heading.toFixed(0)}°</p>
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="h-4 w-4 text-blue-500" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">Position</p>
                </div>
                <p className="text-sm font-mono">
                  {selectedFlight.latitude.toFixed(4)}, {selectedFlight.longitude.toFixed(4)}
                </p>
              </Card>
            </div>

            <Card className="p-4 mt-4 bg-blue-50 dark:bg-blue-900/20">
              <p className="text-sm font-semibold mb-2">Callsign</p>
              <p className="text-lg font-mono">{selectedFlight.callsign}</p>
            </Card>
          </Card>
        )}

        <Card className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            ⚠️ Demo Mode: This is simulated data. For real-time flight tracking, integrate with APIs like OpenSky Network, FlightAware, or ADS-B Exchange.
          </p>
        </Card>
      </div>
    </div>
  );
};
