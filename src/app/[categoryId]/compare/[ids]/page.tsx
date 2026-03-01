import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getCategories, getProductsByCategory, getProductById, getComparisonReviews } from '@/lib/api';
import { safeJsonLd } from '@/lib/seo';
import ProductSpecTable from '@/components/product/ProductSpecTable';
import Image from 'next/image';

const IDS_SEPARATOR = '-vs-';

export async function generateStaticParams() {
    const categories = await getCategories();

    const allPaths = await Promise.all(
        categories.map(async (category) => {
            const products = await getProductsByCategory(category.id);
            const paths: { categoryId: string; ids: string }[] = [];
            for (let i = 0; i < products.length; i++) {
                for (let j = i + 1; j < products.length; j++) {
                    paths.push({
                        categoryId: category.id,
                        ids: `${products[i].id}${IDS_SEPARATOR}${products[j].id}`,
                    });
                }
            }
            return paths;
        })
    );

    return allPaths.flat();
}

export async function generateMetadata({ params }: { params: Promise<{ categoryId: string, ids: string }> }): Promise<Metadata> {
    const resolvedParams = await params;
    const [idA, idB] = resolvedParams.ids.split(IDS_SEPARATOR);

    if (!idA || !idB) return { title: 'Not Found' };

    const [productA, productB] = await Promise.all([getProductById(idA), getProductById(idB)]);

    if (!productA || !productB) return { title: 'Not Found' };

    return {
        title: `${productA.name} vs ${productB.name} 비교 - 어떤 게 나을까? | Super Blog`,
        description: `${productA.name}와 ${productB.name}를 스펙, 가격, 성능 기준으로 상세히 비교 분석합니다.`,
    };
}

export default async function ComparePage({ params }: { params: Promise<{ categoryId: string, ids: string }> }) {
    const resolvedParams = await params;
    const [idA, idB] = resolvedParams.ids.split(IDS_SEPARATOR);

    if (!idA || !idB) notFound();

    const [productA, productB] = await Promise.all([getProductById(idA), getProductById(idB)]);

    if (!productA || !productB || productA.categoryId !== resolvedParams.categoryId || productB.categoryId !== resolvedParams.categoryId) {
        notFound();
    }

    const { reviewA, reviewB } = await getComparisonReviews(productA.id, productB.id);

    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: `${productA.name} vs ${productB.name} 비교`,
        itemListElement: [
            { '@type': 'ListItem', position: 1, name: productA.name, url: `/${resolvedParams.categoryId}/${productA.id}` },
            { '@type': 'ListItem', position: 2, name: productB.name, url: `/${resolvedParams.categoryId}/${productB.id}` },
        ],
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }}
            />
            <div className="container mx-auto px-4 py-8 max-w-5xl">
            <div className="text-center mb-16 mt-8">
                <h1 className="text-4xl md:text-5xl font-black text-black mb-6 tracking-tight uppercase leading-snug">
                    <span className="bg-neo-blue text-white px-4 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] inline-block mb-2 md:mb-0 mr-2">{productA.brand}</span>
                    <span className="mx-2 text-3xl">VS</span>
                    <span className="bg-neo-pink text-black px-4 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] inline-block">{productB.brand}</span>
                </h1>
                <p className="text-2xl font-bold text-black bg-neo-yellow inline-block px-4 py-1 border-2 border-black uppercase">어떤 제품이 나에게 더 맞을까?</p>
            </div>

            <div className="grid grid-cols-2 gap-4 md:gap-12 mb-16 relative">
                <div className="text-center bg-white p-6 border-4 border-black shadow-hard flex flex-col h-full transform hover:-translate-y-1 transition-transform">
                    <div className="h-40 flex items-center justify-center mb-6 p-2 bg-gray-50 border-4 border-black">
                        <Image src={productA.imageUrl} alt={productA.name} width={300} height={160} className="max-h-full object-contain mix-blend-multiply" />
                    </div>
                    <h2 className="text-xl font-black text-black mb-4 uppercase line-clamp-2">{productA.name}</h2>
                    <div className="mt-auto">
                        <p className="text-3xl font-black text-black bg-neo-yellow inline-block px-2 border-2 border-black">{productA.price.toLocaleString()}원</p>
                    </div>
                </div>

                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 md:w-24 md:h-24 rounded-none bg-neo-yellow border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-black flex items-center justify-center font-black text-2xl md:text-4xl z-10 rotate-12">
                    VS
                </div>

                <div className="text-center bg-white p-6 border-4 border-black shadow-hard flex flex-col h-full transform hover:-translate-y-1 transition-transform">
                    <div className="h-40 flex items-center justify-center mb-6 p-2 bg-gray-50 border-4 border-black">
                        <Image src={productB.imageUrl} alt={productB.name} width={300} height={160} className="max-h-full object-contain mix-blend-multiply" />
                    </div>
                    <h2 className="text-xl font-black text-black mb-4 uppercase line-clamp-2">{productB.name}</h2>
                    <div className="mt-auto">
                        <p className="text-3xl font-black text-black bg-neo-yellow inline-block px-2 border-2 border-black">{productB.price.toLocaleString()}원</p>
                    </div>
                </div>
            </div>

            <div className="mb-10">
                <h3 className="text-3xl font-black text-white bg-black inline-block px-4 py-2 mb-8 border-4 border-black shadow-hard uppercase">
                    핵심 스펙 나란히 보기
                </h3>
                <ProductSpecTable productA={productA} productB={productB} />
            </div>

            {(reviewA || reviewB) && (
                <div className="mb-10">
                    <h3 className="text-3xl font-black text-white bg-black inline-block px-4 py-2 mb-8 border-4 border-black shadow-hard uppercase">
                        AI 리뷰 비교
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {reviewA && (
                            <div className="bg-neo-blue p-6 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                <h4 className="text-xl font-black text-black mb-4 bg-white px-2 py-1 border-2 border-black inline-block">{productA.name}</h4>
                                <p className="text-black font-bold mb-4">&ldquo;{reviewA.summary}&rdquo;</p>
                                <div className="space-y-2">
                                    {reviewA.pros.map((p, i) => (
                                        <p key={i} className="text-black font-bold">{'\u25BA'} {p}</p>
                                    ))}
                                </div>
                            </div>
                        )}
                        {reviewB && (
                            <div className="bg-neo-pink p-6 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                <h4 className="text-xl font-black text-black mb-4 bg-white px-2 py-1 border-2 border-black inline-block">{productB.name}</h4>
                                <p className="text-black font-bold mb-4">&ldquo;{reviewB.summary}&rdquo;</p>
                                <div className="space-y-2">
                                    {reviewB.pros.map((p, i) => (
                                        <p key={i} className="text-black font-bold">{'\u25BA'} {p}</p>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
        </>
    );
}
