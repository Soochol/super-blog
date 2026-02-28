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
        const skill = await this.loadSkill('generate-review');

        const prompt = `다음 제품을 분석하고 마케팅 전략을 JSON으로 생성해주세요.

제품: ${specs.maker} ${specs.model}
CPU: ${specs.cpu}, RAM: ${specs.ram}GB, 저장장치: ${specs.storage}
GPU: ${specs.gpu}, 디스플레이: ${specs.display_size}인치, 무게: ${specs.weight}kg
OS: ${specs.os}, 가격: ${specs.price}원

JSON 형식: {"targetAudience":[],"keySellingPoints":[],"competitors":[],"positioning":""}`;

        const response = await this.llm.run(prompt, {
            system: skill.systemPromptTemplate,
            model: skill.model,
            temperature: skill.temperature,
        });

        return this.parseJson<ProductStrategy>(response);
    }

    async analyzeWebSentiments(reviews: WebReviewReference[]): Promise<SentimentAnalysis> {
        const skill = await this.loadSkill('generate-review');

        const reviewSummaries = reviews
            .map((r) => `[${r.source}] (${r.sentiment}) ${r.summaryText}`)
            .join('\n');

        const prompt = `다음 웹 리뷰 요약을 분석하고 감성 분석 결과를 JSON으로 제공해주세요.

리뷰:
${reviewSummaries}

JSON 형식: {"overallScore":0,"commonPraises":[],"commonComplaints":[],"reliability":"HIGH"}
overallScore는 0-100, reliability는 "HIGH", "MEDIUM", "LOW" 중 하나로 답변해주세요.`;

        const response = await this.llm.run(prompt, {
            system: skill.systemPromptTemplate,
            model: skill.model,
            temperature: skill.temperature,
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
        try {
            return JSON.parse(text) as T;
        } catch {
            const match = text.match(/\{[\s\S]*\}/);
            if (!match) throw new Error(`Failed to extract JSON from LLM response: ${text.substring(0, 200)}`);
            return JSON.parse(match[0]) as T;
        }
    }
}
