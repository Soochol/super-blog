-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('PENDING', 'RUNNING', 'DONE', 'FAILED');

-- CreateEnum
CREATE TYPE "TriggerSource" AS ENUM ('MANUAL', 'SCHEDULER');

-- CreateTable
CREATE TABLE "PipelineJob" (
    "id" TEXT NOT NULL,
    "status" "JobStatus" NOT NULL DEFAULT 'PENDING',
    "triggeredBy" "TriggerSource" NOT NULL,
    "category" TEXT NOT NULL,
    "makers" TEXT[],
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PipelineJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PipelineLog" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PipelineLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PipelineSchedule" (
    "id" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "frequency" TEXT NOT NULL DEFAULT 'daily',
    "hour" INTEGER NOT NULL DEFAULT 3,
    "minute" INTEGER NOT NULL DEFAULT 0,
    "dayOfWeek" INTEGER,
    "category" TEXT NOT NULL DEFAULT '노트북',
    "makers" TEXT[],
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PipelineSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PipelineLog_jobId_idx" ON "PipelineLog"("jobId");

-- AddForeignKey
ALTER TABLE "PipelineLog" ADD CONSTRAINT "PipelineLog_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "PipelineJob"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
