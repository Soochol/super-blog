import { generateObject } from 'ai';
import { google } from '@ai-sdk/google';
import { z } from 'zod';
import { SpecExtractor } from '../../domains/product/domain/ports/SpecExtractor';
import { ProductSpecs } from '../../domains/product/domain/ProductSpecs';

export class AiSpecExtractor implements SpecExtractor {
    async extractSpecsFromHtml(html: string): Promise<ProductSpecs> {
        // In MVP, we use gemini-1.5-pro for extracting JSON from large HTML payload
        const { object } = await generateObject({
            model: google('gemini-1.5-pro'),
            schema: z.object({
                maker: z.string(),
                model: z.string(),
                cpu: z.string(),
                ram: z.number(),
                storage: z.string(),
                gpu: z.string(),
                displaySize: z.number(),
                weight: z.number(),
                os: z.string(),
                price: z.number(),
            }),
            prompt: `Extract the exact product specifications from the following HTML document. \n\nHTML: ${html.substring(0, 50000)}`,
        });

        return object;
    }
}
