'use client';

import { Timeline } from '@/components/ui/timeline';
import { welcomeTimelineData } from '@/data/welcomeTimeline';

export default function WelcomeTimeline() {
  return <Timeline data={welcomeTimelineData} />;
}
