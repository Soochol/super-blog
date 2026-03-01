export default function GamingLaptopGuide() {
  return (
    <article className="prose max-w-none space-y-8">
      <section className="bg-neo-pink border-4 border-black shadow-hard p-8">
        <h2 className="text-3xl font-black text-black mb-4">게이밍 노트북이란?</h2>
        <p className="font-bold text-black text-lg leading-relaxed">
          게이밍 노트북은 고성능 GPU와 CPU를 탑재하여 최신 게임을 원활하게 구동할 수 있는 노트북입니다.
          일반 노트북 대비 높은 발열과 소비전력을 가지지만, 그래픽 집약적인 작업에서 압도적인 성능을 발휘합니다.
        </p>
      </section>

      <section className="bg-white border-4 border-black shadow-hard p-8">
        <h2 className="text-3xl font-black text-black mb-6">핵심 스펙 체크리스트</h2>
        <div className="space-y-4">
          {[
            { spec: 'GPU', desc: 'RTX 4060 이상 권장. 게임 FPS에 가장 큰 영향을 줍니다.', color: 'bg-neo-yellow' },
            { spec: 'CPU', desc: 'Intel Core i7 / AMD Ryzen 7 이상. 멀티태스킹과 스트리밍에 영향.', color: 'bg-neo-green' },
            { spec: 'RAM', desc: '16GB 최소, 32GB 권장. 최신 AAA 타이틀은 16GB+ 필요.', color: 'bg-neo-blue' },
            { spec: '디스플레이', desc: '144Hz 이상 고주사율. FPS 게임에서 체감 차이가 큽니다.', color: 'bg-neo-orange' },
            { spec: '냉각', desc: '듀얼 팬 이상. 장시간 게임 시 성능 유지에 필수.', color: 'bg-neo-pink' },
          ].map(({ spec, desc, color }) => (
            <div key={spec} className={`flex gap-4 items-start p-4 border-4 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${color}`}>
              <span className="font-black text-black text-lg w-24 shrink-0">{spec}</span>
              <span className="font-bold text-black">{desc}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-neo-green border-4 border-black shadow-hard p-8">
        <h2 className="text-3xl font-black text-black mb-4">예산별 추천 전략</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { budget: '100만원대', gpu: 'RTX 4060', tip: '1080p 고주사율 게임에 최적' },
            { budget: '150만원대', gpu: 'RTX 4070', tip: '1440p 게임과 창작 작업 병행' },
            { budget: '200만원+', gpu: 'RTX 4080/4090', tip: '4K 게임 및 전문 그래픽 작업' },
          ].map(({ budget, gpu, tip }) => (
            <div key={budget} className="bg-white border-4 border-black p-4">
              <p className="font-black text-black text-xl mb-2">{budget}</p>
              <p className="font-black text-neo-pink mb-1">{gpu}</p>
              <p className="font-bold text-black text-sm">{tip}</p>
            </div>
          ))}
        </div>
      </section>
    </article>
  );
}
