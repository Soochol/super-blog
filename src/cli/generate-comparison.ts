import 'dotenv/config';
import { prisma } from '../infrastructure/db/PrismaClient';
import { ClaudeCliAdapter } from '../infrastructure/ai/ClaudeCliAdapter';
import { PrismaSkillRepository } from '../infrastructure/db/PrismaSkillRepository';
import { ClaudeContentGenerator } from '../infrastructure/ai/ClaudeContentGenerator';

export async function generateAndSaveComparison(slugA: string, slugB: string): Promise<string> {
    const productA = await prisma.product.findUnique({ where: { slug: slugA } });
    if (!productA) throw new Error(`Product "${slugA}" not found`);

    const productB = await prisma.product.findUnique({ where: { slug: slugB } });
    if (!productB) throw new Error(`Product "${slugB}" not found`);

    const llm = new ClaudeCliAdapter();
    const skillRepo = new PrismaSkillRepository();
    const generator = new ClaudeContentGenerator(llm, skillRepo);

    const specsA = `${productA.maker} ${productA.model} (CPU: ${productA.cpu}, RAM: ${productA.ram}GB, GPU: ${productA.gpu}, 화면: ${productA.displaySize}인치, 무게: ${productA.weight}kg, 가격: ${productA.price}원)`;
    const specsB = `${productB.maker} ${productB.model} (CPU: ${productB.cpu}, RAM: ${productB.ram}GB, GPU: ${productB.gpu}, 화면: ${productB.displaySize}인치, 무게: ${productB.weight}kg, 가격: ${productB.price}원)`;

    return generator.generateComparison(specsA, specsB);
}

async function main() {
    const slugA = process.argv[2];
    const slugB = process.argv[3];
    if (!slugA || !slugB) {
        console.error('Usage: npm run pipeline:compare -- <slug-a> <slug-b>');
        console.error('Example: npm run pipeline:compare -- apple-macbook-pro-14 samsung-galaxy-book4');
        process.exit(1);
    }

    try {
        const comparison = await generateAndSaveComparison(slugA, slugB);
        console.log('\n--- Generated Comparison ---');
        console.log(comparison);
    } catch (error) {
        console.error(`Error: ${(error as Error).message}`);
        process.exit(1);
    }
}

const isDirectRun = process.argv[1]?.includes('generate-comparison');
if (isDirectRun) {
    main().catch((e) => {
        console.error(e);
        process.exit(1);
    });
}
