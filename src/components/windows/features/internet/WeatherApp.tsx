import React, { useState, useEffect } from 'react';
import { Cloud, CloudRain, Sun, Wind, Droplets, Eye, Gauge, Sunrise, Sunset, MapPin, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface WeatherData {
  location: string;
  country: string;
  temperature: number;
  feelsLike: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  pressure: number;
  visibility: number;
  uvIndex: number;
  sunrise: string;
  sunset: string;
}

interface ForecastDay {
  day: string;
  high: number;
  low: number;
  condition: string;
  precipitation: number;
}

export const WeatherApp: React.FC = () => {
  const [location, setLocation] = useState('London');
  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCitySelector, setShowCitySelector] = useState(false);
  const [weatherData, setWeatherData] = useState<WeatherData>({
    location: 'London',
    country: 'United Kingdom',
    temperature: 18,
    feelsLike: 16,
    condition: 'Partly Cloudy',
    humidity: 65,
    windSpeed: 15,
    pressure: 1013,
    visibility: 10,
    uvIndex: 3,
    sunrise: '06:45 AM',
    sunset: '08:30 PM',
  });
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Popular cities for quick selection
  const popularCities = [
    { name: 'London', country: 'United Kingdom', temp: 18, condition: 'Partly Cloudy' },
    { name: 'New York', country: 'United States', temp: 22, condition: 'Sunny' },
    { name: 'Tokyo', country: 'Japan', temp: 25, condition: 'Cloudy' },
    { name: 'Paris', country: 'France', temp: 20, condition: 'Rainy' },
    { name: 'Dubai', country: 'UAE', temp: 35, condition: 'Sunny' },
    { name: 'Sydney', country: 'Australia', temp: 23, condition: 'Partly Cloudy' },
    { name: 'Mumbai', country: 'India', temp: 32, condition: 'Sunny' },
    { name: 'Singapore', country: 'Singapore', temp: 30, condition: 'Rainy' },
    { name: 'Berlin', country: 'Germany', temp: 16, condition: 'Cloudy' },
    { name: 'Toronto', country: 'Canada', temp: 19, condition: 'Partly Cloudy' },
    { name: 'Los Angeles', country: 'United States', temp: 24, condition: 'Sunny' },
    { name: 'Moscow', country: 'Russia', temp: 10, condition: 'Cloudy' },
    { name: 'Beijing', country: 'China', temp: 20, condition: 'Partly Cloudy' },
    { name: 'São Paulo', country: 'Brazil', temp: 26, condition: 'Rainy' },
    { name: 'Cairo', country: 'Egypt', temp: 30, condition: 'Sunny' },
    { name: 'Mexico City', country: 'Mexico', temp: 22, condition: 'Partly Cloudy' },
    { name: 'Bangkok', country: 'Thailand', temp: 33, condition: 'Sunny' },
    { name: 'Istanbul', country: 'Turkey', temp: 21, condition: 'Cloudy' },
    { name: 'Seoul', country: 'South Korea', temp: 18, condition: 'Partly Cloudy' },
    { name: 'Rome', country: 'Italy', temp: 23, condition: 'Sunny' },
  ];

  // Extended city database for search
  const allCities = [
    ...popularCities.map(c => c.name),
    'Madrid', 'Barcelona', 'Amsterdam', 'Brussels', 'Vienna', 'Prague', 'Budapest',
    'Warsaw', 'Athens', 'Lisbon', 'Copenhagen', 'Stockholm', 'Oslo', 'Helsinki',
    'Dublin', 'Edinburgh', 'Manchester', 'Birmingham', 'Chicago', 'Houston',
    'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego', 'Dallas', 'San Jose',
    'Austin', 'Jacksonville', 'San Francisco', 'Seattle', 'Denver', 'Boston',
    'Miami', 'Atlanta', 'Las Vegas', 'Portland', 'Detroit', 'Montreal', 'Vancouver',
    'Calgary', 'Ottawa', 'Hong Kong', 'Shanghai', 'Guangzhou', 'Shenzhen', 'Delhi',
    'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata', 'Pune', 'Melbourne', 'Brisbane',
    'Perth', 'Adelaide', 'Auckland', 'Wellington', 'Johannesburg', 'Cape Town',
    'Nairobi', 'Lagos', 'Casablanca', 'Algiers', 'Tunis', 'Riyadh', 'Doha',
    'Abu Dhabi', 'Kuwait City', 'Muscat', 'Karachi', 'Lahore', 'Dhaka', 'Hanoi',
    'Ho Chi Minh City', 'Manila', 'Jakarta', 'Kuala Lumpur', 'Taipei', 'Osaka',
    'Kyoto', 'Busan', 'Buenos Aires', 'Lima', 'Bogotá', 'Santiago', 'Caracas',
  ];

  // Mock weather data generator
  const getWeatherData = (cityName: string): WeatherData => {
    const city = popularCities.find(c => c.name.toLowerCase() === cityName.toLowerCase());
    
    if (city) {
      return {
        location: city.name,
        country: city.country,
        temperature: city.temp,
        feelsLike: city.temp - 2,
        condition: city.condition,
        humidity: 65,
        windSpeed: 15,
        pressure: 1013,
        visibility: 10,
        uvIndex: 3,
        sunrise: '06:45 AM',
        sunset: '08:30 PM',
      };
    }

    // Generate mock data for any city
    const conditions = ['Sunny', 'Partly Cloudy', 'Cloudy', 'Rainy', 'Clear'];
    const randomTemp = Math.floor(Math.random() * 30) + 10; // 10-40°C
    
    return {
      location: cityName,
      country: 'Unknown',
      temperature: randomTemp,
      feelsLike: randomTemp - 2,
      condition: conditions[Math.floor(Math.random() * conditions.length)],
      humidity: Math.floor(Math.random() * 40) + 40, // 40-80%
      windSpeed: Math.floor(Math.random() * 20) + 5, // 5-25 km/h
      pressure: Math.floor(Math.random() * 50) + 990, // 990-1040 mb
      visibility: Math.floor(Math.random() * 10) + 5, // 5-15 km
      uvIndex: Math.floor(Math.random() * 8) + 1, // 1-8
      sunrise: '06:45 AM',
      sunset: '08:30 PM',
    };
  };

  // Update weather data when location changes
  useEffect(() => {
    const data = getWeatherData(location);
    setWeatherData(data);
  }, [location]);

  const forecast: ForecastDay[] = [
    { day: 'Today', high: 18, low: 12, condition: 'Partly Cloudy', precipitation: 20 },
    { day: 'Tomorrow', high: 20, low: 14, condition: 'Sunny', precipitation: 10 },
    { day: 'Wednesday', high: 17, low: 11, condition: 'Rainy', precipitation: 80 },
    { day: 'Thursday', high: 19, low: 13, condition: 'Cloudy', precipitation: 30 },
    { day: 'Friday', high: 21, low: 15, condition: 'Sunny', precipitation: 5 },
    { day: 'Saturday', high: 22, low: 16, condition: 'Sunny', precipitation: 0 },
    { day: 'Sunday', high: 20, low: 14, condition: 'Partly Cloudy', precipitation: 15 },
  ];

  const getWeatherIcon = (condition: string) => {
    const lower = condition.toLowerCase();
    if (lower.includes('rain')) return <CloudRain size={48} className="text-blue-500" />;
    if (lower.includes('cloud')) return <Cloud size={48} className="text-gray-500" />;
    if (lower.includes('sun')) return <Sun size={48} className="text-yellow-500" />;
    return <Cloud size={48} className="text-gray-400" />;
  };

  const getSmallWeatherIcon = (condition: string) => {
    const lower = condition.toLowerCase();
    if (lower.includes('rain')) return <CloudRain size={24} className="text-blue-500" />;
    if (lower.includes('cloud')) return <Cloud size={24} className="text-gray-500" />;
    if (lower.includes('sun')) return <Sun size={24} className="text-yellow-500" />;
    return <Cloud size={24} className="text-gray-400" />;
  };

  const handleSearch = () => {
    if (searchInput.trim()) {
      setLoading(true);
      setShowSuggestions(false);
      // Simulate API call
      setTimeout(() => {
        setLocation(searchInput);
        setSearchInput('');
        setLoading(false);
      }, 500);
    }
  };

  const handleSearchInputChange = (value: string) => {
    setSearchInput(value);
    
    if (value.length >= 2) {
      // Filter cities based on input
      const filtered = allCities.filter(city =>
        city.toLowerCase().includes(value.toLowerCase())
      ).slice(0, 8); // Show max 8 suggestions
      
      setSearchSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setShowSuggestions(false);
    }
  };

  const selectCity = (cityName: string) => {
    setLocation(cityName);
    setShowCitySelector(false);
    setSearchInput('');
    setShowSuggestions(false);
  };

  const selectSuggestion = (cityName: string) => {
    setSearchInput(cityName);
    setShowSuggestions(false);
    setLocation(cityName);
  };

  const getUVIndexColor = (index: number) => {
    if (index <= 2) return 'bg-green-500';
    if (index <= 5) return 'bg-yellow-500';
    if (index <= 7) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-gray-900 dark:to-blue-900">
      {/* Header with Search */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
            <Cloud className="text-white" size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Weather</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">Current conditions</p>
          </div>
        </div>
        
        {/* Search Bar */}
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 z-10" size={18} />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => handleSearchInputChange(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              onFocus={() => searchInput.length >= 2 && setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              placeholder="Search any city..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            
            {/* Search Suggestions Dropdown */}
            {showSuggestions && searchSuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
                {searchSuggestions.map((city, index) => (
                  <button
                    key={index}
                    onClick={() => selectSuggestion(city)}
                    className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors"
                  >
                    <MapPin size={14} className="inline mr-2 text-gray-400" />
                    {city}
                  </button>
                ))}
              </div>
            )}
          </div>
          <Button onClick={handleSearch} disabled={loading || !searchInput.trim()}>
            <Search size={18} />
          </Button>
          <Button onClick={() => setShowCitySelector(true)} variant="outline">
            <MapPin size={18} />
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-4">
        <div className="max-w-4xl mx-auto space-y-4">
          {/* Current Weather Card */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                  {weatherData.location}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">{weatherData.country}</p>
              </div>
              {getWeatherIcon(weatherData.condition)}
            </div>
            
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-6xl font-bold text-gray-900 dark:text-gray-100">
                {weatherData.temperature}°
              </span>
              <span className="text-2xl text-gray-600 dark:text-gray-400">C</span>
            </div>
            
            <p className="text-lg text-gray-700 dark:text-gray-300 mb-1">
              {weatherData.condition}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Feels like {weatherData.feelsLike}°C
            </p>
          </div>

          {/* Weather Details Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <div className="flex items-center gap-2 mb-2 text-gray-600 dark:text-gray-400">
                <Droplets size={18} />
                <span className="text-sm">Humidity</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {weatherData.humidity}%
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <div className="flex items-center gap-2 mb-2 text-gray-600 dark:text-gray-400">
                <Wind size={18} />
                <span className="text-sm">Wind Speed</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {weatherData.windSpeed} km/h
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <div className="flex items-center gap-2 mb-2 text-gray-600 dark:text-gray-400">
                <Gauge size={18} />
                <span className="text-sm">Pressure</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {weatherData.pressure} mb
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <div className="flex items-center gap-2 mb-2 text-gray-600 dark:text-gray-400">
                <Eye size={18} />
                <span className="text-sm">Visibility</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {weatherData.visibility} km
              </p>
            </div>
          </div>

          {/* Sun Times */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center">
                  <Sunrise className="text-orange-500" size={24} />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Sunrise</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {weatherData.sunrise}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                  <Sunset className="text-purple-500" size={24} />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Sunset</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {weatherData.sunset}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* UV Index */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">UV Index</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                  {weatherData.uvIndex}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Moderate</p>
              </div>
              <div className="flex gap-1">
                {[...Array(11)].map((_, i) => (
                  <div
                    key={i}
                    className={`w-2 h-16 rounded ${
                      i < weatherData.uvIndex ? getUVIndexColor(weatherData.uvIndex) : 'bg-gray-200 dark:bg-gray-700'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* 7-Day Forecast */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              7-Day Forecast
            </h4>
            <div className="space-y-3">
              {forecast.map((day, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <span className="w-24 font-medium text-gray-900 dark:text-gray-100">
                      {day.day}
                    </span>
                    {getSmallWeatherIcon(day.condition)}
                    <span className="text-sm text-gray-600 dark:text-gray-400 flex-1">
                      {day.condition}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1 text-blue-500">
                      <Droplets size={14} />
                      <span className="text-sm">{day.precipitation}%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-900 dark:text-gray-100 font-semibold">
                        {day.high}°
                      </span>
                      <span className="text-gray-500 dark:text-gray-400">
                        {day.low}°
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Info Note */}
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>Note:</strong> This is demo weather data. In production, this would connect to a live weather API (like OpenWeatherMap or WeatherAPI) for real-time weather information.
            </p>
          </div>
        </div>
      </div>

      {/* City Selector Modal */}
      {showCitySelector && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setShowCitySelector(false)}
        >
          <div 
            className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  Select City
                </h3>
                <button
                  onClick={() => setShowCitySelector(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <span className="text-2xl">×</span>
                </button>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Choose from popular cities around the world
              </p>
            </div>

            {/* Cities Grid */}
            <div className="flex-1 overflow-auto p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {popularCities.map((city) => (
                  <button
                    key={city.name}
                    onClick={() => selectCity(city.name)}
                    className={`p-4 rounded-lg border-2 transition-all text-left ${
                      location === city.name
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900 dark:text-gray-100">
                          {city.name}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {city.country}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                          {city.temp}°
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          {city.condition}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
              <p className="text-xs text-gray-600 dark:text-gray-400 text-center">
                Or use the search bar above to find any city
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
