import { SkillRepository } from '../../domains/skill/domain/ports/SkillRepository';
import { AiSkill } from '../../domains/skill/domain/AiSkill';
import { prisma } from './PrismaClient';

export class PrismaSkillRepository implements SkillRepository {
    async findByName(name: string): Promise<AiSkill | null> {
        return prisma.aiSkill.findUnique({ where: { name } });
    }

    async findAll(): Promise<AiSkill[]> {
        return prisma.aiSkill.findMany();
    }
}
