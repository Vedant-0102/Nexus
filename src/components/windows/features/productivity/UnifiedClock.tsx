
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, Timer, Globe } from 'lucide-react';
import { Clock as ClockApp } from './Clock';
import { WorldClock } from './WorldClock'; 
import { TimerStopwatch } from './TimerStopwatch';

export const UnifiedClock: React.FC = () => {
  return (
    <div className="p-4 h-full">
      <h2 className="text-2xl font-semibold mb-4">Clock</h2>
      
      <Tabs defaultValue="clock" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="clock">
            <div className="flex items-center gap-2">
              <Clock size={16} />
              <span>Clock</span>
            </div>
          </TabsTrigger>
          <TabsTrigger value="worldclock">
            <div className="flex items-center gap-2">
              <Globe size={16} />
              <span>World Clock</span>
            </div>
          </TabsTrigger>
          <TabsTrigger value="timer">
            <div className="flex items-center gap-2">
              <Timer size={16} />
              <span>Timer</span>
            </div>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="clock" className="mt-4">
          <ClockApp />
        </TabsContent>
        
        <TabsContent value="worldclock" className="mt-4">
          <div className="bg-white/50 p-4 rounded-lg">
            <WorldClock />
          </div>
        </TabsContent>
        
        <TabsContent value="timer" className="mt-4">
          <div className="bg-white/50 p-4 rounded-lg">
            <TimerStopwatch />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
