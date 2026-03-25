'use client';

import type { ComponentType } from 'react';
import ChatDemo from './ChatDemo';
import {
  ConfirmationBiasVisual,
  ConsilienceVisual,
  CriticalThinkingLoop,
  ExtrapolationVisual,
  FirstPrinciplesVisual,
  SearchLandscapeVisual,
} from './CriticalThinkingVisuals';
import GPEvolutionVisualizer from './GPEvolutionVisualizer';
import WelcomeTimeline from './WelcomeTimeline';

const COMPONENTS: Record<string, ComponentType> = {
  CriticalThinkingLoop,
  FirstPrinciplesVisual,
  ConfirmationBiasVisual,
  ExtrapolationVisual,
  ConsilienceVisual,
  SearchLandscapeVisual,
  GPEvolutionVisualizer,
  ChatDemo,
  WelcomeTimeline,
};

export default function EmbedRenderer({ name }: { name: string }) {
  const Component = COMPONENTS[name];
  if (!Component) return <div>Unknown visual: {name}</div>;
  return <Component />;
}
