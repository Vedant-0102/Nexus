import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3, LineChart, PieChart, Plus, Trash2, Download, Activity, Radar, ScatterChart } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface DataPoint {
  label: string;
  value: number;
  color?: string;
}

type ChartType = 'bar' | 'line' | 'pie' | 'radar' | 'histogram' | 'scatter' | 'area' | 'donut';

export const ChartBuilder: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [chartType, setChartType] = useState<ChartType>('bar');
  const [chartTitle, setChartTitle] = useState<string>('My Chart');
  const [xAxisLabel, setXAxisLabel] = useState<string>('X Axis');
  const [yAxisLabel, setYAxisLabel] = useState<string>('Y Axis');
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [showLegend, setShowLegend] = useState<boolean>(true);
  const [dataPoints, setDataPoints] = useState<DataPoint[]>([
    { label: 'January', value: 65, color: '#3B82F6' },
    { label: 'February', value: 59, color: '#10B981' },
    { label: 'March', value: 80, color: '#F59E0B' },
    { label: 'April', value: 81, color: '#EF4444' },
    { label: 'May', value: 56, color: '#8B5CF6' },
  ]);

  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'];

  useEffect(() => {
    drawChart();
  }, [chartType, dataPoints, chartTitle, xAxisLabel, yAxisLabel, showGrid, showLegend]);

  const addDataPoint = () => {
    setDataPoints([
      ...dataPoints,
      { label: `Item ${dataPoints.length + 1}`, value: 50, color: colors[dataPoints.length % colors.length] }
    ]);
  };

  const removeDataPoint = (index: number) => {
    setDataPoints(dataPoints.filter((_, i) => i !== index));
  };

  const updateDataPoint = (index: number, field: 'label' | 'value' | 'color', value: string | number) => {
    const updated = [...dataPoints];
    updated[index] = { ...updated[index], [field]: value };
    setDataPoints(updated);
  };

  const drawChart = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 900;
    canvas.height = 600;

    // Clear canvas
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (dataPoints.length === 0) return;

    // Draw title
    ctx.fillStyle = '#1f2937';
    ctx.font = 'bold 28px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(chartTitle, canvas.width / 2, 40);

    const chartArea = {
      x: 100,
      y: 80,
      width: canvas.width - 200,
      height: canvas.height - 180,
    };

    switch (chartType) {
      case 'bar':
        drawBarChart(ctx, chartArea);
        break;
      case 'line':
        drawLineChart(ctx, chartArea);
        break;
      case 'pie':
        drawPieChart(ctx);
        break;
      case 'radar':
        drawRadarChart(ctx);
        break;
      case 'histogram':
        drawHistogram(ctx, chartArea);
        break;
      case 'scatter':
        drawScatterChart(ctx, chartArea);
        break;
      case 'area':
        drawAreaChart(ctx, chartArea);
        break;
      case 'donut':
        drawDonutChart(ctx);
        break;
    }

    if (showLegend && ['bar', 'line', 'area', 'histogram'].includes(chartType)) {
      drawLegend(ctx);
    }
  };

  const drawAxes = (ctx: CanvasRenderingContext2D, area: any) => {
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(area.x, area.y);
    ctx.lineTo(area.x, area.y + area.height);
    ctx.lineTo(area.x + area.width, area.y + area.height);
    ctx.stroke();

    // Axis labels
    ctx.fillStyle = '#374151';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(xAxisLabel, area.x + area.width / 2, area.y + area.height + 50);
    
    ctx.save();
    ctx.translate(area.x - 60, area.y + area.height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(yAxisLabel, 0, 0);
    ctx.restore();
  };

  const drawGrid = (ctx: CanvasRenderingContext2D, area: any) => {
    if (!showGrid) return;
    
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    
    // Horizontal grid lines
    for (let i = 0; i <= 5; i++) {
      const y = area.y + (area.height / 5) * i;
      ctx.beginPath();
      ctx.moveTo(area.x, y);
      ctx.lineTo(area.x + area.width, y);
      ctx.stroke();
    }
    
    // Vertical grid lines
    for (let i = 0; i <= dataPoints.length; i++) {
      const x = area.x + (area.width / dataPoints.length) * i;
      ctx.beginPath();
      ctx.moveTo(x, area.y);
      ctx.lineTo(x, area.y + area.height);
      ctx.stroke();
    }
  };

  const drawBarChart = (ctx: CanvasRenderingContext2D, area: any) => {
    drawGrid(ctx, area);
    drawAxes(ctx, area);
    
    const maxValue = Math.max(...dataPoints.map(d => d.value));
    const barWidth = (area.width / dataPoints.length) * 0.7;
    const spacing = area.width / dataPoints.length;

    dataPoints.forEach((point, i) => {
      const barHeight = (point.value / maxValue) * area.height;
      const x = area.x + i * spacing + (spacing - barWidth) / 2;
      const y = area.y + area.height - barHeight;

      // Draw shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.fillRect(x + 3, y + 3, barWidth, barHeight);

      // Draw bar with gradient
      const gradient = ctx.createLinearGradient(x, y, x, y + barHeight);
      gradient.addColorStop(0, point.color || colors[i % colors.length]);
      gradient.addColorStop(1, adjustColor(point.color || colors[i % colors.length], -20));
      ctx.fillStyle = gradient;
      ctx.fillRect(x, y, barWidth, barHeight);

      // Draw border
      ctx.strokeStyle = adjustColor(point.color || colors[i % colors.length], -30);
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, barWidth, barHeight);

      // Draw value on top
      ctx.fillStyle = '#1f2937';
      ctx.font = 'bold 14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(point.value.toString(), x + barWidth / 2, y - 8);

      // Draw label
      ctx.save();
      ctx.translate(x + barWidth / 2, area.y + area.height + 15);
      ctx.rotate(-Math.PI / 6);
      ctx.textAlign = 'right';
      ctx.font = '12px Arial';
      ctx.fillText(point.label, 0, 0);
      ctx.restore();
    });
  };

  const drawLineChart = (ctx: CanvasRenderingContext2D, area: any) => {
    drawGrid(ctx, area);
    drawAxes(ctx, area);
    
    const maxValue = Math.max(...dataPoints.map(d => d.value));
    const pointSpacing = area.width / (dataPoints.length - 1 || 1);

    // Draw line with shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    
    ctx.strokeStyle = '#3B82F6';
    ctx.lineWidth = 3;
    ctx.beginPath();
    dataPoints.forEach((point, i) => {
      const x = area.x + i * pointSpacing;
      const y = area.y + area.height - (point.value / maxValue) * area.height;
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();
    ctx.shadowColor = 'transparent';

    // Draw points and labels
    dataPoints.forEach((point, i) => {
      const x = area.x + i * pointSpacing;
      const y = area.y + area.height - (point.value / maxValue) * area.height;

      // Draw point with glow
      ctx.fillStyle = point.color || colors[i % colors.length];
      ctx.beginPath();
      ctx.arc(x, y, 8, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Draw value
      ctx.fillStyle = '#1f2937';
      ctx.font = 'bold 12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(point.value.toString(), x, y - 18);

      // Draw label
      ctx.save();
      ctx.translate(x, area.y + area.height + 15);
      ctx.rotate(-Math.PI / 6);
      ctx.textAlign = 'right';
      ctx.fillText(point.label, 0, 0);
      ctx.restore();
    });
  };

  const drawPieChart = (ctx: CanvasRenderingContext2D) => {
    const centerX = ctx.canvas.width / 2;
    const centerY = ctx.canvas.height / 2 + 20;
    const radius = 180;

    const total = dataPoints.reduce((sum, point) => sum + point.value, 0);
    let currentAngle = -Math.PI / 2;

    dataPoints.forEach((point, i) => {
      const sliceAngle = (point.value / total) * Math.PI * 2;

      // Draw slice with gradient
      const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
      gradient.addColorStop(0, adjustColor(point.color || colors[i % colors.length], 20));
      gradient.addColorStop(1, point.color || colors[i % colors.length]);
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
      ctx.closePath();
      ctx.fill();

      // Draw border
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Draw label with line
      const labelAngle = currentAngle + sliceAngle / 2;
      const lineStartX = centerX + Math.cos(labelAngle) * (radius * 0.8);
      const lineStartY = centerY + Math.sin(labelAngle) * (radius * 0.8);
      const lineEndX = centerX + Math.cos(labelAngle) * (radius + 30);
      const lineEndY = centerY + Math.sin(labelAngle) * (radius + 30);
      const labelX = centerX + Math.cos(labelAngle) * (radius + 60);
      const labelY = centerY + Math.sin(labelAngle) * (radius + 60);

      ctx.strokeStyle = '#6b7280';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(lineStartX, lineStartY);
      ctx.lineTo(lineEndX, lineEndY);
      ctx.lineTo(labelX, lineEndY);
      ctx.stroke();

      ctx.fillStyle = '#1f2937';
      ctx.font = 'bold 14px Arial';
      ctx.textAlign = labelAngle > Math.PI / 2 && labelAngle < 3 * Math.PI / 2 ? 'right' : 'left';
      ctx.fillText(point.label, labelX, lineEndY - 5);
      ctx.font = '12px Arial';
      ctx.fillText(`${point.value} (${((point.value / total) * 100).toFixed(1)}%)`, labelX, lineEndY + 12);

      currentAngle += sliceAngle;
    });
  };

  const drawDonutChart = (ctx: CanvasRenderingContext2D) => {
    const centerX = ctx.canvas.width / 2;
    const centerY = ctx.canvas.height / 2 + 20;
    const outerRadius = 180;
    const innerRadius = 100;

    const total = dataPoints.reduce((sum, point) => sum + point.value, 0);
    let currentAngle = -Math.PI / 2;

    dataPoints.forEach((point, i) => {
      const sliceAngle = (point.value / total) * Math.PI * 2;

      // Draw slice
      ctx.fillStyle = point.color || colors[i % colors.length];
      ctx.beginPath();
      ctx.arc(centerX, centerY, outerRadius, currentAngle, currentAngle + sliceAngle);
      ctx.arc(centerX, centerY, innerRadius, currentAngle + sliceAngle, currentAngle, true);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.stroke();

      currentAngle += sliceAngle;
    });

    // Draw center circle
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(centerX, centerY, innerRadius, 0, Math.PI * 2);
    ctx.fill();

    // Draw total in center
    ctx.fillStyle = '#1f2937';
    ctx.font = 'bold 32px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(total.toString(), centerX, centerY);
    ctx.font = '16px Arial';
    ctx.fillText('Total', centerX, centerY + 25);

    // Draw legend
    drawLegend(ctx);
  };

  const drawRadarChart = (ctx: CanvasRenderingContext2D) => {
    const centerX = ctx.canvas.width / 2;
    const centerY = ctx.canvas.height / 2 + 20;
    const radius = 200;
    const maxValue = Math.max(...dataPoints.map(d => d.value));
    const angleStep = (Math.PI * 2) / dataPoints.length;

    // Draw concentric circles
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    for (let i = 1; i <= 5; i++) {
      ctx.beginPath();
      ctx.arc(centerX, centerY, (radius / 5) * i, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Draw axes
    ctx.strokeStyle = '#d1d5db';
    ctx.lineWidth = 1;
    dataPoints.forEach((_, i) => {
      const angle = angleStep * i - Math.PI / 2;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(x, y);
      ctx.stroke();
    });

    // Draw data polygon with fill
    ctx.fillStyle = 'rgba(59, 130, 246, 0.2)';
    ctx.strokeStyle = '#3B82F6';
    ctx.lineWidth = 3;
    ctx.beginPath();
    dataPoints.forEach((point, i) => {
      const angle = angleStep * i - Math.PI / 2;
      const distance = (point.value / maxValue) * radius;
      const x = centerX + Math.cos(angle) * distance;
      const y = centerY + Math.sin(angle) * distance;
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Draw points and labels
    dataPoints.forEach((point, i) => {
      const angle = angleStep * i - Math.PI / 2;
      const distance = (point.value / maxValue) * radius;
      const x = centerX + Math.cos(angle) * distance;
      const y = centerY + Math.sin(angle) * distance;

      // Draw point
      ctx.fillStyle = point.color || colors[i % colors.length];
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw label
      const labelDistance = radius + 30;
      const labelX = centerX + Math.cos(angle) * labelDistance;
      const labelY = centerY + Math.sin(angle) * labelDistance;
      
      ctx.fillStyle = '#1f2937';
      ctx.font = 'bold 12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(point.label, labelX, labelY);
      ctx.font = '11px Arial';
      ctx.fillText(`(${point.value})`, labelX, labelY + 14);
    });
  };

  const drawHistogram = (ctx: CanvasRenderingContext2D, area: any) => {
    drawGrid(ctx, area);
    drawAxes(ctx, area);
    
    const maxValue = Math.max(...dataPoints.map(d => d.value));
    const barWidth = area.width / dataPoints.length;

    dataPoints.forEach((point, i) => {
      const barHeight = (point.value / maxValue) * area.height;
      const x = area.x + i * barWidth;
      const y = area.y + area.height - barHeight;

      // Draw bar
      const gradient = ctx.createLinearGradient(x, y, x, y + barHeight);
      gradient.addColorStop(0, point.color || colors[i % colors.length]);
      gradient.addColorStop(1, adjustColor(point.color || colors[i % colors.length], -30));
      ctx.fillStyle = gradient;
      ctx.fillRect(x, y, barWidth, barHeight);

      // Draw border
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, barWidth, barHeight);

      // Draw value
      ctx.fillStyle = '#1f2937';
      ctx.font = 'bold 12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(point.value.toString(), x + barWidth / 2, y - 5);

      // Draw label
      ctx.save();
      ctx.translate(x + barWidth / 2, area.y + area.height + 15);
      ctx.rotate(-Math.PI / 6);
      ctx.textAlign = 'right';
      ctx.font = '11px Arial';
      ctx.fillText(point.label, 0, 0);
      ctx.restore();
    });
  };

  const drawScatterChart = (ctx: CanvasRenderingContext2D, area: any) => {
    drawGrid(ctx, area);
    drawAxes(ctx, area);
    
    const maxValue = Math.max(...dataPoints.map(d => d.value));
    const pointSpacing = area.width / (dataPoints.length - 1 || 1);

    dataPoints.forEach((point, i) => {
      const x = area.x + i * pointSpacing;
      const y = area.y + area.height - (point.value / maxValue) * area.height;

      // Draw point with glow effect
      ctx.shadowColor = point.color || colors[i % colors.length];
      ctx.shadowBlur = 15;
      ctx.fillStyle = point.color || colors[i % colors.length];
      ctx.beginPath();
      ctx.arc(x, y, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Draw border
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Draw value
      ctx.fillStyle = '#1f2937';
      ctx.font = 'bold 11px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(point.value.toString(), x, y - 18);

      // Draw label
      ctx.save();
      ctx.translate(x, area.y + area.height + 15);
      ctx.rotate(-Math.PI / 6);
      ctx.textAlign = 'right';
      ctx.fillText(point.label, 0, 0);
      ctx.restore();
    });
  };

  const drawAreaChart = (ctx: CanvasRenderingContext2D, area: any) => {
    drawGrid(ctx, area);
    drawAxes(ctx, area);
    
    const maxValue = Math.max(...dataPoints.map(d => d.value));
    const pointSpacing = area.width / (dataPoints.length - 1 || 1);

    // Draw filled area
    const gradient = ctx.createLinearGradient(0, area.y, 0, area.y + area.height);
    gradient.addColorStop(0, 'rgba(59, 130, 246, 0.5)');
    gradient.addColorStop(1, 'rgba(59, 130, 246, 0.05)');
    ctx.fillStyle = gradient;
    
    ctx.beginPath();
    ctx.moveTo(area.x, area.y + area.height);
    dataPoints.forEach((point, i) => {
      const x = area.x + i * pointSpacing;
      const y = area.y + area.height - (point.value / maxValue) * area.height;
      ctx.lineTo(x, y);
    });
    ctx.lineTo(area.x + (dataPoints.length - 1) * pointSpacing, area.y + area.height);
    ctx.closePath();
    ctx.fill();

    // Draw line
    ctx.strokeStyle = '#3B82F6';
    ctx.lineWidth = 3;
    ctx.beginPath();
    dataPoints.forEach((point, i) => {
      const x = area.x + i * pointSpacing;
      const y = area.y + area.height - (point.value / maxValue) * area.height;
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();

    // Draw points
    dataPoints.forEach((point, i) => {
      const x = area.x + i * pointSpacing;
      const y = area.y + area.height - (point.value / maxValue) * area.height;

      ctx.fillStyle = point.color || colors[i % colors.length];
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw value
      ctx.fillStyle = '#1f2937';
      ctx.font = 'bold 11px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(point.value.toString(), x, y - 15);

      // Draw label
      ctx.save();
      ctx.translate(x, area.y + area.height + 15);
      ctx.rotate(-Math.PI / 6);
      ctx.textAlign = 'right';
      ctx.fillText(point.label, 0, 0);
      ctx.restore();
    });
  };

  const drawLegend = (ctx: CanvasRenderingContext2D) => {
    const legendX = 50;
    const legendY = ctx.canvas.height - 80;
    const itemWidth = 150;
    const itemsPerRow = Math.floor((ctx.canvas.width - 100) / itemWidth);

    dataPoints.forEach((point, i) => {
      const row = Math.floor(i / itemsPerRow);
      const col = i % itemsPerRow;
      const x = legendX + col * itemWidth;
      const y = legendY + row * 25;

      // Draw color box
      ctx.fillStyle = point.color || colors[i % colors.length];
      ctx.fillRect(x, y - 10, 15, 15);
      ctx.strokeStyle = '#6b7280';
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y - 10, 15, 15);

      // Draw label
      ctx.fillStyle = '#1f2937';
      ctx.font = '12px Arial';
      ctx.textAlign = 'left';
      ctx.fillText(point.label, x + 20, y + 2);
    });
  };

  const adjustColor = (color: string, amount: number): string => {
    const num = parseInt(color.replace('#', ''), 16);
    const r = Math.max(0, Math.min(255, (num >> 16) + amount));
    const g = Math.max(0, Math.min(255, ((num >> 8) & 0x00FF) + amount));
    const b = Math.max(0, Math.min(255, (num & 0x0000FF) + amount));
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
  };

  const downloadChart = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = `${chartTitle.replace(/\s+/g, '_')}.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  const chartTypes = [
    { value: 'bar', label: 'Bar Chart', icon: BarChart3 },
    { value: 'line', label: 'Line Chart', icon: LineChart },
    { value: 'pie', label: 'Pie Chart', icon: PieChart },
    { value: 'donut', label: 'Donut Chart', icon: PieChart },
    { value: 'radar', label: 'Radar Chart', icon: Radar },
    { value: 'area', label: 'Area Chart', icon: Activity },
    { value: 'scatter', label: 'Scatter Plot', icon: ScatterChart },
    { value: 'histogram', label: 'Histogram', icon: BarChart3 },
  ];

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Chart Type Selector */}
          <Card className="p-6 dark:bg-gray-800">
            <h3 className="text-lg font-semibold mb-4 dark:text-white">Chart Type</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {chartTypes.map((type) => {
                const Icon = type.icon;
                return (
                  <Button
                    key={type.value}
                    variant={chartType === type.value ? 'default' : 'outline'}
                    onClick={() => setChartType(type.value as ChartType)}
                    className="h-auto py-4 flex flex-col items-center gap-2"
                  >
                    <Icon className="h-5 w-5" />
                    <span className="text-xs">{type.label}</span>
                  </Button>
                );
              })}
            </div>
          </Card>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Left Panel - Settings */}
            <div className="lg:col-span-1 space-y-4">
              <Card className="p-6 dark:bg-gray-800">
                <h3 className="text-lg font-semibold mb-4 dark:text-white">Chart Settings</h3>
                
                <div className="space-y-4">
                  <div>
                    <Label>Chart Title</Label>
                    <Input
                      value={chartTitle}
                      onChange={(e) => setChartTitle(e.target.value)}
                      className="mt-2"
                    />
                  </div>

                  {!['pie', 'donut', 'radar'].includes(chartType) && (
                    <>
                      <div>
                        <Label>X-Axis Label</Label>
                        <Input
                          value={xAxisLabel}
                          onChange={(e) => setXAxisLabel(e.target.value)}
                          className="mt-2"
                        />
                      </div>

                      <div>
                        <Label>Y-Axis Label</Label>
                        <Input
                          value={yAxisLabel}
                          onChange={(e) => setYAxisLabel(e.target.value)}
                          className="mt-2"
                        />
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="showGrid"
                          checked={showGrid}
                          onChange={(e) => setShowGrid(e.target.checked)}
                          className="w-4 h-4"
                        />
                        <Label htmlFor="showGrid" className="cursor-pointer">Show Grid</Label>
                      </div>
                    </>
                  )}

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="showLegend"
                      checked={showLegend}
                      onChange={(e) => setShowLegend(e.target.checked)}
                      className="w-4 h-4"
                    />
                    <Label htmlFor="showLegend" className="cursor-pointer">Show Legend</Label>
                  </div>
                </div>
              </Card>

              <Card className="p-6 dark:bg-gray-800">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold dark:text-white">Data Points</h3>
                  <Button size="sm" onClick={addDataPoint}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add
                  </Button>
                </div>

                <div className="space-y-3 max-h-96 overflow-auto">
                  {dataPoints.map((point, index) => (
                    <div key={index} className="flex gap-2 items-center p-3 border rounded dark:border-gray-700 bg-white dark:bg-gray-900">
                      <input
                        type="color"
                        value={point.color}
                        onChange={(e) => updateDataPoint(index, 'color', e.target.value)}
                        className="w-10 h-10 rounded cursor-pointer border dark:border-gray-600"
                      />
                      <div className="flex-1 space-y-2">
                        <Input
                          value={point.label}
                          onChange={(e) => updateDataPoint(index, 'label', e.target.value)}
                          placeholder="Label"
                          className="text-sm"
                        />
                        <Input
                          type="number"
                          value={point.value}
                          onChange={(e) => updateDataPoint(index, 'value', parseFloat(e.target.value) || 0)}
                          placeholder="Value"
                          className="text-sm"
                        />
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeDataPoint(index)}
                        disabled={dataPoints.length === 1}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  ))}
                </div>
              </Card>

              <Button onClick={downloadChart} className="w-full" size="lg">
                <Download className="h-4 w-4 mr-2" />
                Download as PNG
              </Button>
            </div>

            {/* Right Panel - Chart Preview */}
            <div className="lg:col-span-2">
              <Card className="p-6 dark:bg-gray-800 h-full">
                <h3 className="text-lg font-semibold mb-4 dark:text-white">Preview</h3>
                <div className="flex justify-center items-center bg-white rounded-lg p-4">
                  <canvas
                    ref={canvasRef}
                    className="max-w-full"
                    style={{ maxHeight: '600px' }}
                  />
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
