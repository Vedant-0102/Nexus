
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Moon, Sun, Clock, FileText, Battery, Palette, Settings as SettingsIcon } from 'lucide-react';

export type SettingsType = {
  theme: 'light' | 'dark';
  showClock: boolean;
  showNotepad: boolean;
  showBattery: boolean;
  wallpaperUrl?: string;
  notifications?: boolean;
  animations?: boolean;
  transparency?: number;
};

interface SettingsAppProps {
  initialSettings: SettingsType;
  onApply: (newSettings: SettingsType) => void;
}

export const SettingsApp: React.FC<SettingsAppProps> = ({ initialSettings, onApply }) => {
  const [settings, setSettings] = useState<SettingsType>(initialSettings);
  
  const handleThemeChange = (theme: 'light' | 'dark') => {
    const newSettings = { ...settings, theme };
    setSettings(newSettings);
    // Apply theme immediately for instant feedback without closing
    onApply(newSettings);
  };

  const handleToggleChange = (key: keyof SettingsType, value: boolean) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    // Apply immediately without closing
    onApply(newSettings);
  };
  
  const handleApply = () => {
    onApply(settings);
  };
  
  return (
    <div className="flex flex-col h-full">
      <div className="p-6 pb-2">
        <h2 className="text-2xl font-semibold">Settings</h2>
      </div>
      
      <Tabs defaultValue="appearance" className="flex-1 flex flex-col px-6 overflow-hidden">
        <TabsList className="mb-6">
          <TabsTrigger value="appearance" className="flex items-center gap-2">
            <Palette size={16} />
            <span>Appearance</span>
          </TabsTrigger>
          <TabsTrigger value="system" className="flex items-center gap-2">
            <SettingsIcon size={16} />
            <span>System</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="appearance" className="space-y-6 overflow-y-auto flex-1 pr-2">
          <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-6 backdrop-blur-sm">
            <h3 className="text-lg font-medium mb-4 text-gray-900 dark:text-gray-100">Theme</h3>
            <div className="flex gap-4">
              <button
                className={`border rounded-lg p-4 w-40 h-40 flex flex-col items-center justify-center gap-3 transition-all hover:scale-105 ${
                  settings.theme === 'light' 
                    ? 'border-blue-500 ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                    : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                }`}
                onClick={() => handleThemeChange('light')}
              >
                <Sun size={36} className="text-orange-500" />
                <span className="font-medium text-gray-900 dark:text-gray-100">Light</span>
                <div className="w-full h-14 bg-gradient-to-br from-blue-100 to-blue-200 rounded-md shadow-sm"></div>
              </button>
              
              <button
                className={`border rounded-lg p-4 w-40 h-40 flex flex-col items-center justify-center gap-3 transition-all hover:scale-105 ${
                  settings.theme === 'dark' 
                    ? 'border-blue-500 ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                    : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                }`}
                onClick={() => handleThemeChange('dark')}
              >
                <Moon size={36} className="text-indigo-400" />
                <span className="font-medium text-gray-900 dark:text-gray-100">Dark</span>
                <div className="w-full h-14 bg-gradient-to-br from-gray-700 to-gray-900 rounded-md shadow-sm"></div>
              </button>
            </div>
          </div>
          
          <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-6 backdrop-blur-sm">
            <h3 className="text-lg font-medium mb-4 text-gray-900 dark:text-gray-100">Visual Effects</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-gray-900 dark:text-gray-100">Transparency</span>
                </div>
                <div className="w-32 flex items-center gap-2">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={settings.transparency || 50}
                    onChange={(e) => setSettings({ ...settings, transparency: parseInt(e.target.value) })}
                    className="w-full accent-blue-500"
                  />
                  <span className="text-sm text-gray-600 dark:text-gray-400 w-8">{settings.transparency || 50}%</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-gray-900 dark:text-gray-100">Animations</span>
                </div>
                <Switch
                  checked={settings.animations !== false}
                  onCheckedChange={(checked) => setSettings({ ...settings, animations: checked })}
                />
              </div>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="system" className="space-y-6 overflow-y-auto flex-1 pr-2">
          <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-6 backdrop-blur-sm">
            <h3 className="text-lg font-medium mb-4 text-gray-900 dark:text-gray-100">System Preferences</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <Clock size={20} className="text-blue-500" />
                  <Label htmlFor="show-clock" className="text-gray-900 dark:text-gray-100 cursor-pointer">Show Clock</Label>
                </div>
                <Switch
                  id="show-clock"
                  checked={settings.showClock}
                  onCheckedChange={(checked) => handleToggleChange('showClock', checked)}
                />
              </div>
              
              {/* Notepad toggle removed */}
              
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <Battery size={20} className="text-yellow-500" />
                  <Label htmlFor="show-battery" className="text-gray-900 dark:text-gray-100 cursor-pointer">Show Battery</Label>
                </div>
                <Switch
                  id="show-battery"
                  checked={settings.showBattery}
                  onCheckedChange={(checked) => handleToggleChange('showBattery', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <span className="text-gray-900 dark:text-gray-100">Notifications</span>
                </div>
                <Switch
                  checked={settings.notifications !== false}
                  onCheckedChange={(checked) => setSettings({ ...settings, notifications: checked })}
                />
              </div>
            </div>
          </div>
          
          {/* Apply button removed - changes apply immediately */}
          <div className="flex justify-end pt-4 pb-4 sticky bottom-0 bg-white dark:bg-gray-900">
            <p className="text-sm text-gray-600 dark:text-gray-400">Changes are applied automatically</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
