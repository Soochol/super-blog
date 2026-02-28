// --- Mocks must be declared before imports that use them ---

const mockPrisma = {
    product: {
        findUnique: jest.fn(),
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

const mockGenerateComparison = jest.fn();

jest.mock('@/infrastructure/ai/ClaudeContentGenerator', () => ({
    ClaudeContentGenerator: jest.fn().mockImplementation(() => ({
        generateComparison: mockGenerateComparison,
    })),
}));

import { generateAndSaveComparison } from '@/cli/generate-comparison';

const sampleDbProductA = {
    id: 'product-uuid-aaa',
    slug: 'apple-macbook-pro-14',
    maker: 'Apple',
    model: 'MacBook Pro 14',
    cpu: 'M3 Pro',
    ram: '18',
    storage: '512GB SSD',
    gpu: 'M3 Pro 18-core GPU',
    displaySize: '14.2',
    weight: 1.55,
    os: 'macOS Sonoma',
    price: 2390000,
};

const sampleDbProductB = {
    id: 'product-uuid-bbb',
    slug: 'samsung-galaxy-book4',
    maker: 'Samsung',
    model: 'Galaxy Book4 Pro',
    cpu: 'Intel Core Ultra 7',
    ram: '16',
    storage: '512GB SSD',
    gpu: 'Intel Arc',
    displaySize: '14',
    weight: 1.23,
    os: 'Windows 11',
    price: 1890000,
};

const sampleComparisonText = `# Apple MacBook Pro 14 vs Samsung Galaxy Book4 Pro 비교

## 성능 비교
Apple MacBook Pro 14는 M3 Pro 칩을 탑재하여 뛰어난 성능을 제공합니다...

## 결론
전문 크리에이터에게는 MacBook Pro 14, 가성비를 중시한다면 Galaxy Book4 Pro를 추천합니다.`;

describe('generate-comparison CLI', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('generateAndSaveComparison', () => {
        it('loads both products, generates comparison, and returns text', async () => {
            // Arrange
            mockPrisma.product.findUnique
                .mockResolvedValueOnce(sampleDbProductA)
                .mockResolvedValueOnce(sampleDbProductB);
            mockGenerateComparison.mockResolvedValue(sampleComparisonText);

            // Act
            const result = await generateAndSaveComparison('apple-macbook-pro-14', 'samsung-galaxy-book4');

            // Assert: both products looked up by slug
            expect(mockPrisma.product.findUnique).toHaveBeenCalledTimes(2);
            expect(mockPrisma.product.findUnique).toHaveBeenCalledWith({
                where: { slug: 'apple-macbook-pro-14' },
            });
            expect(mockPrisma.product.findUnique).toHaveBeenCalledWith({
                where: { slug: 'samsung-galaxy-book4' },
            });

            // Assert: generateComparison called with formatted spec strings
            expect(mockGenerateComparison).toHaveBeenCalledTimes(1);
            const [specsA, specsB] = mockGenerateComparison.mock.calls[0];

            // Verify specsA contains product A details
            expect(specsA).toContain('Apple');
            expect(specsA).toContain('MacBook Pro 14');
            expect(specsA).toContain('M3 Pro');
            expect(specsA).toContain('18');
            expect(specsA).toContain('M3 Pro 18-core GPU');
            expect(specsA).toContain('14.2');
            expect(specsA).toContain('1.55');
            expect(specsA).toContain('2390000');

            // Verify specsB contains product B details
            expect(specsB).toContain('Samsung');
            expect(specsB).toContain('Galaxy Book4 Pro');
            expect(specsB).toContain('Intel Core Ultra 7');
            expect(specsB).toContain('16');
            expect(specsB).toContain('Intel Arc');
            expect(specsB).toContain('14');
            expect(specsB).toContain('1.23');
            expect(specsB).toContain('1890000');

            // Assert: returns the generated comparison text
            expect(result).toBe(sampleComparisonText);
        });

        it('throws error when first product is not found', async () => {
            // Arrange
            mockPrisma.product.findUnique.mockResolvedValue(null);

            // Act & Assert
            await expect(
                generateAndSaveComparison('non-existent-slug', 'samsung-galaxy-book4'),
            ).rejects.toThrow('Product "non-existent-slug" not found');

            // Should only attempt one lookup and not proceed further
            expect(mockPrisma.product.findUnique).toHaveBeenCalledTimes(1);
            expect(mockGenerateComparison).not.toHaveBeenCalled();
        });

        it('throws error when second product is not found', async () => {
            // Arrange
            mockPrisma.product.findUnique
                .mockResolvedValueOnce(sampleDbProductA)
                .mockResolvedValueOnce(null);

            // Act & Assert
            await expect(
                generateAndSaveComparison('apple-macbook-pro-14', 'non-existent-slug'),
            ).rejects.toThrow('Product "non-existent-slug" not found');

            // Should have looked up both products but not generated comparison
            expect(mockPrisma.product.findUnique).toHaveBeenCalledTimes(2);
            expect(mockGenerateComparison).not.toHaveBeenCalled();
        });
    });
});
