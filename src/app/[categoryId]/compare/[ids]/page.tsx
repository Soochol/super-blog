import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getCategories, getProductsByCategory, getProductById } from '@/lib/api';
import ProductSpecTable from '@/domains/product/ProductSpecTable';

export async function generateStaticParams() {
    const categories = await getCategories();
    const paths: { categoryId: string, ids: string }[] = [];

    for (const category of categories) {
        const products = await getProductsByCategory(category.id);
        // Generate simple combinations A vs B for demonstration
        for (let i = 0; i < products.length; i++) {
            for (let j = i + 1; j < products.length; j++) {
                paths.push({
                    categoryId: category.id,
                    ids: `${products[i].id}-vs-${products[j].id}`
                });
            }
        }
    }

    return paths;
}

export async function generateMetadata({ params }: { params: Promise<{ categoryId: string, ids: string }> }): Promise<Metadata> {
    const resolvedParams = await params;
    const [idA, idB] = resolvedParams.ids.split('-vs-');

    if (!idA || !idB) return { title: 'Not Found' };

    const productA = await getProductById(idA);
    const productB = await getProductById(idB);

    if (!productA || !productB) return { title: 'Not Found' };

    return {
        title: `${productA.name} vs ${productB.name} 비교 - 어떤 게 나을까? | Super Blog`,
        description: `${productA.name}와 ${productB.name}를 스펙, 가격, 성능 기준으로 상세히 비교 분석합니다.`,
    };
}

export default async function ComparePage({ params }: { params: Promise<{ categoryId: string, ids: string }> }) {
    const resolvedParams = await params;
    const [idA, idB] = resolvedParams.ids.split('-vs-');

    if (!idA || !idB) notFound();

    const productA = await getProductById(idA);
    const productB = await getProductById(idB);

    if (!productA || !productB || productA.categoryId !== resolvedParams.categoryId) {
        notFound();
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-5xl">
            <div className="text-center mb-10">
                <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4 tracking-tight">
                    <span className="text-blue-600">{productA.brand}</span> vs <span className="text-[#FF9B00]">{productB.brand}</span>
                </h1>
                <p className="text-xl text-gray-600">어떤 제품이 나에게 더 맞을까?</p>
            </div>

            <div className="grid grid-cols-2 gap-4 md:gap-8 mb-12">
                <div className="text-center bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col h-full">
                    <div className="h-40 flex items-center justify-center mb-4 p-2">
                        <img src={productA.imageUrl} alt={productA.name} className="max-h-full object-contain mix-blend-multiply" />
                    </div>
                    <h2 className="text-lg font-bold text-gray-900 mb-2 truncate" title={productA.name}>{productA.name}</h2>
                    <div className="mt-auto">
                        <p className="text-2xl font-black text-blue-600 mb-1">{productA.price.toLocaleString()}원</p>
                    </div>
                </div>

                <div className="text-center bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col h-full relative">
                    <div className="absolute top-1/2 -left-4 md:-left-8 -translate-y-1/2 w-8 h-8 md:w-16 md:h-16 rounded-full bg-gray-900 text-white flex items-center justify-center font-black text-sm md:text-2xl z-10 border-4 border-gray-50">
                        VS
                    </div>
                    <div className="h-40 flex items-center justify-center mb-4 p-2">
                        <img src={productB.imageUrl} alt={productB.name} className="max-h-full object-contain mix-blend-multiply" />
                    </div>
                    <h2 className="text-lg font-bold text-gray-900 mb-2 truncate" title={productB.name}>{productB.name}</h2>
                    <div className="mt-auto">
                        <p className="text-2xl font-black text-[#FF9B00] mb-1">{productB.price.toLocaleString()}원</p>
                    </div>
                </div>
            </div>

            <div className="mb-10">
                <h3 className="text-2xl font-bold text-gray-900 mb-6 px-2 border-l-4 border-gray-900">
                    핵심 스펙 나란히 보기
                </h3>
                <ProductSpecTable productA={productA} productB={productB} />
            </div>
        </div>
    );
}
