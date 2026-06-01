import { SITE_URL } from '@/lib/constants';
import { safeJsonLd } from '@/lib/utils';

export function WebsiteJsonLd() {
  const ld = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'HowToCook',
    alternateName: 'HowToCook',
    url: SITE_URL,
    potentialAction: {
      '@type': 'SearchAction',
      target: { '@type': 'EntryPoint', urlTemplate: `${SITE_URL}/?q={search_term_string}` },
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: safeJsonLd(ld) }}
    />
  );
}
