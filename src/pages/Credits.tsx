import { Layout } from '@/components/Layout';

const credits = [
  {
    name: 'HowToCook 源仓库',
    description: '开源菜谱项目（GitHub 100k+ stars），程序员风格菜谱。精确量化，步骤带公式。',
    link: 'https://github.com/Anduin2017/HowToCook',
  },
  {
    name: '随便做',
    description: '火遍全网的国宴大厨隋坡，140 道简易/进阶菜谱。随便一做，怎么都好吃。',
  },
  {
    name: '金谷园',
    description: '第一个开源的饺子馆 Skill，招牌甜品牛奶醪糟鸡蛋。',
  },
];

export function Credits() {
  return (
    <Layout>
      <div className="py-8 space-y-8">
        <h1 className="font-display text-headline-xl text-on-surface">致谢</h1>
        <p className="font-body text-body-lg text-on-surface-variant max-w-xl">
          感谢以下项目和创作者的贡献，让 HowToCook 的菜谱库不断丰富。
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
                  访问项目 →
                </a>
              )}
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}