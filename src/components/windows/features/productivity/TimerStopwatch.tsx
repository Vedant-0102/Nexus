
import React, { useState, useEffect, useRef } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, Timer } from 'lucide-react';

export const TimerStopwatch = () => {
  // Stopwatch functionality
  const [stopwatchTime, setStopwatchTime] = useState(0);
  const [isStopwatchRunning, setIsStopwatchRunning] = useState(false);
  const stopwatchIntervalRef = useRef<number | null>(null);
  
  // Timer functionality
  const [timerMinutes, setTimerMinutes] = useState(5);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerTotalSeconds, setTimerTotalSeconds] = useState(5 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [isTimerComplete, setIsTimerComplete] = useState(false);
  const timerIntervalRef = useRef<number | null>(null);

  // Stopwatch controls
  const startStopwatch = () => {
    if (!isStopwatchRunning) {
      setIsStopwatchRunning(true);
      const startTime = Date.now() - stopwatchTime;
      stopwatchIntervalRef.current = window.setInterval(() => {
        setStopwatchTime(Date.now() - startTime);
      }, 10);
    }
  };

  const pauseStopwatch = () => {
    if (isStopwatchRunning) {
      clearInterval(stopwatchIntervalRef.current!);
      setIsStopwatchRunning(false);
    }
  };

  const resetStopwatch = () => {
    clearInterval(stopwatchIntervalRef.current!);
    setIsStopwatchRunning(false);
    setStopwatchTime(0);
  };

  // Timer controls
  const startTimer = () => {
    if (!isTimerRunning) {
      // Set total seconds from minutes and seconds inputs
      const totalSecs = timerMinutes * 60 + timerSeconds;
      setTimerTotalSeconds(totalSecs);
      setIsTimerRunning(true);
      setIsTimerComplete(false);
    }
  };

  const pauseTimer = () => {
    if (isTimerRunning) {
      clearInterval(timerIntervalRef.current!);
      setIsTimerRunning(false);
    }
  };

  const resetTimer = () => {
    clearInterval(timerIntervalRef.current!);
    setIsTimerRunning(false);
    setIsTimerComplete(false);
    setTimerTotalSeconds(timerMinutes * 60 + timerSeconds);
  };

  // Format time for display
  const formatStopwatchTime = (time: number) => {
    const mins = Math.floor(time / 60000);
    const secs = Math.floor((time % 60000) / 1000);
    const ms = Math.floor((time % 1000) / 10);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  const formatTimerTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Timer effect
  useEffect(() => {
    if (isTimerRunning) {
      timerIntervalRef.current = window.setInterval(() => {
        setTimerTotalSeconds((prev) => {
          if (prev <= 1) {
            clearInterval(timerIntervalRef.current!);
            setIsTimerRunning(false);
            setIsTimerComplete(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [isTimerRunning]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (stopwatchIntervalRef.current) clearInterval(stopwatchIntervalRef.current);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, []);

  return (
    <div className="p-4 h-full">
      <h2 className="text-2xl font-semibold mb-4">Timer & Stopwatch</h2>
      
      <Tabs defaultValue="timer" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="timer">
            <div className="flex items-center gap-2">
              <Timer size={16} />
              <span>Timer</span>
            </div>
          </TabsTrigger>
          <TabsTrigger value="stopwatch">
            <div className="flex items-center gap-2">
              <Clock size={16} />
              <span>Stopwatch</span>
            </div>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="timer" className="mt-4">
          <div className="bg-white/50 p-6 rounded-lg flex flex-col items-center">
            {!isTimerRunning && !isTimerComplete && (
              <div className="mb-4 grid grid-cols-2 gap-4 w-full max-w-xs">
                <div>
                  <label className="block text-sm font-medium mb-1">Minutes</label>
                  <input 
                    type="number" 
                    min="0" 
                    max="59"
                    value={timerMinutes}
                    onChange={(e) => setTimerMinutes(parseInt(e.target.value) || 0)}
                    className="w-full p-2 border rounded text-center"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Seconds</label>
                  <input 
                    type="number" 
                    min="0" 
                    max="59"
                    value={timerSeconds}
                    onChange={(e) => setTimerSeconds(parseInt(e.target.value) || 0)}
                    className="w-full p-2 border rounded text-center" 
                  />
                </div>
              </div>
            )}
            
            <div className={`text-6xl font-bold my-6 ${isTimerComplete ? 'animate-pulse text-red-500' : ''}`}>
              {formatTimerTime(timerTotalSeconds)}
            </div>
            
            <div className="flex gap-4">
              {!isTimerRunning ? (
                <button
                  onClick={startTimer}
                  className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                  disabled={isTimerComplete}
                >
                  Start
                </button>
              ) : (
                <button
                  onClick={pauseTimer}
                  className="px-6 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
                >
                  Pause
                </button>
              )}
              <button
                onClick={resetTimer}
                className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Reset
              </button>
            </div>
            
            {isTimerComplete && (
              <div className="mt-4 text-red-500 font-semibold">
                Time's up!
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="stopwatch" className="mt-4">
          <div className="bg-white/50 p-6 rounded-lg flex flex-col items-center">
            <div className="text-6xl font-bold my-6">
              {formatStopwatchTime(stopwatchTime)}
            </div>
            
            <div className="flex gap-4">
              {!isStopwatchRunning ? (
                <button
                  onClick={startStopwatch}
                  className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                >
                  Start
                </button>
              ) : (
                <button
                  onClick={pauseStopwatch}
                  className="px-6 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
                >
                  Pause
                </button>
              )}
              <button
                onClick={resetStopwatch}
                className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Reset
              </button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
