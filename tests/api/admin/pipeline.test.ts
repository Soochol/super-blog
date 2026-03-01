import { createPipelineJob } from '../../../src/app/api/admin/pipeline/service';

describe('pipeline service', () => {
  it('returns conflict=true if a job is already PENDING or RUNNING', async () => {
    const mockDb = {
      pipelineJob: {
        findFirst: jest.fn().mockResolvedValue({ id: 'existing', status: 'RUNNING' }),
        create: jest.fn(),
      },
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await createPipelineJob(mockDb as any, { category: '노트북', makers: ['Samsung'] });
    expect(result.conflict).toBe(true);
    expect(mockDb.pipelineJob.create).not.toHaveBeenCalled();
  });

  it('creates a MANUAL job if none is running', async () => {
    const mockDb = {
      pipelineJob: {
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({ id: 'new-job', status: 'PENDING' }),
      },
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await createPipelineJob(mockDb as any, { category: '노트북', makers: ['Samsung'] });
    expect(result.conflict).toBe(false);
    expect(mockDb.pipelineJob.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ triggeredBy: 'MANUAL' }) })
    );
  });
});
