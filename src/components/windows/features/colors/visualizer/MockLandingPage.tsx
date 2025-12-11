import React from 'react';
import { Rocket, Lock, Users } from 'lucide-react';

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

export const MockLandingPage: React.FC<Props> = ({ colors, isWCAG, getAccessibleColor }) => {
  return (
    <div className="w-full max-w-6xl border-2 border-slate-300 dark:border-slate-700 rounded-lg shadow-xl overflow-hidden">
      <div style={{ backgroundColor: colors.background }}>
        {/* Header */}
        <header
          className="px-4 py-3 border-b-2"
          style={{
            borderColor: '#000000',
            backgroundColor: colors.background,
          }}
        >
          <div className="flex items-center justify-between">
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
                  S
                </span>
              </div>
              <span
                className="text-sm font-bold"
                style={{
                  color: isWCAG ? getAccessibleColor(colors.text, colors.background) : colors.text,
                }}
              >
                SAASIFY
              </span>
            </div>
            <button
              className="px-2 py-1 rounded text-xs font-bold"
              style={{
                backgroundColor: colors.primary,
                color: isWCAG ? getAccessibleColor(colors.background, colors.primary) : colors.background,
              }}
            >
              GET STARTED
            </button>
          </div>
        </header>

        {/* Hero Section */}
        <section className="px-8 py-16 text-center">
          <h1
            className="text-4xl font-bold mb-4 leading-tight"
            style={{
              color: isWCAG ? getAccessibleColor(colors.text, colors.background) : colors.text,
            }}
          >
            BUILD BETTER WITH{' '}
            <span
              style={{
                color: isWCAG ? getAccessibleColor(colors.primary, colors.background) : colors.primary,
              }}
            >
              SAASIFY
            </span>
          </h1>
          <p
            className="text-base mb-6 max-w-2xl mx-auto"
            style={{
              color: isWCAG ? getAccessibleColor(colors.text, colors.background) : colors.text,
              opacity: 0.7,
            }}
          >
            The modern platform that transforms your workflow
          </p>
          <div className="flex gap-4 justify-center mb-12">
            <button
              className="px-8 py-4 rounded-lg text-base font-bold"
              style={{
                backgroundColor: colors.primary,
                color: isWCAG ? getAccessibleColor(colors.background, colors.primary) : colors.background,
              }}
            >
              START FREE TRIAL
            </button>
          </div>
          <div className="grid grid-cols-3 gap-6">
            {[
              { title: 'Launch Fast', icon: <Rocket className="w-8 h-8" /> },
              { title: 'Secure Data', icon: <Lock className="w-8 h-8" /> },
              { title: 'Team Sync', icon: <Users className="w-8 h-8" /> },
            ].map((feature, index) => (
              <div
                key={index}
                className="text-center p-6 rounded-lg"
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
                  {feature.icon}
                </div>
                <h3
                  className="text-lg font-bold"
                  style={{
                    color: isWCAG ? getAccessibleColor(colors.text, colors.background) : colors.text,
                  }}
                >
                  {feature.title}
                </h3>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};
