
import React, { useState, useEffect } from 'react';
import { WindowType } from './types/WindowTypes';
import { Home, Search, Settings, Clock, Battery, Wifi, Bluetooth, Calendar, RefreshCw } from 'lucide-react';
import { SettingsType } from './Settings';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";

interface TaskbarProps {
  windows: WindowType[];
  onItemClick: (id: string) => void;
  onStartClick: () => void;
  onSearchClick: () => void;
  onRefreshClick?: () => void;
  isStartMenuOpen: boolean;
  isSearchOpen: boolean;
  settings: SettingsType;
  minimizedWindows: string[];
}

export const Taskbar = ({ 
  windows, 
  onItemClick, 
  onStartClick, 
  onSearchClick,
  onRefreshClick,
  isStartMenuOpen,
  isSearchOpen,
  settings,
  minimizedWindows
}: TaskbarProps) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [batteryLevel, setBatteryLevel] = useState(75);
  const [isCharging, setIsCharging] = useState(false);
  const [isWifiOn, setIsWifiOn] = useState(true);
  const [isBluetoothOn, setIsBluetoothOn] = useState(false);
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [activeWindows, setActiveWindows] = useState<WindowType[]>([]);

  useEffect(() => {
    const openWindows = windows.filter(w => 
      w.isOpen && 
      w.id !== 'settings' &&  
      w.showInTaskbar !== false
    );
    setActiveWindows(openWindows);
  }, [windows]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    const getBatteryInfo = async () => {
      try {
        if ('getBattery' in navigator) {
          const battery = await (navigator as any).getBattery();
          
          setBatteryLevel(Math.floor(battery.level * 100));
          setIsCharging(battery.charging);
          
          battery.addEventListener('levelchange', () => {
            setBatteryLevel(Math.floor(battery.level * 100));
            
            if (battery.level <= 0.2 && !battery.charging) {
              new Notification('Battery Low', {
                body: `Battery level is at ${Math.floor(battery.level * 100)}%. Please connect charger.`,
                icon: '/favicon.ico'
              });
            }
          });
          
          battery.addEventListener('chargingchange', () => {
            setIsCharging(battery.charging);
            
            if (battery.charging) {
              new Notification('Charging', {
                body: 'Your device is now charging.',
                icon: '/favicon.ico'
              });
            }
          });
        } else {
          setBatteryLevel(Math.floor(Math.random() * 30) + 70);
        }
      } catch (error) {
        console.error("Error accessing battery info:", error);
        setBatteryLevel(Math.floor(Math.random() * 30) + 70);
      }
    };
    
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
    
    getBatteryInfo();
  }, []);

  return (
    <div className="fixed bottom-0 left-0 right-0 h-12 bg-win-taskbar backdrop-blur-win border-t border-gray-200/30 dark:border-gray-700/30 shadow-win flex items-center justify-between transition-colors duration-300">
      <div className="flex items-center gap-1 px-2">
        {}
        <button 
          className={`p-2 rounded-md transition-all duration-200 ${isStartMenuOpen ? 'bg-white/20 dark:bg-gray-700/40' : 'hover:bg-white/10 dark:hover:bg-gray-700/30'}`}
          onClick={(e) => { e.stopPropagation(); onStartClick(); }}
          aria-label="Start Menu"
        >
          <div className="w-6 h-6 rounded-md bg-win-blue flex items-center justify-center">
            <Home size={16} className="text-white" />
          </div>
        </button>
        
        {}
        <button 
          className={`p-2 rounded-md transition-all duration-200 ${isSearchOpen ? 'bg-white/20 dark:bg-gray-700/40' : 'hover:bg-white/10 dark:hover:bg-gray-700/30'}`} 
          onClick={(e) => { e.stopPropagation(); onSearchClick(); }}
          aria-label="Search"
        >
          <Search size={18} className="text-gray-600 dark:text-gray-300" />
        </button>
        
        {}
        <button 
          className={`p-2 rounded-md transition-all duration-200 ${
            windows.find(w => w.id === 'settings')?.isOpen ? 'bg-white/20 dark:bg-gray-700/40' : 'hover:bg-white/10 dark:hover:bg-gray-700/30'
          }`}
          onClick={(e) => { e.stopPropagation(); onItemClick('settings'); }}
          aria-label="Settings"
        >
          <Settings size={18} className="text-gray-700 dark:text-gray-300" />
        </button>
        
        {}
        <button 
          className="p-2 rounded-md hover:bg-white/10 dark:hover:bg-gray-700/30 transition-all duration-200"
          onClick={(e) => { e.stopPropagation(); if (onRefreshClick) onRefreshClick(); }}
          aria-label="Refresh"
        >
          <RefreshCw size={18} className="text-gray-600 dark:text-gray-300" />
        </button>
        
        {}
        {activeWindows.length > 0 && (
          <div className="h-6 w-px bg-gray-300/30 dark:bg-gray-600/30 mx-1"></div>
        )}
        
        {}
        <div className="flex items-center gap-1">
          {activeWindows.map(window => (
            <button
              key={window.id}
              className={`p-2 rounded-md transition-all duration-200 relative ${
                window.isOpen ? (window.isMinimized ? 'bg-white/10 dark:bg-gray-700/30' : 'bg-white/20 dark:bg-gray-700/40') : 'hover:bg-white/10 dark:hover:bg-gray-700/30'
              }`}
              onClick={(e) => { e.stopPropagation(); onItemClick(window.id); }}
              aria-label={window.title}
            >
              {React.cloneElement(window.icon as React.ReactElement, { 
                size: 20,
                className: "text-gray-700 dark:text-gray-300"
              })}
              {window.isOpen && !window.isMinimized && (
                <div className="absolute bottom-0.5 left-1/2 transform -translate-x-1/2 w-1 h-1 rounded-full bg-win-blue"></div>
              )}
              {window.isOpen && window.isMinimized && (
                <div className="absolute bottom-0.5 left-1/2 transform -translate-x-1/2 w-1 h-1 rounded-full bg-gray-400 dark:bg-gray-500"></div>
              )}
            </button>
          ))}
        </div>
      </div>

      {}
      {minimizedWindows.length > 0 && (
        <div className="mx-auto flex items-center space-x-1">
          {minimizedWindows.map(id => {
            const window = windows.find(w => w.id === id);
            if (!window) return null;
            
            return (
              <button 
                key={id}
                className="px-3 py-1 bg-white/10 dark:bg-gray-700/30 rounded-md hover:bg-white/20 dark:hover:bg-gray-700/40 flex items-center text-xs text-gray-700 dark:text-gray-300 transition-all duration-200"
                onClick={(e) => { e.stopPropagation(); onItemClick(id); }}
              >
                {React.cloneElement(window.icon as React.ReactElement, { 
                  size: 14,
                  className: "mr-1"
                })}
                {window.title}
              </button>
            );
          })}
        </div>
      )}

      {}
      <div className="flex items-center px-2 space-x-3 text-sm text-gray-700 dark:text-gray-300">
        {}
        <Popover>
          <PopoverTrigger asChild>
            <button className={`p-1 rounded-full transition-colors ${isWifiOn ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400 dark:text-gray-500'}`}>
              <Wifi size={16} />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-56 p-3 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">WiFi</h3>
            <div className="flex items-center justify-between">
              <span className="text-gray-700 dark:text-gray-300">Connected</span>
              <button 
                className={`w-10 h-5 rounded-full relative transition-colors ${isWifiOn ? 'bg-win-blue' : 'bg-gray-300 dark:bg-gray-600'}`}
                onClick={() => setIsWifiOn(!isWifiOn)}
              >
                <div className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition-all ${isWifiOn ? 'right-0.5' : 'left-0.5'}`}></div>
              </button>
            </div>
            <p className="text-xs mt-2 text-gray-600 dark:text-gray-400">{isWifiOn ? 'Connected to Home WiFi' : 'WiFi is off'}</p>
          </PopoverContent>
        </Popover>
        
        {}
        <Popover>
          <PopoverTrigger asChild>
            <button className={`p-1 rounded-full transition-colors ${isBluetoothOn ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400 dark:text-gray-500'}`}>
              <Bluetooth size={16} />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-56 p-3 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">Bluetooth</h3>
            <div className="flex items-center justify-between">
              <span className="text-gray-700 dark:text-gray-300">Enabled</span>
              <button 
                className={`w-10 h-5 rounded-full relative transition-colors ${isBluetoothOn ? 'bg-win-blue' : 'bg-gray-300 dark:bg-gray-600'}`}
                onClick={() => setIsBluetoothOn(!isBluetoothOn)}
              >
                <div className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition-all ${isBluetoothOn ? 'right-0.5' : 'left-0.5'}`}></div>
              </button>
            </div>
            <p className="text-xs mt-2 text-gray-600 dark:text-gray-400">{isBluetoothOn ? 'Looking for devices...' : 'Bluetooth is off'}</p>
          </PopoverContent>
        </Popover>
        
        {settings && settings.showBattery && (
          <Popover>
            <PopoverTrigger asChild>
              <button className="flex items-center gap-1 text-gray-700 dark:text-gray-300">
                <Battery size={16} className={isCharging ? "animate-pulse text-green-600 dark:text-green-400" : ""} />
                <span>{batteryLevel}%</span>
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-56 p-3 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">Battery</h3>
              <div className="w-full h-4 bg-gray-200 dark:bg-gray-700 rounded-full">
                <div 
                  className={`h-full rounded-full transition-all ${
                    batteryLevel > 50 ? 'bg-green-500' : 
                    batteryLevel > 20 ? 'bg-yellow-500' : 
                    'bg-red-500'
                  }`}
                  style={{ width: `${batteryLevel}%` }}
                ></div>
              </div>
              <p className="text-xs mt-2 text-gray-600 dark:text-gray-400">
                {batteryLevel}% {isCharging ? '(Charging)' : 'remaining'}
              </p>
            </PopoverContent>
          </Popover>
        )}
        
        {}
        <Popover>
          <PopoverTrigger asChild>
            <button className="px-2 text-gray-700 dark:text-gray-300" aria-label="Open calendar">
              <Calendar size={16} className="inline-block mr-1" />
              {currentTime.toLocaleDateString([], { month: 'numeric', day: 'numeric' })}
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-gray-200 dark:border-gray-700">
            <CalendarComponent
              mode="single"
              selected={date}
              onSelect={setDate}
              initialFocus
            />
          </PopoverContent>
        </Popover>
        
        {settings && settings.showClock && (
          <div className="px-2 font-medium">
            {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        )}
      </div>
    </div>
  );
};
