-- CreateEnum
CREATE TYPE "Sentiment" AS ENUM ('POSITIVE', 'NEUTRAL', 'NEGATIVE');

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "maker" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "cpu" TEXT NOT NULL,
    "ram" TEXT NOT NULL,
    "storage" TEXT NOT NULL,
    "gpu" TEXT NOT NULL,
    "displaySize" TEXT NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,
    "os" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "imageUrl" TEXT,
    "couponUrl" TEXT,
    "categoryId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CrawlHistory" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "htmlHash" TEXT NOT NULL,
    "lastCrawledAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CrawlHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebReviewReference" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "summaryText" TEXT NOT NULL,
    "sentiment" "Sentiment" NOT NULL,

    CONSTRAINT "WebReviewReference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductReview" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "pros" TEXT[],
    "cons" TEXT[],
    "rating" DOUBLE PRECISION,
    "recommendedFor" TEXT NOT NULL,
    "notRecommendedFor" TEXT NOT NULL,
    "specHighlights" TEXT[],
    "strategy" JSONB,
    "sentimentAnalysis" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "maxWeight" DOUBLE PRECISION,
    "minPrice" INTEGER,
    "maxPrice" INTEGER,
    "requiredGpuFamily" TEXT[],

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CategoryAssignment" (
    "productId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,

    CONSTRAINT "CategoryAssignment_pkey" PRIMARY KEY ("productId","categoryId")
);

-- CreateTable
CREATE TABLE "EventLog" (
    "id" TEXT NOT NULL,
    "eventName" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiSkill" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "systemPromptTemplate" TEXT NOT NULL,
    "userPromptTemplate" TEXT NOT NULL,
    "temperature" DOUBLE PRECISION NOT NULL,
    "model" TEXT NOT NULL,
    "version" TEXT NOT NULL,

    CONSTRAINT "AiSkill_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Product_slug_key" ON "Product"("slug");

-- CreateIndex
CREATE INDEX "Product_categoryId_idx" ON "Product"("categoryId");

-- CreateIndex
CREATE INDEX "CrawlHistory_productId_idx" ON "CrawlHistory"("productId");

-- CreateIndex
CREATE INDEX "WebReviewReference_productId_idx" ON "WebReviewReference"("productId");

-- CreateIndex
CREATE INDEX "ProductReview_productId_idx" ON "ProductReview"("productId");

-- CreateIndex
CREATE INDEX "EventLog_eventName_idx" ON "EventLog"("eventName");

-- CreateIndex
CREATE UNIQUE INDEX "AiSkill_name_key" ON "AiSkill"("name");

-- AddForeignKey
ALTER TABLE "CrawlHistory" ADD CONSTRAINT "CrawlHistory_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WebReviewReference" ADD CONSTRAINT "WebReviewReference_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductReview" ADD CONSTRAINT "ProductReview_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CategoryAssignment" ADD CONSTRAINT "CategoryAssignment_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CategoryAssignment" ADD CONSTRAINT "CategoryAssignment_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
