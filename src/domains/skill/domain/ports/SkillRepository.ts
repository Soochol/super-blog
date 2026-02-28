import { AiSkill } from '../AiSkill';

export interface SkillRepository {
    findByName(name: string): Promise<AiSkill | null>;
    findAll(): Promise<AiSkill[]>;
}
