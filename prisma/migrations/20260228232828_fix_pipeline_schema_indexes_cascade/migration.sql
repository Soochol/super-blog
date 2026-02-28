-- DropForeignKey
ALTER TABLE "PipelineLog" DROP CONSTRAINT "PipelineLog_jobId_fkey";

-- CreateIndex
CREATE INDEX "PipelineJob_status_createdAt_idx" ON "PipelineJob"("status", "createdAt");

-- AddForeignKey
ALTER TABLE "PipelineLog" ADD CONSTRAINT "PipelineLog_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "PipelineJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;
