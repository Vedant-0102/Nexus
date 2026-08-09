
import React from 'react';
import { useWindows } from './context/WindowsContext';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Moon, Sun, Clock, Battery, Palette, Settings as SettingsIcon, Monitor } from 'lucide-react';
import { getTheme } from './themes/windowThemes';

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
  /** Legacy props — settings now come straight from WindowsContext so the UI
   *  can never drift out of sync with the applied state. */
  initialSettings?: SettingsType;
  onApply?: (newSettings: SettingsType) => void;
}

const WALLPAPER_PRESETS = [
  { name: 'Windows Blue', value: '#0078D4' },
  { name: 'Dark', value: '#1a1a2e' },
  { name: 'Midnight', value: '#0f0c29' },
  { name: 'Charcoal', value: '#2d3436' },
  { name: 'Sunset', value: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
  { name: 'Ocean', value: 'linear-gradient(135deg, #2193b0 0%, #6dd5ed 100%)' },
  { name: 'Aurora', value: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)' },
  { name: 'Forest', value: 'linear-gradient(135deg, #134e5e 0%, #71b280 100%)' },
  { name: 'Warm', value: 'linear-gradient(135deg, #ee9ca7 0%, #ffdde1 100%)' },
  { name: 'Lavender', value: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)' },
  { name: 'Flame', value: 'linear-gradient(135deg, #f12711 0%, #f5af19 100%)' },
  { name: 'Northern Lights', value: 'linear-gradient(135deg, #43cea2 0%, #185a9d 100%)' },
  { name: 'Deep Space', value: 'linear-gradient(135deg, #000428 0%, #004e92 100%)' },
  { name: 'Emerald', value: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)' },
  { name: 'Berry', value: 'linear-gradient(135deg, #8E2DE2 0%, #4A00E0 100%)' },
  { name: 'Coral', value: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)' },
];

export const SettingsApp: React.FC<SettingsAppProps> = () => {
  // Read/write the live context state directly: the window content is created
  // once and kept alive, so a local copy of the settings would go stale the
  // moment the theme changes from anywhere else.
  const { settings, setSettings, setWallpaper, wallpaper, globalWindowTheme, isDarkMode } = useWindows();

  const handleThemeChange = (theme: 'light' | 'dark') => {
    setSettings({ ...settings, theme });
  };

  const handleToggleChange = (key: keyof SettingsType, value: boolean | number) => {
    setSettings({ ...settings, [key]: value });
  };

  const handleWallpaperChange = (value: string) => {
    setWallpaper(value);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 pb-2">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Settings</h2>
      </div>

      <Tabs defaultValue="appearance" className="flex-1 flex flex-col px-6 overflow-hidden">
        <TabsList className="mb-6">
          <TabsTrigger value="appearance" className="flex items-center gap-2">
            <Palette size={16} />
            <span>Appearance</span>
          </TabsTrigger>
          <TabsTrigger value="wallpaper" className="flex items-center gap-2">
            <Monitor size={16} />
            <span>Wallpaper</span>
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
                    value={settings.transparency ?? 50}
                    onChange={(e) => handleToggleChange('transparency', parseInt(e.target.value))}
                    className="w-full accent-blue-500"
                  />
                  <span className="text-sm text-gray-600 dark:text-gray-400 w-8">{settings.transparency ?? 50}%</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-gray-900 dark:text-gray-100">Animations</span>
                </div>
                <Switch
                  checked={settings.animations !== false}
                  onCheckedChange={(checked) => handleToggleChange('animations', checked)}
                />
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="wallpaper" className="space-y-6 overflow-y-auto flex-1 pr-2">
          <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-6 backdrop-blur-sm">
            <h3 className="text-lg font-medium mb-2 text-gray-900 dark:text-gray-100">Desktop Background</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Choose a background for your desktop</p>
            <div className="grid grid-cols-4 gap-3">
              {WALLPAPER_PRESETS.map(preset => {
                const isActive = wallpaper === preset.value || (!wallpaper && preset.value === '#0078D4');
                const isGradient = preset.value.startsWith('linear-gradient(');
                return (
                  <button
                    key={preset.name}
                    className={`relative w-full aspect-video rounded-lg border-2 transition-all hover:scale-105 overflow-hidden ${
                      isActive
                        ? 'border-blue-500 ring-2 ring-blue-500 shadow-lg'
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                    }`}
                    style={isGradient ? { background: preset.value } : { backgroundColor: preset.value }}
                    onClick={() => handleWallpaperChange(preset.value)}
                  >
                    <span className="absolute bottom-1 left-0 right-0 text-[10px] text-white font-medium drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] text-center">
                      {preset.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-6 backdrop-blur-sm">
            <h3 className="text-lg font-medium mb-2 text-gray-900 dark:text-gray-100">Current</h3>
            <div
              className="w-full h-24 rounded-lg border border-gray-200 dark:border-gray-700"
              style={(() => {
                const wp = wallpaper || '#0078D4';
                if (wp.startsWith('linear-gradient(') || wp.startsWith('radial-gradient(')) return { background: wp };
                if (wp.startsWith('#') || wp.startsWith('rgb')) return { backgroundColor: wp };
                return { backgroundImage: `url(${wp})`, backgroundSize: 'cover' as const, backgroundPosition: 'center' };
              })()}
            />
          </div>

          <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-6 backdrop-blur-sm">
            <h3 className="text-lg font-medium mb-2 text-gray-900 dark:text-gray-100">Window Accent</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">Windows automatically match your wallpaper</p>
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-lg border-2 border-white dark:border-gray-600 shadow-md"
                style={{ background: getTheme(globalWindowTheme, isDarkMode).headerBg || '#0078D4' }}
              />
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 capitalize">{globalWindowTheme}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Applied to all windows</p>
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
                  onCheckedChange={(checked) => handleToggleChange('notifications', checked)}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 pb-4 sticky bottom-0 bg-white dark:bg-gray-900">
            <p className="text-sm text-gray-600 dark:text-gray-400">Changes are applied automatically</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
