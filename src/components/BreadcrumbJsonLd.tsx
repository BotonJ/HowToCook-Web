import { SITE_URL, CATEGORY_LABELS } from '@/lib/constants';

interface BreadcrumbJsonLdProps {
  categoryName: string;
  recipeName: string;
}

export function BreadcrumbJsonLd({ categoryName, recipeName }: BreadcrumbJsonLdProps) {
  const categoryDisplay = CATEGORY_LABELS[categoryName] || categoryName;

  const ld = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: '首页',
        item: SITE_URL,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: categoryDisplay,
        item: `${SITE_URL}/category/${categoryName}`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: recipeName,
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/<\/script>/gi, '<\\/script>') }}
    />
  );
}
