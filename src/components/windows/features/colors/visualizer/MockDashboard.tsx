import React from 'react';
import { Zap, Shield, MessageSquare } from 'lucide-react';

interface Colors {
  primary: string;
  background: string;
  accent: string;
  text: string;
}

interface Props {
  colors: Colors;
  isWCAG: boolean;
  getAccessibleColor: (fg: string, bg: string, minContrast?: number) => string;
}

export const MockDashboard: React.FC<Props> = ({ colors, isWCAG, getAccessibleColor }) => {
  return (
    <div className="w-full max-w-6xl border-2 border-slate-300 dark:border-slate-700 rounded-lg shadow-xl overflow-hidden">
      <div style={{ backgroundColor: colors.background }}>
        <header
          className="px-4 py-3 border-b-2"
          style={{
            borderColor: '#000000',
            backgroundColor: colors.background,
          }}
        >
          <div className="flex items-center space-x-2">
            <div
              className="w-6 h-6 rounded border flex items-center justify-center"
              style={{ backgroundColor: colors.primary }}
            >
              <span
                className="font-bold text-xs"
                style={{
                  color: isWCAG ? getAccessibleColor('#ffffff', colors.primary) : '#ffffff',
                }}
              >
                D
              </span>
            </div>
            <span
              className="text-sm font-bold"
              style={{
                color: isWCAG ? getAccessibleColor(colors.text, colors.background) : colors.text,
              }}
            >
              DASHBOARD
            </span>
          </div>
        </header>

        <section className="p-8">
          <h2
            className="text-xl font-bold mb-6"
            style={{
              color: isWCAG ? getAccessibleColor(colors.text, colors.background) : colors.text,
            }}
          >
            PERFORMANCE OVERVIEW
          </h2>
          <div className="grid grid-cols-3 gap-6 mb-8">
            {[
              { title: 'Users', value: '12,345', icon: <MessageSquare className="w-4 h-4" /> },
              { title: 'Revenue', value: '$45K', icon: <Zap className="w-4 h-4" /> },
              { title: 'Security', value: '99.9%', icon: <Shield className="w-4 h-4" /> },
            ].map((metric, index) => (
              <div
                key={index}
                className="p-6 rounded-lg text-center"
                style={{
                  backgroundColor: isWCAG
                    ? getAccessibleColor(colors.accent, colors.background) + '33'
                    : colors.accent + '33',
                }}
              >
                <div
                  className="flex justify-center mb-1"
                  style={{
                    color: isWCAG ? getAccessibleColor(colors.primary, colors.background) : colors.primary,
                  }}
                >
                  {metric.icon}
                </div>
                <h3
                  className="text-sm font-bold"
                  style={{
                    color: isWCAG ? getAccessibleColor(colors.text, colors.background) : colors.text,
                  }}
                >
                  {metric.title}
                </h3>
                <p
                  className="text-lg font-bold"
                  style={{
                    color: isWCAG ? getAccessibleColor(colors.text, colors.background) : colors.text,
                  }}
                >
                  {metric.value}
                </p>
              </div>
            ))}
          </div>
          {/* Bar Chart */}
          <div className="mb-8">
            <h3
              className="text-base font-bold mb-4"
              style={{
                color: isWCAG ? getAccessibleColor(colors.text, colors.background) : colors.text,
              }}
            >
              Performance
            </h3>
            <div className="flex items-end justify-between h-40 gap-2">
              {[65, 59, 80, 81, 56, 72].map((value, index) => (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <div
                    className="w-full rounded-t transition-all"
                    style={{
                      height: `${value}%`,
                      backgroundColor: isWCAG
                        ? getAccessibleColor(colors.primary, colors.background)
                        : colors.primary,
                    }}
                  />
                  <span
                    className="text-xs mt-1"
                    style={{
                      color: isWCAG ? getAccessibleColor(colors.text, colors.background) : colors.text,
                      opacity: 0.6,
                    }}
                  >
                    {['J', 'F', 'M', 'A', 'M', 'J'][index]}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Line Chart */}
          <div>
            <h3
              className="text-base font-bold mb-4"
              style={{
                color: isWCAG ? getAccessibleColor(colors.text, colors.background) : colors.text,
              }}
            >
              User Growth
            </h3>
            <div className="h-40 relative">
              <svg className="w-full h-full" viewBox="0 0 300 80" preserveAspectRatio="none">
                {/* Grid lines */}
                <line x1="0" y1="20" x2="300" y2="20" stroke="currentColor" strokeWidth="0.5" opacity="0.2" />
                <line x1="0" y1="40" x2="300" y2="40" stroke="currentColor" strokeWidth="0.5" opacity="0.2" />
                <line x1="0" y1="60" x2="300" y2="60" stroke="currentColor" strokeWidth="0.5" opacity="0.2" />
                
                {/* Area fill */}
                <path
                  d="M 0 60 L 50 50 L 100 40 L 150 45 L 200 30 L 250 20 L 250 80 L 0 80 Z"
                  fill={
                    isWCAG
                      ? getAccessibleColor(colors.accent, colors.background) + '33'
                      : colors.accent + '33'
                  }
                />
                
                {/* Line */}
                <path
                  d="M 0 60 L 50 50 L 100 40 L 150 45 L 200 30 L 250 20"
                  fill="none"
                  stroke={isWCAG ? getAccessibleColor(colors.accent, colors.background) : colors.accent}
                  strokeWidth="2"
                />
                
                {/* Data points */}
                {[
                  { x: 0, y: 60 },
                  { x: 50, y: 50 },
                  { x: 100, y: 40 },
                  { x: 150, y: 45 },
                  { x: 200, y: 30 },
                  { x: 250, y: 20 },
                ].map((point, index) => (
                  <circle
                    key={index}
                    cx={point.x}
                    cy={point.y}
                    r="3"
                    fill={isWCAG ? getAccessibleColor(colors.accent, colors.background) : colors.accent}
                  />
                ))}
              </svg>
              <div className="flex justify-between text-xs mt-1">
                {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'].map((month, index) => (
                  <span
                    key={index}
                    style={{
                      color: isWCAG ? getAccessibleColor(colors.text, colors.background) : colors.text,
                      opacity: 0.6,
                    }}
                  >
                    {month[0]}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
