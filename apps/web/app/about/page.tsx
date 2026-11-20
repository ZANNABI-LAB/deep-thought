import type { Metadata } from 'next';
import { Pending } from '@/components/Pending';

export const metadata: Metadata = { title: 'About me', robots: { index: false } };

export default function Page() {
  return <Pending area="ABOUT ME" status="COMING SOON" message="자기소개를 쓰는 중이에요. 곧 만나요." />;
}
