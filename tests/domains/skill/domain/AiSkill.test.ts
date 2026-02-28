import { injectContextToPrompt } from '../../../../src/domains/skill/domain/AiSkill';

describe('Skill Domain Logic', () => {
    it('should inject dynamic context into skill prompt', () => {
        const prompt = 'Act as a {persona} and analyze {productName}.';
        const result = injectContextToPrompt(prompt, { persona: 'Reviewer', productName: 'MacBook' });
        expect(result).toBe('Act as a Reviewer and analyze MacBook.');
    });
});
