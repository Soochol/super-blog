import 'dotenv/config';
import { createHash } from 'crypto';
import { PlaywrightCrawler } from '../infrastructure/crawler/PlaywrightCrawler';
import { PrismaProductRepository } from '../infrastructure/db/PrismaProductRepository';
import { ClaudeCliAdapter } from '../infrastructure/ai/ClaudeCliAdapter';
import { ClaudeCliSpecExtractor } from '../infrastructure/ai/ClaudeCliSpecExtractor';
import { FileSkillRepository } from '../infrastructure/skill/FileSkillRepository';
import { injectContextToPrompt } from '../domains/skill/domain/AiSkill';
import { buildSlug, downloadAndProcessImage } from './crawl';
import { parseDiscoveredUrls } from './discover';

export type PipelineParams = {
  category: string;
  makers: string[];
  listingUrls: string[];
};

export async function runPipeline(
  params: PipelineParams,
  log: (msg: string) => void
): Promise<void> {
  const { category, listingUrls } = params;

  const crawler = new PlaywrightCrawler();
  const llm = new ClaudeCliAdapter();
  const extractor = new ClaudeCliSpecExtractor(llm);
  const repo = new PrismaProductRepository();
  const skillRepo = new FileSkillRepository();

  try {
    const linksSkill = await skillRepo.findByName('extract-product-links');
    if (!linksSkill) throw new Error('Skill "extract-product-links" not found');

    const imageSkill = await skillRepo.findByName('extract-product-image');

    log(`Pipeline starting: ${listingUrls.length} listing pages`);

    for (const listingUrl of listingUrls) {
      try {
        log(`\n--- Processing listing: ${listingUrl} ---`);
        const listingData = await crawler.crawlExistingProduct(listingUrl);

        const linksPrompt = injectContextToPrompt(linksSkill.userPromptTemplate, {
          category,
          maxLinks: '10',
          baseUrl: listingUrl,
          html: listingData.html.substring(0, 15000),
        });
        const linksResponse = await llm.run(linksPrompt, {
          system: linksSkill.systemPromptTemplate,
          model: linksSkill.model,
          temperature: linksSkill.temperature,
        });

        const productUrls = parseDiscoveredUrls(linksResponse);
        log(`Found ${productUrls.length} product pages`);

        for (const productUrl of productUrls) {
          try {
            log(`  Crawling: ${productUrl}`);
            const rawData = await crawler.crawlExistingProduct(productUrl);
            const specs = await extractor.extractSpecs(rawData);
            const slug = buildSlug(specs.maker, specs.model);

            const productId = await repo.saveProduct(slug, specs, 'laptop');
            log(`  Saved: ${specs.maker} ${specs.model} (${slug})`);

            if (imageSkill) {
              const imagePrompt = injectContextToPrompt(imageSkill.userPromptTemplate, {
                html: rawData.html.substring(0, 10000),
              });
              const imageResponse = await llm.run(imagePrompt, {
                system: imageSkill.systemPromptTemplate,
                model: imageSkill.model,
                temperature: imageSkill.temperature,
              });
              const imageUrls = imageResponse.match(/https?:\/\/[^\s"'<>]+\.(jpg|jpeg|png|webp)/i);
              if (imageUrls?.[0]) {
                const localPath = await downloadAndProcessImage(imageUrls[0], slug);
                if (localPath) {
                  await repo.updateImageUrl(productId, localPath);
                  log(`  Image: ${localPath}`);
                }
              }
            }

            await repo.saveCrawlHistory(productId, {
              url: productUrl,
              htmlHash: createHash('sha256').update(rawData.html).digest('hex').substring(0, 64),
              lastCrawledAt: new Date(),
            });

          } catch (error) {
            log(`  Error processing ${productUrl}: ${(error as Error).message}`);
          }
        }
      } catch (error) {
        log(`Error processing listing ${listingUrl}: ${(error as Error).message}`);
      }
    }

    log('\nPipeline complete!');
  } finally {
    await crawler.close();
  }
}

async function main() {
  const { readFile } = await import('fs/promises');
  let listingUrls: string[];
  try {
    const data = await readFile('discovered-urls.json', 'utf-8');
    listingUrls = JSON.parse(data);
  } catch {
    console.error('discovered-urls.json not found. Run "npm run pipeline:discover" first.');
    process.exit(1);
  }

  await runPipeline(
    { category: '노트북', makers: ['Apple', 'Samsung', 'LG', 'ASUS', 'Lenovo', 'HP', 'Dell'], listingUrls },
    console.log
  );
}

const isDirectRun = process.argv[1]?.includes('pipeline');
if (isDirectRun) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
