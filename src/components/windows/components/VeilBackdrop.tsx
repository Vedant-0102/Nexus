import React, { Suspense } from 'react';
import { SilentBoundary } from './AppBoundary';

/**
 * The animated DarkVeil backdrop, ready to drop behind any full-screen surface.
 *
 * The desktop and the lock, login and boot screens all sit on this, so the
 * shader settings live here rather than being repeated at each call site.
 *
 * It pulls in ogl, so it is code-split: the surface underneath paints its own
 * dark fill immediately and the canvas appears once the chunk lands. A WebGL
 * failure is swallowed by SilentBoundary, leaving that fill in place.
 */

const DarkVeil = React.lazy(() => import('../DarkVeil'));

/** Fill painted under the shader, so nothing flashes before the first frame. */
export const VEIL_BASE_COLOR = '#07070f';

/** How quickly the colour field drifts. */
const VEIL_SPEED = 1;

export const VeilBackdrop: React.FC = () => (
  <div className="absolute inset-0 pointer-events-none overflow-hidden">
    <SilentBoundary>
      <Suspense fallback={null}>
        <DarkVeil
          hueShift={0}
          noiseIntensity={0}
          scanlineIntensity={0}
          speed={VEIL_SPEED}
          scanlineFrequency={0}
          warpAmount={0}
        />
      </Suspense>
    </SilentBoundary>
  </div>
);
