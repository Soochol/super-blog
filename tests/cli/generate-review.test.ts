import { ProductReview } from '@/domains/content/domain/Review';

// --- Mocks must be declared before imports that use them ---

const mockPrisma = {
    product: {
        findUnique: jest.fn(),
    },
    webReviewReference: {
        findMany: jest.fn(),
    },
    productReview: {
        deleteMany: jest.fn(),
        create: jest.fn(),
    },
};

jest.mock('@/infrastructure/db/PrismaClient', () => ({
    prisma: mockPrisma,
}));

jest.mock('@/infrastructure/ai/ClaudeCliAdapter', () => ({
    ClaudeCliAdapter: jest.fn().mockImplementation(() => ({})),
}));

jest.mock('@/infrastructure/db/PrismaSkillRepository', () => ({
    PrismaSkillRepository: jest.fn().mockImplementation(() => ({})),
}));

const mockWriteComprehensiveReview = jest.fn();

jest.mock('@/infrastructure/ai/ClaudeContentGenerator', () => ({
    ClaudeContentGenerator: jest.fn().mockImplementation(() => ({
        // ClaudeContentGenerator instance is passed to CritiqueWritingService
    })),
}));

jest.mock('@/domains/content/application/CritiqueWritingService', () => ({
    CritiqueWritingService: jest.fn().mockImplementation(() => ({
        writeComprehensiveReview: mockWriteComprehensiveReview,
    })),
}));

import { generateAndSaveReview } from '@/cli/generate-review';

const sampleReview: ProductReview = {
    summary: '뛰어난 성능의 프로페셔널 노트북',
    pros: ['탁월한 성능', '훌륭한 디스플레이'],
    cons: ['높은 가격', '무거운 무게'],
    recommendedFor: '전문 크리에이터',
    notRecommendedFor: '가성비를 중시하는 학생',
    specHighlights: ['M3 Max 칩', '36GB 통합 메모리'],
    strategy: {
        targetAudience: ['professional creators'],
        keySellingPoints: ['M3 Max performance'],
        competitors: ['Dell XPS 16'],
        positioning: 'premium professional laptop',
    },
    sentimentAnalysis: {
        overallScore: 85,
        commonPraises: ['fast performance'],
        commonComplaints: ['high price'],
        reliability: 'HIGH',
    },
};

const sampleDbProduct = {
    id: 'product-uuid-123',
    slug: 'apple-macbook-pro-16',
    maker: 'Apple',
    model: 'MacBook Pro 16',
    cpu: 'M3 Max',
    ram: '36',
    storage: '1TB SSD',
    gpu: 'M3 Max 40-core GPU',
    displaySize: '16.2',
    weight: 2.14,
    os: 'macOS Sonoma',
    price: 3990000,
};

const sampleDbWebReviews = [
    {
        id: 'review-1',
        productId: 'product-uuid-123',
        source: 'YouTube',
        url: 'https://youtube.com/review1',
        summaryText: '뛰어난 성능의 노트북',
        sentiment: 'POSITIVE',
    },
    {
        id: 'review-2',
        productId: 'product-uuid-123',
        source: 'Naver Blog',
        url: 'https://blog.naver.com/review2',
        summaryText: '가격이 너무 비쌈',
        sentiment: 'NEGATIVE',
    },
];

describe('generate-review CLI', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('generateAndSaveReview', () => {
        it('loads product, generates review, saves to DB, and returns review', async () => {
            // Arrange
            mockPrisma.product.findUnique.mockResolvedValue(sampleDbProduct);
            mockPrisma.webReviewReference.findMany.mockResolvedValue(sampleDbWebReviews);
            mockWriteComprehensiveReview.mockResolvedValue(sampleReview);
            mockPrisma.productReview.deleteMany.mockResolvedValue({ count: 0 });
            mockPrisma.productReview.create.mockResolvedValue({ id: 'review-uuid-1', ...sampleReview });

            // Act
            const result = await generateAndSaveReview('apple-macbook-pro-16');

            // Assert: product looked up by slug
            expect(mockPrisma.product.findUnique).toHaveBeenCalledWith({
                where: { slug: 'apple-macbook-pro-16' },
            });

            // Assert: web reviews loaded for product
            expect(mockPrisma.webReviewReference.findMany).toHaveBeenCalledWith({
                where: { productId: 'product-uuid-123' },
            });

            // Assert: CritiqueWritingService.writeComprehensiveReview called with mapped specs and references
            expect(mockWriteComprehensiveReview).toHaveBeenCalledWith(
                expect.objectContaining({
                    maker: 'Apple',
                    model: 'MacBook Pro 16',
                    cpu: 'M3 Max',
                    ram: 36,
                    storage: '1TB SSD',
                    gpu: 'M3 Max 40-core GPU',
                    display_size: 16.2,
                    weight: 2.14,
                    os: 'macOS Sonoma',
                    price: 3990000,
                }),
                expect.arrayContaining([
                    expect.objectContaining({
                        source: 'YouTube',
                        url: 'https://youtube.com/review1',
                        summaryText: '뛰어난 성능의 노트북',
                        sentiment: 'POSITIVE',
                    }),
                ]),
            );

            // Assert: existing reviews deleted before creating new one
            expect(mockPrisma.productReview.deleteMany).toHaveBeenCalledWith({
                where: { productId: 'product-uuid-123' },
            });

            // Assert: deleteMany called before create
            const deleteOrder = mockPrisma.productReview.deleteMany.mock.invocationCallOrder[0];
            const createOrder = mockPrisma.productReview.create.mock.invocationCallOrder[0];
            expect(deleteOrder).toBeLessThan(createOrder);

            // Assert: review saved to DB
            expect(mockPrisma.productReview.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    productId: 'product-uuid-123',
                    summary: sampleReview.summary,
                    pros: sampleReview.pros,
                    cons: sampleReview.cons,
                    recommendedFor: sampleReview.recommendedFor,
                    notRecommendedFor: sampleReview.notRecommendedFor,
                    specHighlights: sampleReview.specHighlights,
                }),
            });

            // Assert: returns the generated review
            expect(result).toEqual(sampleReview);
        });

        it('throws error when product is not found', async () => {
            mockPrisma.product.findUnique.mockResolvedValue(null);

            await expect(generateAndSaveReview('non-existent-slug')).rejects.toThrow(
                'Product "non-existent-slug" not found',
            );

            // Should not attempt to load reviews or generate content
            expect(mockPrisma.webReviewReference.findMany).not.toHaveBeenCalled();
            expect(mockWriteComprehensiveReview).not.toHaveBeenCalled();
            expect(mockPrisma.productReview.deleteMany).not.toHaveBeenCalled();
            expect(mockPrisma.productReview.create).not.toHaveBeenCalled();
        });
    });
});
