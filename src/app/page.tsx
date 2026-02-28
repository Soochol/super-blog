import Link from 'next/link';
import { getCategories } from '@/lib/api';

export default async function Home() {
  const categories = await getCategories();

  return (
    <div className="container mx-auto px-4 py-12">
      <section className="text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-6 tracking-tight">
          현명한 소비를 위한 <span className="text-blue-600">완벽한 비교 가이드</span>
        </h1>
        <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
          복잡한 스펙과 수많은 리뷰 사이에서 길을 잃지 마세요.
          데이터에 기반한 객관적인 분석으로 최상의 선택을 돕습니다.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-gray-900 mb-8 px-2 border-l-4 border-blue-600">
          인기 카테고리
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/${category.id}`}
              className="group block p-8 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-lg hover:border-blue-100 transition-all text-center"
            >
              <h3 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">
                {category.name}
              </h3>
              <p className="text-gray-500">
                {category.description}
              </p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
