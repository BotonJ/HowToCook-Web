import { Layout } from '@/components/Layout';
import { useMeta } from '@/hooks/useMeta';
import { SITE_URL } from '@/lib/constants';

const credits = [
  {
    name: 'HowToCook Source Repo',
    description: 'Open-source recipe project (GitHub 100k+ stars). Programmer-style recipes with precise quantification and formula-based steps.',
    link: 'https://github.com/Anduin2017/HowToCook',
  },
  {
    name: 'Sui Bian Zuo',
    description: 'Chef Sui Po, famous across China, with 140 easy/advanced recipes. Just cook — it always tastes good.',
  },
  {
    name: 'Jin Gu Yuan',
    description: 'The first open-source dumpling restaurant Skill. Signature dessert: milk醪糟 egg.',
  },
];

export function Credits() {
  useMeta({
    title: 'Credits',
    description: 'Thanks to HowToCook Source Repo, Sui Bian Zuo, Jin Gu Yuan and other projects and creators for their contributions.',
    ogUrl: `${SITE_URL}/credits`,
  });

  return (
    <Layout>
      <div className="py-8 space-y-8">
        <h1 className="font-display text-headline-xl text-on-surface">Credits</h1>
        <p className="font-body text-body-lg text-on-surface-variant max-w-xl">
          Thanks to the following projects and creators for enriching HowToCook&apos;s recipe library.
        </p>
        <div className="grid gap-4 max-w-2xl">
          {credits.map((credit) => (
            <div
              key={credit.name}
              className="bg-surface-container-low rounded-lg p-6 shadow-ambient"
            >
              <h3 className="font-display text-headline-md text-on-surface mb-2">
                {credit.name}
              </h3>
              <p className="font-body text-body-md text-on-surface-variant">
                {credit.description}
              </p>
              {credit.link && (
                <a
                  href={credit.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block mt-2 text-primary hover:underline font-label-lg text-label-lg"
                >
                  Visit Project →
                </a>
              )}
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}