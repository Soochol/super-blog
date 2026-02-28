import { readFileSync, readdirSync, existsSync } from 'fs';
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
  const systemMatch = body.match(/# System Prompt\s*\n([\s\S]*?)(?=\n# |\n$|$)/);
  const userMatch = body.match(/# User Prompt\s*\n([\s\S]*?)$/);

  if (!systemMatch || !userMatch) {
    throw new Error('Invalid SKILL.md: missing "# System Prompt" or "# User Prompt" section');
  }

  return {
    frontmatter,
    systemPrompt: systemMatch[1].trim(),
    userPrompt: userMatch[1].trim(),
  };
}

export class FileSkillRepository implements SkillRepository {
  private readonly skillsDir: string;

  constructor(skillsDir?: string) {
    this.skillsDir = skillsDir ?? join(__dirname, '..', '..', 'skills');
  }

  async findByName(name: string): Promise<AiSkill | null> {
    const filePath = join(this.skillsDir, name, 'SKILL.md');
    if (!existsSync(filePath)) {
      return null;
    }
    return this.loadSkillFile(filePath);
  }

  async findAll(): Promise<AiSkill[]> {
    if (!existsSync(this.skillsDir)) {
      return [];
    }
    const entries = readdirSync(this.skillsDir, { withFileTypes: true });
    const skills: AiSkill[] = [];
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const filePath = join(this.skillsDir, entry.name, 'SKILL.md');
      if (existsSync(filePath)) {
        skills.push(this.loadSkillFile(filePath));
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
