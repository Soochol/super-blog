import { generateText } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { ContentGenerator, ContentGenerationParams } from '../../domains/content/domain/ports/ContentGenerator';
import { ProductReview } from '../../domains/content/domain/Article';

export class AiContentGenerator implements ContentGenerator {
    async generateReviewArticle(params: ContentGenerationParams): Promise<ProductReview> {
        const prompt = `
      You are an expert tech reviewer with a neo-brutalism, direct, and slightly cynical tone.
      Review this product based on the specs and community opinions:
      Product: ${params.product.maker} ${params.product.model}
      Specs: ${JSON.stringify(params.specs)}
      Community Opinions: ${params.opinions.map(o => o.summaryText).join('\n')}
      Persona: ${params.skillConfig.persona}
    `;

        // In MVP, we use claude-3-5-sonnet for high-quality creative writing
        const { text } = await generateText({
            model: anthropic('claude-3-5-sonnet-20240620'),
            prompt,
            temperature: params.skillConfig.temperature,
        });

        return {
            productId: params.product.id,
            summary: text.substring(0, 200), // Simple MVP mapping
            pros: ['Great performance'],     // Mock extracted data
            cons: ['Expensive'],
            recommendedFor: 'Professionals',
            notRecommendedFor: 'Casual users',
            specHighlights: ['M4 Max Chip'],
        };
    }
}
