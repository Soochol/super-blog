import { FileSkillRepository } from '@/infrastructure/skill/FileSkillRepository';
import { join } from 'path';

const fixturesDir = join(__dirname, 'fixtures');

describe('FileSkillRepository', () => {
  const repo = new FileSkillRepository(fixturesDir);

  describe('findByName', () => {
    it('returns skill from SKILL.md file', async () => {
      const skill = await repo.findByName('test-skill');

      expect(skill).not.toBeNull();
      expect(skill!.id).toBe('file-skill-test-skill');
      expect(skill!.name).toBe('test-skill');
      expect(skill!.systemPromptTemplate).toBe('You are a test assistant.');
      expect(skill!.userPromptTemplate).toBe(
        'Please process {{input}} and return the result.'
      );
      expect(skill!.temperature).toBe(0.5);
      expect(skill!.model).toBe('claude');
      expect(skill!.version).toBe('1.0.0');
    });

    it('returns null for nonexistent skill', async () => {
      const skill = await repo.findByName('nonexistent');
      expect(skill).toBeNull();
    });

    it('appends output format to user prompt when present', async () => {
      const skill = await repo.findByName('test-skill-with-output');

      expect(skill).not.toBeNull();
      expect(skill!.userPromptTemplate).toContain('Analyze {{input}}.');
      expect(skill!.userPromptTemplate).toContain('## Output Format');
      expect(skill!.userPromptTemplate).toContain('JSON 형식으로 출력');
    });

    it('does not add output format section when absent', async () => {
      const skill = await repo.findByName('test-skill');

      expect(skill!.userPromptTemplate).not.toContain('Output Format');
    });
  });

  describe('findAll', () => {
    it('returns all skills from directory', async () => {
      const skills = await repo.findAll();
      expect(skills).toHaveLength(2);
    });

    it('returns empty array for nonexistent directory', async () => {
      const emptyRepo = new FileSkillRepository('/nonexistent/path');
      const skills = await emptyRepo.findAll();
      expect(skills).toEqual([]);
    });
  });
});

describe('FileSkillRepository (production skills)', () => {
  const repo = new FileSkillRepository(join(__dirname, '..', '..', '..', 'src', 'skills'));

  const expectedSkills = [
    'discover-listing-urls',
    'validate-listing-page',
    'extract-product-links',
    'extract-product-image',
    'generate-review',
    'generate-comparison',
    'analyze-sentiment',
    'generate-strategy',
  ];

  it('loads all 8 production skills', async () => {
    const skills = await repo.findAll();
    expect(skills).toHaveLength(8);
  });

  it.each(expectedSkills)('loads %s with valid fields', async (name) => {
    const skill = await repo.findByName(name);

    expect(skill).not.toBeNull();
    expect(skill!.name).toBe(name);
    expect(skill!.systemPromptTemplate.length).toBeGreaterThan(0);
    expect(skill!.userPromptTemplate.length).toBeGreaterThan(0);
    expect(skill!.userPromptTemplate).toContain('## Output Format');
    expect(skill!.temperature).toBeGreaterThanOrEqual(0);
    expect(skill!.temperature).toBeLessThanOrEqual(1);
    expect(skill!.model).toBe('claude');
    expect(skill!.version).toBe('1.0.0');
  });
});
