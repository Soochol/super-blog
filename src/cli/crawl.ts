import 'dotenv/config';
import { PlaywrightCrawler } from '../infrastructure/crawler/PlaywrightCrawler';
import { ClaudeCliSpecExtractor } from '../infrastructure/ai/ClaudeCliSpecExtractor';
import { PrismaProductRepository } from '../infrastructure/db/PrismaProductRepository';
import { ClaudeCliAdapter } from '../infrastructure/ai/ClaudeCliAdapter';
import { FileSkillRepository } from '../infrastructure/skill/FileSkillRepository';
import { injectContextToPrompt } from '../domains/skill/domain/AiSkill';
import { createHash } from 'crypto';
import sharp from 'sharp';
import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';

export function buildSlug(maker: string, model: string): string {
  return `${maker}-${model}`
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9가-힣\-]/g, '');
}

export async function downloadAndProcessImage(
  imageUrl: string,
  slug: string
): Promise<string | null> {
  try {
    const response = await fetch(imageUrl);
    if (!response.ok) return null;

    const buffer = Buffer.from(await response.arrayBuffer());
    const outputDir = join(process.cwd(), 'public', 'images', 'products');
    await mkdir(outputDir, { recursive: true });

    const outputPath = join(outputDir, `${slug}.webp`);
    await sharp(buffer)
      .resize(600, 400, { fit: 'contain', background: { r: 253, g: 251, b: 247, alpha: 1 } })
      .webp({ quality: 80 })
      .toFile(outputPath);

    return `/images/products/${slug}.webp`;
  } catch {
    return null;
  }
}

async function main() {
  const url = process.argv[2];
  const categoryId = process.argv[3] || 'laptop';
  if (!url) {
    console.error('Usage: npm run pipeline:crawl -- <product-url> [categoryId]');
    process.exit(1);
  }

  const crawler = new PlaywrightCrawler();
  const llm = new ClaudeCliAdapter();
  const extractor = new ClaudeCliSpecExtractor(llm);
  const repo = new PrismaProductRepository();
  const skillRepo = new FileSkillRepository();

  try {
    console.log(`Crawling: ${url}`);

    // Crawl once and reuse the raw data for both spec extraction and image/hash
    const rawData = await crawler.crawlExistingProduct(url);
    const [specs, references] = await Promise.all([
      extractor.extractSpecs(rawData),
      extractor.extractWebReviews([]),
    ]);

    const slug = buildSlug(specs.maker, specs.model);
    console.log(`Extracted: ${specs.maker} ${specs.model} (slug: ${slug})`);

    // Save product to DB first so we have a productId
    const productId = await repo.saveProduct(slug, specs, categoryId);
    console.log(`Saved product: ${productId}`);

    // Extract product image using Skill (not hardcoded prompt!)
    const imageSkill = await skillRepo.findByName('extract-product-image');
    if (imageSkill) {
      const imagePrompt = injectContextToPrompt(imageSkill.userPromptTemplate, {
        html: rawData.html.substring(0, 10000),
      });
      const imageUrlResponse = await llm.run(imagePrompt, {
        system: imageSkill.systemPromptTemplate,
        model: imageSkill.model,
        temperature: imageSkill.temperature,
      });
      const imageUrls = imageUrlResponse.match(/https?:\/\/[^\s"'<>]+\.(jpg|jpeg|png|webp)/i);

      if (imageUrls?.[0]) {
        console.log(`Downloading image: ${imageUrls[0]}`);
        const localImagePath = await downloadAndProcessImage(imageUrls[0], slug);
        if (localImagePath) {
          await repo.updateImageUrl(productId, localImagePath);
          console.log(`Image saved: ${localImagePath}`);
        }
      }
    } else {
      console.warn('Skill "extract-product-image" not found. Skipping image extraction.');
    }

    // Save crawl history with content hash for change detection
    await repo.saveCrawlHistory(productId, {
      url,
      htmlHash: createHash('sha256').update(rawData.html).digest('hex').substring(0, 64),
      lastCrawledAt: new Date(),
    });

    // Save web reviews if any
    if (references.length > 0) {
      await repo.saveWebReviews(productId, references);
      console.log(`Saved ${references.length} web reviews`);
    }

    console.log('Done!');
  } finally {
    await crawler.close();
  }
}

const isDirectRun = process.argv[1]?.includes('crawl');
if (isDirectRun) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
