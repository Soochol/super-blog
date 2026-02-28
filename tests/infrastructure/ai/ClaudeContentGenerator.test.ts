import { ClaudeContentGenerator } from '@/infrastructure/ai/ClaudeContentGenerator';
import { LlmRunner } from '@/shared/ai/ports/LlmRunner';
import { SkillRepository } from '@/domains/skill/domain/ports/SkillRepository';
import { AiSkill } from '@/domains/skill/domain/AiSkill';
import { ProductSpecs, WebReviewReference } from '@/domains/product/domain/ProductSpecs';
import { ProductStrategy } from '@/domains/content/domain/Review';

const makeSkill = (overrides: Partial<AiSkill> = {}): AiSkill => ({
    id: 'skill-1',
    name: 'test-skill',
    systemPromptTemplate: 'You are a helpful assistant.',
    userPromptTemplate: 'Analyze {{maker}} {{model}}',
    temperature: 0.7,
    model: 'claude-sonnet',
    version: '1.0',
    ...overrides,
});

const sampleSpecs: ProductSpecs = {
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
};

const sampleStrategy: ProductStrategy = {
    targetAudience: ['professional creators', 'developers'],
    keySellingPoints: ['M3 Max performance', 'long battery life'],
    competitors: ['Dell XPS 16', 'Lenovo ThinkPad X1 Extreme'],
    positioning: 'premium professional laptop',
};

const sampleReviewJson = JSON.stringify({
    summary: 'Excellent professional laptop',
    pros: ['Outstanding performance', 'Great display'],
    cons: ['Expensive', 'Heavy'],
    recommendedFor: 'Professional creators',
    notRecommendedFor: 'Budget-conscious students',
    specHighlights: ['M3 Max chip', '36GB unified memory'],
});

const sampleStrategyJson = JSON.stringify(sampleStrategy);

const sampleSentimentJson = JSON.stringify({
    overallScore: 85,
    commonPraises: ['fast performance', 'beautiful display'],
    commonComplaints: ['high price', 'limited ports'],
    reliability: 'HIGH',
});

