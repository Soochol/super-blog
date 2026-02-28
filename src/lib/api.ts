import { prisma } from '../infrastructure/db/PrismaClient';
import { Category, Product, Review } from '../types';

export const getCategories = async (): Promise<Category[]> => {
    const categories = await prisma.category.findMany();
    return categories.map((c) => ({
        id: c.id,
        name: c.name,
        description: c.description ?? '',
    }));
};

export const getCategoryById = async (id: string): Promise<Category | undefined> => {
    const category = await prisma.category.findUnique({ where: { id } });
    if (!category) return undefined;
    return { id: category.id, name: category.name, description: category.description ?? '' };
};

export const getProductsByCategory = async (categoryId: string): Promise<Product[]> => {
    const products = await prisma.product.findMany({
        where: { categoryId },
    });
    return products.map(mapProductToFrontend);
};

export const getProductById = async (id: string): Promise<Product | undefined> => {
    const product = await prisma.product.findUnique({ where: { slug: id } });
    if (!product) return undefined;
    return mapProductToFrontend(product);
};

export const getReviewByProductId = async (productId: string): Promise<Review | undefined> => {
    const product = await prisma.product.findUnique({ where: { slug: productId } });
    if (!product) return undefined;

    const review = await prisma.productReview.findFirst({
        where: { productId: product.id },
        orderBy: { createdAt: 'desc' },
    });
    if (!review) return undefined;

    return {
        productId,
        summary: review.summary,
        pros: review.pros,
        cons: review.cons,
        rating: review.rating ?? 0,
    };
};

export const getComparisonReviews = async (
    productIdA: string,
    productIdB: string
): Promise<{ reviewA?: Review; reviewB?: Review }> => {
    const [reviewA, reviewB] = await Promise.all([
        getReviewByProductId(productIdA),
        getReviewByProductId(productIdB),
    ]);
    return { reviewA, reviewB };
};

function mapProductToFrontend(p: {
    slug: string;
    maker: string;
    model: string;
    cpu: string;
    ram: string;
    storage: string;
    gpu: string;
    displaySize: string;
    weight: number;
    os: string;
    price: number;
    imageUrl: string | null;
    couponUrl: string | null;
    categoryId: string | null;
}): Product {
    return {
        id: p.slug,
        categoryId: p.categoryId ?? '',
        name: `${p.maker} ${p.model}`,
        price: p.price,
        brand: p.maker,
        specs: {
            cpu: p.cpu,
            ram: p.ram,
            storage: p.storage,
            gpu: p.gpu,
            display: p.displaySize,
            weight: p.weight,
            os: p.os,
        },
        imageUrl: p.imageUrl ?? '',
        couponUrl: p.couponUrl ?? undefined,
    };
}
