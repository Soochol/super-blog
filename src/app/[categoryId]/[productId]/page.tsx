import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getCategories, getProductsByCategory, getProductById, getReviewByProductId } from '@/lib/api';
import ProductSpecTable from '@/domains/product/ProductSpecTable';
import BuyButtonCTA from '@/domains/monetization/BuyButtonCTA';
import { Star, CheckCircle, XCircle } from 'lucide-react';

export async function generateStaticParams() {
    const categories = await getCategories();

    const paths: { categoryId: string, productId: string }[] = [];

    for (const category of categories) {
        const products = await getProductsByCategory(category.id);
        for (const product of products) {
            paths.push({ categoryId: category.id, productId: product.id });
        }
    }

    return paths;
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
            <div className="bg-white rounded-2xl p-6 md:p-10 shadow-sm border border-gray-100 mb-8">
                <div className="flex flex-col md:flex-row gap-10">
                    <div className="w-full md:w-2/5 flex items-center justify-center p-4 bg-gray-50 rounded-xl relative">
                        <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="max-w-full h-auto object-contain mix-blend-multiply"
                        />
                    </div>

                    <div className="w-full md:w-3/5 flex flex-col justify-center">
                        <span className="text-sm font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-full w-fit mb-4">
                            {product.brand}
                        </span>
                        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4 tracking-tight">
                            {product.name}
                        </h1>

                        {review && (
                            <div className="flex items-center gap-2 mb-6 text-[#FF9B00]">
                                <Star className="w-6 h-6 fill-current" />
                                <span className="text-xl font-bold text-gray-900">{review.rating}</span>
                                <span className="text-sm text-gray-500 ml-2">블로그 AI 전문가 평점</span>
                            </div>
                        )}

                        <div className="mt-auto pt-6 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-6">
                            <div>
                                <span className="block text-sm text-gray-500 mb-1">현재 최저가</span>
                                <span className="text-3xl font-black text-gray-900 tracking-tight">
                                    {product.price.toLocaleString()}<span className="text-lg font-medium ml-1">원</span>
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
                <div className="mb-10">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6 px-2 border-l-4 border-blue-600">
                        전문가 요약 리뷰
                    </h2>
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                        <p className="text-lg font-medium text-gray-800 leading-relaxed mb-8 text-center p-6 bg-blue-50/50 rounded-xl">
                            "{review.summary}"
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="border border-green-100 bg-green-50/30 rounded-xl p-6">
                                <h3 className="flex items-center gap-2 text-lg font-bold text-green-700 mb-4">
                                    <CheckCircle className="w-5 h-5" /> 주요 장점
                                </h3>
                                <ul className="space-y-3">
                                    {review.pros.map((pro, index) => (
                                        <li key={index} className="flex gap-2 text-gray-700">
                                            <span className="text-green-500 font-bold">•</span> {pro}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className="border border-red-100 bg-red-50/30 rounded-xl p-6">
                                <h3 className="flex items-center gap-2 text-lg font-bold text-red-700 mb-4">
                                    <XCircle className="w-5 h-5" /> 아쉬운 점
                                </h3>
                                <ul className="space-y-3">
                                    {review.cons.map((con, index) => (
                                        <li key={index} className="flex gap-2 text-gray-700">
                                            <span className="text-red-400 font-bold">•</span> {con}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Specs Table */}
            <div className="mb-10">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 px-2 border-l-4 border-blue-600">
                    상세 스펙
                </h2>
                <ProductSpecTable productA={product} />
            </div>

            {/* Bottom CTA */}
            <div className="mt-16 bg-gray-900 text-white rounded-2xl p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-lg">
                <div>
                    <h3 className="text-xl font-bold mb-2">구매를 결정하셨나요?</h3>
                    <p className="text-gray-400 text-sm">로켓배송과 무료 반품 혜택으로 지금 바로 만나보세요.</p>
                </div>
                <BuyButtonCTA
                    url={product.couponUrl || '#'}
                    price={product.price}
                    size="lg"
                    variant="secondary"
                    className="w-full md:w-auto min-w-[200px]"
                />
            </div>
        </div>
    );
}
