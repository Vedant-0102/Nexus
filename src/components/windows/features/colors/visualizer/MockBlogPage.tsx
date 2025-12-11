import React from 'react';
import { User, Calendar, MessageSquare } from 'lucide-react';

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

export const MockBlogPage: React.FC<Props> = ({ colors, isWCAG, getAccessibleColor }) => {
  return (
    <div className="w-full max-w-6xl border-2 border-slate-300 dark:border-slate-700 rounded-lg shadow-xl overflow-hidden">
      <div style={{ backgroundColor: colors.background }} className="p-8">
        {/* Header */}
        <header className="mb-3">
          <h1
            className="text-lg font-bold mb-2"
            style={{
              color: isWCAG ? getAccessibleColor(colors.text, colors.background) : colors.text,
            }}
          >
            BLOG POST TITLE
          </h1>
          <div className="flex items-center text-xs space-x-3">
            <div className="flex items-center">
              <User
                className="w-3 h-3 mr-1"
                style={{
                  color: isWCAG ? getAccessibleColor(colors.primary, colors.background) : colors.primary,
                }}
              />
              <span
                style={{
                  color: isWCAG ? getAccessibleColor(colors.text, colors.background) : colors.text,
                  opacity: 0.7,
                }}
              >
                Author
              </span>
            </div>
            <div className="flex items-center">
              <Calendar
                className="w-3 h-3 mr-1"
                style={{
                  color: isWCAG ? getAccessibleColor(colors.primary, colors.background) : colors.primary,
                }}
              />
              <span
                style={{
                  color: isWCAG ? getAccessibleColor(colors.text, colors.background) : colors.text,
                  opacity: 0.7,
                }}
              >
                Sep 21, 2025
              </span>
            </div>
          </div>
        </header>

        {/* Content */}
        <section className="mb-4">
          <p
            className="text-xs mb-3 leading-relaxed"
            style={{
              color: isWCAG ? getAccessibleColor(colors.text, colors.background) : colors.text,
            }}
          >
            This is the introduction paragraph of the blog post. It sets the stage for the topic.
          </p>
          <div
            className="w-full h-24 mb-3 rounded flex items-center justify-center"
            style={{
              backgroundColor: isWCAG
                ? getAccessibleColor(colors.accent, colors.background) + '33'
                : colors.accent + '33',
            }}
          >
            <span
              className="text-sm font-bold"
              style={{
                color: isWCAG ? getAccessibleColor(colors.accent, colors.background) : colors.accent,
              }}
            >
              Featured Image
            </span>
          </div>
          <button
            className="px-3 py-2 rounded text-xs font-bold mb-3"
            style={{
              backgroundColor: isWCAG ? getAccessibleColor(colors.primary, colors.background) : colors.primary,
              color: isWCAG ? getAccessibleColor(colors.background, colors.primary) : colors.background,
            }}
          >
            READ FULL ARTICLE
          </button>
        </section>

        {/* Comments */}
        <section>
          <h2
            className="text-sm font-bold mb-2 flex items-center"
            style={{
              color: isWCAG ? getAccessibleColor(colors.text, colors.background) : colors.text,
            }}
          >
            <MessageSquare
              className="w-4 h-4 mr-1"
              style={{
                color: isWCAG ? getAccessibleColor(colors.primary, colors.background) : colors.primary,
              }}
            />
            COMMENTS (2)
          </h2>
          <div
            className="p-2 rounded"
            style={{
              backgroundColor: isWCAG
                ? getAccessibleColor(colors.primary, colors.background) + '11'
                : colors.primary + '11',
            }}
          >
            <p
              className="text-xs"
              style={{
                color: isWCAG ? getAccessibleColor(colors.text, colors.background) : colors.text,
              }}
            >
              Insightful article!
            </p>
            <p
              className="text-xs mt-1"
              style={{
                color: isWCAG ? getAccessibleColor(colors.text, colors.background) : colors.text,
                opacity: 0.7,
              }}
            >
              - Reader 1 • 2 hours ago
            </p>
          </div>
        </section>
      </div>
    </div>
  );
};
