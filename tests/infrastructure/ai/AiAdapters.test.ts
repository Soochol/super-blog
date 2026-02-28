import { AiSpecExtractor } from '@/infrastructure/ai/AiSpecExtractor';

describe('Vercel AI SDK Adapters', () => {
    it('should be instantiable without error', () => {
        const extractor = new AiSpecExtractor();
        expect(extractor).toBeDefined();
    });
});
