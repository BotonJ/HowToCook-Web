import { useEffect, useState } from 'react';

interface CaseData {
  tomato: { name: string; neighbors: string[] };
  egg: { name: string; neighbors: string[] };
  cosine: number;
  cooccurrence: number;
}

export function TomatoEggCase() {
  const [data, setData] = useState<CaseData | null>(null);

  useEffect(() => {
    fetch('/data/flavor/tomato-egg-case.json')
      .then(r => r.json())
      .then(setData);
  }, []);

  if (!data) {
    return <div className="text-center py-20 text-on-surface-variant">加载中...</div>;
  }

  return (
    <section className="py-24 bg-surface-container-highest/30">
      <div className="max-w-6xl mx-auto px-4 md:px-16">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-20 space-y-4">
          <h2 className="font-display text-headline-xl">跨界奇迹：西红柿与鸡蛋</h2>
          <p className="text-body-md text-on-surface-variant">为什么原本分属于"蔬菜社群"与"烘焙/蛋白质社群"的两者，在数据上却呈现出惊人的亲和力？</p>
        </div>

        {/* Three columns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          {/* Tomato card */}
          <div className="bg-white p-10 rounded-[32px] shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-8">
                <span className="text-label-sm font-bold text-error tracking-widest uppercase">Ingredient A</span>
                <span className="material-symbols-outlined text-error">nutrition</span>
              </div>
              <h3 className="font-display text-headline-lg mb-2">西红柿</h3>
              <div className="space-y-4 mt-6">
                <div className="flex justify-between text-body-md">
                  <span className="text-on-surface-variant">社区分类</span>
                  <span className="font-bold">蔬菜社群</span>
                </div>
                <div className="flex justify-between text-body-md">
                  <span className="text-on-surface-variant">主要化合物</span>
                  <span className="font-bold text-error">谷氨酸盐</span>
                </div>
              </div>
            </div>
            {/* Image */}
            <div className="mt-12 h-40 rounded-2xl bg-surface-container overflow-hidden">
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCosaCypdRsMI3VfdkLKs-ZSWrmjmahtUiyA6JGFuFV4S45ZNU2knVEtzdQu6PSke2r2tVb1308Ua_G25bxfHj4aEmyR-h-aSoiq6J91YsXEmK-jO2xtTYTm7jkp8KIazPqnfOgpe3v4r14bwclL0C-9I1Oy1-nChKgpfb-He9TSfHR1Z8T7H1Zd2sqeBhfsKBDT139sEz_mziAjBUx-KIvjf4o0WIOapSDxfcp3w4M9JVmNaYwiNcD"
                alt="西红柿"
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
          </div>

          {/* Center: link & stats */}
          <div className="flex flex-col items-center justify-center space-y-8 p-6 text-center">
            <div className="relative w-full">
              <div className="h-px w-full bg-outline-variant absolute top-1/2 -z-10" />
              <div className="bg-secondary-fixed text-on-secondary-fixed px-6 py-2 rounded-full inline-block font-mono text-sm font-bold border border-secondary">
                COSINE {data.cosine}
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-headline-xl font-bold text-primary">{data.cooccurrence.toLocaleString()}</div>
              <p className="text-label-sm text-on-surface-variant font-bold tracking-widest">共现频次</p>
            </div>
            <div className="p-6 bg-primary-fixed/20 rounded-2xl border border-primary/10">
              <p className="text-body-md italic text-primary leading-relaxed">
                "它们在鲜味分子维度上的高度互补，完美中和了番茄的酸性与蛋液的油脂感。"
              </p>
            </div>
          </div>

          {/* Egg card */}
          <div className="bg-white p-10 rounded-[32px] shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-8">
                <span className="text-label-sm font-bold text-secondary tracking-widest uppercase">Ingredient B</span>
                <span className="material-symbols-outlined text-secondary">egg</span>
              </div>
              <h3 className="font-display text-headline-lg mb-2">鸡蛋</h3>
              <div className="space-y-4 mt-6">
                <div className="flex justify-between text-body-md">
                  <span className="text-on-surface-variant">社区分类</span>
                  <span className="font-bold">烘焙/蛋白质</span>
                </div>
                <div className="flex justify-between text-body-md">
                  <span className="text-on-surface-variant">主要化合物</span>
                  <span className="font-bold text-secondary">硫化物/卵磷脂</span>
                </div>
              </div>
            </div>
            {/* Image */}
            <div className="mt-12 h-40 rounded-2xl bg-surface-container overflow-hidden">
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuA4_Hy7WXsxeZAnAg3Fp9-iV6DmRqyIHW3E1GOxVmKeinSiQFb9Tb_meUo_O0mfafyZbWR03nGcOsbXa-QvxV4sle7We79C8eAWUOSHGf92B2GBfF2CaS3-pATpqxcyyYQ9LVJSLidahAzPV93H_B4DO8TGm--pk2nCvdtwk0MSIVzP_fT0_omTXERKv98EnbyZ3Fhc9Jm6VC_DtGb3WnZ9fwrHRDAyExpZbkjcEM6jajF4LPagzMJs"
                alt="鸡蛋"
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
