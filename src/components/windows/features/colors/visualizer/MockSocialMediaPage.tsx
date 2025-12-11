import React from 'react';
import { User, Heart, MessageCircle, Share2 } from 'lucide-react';

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

export const MockSocialMediaPage: React.FC<Props> = ({ colors, isWCAG, getAccessibleColor }) => {
  return (
    <div className="w-full max-w-6xl border-2 border-slate-300 dark:border-slate-700 rounded-lg shadow-xl overflow-hidden">
      <div style={{ backgroundColor: colors.background }} className="p-8">
        {/* Profile Header */}
        <header className="mb-4">
          <div className="flex items-center gap-3 mb-3">
            <div
              className="w-12 h-12 rounded-full border-2 flex-shrink-0 flex items-center justify-center"
              style={{
                backgroundColor: isWCAG
                  ? getAccessibleColor(colors.primary, colors.background) + '33'
                  : colors.primary + '33',
              }}
            >
              <User
                className="w-6 h-6"
                style={{
                  color: isWCAG ? getAccessibleColor(colors.primary, colors.background) : colors.primary,
                }}
              />
            </div>
            <div className="flex-1">
              <h2
                className="text-sm font-bold"
                style={{
                  color: isWCAG ? getAccessibleColor(colors.text, colors.background) : colors.text,
                }}
              >
                USER NAME
              </h2>
              <p
                className="text-xs"
                style={{
                  color: isWCAG ? getAccessibleColor(colors.text, colors.background) : colors.text,
                  opacity: 0.7,
                }}
              >
                @username
              </p>
            </div>
            <button
              className="px-3 py-1 rounded text-xs font-bold"
              style={{
                backgroundColor: isWCAG ? getAccessibleColor(colors.primary, colors.background) : colors.primary,
                color: isWCAG ? getAccessibleColor(colors.background, colors.primary) : colors.background,
              }}
            >
              FOLLOW
            </button>
          </div>
        </header>

        {/* Post */}
        <div
          className="p-3 rounded mb-3"
          style={{
            backgroundColor: isWCAG
              ? getAccessibleColor(colors.primary, colors.background) + '11'
              : colors.primary + '11',
          }}
        >
          <p
            className="text-xs mb-2"
            style={{
              color: isWCAG ? getAccessibleColor(colors.text, colors.background) : colors.text,
            }}
          >
            Just finished a new design project! Excited to share it soon. #Design
          </p>
          <div className="flex items-center gap-3 text-xs">
            <button
              className="flex items-center gap-1"
              style={{
                color: isWCAG ? getAccessibleColor(colors.primary, colors.background) : colors.primary,
              }}
            >
              <Heart className="w-3 h-3" /> 45
            </button>
            <button
              className="flex items-center gap-1"
              style={{
                color: isWCAG ? getAccessibleColor(colors.primary, colors.background) : colors.primary,
              }}
            >
              <MessageCircle className="w-3 h-3" /> 12
            </button>
            <button
              className="flex items-center gap-1"
              style={{
                color: isWCAG ? getAccessibleColor(colors.primary, colors.background) : colors.primary,
              }}
            >
              <Share2 className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Post Input */}
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-full border flex items-center justify-center"
            style={{
              backgroundColor: isWCAG
                ? getAccessibleColor(colors.primary, colors.background) + '33'
                : colors.primary + '33',
            }}
          >
            <User
              className="w-4 h-4"
              style={{
                color: isWCAG ? getAccessibleColor(colors.primary, colors.background) : colors.primary,
              }}
            />
          </div>
          <div
            className="flex-1 p-2 rounded"
            style={{
              backgroundColor: isWCAG
                ? getAccessibleColor(colors.accent, colors.background) + '11'
                : colors.accent + '11',
            }}
          >
            <p
              className="text-xs"
              style={{
                color: isWCAG ? getAccessibleColor(colors.text, colors.background) : colors.text,
                opacity: 0.7,
              }}
            >
              What's on your mind?
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
