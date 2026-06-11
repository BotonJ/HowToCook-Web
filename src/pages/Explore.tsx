import { FlavorWorkbench } from '@/components/flavor-workbench/FlavorWorkbench';
import { useMeta } from '@/hooks/useMeta';
import { useT } from '@/lib/i18n';
import { SITE_URL } from '@/lib/constants';

export function Explore() {
  const t = useT();
  useMeta({
    title: t.nav.explore,
    description: '探索食材风味关联，发现搭配灵感，分析多食材合成风味。',
    ogUrl: `${SITE_URL}/explore`,
  });

  return <FlavorWorkbench />;
}
