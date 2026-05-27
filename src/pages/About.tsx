import { Layout } from '@/components/Layout';
import { useMeta } from '@/hooks/useMeta';
import { SITE_URL } from '@/lib/constants';

export function About() {
  useMeta({
    title: '关于',
    description: 'HowToCook — AI 驱动的菜谱平台，500+ 道菜谱覆盖 17 大菜系，支持 MCP 协议接口。',
    ogUrl: `${SITE_URL}/about`,
  });
  return (
    <Layout>
      <div className="py-8 space-y-8 max-w-2xl">
        <h1 className="font-display text-headline-xl text-on-surface">关于 HowToCook</h1>

        <p className="font-body text-body-lg text-on-surface-variant leading-relaxed">
          HowToCook 是一个 AI 驱动的菜谱平台，为所有下厨的人提供精确、可执行的烹饪指南。
        </p>

        <div className="space-y-6 font-body text-body-md text-on-surface-variant leading-relaxed">
          <p>
            496 道菜谱，覆盖川、粤、鲁、湘等 17 大菜系，支持按难度、时间、食材、辣度等多维度筛选。
            通过偏好学习系统，越用越懂你的口味。
          </p>
          <p>
            本站同时提供 MCP 协议接口，支持 Claude Code 等 AI 助手直接调用菜谱引擎，实现智能推荐和购物清单生成。
          </p>
        </div>
      </div>
    </Layout>
  );
}
