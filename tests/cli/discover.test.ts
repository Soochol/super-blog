import { parseDiscoveredUrls } from '@/cli/discover';

describe('discover CLI utils', () => {
  test('parseDiscoveredUrls extracts URLs from LLM response', () => {
    const llmResponse = `
1. Apple 노트북: https://www.apple.com/kr/shop/buy-mac/macbook-pro
2. Samsung 노트북: https://www.samsung.com/sec/pc/notebook/
3. ASUS 노트북: https://www.asus.com/kr/laptops/
    `;
    const urls = parseDiscoveredUrls(llmResponse);
    expect(urls.length).toBe(3);
    expect(urls[0]).toContain('apple.com');
  });

  test('parseDiscoveredUrls handles empty response', () => {
    expect(parseDiscoveredUrls('')).toEqual([]);
  });

  test('parseDiscoveredUrls strips trailing punctuation from URLs', () => {
    const llmResponse = `
- https://www.lg.com/kr/laptops/gram/,
- https://www.dell.com/kr/notebooks.
- https://www.hp.com/kr/laptops;
    `;
    const urls = parseDiscoveredUrls(llmResponse);
    expect(urls.length).toBe(3);
    expect(urls[0]).toBe('https://www.lg.com/kr/laptops/gram/');
    expect(urls[1]).toBe('https://www.dell.com/kr/notebooks');
    expect(urls[2]).toBe('https://www.hp.com/kr/laptops');
  });

  test('parseDiscoveredUrls deduplicates identical URLs', () => {
    const llmResponse = `
1. https://www.apple.com/kr/macbook-pro
2. https://www.apple.com/kr/macbook-pro
3. https://www.samsung.com/sec/notebook/
    `;
    const urls = parseDiscoveredUrls(llmResponse);
    expect(urls.length).toBe(2);
  });
});
