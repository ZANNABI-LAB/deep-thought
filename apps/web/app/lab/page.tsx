import type { Metadata } from 'next';
import { Pending } from '@/components/Pending';

export const metadata: Metadata = { title: 'Lab', robots: { index: false } };

export default function Page() {
  return <Pending area="LAB" status="ACCESS DENIED" message="실험실은 아직 출입 허가가 필요한 구역이에요." />;
}
