import 'dotenv/config';
import { readFile } from 'fs/promises';
import { PlaywrightCrawler } from '../infrastructure/crawler/PlaywrightCrawler';
import { AiSpecExtractor } from '../infrastructure/ai/AiSpecExtractor';
import { PrismaProductRepository } from '../infrastructure/db/PrismaProductRepository';
import { ProductGatheringService } from '../domains/product/application/ProductGatheringService';
import { ClaudeCliAdapter } from '../infrastructure/ai/ClaudeCliAdapter';
import { PrismaSkillRepository } from '../infrastructure/db/PrismaSkillRepository';
import { injectContextToPrompt } from '../domains/skill/domain/AiSkill';
import { buildSlug, downloadAndProcessImage } from './crawl';
import { parseDiscoveredUrls } from './discover';

async function main() {
  // 1. Read discovered URLs (produced by discover.ts)
  let listingUrls: string[];
  try {
    const data = await readFile('discovered-urls.json', 'utf-8');
    listingUrls = JSON.parse(data);
  } catch {
    console.error('discovered-urls.json not found. Run "npm run pipeline:discover" first.');
    process.exit(1);
  }

  const crawler = new PlaywrightCrawler();
  const extractor = new AiSpecExtractor();
  const repo = new PrismaProductRepository();
  const llm = new ClaudeCliAdapter();
  const skillRepo = new PrismaSkillRepository();
  const service = new ProductGatheringService(crawler, extractor);

  // 2. Load extract-product-links skill from DB
  const linksSkill = await skillRepo.findByName('extract-product-links');
  if (!linksSkill) {
    throw new Error('Skill "extract-product-links" not found. Run db:seed first.');
  }

  // 3. Load extract-product-image skill from DB
  const imageSkill = await skillRepo.findByName('extract-product-image');

  console.log(`Pipeline starting: ${listingUrls.length} listing pages`);

  for (const listingUrl of listingUrls) {
    try {
      console.log(`\n--- Processing listing: ${listingUrl} ---`);

      // Crawl listing page
      const listingData = await crawler.crawlExistingProduct(listingUrl);

      // Extract product links using Skill (not hardcoded prompt)
      const linksPrompt = injectContextToPrompt(linksSkill.userPromptTemplate, {
        category: '노트북',
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
      console.log(`Found ${productUrls.length} product pages`);

      // 4. Crawl each product page and extract specs + image
      for (const productUrl of productUrls) {
        try {
          console.log(`  Crawling: ${productUrl}`);

          // Use ProductGatheringService to crawl and extract specs
          const { specs, references } = await service.gatherProductAndReviews(productUrl, '');
          const slug = buildSlug(specs.maker, specs.model);

          // Save product to DB
          const productId = await repo.saveProduct(slug, specs);
          console.log(`  Saved: ${specs.maker} ${specs.model} (${slug})`);

          // Extract and save image using Skill
          if (imageSkill) {
            const rawData = await crawler.crawlExistingProduct(productUrl);
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
                console.log(`  Image: ${localPath}`);
              }
            }
          }

          // Save crawl history
          await repo.saveCrawlHistory(productId, {
            url: productUrl,
            htmlHash: Buffer.from(productUrl).toString('base64').substring(0, 32),
            lastCrawledAt: new Date(),
          });

          // Save web reviews if any
          if (references.length > 0) {
            await repo.saveWebReviews(productId, references);
            console.log(`  Reviews: ${references.length}`);
          }
        } catch (error) {
          console.error(`  Error processing ${productUrl}: ${(error as Error).message}`);
        }
      }
    } catch (error) {
      console.error(`Error processing listing ${listingUrl}:`, error);
    }
  }

  await crawler.close();
  console.log('\nPipeline complete!');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
