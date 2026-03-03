'use client';
import { type ComponentProps, lazy, Suspense } from 'react';
import type { PlexusBackground as PlexusBackgroundType } from './plexus-webgl/PlexusScene';

const PlexusSceneLazy = lazy(() =>
  import('./plexus-webgl/PlexusScene').then((m) => ({ default: m.PlexusBackground })),
);

export function PlexusBackground(props: ComponentProps<typeof PlexusBackgroundType>) {
  return (
    <Suspense fallback={null}>
      <PlexusSceneLazy {...props} />
    </Suspense>
  );
}
