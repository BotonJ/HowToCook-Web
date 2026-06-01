import { Layout } from '@/components/Layout';
import { useMeta } from '@/hooks/useMeta';
import { useT } from '@/lib/i18n';
import { SITE_URL } from '@/lib/constants';

export function Explore() {
  const t = useT();
  useMeta({
    title: t.explore.title,
    description: t.explore.metaDesc,
    ogUrl: `${SITE_URL}/explore`,
  });

  return (
    <Layout>
      <iframe
        src="/explore/workbench.html"
        title={t.explore.title}
        className="w-full border-0"
        style={{ minHeight: 'calc(100vh - 200px)' }}
      />
    </Layout>
  );
}
