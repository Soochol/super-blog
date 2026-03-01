import 'dotenv/config';
import { ClaudeCliAdapter } from '../infrastructure/ai/ClaudeCliAdapter';
import { FileSkillRepository } from '../infrastructure/skill/FileSkillRepository';
import { PlaywrightCrawler } from '../infrastructure/crawler/PlaywrightCrawler';
import { injectContextToPrompt } from '../domains/skill/domain/AiSkill';

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

export async function discoverListingUrls(
  category: string,
  makers: string[],
  log: (msg: string) => void
): Promise<string[]> {
  const llm = new ClaudeCliAdapter();
  const skillRepo = new FileSkillRepository();
  const crawler = new PlaywrightCrawler();

  try {
    const discoverSkill = await skillRepo.findByName('discover-listing-urls');
    if (!discoverSkill) throw new Error('Skill "discover-listing-urls" not found in src/skills/');

    log('Discovering listing URLs...');
    const prompt = injectContextToPrompt(discoverSkill.userPromptTemplate, {
      category,
      makers: makers.join(', '),
    });
    const llmResponse = await llm.run(prompt, {
      system: discoverSkill.systemPromptTemplate,
      model: discoverSkill.model,
      temperature: discoverSkill.temperature,
    });

    const candidateUrls = parseDiscoveredUrls(llmResponse);
    log(`Found ${candidateUrls.length} candidate URLs`);

    const validateSkill = await skillRepo.findByName('validate-listing-page');
    if (!validateSkill) throw new Error('Skill "validate-listing-page" not found in src/skills/');

    const verified: string[] = [];
    for (const url of candidateUrls) {
      try {
        log(`  Verifying: ${url}`);
        const { html } = await crawler.crawlExistingProduct(url);
        const validatePrompt = injectContextToPrompt(validateSkill.userPromptTemplate, {
          category,
          url,
          html: html.substring(0, 5000), // limit to avoid LLM context window overflow
        });
        const isValid = await llm.run(validatePrompt, {
          system: validateSkill.systemPromptTemplate,
          model: validateSkill.model,
          temperature: validateSkill.temperature,
        });
        if (isValid.toUpperCase().includes('YES')) {
          verified.push(url);
          log(`    Verified`);
        } else {
          log(`    Not a listing page`);
        }
      } catch (error) {
        log(`    Failed: ${(error as Error).message}`);
      }
    }

    log(`Discover complete: ${verified.length} verified URLs`);
    return verified;
  } finally {
    await crawler.close();
  }
}

async function main() {
  const { writeFile } = await import('fs/promises');
  const urls = await discoverListingUrls(
    '노트북',
    ['Apple', 'Samsung', 'LG', 'ASUS', 'Lenovo', 'HP', 'Dell'],
    console.log
  );
  console.log(`\nVerified URLs (${urls.length}):`);
  urls.forEach((u) => console.log(`  ${u}`));
  await writeFile('discovered-urls.json', JSON.stringify(urls, null, 2));
  console.log('\nSaved to discovered-urls.json');
}

const isDirectRun = process.argv[1]?.includes('discover');
if (isDirectRun) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