describe('ClaudeContentGenerator', () => {
    let mockLlm: jest.Mocked<LlmRunner>;
    let mockSkillRepo: jest.Mocked<SkillRepository>;
    let generator: ClaudeContentGenerator;

    beforeEach(() => {
        mockLlm = { run: jest.fn() };
        mockSkillRepo = { findByName: jest.fn(), findAll: jest.fn() };
        generator = new ClaudeContentGenerator(mockLlm, mockSkillRepo);
    });

    describe('generateProductReview', () => {
        it('loads generate-review skill, calls LLM, and returns parsed review', async () => {
            const reviewSkill = makeSkill({
                name: 'generate-review',
                userPromptTemplate:
                    'Review the {{maker}} {{model}} with {{cpu}}, {{ram}}GB RAM, {{storage}}, {{gpu}}, {{display_size}}" display, {{weight}}kg, {{os}}, priced at {{price}} KRW.',
                systemPromptTemplate: 'You are a Korean tech reviewer.',
            });

            mockSkillRepo.findByName.mockResolvedValue(reviewSkill);
            mockLlm.run.mockResolvedValue(sampleReviewJson);

            const result = await generator.generateProductReview(
                'product-1',
                JSON.stringify(sampleSpecs),
                sampleStrategy,
            );

            expect(mockSkillRepo.findByName).toHaveBeenCalledWith('generate-review');
            expect(mockLlm.run).toHaveBeenCalledWith(
                expect.stringContaining('Apple'),
                expect.objectContaining({
                    system: reviewSkill.systemPromptTemplate,
                    model: reviewSkill.model,
                    temperature: reviewSkill.temperature,
                }),
            );
            expect(mockLlm.run).toHaveBeenCalledWith(
                expect.stringContaining('전략 컨텍스트'),
                expect.any(Object),
            );
            expect(result.summary).toBe('Excellent professional laptop');
            expect(result.pros).toContain('Outstanding performance');
            expect(result.cons).toContain('Expensive');
            expect(result.recommendedFor).toBe('Professional creators');
            expect(result.notRecommendedFor).toBe('Budget-conscious students');
            expect(result.specHighlights).toContain('M3 Max chip');
        });

        it('throws if generate-review skill is not found', async () => {
            mockSkillRepo.findByName.mockResolvedValue(null);

            await expect(
                generator.generateProductReview('product-1', JSON.stringify(sampleSpecs), sampleStrategy),
            ).rejects.toThrow('generate-review');
        });
    });

    describe('generateComparison', () => {
        it('loads generate-comparison skill and returns LLM text', async () => {
            const comparisonSkill = makeSkill({
                name: 'generate-comparison',
                userPromptTemplate: 'Compare {{category}} products: {{productA}} vs {{productB}}',
                systemPromptTemplate: 'You are a product comparison expert.',
            });

            mockSkillRepo.findByName.mockResolvedValue(comparisonSkill);
            mockLlm.run.mockResolvedValue('MacBook Pro is faster but Dell XPS is lighter.');

            const result = await generator.generateComparison('macbook-pro', 'dell-xps');

            expect(mockSkillRepo.findByName).toHaveBeenCalledWith('generate-comparison');
            expect(mockLlm.run).toHaveBeenCalledWith(
                expect.stringContaining('macbook-pro'),
                expect.objectContaining({
                    system: comparisonSkill.systemPromptTemplate,
                    model: comparisonSkill.model,
                    temperature: comparisonSkill.temperature,
                }),
            );
            expect(result).toBe('MacBook Pro is faster but Dell XPS is lighter.');
        });
    });

    describe('generateProductStrategy', () => {
        it('loads generate-review skill, calls LLM with Korean prompt, and returns parsed strategy', async () => {
            const reviewSkill = makeSkill({
                name: 'generate-review',
                systemPromptTemplate: 'You are a Korean tech reviewer.',
            });

            mockSkillRepo.findByName.mockResolvedValue(reviewSkill);
            mockLlm.run.mockResolvedValue(sampleStrategyJson);

            const result = await generator.generateProductStrategy(sampleSpecs);

            expect(mockSkillRepo.findByName).toHaveBeenCalledWith('generate-review');
            expect(mockLlm.run).toHaveBeenCalledWith(
                expect.stringContaining('Apple'),
                expect.objectContaining({
                    system: reviewSkill.systemPromptTemplate,
                    model: reviewSkill.model,
                    temperature: reviewSkill.temperature,
                }),
            );
            expect(result.targetAudience).toEqual(['professional creators', 'developers']);
            expect(result.keySellingPoints).toEqual(['M3 Max performance', 'long battery life']);
            expect(result.competitors).toEqual(['Dell XPS 16', 'Lenovo ThinkPad X1 Extreme']);
            expect(result.positioning).toBe('premium professional laptop');
        });
    });

    describe('analyzeWebSentiments', () => {
        it('loads generate-review skill, calls LLM with Korean prompt, and returns parsed sentiment', async () => {
            const reviewSkill = makeSkill({
                name: 'generate-review',
                systemPromptTemplate: 'You are a Korean tech reviewer.',
            });

            const reviews: WebReviewReference[] = [
                {
                    source: 'YouTube',
                    url: 'https://youtube.com/review1',
                    summaryText: 'Great laptop with amazing performance',
                    sentiment: 'POSITIVE',
                },
                {
                    source: 'Naver Blog',
                    url: 'https://blog.naver.com/review2',
                    summaryText: 'Too expensive for what it offers',
                    sentiment: 'NEGATIVE',
                },
            ];

            mockSkillRepo.findByName.mockResolvedValue(reviewSkill);
            mockLlm.run.mockResolvedValue(sampleSentimentJson);

            const result = await generator.analyzeWebSentiments(reviews);

            expect(mockSkillRepo.findByName).toHaveBeenCalledWith('generate-review');
            expect(mockLlm.run).toHaveBeenCalledWith(
                expect.stringContaining('Great laptop'),
                expect.objectContaining({
                    system: reviewSkill.systemPromptTemplate,
                    model: reviewSkill.model,
                    temperature: reviewSkill.temperature,
                }),
            );
            expect(result.overallScore).toBe(85);
            expect(result.commonPraises).toContain('fast performance');
            expect(result.commonComplaints).toContain('high price');
            expect(result.reliability).toBe('HIGH');
        });
    });

    describe('generateCritiqueArticle', () => {
        it('delegates to generateProductReview', async () => {
            const reviewSkill = makeSkill({
                name: 'generate-review',
                userPromptTemplate:
                    'Review the {{maker}} {{model}} with {{cpu}}, {{ram}}GB RAM, {{storage}}, {{gpu}}, {{display_size}}" display, {{weight}}kg, {{os}}, priced at {{price}} KRW.',
            });

            mockSkillRepo.findByName.mockResolvedValue(reviewSkill);
            mockLlm.run.mockResolvedValue(sampleReviewJson);

            const sentiment = {
                overallScore: 85,
                commonPraises: ['fast'],
                commonComplaints: ['expensive'],
                reliability: 'HIGH' as const,
            };

            const result = await generator.generateCritiqueArticle(sampleSpecs, sentiment, sampleStrategy);

            expect(result.summary).toBe('Excellent professional laptop');
            expect(result.strategy).toEqual(sampleStrategy);
            expect(result.sentimentAnalysis).toEqual(sentiment);
        });
    });

    describe('parseJson helper (via methods)', () => {
        it('parses clean JSON directly without regex fallback', async () => {
            const reviewSkill = makeSkill({ name: 'generate-review' });
            mockSkillRepo.findByName.mockResolvedValue(reviewSkill);
            mockLlm.run.mockResolvedValue(sampleStrategyJson);

            const result = await generator.generateProductStrategy(sampleSpecs);

            expect(result.positioning).toBe('premium professional laptop');
        });

        it('extracts JSON from markdown code blocks', async () => {
            const reviewSkill = makeSkill({ name: 'generate-review' });
            mockSkillRepo.findByName.mockResolvedValue(reviewSkill);

            const wrappedJson = '```json\n' + sampleStrategyJson + '\n```';
            mockLlm.run.mockResolvedValue(wrappedJson);

            const result = await generator.generateProductStrategy(sampleSpecs);

            expect(result.positioning).toBe('premium professional laptop');
        });

        it('extracts JSON embedded in surrounding text', async () => {
            const reviewSkill = makeSkill({ name: 'generate-review' });
            mockSkillRepo.findByName.mockResolvedValue(reviewSkill);

            const embeddedJson = 'Here is the analysis:\n' + sampleSentimentJson + '\nEnd of analysis.';
            const reviews: WebReviewReference[] = [
                {
                    source: 'Reddit',
                    url: 'https://reddit.com/review',
                    summaryText: 'Decent laptop overall',
                    sentiment: 'NEUTRAL',
                },
            ];

            mockLlm.run.mockResolvedValue(embeddedJson);

            const result = await generator.analyzeWebSentiments(reviews);

            expect(result.overallScore).toBe(85);
        });
    });
});
