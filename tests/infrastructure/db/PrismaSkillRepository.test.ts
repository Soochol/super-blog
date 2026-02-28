import { PrismaSkillRepository } from '@/infrastructure/db/PrismaSkillRepository';
import { pgPool } from '@/infrastructure/db/PrismaClient';

const repo = new PrismaSkillRepository();

afterAll(async () => {
    await pgPool.end();
});

describe('PrismaSkillRepository', () => {
    test('findByName returns seeded skill', async () => {
        const skill = await repo.findByName('discover-listing-urls');
        expect(skill).not.toBeNull();
        expect(skill!.name).toBe('discover-listing-urls');
        expect(skill!.userPromptTemplate).toContain('{{category}}');
    });

    test('findByName returns null for unknown skill', async () => {
        const skill = await repo.findByName('nonexistent');
        expect(skill).toBeNull();
    });

    test('findAll returns all skills', async () => {
        const skills = await repo.findAll();
        expect(skills.length).toBeGreaterThanOrEqual(6);
    });
});
