import type { Metadata } from 'next';
import { Pending } from '@/components/Pending';

export const metadata: Metadata = { title: 'Arcade', robots: { index: false } };

export default function Page() {
  return <Pending area="ARCADE" status="COMING SOON" message="오락기를 조립하고 있어요. 동전은 조금만 기다려 주세요." />;
}
