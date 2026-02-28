import { PrismaProductRepository } from '@/infrastructure/db/PrismaProductRepository';
import { prisma } from '@/infrastructure/db/PrismaClient';
import { ProductSpecs } from '@/domains/product/domain/ProductSpecs';

const TEST_SLUG = 'test-model-x1';

const testSpecs: ProductSpecs = {
    maker: 'TestBrand',
    model: 'TestModel X1',
    cpu: 'Intel i7-13700H',
    ram: 16,
    storage: '512GB SSD',
    gpu: 'RTX 4060',
    display_size: 15.6,
    weight: 2.1,
    os: 'Windows 11',
    price: 1500000,
};

describe('PrismaProductRepository', () => {
    const repo = new PrismaProductRepository();

    afterAll(async () => {
        // Clean up test data in correct order (foreign key constraints)
        await prisma.webReviewReference.deleteMany({ where: { product: { slug: TEST_SLUG } } });
        await prisma.crawlHistory.deleteMany({ where: { product: { slug: TEST_SLUG } } });
        await prisma.product.deleteMany({ where: { slug: TEST_SLUG } });
        await prisma.$disconnect();
    });

    describe('saveProduct', () => {
        it('should create a product and return its id', async () => {
            const id = await repo.saveProduct(TEST_SLUG, testSpecs);

            expect(typeof id).toBe('string');
            expect(id.length).toBeGreaterThan(0);
        });

        it('should upsert when called with the same slug', async () => {
            const updatedSpecs: ProductSpecs = {
                ...testSpecs,
                ram: 32,
                price: 1800000,
            };

            const id = await repo.saveProduct(TEST_SLUG, updatedSpecs);

            expect(typeof id).toBe('string');

            const dbProduct = await prisma.product.findUnique({ where: { slug: TEST_SLUG } });
            expect(dbProduct).not.toBeNull();
            expect(dbProduct!.ram).toBe('32');
            expect(dbProduct!.price).toBe(1800000);
        });
    });

    describe('findBySlug', () => {
        it('should return saved product as ProductSpecs', async () => {
            const found = await repo.findBySlug(TEST_SLUG);

            expect(found).not.toBeNull();
            expect(found!.maker).toBe('TestBrand');
            expect(found!.model).toBe('TestModel X1');
            expect(found!.cpu).toBe('Intel i7-13700H');
            expect(found!.ram).toBe(32); // updated by upsert test
            expect(found!.storage).toBe('512GB SSD');
            expect(found!.gpu).toBe('RTX 4060');
            expect(found!.display_size).toBe(15.6);
            expect(found!.weight).toBe(2.1);
            expect(found!.os).toBe('Windows 11');
            expect(found!.price).toBe(1800000); // updated by upsert test
        });

        it('should return null for non-existent slug', async () => {
            const found = await repo.findBySlug('non-existent-slug');

            expect(found).toBeNull();
        });
    });

    describe('saveCrawlHistory', () => {
        it('should store a crawl record for a product', async () => {
            const product = await prisma.product.findUnique({ where: { slug: TEST_SLUG } });
            const crawlDate = new Date('2026-02-28T10:00:00Z');

            await repo.saveCrawlHistory(product!.id, {
                url: 'https://example.com/test-model-x1',
                htmlHash: 'abc123def456',
                lastCrawledAt: crawlDate,
            });

            const crawls = await prisma.crawlHistory.findMany({
                where: { productId: product!.id },
            });
            expect(crawls).toHaveLength(1);
            expect(crawls[0].url).toBe('https://example.com/test-model-x1');
            expect(crawls[0].htmlHash).toBe('abc123def456');
            expect(crawls[0].lastCrawledAt).toEqual(crawlDate);
        });
    });

    describe('saveWebReviews', () => {
        it('should store multiple web review references for a product', async () => {
            const product = await prisma.product.findUnique({ where: { slug: TEST_SLUG } });

            await repo.saveWebReviews(product!.id, [
                {
                    source: 'YouTube',
                    url: 'https://youtube.com/watch?v=test123',
                    summaryText: '뛰어난 게이밍 성능',
                    sentiment: 'POSITIVE',
                },
                {
                    source: 'Naver Blog',
                    url: 'https://blog.naver.com/test456',
                    summaryText: '발열이 다소 있음',
                    sentiment: 'NEUTRAL',
                },
            ]);

            const reviews = await prisma.webReviewReference.findMany({
                where: { productId: product!.id },
            });
            expect(reviews).toHaveLength(2);
            expect(reviews.map(r => r.source).sort()).toEqual(['Naver Blog', 'YouTube']);
        });

        it('should handle empty reviews array without error', async () => {
            const product = await prisma.product.findUnique({ where: { slug: TEST_SLUG } });

            await expect(repo.saveWebReviews(product!.id, [])).resolves.not.toThrow();
        });
    });
});
