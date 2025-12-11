
import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ClockLocation {
  city: string;
  timeZone: string;
  flag: string;
}

export const WorldClock = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  
  const locations: ClockLocation[] = [
    { city: "New York", timeZone: "America/New_York", flag: "🇺🇸" },
    { city: "London", timeZone: "Europe/London", flag: "🇬🇧" },
    { city: "Tokyo", timeZone: "Asia/Tokyo", flag: "🇯🇵" },
    { city: "Sydney", timeZone: "Australia/Sydney", flag: "🇦🇺" },
    { city: "Dubai", timeZone: "Asia/Dubai", flag: "🇦🇪" },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, []);

  const formatTimeForTimeZone = (timeZone: string) => {
    return new Intl.DateTimeFormat('en-US', {
      timeZone,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
      timeZoneName: 'short',
    }).format(currentTime);
  };

  const formatDateForTimeZone = (timeZone: string) => {
    return new Intl.DateTimeFormat('en-US', {
      timeZone,
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(currentTime);
  };

  return (
    <div className="p-4 h-full">
      <h2 className="text-2xl font-semibold mb-4">World Clock</h2>
      
      <Tabs defaultValue="clock" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="clock">World Clock</TabsTrigger>
          <TabsTrigger value="map">Map View</TabsTrigger>
        </TabsList>
        
        <TabsContent value="clock" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {locations.map((location) => (
              <div 
                key={location.city}
                className="bg-white/50 p-4 rounded-lg flex flex-col items-center"
              >
                <div className="text-4xl mb-1">{location.flag}</div>
                <h3 className="text-lg font-semibold mb-1 text-gray-800 dark:text-gray-100">
                  {location.city}
                </h3>
                <div className="text-xl font-bold text-gray-900 dark:text-white">
                  {formatTimeForTimeZone(location.timeZone)}
                </div>
                <div className="text-xs mt-2 text-gray-600 dark:text-gray-300">
                  {formatDateForTimeZone(location.timeZone)}
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="map" className="mt-4">
          <div className="bg-white/50 p-4 rounded-lg">
            <div className="relative">
              <div className="w-full h-64 relative overflow-hidden rounded-lg">
                {/* World map SVG with timezone highlights */}
                <svg viewBox="0 0 800 400" className="w-full h-full">
                  {/* World map outline */}
                  <path 
                    d="M400,200c0,110.5-89.5,200-200,200S0,310.5,0,200S89.5,0,200,0S400,89.5,400,200z" 
                    fill="#E6F2FF" 
                    stroke="#90CAF9" 
                    strokeWidth="1"
                  />
                  
                  {/* Timezone highlights */}
                  {locations.map((location, index) => {
                    // Simplified coordinates for demo purposes
                    const coords = [
                      { x: 150, y: 120 }, // New York
                      { x: 350, y: 100 }, // London
                      { x: 650, y: 120 }, // Tokyo
                      { x: 650, y: 250 }, // Sydney
                      { x: 450, y: 150 }  // Dubai
                    ];
                    
                    return (
                      <g key={location.city}>
                        <circle 
                          cx={coords[index].x} 
                          cy={coords[index].y} 
                          r="8" 
                          fill="#3B82F6" 
                          className="animate-pulse"
                        />
                        <text 
                          x={coords[index].x} 
                          y={coords[index].y - 10} 
                          textAnchor="middle" 
                          fontSize="12" 
                          fill="#1E40AF"
                        >
                          {location.city}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>
              
              <div className="mt-4 text-center">
                <p className="text-gray-600 mb-2">
                  Current time in highlighted locations:
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {locations.map(location => (
                    <div key={location.city} className="px-3 py-1 bg-blue-100 rounded-full text-sm">
                      {location.city}: {formatTimeForTimeZone(location.timeZone)}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
