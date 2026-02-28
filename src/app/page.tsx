import Link from 'next/link';
import { getCategories } from '@/lib/api';

export default async function Home() {
  const categories = await getCategories();

  return (
    <div className="flex flex-col">
      <section className="w-full bg-neo-yellow border-b-4 border-black py-20 px-4 mb-16">
        <div className="container mx-auto text-center">
          <h1 className="text-5xl md:text-7xl font-black text-black mb-8 leading-tight uppercase tracking-tight">
            현명한 소비를 위한 <br /><span className="bg-black text-neo-yellow px-4 py-2 mt-4 inline-block border-4 border-black shadow-hard">완벽한 비교 가이드</span>
          </h1>
          <p className="text-xl md:text-2xl font-bold text-black max-w-3xl mx-auto border-2 border-black bg-white p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            복잡한 스펙과 수많은 리뷰 사이에서 길을 잃지 마세요.<br />
            데이터에 기반한 객관적인 분석으로 최상의 선택을 돕습니다.
          </p>
        </div>
      </section>

      <section className="container mx-auto px-4 mb-24">
        <div className="flex items-center mb-10">
          <h2 className="text-4xl font-black text-black bg-neo-blue text-white px-4 py-2 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] uppercase">
            인기 카테고리
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/${category.id}`}
              className="group block p-10 bg-white border-4 border-black shadow-hard hover:shadow-hard-lg hover:-translate-y-2 hover:-translate-x-2 transition-all text-center relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-neo-green/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out z-0"></div>
              <div className="relative z-10">
                <h3 className="text-3xl font-black text-black mb-4 uppercase">
                  {category.name}
                </h3>
                <p className="text-lg font-bold text-black border-t-2 border-black pt-4">
                  {category.description}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
