import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { parse as parseYaml } from 'yaml';
import { SkillRepository } from '../../domains/skill/domain/ports/SkillRepository';
import { AiSkill } from '../../domains/skill/domain/AiSkill';

interface SkillFrontmatter {
  name: string;
  description: string;
  version: string;
  model: string;
  temperature: number;
}

interface ParsedSkill {
  frontmatter: SkillFrontmatter;
  systemPrompt: string;
  userPrompt: string;
}

function parseSkillMd(content: string): ParsedSkill {
  const fmMatch = content.match(/^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/);
  if (!fmMatch) {
    throw new Error('Invalid SKILL.md: missing frontmatter');
  }

  const frontmatter = parseYaml(fmMatch[1]) as SkillFrontmatter;
  const body = fmMatch[2];

  // Extract sections by # headings
  const systemMatch = body.match(/# Role\s*\n([\s\S]*?)(?=\n# )/);
  const userMatch = body.match(/# Instructions\s*\n([\s\S]*?)(?=\n# Output Format|$)/);
  const outputMatch = body.match(/# Output Format\s*\n([\s\S]*?)$/);

  if (!systemMatch || !userMatch) {
    throw new Error('Invalid SKILL.md: missing "# Role" or "# Instructions" section');
  }

  let userPrompt = userMatch[1].trim();
  if (outputMatch) {
    userPrompt += `\n\n## Output Format\n${outputMatch[1].trim()}`;
  }

  return {
    frontmatter,
    systemPrompt: systemMatch[1].trim(),
    userPrompt,
  };
}

export class FileSkillRepository implements SkillRepository {
  private readonly skillsDir: string;

  constructor(skillsDir?: string) {
    this.skillsDir = skillsDir ?? join(__dirname, '..', '..', 'skills');
  }

  async findByName(name: string): Promise<AiSkill | null> {
    const filePath = join(this.skillsDir, name, 'SKILL.md');
    try {
      return this.loadSkillFile(filePath);
    } catch (err: unknown) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') return null;
      throw err;
    }
  }

  async findAll(): Promise<AiSkill[]> {
    let entries;
    try {
      entries = readdirSync(this.skillsDir, { withFileTypes: true });
    } catch (err: unknown) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') return [];
      throw err;
    }
    const skills: AiSkill[] = [];
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      try {
        skills.push(this.loadSkillFile(join(this.skillsDir, entry.name, 'SKILL.md')));
      } catch (err: unknown) {
        if ((err as NodeJS.ErrnoException).code !== 'ENOENT') throw err;
        // No SKILL.md in this directory — skip
      }
    }
    return skills;
  }

  private loadSkillFile(filePath: string): AiSkill {
    const content = readFileSync(filePath, 'utf-8');
    const { frontmatter, systemPrompt, userPrompt } = parseSkillMd(content);
    return {
      id: `file-skill-${frontmatter.name}`,
      name: frontmatter.name,
      systemPromptTemplate: systemPrompt,
      userPromptTemplate: userPrompt,
      temperature: frontmatter.temperature,
      model: frontmatter.model,
      version: String(frontmatter.version),
    };
  }
}
