import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getCategories, getCategoryById, getProductsByCategory, getReviewByProductId } from '@/lib/api';
import ProductCard from '@/domains/product/ProductCard';

export async function generateStaticParams() {
    const categories = await getCategories();
    return categories.map((c) => ({ categoryId: c.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ categoryId: string }> }): Promise<Metadata> {
    const resolvedParams = await params;
    const category = await getCategoryById(resolvedParams.categoryId);

    if (!category) {
        return { title: 'Not Found' };
    }

    return {
        title: `${category.name} 추천 BEST 라인업 | Super Blog`,
        description: `2026년 최신 ${category.name} 제품들의 상세 리뷰와 가격 비교를 확인하세요.`,
    };
}

export default async function CategoryPage({ params }: { params: Promise<{ categoryId: string }> }) {
    const resolvedParams = await params;
    const category = await getCategoryById(resolvedParams.categoryId);

    if (!category) {
        notFound();
    }

    const products = await getProductsByCategory(resolvedParams.categoryId);

    // Fetch reviews for all products
    const productsWithReviews = await Promise.all(
        products.map(async (p) => {
            const review = await getReviewByProductId(p.id);
            return { product: p, review };
        })
    );

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-10">
                <h1 className="text-3xl font-bold text-gray-900 mb-3">{category.name} 추천</h1>
                <p className="text-gray-600">{category.description}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {productsWithReviews.map(({ product, review }, index) => (
                    <ProductCard
                        key={product.id}
                        product={product}
                        review={review}
                        rank={index + 1}
                    />
                ))}
            </div>
        </div>
    );
}
