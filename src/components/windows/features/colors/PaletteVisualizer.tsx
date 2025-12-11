import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Eye, Shuffle, Copy, Check } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface ColorPalette {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
  muted: string;
}

const PRESET_PALETTES: { name: string; palette: ColorPalette }[] = [
  {
    name: 'Ocean Blue',
    palette: { primary: '#0EA5E9', secondary: '#0284C7', accent: '#F59E0B', background: '#FFFFFF', text: '#1E293B', muted: '#64748B' }
  },
  {
    name: 'Forest Green',
    palette: { primary: '#10B981', secondary: '#059669', accent: '#F59E0B', background: '#FFFFFF', text: '#1E293B', muted: '#64748B' }
  },
  {
    name: 'Sunset Orange',
    palette: { primary: '#F97316', secondary: '#EA580C', accent: '#8B5CF6', background: '#FFFFFF', text: '#1E293B', muted: '#64748B' }
  },
  {
    name: 'Royal Purple',
    palette: { primary: '#8B5CF6', secondary: '#7C3AED', accent: '#F59E0B', background: '#FFFFFF', text: '#1E293B', muted: '#64748B' }
  },
  {
    name: 'Dark Mode',
    palette: { primary: '#3B82F6', secondary: '#2563EB', accent: '#F59E0B', background: '#0F172A', text: '#F1F5F9', muted: '#94A3B8' }
  },
  {
    name: 'Mint Fresh',
    palette: { primary: '#14B8A6', secondary: '#0D9488', accent: '#EC4899', background: '#FFFFFF', text: '#1E293B', muted: '#64748B' }
  },
  {
    name: 'Crimson Red',
    palette: { primary: '#DC2626', secondary: '#B91C1C', accent: '#FBBF24', background: '#FFFFFF', text: '#1E293B', muted: '#64748B' }
  },
  {
    name: 'Midnight Blue',
    palette: { primary: '#1E40AF', secondary: '#1E3A8A', accent: '#F59E0B', background: '#0F172A', text: '#F1F5F9', muted: '#94A3B8' }
  },
];

