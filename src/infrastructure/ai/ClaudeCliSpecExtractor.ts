import { z } from 'zod';
import { SpecExtractor, ValidationResult } from '../../domains/product/domain/ports/SpecExtractor';
import { ProductSpecs, WebReviewReference } from '../../domains/product/domain/ProductSpecs';
import { RawProductData } from '../../domains/product/domain/ports/Crawler';
import { LlmRunner } from '../../shared/ai/ports/LlmRunner';

const MAX_SPEC_HTML_CHARS = 50_000;
const MAX_REVIEW_HTML_CHARS = 10_000;

const specsSchema = z.object({
    maker: z.string().default('Unknown'),
    model: z.string().default('Unknown'),
    cpu: z.string().nullable().transform(v => v ?? 'Unknown'),
    ram: z.number().nullable().transform(v => v ?? 0),
    storage: z.string().nullable().transform(v => v ?? 'Unknown'),
    gpu: z.string().nullable().transform(v => v ?? 'Unknown'),
    display_size: z.number().nullable().transform(v => v ?? 0),
    weight: z.number().nullable().transform(v => v ?? 0),
    os: z.string().nullable().transform(v => v ?? 'Unknown'),
    price: z.number().nullable().transform(v => v ?? 0),
});

const validationSchema = z.object({
    isValid: z.boolean(),
    errors: z.array(z.string()),
});

const reviewsSchema = z.object({
    reviews: z.array(z.object({
        source: z.string(),
        url: z.string(),
        summaryText: z.string(),
        sentiment: z.enum(['POSITIVE', 'NEUTRAL', 'NEGATIVE']),
    })),
});

/**
 * Parse JSON from an LLM text response.
 * Tries direct JSON.parse first, falls back to regex extraction.
 */
function parseJsonFromLlm(text: string): unknown {
    const trimmed = text.trim();
    try {
        return JSON.parse(trimmed);
    } catch {
        const match = trimmed.match(/\{[\s\S]*\}/);
        if (!match) {
            throw new Error(`Failed to extract JSON from LLM response: ${trimmed.substring(0, 200)}`);
        }
        return JSON.parse(match[0]);
    }
}

export class ClaudeCliSpecExtractor implements SpecExtractor {
    constructor(private llm: LlmRunner) {}

    private async runStructured<T>(prompt: string, system: string, schema: z.ZodType<T>): Promise<T> {
        const response = await this.llm.run(prompt, { system });
        const parsed = parseJsonFromLlm(response);
        return schema.parse(parsed);
    }

    async extractSpecs(raw: RawProductData): Promise<ProductSpecs> {
        const prompt = `Extract the exact product specifications from the following HTML document.
Return ONLY a JSON object with these fields (no markdown, no explanation):
{
  "maker": "manufacturer name",
  "model": "model name",
  "cpu": "CPU model",
  "ram": RAM in GB as number,
  "storage": "storage description",
  "gpu": "GPU model or integrated",
  "display_size": display size in inches as number,
  "weight": weight in kg as number,
  "os": "operating system",
  "price": price in KRW as number (0 if not found)
}

HTML:
${raw.html.substring(0, MAX_SPEC_HTML_CHARS)}`;

        return this.runStructured(
            prompt,
            'You are a product spec extraction assistant. Return ONLY valid JSON, no markdown fences, no explanation.',
            specsSchema,
        );
    }

    async validateSpecs(specs: ProductSpecs, raw: RawProductData): Promise<ValidationResult> {
        const prompt = `Validate that the following extracted specs are accurate based on the source HTML.
Return ONLY a JSON object: {"isValid": true/false, "errors": ["error1", ...]}

Specs: ${JSON.stringify(specs)}

HTML: ${raw.html.substring(0, MAX_SPEC_HTML_CHARS)}`;

        return this.runStructured(
            prompt,
            'You are a data validation assistant. Return ONLY valid JSON.',
            validationSchema,
        );
    }

    async extractWebReviews(rawReviews: RawProductData[]): Promise<WebReviewReference[]> {
        if (rawReviews.length === 0) return [];

        const prompt = `Extract key review references from the following web pages.
Return ONLY a JSON object: {"reviews": [{"source": "...", "url": "...", "summaryText": "...", "sentiment": "POSITIVE|NEUTRAL|NEGATIVE"}]}

${rawReviews.map((r, i) => `Page ${i + 1} (${r.url}):\n${r.html.substring(0, MAX_REVIEW_HTML_CHARS)}`).join('\n\n')}`;

        const result = await this.runStructured(
            prompt,
            'You are a review extraction assistant. Return ONLY valid JSON.',
            reviewsSchema,
        );

        return result.reviews;
    }
}
