import { MousePointerClick, Compass, Blend } from 'lucide-react';

const STEPS = [
  {
    icon: MousePointerClick,
    title: '选择食材',
    desc: '搜索或点击快捷标签选择 1 个食材，进入探索模式',
    color: 'text-primary',
    bg: 'bg-primary-container',
  },
  {
    icon: Compass,
    title: '探索风味圈',
    desc: '查看 6 维风味、搭配推荐、模式归属和菜系探索',
    color: 'text-secondary',
    bg: 'bg-secondary-container',
  },
  {
    icon: Blend,
    title: '合成分析',
    desc: '选择 2+ 食材，查看雷达图叠加、平衡检测和补充建议',
    color: 'text-tertiary',
    bg: 'bg-tertiary-container',
  },
];

export function GuideView() {

  return (
    <div className="rounded-2xl border border-outline-variant bg-surface-container-low p-6 md:p-8">
      <h2 className="font-display text-headline-md text-on-surface mb-6">开始使用风味工作台</h2>
      <div className="grid gap-4 md:grid-cols-3">
        {STEPS.map((step, i) => {
          const Icon = step.icon;
          return (
            <div
              key={i}
              className="text-left rounded-xl border border-outline-variant bg-surface-container-lowest p-5 transition hover:shadow-md hover:border-primary/30"
            >
              <div
                className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full ${step.bg}`}
              >
                <Icon className={`h-5 w-5 ${step.color}`} />
              </div>
              <h3 className="font-semibold text-on-surface mb-1">{step.title}</h3>
              <p className="text-sm text-on-surface-variant leading-relaxed">{step.desc}</p>
            </div>
          );
        })}
      </div>

      <div className="mt-6 text-center">
        <p className="text-xs text-on-surface-variant">
          提示：选择食材后，系统会自动在"探索"和"合成"模式间切换
        </p>
      </div>
    </div>
  );
}
