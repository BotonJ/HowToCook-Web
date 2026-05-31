import { Layout } from '@/components/Layout';
import { useMeta } from '@/hooks/useMeta';
import { SITE_URL } from '@/lib/constants';

export function About() {
  useMeta({
    title: 'About',
    description: 'HowToCook — AI-powered recipe platform with 500+ recipes across 17 cuisines, with MCP protocol support.',
    ogUrl: `${SITE_URL}/about`,
  });
  return (
    <Layout>
      <div className="py-8 space-y-8 max-w-2xl">
        <h1 className="font-display text-headline-xl text-on-surface">About HowToCook</h1>

        <p className="font-body text-body-lg text-on-surface-variant leading-relaxed">
          HowToCook is an AI-powered recipe platform providing precise, actionable cooking guides for everyone.
        </p>

        <div className="space-y-6 font-body text-body-md text-on-surface-variant leading-relaxed">
          <p>
            496 recipes across 17 major cuisines including Sichuan, Cantonese, Shandong, Hunan and more. Filter by difficulty, time, ingredients, and spice level. The preference learning system adapts to your taste over time.
          </p>
          <p>
            This site also provides MCP protocol interface, supporting AI assistants like Claude Code to directly access the recipe engine for smart recommendations and shopping list generation.
          </p>
        </div>
      </div>
    </Layout>
  );
}