export const PaletteVisualizer: React.FC = () => {
  const { toast } = useToast();
  const [customColors, setCustomColors] = useState<ColorPalette>(PRESET_PALETTES[0].palette);
  const [copiedCode, setCopiedCode] = useState(false);
  const [activeTab, setActiveTab] = useState('palettes');

  const updateColor = (key: keyof ColorPalette, value: string) => {
    setCustomColors(prev => ({ ...prev, [key]: value }));
  };

  const randomizePalette = () => {
    const randomPalette = PRESET_PALETTES[Math.floor(Math.random() * PRESET_PALETTES.length)];
    setCustomColors(randomPalette.palette);
  };

  const copyPalette = () => {
    const code = JSON.stringify(customColors, null, 2);
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    toast({ title: 'Palette copied to clipboard!' });
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const colors = customColors;

  return (
    <div className="h-full w-full bg-white dark:bg-gray-900 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
        <div className="flex items-center gap-2">
          <Eye className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Palette Visualizer</h2>
        </div>
        <div className="flex gap-2">
          <Button onClick={randomizePalette} size="sm" variant="outline">
            <Shuffle className="h-4 w-4 mr-2" />
            Random
          </Button>
          <Button onClick={copyPalette} size="sm">
            {copiedCode ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
            Copy
          </Button>
        </div>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
        <TabsList className="mx-4 mt-2">
          <TabsTrigger value="palettes">Palettes</TabsTrigger>
          <TabsTrigger value="visualizers">Visualizers</TabsTrigger>
        </TabsList>

        {/* Palettes Tab */}
        <TabsContent value="palettes" className="flex-1 p-4 overflow-auto mt-0">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {PRESET_PALETTES.map((preset, idx) => (
              <Card
                key={idx}
                className="p-4 cursor-pointer hover:shadow-lg transition-all border-2 hover:border-indigo-500"
                onClick={() => setCustomColors(preset.palette)}
              >
                <div className="flex gap-2 mb-3">
                  {Object.values(preset.palette).map((color, i) => (
                    <div key={i} className="flex-1 h-16 rounded" style={{ backgroundColor: color }} />
                  ))}
                </div>
                <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100">{preset.name}</h3>
                <div className="mt-2 space-y-1">
                  {(Object.entries(preset.palette) as [keyof ColorPalette, string][]).map(([key, value]) => (
                    <div key={key} className="flex justify-between text-xs">
                      <span className="text-gray-600 dark:text-gray-400 capitalize">{key}:</span>
                      <span className="font-mono text-gray-900 dark:text-gray-100">{value}</span>
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>

          {/* Custom Color Editor */}
          <Card className="p-4 mt-4">
            <h3 className="font-semibold mb-3 text-gray-900 dark:text-gray-100">Custom Colors</h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(Object.keys(colors) as Array<keyof ColorPalette>).map((key) => (
                <div key={key}>
                  <label className="text-sm font-medium mb-2 block capitalize text-gray-900 dark:text-gray-100">{key}</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={colors[key]}
                      onChange={(e) => updateColor(key, e.target.value)}
                      className="w-16 h-10 rounded border-2 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={colors[key]}
                      onChange={(e) => updateColor(key, e.target.value)}
                      className="flex-1 px-3 py-2 text-sm font-mono border-2 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        {/* Visualizers Tab */}
        <TabsContent value="visualizers" className="flex-1 overflow-hidden mt-0">
          <Tabs defaultValue="landing" className="h-full flex flex-col p-4">
            <TabsList className="mb-3">
              <TabsTrigger value="landing">Landing</TabsTrigger>
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
              <TabsTrigger value="ecommerce">E-Commerce</TabsTrigger>
              <TabsTrigger value="blog">Blog</TabsTrigger>
              <TabsTrigger value="app">Mobile App</TabsTrigger>
              <TabsTrigger value="saas">SaaS</TabsTrigger>
              <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-auto">
              <TabsContent value="landing" className="h-full mt-0">
                <LandingPagePreview colors={colors} />
              </TabsContent>

              <TabsContent value="dashboard" className="h-full mt-0">
                <DashboardPreview colors={colors} />
              </TabsContent>

              <TabsContent value="ecommerce" className="h-full mt-0">
                <EcommercePreview colors={colors} />
              </TabsContent>

              <TabsContent value="blog" className="h-full mt-0">
                <BlogPreview colors={colors} />
              </TabsContent>

              <TabsContent value="app" className="h-full mt-0">
                <MobileAppPreview colors={colors} />
              </TabsContent>

              <TabsContent value="saas" className="h-full mt-0">
                <SaaSPreview colors={colors} />
              </TabsContent>

              <TabsContent value="portfolio" className="h-full mt-0">
                <PortfolioPreview colors={colors} />
              </TabsContent>
            </div>
          </Tabs>
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Landing Page Preview
const LandingPagePreview: React.FC<{ colors: ColorPalette }> = ({ colors }) => (
  <Card className="p-8 h-full overflow-auto" style={{ backgroundColor: colors.background }}>
    <div className="max-w-6xl mx-auto">
      {/* Navigation */}
      <div className="flex items-center justify-between mb-16 pb-4 border-b" style={{ borderColor: colors.primary + '20' }}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg" style={{ backgroundColor: colors.primary }} />
          <span className="text-xl font-bold" style={{ color: colors.text }}>Brand</span>
        </div>
        <div className="flex gap-6 items-center">
          <button className="text-sm font-medium hover:underline" style={{ color: colors.muted }}>Features</button>
          <button className="text-sm font-medium hover:underline" style={{ color: colors.muted }}>Pricing</button>
          <button className="text-sm font-medium hover:underline" style={{ color: colors.muted }}>About</button>
          <button className="px-4 py-2 rounded-lg font-semibold text-white text-sm" style={{ backgroundColor: colors.primary }}>
            Sign Up
          </button>
        </div>
      </div>

      {/* Hero Section */}
      <div className="text-center mb-20">
        <div className="inline-block px-4 py-2 rounded-full text-sm font-semibold mb-6" style={{ backgroundColor: colors.accent + '20', color: colors.accent }}>
          ✨ New Product Launch
        </div>
        <h1 className="text-6xl font-bold mb-6" style={{ color: colors.text }}>
          Build Something <span style={{ color: colors.primary }}>Amazing</span>
        </h1>
        <p className="text-xl mb-10 max-w-2xl mx-auto" style={{ color: colors.muted }}>
          The ultimate platform for creators and innovators to bring their ideas to life with powerful tools and seamless workflows.
        </p>
        <div className="flex gap-4 justify-center mb-6">
          <button className="px-8 py-4 rounded-lg font-semibold text-white shadow-lg hover:shadow-xl transition-all" style={{ backgroundColor: colors.primary }}>
            Get Started Free
          </button>
          <button className="px-8 py-4 rounded-lg font-semibold border-2 hover:shadow-lg transition-all" style={{ borderColor: colors.primary, color: colors.primary }}>
            Watch Demo
          </button>
        </div>
        <p className="text-sm" style={{ color: colors.muted }}>No credit card required • Free 14-day trial</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-8 mb-20 text-center">
        {[
          { value: '50K+', label: 'Active Users' },
          { value: '99.9%', label: 'Uptime' },
          { value: '4.9/5', label: 'Rating' },
          { value: '24/7', label: 'Support' }
        ].map((stat, idx) => (
          <div key={idx}>
            <div className="text-4xl font-bold mb-2" style={{ color: colors.primary }}>{stat.value}</div>
            <div className="text-sm" style={{ color: colors.muted }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Features Grid */}
      <div className="mb-20">
        <h2 className="text-4xl font-bold text-center mb-12" style={{ color: colors.text }}>Everything You Need</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { icon: '⚡', title: 'Lightning Fast', desc: 'Optimized performance for instant results' },
            { icon: '🔒', title: 'Secure by Default', desc: 'Enterprise-grade security built in' },
            { icon: '📈', title: 'Scalable', desc: 'Grows with your business needs' },
            { icon: '🎨', title: 'Beautiful Design', desc: 'Stunning UI that users love' },
            { icon: '🔄', title: 'Auto Sync', desc: 'Real-time synchronization across devices' },
            { icon: '💬', title: '24/7 Support', desc: 'Expert help whenever you need it' }
          ].map((feature, idx) => (
            <div key={idx} className="p-6 rounded-xl border-2 hover:shadow-lg transition-all" style={{ borderColor: colors.primary + '30', backgroundColor: colors.primary + '05' }}>
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-bold mb-2" style={{ color: colors.text }}>{feature.title}</h3>
              <p className="text-sm" style={{ color: colors.muted }}>{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Social Proof */}
      <div className="mb-20 text-center">
        <p className="text-sm mb-6" style={{ color: colors.muted }}>Trusted by leading companies worldwide</p>
        <div className="flex justify-center gap-12 items-center">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="w-24 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: colors.primary + '20' }}>
              <span className="font-bold text-sm" style={{ color: colors.primary }}>LOGO</span>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="text-center p-16 rounded-2xl" style={{ backgroundColor: colors.primary }}>
        <h2 className="text-4xl font-bold mb-4 text-white">Ready to get started?</h2>
        <p className="text-lg mb-8 text-white opacity-90">Join thousands of satisfied customers today</p>
        <button className="px-10 py-4 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all text-lg" style={{ backgroundColor: colors.accent, color: colors.background }}>
          Start Your Free Trial
        </button>
      </div>
    </div>
  </Card>
);

// Dashboard Preview
const DashboardPreview: React.FC<{ colors: ColorPalette }> = ({ colors }) => (
  <Card className="p-6 h-full overflow-auto" style={{ backgroundColor: colors.background }}>
    {/* Header */}
    <div className="flex items-center justify-between mb-8 pb-4 border-b" style={{ borderColor: colors.primary + '20' }}>
      <div>
        <h2 className="text-2xl font-bold mb-1" style={{ color: colors.text }}>Dashboard</h2>
        <p className="text-sm" style={{ color: colors.muted }}>Welcome back, John Doe!</p>
      </div>
      <div className="flex gap-2">
        <button className="px-4 py-2 rounded-lg text-sm font-medium border" style={{ borderColor: colors.primary + '30', color: colors.text }}>
          Export
        </button>
        <button className="px-4 py-2 rounded-lg text-sm font-medium text-white" style={{ backgroundColor: colors.primary }}>
          Add Widget
        </button>
      </div>
    </div>

    {/* Stats Cards */}
    <div className="grid grid-cols-4 gap-4 mb-8">
      {[
        { label: 'Total Users', value: '12,345', change: '+12%', icon: '👥' },
        { label: 'Revenue', value: '$45,678', change: '+8%', icon: '💰' },
        { label: 'Active Now', value: '1,234', change: '+23%', icon: '⚡' },
        { label: 'Conversion', value: '3.2%', change: '+0.5%', icon: '📈' }
      ].map((stat, idx) => (
        <div key={idx} className="p-5 rounded-lg border-2 hover:shadow-lg transition-all" style={{ borderColor: colors.primary + '30', backgroundColor: colors.primary + '05' }}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-2xl">{stat.icon}</span>
            <span className="text-xs font-semibold px-2 py-1 rounded" style={{ backgroundColor: colors.accent + '20', color: colors.accent }}>
              {stat.change}
            </span>
          </div>
          <p className="text-xs mb-1" style={{ color: colors.muted }}>{stat.label}</p>
          <p className="text-3xl font-bold" style={{ color: colors.text }}>{stat.value}</p>
        </div>
      ))}
    </div>

    {/* Charts */}
    <div className="grid md:grid-cols-2 gap-6 mb-6">
      <div className="p-6 rounded-lg border-2" style={{ borderColor: colors.primary + '30' }}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-semibold text-lg" style={{ color: colors.text }}>Revenue Overview</h3>
          <select className="text-xs px-2 py-1 rounded border" style={{ borderColor: colors.primary + '30', color: colors.text }}>
            <option>Last 7 days</option>
          </select>
        </div>
        <div className="flex items-end justify-between h-48 gap-2">
          {[65, 59, 80, 81, 56, 72, 88].map((value, idx) => (
            <div key={idx} className="flex-1 flex flex-col items-center gap-2">
              <div className="w-full rounded-t transition-all hover:opacity-80 cursor-pointer relative group" style={{ height: `${value}%`, backgroundColor: colors.primary }}>
                <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-xs px-2 py-1 rounded">
                  ${value * 100}
                </div>
              </div>
              <span className="text-xs" style={{ color: colors.muted }}>W{idx + 1}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="p-6 rounded-lg border-2" style={{ borderColor: colors.primary + '30' }}>
        <h3 className="font-semibold text-lg mb-6" style={{ color: colors.text }}>Traffic Sources</h3>
        <div className="space-y-4">
          {[
            { source: 'Organic Search', value: 45, color: colors.primary },
            { source: 'Direct', value: 30, color: colors.secondary },
            { source: 'Social Media', value: 15, color: colors.accent },
            { source: 'Referral', value: 10, color: colors.muted }
          ].map((item, idx) => (
            <div key={idx}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium" style={{ color: colors.text }}>{item.source}</span>
                <span className="text-sm font-bold" style={{ color: colors.text }}>{item.value}%</span>
              </div>
              <div className="w-full h-2 rounded-full" style={{ backgroundColor: colors.primary + '20' }}>
                <div className="h-full rounded-full transition-all" style={{ width: `${item.value}%`, backgroundColor: item.color }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>

    {/* Recent Activity & Tasks */}
    <div className="grid md:grid-cols-2 gap-6">
      <div className="p-6 rounded-lg border-2" style={{ borderColor: colors.primary + '30' }}>
        <h3 className="font-semibold text-lg mb-4" style={{ color: colors.text }}>Recent Activity</h3>
        <div className="space-y-3">
          {[
            { action: 'New user registered', time: '2 min ago', icon: '👤' },
            { action: 'Payment received', time: '15 min ago', icon: '💳' },
            { action: 'Report generated', time: '1 hour ago', icon: '📊' },
            { action: 'System backup completed', time: '2 hours ago', icon: '💾' }
          ].map((activity, idx) => (
            <div key={idx} className="flex items-center gap-3 p-3 rounded-lg hover:shadow-md transition-all" style={{ backgroundColor: colors.primary + '10' }}>
              <span className="text-2xl">{activity.icon}</span>
              <div className="flex-1">
                <p className="text-sm font-medium" style={{ color: colors.text }}>{activity.action}</p>
                <p className="text-xs" style={{ color: colors.muted }}>{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="p-6 rounded-lg border-2" style={{ borderColor: colors.primary + '30' }}>
        <h3 className="font-semibold text-lg mb-4" style={{ color: colors.text }}>Quick Actions</h3>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Add User', icon: '➕' },
            { label: 'Generate Report', icon: '📄' },
            { label: 'Send Email', icon: '✉️' },
            { label: 'View Analytics', icon: '📊' }
          ].map((action, idx) => (
            <button key={idx} className="p-4 rounded-lg border-2 hover:shadow-lg transition-all text-center" style={{ borderColor: colors.primary + '30', backgroundColor: colors.primary + '05' }}>
              <div className="text-3xl mb-2">{action.icon}</div>
              <span className="text-sm font-medium" style={{ color: colors.text }}>{action.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  </Card>
);

// E-Commerce Preview
const EcommercePreview: React.FC<{ colors: ColorPalette }> = ({ colors }) => (
  <Card className="p-6 h-full overflow-auto" style={{ backgroundColor: colors.background }}>
    {/* Header */}
    <div className="flex items-center justify-between mb-8 pb-4 border-b" style={{ borderColor: colors.primary + '20' }}>
      <div className="flex items-center gap-8">
        <h2 className="text-2xl font-bold" style={{ color: colors.text }}>Shop</h2>
        <div className="flex gap-6">
          <button className="text-sm font-medium hover:underline" style={{ color: colors.muted }}>New Arrivals</button>
          <button className="text-sm font-medium hover:underline" style={{ color: colors.muted }}>Best Sellers</button>
          <button className="text-sm font-medium hover:underline" style={{ color: colors.muted }}>Sale</button>
        </div>
      </div>
      <div className="flex gap-3 items-center">
        <button className="p-2 rounded-lg hover:shadow-md transition-all" style={{ backgroundColor: colors.primary + '10' }}>
          <span style={{ color: colors.primary }}>🔍</span>
        </button>
        <button className="p-2 rounded-lg hover:shadow-md transition-all" style={{ backgroundColor: colors.primary + '10' }}>
          <span style={{ color: colors.primary }}>❤️</span>
        </button>
        <button className="px-4 py-2 rounded-lg font-semibold text-white relative" style={{ backgroundColor: colors.primary }}>
          🛒 Cart (3)
          <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full text-xs flex items-center justify-center" style={{ backgroundColor: colors.accent, color: 'white' }}>
            3
          </span>
        </button>
      </div>
    </div>

    {/* Banner */}
    <div className="mb-8 p-12 rounded-2xl text-center" style={{ backgroundColor: colors.primary }}>
      <h2 className="text-4xl font-bold mb-4 text-white">Summer Sale</h2>
      <p className="text-xl text-white opacity-90 mb-6">Up to 50% off on selected items</p>
      <button className="px-8 py-3 rounded-lg font-semibold" style={{ backgroundColor: colors.accent, color: colors.background }}>
        Shop Now
      </button>
    </div>

    {/* Filters */}
    <div className="flex items-center justify-between mb-6">
      <div className="flex gap-2">
        {['All', 'Electronics', 'Fashion', 'Home', 'Sports'].map((cat, idx) => (
          <button key={idx} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${idx === 0 ? 'text-white' : ''}`} style={{ backgroundColor: idx === 0 ? colors.primary : colors.primary + '10', color: idx === 0 ? 'white' : colors.primary }}>
            {cat}
          </button>
        ))}
      </div>
      <select className="px-4 py-2 rounded-lg border-2 text-sm" style={{ borderColor: colors.primary + '30', color: colors.text }}>
        <option>Sort by: Featured</option>
        <option>Price: Low to High</option>
        <option>Price: High to Low</option>
      </select>
    </div>

    {/* Product Grid */}
    <div className="grid md:grid-cols-4 gap-6">
      {[
        { name: 'Wireless Headphones', price: 99.99, rating: 4.5, reviews: 128 },
        { name: 'Smart Watch', price: 249.99, rating: 4.8, reviews: 256, badge: 'Best Seller' },
        { name: 'Laptop Stand', price: 49.99, rating: 4.3, reviews: 89 },
        { name: 'USB-C Hub', price: 79.99, rating: 4.6, reviews: 167 },
        { name: 'Mechanical Keyboard', price: 149.99, rating: 4.7, reviews: 342, badge: 'New' },
        { name: 'Webcam HD', price: 89.99, rating: 4.4, reviews: 203 },
        { name: 'Desk Lamp', price: 39.99, rating: 4.2, reviews: 94 },
        { name: 'Phone Case', price: 19.99, rating: 4.9, reviews: 512 }
      ].map((product, idx) => (
        <div key={idx} className="rounded-lg border-2 overflow-hidden hover:shadow-xl transition-all group cursor-pointer" style={{ borderColor: colors.primary + '20' }}>
          <div className="relative h-48 flex items-center justify-center" style={{ backgroundColor: colors.primary + '10' }}>
            <span className="text-5xl group-hover:scale-110 transition-transform">📦</span>
            {product.badge && (
              <div className="absolute top-2 right-2 px-2 py-1 rounded text-xs font-semibold" style={{ backgroundColor: colors.accent, color: 'white' }}>
                {product.badge}
              </div>
            )}
            <button className="absolute top-2 left-2 w-8 h-8 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" style={{ backgroundColor: 'white', color: colors.primary }}>
              ❤️
            </button>
          </div>
          <div className="p-4">
            <h3 className="font-bold mb-2 text-sm" style={{ color: colors.text }}>{product.name}</h3>
            <div className="flex items-center gap-1 mb-2">
              <span style={{ color: colors.accent }}>{'⭐'.repeat(Math.floor(product.rating))}</span>
              <span className="text-xs" style={{ color: colors.muted }}>({product.reviews})</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xl font-bold" style={{ color: colors.primary }}>${product.price}</span>
              <button className="px-3 py-2 rounded-lg font-semibold text-white text-xs hover:shadow-lg transition-all" style={{ backgroundColor: colors.accent }}>
                Add
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  </Card>
);

// Blog Preview
const BlogPreview: React.FC<{ colors: ColorPalette }> = ({ colors }) => (
  <Card className="p-8 h-full overflow-auto" style={{ backgroundColor: colors.background }}>
    <div className="max-w-4xl mx-auto">
      {/* Blog Header */}
      <div className="flex items-center justify-between mb-12 pb-6 border-b" style={{ borderColor: colors.primary + '20' }}>
        <h1 className="text-3xl font-bold" style={{ color: colors.text }}>The Blog</h1>
        <div className="flex gap-6">
          <button className="text-sm font-medium hover:underline" style={{ color: colors.muted }}>Latest</button>
          <button className="text-sm font-medium hover:underline" style={{ color: colors.muted }}>Popular</button>
          <button className="text-sm font-medium hover:underline" style={{ color: colors.muted }}>Categories</button>
          <button className="px-4 py-2 rounded-lg font-semibold text-white text-sm" style={{ backgroundColor: colors.primary }}>
            Subscribe
          </button>
        </div>
      </div>

      {/* Featured Article */}
      <div className="mb-12 p-8 rounded-2xl" style={{ backgroundColor: colors.primary + '10' }}>
        <div className="flex gap-2 mb-4">
          <span className="px-3 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: colors.primary + '30', color: colors.primary }}>
            Featured
          </span>
          <span className="px-3 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: colors.accent + '20', color: colors.accent }}>
            Technology
          </span>
        </div>
        <h2 className="text-4xl font-bold mb-4" style={{ color: colors.text }}>
          The Future of Web Design in 2025
        </h2>
        <p className="text-lg mb-6" style={{ color: colors.muted }}>
          Explore the latest trends, tools, and techniques that are shaping the future of web design and development.
        </p>
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-full" style={{ backgroundColor: colors.secondary }} />
          <div>
            <p className="font-semibold text-sm" style={{ color: colors.text }}>John Doe</p>
            <p className="text-xs" style={{ color: colors.muted }}>Dec 6, 2024 • 8 min read</p>
          </div>
        </div>
        <button className="px-6 py-3 rounded-lg font-semibold text-white" style={{ backgroundColor: colors.primary }}>
          Read Article
        </button>
      </div>

      {/* Article Grid */}
      <h3 className="text-2xl font-bold mb-6" style={{ color: colors.text }}>Latest Articles</h3>
      <div className="grid md:grid-cols-2 gap-6 mb-12">
        {[
          { title: 'Getting Started with React Hooks', category: 'Development', time: '5 min read', date: 'Dec 5, 2024' },
          { title: 'CSS Grid vs Flexbox: When to Use What', category: 'CSS', time: '7 min read', date: 'Dec 4, 2024' },
          { title: 'Building Accessible Web Applications', category: 'Accessibility', time: '6 min read', date: 'Dec 3, 2024' },
          { title: 'The Art of Color Theory in UI Design', category: 'Design', time: '4 min read', date: 'Dec 2, 2024' }
        ].map((article, idx) => (
          <div key={idx} className="rounded-xl border-2 overflow-hidden hover:shadow-xl transition-all cursor-pointer group" style={{ borderColor: colors.primary + '20' }}>
            <div className="h-48 flex items-center justify-center group-hover:scale-105 transition-transform" style={{ backgroundColor: colors.primary + '20' }}>
              <span className="text-6xl">📝</span>
            </div>
            <div className="p-6">
              <div className="flex items-center gap-2 mb-3">
                <span className="px-2 py-1 rounded text-xs font-semibold" style={{ backgroundColor: colors.accent + '20', color: colors.accent }}>
                  {article.category}
                </span>
                <span className="text-xs" style={{ color: colors.muted }}>{article.time}</span>
              </div>
              <h3 className="text-xl font-bold mb-3" style={{ color: colors.text }}>{article.title}</h3>
              <div className="flex items-center justify-between">
                <span className="text-xs" style={{ color: colors.muted }}>{article.date}</span>
                <button className="text-sm font-semibold hover:underline" style={{ color: colors.primary }}>
                  Read More →
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Newsletter */}
      <div className="p-8 rounded-2xl text-center" style={{ backgroundColor: colors.primary }}>
        <h3 className="text-3xl font-bold mb-4 text-white">Never Miss an Update</h3>
        <p className="text-lg mb-6 text-white opacity-90">Subscribe to our newsletter for the latest articles and insights</p>
        <div className="flex gap-3 max-w-md mx-auto">
          <input
            type="email"
            placeholder="Enter your email"
            className="flex-1 px-4 py-3 rounded-lg"
            style={{ backgroundColor: 'white', color: colors.text }}
          />
          <button className="px-6 py-3 rounded-lg font-semibold" style={{ backgroundColor: colors.accent, color: colors.background }}>
            Subscribe
          </button>
        </div>
      </div>
    </div>
  </Card>
);

// Mobile App Preview
const MobileAppPreview: React.FC<{ colors: ColorPalette }> = ({ colors }) => (
  <div className="h-full flex items-center justify-center p-6" style={{ backgroundColor: colors.background }}>
    <div className="w-80 h-[600px] rounded-3xl border-8 shadow-2xl overflow-hidden relative" style={{ borderColor: colors.text + '40', backgroundColor: colors.background }}>
      {/* Status Bar */}
      <div className="h-8 flex items-center justify-between px-6 text-xs" style={{ backgroundColor: colors.primary, color: 'white' }}>
        <span>9:41</span>
        <span>📶 🔋</span>
      </div>

      {/* App Header */}
      <div className="p-4" style={{ backgroundColor: colors.primary }}>
        <h2 className="text-xl font-bold text-white mb-2">My App</h2>
        <div className="flex gap-2">
          <button className="flex-1 py-2 rounded-lg font-medium text-white" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
            Home
          </button>
          <button className="flex-1 py-2 rounded-lg font-medium" style={{ color: 'rgba(255,255,255,0.7)' }}>
            Explore
          </button>
          <button className="flex-1 py-2 rounded-lg font-medium" style={{ color: 'rgba(255,255,255,0.7)' }}>
            Profile
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4 pb-20">
        {[1, 2, 3].map((item) => (
          <div key={item} className="p-4 rounded-xl border" style={{ borderColor: colors.primary + '30', backgroundColor: colors.primary + '05' }}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-full" style={{ backgroundColor: colors.secondary }} />
              <div>
                <h3 className="font-semibold text-sm" style={{ color: colors.text }}>User {item}</h3>
                <p className="text-xs" style={{ color: colors.muted }}>2 hours ago</p>
              </div>
            </div>
            <p className="text-sm mb-3" style={{ color: colors.text }}>
              This is a sample post content that shows how your colors look in a mobile app interface.
            </p>
            <div className="flex gap-4 text-xs" style={{ color: colors.muted }}>
              <button style={{ color: colors.primary }}>❤️ Like</button>
              <button style={{ color: colors.primary }}>💬 Comment</button>
              <button style={{ color: colors.primary }}>🔗 Share</button>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Nav */}
      <div className="absolute bottom-0 left-0 right-0 h-16 border-t flex items-center justify-around" style={{ borderColor: colors.primary + '20', backgroundColor: colors.background }}>
        {['🏠', '🔍', '➕', '💬', '👤'].map((icon, idx) => (
          <button key={idx} className="text-2xl" style={{ color: idx === 0 ? colors.primary : colors.muted }}>
            {icon}
          </button>
        ))}
      </div>
    </div>
  </div>
);

// SaaS Preview
const SaaSPreview: React.FC<{ colors: ColorPalette }> = ({ colors }) => (
  <Card className="p-8 h-full overflow-auto" style={{ backgroundColor: colors.background }}>
    <div className="max-w-6xl mx-auto">
      {/* Hero Section */}
      <div className="text-center mb-16">
        <div className="inline-block px-4 py-2 rounded-full text-sm font-semibold mb-4" style={{ backgroundColor: colors.accent + '20', color: colors.accent }}>
          🚀 Now in Beta
        </div>
        <h1 className="text-6xl font-bold mb-6" style={{ color: colors.text }}>
          Scale Your Business with <span style={{ color: colors.primary }}>AI-Powered</span> Tools
        </h1>
        <p className="text-xl mb-8 max-w-2xl mx-auto" style={{ color: colors.muted }}>
          Join 10,000+ companies using our platform to automate workflows, analyze data, and grow faster.
        </p>
        <div className="flex gap-4 justify-center mb-8">
          <button className="px-8 py-4 rounded-lg font-semibold text-white shadow-lg hover:shadow-xl transition-all" style={{ backgroundColor: colors.primary }}>
            Start Free Trial
          </button>
          <button className="px-8 py-4 rounded-lg font-semibold border-2 hover:shadow-lg transition-all" style={{ borderColor: colors.primary, color: colors.primary }}>
            Watch Demo
          </button>
        </div>
        <p className="text-sm" style={{ color: colors.muted }}>No credit card required • 14-day free trial</p>
      </div>

      {/* Features */}
      <div className="grid md:grid-cols-3 gap-8 mb-16">
        {[
          { icon: '⚡', title: 'Lightning Fast', desc: 'Process millions of records in seconds' },
          { icon: '🔒', title: 'Enterprise Security', desc: 'SOC 2 Type II certified infrastructure' },
          { icon: '📊', title: 'Advanced Analytics', desc: 'Real-time insights and reporting' },
          { icon: '🔄', title: 'Auto Sync', desc: 'Seamless integration with 100+ tools' },
          { icon: '🎯', title: 'Smart Automation', desc: 'AI-powered workflow optimization' },
          { icon: '💬', title: '24/7 Support', desc: 'Expert help whenever you need it' }
        ].map((feature, idx) => (
          <div key={idx} className="p-6 rounded-xl border-2 hover:shadow-lg transition-all" style={{ borderColor: colors.primary + '30', backgroundColor: colors.primary + '05' }}>
            <div className="text-4xl mb-4">{feature.icon}</div>
            <h3 className="text-xl font-bold mb-2" style={{ color: colors.text }}>{feature.title}</h3>
            <p className="text-sm" style={{ color: colors.muted }}>{feature.desc}</p>
          </div>
        ))}
      </div>

      {/* Pricing */}
      <div className="mb-16">
        <h2 className="text-4xl font-bold text-center mb-12" style={{ color: colors.text }}>Simple, Transparent Pricing</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { name: 'Starter', price: '$29', features: ['Up to 10 users', '100 GB storage', 'Basic analytics', 'Email support'] },
            { name: 'Professional', price: '$99', features: ['Up to 50 users', '1 TB storage', 'Advanced analytics', 'Priority support'], popular: true },
            { name: 'Enterprise', price: '$299', features: ['Unlimited users', 'Unlimited storage', 'Custom analytics', '24/7 phone support'] }
          ].map((plan, idx) => (
            <div key={idx} className={`p-8 rounded-xl border-2 ${plan.popular ? 'shadow-xl' : ''}`} style={{ borderColor: plan.popular ? colors.primary : colors.primary + '30', backgroundColor: plan.popular ? colors.primary + '10' : colors.background }}>
              {plan.popular && (
                <div className="text-center mb-4">
                  <span className="px-3 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: colors.accent, color: 'white' }}>
                    Most Popular
                  </span>
                </div>
              )}
              <h3 className="text-2xl font-bold mb-2" style={{ color: colors.text }}>{plan.name}</h3>
              <div className="mb-6">
                <span className="text-4xl font-bold" style={{ color: colors.primary }}>{plan.price}</span>
                <span className="text-sm" style={{ color: colors.muted }}>/month</span>
              </div>
              <ul className="space-y-3 mb-6">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm" style={{ color: colors.text }}>
                    <span style={{ color: colors.primary }}>✓</span> {feature}
                  </li>
                ))}
              </ul>
              <button className="w-full py-3 rounded-lg font-semibold transition-all" style={{ backgroundColor: plan.popular ? colors.primary : colors.primary + '20', color: plan.popular ? 'white' : colors.primary }}>
                Get Started
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Testimonials */}
      <div className="text-center p-12 rounded-2xl" style={{ backgroundColor: colors.primary + '10' }}>
        <h2 className="text-3xl font-bold mb-8" style={{ color: colors.text }}>Trusted by Industry Leaders</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-6 rounded-xl" style={{ backgroundColor: colors.background }}>
              <p className="text-sm mb-4 italic" style={{ color: colors.text }}>
                "This platform transformed how we work. Highly recommended!"
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full" style={{ backgroundColor: colors.secondary }} />
                <div className="text-left">
                  <p className="font-semibold text-sm" style={{ color: colors.text }}>John Doe</p>
                  <p className="text-xs" style={{ color: colors.muted }}>CEO, Company {i}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </Card>
);

// Portfolio Preview
const PortfolioPreview: React.FC<{ colors: ColorPalette }> = ({ colors }) => (
  <Card className="p-8 h-full overflow-auto" style={{ backgroundColor: colors.background }}>
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-12 pb-6 border-b" style={{ borderColor: colors.primary + '20' }}>
        <h1 className="text-3xl font-bold" style={{ color: colors.text }}>Jane Designer</h1>
        <div className="flex gap-4">
          <button className="text-sm font-medium hover:underline" style={{ color: colors.muted }}>Work</button>
          <button className="text-sm font-medium hover:underline" style={{ color: colors.muted }}>About</button>
          <button className="text-sm font-medium hover:underline" style={{ color: colors.muted }}>Contact</button>
          <button className="px-4 py-2 rounded-lg font-semibold text-white text-sm" style={{ backgroundColor: colors.primary }}>
            Hire Me
          </button>
        </div>
      </div>

      {/* Hero */}
      <div className="mb-16">
        <h2 className="text-5xl font-bold mb-6" style={{ color: colors.text }}>
          Creative Designer & <span style={{ color: colors.primary }}>Visual Artist</span>
        </h2>
        <p className="text-xl mb-8 max-w-2xl" style={{ color: colors.muted }}>
          I craft beautiful digital experiences that blend aesthetics with functionality. Specializing in UI/UX design, branding, and illustration.
        </p>
        <div className="flex gap-4">
          <button className="px-6 py-3 rounded-lg font-semibold text-white" style={{ backgroundColor: colors.primary }}>
            View My Work
          </button>
          <button className="px-6 py-3 rounded-lg font-semibold border-2" style={{ borderColor: colors.primary, color: colors.primary }}>
            Download Resume
          </button>
        </div>
      </div>

      {/* Skills */}
      <div className="mb-16">
        <h3 className="text-2xl font-bold mb-6" style={{ color: colors.text }}>Skills & Expertise</h3>
        <div className="grid md:grid-cols-4 gap-4">
          {['UI/UX Design', 'Branding', 'Illustration', 'Web Design', 'Motion Graphics', 'Typography', 'Prototyping', 'Art Direction'].map((skill, idx) => (
            <div key={idx} className="p-4 rounded-lg text-center border-2" style={{ borderColor: colors.primary + '30', backgroundColor: colors.primary + '05' }}>
              <span className="font-semibold text-sm" style={{ color: colors.text }}>{skill}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Portfolio Grid */}
      <div className="mb-16">
        <h3 className="text-2xl font-bold mb-6" style={{ color: colors.text }}>Featured Projects</h3>
        <div className="grid md:grid-cols-2 gap-8">
          {[1, 2, 3, 4].map((project) => (
            <div key={project} className="rounded-xl overflow-hidden border-2 hover:shadow-xl transition-all cursor-pointer group" style={{ borderColor: colors.primary + '20' }}>
              <div className="h-64 flex items-center justify-center group-hover:scale-105 transition-transform" style={{ backgroundColor: colors.primary + '20' }}>
                <span className="text-6xl">🎨</span>
              </div>
              <div className="p-6">
                <div className="flex gap-2 mb-3">
                  <span className="px-2 py-1 rounded text-xs font-semibold" style={{ backgroundColor: colors.accent + '20', color: colors.accent }}>
                    UI Design
                  </span>
                  <span className="px-2 py-1 rounded text-xs font-semibold" style={{ backgroundColor: colors.primary + '20', color: colors.primary }}>
                    2024
                  </span>
                </div>
                <h4 className="text-xl font-bold mb-2" style={{ color: colors.text }}>Project {project}</h4>
                <p className="text-sm mb-4" style={{ color: colors.muted }}>
                  A comprehensive redesign of a mobile banking app focusing on user experience and accessibility.
                </p>
                <button className="text-sm font-semibold hover:underline" style={{ color: colors.primary }}>
                  View Case Study →
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="text-center p-12 rounded-2xl" style={{ backgroundColor: colors.primary }}>
        <h2 className="text-4xl font-bold mb-4 text-white">Let's Work Together</h2>
        <p className="text-lg mb-6 text-white opacity-90">Have a project in mind? I'd love to hear about it.</p>
        <button className="px-8 py-4 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all" style={{ backgroundColor: colors.accent, color: colors.background }}>
          Get In Touch
        </button>
      </div>
    </div>
  </Card>
);
