
import React, { useState, useEffect } from 'react';
import { Battery, BatteryCharging, BatteryFull, BatteryMedium, BatteryLow, BatteryWarning } from 'lucide-react';

interface BatteryManager {
  charging: boolean;
  chargingTime: number;
  dischargingTime: number;
  level: number;
  addEventListener: (event: string, callback: EventListenerOrEventListenerObject) => void;
  removeEventListener: (event: string, callback: EventListenerOrEventListenerObject) => void;
}

interface NavigatorWithBattery extends Navigator {
  getBattery?: () => Promise<BatteryManager>;
}

export const BatteryLevel = () => {
  const [level, setLevel] = useState(75);
  const [isCharging, setIsCharging] = useState(false);
  const [remainingTime, setRemainingTime] = useState<string>("3 hrs 45 min");
  const [usingRealBattery, setUsingRealBattery] = useState(false);
  
  // Use real Battery API if available
  useEffect(() => {
    const tryUsingRealBatteryAPI = async () => {
      try {
        const nav = navigator as NavigatorWithBattery;
        
        if (nav.getBattery) {
          const battery = await nav.getBattery();
          
          // Update initial state
          setLevel(Math.round(battery.level * 100));
          setIsCharging(battery.charging);
          setUsingRealBattery(true);
          
          // Update remaining time
          updateRemainingTime(battery.level * 100, battery.charging, 
            battery.chargingTime, battery.dischargingTime);
          
          // Add event listeners for battery status changes
          const handleLevelChange = () => {
            setLevel(Math.round(battery.level * 100));
            updateRemainingTime(battery.level * 100, battery.charging, 
              battery.chargingTime, battery.dischargingTime);
          };
          
          const handleChargingChange = () => {
            setIsCharging(battery.charging);
            updateRemainingTime(battery.level * 100, battery.charging, 
              battery.chargingTime, battery.dischargingTime);
          };
          
          const handleTimeChange = () => {
            updateRemainingTime(battery.level * 100, battery.charging, 
              battery.chargingTime, battery.dischargingTime);
          };
          
          battery.addEventListener('levelchange', handleLevelChange);
          battery.addEventListener('chargingchange', handleChargingChange);
          battery.addEventListener('chargingtimechange', handleTimeChange);
          battery.addEventListener('dischargingtimechange', handleTimeChange);
          
          return () => {
            battery.removeEventListener('levelchange', handleLevelChange);
            battery.removeEventListener('chargingchange', handleChargingChange);
            battery.removeEventListener('chargingtimechange', handleTimeChange);
            battery.removeEventListener('dischargingtimechange', handleTimeChange);
          };
        }
        return undefined;
      } catch (error) {
        console.log('Battery API not supported or permission denied', error);
        return undefined;
      }
    };
    
    const cleanup = tryUsingRealBatteryAPI();
    
    // Fallback to simulated battery if real API is not available
    if (!usingRealBattery) {
      const interval = setInterval(() => {
        setLevel((prevLevel) => {
          if (isCharging && prevLevel < 100) {
            return Math.min(prevLevel + 1, 100);
          } else if (!isCharging && prevLevel > 0) {
            return Math.max(prevLevel - 1, 0);
          }
          return prevLevel;
        });

        // Randomly toggle charging status less frequently
        if (Math.random() > 0.95) {
          setIsCharging((prev) => !prev);
        }
        
        // Update simulated remaining time
        updateSimulatedRemainingTime();
      }, 3000);
      
      return () => {
        clearInterval(interval);
        cleanup?.then(cleanupFn => cleanupFn?.());
      };
    }
    
    return () => {
      cleanup?.then(cleanupFn => cleanupFn?.());
    };
  }, [usingRealBattery, isCharging]);
  
  // Update simulated remaining time
  const updateSimulatedRemainingTime = () => {
    if (isCharging) {
      const minsToFull = Math.round((100 - level) * 1.2);
      const hrs = Math.floor(minsToFull / 60);
      const mins = minsToFull % 60;
      setRemainingTime(`${hrs > 0 ? hrs + ' hrs ' : ''}${mins} min to full`);
    } else {
      const minsRemaining = Math.round(level * 3);
      const hrs = Math.floor(minsRemaining / 60);
      const mins = minsRemaining % 60;
      setRemainingTime(`${hrs > 0 ? hrs + ' hrs ' : ''}${mins} min remaining`);
    }
  };
  
  // Update remaining time based on real battery API data
  const updateRemainingTime = (
    batteryLevel: number, 
    charging: boolean, 
    chargingTime: number, 
    dischargingTime: number
  ) => {
    if (charging) {
      if (chargingTime !== Infinity) {
        const hrs = Math.floor(chargingTime / 3600);
        const mins = Math.floor((chargingTime % 3600) / 60);
        setRemainingTime(`${hrs > 0 ? hrs + ' hrs ' : ''}${mins} min to full`);
      } else {
        setRemainingTime('Calculating...');
      }
    } else {
      if (dischargingTime !== Infinity) {
        const hrs = Math.floor(dischargingTime / 3600);
        const mins = Math.floor((dischargingTime % 3600) / 60);
        setRemainingTime(`${hrs > 0 ? hrs + ' hrs ' : ''}${mins} min remaining`);
      } else {
        setRemainingTime('Calculating...');
      }
    }
  };

  const getBatteryColor = () => {
    if (level > 60) return "text-green-600";
    if (level > 20) return "text-yellow-600";
    return "text-red-600";
  };

  const getBatteryIcon = () => {
    if (isCharging) return <BatteryCharging className={`${getBatteryColor()} text-7xl`} />;
    
    if (level > 80) return <BatteryFull className={`${getBatteryColor()} text-7xl`} />;
    if (level > 40) return <BatteryMedium className={`${getBatteryColor()} text-7xl`} />;
    if (level > 10) return <BatteryLow className={`${getBatteryColor()} text-7xl`} />;
    return <BatteryWarning className={`${getBatteryColor()} text-7xl`} />;
  };

  return (
    <div className="p-4 h-full">
      <h2 className="text-2xl font-semibold mb-4">Battery Status</h2>
      <div className="bg-white/50 p-6 rounded-lg max-w-md mx-auto flex flex-col items-center">
        {getBatteryIcon()}
        
        <div className="text-3xl font-bold mt-4">
          {level}%
        </div>
        
        <div className="mt-2 text-sm">
          {isCharging 
            ? `Charging - ${remainingTime}` 
            : level > 20 
              ? `Battery discharging - ${remainingTime}` 
              : `Low battery - please charge soon - ${remainingTime}`
          }
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-4 mt-6 overflow-hidden">
          <div 
            className={`h-4 transition-all duration-500 ${
              level > 60 ? "bg-green-600" : level > 20 ? "bg-yellow-500" : "bg-red-600"
            }`}
            style={{ width: `${level}%` }}
          ></div>
        </div>
        
        <div className="mt-6 bg-gray-50 p-4 rounded-lg w-full">
          <h3 className="font-medium mb-2">Battery Information</h3>
          <div className="text-sm space-y-1">
            <p><span className="font-medium">Condition:</span> Normal</p>
            <p><span className="font-medium">Cycles:</span> {Math.floor(Math.random() * 300) + 100}</p>
            <p><span className="font-medium">Maximum Capacity:</span> {Math.floor(Math.random() * 15) + 85}%</p>
            <p><span className="font-medium">Power Source:</span> {isCharging ? "AC Adapter" : "Battery"}</p>
            <p><span className="font-medium">API:</span> {usingRealBattery ? "Real Battery API" : "Simulated Battery"}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
