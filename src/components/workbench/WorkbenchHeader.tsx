import { useWorkbench } from './WorkbenchContext';

const MODE_CONFIG: Record<
  string,
  { label: string; color: string; bg: string; desc: string }
> = {
  guide: {
    label: '引导',
    color: 'text-on-surface-variant',
    bg: 'bg-surface-container',
    desc: '选 1 个食材探索风味圈，选 2+ 个食材合成分析',
  },
  explore: {
    label: '探索模式',
    color: 'text-primary',
    bg: 'bg-primary-container',
    desc: '正在探索单个食材的风味圈与搭配',
  },
  compose: {
    label: '合成模式',
    color: 'text-secondary',
    bg: 'bg-secondary-container',
    desc: '正在分析多个食材的风味合成与平衡',
  },
};

export function WorkbenchHeader() {
  const { state } = useWorkbench();
  const cfg = MODE_CONFIG[state.mode];

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3 flex-wrap">
        <h1
          className="font-display text-headline-lg bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent"
        >
          风味工作台
        </h1>
        <span
          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${cfg.bg} ${cfg.color}`}
        >
          {cfg.label}
        </span>
      </div>
      <p className="text-sm text-on-surface-variant font-body">{cfg.desc}</p>
    </div>
  );
}
