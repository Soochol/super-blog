import { ProductRepository } from '../../domains/product/domain/ports/ProductRepository';
import { ProductSpecs, CrawlHistory, WebReviewReference } from '../../domains/product/domain/ProductSpecs';
import { prisma } from './PrismaClient';

export class PrismaProductRepository implements ProductRepository {
    async saveProduct(slug: string, specs: ProductSpecs, categoryId?: string): Promise<string> {
        const product = await prisma.product.upsert({
            where: { slug },
            create: {
                slug,
                maker: specs.maker,
                model: specs.model,
                cpu: specs.cpu,
                ram: String(specs.ram),
                storage: specs.storage,
                gpu: specs.gpu,
                displaySize: String(specs.display_size),
                weight: specs.weight,
                os: specs.os,
                price: specs.price,
                ...(categoryId ? { categoryId } : {}),
            },
            update: {
                maker: specs.maker,
                model: specs.model,
                cpu: specs.cpu,
                ram: String(specs.ram),
                storage: specs.storage,
                gpu: specs.gpu,
                displaySize: String(specs.display_size),
                weight: specs.weight,
                os: specs.os,
                price: specs.price,
                ...(categoryId ? { categoryId } : {}),
            },
        });
        return product.id;
    }

    async saveCrawlHistory(productId: string, history: CrawlHistory): Promise<void> {
        await prisma.crawlHistory.create({
            data: {
                productId,
                url: history.url,
                htmlHash: history.htmlHash,
                lastCrawledAt: history.lastCrawledAt,
            },
        });
    }

    async saveWebReviews(productId: string, reviews: WebReviewReference[]): Promise<void> {
        if (reviews.length === 0) return;

        await prisma.webReviewReference.createMany({
            data: reviews.map(review => ({
                productId,
                source: review.source,
                url: review.url,
                summaryText: review.summaryText,
                sentiment: review.sentiment,
            })),
        });
    }

    async updateImageUrl(productId: string, imageUrl: string): Promise<void> {
        await prisma.product.update({
            where: { id: productId },
            data: { imageUrl },
        });
    }

    async findBySlug(slug: string): Promise<ProductSpecs | null> {
        const product = await prisma.product.findUnique({
            where: { slug },
        });

        if (!product) return null;

        return {
            maker: product.maker,
            model: product.model,
            cpu: product.cpu,
            ram: parseFloat(product.ram),
            storage: product.storage,
            gpu: product.gpu,
            display_size: parseFloat(product.displaySize),
            weight: product.weight,
            os: product.os,
            price: product.price,
        };
    }
}
