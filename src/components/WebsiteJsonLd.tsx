import { SITE_URL } from '@/lib/constants';

export function WebsiteJsonLd() {
  const ld = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: '做饭指北',
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
      dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/<\/script>/gi, '<\\/script>') }}
    />
  );
}
