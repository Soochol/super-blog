import { ContentGenerator } from '../../domains/content/domain/ports/ContentGenerator';
import { ProductReview, ProductStrategy, SentimentAnalysis } from '../../domains/content/domain/Review';
import { ProductSpecs, WebReviewReference } from '../../domains/product/domain/ProductSpecs';
import { LlmRunner } from '../../shared/ai/ports/LlmRunner';
import { SkillRepository } from '../../domains/skill/domain/ports/SkillRepository';
import { AiSkill, injectContextToPrompt } from '../../domains/skill/domain/AiSkill';

export class ClaudeContentGenerator implements ContentGenerator {
    constructor(
        private readonly llm: LlmRunner,
        private readonly skillRepo: SkillRepository,
    ) {}

    async generateProductReview(
        productId: string,
        specsJson: string,
        strategy: ProductStrategy,
    ): Promise<ProductReview> {
        const skill = await this.loadSkill('generate-review');
        const specs: ProductSpecs = JSON.parse(specsJson);

        const basePrompt = injectContextToPrompt(skill.userPromptTemplate, {
            maker: specs.maker,
            model: specs.model,
            cpu: specs.cpu,
            ram: String(specs.ram),
            storage: specs.storage,
            gpu: specs.gpu,
            display_size: String(specs.display_size),
            weight: String(specs.weight),
            os: specs.os,
            price: String(specs.price),
        });

        const prompt = `${basePrompt}\n\n전략 컨텍스트: ${JSON.stringify(strategy)}\n\nJSON으로 답변해줘. 형식: {"summary":"","pros":[],"cons":[],"recommendedFor":"","notRecommendedFor":"","specHighlights":[]}`;

        const response = await this.runWithSkill(prompt, skill);

        return this.parseJson<ProductReview>(response);
    }

    async generateComparison(specsA: string, specsB: string): Promise<string> {
        const skill = await this.loadSkill('generate-comparison');

        const prompt = injectContextToPrompt(skill.userPromptTemplate, {
            category: '노트북',
            productA: specsA,
            productB: specsB,
        });

        return this.runWithSkill(prompt, skill);
    }

    async generateProductStrategy(specs: ProductSpecs): Promise<ProductStrategy> {
        const skill = await this.loadSkill('generate-strategy');

        const prompt = injectContextToPrompt(skill.userPromptTemplate, {
            maker: specs.maker,
            model: specs.model,
            cpu: specs.cpu,
            ram: String(specs.ram),
            storage: specs.storage,
            gpu: specs.gpu,
            display_size: String(specs.display_size),
            weight: String(specs.weight),
            os: specs.os,
            price: String(specs.price),
        });

        const response = await this.runWithSkill(prompt, skill);

        return this.parseJson<ProductStrategy>(response);
    }

    async analyzeWebSentiments(reviews: WebReviewReference[]): Promise<SentimentAnalysis> {
        const skill = await this.loadSkill('analyze-sentiment');

        const reviewSummaries = reviews
            .map((r) => `[${r.source}] (${r.sentiment}) ${r.summaryText}`)
            .join('\n');

        const prompt = injectContextToPrompt(skill.userPromptTemplate, {
            reviews: reviewSummaries,
        });

        const response = await this.runWithSkill(prompt, skill);

        return this.parseJson<SentimentAnalysis>(response);
    }

    async generateCritiqueArticle(
        specs: ProductSpecs,
        sentiment: SentimentAnalysis,
        strategy: ProductStrategy,
    ): Promise<ProductReview> {
        const review = await this.generateProductReview(
            `${specs.maker}-${specs.model}`,
            JSON.stringify(specs),
            strategy,
        );

        return {
            ...review,
            strategy,
            sentimentAnalysis: sentiment,
        };
    }

    private async loadSkill(name: string): Promise<AiSkill> {
        const skill = await this.skillRepo.findByName(name);
        if (!skill) {
            throw new Error(`Skill "${name}" not found.`);
        }
        return skill;
    }

    private async runWithSkill(prompt: string, skill: AiSkill): Promise<string> {
        return this.llm.run(prompt, {
            system: skill.systemPromptTemplate,
            model: skill.model,
            temperature: skill.temperature,
        });
    }

    private parseJson<T>(text: string): T {
        try {
            return JSON.parse(text) as T;
        } catch {
            const match = text.match(/\{[\s\S]*\}/);
            if (!match) throw new Error(`Failed to extract JSON from LLM response: ${text.substring(0, 200)}`);
            return JSON.parse(match[0]) as T;
        }
    }
}
