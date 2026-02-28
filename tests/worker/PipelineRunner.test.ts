import { PipelineRunner } from '../../src/worker/PipelineRunner';

describe('PipelineRunner', () => {
  it('updates job status to RUNNING then DONE on success', async () => {
    const mockDb = {
      pipelineJob: {
        update: jest.fn().mockResolvedValue({}),
      },
      pipelineLog: {
        create: jest.fn().mockResolvedValue({}),
      },
    };

    const mockRun = jest.fn().mockResolvedValue(undefined);
    const runner = new PipelineRunner(mockDb as any, mockRun);

    await runner.run({
      id: 'job-1',
      category: '노트북',
      makers: ['Samsung'],
      listingUrls: ['https://example.com'],
    });

    expect(mockDb.pipelineJob.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'job-1' }, data: expect.objectContaining({ status: 'RUNNING' }) })
    );
    expect(mockDb.pipelineJob.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'job-1' }, data: expect.objectContaining({ status: 'DONE' }) })
    );
  });

  it('updates job status to FAILED on error', async () => {
    const mockDb = {
      pipelineJob: { update: jest.fn().mockResolvedValue({}) },
      pipelineLog: { create: jest.fn().mockResolvedValue({}) },
    };

    const mockRun = jest.fn().mockRejectedValue(new Error('crawl failed'));
    const runner = new PipelineRunner(mockDb as any, mockRun);

    await runner.run({ id: 'job-1', category: '노트북', makers: [], listingUrls: [] });

    expect(mockDb.pipelineJob.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: 'FAILED' }) })
    );
  });

  it('writes log lines to PipelineLog table', async () => {
    const mockDb = {
      pipelineJob: { update: jest.fn().mockResolvedValue({}) },
      pipelineLog: { create: jest.fn().mockResolvedValue({}) },
    };

    const mockRun = jest.fn().mockImplementation(async (_params: any, log: any) => {
      log('test log message');
    });

    const runner = new PipelineRunner(mockDb as any, mockRun);
    await runner.run({ id: 'job-1', category: '노트북', makers: [], listingUrls: [] });

    expect(mockDb.pipelineLog.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ jobId: 'job-1', message: 'test log message' }) })
    );
  });
});
