import type { Metadata } from 'next';
import { Pending } from '@/components/Pending';

export const metadata: Metadata = { title: 'Portfolio', robots: { index: false } };

export default function Page() {
  return <Pending area="PORTFOLIO" message="작업들을 정리하고 있어요. 곧 이 구역이 열려요." />;
}
