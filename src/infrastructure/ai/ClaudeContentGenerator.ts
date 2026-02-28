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

        const response = await this.llm.run(prompt, {
            system: skill.systemPromptTemplate,
            model: skill.model,
            temperature: skill.temperature,
        });

        return this.parseJson<ProductReview>(response);
    }

    async generateComparison(productAId: string, productBId: string): Promise<string> {
        const skill = await this.loadSkill('generate-comparison');

        const prompt = injectContextToPrompt(skill.userPromptTemplate, {
            category: '노트북',
            productA: productAId,
            productB: productBId,
        });

        return this.llm.run(prompt, {
            system: skill.systemPromptTemplate,
            model: skill.model,
            temperature: skill.temperature,
        });
    }

    async generateProductStrategy(specs: ProductSpecs): Promise<ProductStrategy> {
        const prompt = `Analyze the following product and generate a marketing strategy as JSON.

Product: ${specs.maker} ${specs.model}
CPU: ${specs.cpu}, RAM: ${specs.ram}GB, Storage: ${specs.storage}
GPU: ${specs.gpu}, Display: ${specs.display_size}", Weight: ${specs.weight}kg
OS: ${specs.os}, Price: ${specs.price} KRW

Return JSON with: targetAudience (string[]), keySellingPoints (string[]), competitors (string[]), positioning (string).`;

        const response = await this.llm.run(prompt, {
            temperature: 0.7,
        });

        return this.parseJson<ProductStrategy>(response);
    }

    async analyzeWebSentiments(reviews: WebReviewReference[]): Promise<SentimentAnalysis> {
        const reviewSummaries = reviews
            .map((r) => `[${r.source}] (${r.sentiment}) ${r.summaryText}`)
            .join('\n');

        const prompt = `Analyze the following web review summaries and provide a sentiment analysis as JSON.

Reviews:
${reviewSummaries}

Return JSON with: overallScore (0-100), commonPraises (string[]), commonComplaints (string[]), reliability ("HIGH" | "MEDIUM" | "LOW").`;

        const response = await this.llm.run(prompt, {
            temperature: 0.3,
        });

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
            throw new Error(`Skill "${name}" not found. Run db:seed first.`);
        }
        return skill;
    }

    private parseJson<T>(text: string): T {
        const match = text.match(/\{[\s\S]*\}/);
        if (!match) {
            throw new Error(`Failed to extract JSON from LLM response: ${text.substring(0, 200)}`);
        }
        return JSON.parse(match[0]) as T;
    }
}
