import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getCategories, getProductsByCategory, getProductById, getReviewByProductId } from '@/lib/api';
import ProductSpecTable from '@/components/product/ProductSpecTable';
import BuyButtonCTA from '@/components/monetization/BuyButtonCTA';
import { Star, CheckCircle, XCircle } from 'lucide-react';

export async function generateStaticParams() {
    const categories = await getCategories();

    const allPaths = await Promise.all(
        categories.map(async (category) => {
            const products = await getProductsByCategory(category.id);
            return products.map((product) => ({
                categoryId: category.id,
                productId: product.id,
            }));
        })
    );

    return allPaths.flat();
}

export async function generateMetadata({ params }: { params: Promise<{ categoryId: string, productId: string }> }): Promise<Metadata> {
    const resolvedParams = await params;
    const product = await getProductById(resolvedParams.productId);

    if (!product || product.categoryId !== resolvedParams.categoryId) {
        return { title: 'Not Found' };
    }

    return {
        title: `${product.name} 스펙 및 리뷰 - 장단점 분석 | Super Blog`,
        description: `${product.name}의 상세 스펙 정보, 장단점, 그리고 최저가 트렌드를 분석합니다.`,
    };
}

export default async function ProductDetailPage({ params }: { params: Promise<{ categoryId: string, productId: string }> }) {
    const resolvedParams = await params;
    const product = await getProductById(resolvedParams.productId);

    if (!product || product.categoryId !== resolvedParams.categoryId) {
        notFound();
    }

    const review = await getReviewByProductId(product.id);

    return (
        <div className="container mx-auto px-4 py-8 max-w-5xl">
            {/* Product Header */}
            <div className="bg-white p-6 md:p-10 border-4 border-black shadow-hard mb-12 relative">
                <div className="flex flex-col md:flex-row gap-10">
                    <div className="w-full md:w-2/5 flex items-center justify-center p-4 bg-neo-yellow border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                        <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="max-w-full h-auto object-contain mix-blend-multiply"
                        />
                    </div>

                    <div className="w-full md:w-3/5 flex flex-col justify-center">
                        <span className="text-sm font-black text-white bg-neo-blue px-3 py-1 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] w-fit mb-4 uppercase">
                            {product.brand}
                        </span>
                        <h1 className="text-3xl md:text-5xl font-black text-black mb-6 tracking-tight uppercase">
                            {product.name}
                        </h1>

                        {review && (
                            <div className="flex items-center gap-2 mb-8 bg-neo-green px-4 py-2 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] w-fit">
                                <Star className="w-6 h-6 fill-neo-yellow stroke-black stroke-2" />
                                <span className="text-2xl font-black text-black">{review.rating}</span>
                                <span className="text-sm font-bold text-black ml-2 uppercase">블로그 AI 전문가 평점</span>
                            </div>
                        )}

                        <div className="mt-auto pt-6 border-t-4 border-black flex flex-col sm:flex-row justify-between items-center gap-6">
                            <div>
                                <span className="block text-sm font-bold text-black mb-1 bg-neo-yellow px-1 inline-block">현재 최저가</span>
                                <span className="block text-4xl font-black text-black tracking-tight mt-1">
                                    {product.price.toLocaleString()}<span className="text-xl font-bold ml-1">원</span>
                                </span>
                            </div>
                            <BuyButtonCTA
                                url={product.couponUrl || '#'}
                                price={product.price}
                                size="lg"
                                variant="secondary"
                                className="w-full sm:w-auto"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* AI Review Focus */}
            {review && (
                <div className="mb-16">
                    <h2 className="text-3xl font-black text-white bg-black inline-block px-4 py-2 mb-6 border-4 border-black shadow-hard uppercase">
                        전문가 요약 리뷰
                    </h2>
                    <div className="bg-neo-blue p-6 md:p-10 border-4 border-black shadow-hard">
                        <p className="text-xl md:text-2xl font-black text-black leading-relaxed mb-10 text-center p-8 bg-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                            "{review.summary}"
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="bg-neo-green p-6 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                <h3 className="flex items-center gap-2 text-2xl font-black text-black mb-6 uppercase bg-white px-2 py-1 border-2 border-black inline-flex">
                                    <CheckCircle className="w-6 h-6" /> 주요 장점
                                </h3>
                                <ul className="space-y-4">
                                    {review.pros.map((pro, index) => (
                                        <li key={index} className="flex gap-3 text-black font-bold text-lg">
                                            <span className="text-black font-black text-xl">►</span> {pro}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className="bg-neo-pink p-6 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                <h3 className="flex items-center gap-2 text-2xl font-black text-black mb-6 uppercase bg-white px-2 py-1 border-2 border-black inline-flex">
                                    <XCircle className="w-6 h-6" /> 아쉬운 점
                                </h3>
                                <ul className="space-y-4">
                                    {review.cons.map((con, index) => (
                                        <li key={index} className="flex gap-3 text-black font-bold text-lg">
                                            <span className="text-black font-black text-xl">►</span> {con}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Specs Table */}
            <div className="mb-16">
                <h2 className="text-3xl font-black text-white bg-black inline-block px-4 py-2 mb-6 border-4 border-black shadow-hard uppercase">
                    상세 스펙
                </h2>
                <ProductSpecTable productA={product} />
            </div>

            {/* Bottom CTA */}
            <div className="mt-16 bg-neo-yellow border-4 border-black shadow-hard p-10 flex flex-col md:flex-row items-center justify-between gap-8">
                <div>
                    <h3 className="text-3xl font-black text-black mb-3 uppercase">구매를 결정하셨나요?</h3>
                    <p className="text-black font-bold text-lg bg-white inline-block px-2 border-2 border-black">로켓배송과 무료 반품 혜택으로 지금 바로 만나보세요.</p>
                </div>
                <BuyButtonCTA
                    url={product.couponUrl || '#'}
                    price={product.price}
                    size="lg"
                    variant="primary"
                    className="w-full md:w-auto min-w-[250px]"
                />
            </div>
        </div>
    );
}
