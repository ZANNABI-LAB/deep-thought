import { PageShell } from '@/components/PageShell';

export default function WritingLayout({ children }: { children: React.ReactNode }) {
  return <PageShell current="/writing">{children}</PageShell>;
}
