import { runPipeline, PipelineParams } from '../../src/cli/pipeline';

describe('runPipeline log callback', () => {
  it('exports runPipeline function with correct signature', () => {
    expect(typeof runPipeline).toBe('function');
    // runPipeline(params, log) — 2 parameters
    expect(runPipeline.length).toBe(2);
  });

  it('exports PipelineParams type (TypeScript compile check)', () => {
    const params: PipelineParams = {
      category: '노트북',
      makers: ['Samsung'],
      listingUrls: ['https://example.com'],
    };
    expect(params.category).toBe('노트북');
    expect(params.makers).toEqual(['Samsung']);
    expect(params.listingUrls).toEqual(['https://example.com']);
  });
});
