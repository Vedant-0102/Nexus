/**
 * Smoke tests for the desktop shell.
 *
 * These exist mainly to guard the code-splitting boundary: every app is loaded
 * through React.lazy, so a missing <Suspense> ancestor or a bad dynamic import
 * would throw at render time rather than at build time. Opening windows here
 * exercises that path end-to-end.
 *
 * WindowsProvider builds the full app registry on mount, which is expensive, so
 * these tests mount it as few times as possible and drive it from the inside.
 */

import React from 'react';
import { describe, test, expect, beforeAll, vi } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WindowsProvider, useWindows } from './context/WindowsContext';
import { AppBoundary } from './components/AppBoundary';
import { WindowsDisplay } from './components/WindowsDisplay';
import { PhysicsProvider } from './context/PhysicsContext';

beforeAll(() => {
  // jsdom implements neither of these, and the window chrome touches both.
  window.matchMedia = window.matchMedia || (((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })) as unknown as typeof window.matchMedia);

  window.ResizeObserver = window.ResizeObserver || class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

/**
 * Representative apps to open: the security-relevant families this project is
 * built around, plus the terminal and task manager as general shell checks.
 */
const SMOKE_APP_IDS = [
  'subnet-calculator',
  'classical-ciphers',
  'hashing-tool',
  'jwt-decoder',
  'terminal',
  'taskManager',
];

describe('window registry', () => {
  let apps: ReturnType<typeof useWindows>['windows'];

  beforeAll(() => {
    let captured: ReturnType<typeof useWindows> | null = null;
    const Probe = () => { captured = useWindows(); return null; };
    render(<WindowsProvider><Probe /></WindowsProvider>);
    apps = captured!.windows;
    cleanup();
  });

  test('registers a large set of apps', () => {
    expect(apps.length).toBeGreaterThan(200);
  });

  test('every app has an id, a title and content', () => {
    for (const app of apps) {
      expect(app.id, 'every app needs an id').toBeTruthy();
      expect(app.title, `app ${app.id} needs a title`).toBeTruthy();
      expect(app.content, `app ${app.id} needs content`).toBeTruthy();
    }
  });

  test('app ids are unique', () => {
    const ids = apps.map(w => w.id);
    const dupes = [...new Set(ids.filter((id, i) => ids.indexOf(id) !== i))];
    expect(dupes).toEqual([]);
  });

  test('the apps these smoke tests open all exist', () => {
    const ids = new Set(apps.map(w => w.id));
    for (const id of SMOKE_APP_IDS) {
      expect(ids.has(id), `expected app id "${id}" in the registry`).toBe(true);
    }
  });
});

describe('lazy-loaded apps render through the real window chrome', () => {
  /**
   * Drives WindowsDisplay, which is what the desktop actually renders, rather
   * than wrapping app content in an AppBoundary by hand. An earlier version of
   * this suite did the latter and so never exercised the real Window chrome.
   *
   * Note this does not by itself prove a Suspense boundary exists: opening a
   * window goes through startTransition, and React keeps the previous UI on a
   * transition rather than needing a fallback. The boundary matters for the
   * error case and for any open path that is not a transition.
   */
  const Harness: React.FC<{ ids: string[] }> = ({ ids }) => {
    const { toggleWindow } = useWindows();
    return (
      <div>
        {ids.map(id => (
          <button key={id} data-testid={`open-${id}`} onClick={() => toggleWindow(id)}>
            {id}
          </button>
        ))}
        <WindowsDisplay />
      </div>
    );
  };

  test('each representative app opens and renders its own content', async () => {
    const { container } = render(
      <WindowsProvider><PhysicsProvider><Harness ids={SMOKE_APP_IDS} /></PhysicsProvider></WindowsProvider>,
    );

    for (const id of SMOKE_APP_IDS) {
      await userEvent.click(screen.getByTestId(`open-${id}`));

      // The chunk must resolve: the placeholder goes away...
      await waitFor(() => {
        expect(screen.queryByText('Loading…')).toBeNull();
      }, { timeout: 15000 });

      // ...nothing hit the error boundary...
      expect(
        screen.queryByText('This app failed to load.'),
        `app "${id}" hit the error boundary`,
      ).toBeNull();

      // ...and the window rendered real content, not just its own chrome.
      expect(
        container.textContent!.length,
        `app "${id}" rendered no content`,
      ).toBeGreaterThan(60);
    }
  }, 90000);

});

describe('AppBoundary', () => {
  test('resolves a lazy child and renders it', async () => {
    const Lazy = React.lazy(() =>
      Promise.resolve({ default: () => <div>loaded content</div> }),
    );
    render(<AppBoundary><Lazy /></AppBoundary>);
    expect(await screen.findByText('loaded content')).toBeInTheDocument();
  });

  test('contains a render failure instead of propagating it', async () => {
    const Boom = () => { throw new Error('kaboom'); };
    // React logs the caught error; silence it for this test only.
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(<AppBoundary><Boom /></AppBoundary>);
    expect(await screen.findByText('This app failed to load.')).toBeInTheDocument();
    expect(screen.getByText('kaboom')).toBeInTheDocument();
    spy.mockRestore();
  });

  test('offers a retry that clears the error state', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    let shouldThrow = true;
    const Flaky = () => {
      if (shouldThrow) throw new Error('transient');
      return <div>recovered</div>;
    };
    render(<AppBoundary><Flaky /></AppBoundary>);
    expect(await screen.findByText('This app failed to load.')).toBeInTheDocument();

    shouldThrow = false;
    await userEvent.click(screen.getByRole('button', { name: /retry/i }));
    expect(await screen.findByText('recovered')).toBeInTheDocument();
    spy.mockRestore();
  });
});
