import { useParams, Link } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { useMeta } from '@/hooks/useMeta';
import { SITE_URL } from '@/lib/constants';
import { ArrowLeft } from 'lucide-react';

import tipsData from '@/data/tips.json';

interface TipMeta {
  slug: string;
  title: string;
  summary: string;
  category: string;
  content: string;
}

const tips = tipsData as TipMeta[];

export function TipDetail() {
  const { slug } = useParams<{ slug: string }>();
  const tip = tips.find(t => t.slug === slug);

  useMeta({
    title: tip?.title || 'Not Found',
    description: tip?.summary || 'Cooking Knowledge Article',
    ogUrl: `${SITE_URL}/academy/${slug}`,
  });

  if (!tip) {
    return (
      <Layout>
        <div className="py-20 text-center">
          <h1 className="font-display text-headline-xl text-on-surface mb-4">Article Not Found</h1>
          <p className="font-body text-body-lg text-on-surface-variant mb-6">
            This article is not yet published. Please return to the list to view published content.
          </p>
          <Link
            to="/academy"
            className="inline-flex items-center gap-2 text-primary hover:underline font-label-lg"
          >
            <ArrowLeft size={16} />
            Back to Cooking Academy
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="py-8 max-w-3xl">
        <Link
          to="/tips"
          className="inline-flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors text-label-lg mb-6"
        >
          <ArrowLeft size={16} />
          Cooking Academy
        </Link>

        <article className="prose prose-slate max-w-none">
          <h1 className="font-display text-headline-xl text-on-surface mb-4">{tip.title}</h1>
          <div className="font-body text-body-md text-on-surface-variant leading-relaxed whitespace-pre-wrap">
            {tip.content}
          </div>
        </article>
      </div>
    </Layout>
  );
}
