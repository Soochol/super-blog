import { AiSpecExtractor } from '@/infrastructure/ai/AiSpecExtractor';
import { AiContentGenerator } from '@/infrastructure/ai/AiContentGenerator';

describe('Vercel AI SDK Adapters', () => {
    it('should be instantiable without error', () => {
        const extractor = new AiSpecExtractor();
        const generator = new AiContentGenerator();
        expect(extractor).toBeDefined();
        expect(generator).toBeDefined();
    });

    // Real AI calls are mocked or simply bypassed for MVP testing purposes without an API key
    // The actual implementation relies on Vercel AI SDK functionality
});
