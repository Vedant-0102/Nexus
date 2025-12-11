import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { TrendingUp, Copy, Check } from 'lucide-react';

interface Palette {
  id: number;
  name: string;
  colors: string[];
}

export const TrendingPalettes: React.FC = () => {
  const { toast } = useToast();
  const [copiedColor, setCopiedColor] = useState<string | null>(null);
  const [hoveredColor, setHoveredColor] = useState<string | null>(null);

  const trendingPalettes: Palette[] = [
    { id: 1, name: "Earthy Forest Hues", colors: ["#8FBC8F", "#9ACD32", "#556B2F", "#2F4F2F"] },
    { id: 2, name: "Soft Sand", colors: ["#F5DEB3", "#DEB887", "#D2B48C", "#BC9A6A"] },
    { id: 3, name: "Ocean Blue Serenity", colors: ["#87CEEB", "#4682B4", "#191970", "#000080"] },
    { id: 4, name: "Watermelon Sorbet", colors: ["#FFB6C1", "#FF69B4", "#FF1493", "#32CD32"] },
    { id: 5, name: "Black & Gold Elegance", colors: ["#000000", "#191970", "#FFD700", "#F5F5DC"] },
    { id: 6, name: "Fresh Greens", colors: ["#228B22", "#32CD32", "#90EE90", "#F0FFF0"] },
    { id: 7, name: "Bold Berry", colors: ["#FFB6C1", "#FF69B4", "#DC143C", "#8B0000"] },
    { id: 8, name: "Autumn Harvest", colors: ["#DAA520", "#CD853F", "#8B4513", "#F5F5DC"] },
    { id: 9, name: "Ocean Pearl Delight", colors: ["#008B8B", "#20B2AA", "#F0F8FF", "#FFA07A", "#FF7F50"] },
    { id: 10, name: "Purple Dream", colors: ["#4B0082", "#8A2BE2", "#DDA0DD", "#F8F8FF"] },
    { id: 11, name: "Cozy Neutral Retreat", colors: ["#F5F5DC", "#D2B48C", "#98FB98", "#556B2F"] },
    { id: 12, name: "Pastel Rainbow", colors: ["#87CEEB", "#FFB6C1", "#FFA07A", "#FFFF99", "#90EE90"] },
    { id: 13, name: "Sunset Vibes", colors: ["#FF6B6B", "#FF8E53", "#FF6B35", "#F7931E", "#FFD23F"] },
    { id: 14, name: "Midnight Blues", colors: ["#0F3460", "#533A7B", "#7209B7", "#A663CC", "#B19CD9"] },
    { id: 15, name: "Forest Retreat", colors: ["#2D5016", "#4A7C59", "#7BA05B", "#9ACD32", "#CCFF90"] },
    { id: 16, name: "Rose Gold Elegance", colors: ["#E8B4B8", "#D4AF37", "#B8860B", "#CD853F", "#DEB887"] },
    { id: 17, name: "Mint Fresh", colors: ["#98FB98", "#90EE90", "#00FA9A", "#00CED1", "#20B2AA"] },
    { id: 18, name: "Coral Sunset", colors: ["#FF7F50", "#FF6347", "#FF4500", "#DC143C", "#B22222"] },
    { id: 19, name: "Lavender Fields", colors: ["#E6E6FA", "#D8BFD8", "#DDA0DD", "#DA70D6", "#FF69B4"] },
    { id: 20, name: "Golden Hour", colors: ["#FFD700", "#FFA500", "#FF8C00", "#FF6347", "#FF1493"] },
    { id: 21, name: "Deep Ocean", colors: ["#000080", "#191970", "#0000CD", "#4169E1", "#6495ED"] },
    { id: 22, name: "Cherry Blossom", colors: ["#FFB6C1", "#FFC0CB", "#FF69B4", "#DC143C", "#8B0000"] },
    { id: 23, name: "Emerald Garden", colors: ["#50C878", "#00FF7F", "#32CD32", "#228B22", "#006400"] },
    { id: 24, name: "Peach Paradise", colors: ["#FFDAB9", "#F4A460", "#CD853F", "#D2691E", "#A0522D"] },
    { id: 25, name: "Royal Purple", colors: ["#8A2BE2", "#9932CC", "#9400D3", "#4B0082", "#6A0DAD"] },
    { id: 26, name: "Tropical Blue", colors: ["#00CED1", "#48CAE4", "#0077B6", "#023E8A", "#03045E"] },
    { id: 27, name: "Warm Earth", colors: ["#D2691E", "#CD853F", "#BC8F8F", "#A0522D", "#8B4513"] },
    { id: 28, name: "Electric Neon", colors: ["#00FF00", "#00FFFF", "#FF00FF", "#FFFF00", "#FF1493"] },
    { id: 29, name: "Soft Lavender", colors: ["#F8F8FF", "#E6E6FA", "#DDA0DD", "#D8BFD8", "#DA70D6"] },
    { id: 30, name: "Fire Orange", colors: ["#FF4500", "#FF6347", "#FF7F50", "#FFA500", "#FFD700"] },
  ];

  const copyColor = (color: string, paletteId: number, colorIndex: number) => {
    navigator.clipboard.writeText(color);
    setCopiedColor(`${paletteId}-${colorIndex}`);
    toast({
      title: `Copied ${color}!`,
      duration: 1000,
    });
  };

  const copyPalette = (palette: Palette, e: React.MouseEvent) => {
    e.stopPropagation();
    const colorString = palette.colors.join(', ');
    navigator.clipboard.writeText(colorString);
    setCopiedColor(`palette-${palette.id}`);
    toast({
      title: "Palette copied!",
      description: colorString,
    });
    setTimeout(() => setCopiedColor(null), 2000);
  };

  const isLightColor = (hex: string) => {
    const color = hex.replace('#', '');
    const r = parseInt(color.substr(0, 2), 16);
    const g = parseInt(color.substr(2, 2), 16);
    const b = parseInt(color.substr(4, 2), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 128;
  };

  return (
    <div className="h-full w-full bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 p-6 overflow-auto">
      <div className="flex items-center gap-2 mb-6">
        <TrendingUp className="h-6 w-6 text-blue-600" />
        <h2 className="text-2xl font-bold">Trending Palettes</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {trendingPalettes.map((palette) => (
          <Card
            key={palette.id}
            className="overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer group"
          >
            {/* Color Swatches */}
            <div className="h-24 relative">
              <div className="flex h-full">
                {palette.colors.map((color, index) => {
                  const isLight = isLightColor(color);
                  const colorKey = `${palette.id}-${index}`;
                  const isCopied = copiedColor === colorKey;
                  const isHovered = hoveredColor === colorKey;

                  return (
                    <div
                      key={index}
                      className="flex-1 cursor-pointer relative transition-all duration-200 hover:scale-105 hover:z-10"
                      style={{ backgroundColor: color }}
                      onClick={(e) => {
                        e.stopPropagation();
                        copyColor(color, palette.id, index);
                      }}
                      onMouseEnter={() => setHoveredColor(colorKey)}
                      onMouseLeave={() => {
                        setHoveredColor(null);
                        setCopiedColor(null);
                      }}
                      title={color}
                    >
                      {/* Hex Code Overlay */}
                      <div
                        className={`absolute inset-0 flex items-center justify-center transition-opacity duration-200 p-1 ${
                          isCopied && isHovered
                            ? 'opacity-100'
                            : isCopied
                            ? 'opacity-100'
                            : 'opacity-0 group-hover:opacity-100'
                        }`}
                      >
                        {isCopied ? (
                          <div
                            className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-bold ${
                              isLight
                                ? 'text-green-600 bg-white/95 shadow-sm'
                                : 'text-green-400 bg-black/80'
                            }`}
                          >
                            <Check className="w-3 h-3" />
                          </div>
                        ) : (
                          <span
                            className={`text-xs font-mono font-medium px-2 py-1 rounded ${
                              isLight
                                ? 'text-slate-900 bg-white/90 shadow-sm'
                                : 'text-white bg-black/70'
                            }`}
                          >
                            {color.replace('#', '').toUpperCase()}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Palette Info */}
            <div className="p-4">
              <h3 className="font-bold text-slate-800 dark:text-white text-sm truncate mb-3 uppercase tracking-wide">
                {palette.name}
              </h3>

              {/* Copy Palette Button */}
              <button
                onClick={(e) => copyPalette(palette, e)}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-slate-900 dark:bg-slate-700 text-white hover:bg-blue-600 dark:hover:bg-blue-600 text-xs font-bold transition-all duration-200 rounded"
              >
                {copiedColor === `palette-${palette.id}` ? (
                  <>
                    <Check className="w-3 h-3 text-green-400" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    Copy Palette
                  </>
                )}
              </button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
