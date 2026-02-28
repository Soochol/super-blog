import { generateObject } from 'ai';
import { google } from '@ai-sdk/google';
import { z } from 'zod';
import { SpecExtractor, ValidationResult } from '../../domains/product/domain/ports/SpecExtractor';
import { ProductSpecs, WebReviewReference } from '../../domains/product/domain/ProductSpecs';
import { RawProductData } from '../../domains/product/domain/ports/Crawler';

const DEFAULT_MODEL = google('gemini-1.5-pro');
const MAX_SPEC_HTML_CHARS = 50_000;
const MAX_REVIEW_HTML_CHARS = 10_000;

export class AiSpecExtractor implements SpecExtractor {
    async extractSpecs(raw: RawProductData): Promise<ProductSpecs> {
        const { object } = await generateObject({
            model: DEFAULT_MODEL,
            schema: z.object({
                maker: z.string(),
                model: z.string(),
                cpu: z.string(),
                ram: z.number(),
                storage: z.string(),
                gpu: z.string(),
                display_size: z.number(),
                weight: z.number(),
                os: z.string(),
                price: z.number(),
            }),
            prompt: `Extract the exact product specifications from the following HTML document. \n\nHTML: ${raw.html.substring(0, MAX_SPEC_HTML_CHARS)}`,
        });

        return object;
    }

    async validateSpecs(specs: ProductSpecs, raw: RawProductData): Promise<ValidationResult> {
        const { object } = await generateObject({
            model: DEFAULT_MODEL,
            schema: z.object({
                isValid: z.boolean(),
                errors: z.array(z.string()),
            }),
            prompt: `Validate that the following extracted specs are accurate based on the source HTML.\n\nSpecs: ${JSON.stringify(specs)}\n\nHTML: ${raw.html.substring(0, MAX_SPEC_HTML_CHARS)}`,
        });

        return object;
    }

    async extractWebReviews(rawReviews: RawProductData[]): Promise<WebReviewReference[]> {
        if (rawReviews.length === 0) return [];

        const { object } = await generateObject({
            model: DEFAULT_MODEL,
            schema: z.object({
                reviews: z.array(z.object({
                    source: z.string(),
                    url: z.string(),
                    summaryText: z.string(),
                    sentiment: z.enum(['POSITIVE', 'NEUTRAL', 'NEGATIVE']),
                })),
            }),
            prompt: `Extract key review references from the following web pages.\n\n${rawReviews.map((r, i) => `Page ${i + 1} (${r.url}):\n${r.html.substring(0, MAX_REVIEW_HTML_CHARS)}`).join('\n\n')}`,
        });

        return object.reviews;
    }
}
