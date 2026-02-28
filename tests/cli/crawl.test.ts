import { buildSlug } from '@/cli/crawl';

describe('crawl CLI utils', () => {
  test('buildSlug generates url-friendly slug from maker and model', () => {
    expect(buildSlug('Apple', '맥북 프로 16 M4 Max')).toBe('apple-맥북-프로-16-m4-max');
  });

  test('buildSlug handles spaces and special characters', () => {
    expect(buildSlug('ASUS', 'ROG Strix G16')).toBe('asus-rog-strix-g16');
  });

  test('buildSlug strips non-alphanumeric special characters', () => {
    expect(buildSlug('Samsung', 'Galaxy Book4 Pro (16")')).toBe('samsung-galaxy-book4-pro-16');
  });

  test('buildSlug handles multiple consecutive spaces', () => {
    expect(buildSlug('LG', 'gram   17  2024')).toBe('lg-gram-17-2024');
  });
});
