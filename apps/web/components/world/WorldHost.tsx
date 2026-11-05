'use client';

import { usePathname } from 'next/navigation';
import { useState } from 'react';
import type { LatestPost } from './FacilityWidget';
import { GodotStage } from './GodotStage';

/** 다시 띄우면 엔진을 처음부터 시작해야 해서, 홈을 처음 연 뒤로는 다른 페이지에서도 숨겨 둔 채 살려 둔다 */
export function WorldHost({ latestPost }: { latestPost?: LatestPost }) {
  const home = usePathname() === '/';
  const [visited, setVisited] = useState(home);
  if (home && !visited) setVisited(true);

  return visited ? <GodotStage active={home} latestPost={latestPost} /> : null;
}
