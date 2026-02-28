import 'dotenv/config';
import { ClaudeCliAdapter } from '../infrastructure/ai/ClaudeCliAdapter';
import { PrismaSkillRepository } from '../infrastructure/db/PrismaSkillRepository';
import { PlaywrightCrawler } from '../infrastructure/crawler/PlaywrightCrawler';
import { injectContextToPrompt } from '../domains/skill/domain/AiSkill';
import { writeFile } from 'fs/promises';

/**
 * Extracts URLs from an LLM text response.
 * Strips trailing punctuation and deduplicates results.
 */
export function parseDiscoveredUrls(text: string): string[] {
  const urlRegex = /https?:\/\/[^\s,)>\]"']+/g;
  const matches = text.match(urlRegex) || [];
  const cleaned = matches.map((u) => u.replace(/[.,;]+$/, ''));
  return [...new Set(cleaned)];
}

async function main() {
  const llm = new ClaudeCliAdapter();
  const skillRepo = new PrismaSkillRepository();
  const crawler = new PlaywrightCrawler();

  // Step 1: Load skill and discover URLs
  const discoverSkill = await skillRepo.findByName('discover-listing-urls');
  if (!discoverSkill) {
    throw new Error('Skill "discover-listing-urls" not found. Run db:seed first.');
  }

  console.log('Discovering manufacturer notebook listing URLs...');
  const prompt = injectContextToPrompt(discoverSkill.userPromptTemplate, {
    category: '노트북',
    makers: 'Apple, Samsung, LG, ASUS, Lenovo, HP, Dell',
  });
  const llmResponse = await llm.run(prompt, {
    system: discoverSkill.systemPromptTemplate,
    model: discoverSkill.model,
    temperature: discoverSkill.temperature,
  });

  const candidateUrls = parseDiscoveredUrls(llmResponse);
  console.log(`Found ${candidateUrls.length} candidate URLs`);

  // Step 2: Validate each URL
  const validateSkill = await skillRepo.findByName('validate-listing-page');
  if (!validateSkill) {
    throw new Error('Skill "validate-listing-page" not found. Run db:seed first.');
  }

  const verified: string[] = [];
  for (const url of candidateUrls) {
    try {
      console.log(`  Verifying: ${url}`);
      const { html } = await crawler.crawlExistingProduct(url);

      const validatePrompt = injectContextToPrompt(validateSkill.userPromptTemplate, {
        category: '노트북',
        url,
        html: html.substring(0, 5000),
      });
      const isValid = await llm.run(validatePrompt, {
        system: validateSkill.systemPromptTemplate,
        model: validateSkill.model,
        temperature: validateSkill.temperature,
      });

      if (isValid.toUpperCase().includes('YES')) {
        verified.push(url);
        console.log(`    Verified`);
      } else {
        console.log(`    Not a notebook listing page`);
      }
    } catch (error) {
      console.log(`    Failed to access: ${(error as Error).message}`);
    }
  }

  await crawler.close();

  console.log(`\nVerified URLs (${verified.length}):`);
  verified.forEach((u) => console.log(`  ${u}`));

  await writeFile('discovered-urls.json', JSON.stringify(verified, null, 2));
  console.log('\nSaved to discovered-urls.json');
}

const isDirectRun = process.argv[1]?.includes('discover');
if (isDirectRun) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
