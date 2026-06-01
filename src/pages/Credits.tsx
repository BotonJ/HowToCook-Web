import { Layout } from '@/components/Layout';
import { useMeta } from '@/hooks/useMeta';
import { useT } from '@/lib/i18n';
import { SITE_URL } from '@/lib/constants';

const CREDIT_KEYS = ['howtocook', 'suibo', 'jinguyuan'] as const;
const CREDIT_LINKS: Record<string, string> = {
  howtocook: 'https://github.com/Anduin2017/HowToCook',
};

export function Credits() {
  const t = useT();
  useMeta({
    title: t.credits.metaTitle,
    description: t.credits.metaDesc,
    ogUrl: `${SITE_URL}/credits`,
  });

  return (
    <Layout>
      <div className="py-8 space-y-8">
        <h1 className="font-display text-headline-xl text-on-surface">{t.credits.title}</h1>
        <p className="font-body text-body-lg text-on-surface-variant max-w-xl">
          {t.credits.intro}
        </p>
        <div className="grid gap-4 max-w-2xl">
          {CREDIT_KEYS.map((key) => {
            const item = t.credits.items[key];
            return (
              <div
                key={key}
                className="bg-surface-container-low rounded-lg p-6 shadow-ambient"
              >
                <h3 className="font-display text-headline-md text-on-surface mb-2">
                  {item.name}
                </h3>
                <p className="font-body text-body-md text-on-surface-variant">
                  {item.description}
                </p>
                {CREDIT_LINKS[key] && (
                  <a
                    href={CREDIT_LINKS[key]}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block mt-2 text-primary hover:underline font-label-lg text-label-lg"
                  >
                    {t.credits.visitProject}
                  </a>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </Layout>
  );
}