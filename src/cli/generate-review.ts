import 'dotenv/config';
import { prisma } from '../infrastructure/db/PrismaClient';
import { ClaudeCliAdapter } from '../infrastructure/ai/ClaudeCliAdapter';
import { PrismaSkillRepository } from '../infrastructure/db/PrismaSkillRepository';
import { ClaudeContentGenerator } from '../infrastructure/ai/ClaudeContentGenerator';
import { CritiqueWritingService } from '../domains/content/application/CritiqueWritingService';
import { ProductReview } from '../domains/content/domain/Review';
import { ProductSpecs, WebReviewReference } from '../domains/product/domain/ProductSpecs';

export async function generateAndSaveReview(slug: string): Promise<ProductReview> {
    // Load product from DB by slug
    const product = await prisma.product.findUnique({ where: { slug } });
    if (!product) throw new Error(`Product "${slug}" not found`);

    // Map DB fields to ProductSpecs
    const specs: ProductSpecs = {
        maker: product.maker,
        model: product.model,
        cpu: product.cpu,
        ram: parseFloat(product.ram),
        storage: product.storage,
        gpu: product.gpu,
        display_size: parseFloat(product.displaySize),
        weight: product.weight,
        os: product.os,
        price: product.price,
    };

    // Load web reviews
    const webReviews = await prisma.webReviewReference.findMany({
        where: { productId: product.id },
    });
    const references: WebReviewReference[] = webReviews.map((r) => ({
        source: r.source,
        url: r.url,
        summaryText: r.summaryText,
        sentiment: r.sentiment as 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE',
    }));

    // Generate review using CritiqueWritingService pipeline
    const llm = new ClaudeCliAdapter();
    const skillRepo = new PrismaSkillRepository();
    const generator = new ClaudeContentGenerator(llm, skillRepo);
    const service = new CritiqueWritingService(generator);
    const review = await service.writeComprehensiveReview(specs, references);

    // Save to DB
    await prisma.productReview.create({
        data: {
            productId: product.id,
            summary: review.summary,
            pros: review.pros,
            cons: review.cons,
            recommendedFor: review.recommendedFor,
            notRecommendedFor: review.notRecommendedFor,
            specHighlights: review.specHighlights,
            strategy: review.strategy ?? undefined,
            sentimentAnalysis: review.sentimentAnalysis ?? undefined,
        },
    });

    return review;
}

async function main() {
    const slug = process.argv[2];
    if (!slug) {
        console.error('Usage: npm run pipeline:review -- <product-slug>');
        process.exit(1);
    }

    console.log(`Generating review for: ${slug}`);
    const review = await generateAndSaveReview(slug);

    console.log('\n--- Generated Review ---');
    console.log(`Summary: ${review.summary}`);
    console.log(`\nPros:`);
    review.pros.forEach((p) => console.log(`  + ${p}`));
    console.log(`\nCons:`);
    review.cons.forEach((c) => console.log(`  - ${c}`));
    console.log(`\nRecommended for: ${review.recommendedFor}`);
    console.log(`Not recommended for: ${review.notRecommendedFor}`);
    console.log(`\nSpec highlights:`);
    review.specHighlights.forEach((h) => console.log(`  * ${h}`));
    console.log('\nDone!');
}

const isDirectRun = process.argv[1]?.includes('generate-review');
if (isDirectRun) {
    main().catch((e) => {
        console.error(e);
        process.exit(1);
    });
}
